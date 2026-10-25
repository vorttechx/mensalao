// Provedor de anúncios FALSO, só para o build de teste (VITE_MODO=teste). Nunca entra no build de produção
// (US-30.CA3): só é importado por ambiente.teste.ts. O Playwright não enxerga anúncio nativo; este provedor
// simula o SDK e conta as chamadas, para os testes conferirem quando o app pede, retoma e esconde o banner.
// Controle: chave `mensalao:teste:anuncios` do localStorage (lida a cada chamada) ou
// `window.__mensalaoTeste.anuncios.configurar({...})`. Chamadas: `mensalao:teste:anuncios-chamadas`.
import type { ConsentimentoAnuncios, PosicaoBanner, ProvedorAnuncios, ResultadoBanner, ResultadoPremiado, SituacaoGoogle } from './anuncios';

/** Identificador procurado pelo script de verificação do bundle (scripts/verificar-provedor-falso.mjs). */
export const ID_ANUNCIOS_FALSO = 'anuncios-falso-mensalao';
export const CHAVE_CONTROLE_ANUNCIOS = 'mensalao:teste:anuncios';
export const CHAVE_CHAMADAS_ANUNCIOS = 'mensalao:teste:anuncios-chamadas';

export interface ControleAnunciosFalso {
  /**
   * O SDK existe no "aparelho". Padrão: **false** (como um aparelho sem os serviços do Google), para os testes
   * das sprints anteriores não verem aviso de consentimento nem banner. Os testes de anúncio ligam com true.
   */
  disponivel: boolean;
  /** Resultado de cada requisição de banner. Padrão: 'ok'. */
  banner: ResultadoBanner;
  /** Atraso de cada requisição de banner, em ms ("lento"). Padrão: 0. */
  atrasoBannerMs: number;
  /** Altura informada pelo "SDK" quando o banner carrega, em px. Padrão: 56. */
  alturaBanner: number;
  /** O SDK falha ao iniciar (iniciar() lança). Padrão: false. */
  falhaIniciar: boolean;
  /** O premiado carrega. Padrão: true; false = "sem anúncio premiado". */
  carregarPremiado: boolean;
  /** Atraso para carregar o premiado, em ms (acima de 10 s o app desiste). Padrão: 0. */
  atrasoPremiadoMs: number;
  /** Como o "vídeo" termina. Padrão: 'premiado' (assistiu até o fim). */
  premiado: ResultadoPremiado;
  /** Região do UMP: 'exigido' simula EEE/Reino Unido/Suíça; 'erro' = UMP fora. Padrão: 'nao-exigido'. */
  google: 'nao-exigido' | 'exigido' | 'erro';
  /** Resposta da pessoa ao formulário do UMP. Padrão: 'consentiu'. */
  googleResposta: 'consentiu' | 'recusou';
  /** Já respondeu ao formulário do UMP (gravado pelo próprio provedor ao mostrar o formulário). Padrão: false. */
  googleRespondido: boolean;
  /** Simula falta de rede (também vale quando navigator.onLine é false). Padrão: false. */
  offline: boolean;
}

export const CONTROLE_ANUNCIOS_PADRAO: ControleAnunciosFalso = {
  disponivel: false,
  banner: 'ok',
  atrasoBannerMs: 0,
  alturaBanner: 56,
  falhaIniciar: false,
  carregarPremiado: true,
  atrasoPremiadoMs: 0,
  premiado: 'premiado',
  google: 'nao-exigido',
  googleResposta: 'consentiu',
  googleRespondido: false,
  offline: false,
};

export interface ChamadasAnuncios {
  disponivel: number;
  consultarGoogle: number;
  formularioGoogle: number;
  opcoesPrivacidade: number;
  iniciar: number;
  /** Requisições NOVAS de banner (o que conta para "no máximo uma por troca de tela" e o intervalo de 60 s). */
  requisicoesBanner: number;
  /** Banner já carregado mostrado de novo, sem requisição. */
  retomadasBanner: number;
  esconderBanner: number;
  carregarPremiado: number;
  mostrarPremiado: number;
  /** Último modo passado a iniciar() (null = nunca iniciado). */
  ultimoPersonalizado: boolean | null;
  /** Última margem inferior pedida, em px. */
  ultimaMargem: number | null;
  /** O banner "nativo" está visível agora. */
  bannerVisivel: boolean;
  /** Parâmetros recebidos pelo provedor (US-25.CA14: só booleano e número, nunca dado do usuário). */
  parametros: unknown[];
}

const CHAMADAS_VAZIAS: ChamadasAnuncios = {
  disponivel: 0, consultarGoogle: 0, formularioGoogle: 0, opcoesPrivacidade: 0, iniciar: 0, requisicoesBanner: 0,
  retomadasBanner: 0, esconderBanner: 0, carregarPremiado: 0, mostrarPremiado: 0, ultimoPersonalizado: null,
  ultimaMargem: null, bannerVisivel: false, parametros: [],
};

export function lerControleAnuncios(): ControleAnunciosFalso {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE_CONTROLE_ANUNCIOS) ?? '{}') as Partial<ControleAnunciosFalso>;
    return { ...CONTROLE_ANUNCIOS_PADRAO, ...(typeof v === 'object' && v !== null ? v : {}) };
  } catch {
    return { ...CONTROLE_ANUNCIOS_PADRAO };
  }
}

export function configurarAnuncios(parcial: Partial<ControleAnunciosFalso>): ControleAnunciosFalso {
  const novo = { ...lerControleAnuncios(), ...parcial };
  localStorage.setItem(CHAVE_CONTROLE_ANUNCIOS, JSON.stringify(novo));
  return novo;
}

