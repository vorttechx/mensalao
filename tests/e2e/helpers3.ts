// Helpers da sprint 3 (QA): contraste WCAG, transbordo horizontal real e leitura de tokens.
import { expect, type Page } from '@playwright/test';

export const TEMAS = ['verde-cedula', 'azul-noite', 'grafite', 'ameixa'] as const;
export const MODOS = ['light', 'dark'] as const;

/** Lê os tokens de cor (valores computados no <html>) já em hexadecimal minúsculo. */
export async function tokens(page: Page, nomes: string[]): Promise<Record<string, string>> {
  return page.evaluate((ns) => {
    const cs = getComputedStyle(document.documentElement);
    return Object.fromEntries(ns.map((n) => [n, cs.getPropertyValue(n).trim().toLowerCase()]));
  }, nomes);
}

export function luminancia(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/**
 * Varre o texto visível da tela e devolve os trechos abaixo do AA (4,5:1; 3:1 para texto grande),
 * comparando a cor do texto com o primeiro fundo opaco dos ancestrais. Ignora .sr-only, aria-hidden
 * decorativo (monogramas são isentos, US-21.CA4) e controles desabilitados (isentos na WCAG).
 */
export async function textosAbaixoDoAA(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const rgb = (s: string) => {
      const m = s.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
      return { r, g, b, a };
    };
    const lum = (c: { r: number; g: number; b: number }) => {
      const [r, g, b] = [c.r, c.g, c.b].map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const fundo = (el: Element | null): { r: number; g: number; b: number } => {
      for (let e = el; e; e = e.parentElement) {
        const c = rgb(getComputedStyle(e).backgroundColor);
        if (c && c.a >= 0.99) return c;
      }
      const c = rgb(getComputedStyle(document.documentElement).backgroundColor);
      return c && c.a >= 0.99 ? c : { r: 255, g: 255, b: 255 };
    };
    const ruins: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const vistos = new Set<Element>();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || vistos.has(el) || !n.textContent?.trim()) continue;
      vistos.add(el);
      if (el.closest('.sr-only, [aria-hidden="true"], script, style, title, [hidden], dialog:not([open])')) continue;
      if (el.closest('button:disabled, input:disabled, select:disabled, [aria-disabled="true"]')) continue;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
      const cor = rgb(cs.color);
      if (!cor) continue;
      const f = fundo(el);
      const [a, b] = [lum(cor), lum(f)].sort((p, q) => q - p);
      const razao = (a + 0.05) / (b + 0.05);
      const px = parseFloat(cs.fontSize);
      const grande = px >= 24 || (px >= 18.66 && Number(cs.fontWeight) >= 700);
      if (razao < (grande ? 3 : 4.5) - 0.005) ruins.push(`${razao.toFixed(2)} "${n.textContent.trim().slice(0, 30)}" ${cs.color} sobre rgb(${f.r},${f.g},${f.b})`);
    }
    return ruins;
  });
}

/**
 * Elementos visíveis que passam da borda da janela (o body tem overflow-x: hidden, então o
 * scrollWidth do documento não mostra o corte) ou com texto cortado dentro de caixa com overflow.
 */
export async function transbordos(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const fora: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('body *')) {
      if (el.closest('.sr-only, dialog:not([open]), [hidden], svg, details:not([open]) > :not(summary)')) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const nome = `${el.tagName.toLowerCase()}.${el.className || ''}[${el.dataset.testid ?? el.textContent?.trim().slice(0, 20)}]`;
      if (r.right > vw + 1 || r.left < -1) fora.push(`fora da tela: ${nome} (${Math.round(r.left)}..${Math.round(r.right)} de ${vw})`);
      const cs = getComputedStyle(el);
      const corta = cs.overflowX === 'hidden' || cs.overflowX === 'clip' || cs.textOverflow === 'ellipsis';
      if (corta && el.scrollWidth > el.clientWidth + 1 && el.textContent?.trim()) fora.push(`texto cortado: ${nome} (${el.scrollWidth} > ${el.clientWidth})`);
    }
    return fora;
  });
}

/** Aumenta o texto em 200% (os tamanhos do app são em rem). */
export async function texto200(page: Page) {
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
}

export async function semTransbordo(page: Page, contexto: string) {
  expect(await transbordos(page), contexto).toEqual([]);
}

/**
 * US-22.CA4 com qualquer fonte do sistema (CI: DejaVu Sans; container: Inter). Mede um texto que não quebra e
 * precisa caber no bloco (número grande, "Por ano"): o tamanho atual, o teto do CSS (o tamanho do design limitado
 * por cqi, medido tirando por um instante o ajuste em linha) e se o texto cabe no teto e com 1 px a mais.
 * Nada aqui depende das métricas de uma fonte: quem decide é o espaço medido na própria página.
 * `testid` é o elemento ajustado; `alvo` (opcional) é o seletor do filho cuja largura conta (o `span.valor`).
 */
