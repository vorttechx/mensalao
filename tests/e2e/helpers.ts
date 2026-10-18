import { expect, type Page } from '@playwright/test';

export const HOJE = '2026-09-30';
const CHAVE = 'mensalao:v1';

export function sub(p: Record<string, unknown> = {}) {
  return {
    id: 'x', nome: 'Netflix', valorCentavos: 4490, ciclo: 'mensal', proxima: '2026-10-20', diaRef: 20,
    pagamento: 'cartao', banco: '', categoria: 'Streaming de vídeo', emTeste: false, fimTeste: null,
    status: 'ativa', canceladaEm: null, catalogoId: null, historico: [], criadaEm: '2026-09-01', ...p,
  };
}

/** Fixa o relógio em 30/09/2026 e abre o app (opcionalmente com dados pré-gravados). */
export async function abrir(page: Page, assinaturas: unknown[] | null = null, diasAviso = 3, hash = '') {
  await page.clock.setFixedTime('2026-09-30T12:00:00-03:00');
  await page.goto('./');
  if (assinaturas) {
    await page.evaluate(([k, v]) => localStorage.setItem(k as string, v as string), [
      CHAVE, JSON.stringify({ versao: 1, config: { diasAviso }, assinaturas }),
    ]);
  }
  await page.goto('./' + hash);
  await page.reload();
}

export async function lerEstado(page: Page) {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), CHAVE);
}

export async function preencher(page: Page, d: { nome?: string; valor?: string; ciclo?: string; proxima?: string; pagamento?: string; banco?: string; categoria?: string }) {
  if (d.nome !== undefined) await page.getByTestId('field-nome').fill(d.nome);
  if (d.valor !== undefined) await page.getByTestId('field-valor').fill(d.valor);
  if (d.ciclo) await page.getByTestId('field-ciclo').selectOption(d.ciclo);
  if (d.proxima !== undefined) await page.getByTestId('field-proxima').fill(d.proxima);
  if (d.pagamento) await page.getByTestId('field-pagamento').selectOption(d.pagamento);
  if (d.banco !== undefined) await page.getByTestId('field-banco').fill(d.banco);
  if (d.categoria) await page.getByTestId('field-categoria').selectOption(d.categoria);
}

export async function cadastroLivre(page: Page) {
  await page.goto('./#/nova/form');
  await expect(page.getByTestId('form-assinatura')).toBeVisible();
}
