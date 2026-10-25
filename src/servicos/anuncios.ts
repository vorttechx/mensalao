// US-25 — Serviço de anúncios: liga o provedor (via "@ambiente") às regras de domain/anuncios.ts. Controla
// o que o SDK faz (iniciar, pedir, retomar, esconder) e o intervalo de 60 s entre tentativas. Quem decide SE
// pode haver anúncio é `anunciosPermitidos`; este serviço só é chamado depois dessa decisão.
import { criarProvedorAnuncios } from '@ambiente';
import { podeTentarDeNovo } from '../domain/anuncios';
import type { ProvedorAnuncios, ResultadoBanner } from '../plataforma/anuncios';

export const provedorAnuncios: ProvedorAnuncios = criarProvedorAnuncios();

let disponivel: boolean | null = provedorAnuncios.tipo === 'indisponivel' ? false : null;
let verificacao: Promise<boolean> | null = null;
const ouvintes = new Set<() => void>();

/** Avisado quando algo que muda a decisão chega de forma assíncrona (disponibilidade, consentimento). */
export function aoMudarAnuncios(fn: () => void): void {
  ouvintes.add(fn);
}

export function avisarMudancaAnuncios(): void {
  for (const fn of ouvintes) fn();
}

export function anunciosDisponiveis(): boolean | null {
  return disponivel;
}

/** Verifica uma vez por abertura se o SDK existe (só é chamado para o plano grátis efetivo). */
export function verificarDisponibilidade(): Promise<boolean> {
  if (!verificacao) {
    verificacao = provedorAnuncios.disponivel().then(
      (d) => d,
      () => false,
    );
    void verificacao.then((d) => {
      disponivel = d;
      avisarMudancaAnuncios();
    });
  }
  return verificacao;
}

/* ---------- SDK e banner ---------- */

let modoIniciado: boolean | null = null;
let iniciando: Promise<boolean> | null = null;
type EstadoBanner = 'nenhum' | 'pedindo' | 'visivel' | 'pausado';
let estadoBanner: EstadoBanner = 'nenhum';
/** Margem e modo do banner carregado (iguais = retomar sem requisição nova, US-25.CA2/CA16). */
let carregado: { margem: number; personalizado: boolean } | null = null;
let ultimaFalha: number | null = null;
let querVisivel = false;
let pedido: { chave: string; promessa: Promise<ResultadoBanner> } | null = null;

/** Inicia o SDK (ou troca o modo de personalização). false se o SDK falhou ao iniciar. */
export function garantirSdk(personalizado: boolean): Promise<boolean> {
  if (modoIniciado === personalizado) return Promise.resolve(true);
  if (iniciando) return iniciando.then(() => garantirSdk(personalizado));
  iniciando = provedorAnuncios.iniciar({ personalizado }).then(
    () => {
      modoIniciado = personalizado;
      return true;
    },
    () => false,
  );
  const p = iniciando;
  void p.finally(() => {
    if (iniciando === p) iniciando = null;
  });
  return p;
}

export function bannerVisivel(): boolean {
  return estadoBanner === 'visivel';
}

/** Já há um banner carregado com estes parâmetros (mostrar de novo não faz requisição). */
export function bannerCarregadoCom(margem: number, personalizado: boolean): boolean {
  return carregado !== null && carregado.margem === margem && carregado.personalizado === personalizado;
}

/**
 * Pede o banner (ou retoma o carregado). Depois de "sem anúncio" ou erro, não pede de novo antes de 60 s
 * (US-25.CA6): devolve 'sem-anuncio' na hora. Pedidos iguais em andamento são reaproveitados.
 */
export function pedirBanner(margem: number, personalizado: boolean): Promise<ResultadoBanner> {
  querVisivel = true;
  const chave = `${margem}|${personalizado}`;
  if (pedido && pedido.chave === chave) return pedido.promessa;
  if (estadoBanner === 'visivel' && bannerCarregadoCom(margem, personalizado)) return Promise.resolve('ok');
  if (!bannerCarregadoCom(margem, personalizado) && !podeTentarDeNovo(ultimaFalha, Date.now())) return Promise.resolve('sem-anuncio');
  const promessa = (async (): Promise<ResultadoBanner> => {
    estadoBanner = 'pedindo';
    if (!(await garantirSdk(personalizado))) {
      ultimaFalha = Date.now();
      estadoBanner = 'nenhum';
      return 'erro';
    }
    let r: ResultadoBanner;
    try {
      r = await provedorAnuncios.mostrarBanner({ margemInferior: margem });
    } catch {
      r = 'erro';
    }
    if (r === 'ok') {
      carregado = { margem, personalizado };
      ultimaFalha = null;
      estadoBanner = 'visivel';
      // Escondido (diálogo, segundo plano, outra tela) enquanto carregava: fica pausado.
      if (!querVisivel) await pausarBanner();
    } else {
      carregado = null;
      ultimaFalha = Date.now();
      estadoBanner = 'nenhum';
    }
    return r;
  })();
  pedido = { chave, promessa };
  void promessa.finally(() => {
    if (pedido?.promessa === promessa) pedido = null;
  });
  return promessa;
}

/** Esconde e pausa o banner nativo, sem requisição nova (diálogo, segundo plano, tela sem banner, Pro). */
export async function pausarBanner(): Promise<void> {
  querVisivel = false;
  if (estadoBanner !== 'visivel') return;
  estadoBanner = 'pausado';
  try {
    await provedorAnuncios.esconderBanner();
  } catch {
    // nada a fazer
  }
}

/** Descarta o banner carregado (a próxima exibição é uma requisição nova; ex.: escolha de anúncio alterada). */
export async function descartarBanner(): Promise<void> {
  await pausarBanner();
  carregado = null;
}

export function alturaBannerAtual(): number {
  return provedorAnuncios.alturaBanner();
}
