// Helpers da sprint 4 (QA): abrir o app grátis/Pro com o provedor de ANÚNCIOS falso configurado.
// Só IDs de teste e provedor falso (US-30.CA3/CA9): nada aqui fala com anúncio real.
import { expect, type Page } from '@playwright/test';
import { abrirS2, ativas, lerChave, SKU, type OpcoesS2 } from './helpers2';

export { abrirS2, ativas, lerChave, SKU };
export const CHAVE_ANUNCIOS = 'mensalao:anuncios:v1';
export const CHAVE_CONTROLE = 'mensalao:teste:anuncios';
export const CHAVE_CHAMADAS = 'mensalao:teste:anuncios-chamadas';

export interface OpcoesAnuncios extends OpcoesS2 {
  /** Controle do provedor de anúncios falso (padrão deste helper: disponivel = true). */
  anuncios?: Record<string, unknown>;
  /**
   * Quantas aberturas o app já tem gravadas ANTES desta. Padrão 1: esta é a 2ª abertura (a primeira em que
   * pode haver aviso e banner, UX-S4-04). 0 = 1ª abertura.
   */
  aberturas?: number;
  /** Escolha de anúncios já feita. Padrão: 'personalizado'. null = sem escolha. */
  escolha?: 'personalizado' | 'nao-personalizado' | null;
  credito?: number;
  /** Valor bruto de mensalao:anuncios:v1 (estado corrompido); ignora os campos acima. */
  estadoBruto?: string;
}

export function estadoAnuncios(o: Pick<OpcoesAnuncios, 'aberturas' | 'escolha' | 'credito'> = {}) {
  const escolha = o.escolha === undefined ? 'personalizado' : o.escolha;
  return {
    escolha,
    versaoTexto: escolha ? 1 : null,
    decididoEm: escolha ? '2026-09-20T12:00:00.000Z' : null,
    aberturas: o.aberturas ?? 1,
    credito: o.credito ?? 0,
  };
}

/**
 * Abre o app com o provedor de anúncios falso ligado e o estado de anúncios semeado. Uma só recarga abre o
 * app (cada abertura conta no estado e nas chamadas do provedor falso, então não há abertura "de aquecimento").
 */
export async function abrirAnuncios(page: Page, o: OpcoesAnuncios = {}) {
  const { anuncios, aberturas, escolha, credito, estadoBruto, ...s2 } = o;
  await page.clock.setFixedTime(s2.relogio ?? '2026-09-30T12:00:00-03:00');
  await page.goto('./'); // abre vazio só para existir a origem (1ª abertura, sem nada a fazer)
  const entradas: [string, string][] = [
    [CHAVE_CONTROLE, JSON.stringify({ disponivel: true, ...(anuncios ?? {}) })],
    [CHAVE_ANUNCIOS, estadoBruto ?? JSON.stringify(estadoAnuncios({ aberturas, escolha, credito }))],
  ];
  if (s2.assinaturas) entradas.push(['mensalao:v1', JSON.stringify({ versao: 1, config: { diasAviso: s2.diasAviso ?? 3 }, assinaturas: s2.assinaturas })]);
  const prov = { ...(s2.provedor ?? {}) } as Record<string, unknown>;
  if (s2.pro) {
    prov.compras = [...((prov.compras as string[]) ?? []), SKU];
    entradas.push(['mensalao:pro:v1', JSON.stringify({ pro: true, sku: SKU, verificadoEm: '2026-09-01T00:00:00.000Z' })]);
  }
  if (s2.proBruto !== undefined) entradas.push(['mensalao:pro:v1', s2.proBruto]);
  if (Object.keys(prov).length) entradas.push(['mensalao:teste:provedor', JSON.stringify(prov)]);
  if (s2.notificacao) entradas.push(['mensalao:teste:notificacao', JSON.stringify(s2.notificacao)]);
  if (s2.prefs) entradas.push(['mensalao:prefs:v1', JSON.stringify(s2.prefs)]);
  // A rota vai primeiro, ainda com os controles padrão: a sessão vazia de antes da recarga não pode registrar
  // chamadas do provedor falso na conta do teste.
  if (s2.hash) await page.evaluate((h) => new Promise<void>((ok) => { location.hash = h; setTimeout(ok, 60); }), s2.hash);
  await page.evaluate((e) => {
    localStorage.removeItem('mensalao:teste:anuncios-chamadas');
    e.forEach(([k, v]) => localStorage.setItem(k, v));
  }, entradas);
  await page.reload();
}

export interface Chamadas {
  disponivel: number;
  consultarGoogle: number;
  formularioGoogle: number;
  opcoesPrivacidade: number;
  iniciar: number;
  requisicoesBanner: number;
  retomadasBanner: number;
  esconderBanner: number;
  carregarPremiado: number;
  mostrarPremiado: number;
  ultimoPersonalizado: boolean | null;
  ultimaMargem: number | null;
  bannerVisivel: boolean;
  parametros: unknown[];
}

export async function chamadas(page: Page): Promise<Chamadas> {
  const c = await page.evaluate(() => JSON.parse(localStorage.getItem('mensalao:teste:anuncios-chamadas') ?? '{}'));
  return {
    disponivel: 0, consultarGoogle: 0, formularioGoogle: 0, opcoesPrivacidade: 0, iniciar: 0, requisicoesBanner: 0,
    retomadasBanner: 0, esconderBanner: 0, carregarPremiado: 0, mostrarPremiado: 0, ultimoPersonalizado: null,
    ultimaMargem: null, bannerVisivel: false, parametros: [], ...c,
  };
}

export async function estadoGravado(page: Page) {
  return page.evaluate(() => {
    const b = localStorage.getItem('mensalao:anuncios:v1');
    return b === null ? null : JSON.parse(b);
  });
}

export async function configurarAnuncios(page: Page, parcial: Record<string, unknown>) {
  await page.evaluate((p) => (window as any).__mensalaoTeste.anuncios.configurar(p), parcial);
}

export function faixa(page: Page) {
  return page.getByTestId('anuncio-banner');
}

/** Espera o banner (faixa desenhada + "banner nativo" do provedor falso visível). */
export async function esperarBanner(page: Page) {
  await expect(faixa(page)).toBeVisible();
  await expect.poll(async () => (await chamadas(page)).bannerVisivel).toBe(true);
}

export async function semBanner(page: Page) {
  await expect(faixa(page)).toHaveCount(0);
  await expect.poll(async () => (await chamadas(page)).bannerVisivel ?? false).toBe(false);
}

/** Registra erros de CSP (console e pageerror) para conferir no fim. */
export function vigiarCsp(page: Page): string[] {
  const violacoes: string[] = [];
  page.on('console', (m) => {
    if (/content security policy|refused to (apply|execute|load|connect)/i.test(m.text())) violacoes.push(m.text());
  });
  page.on('pageerror', (e) => {
    if (/content security policy/i.test(e.message)) violacoes.push(e.message);
  });
  return violacoes;
}

export async function escolherNoAviso(page: Page, qual: 'personalizado' | 'nao-personalizado') {
  await page.getByTestId(qual === 'personalizado' ? 'consent-personalizado' : 'consent-nao-personalizado').click();
  await expect(page.getByTestId('consent-aviso')).toHaveCount(0);
}
