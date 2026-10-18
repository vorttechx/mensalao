import { describe, expect, it } from 'vitest';
import { lembretesDevidos, lerDiasLembrete, prefixoDias, registrarAvisados, textoAntecedencia } from '../../src/domain/lembretes';
import { sub } from './fixtures';
import type { Assinatura, Estado } from '../../src/domain/tipos';

const HOJE = '2026-09-30';
const est = (a: Assinatura[]): Estado => ({ versao: 1, config: { diasAviso: 3 }, assinaturas: a });

describe('lembretes (US-13)', () => {
  it('US-13.CA3: cobrança amanhã com 1 dia vira "Amanhã: Netflix — R$ 44,90"', () => {
    const r = lembretesDevidos(est([sub({ proxima: '2026-10-01' })]), HOJE, 1);
    expect(r.itens.map((i) => i.texto)).toEqual(['Amanhã: Netflix — R$ 44,90']);
  });
  it('US-13.CA3: vários vencimentos ordenados por data e nome', () => {
    const r = lembretesDevidos(est([
      sub({ id: '1', nome: 'Spotify', proxima: '2026-10-01' }),
      sub({ id: '2', nome: 'Disney', proxima: '2026-10-01' }),
      sub({ id: '3', nome: 'Alura', proxima: '2026-10-02' }),
    ]), HOJE, 3);
    expect(r.itens.map((i) => i.nome)).toEqual(['Disney', 'Spotify', 'Alura']);
  });
  it('US-13.CA4: pares já avisados saem de "novos" mas continuam em "itens"', () => {
    const e = est([sub({ id: 'n', proxima: '2026-10-01' })]);
    const r = lembretesDevidos(e, HOJE, 1, ['c|n|2026-10-01']);
    expect(r.itens).toHaveLength(1);
    expect(r.novos).toHaveLength(0);
    expect(lembretesDevidos(e, HOJE, 1, []).novos).toHaveLength(1);
  });
  it('US-13.CA4: nova data de cobrança da mesma assinatura gera novo aviso', () => {
    const r = lembretesDevidos(est([sub({ id: 'n', proxima: '2026-10-01' })]), HOJE, 1, ['c|n|2026-09-01']);
    expect(r.novos).toHaveLength(1);
  });
  it('US-13.CA8: pausada e cancelada não geram lembrete', () => {
    const r = lembretesDevidos(est([sub({ id: '1', proxima: '2026-10-01', status: 'pausada' }), sub({ id: '2', proxima: '2026-10-01', status: 'cancelada' })]), HOJE, 3);
    expect(r.itens).toHaveLength(0);
  });
  it('US-13.CA8: teste vigente não gera cobrança; avisa o fim do teste', () => {
    const r = lembretesDevidos(est([sub({ nome: 'Max', emTeste: true, fimTeste: '2026-10-01', proxima: '2026-10-01' })]), HOJE, 1);
    expect(r.itens.map((i) => i.texto)).toEqual(['Teste grátis de Max termina amanhã']);
    expect(r.itens[0].tipo).toBe('fim-teste');
    expect(r.itens[0].chave).toBe('t|x|2026-10-01');
  });
  it('US-13.CA8: teste que termina fora da janela não avisa', () => {
    expect(lembretesDevidos(est([sub({ emTeste: true, fimTeste: '2026-10-20', proxima: '2026-10-20' })]), HOJE, 3).itens).toHaveLength(0);
  });
  it('US-13.CA9: data no passado é avançada antes de montar os lembretes', () => {
    const r = lembretesDevidos(est([sub({ proxima: '2026-09-01', diaRef: 1 })]), HOJE, 3);
    expect(r.itens.map((i) => i.data)).toEqual(['2026-10-01']);
    const r2 = lembretesDevidos(est([sub({ proxima: '2026-08-31', diaRef: 31 })]), HOJE, 3);
    expect(r2.itens.every((i) => i.data >= HOJE)).toBe(true);
    const r3 = lembretesDevidos(est([sub({ proxima: '2026-09-01', diaRef: 1 })]), '2026-09-30', 7);
    expect(r3.itens.map((i) => i.data)).toEqual(['2026-10-01']);
  });
  it('US-13.CA10: 0 dias é do dia ("Hoje: Spotify — R$ 21,90") e não pega amanhã', () => {
    const e = est([sub({ nome: 'Spotify', valorCentavos: 2190, proxima: HOJE }), sub({ id: 'o', proxima: '2026-10-01' })]);
    expect(lembretesDevidos(e, HOJE, 0).itens.map((i) => i.texto)).toEqual(['Hoje: Spotify — R$ 21,90']);
  });
  it('US-13.CA11: centavos exatos', () => {
    expect(lembretesDevidos(est([sub({ valorCentavos: 999, proxima: '2026-10-02' })]), HOJE, 2).itens[0].texto).toBe('Em 2 dias: Netflix — R$ 9,99');
  });
  it('US-13.CA12: lista vazia ou nada na janela não gera nada', () => {
    expect(lembretesDevidos(est([]), HOJE, 7)).toEqual({ itens: [], novos: [] });
    expect(lembretesDevidos(est([sub({ proxima: '2026-12-01' })]), HOJE, 7).itens).toEqual([]);
  });
  it('US-13.CA2: lerDiasLembrete aceita 0 a 7 e rejeita o resto', () => {
    expect(['0', '1', '7', ' 3 '].map(lerDiasLembrete)).toEqual([0, 1, 7, 3]);
    for (const t of ['', '8', '-1', '1,5', 'abc', '1e1', '07x', '100']) expect(lerDiasLembrete(t)).toBeNull();
  });
  it('US-13: textos de antecedência e prefixos', () => {
    expect(textoAntecedencia(0)).toBe('no dia da cobrança');
    expect(textoAntecedencia(1)).toBe('1 dia antes da cobrança');
    expect(textoAntecedencia(3)).toBe('3 dias antes da cobrança');
    expect([0, 1, 4].map(prefixoDias)).toEqual(['Hoje', 'Amanhã', 'Em 4 dias']);
  });
  it('US-13.CA4: registrarAvisados une sem repetir e descarta datas passadas', () => {
    const e = est([sub({ id: 'n', proxima: '2026-10-01' })]);
    const novos = lembretesDevidos(e, HOJE, 1).novos;
    expect(registrarAvisados(['c|velho|2026-09-01', 'c|n|2026-10-01'], novos, HOJE)).toEqual(['c|n|2026-10-01']);
  });
});
