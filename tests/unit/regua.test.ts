// US-20 — Régua do mês (design 3.6): marcasDoMes, legendaRegua e textoRegua (src/domain/regua.ts).
import { describe, expect, it } from 'vitest';
import { ALTURA_MINIMA, legendaRegua, marcasDoMes, textoRegua } from '../../src/domain/regua';
import { sub } from './fixtures';

// Dados dos exemplos do design: hoje = domingo, 18/10/2026.
const HOJE = '2026-10-18';
const academia = sub({ id: 'ac', nome: 'Academia', valorCentavos: 9990, proxima: '2026-11-05', diaRef: 5 });
const spotify = sub({ id: 'sp', nome: 'Spotify', valorCentavos: 2190, proxima: '2026-10-18', diaRef: 18 });
const netflix = sub({ id: 'nf', nome: 'Netflix', valorCentavos: 4490, proxima: '2026-10-19', diaRef: 19 });

describe('US-20 régua do mês: marcasDoMes', () => {
  it('US-20.CA2 / design 3.6: cobrança de um ciclo antes entra como já cobrada; hoje e depois como a cobrar', () => {
    const r = marcasDoMes([academia, spotify, netflix], HOJE);
    expect(r).toMatchObject({ ano: 2026, mes: 10, dias: 31, hoje: 18 });
    expect(r.cobrancas.map((c) => [c.dia, c.nome, c.jaCobrada])).toEqual([
      [5, 'Academia', true],
      [18, 'Spotify', false],
      [19, 'Netflix', false],
    ]);
    expect(r.marcas.map((m) => m.dia)).toEqual([5, 18, 19]);
    expect(r.marcas.find((m) => m.dia === 5)!.jaCobrada).toBe(true);
    expect(r.marcas.find((m) => m.dia === 18)!.jaCobrada).toBe(false);
  });

  it('design 3.6: a maior soma do mês tem 100% e as demais são proporcionais, com mínimo de 18%', () => {
    const pequena = sub({ id: 'p', nome: 'Pequena', valorCentavos: 590, proxima: '2026-10-25', diaRef: 25 });
    const r = marcasDoMes([academia, netflix, pequena], HOJE);
    const alt = Object.fromEntries(r.marcas.map((m) => [m.dia, m.alturaPct]));
    expect(alt[5]).toBe(100);
    expect(alt[19]).toBe(Math.round((4490 / 9990) * 100));
    expect(alt[25]).toBe(ALTURA_MINIMA);
    expect(ALTURA_MINIMA).toBe(18);
    for (const m of r.marcas) {
      expect(m.alturaPct).toBeGreaterThanOrEqual(18);
      expect(m.alturaPct).toBeLessThanOrEqual(100);
    }
  });

  it('design 3.6: cobranças no mesmo dia somam numa única marca', () => {
    const outra = sub({ id: 'o', nome: 'Outra', valorCentavos: 1000, proxima: '2026-10-19', diaRef: 19 });
    const r = marcasDoMes([netflix, outra], HOJE);
    expect(r.marcas).toHaveLength(1);
    expect(r.marcas[0]).toMatchObject({ dia: 19, totalCentavos: 5490, alturaPct: 100, jaCobrada: false });
    expect(r.cobrancas.map((c) => c.nome)).toEqual(['Netflix', 'Outra']);
  });

  it('design 3.6: semanal recua de 7 em 7 dias e mostra todas as cobranças do mês', () => {
    const semanal = sub({ id: 's', nome: 'Semanal', ciclo: 'semanal', valorCentavos: 1500, proxima: '2026-10-20', diaRef: 20 });
    const r = marcasDoMes([semanal], HOJE);
    expect(r.cobrancas.map((c) => [c.data, c.jaCobrada])).toEqual([
      ['2026-10-06', true],
      ['2026-10-13', true],
      ['2026-10-20', false],
      ['2026-10-27', false],
    ]);
  });

  it('design 3.6: anual só entra no mês em que a cobrança cai (um ano antes da próxima)', () => {
    const anualNoMes = sub({ id: 'a1', nome: 'Anual Out', ciclo: 'anual', proxima: '2027-10-10', diaRef: 10 });
    const anualFora = sub({ id: 'a2', nome: 'Anual Mar', ciclo: 'anual', proxima: '2027-03-01', diaRef: 1 });
    const r = marcasDoMes([anualNoMes, anualFora], HOJE);
    expect(r.cobrancas.map((c) => [c.data, c.jaCobrada])).toEqual([['2026-10-10', true]]);
  });

  it('design 3.6: pausadas e canceladas não entram', () => {
    const r = marcasDoMes(
      [sub({ id: '1', status: 'pausada' }), sub({ id: '2', status: 'cancelada', canceladaEm: '2026-10-01' })],
      HOJE,
    );
    expect(r.cobrancas).toEqual([]);
    expect(r.marcas).toEqual([]);
  });

  it('design 3.6: teste grátis vigente só conta a partir da próxima (não recua um ciclo)', () => {
    const teste = sub({ id: 't', nome: 'Teste', ciclo: 'semanal', proxima: '2026-10-20', diaRef: 20, emTeste: true, fimTeste: '2026-10-20' });
    expect(marcasDoMes([teste], HOJE).cobrancas.map((c) => c.data)).toEqual(['2026-10-20', '2026-10-27']);
    // Teste que já terminou volta a ser cobrança normal (recua um ciclo).
    const encerrado = { ...teste, fimTeste: '2026-10-01' };
    expect(marcasDoMes([encerrado], HOJE).cobrancas.map((c) => c.data)).toEqual(['2026-10-06', '2026-10-13', '2026-10-20', '2026-10-27']);
  });

  it('design 3.6: meses de 28, 30 e 31 dias', () => {
    expect(marcasDoMes([], '2027-02-10').dias).toBe(28);
    expect(marcasDoMes([], '2028-02-10').dias).toBe(29);
    expect(marcasDoMes([], '2026-11-10').dias).toBe(30);
    expect(marcasDoMes([], '2026-12-31')).toMatchObject({ dias: 31, hoje: 31 });
  });

  it('design 3.6: mensal de dia 31 cai no último dia em mês de 30', () => {
    const d31 = sub({ id: 'd', nome: 'Dia31', proxima: '2026-11-30', diaRef: 31 });
    const r = marcasDoMes([d31], '2026-11-10');
    expect(r.cobrancas.map((c) => c.data)).toEqual(['2026-11-30']);
  });

  it('assinatura com data inválida é ignorada sem travar', () => {
    expect(() => marcasDoMes([sub({ proxima: 'xx' })], HOJE)).not.toThrow();
    expect(marcasDoMes([sub({ proxima: 'xx' })], HOJE).cobrancas).toEqual([]);
  });
});

