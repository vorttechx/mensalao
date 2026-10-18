// US-09 — Plano grátis × Pro: limite de assinaturas ativas e o que cada plano pode (puro).
import type { Assinatura, Estado } from './tipos';

/** Limite do plano grátis: assinaturas com status "ativa" (inclui as em teste grátis), D-01. */
export const LIMITE_GRATIS = 5;

function lista(e: Estado | Assinatura[]): Assinatura[] {
  return Array.isArray(e) ? e : e.assinaturas;
}

/** Ativas = status "ativa" (pausadas e canceladas não contam; em teste grátis conta). */
export function contarAtivas(e: Estado | Assinatura[]): number {
  return lista(e).filter((a) => a.status === 'ativa').length;
}

/** Pode criar ou reativar mais uma? No grátis, só abaixo de 5 ativas; no Pro, sempre. */
export function podeAtivarMais(e: Estado | Assinatura[], pro: boolean): boolean {
  return pro || contarAtivas(e) < LIMITE_GRATIS;
}

/** Vagas livres no grátis (0 se no limite ou acima); Infinity no Pro. */
export function vagasRestantes(e: Estado | Assinatura[], pro: boolean): number {
  return pro ? Number.POSITIVE_INFINITY : Math.max(0, LIMITE_GRATIS - contarAtivas(e));
}

export function acimaDoLimite(e: Estado | Assinatura[], pro: boolean): boolean {
  return !pro && contarAtivas(e) > LIMITE_GRATIS;
}

/** Texto exato do contador (design 8.2). */
export function textoContador(ativas: number): string {
  const base = `${ativas} de ${LIMITE_GRATIS} assinaturas ativas`;
  return ativas > LIMITE_GRATIS ? `${base} — acima do limite do plano grátis` : base;
}

export interface RecursosPlano {
  assinaturasIlimitadas: boolean;
  lembrete: boolean;
  backupAutomatico: boolean;
  csv: boolean;
  graficos: boolean;
  temas: boolean;
}

/** Ponto único de decisão do que cada plano pode (Definição técnica, "Bloqueio de recursos"). */
export function recursosDoPlano(pro: boolean): RecursosPlano {
  return { assinaturasIlimitadas: pro, lembrete: pro, backupAutomatico: pro, csv: pro, graficos: pro, temas: pro };
}
