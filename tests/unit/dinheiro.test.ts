import { describe, expect, it } from 'vitest';
import { formatarBRL, formatarPercentual, lerValor } from '../../src/domain/dinheiro';

describe('dinheiro', () => {
  it('US-01.CA4: "39,90" vira 3990 centavos', () => {
    expect(lerValor('39,90')).toEqual({ ok: true, centavos: 3990 });
    expect(lerValor('39')).toEqual({ ok: true, centavos: 3900 });
    expect(lerValor('39,9')).toEqual({ ok: true, centavos: 3990 });
  });
  it.each(['', '   ', '0', '0,00', '-5', 'abc', '10,9x'])('US-01.CA5: rejeita "%s"', (t) => {
    expect(lerValor(t).ok).toBe(false);
  });
  it('US-01.CA5: mais de 2 casas dá erro "casas"', () => {
    expect(lerValor('10,999')).toEqual({ ok: false, erro: 'casas' });
  });
  it('US-01.CA4: formata BRL com espaço comum', () => {
    expect(formatarBRL(3990)).toBe('R$ 39,90');
    expect(formatarBRL(123456)).toBe('R$ 1.234,56');
    expect(formatarBRL(0)).toBe('R$ 0,00');
  });
  it('US-03.CA2: percentual com 1 casa e vírgula', () => {
    expect(formatarPercentual(12.5)).toBe('12,5%');
  });
});
