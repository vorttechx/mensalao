// US-11 / US-12 — Estado do Mensalão Pro e regras de verificação da compra (puro, sem DOM nem localStorage).
// O estado Pro fica numa chave própria, fora do estado das assinaturas e fora do backup (D-06).

export const CHAVE_PRO = 'mensalao:pro:v1';
/** Produto não consumível cadastrado no Play Console (R-05). */
export const SKU_PRO = 'mensalao_pro';

export interface EstadoPro {
  pro: boolean;
  sku: string | null;
  /** Data e hora (ISO 8601) da última confirmação ou revogação pela loja. */
  verificadoEm: string | null;
}

export const ESTADO_PRO_VAZIO: EstadoPro = { pro: false, sku: null, verificadoEm: null };

/**
 * Lê o JSON de `mensalao:pro:v1`. Qualquer coisa ilegível ou com tipos errados
 * (ex.: `pro: "sim"`) vira "não Pro", sem lançar erro (US-12.CA11).
 */
export function lerEstadoPro(bruto: string | null): EstadoPro {
  if (bruto === null) return { ...ESTADO_PRO_VAZIO };
  let v: unknown;
  try {
    v = JSON.parse(bruto);
  } catch {
    return { ...ESTADO_PRO_VAZIO };
  }
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return { ...ESTADO_PRO_VAZIO };
  const o = v as Record<string, unknown>;
  if (o.pro !== true) return { ...ESTADO_PRO_VAZIO };
  if (o.sku !== SKU_PRO) return { ...ESTADO_PRO_VAZIO };
  const verificadoEm = typeof o.verificadoEm === 'string' ? o.verificadoEm : null;
  return { pro: true, sku: SKU_PRO, verificadoEm };
}

export function estadoProAtivo(agora: string): EstadoPro {
  return { pro: true, sku: SKU_PRO, verificadoEm: agora };
}

export function estadoProRevogado(agora: string): EstadoPro {
  return { pro: false, sku: null, verificadoEm: agora };
}

/** Disponibilidade do provedor de compra nesta abertura. */
export type Disponibilidade = 'verificando' | 'sim' | 'nao';
/** Resultado da consulta à loja nesta abertura. */
export type Confirmacao = 'pendente' | 'confirmado' | 'sem-compra' | 'falha';

/**
 * Plano efetivo (US-12.CA15): com o provedor indisponível o cache nunca é honrado;
 * com a loja respondendo, vale a resposta; sem resposta (pendente, erro, offline), vale o cache.
 */
export function proEfetivo(p: { disponibilidade: Disponibilidade; confirmacao: Confirmacao; cache: EstadoPro }): boolean {
  if (p.disponibilidade === 'nao') return false;
  if (p.confirmacao === 'confirmado') return true;
  if (p.confirmacao === 'sem-compra') return false;
  return p.cache.pro;
}

export type RespostaLoja = { ok: true; skus: string[] } | { ok: false };

/**
 * Aplica a resposta da listagem de compras (US-12.CA5 a CA7):
 * SKU presente → Pro confirmado; loja respondeu sem a compra → revoga; falha → mantém o local.
 */
export function aplicarVerificacao(
  cache: EstadoPro,
  resposta: RespostaLoja,
  agora: string,
): { cache: EstadoPro; confirmacao: Confirmacao; revogado: boolean; gravar: boolean } {
  if (!resposta.ok) return { cache, confirmacao: 'falha', revogado: false, gravar: false };
  if (resposta.skus.includes(SKU_PRO)) return { cache: estadoProAtivo(agora), confirmacao: 'confirmado', revogado: false, gravar: true };
  if (cache.pro) return { cache: estadoProRevogado(agora), confirmacao: 'sem-compra', revogado: true, gravar: true };
  return { cache, confirmacao: 'sem-compra', revogado: false, gravar: false };
}
