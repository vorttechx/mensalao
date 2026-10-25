// US-27.CA1 / US-29.CA3 — Link para a política de privacidade (design 14.6: "↗", sai do app).
// Com rede, a URL pública abre no navegador do sistema; sem rede, a cópia empacotada abre dentro do app,
// então a política abre também offline.
import { h } from './dom';
import { icone } from './icones';

export const URL_POLITICA = 'https://mensalao.app/privacidade.html';
export const POLITICA_EMPACOTADA = './privacidade.html';

function aoAbrir(ev: Event): void {
  if (navigator.onLine === false) {
    ev.preventDefault();
    location.assign(POLITICA_EMPACOTADA);
  }
}

/** Linha de grupo "Política de privacidade ↗". */
export function linhaPolitica(testid: string): HTMLAnchorElement {
  return h(
    'a',
    { class: 'lin lin-acao', href: URL_POLITICA, rel: 'noopener noreferrer', testid, onclick: aoAbrir },
    h('span', {}, 'Política de privacidade'),
    icone('externo', 'ic ic-ext'),
  );
}

/** Link no texto (aviso de consentimento): "Saiba mais na política de privacidade ↗". */
export function linkPolitica(texto: string, testid: string): HTMLAnchorElement {
  return h(
    'a',
    { class: 'link-ext', href: URL_POLITICA, rel: 'noopener noreferrer', testid, onclick: aoAbrir },
    h('span', {}, texto),
    icone('externo', 'ic ic-ext'),
  );
}
