// US-27 — Serviço do consentimento: guarda a escolha em `mensalao:anuncios:v1`, conta as aberturas do app e
// consulta o formulário do Google (UMP). As regras ficam em domain/consentimento.ts.
//
// O UMP só é consultado para o plano grátis efetivo, numa tela com banner, fora da 1ª abertura e com o SDK
// presente (US-27.CA9): quem chama `resolverAgora` é ui/anuncios.ts, depois dessas verificações.
import { gravarChave, lerChave } from '../armazenamento';
import type { ResolucaoConsentimento } from '../domain/anuncios';
import {
  CHAVE_ANUNCIOS,
  ehPrimeiraAbertura,
  escolhaVigente,
  lerEstadoAnuncios,
  registrarAbertura,
  registrarEscolha,
  resolverConsentimento,
  serializarEstadoAnuncios,
  type EscolhaAnuncios,
  type EstadoAnuncios,
  type SituacaoUmp,
} from '../domain/consentimento';
import type { SituacaoGoogle } from '../plataforma/anuncios';
import { avisarMudancaAnuncios, descartarBanner, provedorAnuncios } from './anuncios';

/** Depois de uma falha do UMP, a próxima consulta espera pelo menos este tempo (ou a próxima troca de tela). */
const ESPERA_APOS_FALHA_MS = 30_000;

let primeira = false;
let google: SituacaoUmp = { tipo: 'pendente' };
let consultando: Promise<void> | null = null;
let ultimaFalhaUmp: number | null = null;
let formularioAberto = false;

/** Relê sempre do armazenamento antes de gravar (o crédito do premiado mora na mesma chave). */
export function lerEstado(): EstadoAnuncios {
  return lerEstadoAnuncios(lerChave(CHAVE_ANUNCIOS));
}

export function gravarEstado(e: EstadoAnuncios): boolean {
  return gravarChave(CHAVE_ANUNCIOS, serializarEstadoAnuncios(e));
}

/** Chamado uma vez ao iniciar o app. */
export function registrarAberturaApp(): void {
  const e = registrarAbertura(lerEstado());
  gravarEstado(e);
  primeira = ehPrimeiraAbertura(e);
}

export function primeiraAbertura(): boolean {
  return primeira;
}

export function escolhaAtual(): EscolhaAnuncios | null {
  return escolhaVigente(lerEstado());
}

/** Data da escolha vigente (ISO), para o rodapé de Ajustes. */
export function dataEscolha(): string | null {
  const e = lerEstado();
  return escolhaVigente(e) === null ? null : e.decididoEm;
}

export function situacaoGoogle(): SituacaoUmp {
  return google;
}

const ouvintes = new Set<() => void>();

/** Avisado quando a escolha ou a situação do UMP mudam (ex.: Ajustes atualiza a seção). */
export function aoMudarConsentimento(fn: () => void): () => void {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

function avisar(): void {
  for (const fn of ouvintes) fn();
  avisarMudancaAnuncios();
}

function paraSituacao(s: SituacaoGoogle): SituacaoUmp {
  return { tipo: 'ok', resposta: { exigido: s.exigido, respondido: s.respondido, podeAnunciar: s.podeAnunciar } };
}

/**
 * Consulta o UMP uma vez (sem iniciar o SDK de anúncios). Falhou: fica "erro" e nenhum anúncio é pedido; a
 * próxima oportunidade (troca de tela ou 30 s depois) tenta de novo, sem travar o app (US-27.CA5).
 */
export function consultarGoogle(forcar = false): Promise<void> {
  if (consultando) return consultando;
  if (google.tipo === 'ok' && !forcar) return Promise.resolve();
  if (google.tipo === 'erro' && !forcar && ultimaFalhaUmp !== null && Date.now() - ultimaFalhaUmp < ESPERA_APOS_FALHA_MS) {
    return Promise.resolve();
  }
  const p = provedorAnuncios.consultarConsentimentoGoogle().then(
    (s) => {
      google = paraSituacao(s);
      ultimaFalhaUmp = null;
    },
    () => {
      google = { tipo: 'erro' };
      ultimaFalhaUmp = Date.now();
    },
  );
  consultando = p.finally(() => {
    consultando = null;
    avisar();
  });
  return consultando;
}

/**
 * A resolução que vale agora. Pode disparar a consulta ao UMP (só chamada para o plano grátis efetivo numa
 * tela com banner). `trocou` = acabou de entrar na tela: depois de uma falha, é a próxima oportunidade.
 */
export function resolverAgora(trocou: boolean): ResolucaoConsentimento {
  if (google.tipo === 'pendente' || google.tipo === 'erro') void consultarGoogle(trocou && google.tipo === 'erro');
  return resolverConsentimento({ escolha: escolhaAtual(), google });
}

/** A resolução sem efeitos colaterais (não consulta o UMP): usada pela oferta do premiado. */
export function resolucaoAtual(): ResolucaoConsentimento {
  return resolverConsentimento({ escolha: escolhaAtual(), google });
}

/** Grava a escolha do aviso ou de Ajustes. Efeito imediato: o banner atual sai e volta no novo modo (US-27.CA7). */
export function escolher(escolha: EscolhaAnuncios): void {
  const antes = escolhaAtual();
  gravarEstado(registrarEscolha(lerEstado(), escolha, new Date().toISOString()));
  if (antes !== null && antes !== escolha) void descartarBanner();
  avisar();
}

/** Mostra o formulário do UMP (EEE, Reino Unido, Suíça), no lugar do aviso do app (US-27.CA4). */
export async function mostrarFormularioGoogle(): Promise<void> {
  if (formularioAberto) return;
  formularioAberto = true;
  try {
    google = paraSituacao(await provedorAnuncios.mostrarFormularioGoogle());
    ultimaFalhaUmp = null;
  } catch {
    google = { tipo: 'erro' };
    ultimaFalhaUmp = Date.now();
  } finally {
    formularioAberto = false;
  }
  await descartarBanner(); // as respostas podem ter mudado: o próximo banner é uma requisição nova
  avisar();
}

/** "Opções de privacidade do Google" em Ajustes: reabre o formulário e relê a situação. */
export async function abrirOpcoesGoogle(): Promise<void> {
  try {
    await provedorAnuncios.abrirOpcoesPrivacidade();
  } catch {
    // o formulário não abriu; a situação anterior continua valendo
  }
  await descartarBanner();
  await consultarGoogle(true);
}

/** Só para a seção de Ajustes: consulta o UMP se ainda não se sabe a região (plano grátis efetivo). */
export function conhecerRegiao(): void {
  if (google.tipo === 'pendente') void consultarGoogle();
}
