// US-15 — Exportar para planilha CSV (puro, sem DOM): UTF-8 com BOM, ";" e "\r\n", pronto para o Excel em português.
import { formatarDataBR } from './datas';
import { normalizarDatas } from './operacoes';
import { equivalenteAnual } from './totais';
import { rotuloCiclo, rotuloPagamento, type Estado, type Status } from './tipos';

export const BOM = '﻿';
export const SEPARADOR = ';';
export const QUEBRA = '\r\n';

export const CABECALHO_CSV = [
  'Nome',
  'Valor',
  'Ciclo',
  'Equivalente mensal',
  'Equivalente anual',
  'Próxima cobrança',
  'Forma de pagamento',
  'Banco/cartão',
  'Categoria',
  'Status',
  'Em teste grátis',
  'Fim do teste',
  'Cancelada em',
  'Criada em',
];

const ROTULO_STATUS: Record<Status, string> = { ativa: 'Ativa', pausada: 'Pausada', cancelada: 'Cancelada' };

/** Centavos (pode ser fracionário) → "1234,56": vírgula decimal, sem símbolo e sem milhar (CA4). */
export function valorCsv(centavos: number): string {
  const c = Math.round(centavos);
  const sinal = c < 0 ? '-' : '';
  const abs = Math.abs(c);
  return `${sinal}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, '0')}`;
}

/** Texto livre: apóstrofo antes de =, +, - ou @ para não virar fórmula na planilha (CA8). */
export function protegerFormula(texto: string): string {
  return /^[=+\-@]/.test(texto) ? `'${texto}` : texto;
}

/** Campo entre aspas (com aspas internas duplicadas) quando tem ; " , ou quebra de linha (CA7). */
export function escaparCampo(texto: string): string {
  return /[;",\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/**
 * Gera o CSV com todas as assinaturas (ativas, pausadas e canceladas) em ordem alfabética (CA6).
 * As datas vencidas são avançadas antes, como no resto do app.
 */
export function gerarCsv(estado: Estado, hoje: string): string {
  const { estado: e } = normalizarDatas(estado, hoje);
  const linhas = [CABECALHO_CSV.map(escaparCampo).join(SEPARADOR)];
  const ordenadas = e.assinaturas.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
  for (const a of ordenadas) {
    const anual = equivalenteAnual(a);
    const texto = (t: string): string => escaparCampo(protegerFormula(t));
    linhas.push(
      [
        texto(a.nome),
        valorCsv(a.valorCentavos),
        rotuloCiclo(a.ciclo),
        valorCsv(anual / 12),
        valorCsv(anual),
        formatarDataBR(a.proxima),
        rotuloPagamento(a.pagamento),
        texto(a.banco),
        texto(a.categoria),
        ROTULO_STATUS[a.status],
        a.emTeste ? 'Sim' : 'Não',
        a.fimTeste ? formatarDataBR(a.fimTeste) : '',
        a.canceladaEm ? formatarDataBR(a.canceladaEm) : '',
        formatarDataBR(a.criadaEm),
      ].join(SEPARADOR),
    );
  }
  return BOM + linhas.join(QUEBRA) + QUEBRA;
}

export function nomeArquivoCsv(hoje: string): string {
  return `mensalao-assinaturas-${hoje}.csv`;
}
