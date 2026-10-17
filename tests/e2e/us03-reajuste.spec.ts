import { expect, test } from '@playwright/test';
import { abrir, lerEstado, sub } from './helpers';

async function editarValor(page: import('@playwright/test').Page, valor: string) {
  await page.getByTestId('btn-editar').click();
  await page.getByTestId('field-valor').fill(valor);
  await page.getByTestId('btn-salvar').click();
}

test.describe('US-03 Reajuste', () => {
  test('US-03.CA1: 39,90 -> 44,90 mostra selo e guarda histórico', async ({ page }) => {
    await abrir(page, [sub({ valorCentavos: 3990 })], 3, '#/assinatura/x');
    await editarValor(page, '44,90');
    expect((await lerEstado(page)).assinaturas[0].historico).toEqual([{ data: '2026-09-30', deCentavos: 3990, paraCentavos: 4490 }]);
    await page.goto('./#/');
    await expect(page.getByTestId('upcoming-item').getByTestId('badge-reajuste')).toContainText('subiu 12,5% (R$ 5,00)');
  });

  test('US-03.CA2 / CA8: 19,90 -> 21,90 = 10,1%; selo também na lista geral', async ({ page }) => {
    await abrir(page, [sub({ valorCentavos: 2190, historico: [{ data: '2026-09-10', deCentavos: 1990, paraCentavos: 2190 }] })], 3, '#/assinaturas');
    await expect(page.getByTestId('sub-item').getByTestId('badge-reajuste')).toContainText('subiu 10,1% (R$ 2,00)');
  });

  test('US-03.CA3: redução mostra "caiu R$ 5,00 (11,1%)"', async ({ page }) => {
    await abrir(page, [sub({ valorCentavos: 4490 })], 3, '#/assinatura/x');
    await editarValor(page, '39,90');
    await page.goto('./#/');
    await expect(page.getByTestId('badge-reajuste')).toContainText('caiu R$ 5,00 (11,1%)');
  });

  test('US-03.CA4 / CA6: editar sem mudar valor não cria histórico nem selo', async ({ page }) => {
    await abrir(page, [sub()], 3, '#/assinatura/x');
    await expect(page.getByTestId('badge-reajuste')).toHaveCount(0);
    await page.getByTestId('btn-editar').click();
    await page.getByTestId('field-nome').fill('Netflix 2');
    await page.getByTestId('btn-salvar').click();
    const e = await lerEstado(page);
    expect(e.assinaturas[0].nome).toBe('Netflix 2');
    expect(e.assinaturas[0].historico).toEqual([]);
    await page.goto('./#/');
    await expect(page.getByTestId('badge-reajuste')).toHaveCount(0);
  });

  test('US-03.CA5: detalhe mostra histórico em ordem cronológica', async ({ page }) => {
    await abrir(page, [sub({ valorCentavos: 3990, historico: [
      { data: '2026-05-01', deCentavos: 2990, paraCentavos: 3490 },
      { data: '2026-08-01', deCentavos: 3490, paraCentavos: 3990 },
    ] })], 3, '#/assinatura/x');
    const itens = page.getByTestId('price-history-item');
    await expect(itens).toHaveCount(2);
    await expect(itens.nth(0)).toContainText('01/05/2026');
    await expect(itens.nth(1)).toContainText('01/08/2026');
    await expect(page.getByTestId('price-history')).toContainText('R$ 29,90');
  });

  test('US-03.CA7: valor inválido na edição não altera o histórico', async ({ page }) => {
    await abrir(page, [sub()], 3, '#/assinatura/x');
    for (const v of ['', '0', '-3', 'abc']) {
      await editarValor(page, v);
      await expect(page.getByTestId('error-valor')).toBeVisible();
      await page.goBack();
    }
    expect((await lerEstado(page)).assinaturas[0].historico).toEqual([]);
    expect((await lerEstado(page)).assinaturas[0].valorCentavos).toBe(4490);
  });
});
