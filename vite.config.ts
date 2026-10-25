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
 * Domínio próprio no GitHub Pages (D-05, E-02): com MENSALAO_DOMINIO definido (ex.: mensalao.com.br),
 * o build grava o arquivo CNAME. Sem a variável, nada muda (o Pages atual continua funcionando).
 */
function cname(): Plugin {
  return {
    name: 'mensalao-cname',
    apply: 'build',
    generateBundle() {
      const dominio = process.env.MENSALAO_DOMINIO?.trim();
      if (dominio) this.emitFile({ type: 'asset', fileName: 'CNAME', source: `${dominio}\n` });
    },
  };
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
    resolve: {
      alias: {
        '@ambiente': resolve(__dirname, `src/plataforma/ambiente.${teste ? 'teste' : 'android'}.ts`),
      },
    },
    build: {
      target: 'es2022',
      outDir: teste ? 'dist-teste' : 'dist',
      // Duas páginas: o app e a política de privacidade (E-05), ambas no cache offline.
      rollupOptions: { input: { main: resolve(__dirname, 'index.html'), privacidade: resolve(__dirname, 'privacidade.html') } },
    },
    plugins: [serviceWorker(), cname()],
  };
});
