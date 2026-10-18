import { describe, expect, it } from 'vitest';
import { calcularReajuste, textoReajuste, ultimoReajuste } from '../../src/domain/reajuste';
import { sub } from './fixtures';

describe('reajuste', () => {
  it('US-03.CA1: 39,90 -> 44,90 sobe 12,5% (R$ 5,00)', () => {
    const r = calcularReajuste(3990, 4490)!;
    expect(textoReajuste(r)).toBe('subiu 12,5% (R$ 5,00)');
  });
  it('US-03.CA2: 19,90 -> 21,90 = R$ 2,00 e 10,1%', () => {
    expect(textoReajuste(calcularReajuste(1990, 2190)!)).toBe('subiu 10,1% (R$ 2,00)');
  });
  it('US-03.CA3: 44,90 -> 39,90 cai R$ 5,00 (11,1%)', () => {
    const r = calcularReajuste(4490, 3990)!;
    expect(r.tipo).toBe('caiu');
    expect(textoReajuste(r)).toBe('caiu R$ 5,00 (11,1%)');
  });
  it('US-03.CA4: valor igual não gera reajuste', () => {
    expect(calcularReajuste(3990, 3990)).toBeNull();
  });
  it('US-03.CA5: o selo compara só com o valor imediatamente anterior', () => {
    const a = sub({ valorCentavos: 3990, historico: [
      { data: '2026-05-01', deCentavos: 2990, paraCentavos: 3490 },
      { data: '2026-08-01', deCentavos: 3490, paraCentavos: 3990 },
    ] });
    expect(textoReajuste(ultimoReajuste(a)!)).toBe('subiu 14,3% (R$ 5,00)');
  });
  it('US-03.CA6: sem histórico, sem selo', () => {
    expect(ultimoReajuste(sub())).toBeNull();
  });
});
