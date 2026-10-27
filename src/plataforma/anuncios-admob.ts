// US-25 / US-27 / US-28 — Provedor de anúncios real: SDK do Google (AdMob + UMP) pelo plugin
// @capacitor-community/admob, só no app Android. O banner é uma view nativa por cima da WebView: o SDK não
// enxerga a página nem o localStorage. Nenhum dado do usuário é passado (só ID do bloco, posição e npa).
import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  AdmobConsentDebugGeography,
  AdmobConsentStatus,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
  RewardAdPluginEvents,
  type AdmobConsentInfo,
  type AdmobConsentRequestOptions,
} from '@capacitor-community/admob';
import { resultadoDeErroBanner } from '../domain/anuncios';
import type { ConsentimentoAnuncios, PosicaoBanner, ProvedorAnuncios, ResultadoBanner, ResultadoPremiado, SituacaoGoogle } from './anuncios';
import { CONFIG_ANUNCIOS } from './ids-anuncios';

/** Sem resposta do SDK nesse prazo, o banner conta como "sem anúncio" (o espaço é liberado). */
const PRAZO_BANNER_MS = 15_000;

function situacaoDe(info: AdmobConsentInfo): SituacaoGoogle {
  if (info.status === AdmobConsentStatus.UNKNOWN) throw new Error('UMP sem resposta');
  const exigido = info.status === AdmobConsentStatus.REQUIRED || String(info.privacyOptionsRequirementStatus) === 'REQUIRED';
  return { exigido, respondido: info.status === AdmobConsentStatus.OBTAINED, podeAnunciar: info.canRequestAds };
}

function opcoesConsulta(): AdmobConsentRequestOptions {
  // Região simulada e aparelhos de teste só existem fora da produção (vite.config.ts zera em produção).
  const geo =
    CONFIG_ANUNCIOS.umpDepuracao === 'EEA' ? AdmobConsentDebugGeography.EEA : CONFIG_ANUNCIOS.umpDepuracao === 'NOT_EEA' ? AdmobConsentDebugGeography.NOT_EEA : undefined;
  return {
    ...(geo !== undefined ? { debugGeography: geo } : {}),
    ...(CONFIG_ANUNCIOS.aparelhosTeste.length ? { testDeviceIdentifiers: CONFIG_ANUNCIOS.aparelhosTeste } : {}),
  };
}

export class AnunciosAdMob implements ProvedorAnuncios {
  readonly tipo = 'admob' as const;
  private sdkIniciado = false;
  private npa = true;
  private ouvintesInstalados = false;
  private ouvintes = new Set<(altura: number) => void>();
  private altura = 0;
  /** Banner carregado: posição e modo com que foi pedido (mudou = requisição nova). */
  private carregado: { margem: number; npa: boolean } | null = null;
  private pendente: ((r: ResultadoBanner) => void) | null = null;

  async disponivel(): Promise<boolean> {
    return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('AdMob');
  }

  async consultarConsentimentoGoogle(): Promise<SituacaoGoogle> {
    return situacaoDe(await AdMob.requestConsentInfo(opcoesConsulta()));
  }

  async mostrarFormularioGoogle(): Promise<SituacaoGoogle> {
    return situacaoDe(await AdMob.showConsentForm());
  }

  async abrirOpcoesPrivacidade(): Promise<void> {
    await AdMob.showPrivacyOptionsForm();
  }

