import { describe, expect, it } from 'vitest';
import { listarProximas, textoFimTeste, textoVenceLogo, testeEncerrado, testeVigente } from '../../src/domain/proximas';
import { sub } from './fixtures';

const HOJE = '2026-09-30';

describe('listarProximas', () => {
  it('US-02.CA1: ordena por data e desempata por nome', () => {
    const l = listarProximas([
      sub({ id: '1', nome: 'Zeta', proxima: '2026-10-05' }),
      sub({ id: '2', nome: 'Beta', proxima: '2026-10-05' }),
      sub({ id: '3', nome: 'Alfa', proxima: '2026-10-20' }),
      sub({ id: '4', nome: 'Primeira', proxima: '2026-10-01' }),
    ], HOJE, 3);
    expect(l.map((i) => i.assinatura.nome)).toEqual(['Primeira', 'Beta', 'Zeta', 'Alfa']);
  });
  it('US-02.CA2: N=3, hoje 30/09: 30/09 e 03/10 destacam, 04/10 não', () => {
    const l = listarProximas([
      sub({ id: '1', proxima: '2026-09-30' }), sub({ id: '2', proxima: '2026-10-03' }), sub({ id: '3', proxima: '2026-10-04' }),
    ], HOJE, 3);
    expect(l.map((i) => i.seloVence)).toEqual([true, true, false]);
    expect(textoVenceLogo(0)).toBe('hoje');
    expect(textoVenceLogo(3)).toBe('em 3 dias');
  });
  it('US-02.CA3: N=7 amplia o destaque; N=0 só hoje', () => {
    const subs = [sub({ id: '1', proxima: '2026-10-04' }), sub({ id: '2', proxima: '2026-09-30' })];
    expect(listarProximas(subs, HOJE, 7).every((i) => i.seloVence)).toBe(true);
    expect(listarProximas(subs, HOJE, 0).map((i) => i.seloVence)).toEqual([true, false]);
  });
  it('US-02.CA7: teste vigente perto do fim ganha selo de teste', () => {
    const [i] = listarProximas([sub({ emTeste: true, fimTeste: '2026-10-02' })], HOJE, 3);
    expect(i.seloTeste).toBe(true);
    expect(i.diasFimTeste).toBe(2);
    expect(textoFimTeste(2)).toBe('Teste grátis termina em 2 dias');
  });
  it('US-02.CA7: teste longe do fim não ganha selo', () => {
    const [i] = listarProximas([sub({ emTeste: true, fimTeste: '2026-10-20' })], HOJE, 3);
    expect(i.seloTeste).toBe(false);
  });
  it('US-02.CA8: teste encerrado informa a data e deixa de ser teste', () => {
    const a = sub({ emTeste: true, fimTeste: '2026-09-25' });
    const [i] = listarProximas([a], HOJE, 3);
    expect(i.testeTerminouEm).toBe('2026-09-25');
    expect(i.seloTeste).toBe(false);
    expect(testeEncerrado(a, HOJE)).toBe(true);
    expect(testeVigente(a, HOJE)).toBe(false);
  });
  it('US-02.CA9: lista vazia', () => {
    expect(listarProximas([], HOJE, 3)).toEqual([]);
  });
  it('US-02.CA10: pausadas e canceladas ficam fora', () => {
    const l = listarProximas([sub({ id: '1', status: 'pausada' }), sub({ id: '2', status: 'cancelada', canceladaEm: HOJE }), sub({ id: '3' })], HOJE, 3);
    expect(l).toHaveLength(1);
  });
});
