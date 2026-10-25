// US-22.CA4 — Texto grande ajustado ao espaço real, com qualquer fonte do sistema.
// O CSS dá o ponto de partida (tamanho do design em rem, limitado por cqi); aqui se mede o que de fato coube
// com a fonte que o aparelho usou (system-ui varia: Inter, Roboto, DejaVu Sans...) e se corrige:
// - número grande e "Por ano": se "R$ n" não cabe na linha do bloco, a fonte diminui até caber (piso: 16 px);
// - abas: 4 colunas, 2 ou 1, conforme os rótulos realmente caibam na largura de cada aba;
// - aviso de lembretes: com 3 ou mais, se o trecho passar do limite do design, a nota vai para "Mais N lembretes".
// Roda a cada montagem de tela e, via ResizeObserver, quando o bloco ou a escala do texto mudam.

/** Elementos cujo texto não quebra e precisa caber na largura do bloco. */
const SELETOR_AJUSTE = '.dinheiro-grande, .total-ano';

/** Largura de conteúdo do bloco que limita o elemento (o contêiner de consulta mais próximo, ou o pai). */
function larguraUtil(el: HTMLElement): number {
  let bloco = el.parentElement;
  while (bloco && !getComputedStyle(bloco).containerType.includes('inline-size')) bloco = bloco.parentElement;
  bloco ??= el.parentElement;
  if (!bloco) return 0;
  const cs = getComputedStyle(bloco);
  return bloco.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
}

/**
 * Reduz o font-size de `el` até "R$ n" (`.valor`, ou o próprio elemento) caber na largura do bloco.
 * Teto: o tamanho do CSS (design em rem, limitado por cqi). Piso: 16 px. "R$ n" nunca quebra (white-space: nowrap).
 */
export function ajustarAoEspaco(el: HTMLElement): void {
  el.style.removeProperty('font-size');
  const alvo = el.querySelector<HTMLElement>(':scope > .valor') ?? el;
  const disponivel = larguraUtil(el);
  const largura = alvo.getBoundingClientRect().width;
  if (disponivel <= 0 || largura <= disponivel) return;
  const inicial = parseFloat(getComputedStyle(el).fontSize);
  // Piso: o corpo do texto do design (16 px), nunca acima do tamanho inicial. Não é o 1rem do aparelho porque a
  // 300% (48 px) o próprio "Por ano" já parte de menos que isso (12cqi) e não caberia.
  const piso = Math.min(16, inicial);
  // Proporcional à sobra (R$, centavos e espaçamento são em em) e, depois, passos de 0,5 px para os arredondamentos.
  let tamanho = Math.max(piso, Math.floor((inicial * disponivel * 4) / largura) / 4);
  el.style.fontSize = `${tamanho}px`;
  while (tamanho > piso && alvo.getBoundingClientRect().width > disponivel) {
    tamanho = Math.max(piso, tamanho - 0.5);
    el.style.fontSize = `${tamanho}px`;
  }
}

/** Os rótulos cabem inteiros, numa linha, na largura de cada aba? Mede todos em peso 600, como a aba ativa. */
function rotulosCabem(lista: HTMLElement): boolean {
  lista.classList.add('medindo');
  const cabem = [...lista.querySelectorAll<HTMLElement>('a')].every((a) => {
    const texto = [...a.childNodes].find((n) => n.nodeType === Node.TEXT_NODE);
    if (!texto) return true;
    const r = document.createRange();
    r.selectNodeContents(texto);
    const cs = getComputedStyle(a);
    return r.getBoundingClientRect().width <= a.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  });
  lista.classList.remove('medindo');
  return cabem;
}

/** BUG-08: 4 abas numa linha enquanto os rótulos couberem; senão 2 colunas; senão 1. */
function ajustarAbas(lista: HTMLElement): void {
  for (const colunas of ['4', '2', '1']) {
    lista.dataset.colunas = colunas;
    if (colunas === '1' || rotulosCabem(lista)) return;
  }
}

/** Design 3.11: com "Mais N lembretes", o aviso fecha em até 184 px (ou 1/4 da tela, se menor). */
function ajustarAvisoLembretes(aviso: HTMLElement): void {
  const mais = aviso.querySelector<HTMLDetailsElement>(':scope > details');
  const nota = aviso.querySelector<HTMLElement>('.nota');
  if (!mais || !nota || mais.open) return;
  aviso.append(nota);
  if (aviso.getBoundingClientRect().height > Math.min(184, window.innerHeight / 4)) mais.append(nota);
}

function ajustarTudo(raiz: ParentNode): void {
  for (const el of raiz.querySelectorAll<HTMLElement>(SELETOR_AJUSTE)) ajustarAoEspaco(el);
  const lista = raiz.querySelector<HTMLElement>('.nav ul');
  if (lista) ajustarAbas(lista);
  const aviso = raiz.querySelector<HTMLElement>('.avisos');
  if (aviso) ajustarAvisoLembretes(aviso);
}

let observador: ResizeObserver | null = null;
let quadroPendente = 0;

/**
 * Ajusta a tela recém-montada e passa a observar os elementos e seus blocos. A escala do texto muda o tamanho
 * dos próprios elementos (rem); a largura da tela muda a dos blocos. O ajuste observado roda no quadro seguinte,
 * para não alterar, dentro do callback, o tamanho de quem está sendo observado (erro de laço do ResizeObserver).
 */
export function observarAjustes(raiz: HTMLElement): void {
  observador?.disconnect();
  ajustarTudo(raiz);
  if (typeof ResizeObserver === 'undefined') return;
  observador = new ResizeObserver(() => {
    if (quadroPendente) return;
    quadroPendente = requestAnimationFrame(() => {
      quadroPendente = 0;
      ajustarTudo(raiz);
    });
  });
  const alvos = new Set<Element>();
  for (const el of raiz.querySelectorAll<HTMLElement>(`${SELETOR_AJUSTE}, .nav ul, .avisos`)) {
    alvos.add(el);
    if (el.parentElement) alvos.add(el.parentElement);
  }
  for (const el of alvos) observador.observe(el);
}
