// Serviço do plano Pro: liga o provedor de compra (via "@ambiente") ao estado Pro guardado no aparelho.
// A UI pergunta `ehPro()` e escuta mudanças; ninguém mais fala com o provedor.
import { criarProvedor } from '@ambiente';
import { gravarChave, lerChave } from '../armazenamento';
import {
  CHAVE_PRO,
  SKU_PRO,
  aplicarVerificacao,
  estadoProAtivo,
  lerEstadoPro,
  proEfetivo,
  type Confirmacao,
  type Disponibilidade,
  type EstadoPro,
} from '../domain/pro';
import { planoParaAnuncios, type PlanoAnuncios } from '../domain/anuncios';
import { comPrazo, type ProvedorCompra, type ResultadoCompra } from '../plataforma/provedor';

/** Prazo da loja na verificação ao abrir e na restauração (depois disso, "sem resposta"). */
const PRAZO_LOJA_MS = 10_000;

const provedor: ProvedorCompra = criarProvedor();
let cache: EstadoPro = lerEstadoPro(lerChave(CHAVE_PRO));
let disponibilidade: Disponibilidade = provedor.tipo === 'indisponivel' ? 'nao' : 'verificando';
let confirmacao: Confirmacao = 'pendente';
let verificacaoIniciada = false;
let avisoRevogacao = false;

export interface MudancaPlano {
  /** O plano efetivo (grátis/Pro) mudou. */
  planoMudou: boolean;
}
const ouvintes = new Set<(m: MudancaPlano) => void>();

export function aoMudarPlano(fn: (m: MudancaPlano) => void): void {
  ouvintes.add(fn);
}

function avisarOuvintes(antes: boolean): void {
  const m = { planoMudou: antes !== ehPro() };
  for (const fn of ouvintes) fn(m);
}

function agora(): string {
  return new Date().toISOString();
}

function gravarCache(novo: EstadoPro): void {
  cache = novo;
  gravarChave(CHAVE_PRO, JSON.stringify(novo));
}

export function ehPro(): boolean {
  return proEfetivo({ disponibilidade, confirmacao, cache });
}

/** Plano visto pelos anúncios (regra conservadora D-08): grátis só depois de a loja responder sem a compra. */
export function planoAnuncios(): PlanoAnuncios {
  return planoParaAnuncios({ confirmacao, cache });
}

export function obterDisponibilidade(): Disponibilidade {
  return disponibilidade;
}

export function tipoProvedor(): ProvedorCompra['tipo'] {
  return provedor.tipo;
}

/**
 * Verificação ao abrir (US-12.CA5 a CA9): no máximo uma vez por abertura, sem bloquear a primeira tela.
 * Compra presente: confirma. Loja respondeu sem a compra: revoga. Falha/offline: mantém o local.
 */
export async function verificarAoAbrir(): Promise<void> {
  if (verificacaoIniciada) return;
  verificacaoIniciada = true;
  const antes = ehPro();
  let disp = false;
  try {
    disp = await comPrazo(provedor.disponivel(), PRAZO_LOJA_MS);
  } catch {
    disp = false;
  }
  disponibilidade = disp ? 'sim' : 'nao';
  if (disp) {
    let resposta: { ok: true; skus: string[] } | { ok: false };
    try {
      resposta = { ok: true, skus: await comPrazo(provedor.listarCompras(), PRAZO_LOJA_MS) };
    } catch {
      resposta = { ok: false };
    }
    const r = aplicarVerificacao(cache, resposta, agora());
    confirmacao = r.confirmacao;
    if (r.gravar) gravarCache(r.cache);
    if (r.revogado) avisoRevogacao = true;
  }
  avisarOuvintes(antes);
}

/** Preço do Pro devolvido pela loja (null se a loja não devolveu o produto). Lança em erro/offline. */
export async function consultarPreco(): Promise<string | null> {
  const d = await comPrazo(provedor.detalhes(SKU_PRO), PRAZO_LOJA_MS);
  return d ? d.preco : null;
}

/** Compra única (US-11.CA4 a CA6). Só "ok" ativa o Pro. */
export async function comprarPro(): Promise<ResultadoCompra> {
  const antes = ehPro();
  let r: ResultadoCompra;
  try {
    r = await provedor.comprar(SKU_PRO);
  } catch {
    r = 'erro';
  }
  if (r === 'ok') {
    confirmacao = 'confirmado';
    gravarCache(estadoProAtivo(agora()));
    avisarOuvintes(antes);
  }
  return r;
}

export type ResultadoRestaurar = 'restaurado' | 'sem-compra' | 'erro';

/** "Restaurar compra" (US-12.CA2 a CA4). */
export async function restaurarCompra(): Promise<ResultadoRestaurar> {
  if (disponibilidade === 'nao') return 'erro';
  const antes = ehPro();
  let skus: string[];
  try {
    skus = await comPrazo(provedor.listarCompras(), PRAZO_LOJA_MS);
  } catch {
    return 'erro';
  }
  if (!skus.includes(SKU_PRO)) return 'sem-compra';
  confirmacao = 'confirmado';
  gravarCache(estadoProAtivo(agora()));
  avisarOuvintes(antes);
  return 'restaurado';
}

/** Aviso único de revogação (US-12.CA6). */
export function haAvisoRevogacao(): boolean {
  return avisoRevogacao;
}
export function fecharAvisoRevogacao(): void {
  avisoRevogacao = false;
}
