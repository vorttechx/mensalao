// Provedor de anúncios "Indisponível": navegador (desenvolvimento) ou aparelho sem o SDK nativo (US-24.CA12,
// US-25.CA6). Não faz nada e nunca falha: o app funciona igual, só sem anúncio.
import type { ProvedorAnuncios, ResultadoBanner, ResultadoPremiado, SituacaoGoogle } from './anuncios';

export class AnunciosIndisponivel implements ProvedorAnuncios {
  readonly tipo = 'indisponivel' as const;

  async disponivel(): Promise<boolean> {
    return false;
  }
  async consultarConsentimentoGoogle(): Promise<SituacaoGoogle> {
    throw new Error('anúncios indisponíveis neste ambiente');
  }
  async mostrarFormularioGoogle(): Promise<SituacaoGoogle> {
    throw new Error('anúncios indisponíveis neste ambiente');
  }
  async iniciar(): Promise<void> {
    // nada
  }
  async mostrarBanner(): Promise<ResultadoBanner> {
    return 'sem-anuncio';
  }
  async esconderBanner(): Promise<void> {
    // nada
  }
  alturaBanner(): number {
    return 0;
  }
  aoMudarAltura(): void {
    // nada
  }
  async carregarPremiado(): Promise<boolean> {
    return false;
  }
  async mostrarPremiado(): Promise<ResultadoPremiado> {
    return 'sem-anuncio';
  }
  async abrirOpcoesPrivacidade(): Promise<void> {
    // nada
  }
}
