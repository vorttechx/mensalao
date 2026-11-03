// BUG-02 da sprint 4 (aparelho): no Android com tela de ponta a ponta, o título ficava sob a barra de status.
// O Capacitor informa a altura da barra em --safe-area-inset-top; o topo do app tem de começar abaixo dela.
import { expect, test } from '@playwright/test';
import { abrirS2 } from './helpers2';

test.describe('BUG-02 (sprint 4): área da barra de status', () => {
  for (const rota of ['#/', '#/assinaturas', '#/totais', '#/ajustes', '#/pro']) {
    test(`${rota}: o topo começa abaixo da barra de status informada pelo Capacitor`, async ({ page }) => {
      await abrirS2(page);
      await page.goto('./' + rota);
      const topo = page.locator('.app > :first-child');
      await expect(topo).toBeVisible();
      const antes = (await topo.boundingBox())!.y;
      await page.evaluate(() => document.documentElement.style.setProperty('--safe-area-inset-top', '32px'));
      await expect.poll(async () => (await topo.boundingBox())!.y).toBeGreaterThanOrEqual(antes + 32 - 0.5);
      // Sem o valor do Capacitor (navegador ou WebView que já recua o conteúdo), nada muda.
      await page.evaluate(() => document.documentElement.style.setProperty('--safe-area-inset-top', '0px'));
      await expect.poll(async () => (await topo.boundingBox())!.y).toBeLessThanOrEqual(antes + 0.5);
    });
  }
});
