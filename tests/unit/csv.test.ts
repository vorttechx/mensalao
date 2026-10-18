import { describe, expect, it } from 'vitest';
import { BOM, CABECALHO_CSV, escaparCampo, gerarCsv, nomeArquivoCsv, protegerFormula, valorCsv } from '../../src/domain/csv';
import { sub } from './fixtures';
import type { Assinatura, Estado } from '../../src/domain/tipos';

const HOJE = '2026-09-30';
const est = (a: Assinatura[]): Estado => ({ versao: 1, config: { diasAviso: 3 }, assinaturas: a });
const linhas = (csv: string) => csv.slice(1).split('\r\n');

describe('CSV (US-15)', () => {
  it('US-15.CA2: nome do arquivo com a data', () => {
    expect(nomeArquivoCsv('2026-10-18')).toBe('mensalao-assinaturas-2026-10-18.csv');
  });
  it('US-15.CA3: BOM, cabeçalho exato, ";" e "\\r\\n"', () => {
    const csv = gerarCsv(est([sub()]), HOJE);
    expect(csv.startsWith(BOM)).toBe(true);
    expect(linhas(csv)[0]).toBe('Nome;Valor;Ciclo;Equivalente mensal;Equivalente anual;Próxima cobrança;Forma de pagamento;Banco/cartão;Categoria;Status;Em teste grátis;Fim do teste;Cancelada em;Criada em');
    expect(CABECALHO_CSV).toHaveLength(14);
    expect(csv.endsWith('\r\n')).toBe(true);
    expect(csv.replace(/\r\n/g, '').includes('\n')).toBe(false);
  });
  it('US-15.CA4: valores com vírgula, sem símbolo nem milhar; datas dd/mm/aaaa; rótulos', () => {
    expect(valorCsv(3990)).toBe('39,90');
    expect(valorCsv(123456)).toBe('1234,56');
    expect(valorCsv(5)).toBe('0,05');
    const l = linhas(gerarCsv(est([sub({ valorCentavos: 123456, proxima: '2026-10-20', criadaEm: '2026-09-01' })]), HOJE))[1].split(';');
    expect(l[0]).toBe('Netflix');
    expect(l[1]).toBe('1234,56');
    expect(l[2]).toBe('Mensal');
    expect(l[5]).toBe('20/10/2026');
    expect(l[9]).toBe('Ativa');
    expect(l[10]).toBe('Não');
    expect(l[13]).toBe('01/09/2026');
  });
  it('US-15.CA5: anual 166,80 → 13,90 e 166,80; semanal 10,00 → 43,33 e 520,00', () => {
    const c = linhas(gerarCsv(est([
      sub({ id: '1', nome: 'A', valorCentavos: 16680, ciclo: 'anual', proxima: '2027-01-10' }),
      sub({ id: '2', nome: 'B', valorCentavos: 1000, ciclo: 'semanal', proxima: '2026-10-02' }),
    ]), HOJE));
    expect(c[1].split(';').slice(3, 5)).toEqual(['13,90', '166,80']);
    expect(c[2].split(';').slice(3, 5)).toEqual(['43,33', '520,00']);
  });
  it('US-15.CA6: inclui todas as situações em ordem alfabética', () => {
    const c = linhas(gerarCsv(est([
      sub({ id: '1', nome: 'Zeta', status: 'ativa' }),
      sub({ id: '2', nome: 'beta', status: 'pausada' }),
      sub({ id: '3', nome: 'Alfa', status: 'cancelada', canceladaEm: '2026-09-10' }),
    ]), HOJE));
    expect(c.slice(1, 4).map((x) => x.split(';')[0])).toEqual(['Alfa', 'beta', 'Zeta']);
    expect(c[1].split(';')[9]).toBe('Cancelada');
    expect(c[1].split(';')[12]).toBe('10/09/2026');
    expect(c[2].split(';')[9]).toBe('Pausada');
  });
  it('US-15.CA7: ponto e vírgula, aspas, vírgula e quebra de linha entram entre aspas', () => {
    expect(escaparCampo('Plano "Família"; 2 telas')).toBe('"Plano ""Família""; 2 telas"');
    expect(escaparCampo('a,b')).toBe('"a,b"');
    expect(escaparCampo('a\nb')).toBe('"a\nb"');
    expect(escaparCampo('simples')).toBe('simples');
    const csv = gerarCsv(est([sub({ nome: 'Plano "Família"; 2 telas' })]), HOJE);
    expect(csv).toContain('"Plano ""Família""; 2 telas";44,90;');
  });
  it('US-15.CA8: apóstrofo antes de = + - @ no texto, não nos números', () => {
    for (const t of ['=1+1', '+1', '-1', '@x']) expect(protegerFormula(t)).toBe("'" + t);
    expect(protegerFormula('Normal')).toBe('Normal');
    const csv = gerarCsv(est([sub({ nome: '=1+1', banco: '@banco', categoria: '-x' })]), HOJE);
    expect(csv).toContain("'=1+1;44,90;");
    expect(csv).toContain("'@banco");
    expect(csv).toContain("'-x");
    expect(valorCsv(4490)).toBe('44,90');
  });
  it('US-15.CA9: acentos e emoji íntegros', () => {
    expect(gerarCsv(est([sub({ nome: 'Cinéfilo 🎬' })]), HOJE)).toContain('Cinéfilo 🎬;');
  });
  it('US-15.CA10: lista vazia gera só o cabeçalho', () => {
    expect(linhas(gerarCsv(est([]), HOJE))).toEqual([CABECALHO_CSV.join(';'), '']);
  });
  it('US-15.CA5: 3 × R$ 0,10 mensal soma sem erro de ponto flutuante', () => {
    const c = linhas(gerarCsv(est([1, 2, 3].map((i) => sub({ id: String(i), nome: 'N' + i, valorCentavos: 10 }))), HOJE));
    const soma = c.slice(1, 4).reduce((s, l) => s + Number(l.split(';')[1].replace(',', '.')) * 100, 0);
    expect(Math.round(soma)).toBe(30);
  });
  it('US-15.CA4: teste grátis mostra Sim e a data de fim', () => {
    const l = linhas(gerarCsv(est([sub({ emTeste: true, fimTeste: '2026-10-05' })]), HOJE))[1].split(';');
    expect(l[10]).toBe('Sim');
    expect(l[11]).toBe('05/10/2026');
  });
  it('US-15.CA12: não altera o estado recebido', () => {
    const e = est([sub({ proxima: '2026-09-01', diaRef: 1 })]);
    const antes = JSON.stringify(e);
    gerarCsv(e, HOJE);
    expect(JSON.stringify(e)).toBe(antes);
  });
});
