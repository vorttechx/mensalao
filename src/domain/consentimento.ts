// US-27 — Estados e transições do consentimento de anúncios (US-27.CA16). Módulo puro: não lê o localStorage,
// não fala com o SDK. Quem guarda é servicos/consentimento.ts; quem mostra é ui/consentimento.ts.
//
// Guardado em `mensalao:anuncios:v1`, separado de `mensalao:v1`: o backup JSON nunca inclui nem concede a
// escolha (US-27.CA13) nem o crédito do premiado (US-28.CA10).
import type { ResolucaoConsentimento } from './anuncios';

export const CHAVE_ANUNCIOS = 'mensalao:anuncios:v1';

/** Versão do texto do aviso. Subir este número faz o app perguntar de novo uma única vez (US-27.CA11). */
export const VERSAO_TEXTO_CONSENTIMENTO = 1;

export type EscolhaAnuncios = 'personalizado' | 'nao-personalizado';

export interface EstadoAnuncios {
  /** null = sem escolha (nunca escolheu, ou o que estava guardado é ilegível, US-27.CA12). */
  readonly escolha: EscolhaAnuncios | null;
  /** Versão do texto do aviso que a pessoa viu ao escolher. */
  readonly versaoTexto: number | null;
  /** Data e hora da escolha (ISO). */
  readonly decididoEm: string | null;
  /** Quantas vezes o app foi aberto (UX-S4-04: nada de anúncio nem aviso na 1ª abertura). */
  readonly aberturas: number;
  /** Exportações CSV ganhas com o anúncio premiado e ainda não usadas (0 ou 1, US-28). */
  readonly credito: number;
}

export const ESTADO_ANUNCIOS_VAZIO: EstadoAnuncios = { escolha: null, versaoTexto: null, decididoEm: null, aberturas: 0, credito: 0 };

const LIMITE_ABERTURAS = 1_000_000;

function inteiroEntre(v: unknown, min: number, max: number): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
}

function dataValida(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 40 && !Number.isNaN(Date.parse(v));
}

/**
 * Lê campo por campo. Um campo ilegível vira o valor seguro sem apagar os outros: a escolha só vale com os
 * três campos dela corretos (senão "sem escolha", US-27.CA12); aberturas e crédito ruins viram 0.
 */
export function lerEstadoAnuncios(bruto: string | null): EstadoAnuncios {
  if (bruto === null) return ESTADO_ANUNCIOS_VAZIO;
  let obj: unknown;
  try {
    obj = JSON.parse(bruto);
  } catch {
    return ESTADO_ANUNCIOS_VAZIO;
  }
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return ESTADO_ANUNCIOS_VAZIO;
  const o = obj as Record<string, unknown>;
  const escolhaOk =
    (o.escolha === 'personalizado' || o.escolha === 'nao-personalizado') &&
    inteiroEntre(o.versaoTexto, 1, 1_000) &&
    dataValida(o.decididoEm);
  return {
    escolha: escolhaOk ? (o.escolha as EscolhaAnuncios) : null,
    versaoTexto: escolhaOk ? (o.versaoTexto as number) : null,
    decididoEm: escolhaOk ? (o.decididoEm as string) : null,
    aberturas: inteiroEntre(o.aberturas, 0, LIMITE_ABERTURAS) ? o.aberturas : 0,
    credito: inteiroEntre(o.credito, 0, 1) ? o.credito : 0,
  };
}

export function serializarEstadoAnuncios(e: EstadoAnuncios): string {
  return JSON.stringify({
    escolha: e.escolha,
    versaoTexto: e.versaoTexto,
    decididoEm: e.decididoEm,
    aberturas: e.aberturas,
    credito: e.credito,
  });
}

/** Conta uma abertura do app (chamado uma vez ao iniciar). */
export function registrarAbertura(e: EstadoAnuncios): EstadoAnuncios {
  return { ...e, aberturas: Math.min(e.aberturas + 1, LIMITE_ABERTURAS) };
}

