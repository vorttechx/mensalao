import { expect, test } from '@playwright/test';
import { abrir, cadastroLivre, lerEstado, preencher } from './helpers';

test.describe('US-01 Cadastro', () => {
  test('US-01.CA1: busca "net" mostra Netflix, sem diferenciar caixa', async ({ page }) => {
    await abrir(page, null, 3, '#/nova');
    await page.getByTestId('catalog-search').fill('NET');
    await expect(page.getByTestId('catalog-item').filter({ hasText: 'Netflix' })).toBeVisible();
    await expect(page.getByTestId('catalog-item')).toContainText([/Netflix/]);
  });

  test('US-01.CA2: Spotify pré-preenche nome, valor, ciclo e categoria, tudo editável', async ({ page }) => {
    await abrir(page, null, 3, '#/nova');
    await page.getByTestId('catalog-item').filter({ hasText: 'Spotify' }).click();
    await expect(page.getByTestId('field-nome')).toHaveValue('Spotify');
    await expect(page.getByTestId('field-valor')).toHaveValue('21,90');
    await expect(page.getByTestId('field-ciclo')).toHaveValue('mensal');
    await expect(page.getByTestId('field-categoria')).toHaveValue('Música');
    for (const id of ['field-nome', 'field-valor', 'field-ciclo', 'field-categoria']) {
      await expect(page.getByTestId(id)).toBeEnabled();
    }
    await page.getByTestId('field-valor').fill('25,00');
    await expect(page.getByTestId('field-valor')).toHaveValue('25,00');
  });

  test('US-01.CA3 / CA11: formulário livre vazio, com labels e testids', async ({ page }) => {
    await abrir(page);
    await cadastroLivre(page);
    for (const id of ['field-nome', 'field-valor', 'field-ciclo', 'field-proxima', 'field-pagamento', 'field-banco', 'field-categoria', 'field-teste', 'btn-salvar']) {
      await expect(page.getByTestId(id)).toBeVisible();
    }
    await expect(page.getByTestId('field-nome')).toHaveValue('');
    await expect(page.getByTestId('field-valor')).toHaveValue('');
    for (const rot of ['Nome', 'Forma de pagamento', 'Ciclo', 'Categoria']) {
      await expect(page.getByLabel(rot, { exact: false }).first()).toBeVisible();
    }
    const opcoes = await page.getByTestId('field-pagamento').locator('option').allTextContents();
    expect(opcoes.join('|')).toMatch(/Cartão.*Pix Automático.*Boleto.*Débito/);
    const ciclos = await page.getByTestId('field-ciclo').locator('option').allTextContents();
    expect(ciclos.join('|')).toMatch(/Mensal.*Anual.*Semanal/);
  });

  test('US-01.CA4: valor 39,90 grava 3990 e exibe R$ 39,90', async ({ page }) => {
    await abrir(page);
    await cadastroLivre(page);
    await preencher(page, { nome: 'Academia X', valor: '39,90', ciclo: 'mensal', proxima: '15/10/2026', pagamento: 'cartao', categoria: 'Saúde e bem-estar' });
    await page.getByTestId('btn-salvar').click();
    expect((await lerEstado(page)).assinaturas[0].valorCentavos).toBe(3990);
    await page.goto('./#/');
    await expect(page.getByTestId('upcoming-item').getByTestId('item-valor')).toHaveText('R$ 39,90');
  });

  for (const v of ['', '0', '-5', 'abc', '10,999']) {
    test(`US-01.CA5: valor "${v}" não salva, mostra erro e mantém o nome`, async ({ page }) => {
      await abrir(page);
      await cadastroLivre(page);
      await preencher(page, { nome: 'Teste', valor: v, ciclo: 'mensal', proxima: '15/10/2026', pagamento: 'cartao', categoria: 'Outros' });
      await page.getByTestId('btn-salvar').click();
      await expect(page.getByTestId('error-valor')).toBeVisible();
      await expect(page.getByTestId('field-valor')).toHaveAttribute('aria-invalid', 'true');
      await expect(page.getByTestId('field-nome')).toHaveValue('Teste');
      expect(await lerEstado(page)).toBeNull();
    });
  }

  test('US-01.CA6: nome só com espaços -> "Informe o nome"', async ({ page }) => {
    await abrir(page);
    await cadastroLivre(page);
    await preencher(page, { nome: '   ', valor: '10', ciclo: 'mensal', proxima: '15/10/2026', pagamento: 'cartao', categoria: 'Outros' });
    await page.getByTestId('btn-salvar').click();
    await expect(page.getByTestId('error-nome')).toContainText('Informe o nome');
    expect(await lerEstado(page)).toBeNull();
  });

  for (const d of ['', '31/02/2026']) {
    test(`US-01.CA7: próxima cobrança "${d}" gera erro no campo de data`, async ({ page }) => {
      await abrir(page);
      await cadastroLivre(page);
      await preencher(page, { nome: 'A', valor: '10', ciclo: 'mensal', proxima: d, pagamento: 'cartao', categoria: 'Outros' });
      await page.getByTestId('btn-salvar').click();
      await expect(page.getByTestId('error-proxima')).toBeVisible();
    });
  }

  test('US-01.CA8: data passada é avançada (15/08 -> 15/10) e avisada', async ({ page }) => {
    await abrir(page);
    await cadastroLivre(page);
    await preencher(page, { nome: 'A', valor: '10', ciclo: 'mensal', proxima: '15/08/2026', pagamento: 'cartao', categoria: 'Outros' });
    await page.getByTestId('btn-salvar').click();
    await expect(page.getByTestId('aviso-data-avancada')).toBeVisible();
    expect((await lerEstado(page)).assinaturas[0].proxima).toBe('2026-10-15');
  });

  test('US-01.CA9: teste grátis exige fim; sem teste o campo fica oculto', async ({ page }) => {
    await abrir(page);
    await cadastroLivre(page);
    await expect(page.getByTestId('field-fim-teste')).toBeHidden();
    await page.getByTestId('field-teste').check();
    await expect(page.getByTestId('field-fim-teste')).toBeVisible();
    await preencher(page, { nome: 'A', valor: '10', ciclo: 'mensal', proxima: '15/10/2026', pagamento: 'cartao', categoria: 'Outros' });
    await page.getByTestId('btn-salvar').click();
    await expect(page.getByTestId('error-fim-teste')).toBeVisible();
    expect(await lerEstado(page)).toBeNull();
    await page.getByTestId('field-teste').uncheck();
    await expect(page.getByTestId('field-fim-teste')).toBeHidden();
  });

  test('US-01.CA2 + CA10: salvar do catálogo (escolhendo pagamento e próxima) persiste após recarregar e offline', async ({ page, context }) => {
    await abrir(page, null, 3, '#/nova');
    await page.getByTestId('catalog-item').filter({ hasText: 'Netflix' }).click();
    await page.getByTestId('field-pagamento').selectOption('cartao');
    await page.getByTestId('field-proxima').fill('20/10/2026');
    await page.getByTestId('btn-salvar').click();
    await expect(page.getByTestId('upcoming-item')).toContainText('Netflix');
    await page.reload();
    await expect(page.getByTestId('upcoming-item')).toContainText('Netflix');
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByTestId('upcoming-item')).toContainText('Netflix');
  });
});
