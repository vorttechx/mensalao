// Helpers da sprint 2 (QA): abrir o app já no plano desejado, com o provedor falso configurado.
import { expect, type Page } from '@playwright/test';
import { sub } from './helpers';

export { sub };
export const SKU = 'mensalao_pro';

export interface OpcoesS2 {
  assinaturas?: unknown[] | null;
  diasAviso?: number;
  /** Controle do provedor falso (mensalao:teste:provedor). */
  provedor?: Record<string, unknown>;
  /** true = a conta da Play tem o Pro e o cache local também (abre como Pro). */
  pro?: boolean;
  notificacao?: Record<string, unknown>;
  prefs?: Record<string, unknown>;
  copias?: unknown[];
  /** Valor bruto de mensalao:pro:v1. */
  proBruto?: string;
  hash?: string;
  relogio?: string;
}

export function ativas(n: number, p: Record<string, unknown> = {}) {
  return Array.from({ length: n }, (_, i) => sub({ id: `a${i}`, nome: `Servico ${i}`, proxima: '2026-10-20', ...p }));
}

export async function abrirS2(page: Page, o: OpcoesS2 = {}) {
  await page.clock.setFixedTime(o.relogio ?? '2026-09-30T12:00:00-03:00');
  await page.goto('./');
  const entradas: [string, string][] = [];
  if (o.assinaturas) entradas.push(['mensalao:v1', JSON.stringify({ versao: 1, config: { diasAviso: o.diasAviso ?? 3 }, assinaturas: o.assinaturas })]);
  const prov = { ...(o.provedor ?? {}) } as Record<string, unknown>;
  if (o.pro) {
    prov.compras = [...((prov.compras as string[]) ?? []), SKU];
    entradas.push(['mensalao:pro:v1', JSON.stringify({ pro: true, sku: SKU, verificadoEm: '2026-09-01T00:00:00.000Z' })]);
  }
  if (o.proBruto !== undefined) entradas.push(['mensalao:pro:v1', o.proBruto]);
  if (Object.keys(prov).length) entradas.push(['mensalao:teste:provedor', JSON.stringify(prov)]);
  if (o.notificacao) entradas.push(['mensalao:teste:notificacao', JSON.stringify(o.notificacao)]);
  if (o.prefs) entradas.push(['mensalao:prefs:v1', JSON.stringify(o.prefs)]);
  if (o.copias) entradas.push(['mensalao:copias:v1', JSON.stringify(o.copias)]);
  await page.evaluate((e) => e.forEach(([k, v]) => localStorage.setItem(k, v)), entradas);
  // Só uma recarga depois de semear: cada abertura roda a verificação da loja (o aviso de revogação é por abertura).
  if (o.hash) await page.evaluate((h) => { location.hash = h; }, o.hash);
  await page.reload();
}

export async function configurarProvedor(page: Page, parcial: Record<string, unknown>) {
  await page.evaluate((p) => (window as any).__mensalaoTeste.provedor.configurar(p), parcial);
}

export async function lerChave(page: Page, k: string) {
  return page.evaluate((c) => localStorage.getItem(c), k);
}

export async function ehProNaTela(page: Page) {
  return page.getByTestId('selo-pro').isVisible();
}

export async function semRolagemHorizontal(page: Page) {
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(r.sw).toBeLessThanOrEqual(r.cw);
}

export function backupArquivo(assinaturas: unknown[], extra: Record<string, unknown> = {}) {
  return {
    name: 'b.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ formato: 'mensalao-backup', versao: 1, exportadoEm: '2026-09-30T12:00:00.000Z', config: { diasAviso: 3 }, assinaturas, ...extra })),
  };
}
