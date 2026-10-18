import { expect, test } from '@playwright/test';
import { lerChave, abrirS2, sub } from './helpers2';
import { lerEstado } from './helpers';

// Reteste do BUG-01 (US-09.CA2 / CA11): diálogos modais fecham sem executar a ação quando a rota muda.
test.describe('BUG-01 diálogos modais e mudança de rota', () => {
  test('US-05.CA5 / BUG-01: diálogo de excluir fecha sem excluir quando a rota muda', async ({ page }) => {
    await abrirS2(page, { assinaturas: [sub({ id: 'x' })], hash: '#/assinatura/x' });
    await page.getByTestId('btn-excluir').click();
    await expect(page.getByTestId('confirm-dialog')).toBeVisible();
    await page.evaluate(() => { location.hash = '#/ajustes'; });
    await expect(page.getByTestId('confirm-dialog')).toHaveCount(0);
    await page.waitForTimeout(300);
    expect((await lerEstado(page)).assinaturas).toHaveLength(1);
    await expect(page).toHaveURL(/#\/ajustes$/);
  });

  test('US-13.CA5 / BUG-01: diálogo de permissão fecha sem ligar o lembrete nem pedir permissão quando a rota muda', async ({ page }) => {
    await abrirS2(page, { pro: true, hash: '#/ajustes' });
    await page.getByTestId('lembrete-ativar').check({ force: true });
    await expect(page.getByTestId('lembrete-dialogo')).toBeVisible();
    await page.evaluate(() => { location.hash = '#/'; });
    await expect(page.getByTestId('lembrete-dialogo')).toHaveCount(0);
    await page.waitForTimeout(300);
    expect(JSON.parse((await lerChave(page, 'mensalao:teste:notificacao')) ?? '{}').permissao ?? 'default').toBe('default');
    const prefs = await lerChave(page, 'mensalao:prefs:v1');
    expect(prefs ? JSON.parse(prefs).lembrete?.ativo ?? false : false).toBe(false);
  });

  test('US-09.CA2 / BUG-01: "Agora não" não navega de novo e o aviso não fica após Voltar do navegador', async ({ page }) => {
    await abrirS2(page, { assinaturas: Array.from({ length: 5 }, (_, i) => sub({ id: 'a' + i, nome: 'S' + i })) });
    await page.getByTestId('btn-adicionar').click();
    await expect(page.getByTestId('limite-aviso')).toBeVisible();
    await page.evaluate(() => { location.hash = '#/pro'; });
    await expect(page.getByTestId('limite-aviso')).toHaveCount(0);
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/#\/pro$/);
    await expect(page.getByTestId('pro-tela')).toBeVisible();
  });
});
