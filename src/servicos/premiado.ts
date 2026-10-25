// US-28 — Anúncio premiado: uma exportação CSV por anúncio assistido até o fim. As regras do crédito ficam
// em domain/premiado.ts; o SDK só recebe o modo de personalização (US-28.CA13: nenhum dado do usuário, e o
// conteúdo exportado nunca passa pelo plugin de anúncios).
import { comPrazo } from '../plataforma/provedor';
import { consumirCredito, ganharCredito, ofertaPremiado, type OfertaPremiado } from '../domain/premiado';
import { anunciosDisponiveis, garantirSdk, provedorAnuncios } from './anuncios';
import { gravarEstado, lerEstado, resolucaoAtual } from './consentimento';
import { ehPro, planoAnuncios } from './pro';

/** US-28.CA5: carregando por mais de 10 s, o app desiste e diz que não há anúncio. */
export const PRAZO_PREMIADO_MS = 10_000;

export type ResultadoAssistir = 'premiado' | 'fechado' | 'sem-anuncio';

export function ofertaAtual(): OfertaPremiado {
  return ofertaPremiado({
    pro: ehPro(),
    credito: lerEstado().credito,
    plano: planoAnuncios(),
    provedorDisponivel: anunciosDisponiveis(),
    consentimento: resolucaoAtual(),
  });
}

let emAndamento = false;

/**
 * Carrega e mostra o premiado. Só 'premiado' (o SDK confirmou o prêmio) grava o crédito. Fechar antes do fim,
 * ir para segundo plano sem a confirmação, sem anúncio, sem rede, erro ou demora: nenhum prêmio.
 */
export async function assistirPremiado(): Promise<ResultadoAssistir> {
  const c = resolucaoAtual();
  if (emAndamento || ofertaAtual() !== 'oferta' || c.tipo !== 'pronto') return 'sem-anuncio';
  emAndamento = true;
  try {
    const pronto = await comPrazo(
      (async () => (await garantirSdk(c.personalizado)) && (await provedorAnuncios.carregarPremiado()))(),
      PRAZO_PREMIADO_MS,
    ).catch(() => false);
    if (!pronto) return 'sem-anuncio';
    let r;
    try {
      r = await provedorAnuncios.mostrarPremiado();
    } catch {
      return 'sem-anuncio';
    }
    if (r === 'premiado') {
      gravarEstado(ganharCredito(lerEstado()));
      return 'premiado';
    }
    return r === 'fechado' ? 'fechado' : 'sem-anuncio';
  } finally {
    emAndamento = false;
  }
}

/** Arquivo entregue com o crédito: consome (só depois de 'ok'). */
export function usarCredito(): void {
  gravarEstado(consumirCredito(lerEstado()));
}

export function haCredito(): boolean {
  return lerEstado().credito > 0;
}
