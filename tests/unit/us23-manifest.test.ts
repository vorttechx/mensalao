// US-23 — Ícone, manifest e TWA (design 5.2): arquivos do repositório conferidos com o design aprovado.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(__dirname, '../..');
const json = (p: string) => JSON.parse(readFileSync(resolve(raiz, p), 'utf8'));
/** Largura e altura de um PNG (cabeçalho IHDR). */
function tamanhoPng(p: string): [number, number] {
  const b = readFileSync(resolve(raiz, p));
  expect(b.subarray(1, 4).toString()).toBe('PNG');
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

describe('US-23 manifest, ícone e TWA', () => {
  it('US-23.CA1: theme_color e background_color brancos; nome, display e escopo iguais', () => {
    const m = json('public/manifest.webmanifest');
    expect(m).toMatchObject({ name: 'Mensalão', short_name: 'Mensalão', display: 'standalone', start_url: './', scope: './', lang: 'pt-BR', theme_color: '#FFFFFF', background_color: '#FFFFFF' });
  });
  it('US-23.CA1: ícones 192 e 512 com any e maskable, nos tamanhos declarados', () => {
    const m = json('public/manifest.webmanifest');
    const chaves = m.icons.map((i: { sizes: string; purpose: string }) => `${i.sizes} ${i.purpose}`).sort();
    expect(chaves).toEqual(['192x192 any', '192x192 maskable', '512x512 any', '512x512 maskable']);
    for (const i of m.icons) {
      const [w, h] = tamanhoPng(`public/${i.src}`);
      expect(`${w}x${h}`).toBe(i.sizes);
    }
    expect(tamanhoPng('public/icons/apple-touch-icon.png')).toEqual([180, 180]);
  });
  it('US-23.CA1: index.html com as duas metas theme-color do design (claro e escuro)', () => {
    const html = readFileSync(resolve(raiz, 'index.html'), 'utf8');
    expect(html).toMatch(/<meta name="theme-color" content="#FFFFFF" \/>/);
    expect(html).toMatch(/<meta name="theme-color" content="#0F1512" media="\(prefers-color-scheme: dark\)" \/>/);
    expect(html).not.toMatch(/fonts\.googleapis|fonts\.gstatic|@font-face/);
  });
  it('US-23.CA1: ícone SVG na cor da marca, desenho da régua', () => {
    const svg = readFileSync(resolve(raiz, 'public/icons/icone.svg'), 'utf8');
    expect(svg).toMatch(/#1D5C3F/i);
    expect(svg).toMatch(/#9FD8B8/i);
  });
  it('US-23.CA3 (US-24.CA2): sem TWA, a cor de status/navegação vem do manifest e do Capacitor', () => {
    expect(existsSync(resolve(raiz, 'twa'))).toBe(false);
    const m = json('public/manifest.webmanifest');
    expect(m.theme_color.toUpperCase()).toBe('#FFFFFF');
    expect(m.background_color.toUpperCase()).toBe('#FFFFFF');
    const cap = json('capacitor.config.json');
    expect(JSON.stringify(cap)).toMatch(/SystemBars/);
    expect(m.icons.some((i: { src: string }) => /icon-512\.png$/.test(i.src))).toBe(true);
  });
  it('US-23.CA2: as 6 capturas da loja existem', () => {
    for (const f of ['1-inicio', '2-totais', '3-assinaturas', '4-detalhe', '5-pro', '6-ajustes']) {
      expect(statSync(resolve(raiz, `docs/loja/capturas/${f}.png`)).size).toBeGreaterThan(10_000);
    }
  });
});