export function lerChamadasAnuncios(): ChamadasAnuncios {
  try {
    return { ...CHAMADAS_VAZIAS, ...JSON.parse(localStorage.getItem(CHAVE_CHAMADAS_ANUNCIOS) ?? '{}') };
  } catch {
    return { ...CHAMADAS_VAZIAS };
  }
}

function registrar(muda: (c: ChamadasAnuncios) => void): void {
  const c = lerChamadasAnuncios();
  muda(c);
  localStorage.setItem(CHAVE_CHAMADAS_ANUNCIOS, JSON.stringify(c));
}

function esperar(ms: number): Promise<void> {
  return ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve();
}

function semRede(c: ControleAnunciosFalso): boolean {
  return c.offline || (typeof navigator !== 'undefined' && navigator.onLine === false);
}

function situacao(c: ControleAnunciosFalso): SituacaoGoogle {
  if (c.google !== 'exigido') return { exigido: false, respondido: false, podeAnunciar: true };
  return { exigido: true, respondido: c.googleRespondido, podeAnunciar: c.googleRespondido && c.googleResposta === 'consentiu' };
}

export class AnunciosFalso implements ProvedorAnuncios {
  readonly tipo = 'falso' as const;
  readonly id = ID_ANUNCIOS_FALSO;
  private ouvintes = new Set<(altura: number) => void>();
  private personalizado: boolean | null = null;
  /** Banner "carregado": posição e modo com que foi pedido. */
  private carregado: { margem: number; personalizado: boolean } | null = null;
  private altura = 0;
  private premiadoPronto = false;

  async disponivel(): Promise<boolean> {
    registrar((c) => (c.disponivel += 1));
    return lerControleAnuncios().disponivel;
  }

  async consultarConsentimentoGoogle(): Promise<SituacaoGoogle> {
    registrar((c) => (c.consultarGoogle += 1));
    const c = lerControleAnuncios();
    if (!c.disponivel || c.google === 'erro' || semRede(c)) throw new Error(`${ID_ANUNCIOS_FALSO}: UMP indisponível`);
    return situacao(c);
  }

  async mostrarFormularioGoogle(): Promise<SituacaoGoogle> {
    registrar((c) => (c.formularioGoogle += 1));
    const c = lerControleAnuncios();
    if (!c.disponivel || c.google === 'erro' || semRede(c)) throw new Error(`${ID_ANUNCIOS_FALSO}: UMP indisponível`);
    return situacao(c.google === 'exigido' ? configurarAnuncios({ googleRespondido: true }) : c);
  }

  async abrirOpcoesPrivacidade(): Promise<void> {
    registrar((c) => (c.opcoesPrivacidade += 1));
    const c = lerControleAnuncios();
    if (c.google === 'exigido') configurarAnuncios({ googleRespondido: true });
  }

  async iniciar(consentimento: ConsentimentoAnuncios): Promise<void> {
    registrar((c) => {
      c.iniciar += 1;
      c.ultimoPersonalizado = consentimento.personalizado;
      c.parametros.push(consentimento);
    });
    if (lerControleAnuncios().falhaIniciar) throw new Error(`${ID_ANUNCIOS_FALSO}: SDK não iniciou`);
    this.personalizado = consentimento.personalizado;
  }

  async mostrarBanner(posicao: PosicaoBanner): Promise<ResultadoBanner> {
    const c = lerControleAnuncios();
    if (this.personalizado === null) return 'erro'; // SDK não iniciado
    const personalizado = this.personalizado;
    if (this.carregado && this.carregado.margem === posicao.margemInferior && this.carregado.personalizado === personalizado) {
      registrar((x) => {
        x.retomadasBanner += 1;
        x.bannerVisivel = true;
      });
      this.avisar(this.altura || c.alturaBanner);
      return 'ok';
    }
    this.carregado = null;
    registrar((x) => {
      x.requisicoesBanner += 1;
      x.ultimaMargem = posicao.margemInferior;
      x.parametros.push(posicao);
    });
    await esperar(c.atrasoBannerMs);
    const r: ResultadoBanner = semRede(c) ? 'erro' : c.banner;
    if (r !== 'ok') {
      registrar((x) => (x.bannerVisivel = false));
      this.avisar(0);
      return r;
    }
    this.carregado = { margem: posicao.margemInferior, personalizado };
    this.altura = c.alturaBanner;
    registrar((x) => (x.bannerVisivel = true));
    this.avisar(this.altura);
    return 'ok';
  }

  async esconderBanner(): Promise<void> {
    registrar((x) => {
      x.esconderBanner += 1;
      x.bannerVisivel = false;
    });
    this.avisar(0);
  }

  alturaBanner(): number {
    return this.altura;
  }

  aoMudarAltura(fn: (altura: number) => void): void {
    this.ouvintes.add(fn);
  }

  private avisar(altura: number): void {
    for (const fn of this.ouvintes) fn(altura);
  }

  async carregarPremiado(): Promise<boolean> {
    registrar((x) => (x.carregarPremiado += 1));
    const c = lerControleAnuncios();
    await esperar(c.atrasoPremiadoMs);
    this.premiadoPronto = this.personalizado !== null && c.carregarPremiado && !semRede(c);
    return this.premiadoPronto;
  }

  async mostrarPremiado(): Promise<ResultadoPremiado> {
    registrar((x) => (x.mostrarPremiado += 1));
    if (!this.premiadoPronto) return 'sem-anuncio';
    this.premiadoPronto = false;
    return lerControleAnuncios().premiado;
  }
}
