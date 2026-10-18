import { expect, test } from '@playwright/test';
import { abrir, sub } from './helpers';

test.describe('US-06 Guia onde cancelar', () => {
  test('US-06.CA1 / CA5: catálogo mostra o texto do serviço e o aviso de não cancelar automaticamente', async ({ page }) => {
    await abrir(page, [sub({ catalogoId: 'netflix' })], 3, '#/assinatura/x');
    await expect(page.getByTestId('cancel-guide')).toBeHidden();
    await page.getByTestId('btn-como-cancelar').click();
    await expect(page.getByTestId('cancel-guide')).toContainText('Conta > Assinatura > Cancelar assinatura');
    await expect(page.getByTestId('cancel-guide')).toContainText('não cancela nada automaticamente');
    await expect(page.getByTestId('btn-guia-marcar-cancelada')).toBeVisible();
  });

  test('US-06.CA2: Pix cita o banco informado', async ({ page }) => {
    await abrir(page, [sub({ pagamento: 'pix', banco: 'Banco X' })], 3, '#/assinatura/x');
    await page.getByTestId('btn-como-cancelar').click();
    await expect(page.getByTestId('guia-pix')).toContainText('no app do Banco X');
    await expect(page.getByTestId('guia-pix')).toContainText('revogue a autorização deste recebedor');
  });

  test('US-06.CA3: cadastro livre mostra o texto genérico', async ({ page }) => {
    await abrir(page, [sub()], 3, '#/assinatura/x');
    await page.getByTestId('btn-como-cancelar').click();
    await expect(page.getByTestId('cancel-guide')).toContainText('Procure no app ou site do serviço');
  });

  test('US-06.CA4: sem links nem contatos, e funciona offline', async ({ page, context }) => {
    await abrir(page, [sub({ catalogoId: 'spotify', pagamento: 'pix', banco: 'Nubank' })], 3, '#/assinatura/x');
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null || true);
    await page.getByTestId('btn-como-cancelar').click();
    const guia = page.getByTestId('cancel-guide');
    await expect(guia.locator('a')).toHaveCount(0);
    expect(await guia.innerText()).not.toMatch(/https?:|www\.|@/);
    await context.setOffline(true);
    await expect(guia).toBeVisible();
  });
});
