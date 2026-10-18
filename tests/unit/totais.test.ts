import { describe, expect, it } from 'vitest';
import { formatarBRL } from '../../src/domain/dinheiro';
import { calcularTotais } from '../../src/domain/totais';
import { sub } from './fixtures';

const HOJE = '2026-09-30';

describe('totais', () => {
  it('US-04.CA1: Netflix 44,90 mensal + Prime 166,80 anual = R$ 58,80/mês e R$ 705,60/ano', () => {
    const t = calcularTotais([sub({ id: '1' }), sub({ id: '2', nome: 'Prime', valorCentavos: 16680, ciclo: 'anual' })], HOJE);
    expect(formatarBRL(t.mensalCentavos)).toBe('R$ 58,80');
    expect(formatarBRL(t.anualCentavos)).toBe('R$ 705,60');
  });
  it('US-04.CA2: semanal R$ 10,00 = R$ 43,33/mês e R$ 520,00/ano', () => {
    const t = calcularTotais([sub({ valorCentavos: 1000, ciclo: 'semanal' })], HOJE);
    expect(formatarBRL(t.mensalCentavos)).toBe('R$ 43,33');
    expect(formatarBRL(t.anualCentavos)).toBe('R$ 520,00');
  });
  it('US-04.CA2: arredonda só na soma (3 semanais de 10 = 130,00 e não 129,99)', () => {
    const t = calcularTotais([1, 2, 3].map((i) => sub({ id: String(i), valorCentavos: 1000, ciclo: 'semanal' })), HOJE);
    expect(formatarBRL(t.mensalCentavos)).toBe('R$ 130,00');
  });
  it('US-04.CA3: 3 x R$ 0,10 = R$ 0,30 exato', () => {
    const t = calcularTotais([1, 2, 3].map((i) => sub({ id: String(i), valorCentavos: 10 })), HOJE);
    expect(formatarBRL(t.mensalCentavos)).toBe('R$ 0,30');
    expect(t.anualCentavos).toBe(360);
  });
  it('US-04.CA4: por pagamento só mostra formas com valor > 0, na ordem fixa', () => {
    const t = calcularTotais([sub({ id: '1', pagamento: 'debito' }), sub({ id: '2', pagamento: 'cartao' })], HOJE);
    expect(t.porPagamento.map((g) => g.chave)).toEqual(['cartao', 'debito']);
  });
  it('US-04.CA5: por categoria do maior para o menor', () => {
    const t = calcularTotais([
      sub({ id: '1', categoria: 'Música', valorCentavos: 2000 }),
      sub({ id: '2', categoria: 'Delivery', valorCentavos: 5000 }),
      sub({ id: '3', categoria: 'Compras', valorCentavos: 3000 }),
    ], HOJE);
    expect(t.porCategoria.map((g) => g.chave)).toEqual(['Delivery', 'Compras', 'Música']);
  });
  it('US-04.CA6: pausadas e canceladas não entram', () => {
    const t = calcularTotais([sub({ id: '1', status: 'pausada' }), sub({ id: '2', status: 'cancelada', canceladaEm: HOJE })], HOJE);
    expect(t.quantidade).toBe(0);
    expect(t.anualCentavos).toBe(0);
  });
  it('US-04.CA7: teste vigente fica fora e aparece à parte; encerrado entra', () => {
    const t = calcularTotais([
      sub({ id: '1', emTeste: true, fimTeste: '2026-10-05' }),
      sub({ id: '2', emTeste: true, fimTeste: '2026-09-20' }),
    ], HOJE);
    expect(t.quantidade).toBe(1);
    expect(t.emTeste.quantidade).toBe(1);
    expect(formatarBRL(t.emTeste.mensalCentavos)).toBe('R$ 44,90');
  });
  it('US-04.CA8: sem assinaturas, tudo zero', () => {
    const t = calcularTotais([], HOJE);
    expect(formatarBRL(t.mensalCentavos)).toBe('R$ 0,00');
    expect(t.porPagamento).toEqual([]);
    expect(t.porCategoria).toEqual([]);
  });
});
