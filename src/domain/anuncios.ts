// US-25 / US-26 — Decisão de mostrar anúncio (puro, sem DOM, sem SDK, sem localStorage). A UI consulta só
// `anunciosPermitidos`; ninguém fala com o provedor de anúncios sem passar por esta decisão (Definição técnica).
import type { Confirmacao, EstadoPro } from './pro';

/** Telas com banner (D-06): Início, Assinaturas (lista) e Totais. Todo o resto é "outra". */
export type TelaAnuncio = 'inicio' | 'assinaturas' | 'totais' | 'outra';
export const TELAS_COM_BANNER: readonly TelaAnuncio[] = ['inicio', 'assinaturas', 'totais'];

/**
 * Plano visto pelos anúncios (D-08, regra conservadora): só é 'gratis' quando a loja respondeu nesta
 * abertura sem a compra. Pro em cache sem resposta, estado desconhecido (primeira abertura, loja fora,
 * estado ilegível) e Pro confirmado nunca veem anúncio.
 */
export type PlanoAnuncios = 'gratis' | 'pro' | 'pro-cache' | 'desconhecido';

export function planoParaAnuncios(p: { confirmacao: Confirmacao; cache: EstadoPro }): PlanoAnuncios {
  if (p.confirmacao === 'confirmado') return 'pro';
  if (p.confirmacao === 'sem-compra') return 'gratis'; // inclui o Pro revogado (US-26.CA4)
  if (p.cache.pro) return 'pro-cache';
  return 'desconhecido';
}

/** Consentimento já resolvido (ver domain/consentimento.ts). */
export type ResolucaoConsentimento =
  /** Pode anunciar; personalizado=false pede com npa=1. */
  | { tipo: 'pronto'; personalizado: boolean }
  /** Sem escolha válida: o aviso do app (Brasil e demais regiões, D-02). */
  | { tipo: 'perguntar' }
  /** EEE, Reino Unido, Suíça: o formulário do UMP, no lugar do aviso (US-27.CA4). */
  | { tipo: 'formulario-google' }
  /** Ainda sem resposta do UMP, ou o UMP falhou: nenhum anúncio, tenta de novo depois (US-27.CA5). */
  | { tipo: 'aguardar' }
  /** UMP respondido sem base para anúncio nenhum (US-27.CA8). */
  | { tipo: 'sem-base' };

export type MotivoSemAnuncio = 'plano' | 'tela' | 'primeira-abertura' | 'provedor' | 'offline' | 'espaco' | 'consentimento';

export type DecisaoAnuncio =
  | { tipo: 'mostrar'; personalizado: boolean }
  | { tipo: 'perguntar' }
  | { tipo: 'formulario-google' }
  | { tipo: 'nao'; motivo: MotivoSemAnuncio };

export interface EntradaDecisao {
  plano: PlanoAnuncios;
  tela: TelaAnuncio;
  /** Primeira sessão depois de instalar (UX-S4-04): sem aviso e sem banner. */
  primeiraAbertura: boolean;
  /** O SDK existe no aparelho (null = ainda verificando). */
  provedorDisponivel: boolean | null;
  online: boolean;
  /** A faixa cabe na regra dos 20% (US-25.CA9/CA10). */
  cabe: boolean;
  consentimento: ResolucaoConsentimento;
}

const nao = (motivo: MotivoSemAnuncio): DecisaoAnuncio => ({ tipo: 'nao', motivo });

/**
 * Ponto único da decisão (US-26.CA12). A ordem importa: Pro e telas sem banner nunca chegam a perguntar
 * consentimento nem a consultar o UMP; o aviso só aparece quando um banner de fato iria aparecer.
 */
export function anunciosPermitidos(e: EntradaDecisao): DecisaoAnuncio {
  if (e.plano !== 'gratis') return nao('plano');
  if (!TELAS_COM_BANNER.includes(e.tela)) return nao('tela');
  if (e.primeiraAbertura) return nao('primeira-abertura');
  if (e.provedorDisponivel !== true) return nao('provedor');
  if (!e.online) return nao('offline');
  if (!e.cabe) return nao('espaco');
  switch (e.consentimento.tipo) {
    case 'pronto':
      return { tipo: 'mostrar', personalizado: e.consentimento.personalizado };
    case 'perguntar':
      return { tipo: 'perguntar' };
    case 'formulario-google':
      return { tipo: 'formulario-google' };
    default:
      return nao('consentimento');
  }
}

/* ---------- Faixa do banner (design 13 e 14.1) ---------- */

/** Altura padrão do banner até o SDK informar a real (design 13). */
export const ALTURA_BANNER_PADRAO = 56;
/** Fio + 8 px + rótulo de 16 px + 4 px (design 13). */
export const CABECA_FAIXA = 28;
/** Papel entre o banner e a barra de abas (US-25.CA3: mínimo 16). */
export const RESPIRO_FAIXA = 16;

export function alturaFaixa(alturaBanner: number): number {
  return CABECA_FAIXA + (alturaBanner > 0 ? alturaBanner : ALTURA_BANNER_PADRAO) + RESPIRO_FAIXA;
}

/**
 * Regra dos 20% (US-25.CA9/CA10, UX-S4-03): a faixa inteira não pode passar de 20% da altura útil
 * (janela menos a barra de abas, que já inclui a área segura de baixo). Em paisagem baixa, o banner sai.
 */
export function faixaCabe(p: { alturaJanela: number; alturaAbas: number; alturaBanner: number }): boolean {
  const util = p.alturaJanela - p.alturaAbas;
  return util > 0 && alturaFaixa(p.alturaBanner) <= 0.2 * util;
}

/** Margem inferior do banner nativo: barra de abas (sem a área segura, que o plugin soma) + 16 px. */
export function margemBanner(alturaAbasSemAreaSegura: number): number {
  return Math.ceil(alturaAbasSemAreaSegura) + RESPIRO_FAIXA;
}

/** US-25.CA6: depois de "sem anúncio" ou erro, no máximo uma nova tentativa a cada 60 s. */
export const INTERVALO_NOVA_TENTATIVA_MS = 60_000;

export function podeTentarDeNovo(ultimaFalhaEm: number | null, agora: number): boolean {
  return ultimaFalhaEm === null || agora - ultimaFalhaEm >= INTERVALO_NOVA_TENTATIVA_MS;
}

/** Código de erro do SDK do Google → resultado do banner (3 = sem anúncio disponível, "no fill"). */
export function resultadoDeErroBanner(codigo: number | string | null | undefined): 'sem-anuncio' | 'erro' {
  return Number(codigo) === 3 ? 'sem-anuncio' : 'erro';
}
