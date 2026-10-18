import { describe, expect, it } from 'vitest';
import {
  adicionarCopia, adiarLembreteExportar, copiaAntesDeRestaurar, decidirCopia, diasParaLembrarExportar, formatarDataHora,
  lerConteudoCopia, lerCopias, marcarInutilizavel, novaCopia, conteudoDoEstado, type Copia,
} from '../../src/domain/copias';
import { sub } from './fixtures';
import type { Estado } from '../../src/domain/tipos';

const est = (n: number, nome = 'Netflix'): Estado => ({ versao: 1, config: { diasAviso: 3 }, assinaturas: Array.from({ length: n }, (_, i) => sub({ id: String(i), nome })) });
const ag = (dia: string, hm = '09:00') => ({ dia, dataHora: `${dia}T${hm}` });

describe('cópias automáticas (US-14)', () => {
  it('US-14.CA2: primeira cópia é criada com data, hora e quantidade', () => {
    const l = decidirCopia([], est(2), ag('2026-10-18', '09:12'), 'a')!;
    expect(l).toHaveLength(1);
    expect(l[0]).toMatchObject({ criadaEm: '2026-10-18T09:12', quantidade: 2, inutilizavel: false });
  });
  it('US-14.CA3: estado igual à cópia mais recente não cria nova', () => {
    const l = decidirCopia([], est(1), ag('2026-10-18'), 'a')!;
    expect(decidirCopia(l, est(1), ag('2026-10-19'), 'b')).toBeNull();
  });
  it('US-14.CA2: no máximo uma por dia, mesmo com mudança', () => {
    const l = decidirCopia([], est(1), ag('2026-10-18'), 'a')!;
    expect(decidirCopia(l, est(2), ag('2026-10-18', '20:00'), 'b')).toBeNull();
    expect(decidirCopia(l, est(2), ag('2026-10-19'), 'b')).toHaveLength(2);
  });
  it('US-14.CA2: mantém só as 3 mais recentes', () => {
    let l: Copia[] = [];
    for (let d = 1; d <= 5; d++) l = decidirCopia(l, est(d), ag(`2026-10-0${d}`), `c${d}`)!;
    expect(l.map((c) => c.id)).toEqual(['c5', 'c4', 'c3']);
  });
  it('US-14.CA9: lista vazia não cria cópia', () => {
    expect(decidirCopia([], est(0), ag('2026-10-18'), 'a')).toBeNull();
  });
  it('US-14.CA5: cópia antes de restaurar ignora a regra do dia, mas não duplica se igual', () => {
    const l = decidirCopia([], est(1), ag('2026-10-18'), 'a')!;
    const depois = copiaAntesDeRestaurar(l, est(3), ag('2026-10-18', '10:00'), 'seg');
    expect(depois.map((c) => c.id)).toEqual(['seg', 'a']);
    expect(copiaAntesDeRestaurar(l, est(1), ag('2026-10-18', '10:00'), 'dup')).toHaveLength(1);
  });
  it('US-14.CA4: formata dd/mm/aaaa hh:mm', () => {
    expect(formatarDataHora('2026-10-18T09:12')).toBe('18/10/2026 09:12');
  });
  it('US-14.CA6: conteúdo válido é lido; corrompido ou marcado inutilizável falha', () => {
    const boa = novaCopia(est(2), ag('2026-10-18'), 'a');
    const r = lerConteudoCopia(boa);
    expect(r.ok && r.estado.assinaturas.length).toBe(2);
    expect(lerConteudoCopia({ ...boa, conteudo: '{nao json' }).ok).toBe(false);
    expect(lerConteudoCopia({ ...boa, conteudo: '{"versao":1}' }).ok).toBe(false);
    expect(lerConteudoCopia({ ...boa, inutilizavel: true }).ok).toBe(false);
  });
  it('US-14.CA6: marcarInutilizavel mantém a cópia na lista', () => {
    const l = decidirCopia([], est(1), ag('2026-10-18'), 'a')!;
    const m = marcarInutilizavel(l, 'a');
    expect(m).toHaveLength(1);
    expect(m[0].inutilizavel).toBe(true);
  });
  it('US-14: lerCopias tolera lixo, ordena da mais nova para a mais antiga', () => {
    expect(lerCopias(null)).toEqual([]);
    expect(lerCopias('{')).toEqual([]);
    expect(lerCopias('{}')).toEqual([]);
    const bruto = JSON.stringify([
      { id: 'a', criadaEm: '2026-10-01T08:00', conteudo: conteudoDoEstado(est(1)), quantidade: 1 },
      { id: 'b', criadaEm: '2026-10-05T08:00', conteudo: conteudoDoEstado(est(1)), quantidade: 1 },
      { id: 'sem-data', conteudo: 'x' },
      null,
      { id: 'c', criadaEm: '2026-10-03T08:00', quantidade: 1 },
    ]);
    const l = lerCopias(bruto);
    expect(l.map((c) => c.id)).toEqual(['b', 'c', 'a']);
    expect(l.find((c) => c.id === 'c')!.inutilizavel).toBe(true);
  });
  it('US-14.CA2: adicionarCopia respeita o máximo', () => {
    const c = (id: string): Copia => novaCopia(est(1), ag('2026-10-01'), id);
    expect(adicionarCopia([c('1'), c('2'), c('3')], c('4')).map((x) => x.id)).toEqual(['4', '1', '2']);
  });
});

describe('lembrete de exportar (US-14.CA8)', () => {
  const info = (o: Partial<{ ultimaExportacao: string | null; adiadoAte: string | null; inicioPro: string | null }> = {}) => ({ ultimaExportacao: null, adiadoAte: null, inicioPro: null, ...o });
  it('6 dias não lembra; 7 dias lembra', () => {
    expect(diasParaLembrarExportar(info({ ultimaExportacao: '2026-10-12' }), '2026-10-18', true)).toBeNull();
    expect(diasParaLembrarExportar(info({ ultimaExportacao: '2026-10-11' }), '2026-10-18', true)).toBe(7);
    expect(diasParaLembrarExportar(info({ ultimaExportacao: '2026-09-18' }), '2026-10-18', true)).toBe(30);
  });
  it('sem exportação usa a primeira abertura como Pro; sem nenhuma referência não lembra', () => {
    expect(diasParaLembrarExportar(info({ inicioPro: '2026-10-01' }), '2026-10-18', true)).toBe(17);
    expect(diasParaLembrarExportar(info(), '2026-10-18', true)).toBeNull();
  });
  it('a última exportação tem prioridade sobre o início do Pro', () => {
    expect(diasParaLembrarExportar(info({ ultimaExportacao: '2026-10-17', inicioPro: '2026-01-01' }), '2026-10-18', true)).toBeNull();
  });
  it('US-14.CA9: lista vazia não lembra', () => {
    expect(diasParaLembrarExportar(info({ ultimaExportacao: '2026-01-01' }), '2026-10-18', false)).toBeNull();
  });
  it('"Lembrar depois" adia 7 dias', () => {
    const ate = adiarLembreteExportar('2026-10-18');
    expect(ate).toBe('2026-10-25');
    expect(diasParaLembrarExportar(info({ ultimaExportacao: '2026-01-01', adiadoAte: ate }), '2026-10-24', true)).toBeNull();
    expect(diasParaLembrarExportar(info({ ultimaExportacao: '2026-01-01', adiadoAte: ate }), '2026-10-25', true)).not.toBeNull();
  });
});
