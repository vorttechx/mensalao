import { createHash } from 'node:crypto';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';

/** Lista os arquivos de public/ (copiados como estão para o build). */
function arquivosPublicos(dir: string, raiz = dir): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    return statSync(caminho).isDirectory() ? arquivosPublicos(caminho, raiz) : [relative(raiz, caminho).split('\\').join('/')];
  });
}

/**
 * Gera o service worker (sw.js) no build com a lista de todos os arquivos do app, para o app aberto no
 * navegador (build de teste e desenvolvimento) funcionar offline (US-08). No app Android ele não é registrado
 * (main.ts): os arquivos já estão no pacote. O sw.js do site público é outro (site/sw.js, de autodestruição).
 */
function serviceWorker(): Plugin {
  return {
    name: 'mensalao-service-worker',
    apply: 'build',
    // writeBundle: o bundle já está completo (inclui as páginas HTML e sem os chunks vazios removidos pelo Vite).
    writeBundle(opcoes, bundle) {
      const arquivos = ['./', 'index.html', ...Object.keys(bundle), ...arquivosPublicos('public')]
        .filter((f) => f !== 'sw.js')
        .filter((f, i, todos) => todos.indexOf(f) === i);
      const versao = createHash('sha256').update(arquivos.join('|')).digest('hex').slice(0, 12);
      const codigo = `// Gerado no build (vite.config.ts). Cache do app para uso offline.
const CACHE = 'mensalao-${versao}';
const ARQUIVOS = ${JSON.stringify(arquivos)};

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k.startsWith('mensalao-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // Navegação: tenta a rede (versão nova); offline, a própria página do cache (ex.: privacidade.html) ou o index.html.
    ev.respondWith(
      fetch(req).catch(() =>
        caches.match(req, { ignoreSearch: true })
          .then((r) => r || caches.match('index.html', { ignoreSearch: true }))
          .then((r) => r || caches.match('./')),
      ),
    );
    return;
  }
  // Demais arquivos: cache primeiro, rede como reserva.
  ev.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req)));
});

// Toque numa notificação de lembrete (US-13): abre o app no Início.
self.addEventListener('notificationclick', (ev) => {
  ev.notification.close();
  ev.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      for (const j of janelas) if ('focus' in j) return j.focus();
      return self.clients.openWindow('./');
    }),
  );
});
`;
      writeFileSync(join(opcoes.dir ?? 'dist', 'sw.js'), codigo);
    },
  };
}

/**
 * US-29.CA8 / SUG-SEC-02: CSP por <meta> no index.html do app (WebView do Capacitor e build de teste), sem
 * 'unsafe-inline' e sem nenhum domínio de anúncio: o SDK do AdMob roda na camada nativa, fora da página.
 * Só no build (o servidor de desenvolvimento do Vite injeta script inline para o recarregamento).
 */
export const CSP_APP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

function csp(): Plugin {
  return {
    name: 'mensalao-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const metas = `<meta http-equiv="Content-Security-Policy" content="${CSP_APP}" />\n    <meta name="referrer" content="no-referrer" />\n    `;
        return html.replace('<meta name="viewport"', `${metas}<meta name="viewport"`);
      },
    },
  };
}

/** IDs de teste oficiais do Google (iguais a src/plataforma/ids-anuncios.ts). */
const IDS_TESTE = { banner: 'ca-app-pub-3940256099942544/9214589741', premiado: 'ca-app-pub-3940256099942544/5224354917' };
const EDITOR_TESTE = '3940256099942544';
const FORMATO_BLOCO = /^ca-app-pub-\d{16}\/\d{10}$/;

/**
 * Configuração de anúncios injetada no bundle (__MENSALAO_ANUNCIOS__), US-30.CA1/CA2:
 * - todo build (desenvolvimento, teste, CI, APK de debug): só os IDs de TESTE do Google;
 * - MENSALAO_ANUNCIOS=producao (scripts/android.mjs aab): os IDs REAIS vêm de MENSALAO_ADMOB_BANNER_ID e
 *   MENSALAO_ADMOB_PREMIADO_ID; o build falha se faltarem, se o formato estiver errado ou se forem de teste.
 *   Na produção não há região simulada do UMP nem aparelho de teste.
 * Os IDs reais nunca são escritos em arquivo do repositório: só existem nas variáveis da máquina de quem gera o .aab.
 */
function configAnuncios(teste: boolean) {
  if (process.env.MENSALAO_ANUNCIOS?.trim() !== 'producao') {
    return { ...IDS_TESTE, teste: true, umpDepuracao: process.env.MENSALAO_UMP_DEPURACAO?.trim() ?? '', aparelhosTeste: [] as string[] };
  }
  if (teste) throw new Error('MENSALAO_ANUNCIOS=producao não vale para o build de teste (--mode teste).');
  const banner = process.env.MENSALAO_ADMOB_BANNER_ID?.trim() ?? '';
  const premiado = process.env.MENSALAO_ADMOB_PREMIADO_ID?.trim() ?? '';
  for (const [nome, id] of [['MENSALAO_ADMOB_BANNER_ID', banner], ['MENSALAO_ADMOB_PREMIADO_ID', premiado]] as const) {
    if (!FORMATO_BLOCO.test(id)) throw new Error(`${nome} ausente ou fora do formato ca-app-pub-<16 dígitos>/<10 dígitos>.`);
    if (id.includes(EDITOR_TESTE)) throw new Error(`${nome} é um ID de teste do Google: o build de produção exige o ID real.`);
  }
  return { banner, premiado, teste: false, umpDepuracao: '', aparelhosTeste: [] as string[] };
}

// base relativa: o build funciona dentro do app (Capacitor serve dist/ a partir da raiz) e em qualquer subdiretório.
// Build de teste (US-12.CA14 a CA16): `vite build --mode teste` (VITE_MODO=teste em .env.teste) troca o
// alias "@ambiente" para o ambiente de teste, com o provedor falso, e grava em dist-teste/. O build de
// produção (dist/, que o Capacitor copia para o app Android) usa ambiente.android.ts, que não importa o
// provedor falso: ele não chega ao bundle. O dist/ não é publicado na web (US-31).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const teste = (process.env.VITE_MODO ?? env.VITE_MODO) === 'teste';
  return {
    base: './',
    define: { __MENSALAO_ANUNCIOS__: JSON.stringify(configAnuncios(teste)) },
    resolve: {
      alias: {
        '@ambiente': resolve(__dirname, `src/plataforma/ambiente.${teste ? 'teste' : 'android'}.ts`),
      },
    },
    build: {
      target: 'es2022',
      outDir: teste ? 'dist-teste' : 'dist',
      // A política (public/privacidade.html + public/pagina.css) é estática e vai como está: a mesma página
      // no pacote do app (aberta sem rede) e no site público (US-29.CA3, US-31).
      rollupOptions: { input: { main: resolve(__dirname, 'index.html') } },
    },
    plugins: [csp(), serviceWorker()],
  };
});