  private instalarOuvintes(): void {
    if (this.ouvintesInstalados) return;
    this.ouvintesInstalados = true;
    void AdMob.addListener(BannerAdPluginEvents.SizeChanged, (t) => {
      this.altura = t.height;
      for (const fn of this.ouvintes) fn(t.height);
    });
    void AdMob.addListener(BannerAdPluginEvents.Loaded, () => this.resolver('ok'));
    void AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (e) => {
      // O plugin já removeu o banner que falhou.
      this.carregado = null;
      this.resolver(resultadoDeErroBanner(e?.code));
    });
  }

  private resolver(r: ResultadoBanner): void {
    const p = this.pendente;
    this.pendente = null;
    p?.(r);
  }

  async iniciar(consentimento: ConsentimentoAnuncios): Promise<void> {
    this.npa = !consentimento.personalizado;
    if (this.sdkIniciado) return;
    this.instalarOuvintes();
    await AdMob.initialize({
      initializeForTesting: CONFIG_ANUNCIOS.teste,
      testingDevices: CONFIG_ANUNCIOS.aparelhosTeste,
      tagForChildDirectedTreatment: false, // público 18+, fora do programa Famílias (D-12)
    });
    this.sdkIniciado = true;
  }

  async mostrarBanner(posicao: PosicaoBanner): Promise<ResultadoBanner> {
    if (!this.sdkIniciado) return 'erro';
    const margem = Math.max(0, Math.round(posicao.margemInferior));
    if (this.carregado && this.carregado.margem === margem && this.carregado.npa === this.npa) {
      await AdMob.resumeBanner(); // mesmo anúncio, sem requisição nova
      return 'ok';
    }
    if (this.carregado) {
      // Outra posição (abas com texto grande, rotação) ou outro modo (escolha alterada): o plugin só
      // reposiciona recriando o banner.
      await AdMob.removeBanner();
      this.carregado = null;
    }
    this.resolver('sem-anuncio'); // um pedido antigo ainda pendente não fica preso
    const resultado = new Promise<ResultadoBanner>((resolver) => {
      this.pendente = resolver;
      setTimeout(() => {
        if (this.pendente === resolver) {
          this.pendente = null;
          void AdMob.removeBanner().catch(() => undefined);
          resolver('sem-anuncio');
        }
      }, PRAZO_BANNER_MS);
    });
    try {
      await AdMob.showBanner({
        adId: CONFIG_ANUNCIOS.banner,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        // A área segura de baixo (barra de gestos) o plugin soma sozinho; aqui vão as abas + 16 px.
        margin: margem,
        isTesting: CONFIG_ANUNCIOS.teste,
        npa: this.npa,
      });
    } catch {
      this.resolver('erro');
    }
    const r = await resultado;
    if (r === 'ok') this.carregado = { margem, npa: this.npa };
    return r;
  }

  async esconderBanner(): Promise<void> {
    if (!this.carregado && !this.pendente) return;
    try {
      await AdMob.hideBanner();
    } catch {
      // nada carregado para esconder
    }
  }

  alturaBanner(): number {
    return this.altura;
  }

  aoMudarAltura(fn: (altura: number) => void): void {
    this.ouvintes.add(fn);
  }

  async carregarPremiado(): Promise<boolean> {
    if (!this.sdkIniciado) return false;
    try {
      await AdMob.prepareRewardVideoAd({ adId: CONFIG_ANUNCIOS.premiado, isTesting: CONFIG_ANUNCIOS.teste, npa: this.npa });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * O plugin só resolve showRewardVideoAd quando o prêmio é dado; fechar antes do fim chega como evento
   * "Dismissed" sem prêmio. O prêmio pode chegar um pouco antes do Dismissed, por isso a espera curta.
   */
  async mostrarPremiado(): Promise<ResultadoPremiado> {
    return new Promise<ResultadoPremiado>((resolver) => {
      let fim = false;
      const handles: Promise<{ remove: () => Promise<void> }>[] = [];
      const terminar = (r: ResultadoPremiado): void => {
        if (fim) return;
        fim = true;
        for (const h of handles) void h.then((x) => x.remove()).catch(() => undefined);
        resolver(r);
      };
      handles.push(AdMob.addListener(RewardAdPluginEvents.Rewarded, () => terminar('premiado')));
      handles.push(AdMob.addListener(RewardAdPluginEvents.Dismissed, () => setTimeout(() => terminar('fechado'), 400)));
      handles.push(AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => terminar('erro')));
      AdMob.showRewardVideoAd().then(
        () => terminar('premiado'),
        () => terminar('sem-anuncio'),
      );
    });
  }
}
