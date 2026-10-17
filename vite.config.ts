import { createHash } from 'node:crypto';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/** Lista os arquivos de public/ (copiados como estão para o build). */
function arquivosPublicos(dir: string, raiz = dir): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    return statSync(caminho).isDirectory() ? arquivosPublicos(caminho, raiz) : [relative(raiz, caminho).split('\\').join('/')];
  });
}

/**
 * Gera o service worker (sw.js) no build com a lista de todos os arquivos do app,
 * para funcionar offline após o primeiro acesso (US-08). Sem dependências externas.
 */
function serviceWorker(): Plugin {
  return {
    name: 'mensalao-service-worker',
    apply: 'build',
    generateBundle(_opcoes, bundle) {
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
    // Navegação: tenta a rede (versão nova) e cai para o index.html do cache offline.
    ev.respondWith(
      fetch(req).catch(() => caches.match('index.html', { ignoreSearch: true }).then((r) => r || caches.match('./'))),
    );
    return;
  }
  // Demais arquivos: cache primeiro, rede como reserva.
  ev.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req)));
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: codigo });
    },
  };
}

// base relativa: o build funciona em qualquer subdiretório (ex.: /apps/mensalao/).
export default defineConfig({
  base: './',
  build: { target: 'es2022' },
  plugins: [serviceWorker()],
});