export async function medirAjuste(page: Page, testid: string, alvo?: string) {
  return page.getByTestId(testid).evaluate((el, alvoSel) => {
    const e = el as HTMLElement;
    const a = (alvoSel ? e.querySelector<HTMLElement>(alvoSel) : null) ?? e;
    let bloco: HTMLElement | null = e.parentElement;
    while (bloco && !getComputedStyle(bloco).containerType.includes('inline-size')) bloco = bloco.parentElement;
    const cs = getComputedStyle(bloco!);
    const disponivel = bloco!.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const fonte = parseFloat(getComputedStyle(e).fontSize);
    const largura = a.getBoundingClientRect().width;
    const salvo = e.style.getPropertyValue('font-size');
    e.style.removeProperty('font-size');
    const teto = parseFloat(getComputedStyle(e).fontSize);
    const larguraNoTeto = a.getBoundingClientRect().width;
    e.style.setProperty('font-size', `${fonte + 1}px`);
    const larguraMais1 = a.getBoundingClientRect().width;
    if (salvo) e.style.setProperty('font-size', salvo); else e.style.removeProperty('font-size');
    return {
      fonte, teto, disponivel, largura,
      cabeNoTeto: larguraNoTeto <= disponivel + 0.5,
      cabeMais1: larguraMais1 <= disponivel + 0.5,
    };
  }, alvo);
}

/**
 * Regras do ajuste ao espaço real, independentes da fonte: o texto cabe no bloco; nunca passa do teto do design;
 * se cabe no teto, fica no teto (com Inter a 100% = tamanho do design); se não cabe, fica abaixo dele, em 16 px ou
 * mais, e é o maior tamanho que cabe (com 1 px a mais já não caberia; tolerância dos passos de 0,5 px do ajuste).
 */
export function conferirAjuste(m: Awaited<ReturnType<typeof medirAjuste>>, id: string): string[] {
  const f: string[] = [];
  if (m.largura > m.disponivel + 0.5) f.push(`${id}: não cabe no bloco (${m.largura.toFixed(1)} > ${m.disponivel.toFixed(1)})`);
  if (m.fonte > m.teto + 0.2) f.push(`${id}: fonte ${m.fonte} px acima do teto do design ${m.teto.toFixed(2)}`);
  if (m.cabeNoTeto && Math.abs(m.fonte - m.teto) > 0.2) f.push(`${id}: cabe no teto ${m.teto.toFixed(2)} px, mas está em ${m.fonte}`);
  if (!m.cabeNoTeto) {
    if (m.fonte < 16 - 0.01) f.push(`${id}: fonte ${m.fonte} px abaixo do piso de 16 px`);
    if (m.cabeMais1 && m.fonte + 1 <= m.teto) f.push(`${id}: encolheu demais (${m.fonte} px; com +1 px ainda caberia)`);
  }
  return f;
}

/** Retângulos de linha de um trecho de texto (Range); mais de um topo distinto = o trecho quebrou de linha. */
export async function trechosPartidos(page: Page, seletor: string, padrao: string): Promise<string[]> {
  return page.evaluate(({ seletor, padrao }) => {
    const re = new RegExp(padrao, 'g');
    const ruins: string[] = [];
    for (const raiz of document.querySelectorAll(seletor)) {
      if ((raiz as HTMLElement).closest('.sr-only, [hidden]')) continue;
      const texto = raiz.textContent ?? '';
      // Mapeia o texto concatenado para os nós de texto, para o trecho poder atravessar <span>.
      const nos: { no: Text; ini: number }[] = [];
      let pos = 0;
      const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode() as Text | null; n; n = w.nextNode() as Text | null) { nos.push({ no: n, ini: pos }); pos += n.data.length; }
      const achar = (i: number) => { const x = [...nos].reverse().find((k) => k.ini <= i)!; return [x.no, i - x.ini] as const; };
      for (const m of texto.matchAll(re)) {
        const r = document.createRange();
        const [a, ia] = achar(m.index!);
        const [b, ib] = achar(m.index! + m[0].length - 1);
        r.setStart(a, ia); r.setEnd(b, ib + 1);
        // Linhas diferentes = dois retângulos sem sobreposição vertical (o "R$" menor e elevado fica na mesma linha).
        const qs = [...r.getClientRects()].filter((q) => q.width > 0);
        const partiu = qs.some((a) => qs.some((b) => b.top >= a.bottom - 1));
        const onde = a.parentElement?.closest<HTMLElement>('[data-testid]')?.dataset.testid ?? (raiz as HTMLElement).dataset.testid ?? raiz.className;
        if (partiu) ruins.push(`"${m[0]}" em ${onde}`);
      }
    }
    return ruins;
  }, { seletor, padrao });
}
