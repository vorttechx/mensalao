import { describe, expect, it } from 'vitest';
import { agregarCategorias, dadosGrafico, formatarDecimos, percentuaisMaiorResto, ROTULO_OUTRAS } from '../../src/domain/grafico';
import { sub } from './fixtures';

const HOJE = '2026-09-30';

describe('gráfico por categoria (US-16)', () => {
  it('US-16.CA3: 100/50/50 → 50,0% 25,0% 25,0%, soma 1000', () => {
    const d = dadosGrafico([
      sub({ id: '1', categoria: 'Streaming de vídeo', valorCentavos: 10000 }),
      sub({ id: '2', categoria: 'Música', valorCentavos: 5000 }),
      sub({ id: '3', categoria: 'Compras', valorCentavos: 5000 }),
    ], HOJE);
    expect(d.fatias.map((f) => f.rotulo)).toEqual(['Streaming de vídeo', 'Compras', 'Música']);
    expect(d.fatias.map((f) => formatarDecimos(f.decimos))).toEqual(['50,0%', '25,0%', '25,0%']);
    expect(d.totalMensalCentavos).toBe(20000);
  });
  it('US-16.CA3: três partes iguais somam exatamente 100,0%', () => {
    expect(percentuaisMaiorResto([1, 1, 1])).toEqual([334, 333, 333]);
    for (const pesos of [[1, 1, 1], [7, 11, 13, 17], [1, 2, 3, 4, 5, 6, 7], [999, 1, 1]]) {
      expect(percentuaisMaiorResto(pesos).reduce((a, b) => a + b, 0)).toBe(1000);
    }
  });
  it('US-16.CA3: formatarDecimos', () => {
    expect([500, 250, 1000, 5, 333].map(formatarDecimos)).toEqual(['50,0%', '25,0%', '100,0%', '0,5%', '33,3%']);
  });
  it('US-16.CA4: mais de 6 categorias agrupam as menores em "Outras categorias"', () => {
    const subs = Array.from({ length: 8 }, (_, i) => sub({ id: String(i), categoria: 'Cat' + i, valorCentavos: (8 - i) * 1000 }));
    const d = dadosGrafico(subs, HOJE);
    expect(d.fatias).toHaveLength(7);
    expect(d.fatias[6]).toMatchObject({ rotulo: ROTULO_OUTRAS, outras: true });
    expect(d.fatias[6].mensalCentavos).toBe(3000);
    expect(d.fatias.reduce((s, f) => s + f.decimos, 0)).toBe(1000);
    expect(d.fatias[0].rotulo).toBe('Cat0');
  });
  it('US-16.CA4: exatamente 6 categorias não criam "Outras"', () => {
    const subs = Array.from({ length: 6 }, (_, i) => sub({ id: String(i), categoria: 'Cat' + i }));
    expect(dadosGrafico(subs, HOJE).fatias.some((f) => f.outras)).toBe(false);
  });
  it('US-16.CA5: uma categoria = 100,0%', () => {
    const d = dadosGrafico([sub({ id: '1' }), sub({ id: '2' })], HOJE);
    expect(d.fatias).toHaveLength(1);
    expect(formatarDecimos(d.fatias[0].decimos)).toBe('100,0%');
  });
  it('US-16.CA6: sem dados não gera NaN nem divisão por zero', () => {
    expect(dadosGrafico([], HOJE)).toEqual({ totalMensalCentavos: 0, fatias: [] });
    expect(agregarCategorias([])).toEqual({ totalMensalCentavos: 0, fatias: [] });
    expect(percentuaisMaiorResto([0, 0])).toEqual([0, 0]);
  });
  it('US-16.CA2/CA6: ignora pausadas, canceladas e teste grátis vigente', () => {
    const d = dadosGrafico([
      sub({ id: '1', status: 'pausada' }), sub({ id: '2', status: 'cancelada' }),
      sub({ id: '3', emTeste: true, fimTeste: '2026-10-05' }),
    ], HOJE);
    expect(d.fatias).toEqual([]);
  });
  it('US-16.CA2: equivalente mensal (anual 120,00 = 10,00/mês)', () => {
    const d = dadosGrafico([sub({ valorCentavos: 12000, ciclo: 'anual', proxima: '2027-01-01' })], HOJE);
    expect(d.totalMensalCentavos).toBe(1000);
  });
  it('US-16.CA7: 3 × R$ 0,10 totalizam R$ 0,30 (30 centavos)', () => {
    const d = dadosGrafico([1, 2, 3].map((i) => sub({ id: String(i), valorCentavos: 10 })), HOJE);
    expect(d.totalMensalCentavos).toBe(30);
  });
  it('US-16.CA4: empate ordena pelo nome da categoria', () => {
    const d = dadosGrafico([sub({ id: '1', categoria: 'Música' }), sub({ id: '2', categoria: 'Compras' })], HOJE);
    expect(d.fatias.map((f) => f.rotulo)).toEqual(['Compras', 'Música']);
  });
});
