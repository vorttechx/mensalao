// US-21 — Monograma de cada serviço (design 3.5): monograma, iniciaisDe e indiceCorNeutra (src/domain/monograma.ts).
import { describe, expect, it } from 'vitest';
import { CATALOGO, MONOGRAMAS_CATALOGO } from '../../src/domain/catalogo';
import { hashDjb2, iniciaisDe, indiceCorNeutra, monograma, PALETA_NEUTRA } from '../../src/domain/monograma';

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// Tabela da seção 3.5 do design.md aprovado.
const TABELA_DESIGN: Record<string, [string, string, string]> = {
  netflix: ['N', '#B1060F', '#FFFFFF'], spotify: ['Sp', '#147A3D', '#FFFFFF'], 'amazon-prime': ['Pr', '#146EB4', '#FFFFFF'],
  'disney-plus': ['D+', '#113CCF', '#FFFFFF'], max: ['M', '#1A3BD6', '#FFFFFF'], globoplay: ['G', '#C8193C', '#FFFFFF'],
  'youtube-premium': ['YT', '#C4120C', '#FFFFFF'], apple: ['A', '#3A3A3C', '#FFFFFF'], 'google-one': ['G1', '#1967D2', '#FFFFFF'],
  deezer: ['Dz', '#7B2CBF', '#FFFFFF'], 'paramount-plus': ['P+', '#0057D9', '#FFFFFF'], 'ifood-clube': ['iF', '#C8102E', '#FFFFFF'],
  'meli-plus': ['ML', '#FFE600', '#2D3277'], academia: ['Ac', '#5B6670', '#FFFFFF'], internet: ['In', '#4D6878', '#FFFFFF'],
  celular: ['Ce', '#5E5A7A', '#FFFFFF'], 'microsoft-365': ['MS', '#C43E00', '#FFFFFF'], 'chatgpt-plus': ['Ch', '#0B7A5E', '#FFFFFF'],
};

describe('US-21.CA1 monograma do catálogo', () => {
  it('US-21.CA1: cada serviço do catálogo tem monograma igual à tabela do design 3.5', () => {
    expect(Object.keys(MONOGRAMAS_CATALOGO).sort()).toEqual(CATALOGO.map((s) => s.id).sort());
    for (const s of CATALOGO) {
      const [iniciais, fundo, texto] = TABELA_DESIGN[s.id];
      expect(monograma(s.nome, s.id), s.id).toEqual({ iniciais, fundo, texto });
    }
  });
  it('US-21.CA1: sem catalogoId, nome igual ao do catálogo (sem caixa nem acento) usa a cor do serviço', () => {
    expect(monograma('spotify')).toEqual(monograma('Spotify', 'spotify'));
    expect(monograma('  NETFLIX ')).toEqual(monograma('Netflix', 'netflix'));
    expect(monograma('Disney+')).toEqual(monograma('x', 'disney-plus'));
  });
  it('US-21.CA1: catalogoId desconhecido cai nas iniciais e na cor neutra', () => {
    const m = monograma('Meu Clube', 'nao-existe');
    expect(m.iniciais).toBe('MC');
    expect(PALETA_NEUTRA).toContain(m.fundo);
  });
  it('US-21.CA1: devolve cópia (alterar o resultado não altera o catálogo)', () => {
    const m = monograma('Netflix', 'netflix');
    m.iniciais = 'ZZ';
    expect(monograma('Netflix', 'netflix').iniciais).toBe('N');
  });
  it('design 3.5 / US-19.CA2: todas as cores de monograma passam 4,5:1 com o texto', () => {
    for (const [id, m] of Object.entries(MONOGRAMAS_CATALOGO)) expect(contraste(m.fundo, m.texto), id).toBeGreaterThanOrEqual(4.5);
    for (const c of PALETA_NEUTRA) expect(contraste(c, '#FFFFFF'), c).toBeGreaterThanOrEqual(4.5);
  });
});

describe('US-21.CA2 cor neutra estável', () => {
  it('US-21.CA2: paleta neutra de 8 tons do design', () => {
    expect(PALETA_NEUTRA).toEqual(['#5B6670', '#6A5D4D', '#4F6B5A', '#5E5A7A', '#7A5560', '#4D6878', '#6E6650', '#605A55']);
  });
  it('US-21.CA2: o mesmo nome sempre gera a mesma cor (sem diferenciar caixa, acento e espaços nas pontas)', () => {
    const a = monograma('Conta de luz');
    expect(monograma('Conta de luz')).toEqual(a);
    expect(monograma('  conta de LUZ ').fundo).toBe(a.fundo);
    expect(monograma('Ágora').fundo).toBe(monograma('agora').fundo);
    expect(a.texto).toBe('#FFFFFF');
  });
  it('US-21.CA2: índice = djb2 do nome normalizado módulo 8', () => {
    expect(hashDjb2('')).toBe(5381);
    expect(hashDjb2('a')).toBe((5381 * 33 + 97) >>> 0);
    for (const n of ['Conta de luz', 'Plano de saúde', 'Ágora', '99Pay', 'X', 'Condomínio']) {
      const i = indiceCorNeutra(n);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(8);
      expect(monograma(n).fundo).toBe(PALETA_NEUTRA[i]);
    }
  });
  it('US-21.CA2: nomes diferentes usam mais de uma cor da paleta', () => {
    const cores = new Set(['Água', 'Luz', 'Gás', 'Condomínio', 'Seguro', 'Escola', 'Plano de saúde', 'Revista', 'Jornal', 'Clube'].map((n) => monograma(n).fundo));
    expect(cores.size).toBeGreaterThan(3);
  });
});

describe('US-21.CA3 iniciais (até 2 caracteres legíveis)', () => {
  it.each([
    ['Plano de saúde', 'PS'],
    ['Conta de luz', 'CL'],
    ['Ágora', 'Ág'],
    ['99Pay', '99'],
    ['X', 'X'],
    ['Netflixx', 'Ne'],
    ['iCloud', 'Ic'],
    ['ação social', 'AS'],
    ['🎵 Música', 'Mú'],
    ['Rádio 🎶 Livre', 'RL'],
    ['Seguro-auto', 'SA'],
    ['Casa e Cia', 'CC'],
    ['De', 'De'],
    ['  espaço  ', 'Es'],
  ])('US-21.CA3: "%s" → "%s"', (nome, esperado) => {
    expect(iniciaisDe(nome)).toBe(esperado);
    expect(monograma(nome).iniciais).toBe(esperado);
  });
  it('US-21.CA3: sem letra nem dígito (só emoji ou símbolo) mostra "•"', () => {
    for (const n of ['🎵🎶', '***', '', '   ', '— + —']) expect(iniciaisDe(n)).toBe('•');
  });
  it('US-21.CA3: acento combinado (NFD) conta como um caractere só', () => {
    const decomposto = 'Ágora';
    expect(iniciaisDe(decomposto)).toBe('Ág');
    expect(Array.from(iniciaisDe(decomposto).normalize('NFC'))).toHaveLength(2);
  });
  it('US-21.CA3: nunca passa de 2 grafemas', () => {
    for (const n of ['Ágora', '99Pay', 'Um Dois Três', 'ÉÉÉÉ', 'Ñandú pay', 'X', 'Café com leite e pão']) {
      const g = Array.from(new Intl.Segmenter('pt-BR', { granularity: 'grapheme' }).segment(iniciaisDe(n)));
      expect(g.length, n).toBeLessThanOrEqual(2);
      expect(g.length, n).toBeGreaterThanOrEqual(1);
    }
  });
});
