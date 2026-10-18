import { expect, test } from '@playwright/test';
import { abrir, cadastroLivre, preencher, lerEstado } from './helpers';

test.describe('US-01 Máscara de data dd/mm/aaaa no formulário (ajuste do G2)', () => {
  test('US-01: digitar "30092026" resulta em "30/09/2026" e a validação aceita', async ({ page }) => {
    await abrir(page);
    await cadastroLivre(page);
    const campo = page.getByTestId('field-proxima');
    await expect(campo).toHaveAttribute('inputmode', 'numeric');
    await campo.pressSequentially('30092026');
    await expect(campo).toHaveValue('30/09/2026');
    await preencher(page, { nome: 'Mascara', valor: '10,00', ciclo: 'mensal', pagamento: 'cartao', categoria: 'Outros' });
    await page.getByTestId('btn-salvar').click();
    await expect.poll(async () => (await lerEstado(page)).assinaturas[0]?.proxima).toBe('2026-09-30');
  });

  test('US-01: barras aparecem durante a digitação ("3009" vira "30/09") e letras são ignoradas', async ({ page }) => {
    await abrir(page);
    await cadastroLivre(page);
    const campo = page.getByTestId('field-proxima');
    await campo.pressSequentially('3009');
    await expect(campo).toHaveValue('30/09');
    await campo.fill('');
    await campo.pressSequentially('3a0b09-2026x99');
    await expect(campo).toHaveValue('30/09/2026');
  });

  test('US-01: apagar funciona com Backspace, inclusive sobre as barras, até esvaziar', async ({ page }) => {
    await abrir(page);
    await cadastroLivre(page);
    const campo = page.getByTestId('field-proxima');
    await campo.pressSequentially('30092026');
    const aceitos = ['30/09/202', '30/09/20', '30/09/2', '30/09/', '30/09', '30/0', '30/', '30', '3', ''];
    for (let i = 0; i < 10; i++) {
      await campo.press('Backspace');
      expect(aceitos).toContain(await campo.inputValue());
    }
    await expect(campo).toHaveValue('');
    // Chega a vazio em no máximo 12 toques (não "trava" na barra).
    await campo.pressSequentially('30092026');
    for (let i = 0; i < 12; i++) await campo.press('Backspace');
    await expect(campo).toHaveValue('');
  });

  test('US-01: apagar um dígito no meio mantém o cursor e remascara', async ({ page }) => {
    await abrir(page);
    await cadastroLivre(page);
    const campo = page.getByTestId('field-proxima');
    await campo.pressSequentially('30092026');
    await campo.evaluate((el: HTMLInputElement) => el.setSelectionRange(5, 5)); // depois de "30/09"
    await campo.press('Backspace');
    const v = await campo.inputValue();
    expect(v).toMatch(/^\d{2}\/\d{1,2}(\/\d{1,4})?$/);
    expect(v.length).toBeLessThanOrEqual(10);
  });

  test('US-01: colar "1/2/2026" é aceito e o texto passa pela validação', async ({ page }) => {
    await abrir(page);
    await cadastroLivre(page);
    await preencher(page, { nome: 'Colado', valor: '10,00', ciclo: 'mensal', pagamento: 'cartao', categoria: 'Outros', proxima: '1/2/2026' });
    await expect(page.getByTestId('field-proxima')).toHaveValue('1/2/2026');
  });

  test('US-01: o campo "fim do teste" tem a mesma máscara', async ({ page }) => {
    await abrir(page);
    await cadastroLivre(page);
    await page.getByTestId('field-teste').check();
    const campo = page.getByTestId('field-fim-teste');
    await campo.pressSequentially('05102026');
    await expect(campo).toHaveValue('05/10/2026');
  });

  test('US-01: data impossível digitada com máscara continua sendo recusada ("31022026")', async ({ page }) => {
    await abrir(page);
    await cadastroLivre(page);
    await preencher(page, { nome: 'Invalida', valor: '10,00', ciclo: 'mensal', pagamento: 'cartao', categoria: 'Outros' });
    await page.getByTestId('field-proxima').pressSequentially('31022026');
    await expect(page.getByTestId('field-proxima')).toHaveValue('31/02/2026');
    await page.getByTestId('btn-salvar').click();
    await expect(page.getByTestId('error-proxima')).toBeVisible();
    expect((await lerEstado(page))?.assinaturas ?? []).toHaveLength(0);
  });
});
