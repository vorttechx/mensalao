// Ícones SVG inline (desenhados no próprio código, sem biblioteca), design.md seção 3:
// traço de 1,75 a 2 px com pontas arredondadas, aria-hidden quando há texto ao lado.
const NS = 'http://www.w3.org/2000/svg';

const CAMINHOS = {
  relogio: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  ampulheta: '<path d="M7 3.5h10M7 20.5h10M8 3.5c0 5 8 5 8 8.5s-8 3.5-8 8.5M16 3.5c0 5-8 5-8 8.5s8 3.5 8 8.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
  cima: '<path d="M12 19V5.5M6.5 11L12 5.5l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  baixo: '<path d="M12 5v13.5M6.5 13l5.5 5.5 5.5-5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  pausa: '<path d="M9 6v12M15 6v12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  info: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 11v5.5M12 7.8v.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  alerta: '<circle cx="12" cy="12" r="9.5" fill="currentColor"/><path d="M12 7v6M12 16.3v.4" stroke="var(--cor-fundo)" stroke-width="2.2" stroke-linecap="round"/>',
  voltar: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  seta: '<path d="M9.5 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  'chevron-baixo': '<path d="M6 9.5l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  mais: '<path d="M12 4.5v15M4.5 12h15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
  busca: '<circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M16 16l4 4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
  // Abas: Início = mini-régua, Assinaturas = lista com quadradinhos, Totais = linhas decrescentes, Ajustes = controles.
  inicio: '<path d="M3.5 18.5h17" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><path d="M6.5 18.5v-6M10.5 18.5V8M14.5 18.5v-4M18 18.5v-8.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  lista: '<path d="M9 6.5h11M9 12h11M9 17.5h11" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><rect x="3.5" y="5" width="3" height="3" rx=".8" fill="currentColor"/><rect x="3.5" y="10.5" width="3" height="3" rx=".8" fill="currentColor"/><rect x="3.5" y="16" width="3" height="3" rx=".8" fill="currentColor"/>',
  totais: '<path d="M4 7h16M4 12h11M4 17h7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
  ajustes: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><circle cx="16" cy="7" r="2.3" fill="none" stroke="currentColor" stroke-width="1.75"/><circle cx="8" cy="17" r="2.3" fill="none" stroke="currentColor" stroke-width="1.75"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  sino: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M10 20.5h4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
  girar: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.2" opacity=".25"/><path d="M12 4a8 8 0 0 1 8 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  fechar: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
};

export type NomeIcone = keyof typeof CAMINHOS;

/** Ícone decorativo (aria-hidden). Tamanho 16 px (`ic`) ou 24 px (`ic24`). */
export function icone(nome: NomeIcone, classe: string = 'ic'): SVGSVGElement {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', classe);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.innerHTML = CAMINHOS[nome];
  return svg;
}
