// Service worker de AUTODESTRUIÇÃO (US-31.CA3). Substitui o sw.js do antigo app web: ao instalar, assume o
// controle, apaga todos os caches desta origem, se desregistra e recarrega as páginas abertas, que passam a
// receber o site novo direto da rede. Só apaga caches: os dados guardados no navegador ficam intactos.
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (ev) {
  ev.waitUntil(
    self.clients.claim()
      .then(function () { return caches.keys(); })
      .then(function (chaves) { return Promise.all(chaves.map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.matchAll({ type: 'window', includeUncontrolled: true }); })
      .then(function (janelas) {
        janelas.forEach(function (j) {
          if ('navigate' in j) j.navigate(j.url).catch(function () {});
        });
      }),
  );
});
