// mensalao.app (US-31.CA3/CA5): desregistra service workers antigos e, se a chave dos dados antigos
// existir, mostra um aviso. Só confere a chave: não lê o valor, não apaga e não altera o localStorage.
(function () {
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function (rs) {
        rs.forEach(function (r) { r.unregister(); });
      }, function () {});
    }
  } catch (e) {}
  var tem = false;
  try {
    for (var i = 0; i < localStorage.length; i++) if (localStorage.key(i) === 'mensalao:v1') tem = true;
  } catch (e) {}
  var acao = document.getElementById('site-acao');
  if (!tem || !acao) return;
  var ns = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  var c = document.createElementNS(ns, 'circle');
  c.setAttribute('cx', '12'); c.setAttribute('cy', '12'); c.setAttribute('r', '8.5');
  c.setAttribute('fill', 'none'); c.setAttribute('stroke', 'currentColor'); c.setAttribute('stroke-width', '1.9');
  var p = document.createElementNS(ns, 'path');
  p.setAttribute('d', 'M12 11v5.5M12 7.8v.4'); p.setAttribute('fill', 'none');
  p.setAttribute('stroke', 'currentColor'); p.setAttribute('stroke-width', '2.2'); p.setAttribute('stroke-linecap', 'round');
  svg.append(c, p);
  var aviso = document.createElement('p');
  aviso.className = 'site-aviso';
  aviso.setAttribute('role', 'status');
  aviso.setAttribute('data-testid', 'site-aviso-antigo');
  var t = document.createElement('span');
  t.textContent = 'O Mensalão agora funciona só pelo app de celular, na Google Play. As assinaturas que você tinha guardadas neste navegador continuam aqui, mas o app não consegue lê-las.';
  aviso.append(svg, t);
  acao.after(aviso);
})();
