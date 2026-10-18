// Ícones SVG inline (desenhados no próprio código, sem biblioteca), conforme design.md seção 3.
const NS = 'http://www.w3.org/2000/svg';

const CAMINHOS: Record<string, string> = {
  relogio: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  ampulheta: '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  cima: '<path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  baixo: '<path d="M12 5v14M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  pausa: '<path d="M9 6v12M15 6v12" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
  x: '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  info: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  alerta: '<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 7v6M12 16.5v.5" stroke="var(--cor-superficie)" stroke-width="2.4" stroke-linecap="round"/>',
  voltar: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  mais: '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
  busca: '<circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M16 16l4 4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  inicio: '<rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 10h16M9 3v4M15 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  lista: '<path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="4.5" cy="6" r="1.5" fill="currentColor"/><circle cx="4.5" cy="12" r="1.5" fill="currentColor"/><circle cx="4.5" cy="18" r="1.5" fill="currentColor"/>',
  totais: '<path d="M5 20V12M12 20V5M19 20v-9" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
  ajustes: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="7" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="17" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/>',
  moeda: '<rect width="24" height="24" rx="6" fill="#08573A"/><circle cx="12" cy="12" r="6.7" fill="#D4A72C"/><circle cx="12" cy="12" r="5.6" fill="none" stroke="#08573A" stroke-width=".6"/><path d="M8.9 15.2V8.8l3.1 3.6 3.1-3.6v6.4" fill="none" stroke="#08573A" stroke-width="1.5" stroke-linejoin="round"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  sino: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 20.5h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  tabela: '<rect x="3.5" y="4.5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 9.5h17M3.5 14.5h17M10 9.5v10" stroke="currentColor" stroke-width="2"/>',
  girar: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.4" opacity=".25"/><path d="M12 4a8 8 0 0 1 8 8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  fechar: '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
};

const CARTEIRA =
  '<rect x="14" y="28" width="68" height="46" rx="10" fill="none" stroke="var(--cor-primaria)" stroke-width="4"/><path d="M14 40h68" stroke="var(--cor-primaria)" stroke-width="4"/><rect x="58" y="48" width="24" height="14" rx="7" fill="none" stroke="var(--cor-primaria)" stroke-width="4"/><circle cx="66" cy="20" r="10" fill="var(--cor-acento)"/>';

export type NomeIcone = keyof typeof CAMINHOS;

/** Ícone decorativo (aria-hidden). Tamanho 16 px (`ic`) ou 24 px (`ic24`). */
export function icone(nome: NomeIcone, classe: 'ic' | 'ic24' = 'ic'): SVGSVGElement {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', classe);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.innerHTML = CAMINHOS[nome];
  return svg;
}

/** Moeda grande decorativa (56 px) da tela Pro. */
export function moedaGrande(): SVGSVGElement {
  const svg = icone('moeda', 'ic24');
  svg.setAttribute('class', 'moeda-grande');
  return svg;
}

/** Ilustração do estado vazio (carteira com moeda), 96 px. */
export function ilustracaoCarteira(): SVGSVGElement {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 96 96');
  svg.setAttribute('width', '96');
  svg.setAttribute('height', '96');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.innerHTML = CARTEIRA;
  return svg;
}
