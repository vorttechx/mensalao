import { expect, test } from '@playwright/test';
import { abrir, lerEstado, sub } from './helpers';

test.describe('US-05 Editar, pausar, cancelar, excluir', () => {
  test('US-05.CA1: editar reflete na lista, e valida como a US-01', async ({ page }) => {
    await abrir(page, [sub()], 3, '#/assinatura/x');
    await page.getByTestId('btn-editar').click();
    await expect(page.getByTestId('field-nome')).toHaveValue('Netflix');
    await page.getByTestId('field-nome').fill('   ');
    await page.getByTestId('btn-salvar').click();
    await expect(page.getByTestId('error-nome')).toBeVisible();
    await page.getByTestId('field-nome').fill('Netflix Premium');
    await page.getByTestId('btn-salvar').click();
    await page.goto('./#/');
    await expect(page.getByTestId('upcoming-item')).toContainText('Netflix Premium');
  });

  test('US-05.CA2: pausar tira de totais e próximas, mas fica na lista com "Pausada"', async ({ page }) => {
    await abrir(page, [sub()], 3, '#/assinatura/x');
    await page.getByTestId('btn-pausar').click();
    expect((await lerEstado(page)).assinaturas[0].status).toBe('pausada');
    await page.goto('./#/');
    await expect(page.getByTestId('upcoming-item')).toHaveCount(0);
    await page.goto('./#/assinaturas');
    await expect(page.getByTestId('sub-item')).toContainText('Netflix');
    await expect(page.getByTestId('badge-pausada')).toContainText('Pausada');
  });

  test('US-05.CA3: marcar como cancelada guarda a data e aparece em Canceladas', async ({ page }) => {
    await abrir(page, [sub()], 3, '#/assinatura/x');
    await page.getByTestId('btn-cancelar').click();
    const a = (await lerEstado(page)).assinaturas[0];
    expect(a.status).toBe('cancelada');
    expect(a.canceladaEm).toBe('2026-09-30');
    await page.goto('./#/assinaturas');
    await page.getByTestId('filtro-canceladas').locator('summary').click();
    await expect(page.getByTestId('canceladas-list')).toContainText('Netflix');
    await page.goto('./#/totais');
    await expect(page.getByTestId('total-mensal')).toHaveText('R$ 0,00');
  });

  test('US-05.CA4: reativar com data passada avança o ciclo', async ({ page }) => {
    await abrir(page, [sub({ status: 'pausada', proxima: '2026-08-20', diaRef: 20 })], 3, '#/assinatura/x');
    await page.getByTestId('btn-reativar').click();
    const a = (await lerEstado(page)).assinaturas[0];
    expect(a.status).toBe('ativa');
    expect(a.proxima).toBe('2026-10-20');
  });

  test('US-05.CA5: excluir pede confirmação; cancelar mantém; confirmar remove', async ({ page }) => {
    await abrir(page, [sub({ historico: [{ data: '2026-09-10', deCentavos: 100, paraCentavos: 4490 }] })], 3, '#/assinatura/x');
    await page.getByTestId('btn-excluir').click();
    await expect(page.getByTestId('confirm-dialog')).toContainText('Excluir Netflix?');
    await expect(page.getByTestId('confirm-dialog')).toContainText('Esta ação não pode ser desfeita.');
    await page.getByTestId('btn-dialogo-voltar').click();
    expect((await lerEstado(page)).assinaturas).toHaveLength(1);
    await page.getByTestId('btn-excluir').click();
    await page.getByTestId('btn-confirmar').click();
    await expect.poll(async () => (await lerEstado(page)).assinaturas.length).toBe(0);
  });

  test('US-05.CA6: excluir a última leva ao estado vazio', async ({ page }) => {
    await abrir(page, [sub()], 3, '#/assinatura/x');
    await page.getByTestId('btn-excluir').click();
    await page.getByTestId('btn-confirmar').click();
    await expect(page.getByTestId('confirm-dialog')).toBeHidden();
    await expect(page.getByTestId('btn-excluir')).toHaveCount(0);
    await page.goto('./#/');
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('US-05.CA7: alterações persistem após recarregar', async ({ page }) => {
    await abrir(page, [sub()], 3, '#/assinatura/x');
    await page.getByTestId('btn-pausar').click();
    await page.reload();
    await expect(page.getByTestId('btn-reativar')).toBeVisible();
  });
});