/** Primeira sessão depois de instalar (UX-S4-04), contada depois de `registrarAbertura`. */
export function ehPrimeiraAbertura(e: EstadoAnuncios): boolean {
  return e.aberturas <= 1;
}

/** Grava a escolha com a data e a versão do texto vigente (vale pelo aviso e por Ajustes, design 14.3). */
export function registrarEscolha(
  e: EstadoAnuncios,
  escolha: EscolhaAnuncios,
  agoraIso: string,
  versao: number = VERSAO_TEXTO_CONSENTIMENTO,
): EstadoAnuncios {
  return { ...e, escolha, versaoTexto: versao, decididoEm: agoraIso };
}

/**
 * A escolha que vale agora: null sem escolha ou quando o texto do aviso mudou depois dela (US-27.CA11).
 * A escolha continua guardada no Pro (US-27.CA10); quem decide se ela tem efeito é `anunciosPermitidos`.
 */
export function escolhaVigente(e: EstadoAnuncios, versao: number = VERSAO_TEXTO_CONSENTIMENTO): EscolhaAnuncios | null {
  if (e.escolha === null || e.versaoTexto === null) return null;
  return e.versaoTexto >= versao ? e.escolha : null;
}

/** Situação do formulário do Google (UMP), como o SDK informa. */
export interface RespostaGoogle {
  readonly exigido: boolean;
  readonly respondido: boolean;
  readonly podeAnunciar: boolean;
}

/** O que o app sabe do UMP nesta abertura. */
export type SituacaoUmp =
  /** Ainda não consultado, ou a consulta está em andamento. */
  | { readonly tipo: 'pendente' }
  /** A consulta falhou (sem rede, serviço fora): nenhum anúncio, tenta de novo depois (US-27.CA5). */
  | { readonly tipo: 'erro' }
  | { readonly tipo: 'ok'; readonly resposta: RespostaGoogle };

/**
 * Junta a escolha do app e a situação do UMP (US-27.CA1 a CA5, CA8, CA11, CA12):
 * - UMP pendente ou com erro: aguardar (nada é pedido ao SDK de anúncios).
 * - UMP exigido (EEE, Reino Unido, Suíça): o formulário do Google, no lugar do aviso do app; respondido e
 *   com base para anunciar, pronto (o próprio SDK aplica o que a pessoa marcou no formulário); respondido
 *   sem base, nenhum anúncio e nenhuma reserva.
 * - UMP não exigido (Brasil e demais): a escolha do app; sem escolha vigente, perguntar.
 */
export function resolverConsentimento(entrada: { escolha: EscolhaAnuncios | null; google: SituacaoUmp }): ResolucaoConsentimento {
  const g = entrada.google;
  if (g.tipo !== 'ok') return { tipo: 'aguardar' };
  if (g.resposta.exigido) {
    if (!g.resposta.respondido) return { tipo: 'formulario-google' };
    return g.resposta.podeAnunciar ? { tipo: 'pronto', personalizado: true } : { tipo: 'sem-base' };
  }
  if (entrada.escolha === null) return { tipo: 'perguntar' };
  return { tipo: 'pronto', personalizado: entrada.escolha === 'personalizado' };
}

/** Em que variante a seção "Anúncios e privacidade" de Ajustes aparece (design 14.3). */
export type VarianteAjustesAnuncios = 'pro' | 'google' | 'com-escolha' | 'sem-escolha';

export function varianteAjustes(entrada: { pro: boolean; escolha: EscolhaAnuncios | null; google: SituacaoUmp }): VarianteAjustesAnuncios {
  if (entrada.pro) return 'pro';
  if (entrada.google.tipo === 'ok' && entrada.google.resposta.exigido) return 'google';
  return entrada.escolha === null ? 'sem-escolha' : 'com-escolha';
}
