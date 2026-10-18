import { describe, expect, it } from 'vitest';
import { lerDataBR, mascararDataBR, posicaoCursorMascara } from '../../src/domain/datas';

describe('máscara de data dd/mm/aaaa (ajuste do G2, US-01)', () => {
  it('insere as barras sozinha', () => {
    expect(mascararDataBR('30092026')).toBe('30/09/2026');
    expect(mascararDataBR('3009')).toBe('30/09');
    expect(mascararDataBR('30')).toBe('30');
    expect(mascararDataBR('300')).toBe('30/0');
    expect(mascararDataBR('')).toBe('');
  });
  it('descarta letras e símbolos', () => {
    expect(mascararDataBR('a3b0-0.9x2026')).toBe('30/09/2026');
    expect(mascararDataBR('abc')).toBe('');
  });
  it('limita a 10 caracteres e ignora dígitos além do ano', () => {
    expect(mascararDataBR('30092026999')).toBe('30/09/2026');
    expect(mascararDataBR('30/09/20269')).toBe('30/09/2026');
  });
  it('é idempotente sobre texto já mascarado', () => {
    for (const t of ['30/09/2026', '30/09', '30/0', '3', '']) expect(mascararDataBR(t)).toBe(t);
  });
  it('apagar não trava: sem barra final automática ao voltar de "30/09/" para "30/09"', () => {
    expect(mascararDataBR('30/09')).toBe('30/09');
    expect(mascararDataBR('30/0')).toBe('30/0');
    expect(mascararDataBR('30/')).toBe('30/');
  });
  it('aceita colar com barras, inclusive "1/2/2026"', () => {
    expect(mascararDataBR('1/2/2026')).toBe('1/2/2026');
    expect(lerDataBR(mascararDataBR('1/2/2026'))).toBe('2026-02-01');
  });
  it('barra sozinha no início é ignorada', () => {
    expect(mascararDataBR('/')).toBe('');
    expect(mascararDataBR('//30')).toBe('30');
  });
  it('resultado completo é aceito pela validação', () => {
    expect(lerDataBR(mascararDataBR('30092026'))).toBe('2026-09-30');
    expect(lerDataBR(mascararDataBR('31022026'))).toBeNull();
  });
  it('cursor preserva a contagem de dígitos', () => {
    expect(posicaoCursorMascara('30/09/2026', 0)).toBe(0);
    expect(posicaoCursorMascara('30/09/2026', 2)).toBe(2);
    expect(posicaoCursorMascara('30/09/2026', 3)).toBe(4);
    expect(posicaoCursorMascara('30/09', 9)).toBe(5);
  });
});
