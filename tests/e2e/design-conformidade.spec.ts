import { expect, test } from '@playwright/test';
import { abrir, cadastroLivre, preencher, sub } from './helpers';

// Conferência com o design.md da sprint 3 (direção "Extrato"): 3.2 (campo e erro), 3.12 (aviso de status),
// 2.1 (foco visível) e 9.2 (microcopy que mudou). Comportamentos das sprints 1 e 2 continuam valendo.
test.describe('Conformidade com o design (sprint 3)', () => {
  test('design 3.2 / US-22.CA3: erro ligado ao campo por aria-describedby e foco no primeiro campo com erro', async ({ page }) => {
    await abrir(page);
    await cadastroLivre(page);
    await page.getByTestId('btn-salvar').click();
    await expect(page.getByTestId('field-nome')).toBeFocused();
    const desc = await page.getByTestId('field-nome').getAttribute('aria-describedby');
    const erroId = await page.getByTestId('error-nome').getAttribute('id');
    expect(desc).toContain(erroId!);
  });

  test('design 3.12: banner de sucesso após salvar ("Spotify salva.")', async ({ page }) => {
    await abrir(page);
    await cadastroLivre(page);
    await preencher(page, { nome: 'Spotify', valor: '21,90', ciclo: 'mensal', proxima: '15/10/2026', pagamento: 'cartao', categoria: 'Música' });
    await page.getByTestId('btn-salvar').click();
    await expect(page.getByTestId('banner')).toContainText('Spotify salva.');
  });

  test('design 3.12: edição com reajuste diz "Netflix salva. Valor subiu 12,5% (R$ 5,00)."', async ({ page }) => {
    await abrir(page, [sub({ valorCentavos: 3990 })], 3, '#/assinatura/x');
    await page.getByTestId('btn-editar').click();
    await page.getByTestId('field-valor').fill('44,90');
    await page.getByTestId('btn-salvar').click();
    await expect(page.getByTestId('banner')).toContainText('Netflix salva. Valor subiu 12,5% (R$ 5,00).');
  });

  test('design 2.1: foco visível de 3 px na cor de foco, afastado 2 px, em botão e campo pelo teclado', async ({ page }) => {
    await abrir(page);
    await cadastroLivre(page);
    await page.getByTestId('field-nome').focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('field-nome')).toBeFocused();
    const estilo = (t: string) => page.getByTestId(t).evaluate((e) => { const s = getComputedStyle(e); return `${s.outlineStyle}|${s.outlineWidth}|${s.outlineColor}|${s.outlineOffset}`; });
    expect(await estilo('field-nome')).toBe('solid|3px|rgb(29, 92, 63)|2px');
    await page.getByTestId('btn-salvar').focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    expect(await estilo('btn-salvar')).toMatch(/^solid\|3px\|rgb\(29, 92, 63\)/);
  });

  test('design 9.2 / 3.1: "+" com nome "Adicionar assinatura", 44×44, no topo; rótulo "Total por mês" no Início', async ({ page }) => {
    await abrir(page, [sub()]);
    const mais = page.getByTestId('btn-adicionar');
    await expect(mais).toHaveAccessibleName('Adicionar assinatura');
    const b = (await mais.boundingBox())!;
    expect([b.width, b.height]).toEqual([44, 44]);
    expect(b.y).toBeLessThan(60);
    expect(b.x + b.width).toBeGreaterThan(300);
    await expect(page.getByTestId('inicio-resumo')).toContainText('Total por mês');
    await page.getByTestId('nav-assinaturas').click();
    await expect(page.getByRole('button', { name: 'Adicionar assinatura' })).toBeVisible();
    expect(await page.locator('.fab').count()).toBe(0);
  });

  test('design 4.1 / 9.2: meta do item no Início com data curta; Detalhe e histórico continuam dd/mm/aaaa', async ({ page }) => {
    await abrir(page, [sub({ proxima: '2026-10-20', historico: [{ data: '2026-09-01', deCentavos: 3990, paraCentavos: 4490 }] })]);
    await expect(page.getByTestId('item-meta')).toHaveText('Ter, 20 out · Cartão');
    await page.goto('./#/assinatura/x');
    await expect(page.locator('main')).toContainText('20/10/2026');
    await expect(page.locator('main')).toContainText('01/09/2026');
  });
});