describe('US-20 régua do mês: legenda', () => {
  it('design 3.6: "1 out", "hoje, 18" e "31" no meio do mês', () => {
    expect(legendaRegua(marcasDoMes([], HOJE))).toEqual({ inicio: '1 out', hoje: 'hoje, 18', fim: '31' });
  });
  it('design 3.6: hoje nos dias 1 a 4 some o "1 out"; no dia 5 aparece', () => {
    expect(legendaRegua(marcasDoMes([], '2026-10-04')).inicio).toBeNull();
    expect(legendaRegua(marcasDoMes([], '2026-10-01')).inicio).toBeNull();
    expect(legendaRegua(marcasDoMes([], '2026-10-05')).inicio).toBe('1 out');
  });
  it('design 3.6: nos 4 últimos dias some o número final', () => {
    expect(legendaRegua(marcasDoMes([], '2026-10-27')).fim).toBe('31');
    expect(legendaRegua(marcasDoMes([], '2026-10-28')).fim).toBeNull();
    expect(legendaRegua(marcasDoMes([], '2026-11-27')).fim).toBeNull();
    expect(legendaRegua(marcasDoMes([], '2027-02-24')).fim).toBe('28');
    expect(legendaRegua(marcasDoMes([], '2027-02-25')).fim).toBeNull();
  });
});

describe('US-20.CA2 régua do mês: texto para leitor de tela', () => {
  it('US-20.CA2: o texto do exemplo do design', () => {
    expect(textoRegua(marcasDoMes([academia, spotify, netflix], HOJE))).toBe(
      'Cobranças de outubro. Já saiu: dia 5, Academia, R$ 99,90. Faltam: hoje, Spotify, R$ 21,90; dia 19, Netflix, R$ 44,90.',
    );
  });
  it('US-20.CA2: sem cobranças, "Nenhuma cobrança em outubro."', () => {
    expect(textoRegua(marcasDoMes([], HOJE))).toBe('Nenhuma cobrança em outubro.');
    expect(textoRegua(marcasDoMes([sub({ status: 'pausada' })], HOJE))).toBe('Nenhuma cobrança em outubro.');
  });
  it('US-20.CA2: só cobranças futuras ou só já cobradas omitem a outra parte', () => {
    expect(textoRegua(marcasDoMes([netflix], HOJE))).toBe('Cobranças de outubro. Faltam: dia 19, Netflix, R$ 44,90.');
    expect(textoRegua(marcasDoMes([academia], HOJE))).toBe('Cobranças de outubro. Já saiu: dia 5, Academia, R$ 99,90.');
  });
  it('US-20.CA2: o texto traz todas as cobranças da régua (nenhuma informação só no desenho)', () => {
    const semanal = sub({ id: 's', nome: 'Semanal', ciclo: 'semanal', valorCentavos: 1500, proxima: '2026-10-20', diaRef: 20 });
    const r = marcasDoMes([academia, spotify, netflix, semanal], HOJE);
    const t = textoRegua(r);
    for (const c of r.cobrancas) expect(t).toContain(c.dia === 18 ? `hoje, ${c.nome}` : `dia ${c.dia}, ${c.nome}`);
    expect(r.cobrancas).toHaveLength(7);
  });
});
