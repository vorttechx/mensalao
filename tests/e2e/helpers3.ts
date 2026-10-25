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
