import { describe, expect, it } from 'vitest';
import { avancarAteHoje, diferencaDias, formatarDataBR, lerDataBR, proximoCiclo, somarMeses } from '../../src/domain/datas';

describe('datas', () => {
  it('US-01.CA7: rejeita data inexistente e vazia, aceita válida', () => {
    expect(lerDataBR('31/02/2026')).toBeNull();
    expect(lerDataBR('')).toBeNull();
    expect(lerDataBR('15/10/2026')).toBe('2026-10-15');
    expect(formatarDataBR('2026-10-15')).toBe('15/10/2026');
  });
  it('US-01.CA8: mensal no passado avança para a primeira ocorrência >= hoje', () => {
    expect(avancarAteHoje('2026-08-15', 'mensal', '2026-09-30')).toBe('2026-10-15');
  });
  it('US-01.CA8: data de hoje não avança', () => {
    expect(avancarAteHoje('2026-09-30', 'mensal', '2026-09-30')).toBe('2026-09-30');
  });
  it('US-02.CA5: anual 10/03/2026 com hoje 30/09/2026 vira 10/03/2027', () => {
    expect(avancarAteHoje('2026-03-10', 'anual', '2026-09-30')).toBe('2027-03-10');
  });
  it('US-02.CA4: semanal avança em múltiplos de 7 dias', () => {
    expect(avancarAteHoje('2026-09-01', 'semanal', '2026-09-30')).toBe('2026-10-06');
    expect(proximoCiclo('2026-09-01', 'semanal')).toBe('2026-09-08');
  });
  it('US-02.CA6: dia 31 -> 28/02, 29/02 bissexto e volta ao 31 em março', () => {
    expect(somarMeses('2026-01-31', 1)).toBe('2026-02-28');
    expect(somarMeses('2028-01-31', 1)).toBe('2028-02-29');
    expect(somarMeses('2026-02-28', 1, 31)).toBe('2026-03-31');
    expect(avancarAteHoje('2026-01-31', 'mensal', '2026-03-01', 31)).toBe('2026-03-31');
  });
  it('US-02.CA6: anual 29/02 em ano não bissexto vira 28/02', () => {
    expect(proximoCiclo('2028-02-29', 'anual')).toBe('2029-02-28');
  });
  it('diferencaDias', () => {
    expect(diferencaDias('2026-09-30', '2026-10-03')).toBe(3);
    expect(diferencaDias('2026-09-30', '2026-09-30')).toBe(0);
  });
});
