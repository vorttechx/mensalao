// US-25 / US-27 / US-28 — Interface única de anúncios (Definição técnica da sprint 4). Toda conversa com o SDK
// de anúncios passa por aqui. Implementações: AdMob real (app Android), indisponível (navegador, aparelho sem
// os serviços do Google) e falsa (só no build de teste).
//
// US-25.CA14 / D-10: NENHUM dado do usuário entra nesta interface. Os únicos parâmetros são a escolha de
// personalização (booleano) e a posição do banner (número). Não há como passar texto, palavras-chave,
// categorias, nomes de serviços nem valores, e nada daqui lê o localStorage.

export type ResultadoBanner = 'ok' | 'sem-anuncio' | 'erro';
export type ResultadoPremiado = 'premiado' | 'fechado' | 'sem-anuncio' | 'erro';

/** Escolha de personalização: false = pedido com npa=1 (anúncios não personalizados). */
export interface ConsentimentoAnuncios {
  readonly personalizado: boolean;
}

/** Posição do banner ancorado no rodapé: distância (px CSS = dp) entre a borda de baixo da tela útil e o banner. */
export interface PosicaoBanner {
  readonly margemInferior: number;
}

/** Situação do formulário de privacidade do Google (UMP), que vale para EEE, Reino Unido e Suíça. */
export interface SituacaoGoogle {
  /** O Google exige o formulário nesta região. */
  readonly exigido: boolean;
  /** A pessoa já respondeu ao formulário (status OBTAINED). */
  readonly respondido: boolean;
  /** Com as respostas atuais, o SDK pode pedir anúncio (canRequestAds). */
  readonly podeAnunciar: boolean;
}

export interface ProvedorAnuncios {
  readonly tipo: 'admob' | 'indisponivel' | 'falso';
  /** O SDK nativo existe neste aparelho (app Android com os serviços do Google). Nunca lança. */
  disponivel(): Promise<boolean>;
  /** Consulta o UMP (não inicia o SDK de anúncios). Lança em falha (sem rede, serviço fora). */
  consultarConsentimentoGoogle(): Promise<SituacaoGoogle>;
  /** Mostra o formulário do UMP e devolve a situação depois dele. Lança em falha. */
  mostrarFormularioGoogle(): Promise<SituacaoGoogle>;
  /** Inicia o SDK (só depois de plano grátis e consentimento) ou troca o modo de personalização. */
  iniciar(consentimento: ConsentimentoAnuncios): Promise<void>;
  /** Pede (ou retoma, se já carregado na mesma posição e no mesmo modo) o banner adaptativo ancorado. */
  mostrarBanner(posicao: PosicaoBanner): Promise<ResultadoBanner>;
  /** Esconde e pausa o banner, sem descartar o anúncio carregado (diálogo, segundo plano, tela sem banner). */
  esconderBanner(): Promise<void>;
  /** Altura do banner em px CSS (0 enquanto não há banner). */
  alturaBanner(): number;
  /** Avisado quando o SDK informa a altura real do banner (0 = escondido/removido). */
  aoMudarAltura(fn: (altura: number) => void): void;
  /** Carrega um anúncio premiado; false se não há anúncio, rede ou SDK. */
  carregarPremiado(): Promise<boolean>;
  /** Mostra o premiado carregado. 'premiado' só quando o SDK confirma o prêmio. */
  mostrarPremiado(): Promise<ResultadoPremiado>;
  /** Reabre o formulário de opções de privacidade do Google (UMP). */
  abrirOpcoesPrivacidade(): Promise<void>;
}
