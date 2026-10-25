// US-25 — Faixa do anúncio no rodapé (design 14.1). A página desenha a moldura (fio, rótulo "Anúncio", área
// reservada e respiro) e o SDK encaixa o banner nativo dentro dela, por cima da WebView. A faixa é fixa por
// cima do fim do conteúdo: reservar e liberar o espaço nunca empurra o que está na tela (UX-S4-02).
import {
  anunciosPermitidos,
  faixaCabe,
  margemBanner,
  type DecisaoAnuncio,
  type ResolucaoConsentimento,
  type TelaAnuncio,
} from '../domain/anuncios';
import {
  alturaBannerAtual,
  anunciosDisponiveis,
  aoMudarAnuncios,
  bannerCarregadoCom,
  pausarBanner,
  pedirBanner,
  provedorAnuncios,
  verificarDisponibilidade,
} from '../servicos/anuncios';
import { aoMudarPlano, planoAnuncios } from '../servicos/pro';
import { h } from './dom';

/** Hooks do consentimento (US-27), registrados por ui/consentimento.ts. */
export interface IntegracaoConsentimento {
  resolver(): ResolucaoConsentimento;
  primeiraAbertura(): boolean;
  /** Aviso do app (sem escolha). `trocou` = acabou de entrar na tela. */
  perguntar(trocou: boolean): void;
  /** Formulário do UMP (EEE, Reino Unido, Suíça). */
  formularioGoogle(trocou: boolean): void;
}

let consentimento: IntegracaoConsentimento = {
  resolver: () => ({ tipo: 'aguardar' }),
  primeiraAbertura: () => false,
  perguntar: () => undefined,
  formularioGoogle: () => undefined,
};

export function integrarConsentimento(c: IntegracaoConsentimento): void {
  consentimento = c;
}

let appAtual: HTMLElement | null = null;
let telaAtual: TelaAnuncio = 'outra';
let faixa: HTMLElement | null = null;
let ultimaDecisao: DecisaoAnuncio | null = null;

function movimentoReduzido(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Altura da barra de abas: com a área segura (para a regra dos 20%) e sem ela (para a margem do banner). */
function medirAbas(app: HTMLElement): { comAreaSegura: number; semAreaSegura: number } {
  const nav = app.querySelector<HTMLElement>('.nav');
  if (!nav) return { comAreaSegura: 0, semAreaSegura: 0 };
  const lista = nav.firstElementChild as HTMLElement | null;
  return { comAreaSegura: nav.getBoundingClientRect().height, semAreaSegura: (lista ?? nav).getBoundingClientRect().height };
}

let ultimaAlturaReal = 0;

/** Altura real do banner (ou a última da sessão; 0 = padrão de 56 px). */
function alturaBanner(): number {
  const a = alturaBannerAtual();
  return a > 0 ? a : ultimaAlturaReal;
}

function criarFaixa(entrada: boolean): HTMLElement {
  const el = h(
    'aside',
    { class: `faixa-anuncio${entrada && !movimentoReduzido() ? ' entrando' : ''}`, 'aria-label': 'Anúncio', testid: 'anuncio-banner' },
    h('p', { class: 'anuncio-rotulo', testid: 'anuncio-rotulo' }, 'Anúncio'),
    h('div', { class: 'anuncio-reserva', testid: 'anuncio-reserva', 'aria-hidden': 'true' }),
  );
  if (el.classList.contains('entrando')) requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('entrando')));
  return el;
}

/** Liberando (design 14.1): o banner nativo some primeiro; depois a faixa some por opacidade em 160 ms. */
function liberarFaixa(el: HTMLElement): void {
  void pausarBanner();
  const remover = (): void => {
    el.remove();
    if (faixa === el) faixa = null;
    if (!faixa) appAtual?.classList.remove('com-anuncio');
  };
  if (movimentoReduzido() || !el.isConnected) return remover();
  el.classList.add('liberando');
  setTimeout(remover, 170);
}

/**
 * Aplica a decisão à tela atual. Chamado ao fim de cada renderização e quando algo muda sem remontar a tela
 * (resposta da loja, rede, rotação, consentimento, diálogo fechado). `trocou` = acabou de entrar na tela.
 */
