// US-28.CA14 — Regra do crédito do anúncio premiado: ganhar, consumir e o limite de 1 (módulo puro).
// O crédito vale UMA exportação da planilha CSV (decisão do Renato no portão GD), não expira e fica em
// `mensalao:anuncios:v1`, fora do backup JSON (US-28.CA10).
import type { ResolucaoConsentimento, PlanoAnuncios } from './anuncios';
import type { EstadoAnuncios } from './consentimento';

export const LIMITE_CREDITO = 1;

/** O SDK confirmou o prêmio: o crédito vai a 1 (nunca acumula acima do limite, US-28.CA6). */
export function ganharCredito(e: EstadoAnuncios): EstadoAnuncios {
  return { ...e, credito: LIMITE_CREDITO };
}

/** O arquivo foi entregue: o crédito é consumido. Erro ou cancelamento não chamam isto (US-28.CA6). */
export function consumirCredito(e: EstadoAnuncios): EstadoAnuncios {
  return { ...e, credito: Math.max(0, e.credito - 1) };
}

export function temCredito(e: EstadoAnuncios): boolean {
  return e.credito > 0;
}

/** O que a linha do premiado mostra dentro de "Exportar planilha CSV" no grátis (design 14.4). */
export type OfertaPremiado = 'nenhuma' | 'oferta' | 'credito';

/**
 * - Pro (efetivo): nada; o CSV é do Pro (US-28.CA7).
 * - Com crédito guardado: o bloco "1 exportação liberada" (usar não depende de anúncio).
 * - Oferta só no grátis confirmado pela loja, com o SDK presente e o consentimento resolvido (US-28.CA8).
 */
export function ofertaPremiado(e: {
  pro: boolean;
  credito: number;
  plano: PlanoAnuncios;
  provedorDisponivel: boolean | null;
  consentimento: ResolucaoConsentimento;
}): OfertaPremiado {
  if (e.pro) return 'nenhuma';
  if (e.credito > 0) return 'credito';
  if (e.plano !== 'gratis' || e.provedorDisponivel !== true) return 'nenhuma';
  return e.consentimento.tipo === 'pronto' ? 'oferta' : 'nenhuma';
}
