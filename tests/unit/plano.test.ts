import { describe, expect, it } from 'vitest';
import { LIMITE_GRATIS, acimaDoLimite, contarAtivas, podeAtivarMais, recursosDoPlano, textoContador, vagasRestantes } from '../../src/domain/plano';
import { sub } from './fixtures';

const n = (qtd: number, p: Parameters<typeof sub>[0] = {}) => Array.from({ length: qtd }, (_, i) => sub({ id: String(i), ...p }));

describe('plano e limite (US-09)', () => {
  it('US-09.CA1: 4 ativas ainda pode adicionar; contador "4 de 5 assinaturas ativas"', () => {
    expect(podeAtivarMais(n(4), false)).toBe(true);
    expect(textoContador(4)).toBe('4 de 5 assinaturas ativas');
    expect(vagasRestantes(n(4), false)).toBe(1);
  });
  it('US-09.CA2: exatamente 5 ativas bloqueia no grátis', () => {
    expect(LIMITE_GRATIS).toBe(5);
    expect(podeAtivarMais(n(5), false)).toBe(false);
    expect(vagasRestantes(n(5), false)).toBe(0);
    expect(acimaDoLimite(n(5), false)).toBe(false);
  });
  it('US-09.CA3: pausadas e canceladas não contam', () => {
    const l = [...n(4), sub({ id: 'p', status: 'pausada' }), sub({ id: 'c', status: 'cancelada' })];
    expect(contarAtivas(l)).toBe(4);
    expect(podeAtivarMais(l, false)).toBe(true);
  });
  it('US-09.CA7: Pro nunca bloqueia e não tem vagas finitas', () => {
    expect(podeAtivarMais(n(12), true)).toBe(true);
    expect(vagasRestantes(n(12), true)).toBe(Infinity);
    expect(acimaDoLimite(n(12), true)).toBe(false);
  });
  it('US-09.CA8: teste grátis conta como ativa', () => {
    expect(contarAtivas(n(5, { emTeste: true, fimTeste: '2026-12-01' }))).toBe(5);
  });
  it('US-09.CA9: lista vazia mostra "0 de 5"', () => {
    expect(textoContador(contarAtivas([]))).toBe('0 de 5 assinaturas ativas');
    expect(podeAtivarMais([], false)).toBe(true);
  });
  it('US-09.CA10: valor R$ 0,01 conta uma vaga', () => {
    expect(contarAtivas(n(5, { valorCentavos: 1 }))).toBe(5);
  });
  it('US-09.CA12/CA13: acima do limite (12 e 20) usa o texto "acima do limite" e bloqueia só adicionar', () => {
    expect(textoContador(12)).toBe('12 de 5 assinaturas ativas — acima do limite do plano grátis');
    expect(acimaDoLimite(n(12), false)).toBe(true);
    expect(podeAtivarMais(n(20), false)).toBe(false);
    expect(vagasRestantes(n(20), false)).toBe(0);
  });
  it('US-09.CA12: aceita também o Estado completo', () => {
    expect(contarAtivas({ versao: 1, config: { diasAviso: 3 }, assinaturas: n(3) })).toBe(3);
  });
  it('US-11/12: recursosDoPlano libera tudo só no Pro', () => {
    expect(Object.values(recursosDoPlano(false)).every((v) => v === false)).toBe(true);
    expect(Object.values(recursosDoPlano(true)).every((v) => v === true)).toBe(true);
  });
});
