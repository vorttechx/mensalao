// US-07 — Backup em JSON: geração e leitura/validação (puro; nada sai do aparelho).
import { validarConteudo } from './esquema';
import { normalizarDatas } from './operacoes';
import type { Assinatura, Config, Estado } from './tipos';

export const FORMATO_BACKUP = 'mensalao-backup';
export const VERSAO_BACKUP = 1;

export interface BackupV1 {
  formato: typeof FORMATO_BACKUP;
  versao: typeof VERSAO_BACKUP;
  /** Data e hora da exportação (ISO 8601). */
  exportadoEm: string;
  config: Config;
  assinaturas: Assinatura[];
}

export function gerarBackup(estado: Estado, exportadoEm: string): BackupV1 {
  return {
    formato: FORMATO_BACKUP,
    versao: VERSAO_BACKUP,
    exportadoEm,
    config: { ...estado.config },
    assinaturas: estado.assinaturas.map((a) => ({ ...a, historico: a.historico.map((m) => ({ ...m })) })),
  };
}

/** "mensalao-backup-aaaa-mm-dd.json" a partir da data ISO de hoje. */
export function nomeArquivoBackup(hoje: string): string {
  return `mensalao-backup-${hoje}.json`;
}

export type MotivoErroBackup = 'json' | 'formato' | 'versao' | 'valores';
export type ResultadoBackup = { ok: true; estado: Estado; quantidade: number } | { ok: false; motivo: MotivoErroBackup };

/**
 * Lê o texto do arquivo e valida tudo antes de devolver o novo estado.
 * Datas de cobrança vencidas são avançadas para o próximo ciclo (US-07.CA6).
 */
export function lerBackup(texto: string, hoje: string): ResultadoBackup {
  let dados: unknown;
  try {
    dados = JSON.parse(texto);
  } catch {
    return { ok: false, motivo: 'json' };
  }
  if (typeof dados !== 'object' || dados === null || Array.isArray(dados)) return { ok: false, motivo: 'formato' };
  const obj = dados as Record<string, unknown>;
  if (obj.formato !== FORMATO_BACKUP) return { ok: false, motivo: 'formato' };
  if (obj.versao !== VERSAO_BACKUP) return { ok: false, motivo: 'versao' };
  const r = validarConteudo(obj.config, obj.assinaturas);
  if (!r.ok) return { ok: false, motivo: r.motivo };
  const { estado } = normalizarDatas(r.estado, hoje);
  return { ok: true, estado, quantidade: estado.assinaturas.length };
}

/** Mensagem de erro para o usuário (design.md 4.7). */
export function mensagensErroBackup(motivo: MotivoErroBackup): string[] {
  const base = 'Não foi possível importar. O arquivo não é um backup válido do Mensalão. Seus dados atuais não foram alterados.';
  if (motivo === 'versao') return [base, 'Versão do backup desconhecida.'];
  if (motivo === 'valores') return [base, 'Há valores ou datas inválidos no arquivo.'];
  return [base];
}