function aplicar(trocou: boolean): void {
  const app = appAtual;
  if (!app || !app.isConnected) return;
  const plano = planoAnuncios();
  const abas = medirAbas(app);
  const entrada = {
    plano,
    tela: telaAtual,
    primeiraAbertura: consentimento.primeiraAbertura(),
    provedorDisponivel: anunciosDisponiveis(),
    online: navigator.onLine !== false,
    cabe: faixaCabe({ alturaJanela: window.innerHeight, alturaAbas: abas.comAreaSegura, alturaBanner: alturaBanner() }),
    consentimento: consentimento.resolver(),
  };
  // A disponibilidade do SDK só é verificada para quem pode ver anúncio (nunca no Pro, US-26.CA3).
  if (entrada.provedorDisponivel === null && plano === 'gratis' && entrada.tela !== 'outra' && !entrada.primeiraAbertura) {
    void verificarDisponibilidade();
  }
  const decisao = anunciosPermitidos(entrada);
  ultimaDecisao = decisao;

  if (decisao.tipo !== 'mostrar') {
    if (faixa) liberarFaixa(faixa);
    else void pausarBanner();
    if (decisao.tipo === 'perguntar') consentimento.perguntar(trocou);
    if (decisao.tipo === 'formulario-google') consentimento.formularioGoogle(trocou);
    return;
  }

  const margem = margemBanner(abas.semAreaSegura);
  if (!faixa || !faixa.isConnected) {
    // Banner já carregado (voltar a uma aba já exibida): a faixa volta sem a entrada, junto com o anúncio.
    faixa = criarFaixa(!bannerCarregadoCom(margem, decisao.personalizado));
    app.append(faixa); // depois da <nav>: o leitor de tela lê "Anúncio" por último (US-25.CA11)
    app.classList.add('com-anuncio');
  }
  // Com um diálogo aberto o banner nativo (que fica acima do véu) não aparece (UX-S4-13).
  if (document.querySelector('dialog[open]')) {
    void pausarBanner();
    return;
  }
  const el = faixa;
  void pedirBanner(margem, decisao.personalizado).then((r) => {
    if (r !== 'ok' && faixa === el) liberarFaixa(el);
  });
}

/** Chamado pela moldura depois de montar cada tela. */
export function atualizarAnuncio(app: HTMLElement, tela: TelaAnuncio, trocou: boolean): void {
  appAtual = app;
  telaAtual = tela;
  faixa = null; // a montagem nova substituiu a faixa antiga
  aplicar(trocou);
}

/** Reavalia sem remontar a tela (resposta assíncrona). */
export function reavaliarAnuncio(): void {
  aplicar(false);
}

export function decisaoAtual(): DecisaoAnuncio | null {
  return ultimaDecisao;
}

let instalado = false;

/** Ouvintes globais: diálogos, segundo plano, rede, rotação, altura do banner e mudanças de plano. */
export function instalarAnuncios(): void {
  if (instalado) return;
  instalado = true;
  provedorAnuncios.aoMudarAltura((altura) => {
    if (altura <= 0) return; // escondido: a faixa mantém a última altura real
    ultimaAlturaReal = altura;
    document.documentElement.style.setProperty('--anuncio-altura', `${Math.round(altura)}px`);
  });
  aoMudarAnuncios(() => aplicar(false));
  aoMudarPlano(() => setTimeout(() => aplicar(false), 0));
  // Diálogo aberto numa tela com banner: esconde o banner nativo; fechado, ele volta sem requisição nova.
  let dialogoAberto = false;
  new MutationObserver(() => {
    const aberto = document.querySelector('dialog[open]') !== null;
    if (aberto === dialogoAberto) return;
    dialogoAberto = aberto;
    if (aberto) void pausarBanner();
    else if (faixa?.isConnected) aplicar(false);
  }).observe(document.body, { childList: true }); // os diálogos entram e saem do <body>
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') void pausarBanner(); // US-25.CA16; a volta remonta a tela
  });
  window.addEventListener('offline', () => aplicar(false));
  window.addEventListener('online', () => aplicar(false));
  let espera: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener('resize', () => {
    clearTimeout(espera);
    espera = setTimeout(() => aplicar(false), 150);
  });
}
