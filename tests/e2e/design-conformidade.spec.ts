import { expect, test } from '@playwright/test';
import { abrir, cadastroLivre, preencher, sub } from './helpers';

// Conferência com docs/design.md (seções 3.2, 4.3 e 2.7).
test.describe('Conformidade com o design', () => {
  test('design 3.2/CA5: erro ligado ao campo por aria-describedby e foco no primeiro campo com erro', async ({ page }) => {
    await abrir(page);
    await cadastroLivre(page);
    await page.getByTestId('btn-salvar').click();
    await expect(page.getByTestId('field-nome')).toBeFocused();
    const desc = await page.getByTestId('field-nome').getAttribute('aria-describedby');
    const erroId = await page.getByTestId('error-nome').getAttribute('id');
    expect(desc).toContain(erroId!);
  });

  test('design 4.3: banner de sucesso após salvar ("Spotify salva.")', async ({ page }) => {
    await abrir(page);
    await cadastroLivre(page);
    await preencher(page, { nome: 'Spotify', valor: '21,90', ciclo: 'mensal', proxima: '15/10/2026', pagamento: 'cartao', categoria: 'Música' });
    await page.getByTestId('btn-salvar').click();
    await expect(page.getByTestId('banner')).toContainText('Spotify salva.');
  });

  test('design 4.3: edição com reajuste diz "Netflix salva. Valor subiu 12,5% (R$ 5,00)."', async ({ page }) => {
    await abrir(page, [sub({ valorCentavos: 3990 })], 3, '#/assinatura/x');
    await page.getByTestId('btn-editar').click();
    await page.getByTestId('field-valor').fill('44,90');
    await page.getByTestId('btn-salvar').click();
    await expect(page.getByTestId('banner')).toContainText('Netflix salva. Valor subiu 12,5% (R$ 5,00).');
  });

  test('design 2.7: foco visível em botão e campo (outline ou sombra)', async ({ page }) => {
    await abrir(page);
    await cadastroLivre(page);
    await page.keyboard.press('Tab');
    await page.getByTestId('field-nome').focus();
    const estilo = await page.getByTestId('field-nome').evaluate((e) => { const s = getComputedStyle(e); return `${s.outlineStyle}|${s.outlineWidth}|${s.boxShadow}`; });
    expect(estilo).not.toMatch(/^none\|0px\|none$/);
  });
});
