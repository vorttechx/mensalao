// US-14 — Cópias automáticas locais (puro): no máximo uma por dia, só se algo mudou, 3 mais recentes (D-08).
// "Agora" vem por parâmetro (US-14.CA12). As cópias ficam em `mensalao:copias:v1`, fora do backup JSON (CA13).
import { diferencaDias, somarDias } from './datas';
import { validarEstado } from './esquema';
import type { Estado } from './tipos';

export const CHAVE_COPIAS = 'mensalao:copias:v1';
export const MAX_COPIAS = 3;
export const DIAS_LEMBRETE_EXPORTAR = 7;

export interface Copia {
  id: string;
  /** Data e hora local "aaaa-mm-ddThh:mm". */
  criadaEm: string;
  /** Dia ISO da cópia (regra de uma por dia). */
  dia: string;
  quantidade: number;
  /** Estado das assinaturas serializado (JSON). */
  conteudo: string;
  /** Cópia danificada: não pode ser restaurada, mas continua na lista (CA6). */
  inutilizavel: boolean;
}

export interface Agora {
  /** Dia ISO "aaaa-mm-dd". */
  dia: string;
  /** Data e hora local "aaaa-mm-ddThh:mm". */
  dataHora: string;
}

export function conteudoDoEstado(estado: Estado): string {
  return JSON.stringify(estado);
}

/** Lê a lista guardada; itens sem data são ignorados, conteúdo ilegível vira cópia "danificada". */
export function lerCopias(bruto: string | null): Copia[] {
  if (bruto === null) return [];
  let v: unknown;
  try {
    v = JSON.parse(bruto);
  } catch {
    return [];
  }
  if (!Array.isArray(v)) return [];
  const lista: Copia[] = [];
  for (const item of v) {
    if (typeof item !== 'object' || item === null) continue;
    const o = item as Record<string, unknown>;
    if (typeof o.criadaEm !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(o.criadaEm)) continue;
    const conteudoOk = typeof o.conteudo === 'string';
    lista.push({
      id: typeof o.id === 'string' ? o.id : o.criadaEm,
      criadaEm: o.criadaEm.slice(0, 16),
      dia: o.criadaEm.slice(0, 10),
      quantidade: typeof o.quantidade === 'number' && Number.isInteger(o.quantidade) && o.quantidade >= 0 ? o.quantidade : 0,
      conteudo: conteudoOk ? (o.conteudo as string) : '',
      inutilizavel: o.inutilizavel === true || !conteudoOk,
    });
  }
  return lista.sort((a, b) => (a.criadaEm < b.criadaEm ? 1 : a.criadaEm > b.criadaEm ? -1 : 0));
}

export function novaCopia(estado: Estado, agora: Agora, id: string): Copia {
  return {
    id,
    criadaEm: agora.dataHora,
    dia: agora.dia,
    quantidade: estado.assinaturas.length,
    conteudo: conteudoDoEstado(estado),
    inutilizavel: false,
  };
}

/** Acrescenta no topo e mantém só as 3 mais recentes (a mais antiga é descartada). */
export function adicionarCopia(copias: readonly Copia[], nova: Copia, max = MAX_COPIAS): Copia[] {
  return [nova, ...copias].slice(0, max);
}

/**
 * Decide se cria a cópia automática agora (CA2, CA3, CA9): lista vazia → não; igual à mais recente → não;
 * já existe cópia hoje → não. Devolve a nova lista ou null.
 */
export function decidirCopia(copias: readonly Copia[], estado: Estado, agora: Agora, id: string): Copia[] | null {
  if (estado.assinaturas.length === 0) return null;
  const maisRecente = copias[0];
  if (maisRecente && maisRecente.conteudo === conteudoDoEstado(estado)) return null;
  if (copias.some((c) => c.dia === agora.dia)) return null;
  return adicionarCopia(copias, novaCopia(estado, agora, id));
}

/**
 * Cópia de segurança antes de restaurar (CA5): ignora a regra de uma por dia, mas não duplica
 * se o estado atual já é igual à cópia mais recente.
 */
export function copiaAntesDeRestaurar(copias: readonly Copia[], estado: Estado, agora: Agora, id: string): Copia[] {
  if (copias[0] && copias[0].conteudo === conteudoDoEstado(estado)) return [...copias];
  return adicionarCopia(copias, novaCopia(estado, agora, id));
}

export type LeituraCopia = { ok: true; estado: Estado } | { ok: false };

/** Valida o conteúdo da cópia com o mesmo esquema do estado salvo. */
export function lerConteudoCopia(c: Copia): LeituraCopia {
  if (c.inutilizavel) return { ok: false };
  try {
    const r = validarEstado(JSON.parse(c.conteudo));
    return r.ok ? { ok: true, estado: r.estado } : { ok: false };
  } catch {
    return { ok: false };
  }
}

export function marcarInutilizavel(copias: readonly Copia[], id: string): Copia[] {
  return copias.map((c) => (c.id === id ? { ...c, inutilizavel: true } : c));
}

/** "18/10/2026 09:12" a partir de "2026-10-18T09:12". */
export function formatarDataHora(dataHora: string): string {
  const [d, h] = dataHora.split('T');
  const [a, m, dia] = d.split('-');
  return `${dia}/${m}/${a} ${h ?? ''}`.trim();
}

export interface InfoExportacao {
  ultimaExportacao: string | null;
  adiadoAte: string | null;
  inicioPro: string | null;
}

/**
 * Lembrete de exportar (CA8): N dias desde a última exportação (ou desde a primeira abertura como Pro),
 * a partir de 7; respeita o "Lembrar depois"; lista vazia não lembra (CA9). Devolve N ou null.
 */
export function diasParaLembrarExportar(info: InfoExportacao, hoje: string, temAssinaturas: boolean): number | null {
  if (!temAssinaturas) return null;
  if (info.adiadoAte && hoje < info.adiadoAte) return null;
  const ref = info.ultimaExportacao ?? info.inicioPro;
  if (!ref) return null;
  const dias = diferencaDias(ref, hoje);
  return Number.isFinite(dias) && dias >= DIAS_LEMBRETE_EXPORTAR ? dias : null;
}

/** "Lembrar depois": adia 7 dias. */
export function adiarLembreteExportar(hoje: string): string {
  return somarDias(hoje, DIAS_LEMBRETE_EXPORTAR);
}
