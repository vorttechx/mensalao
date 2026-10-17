import { expect, test } from '@playwright/test';
import { abrir, lerEstado, sub } from './helpers';

test.describe('US-02 Próximas cobranças', () => {
  test('US-02.CA1 / CA11: ordenação, e dados do item', async ({ page }) => {
    await abrir(page, [
      sub({ id: '1', nome: 'Zeta', proxima: '2026-10-20', pagamento: 'pix', banco: 'Nubank' }),
      sub({ id: '2', nome: 'Alfa', proxima: '2026-10-20' }),
      sub({ id: '3', nome: 'Cedo', proxima: '2026-10-10' }),
    ]);
    const itens = page.getByTestId('upcoming-item');
    await expect(itens.getByTestId('item-nome')).toHaveText(['Cedo', 'Alfa', 'Zeta']);
    await expect(itens.nth(2)).toContainText('R$ 44,90');
    await expect(itens.nth(2)).toContainText('20/10/2026');
    await expect(itens.nth(2)).toContainText('Pix Automático');
  });

  test('US-02.CA2: N=3, destaque em 30/09 e 03/10, não em 04/10', async ({ page }) => {
    await abrir(page, [
      sub({ id: '1', nome: 'A', proxima: '2026-09-30' }),
      sub({ id: '2', nome: 'B', proxima: '2026-10-03' }),
      sub({ id: '3', nome: 'C', proxima: '2026-10-04' }),
    ]);
    const itens = page.getByTestId('upcoming-item');
    await expect(itens.nth(0).getByTestId('badge-vence-logo')).toContainText('hoje');
    await expect(itens.nth(1).getByTestId('badge-vence-logo')).toContainText('em 3 dias');
    await expect(itens.nth(2).getByTestId('badge-vence-logo')).toHaveCount(0);
  });

  test('US-02.CA3: alterar N para 7 amplia o destaque e persiste; valor inválido mantém o anterior', async ({ page }) => {
    await abrir(page, [sub({ id: '1', proxima: '2026-10-04' })]);
    await expect(page.getByTestId('badge-vence-logo')).toHaveCount(0);
    await page.getByTestId('nav-ajustes').click();
    await page.getByTestId('config-dias-aviso').fill('7');
    await page.getByTestId('btn-salvar-config').click();
    expect((await lerEstado(page)).config.diasAviso).toBe(7);
    await page.getByTestId('nav-inicio').click();
    await expect(page.getByTestId('badge-vence-logo')).toBeVisible();
    await page.getByTestId('nav-ajustes').click();
    for (const v of ['31', 'abc', '-1']) {
      await page.getByTestId('config-dias-aviso').fill(v);
      await page.getByTestId('btn-salvar-config').click();
      await expect(page.getByTestId('error-config-dias')).toBeVisible();
      expect((await lerEstado(page)).config.diasAviso).toBe(7);
    }
  });

  test('US-02.CA4: data vencida é avançada e persistida ao abrir', async ({ page }) => {
    await abrir(page, [sub({ proxima: '2026-08-20', diaRef: 20 })]);
    await expect(page.getByTestId('upcoming-item')).toContainText('20/10/2026');
    expect((await lerEstado(page)).assinaturas[0].proxima).toBe('2026-10-20');
  });

  test('US-02.CA5: anual vence 10/03/2027', async ({ page }) => {
    await abrir(page, [sub({ ciclo: 'anual', proxima: '2026-03-10', diaRef: 10 })]);
    await expect(page.getByTestId('upcoming-item')).toContainText('10/03/2027');
  });

  test('US-02.CA6: mensal dia 31 mantém o 31 quando o mês permite', async ({ page }) => {
    await abrir(page, [sub({ proxima: '2026-08-31', diaRef: 31 })]);
    await expect(page.getByTestId('upcoming-item')).toContainText('30/09/2026');
    await page.clock.setFixedTime('2026-10-01T12:00:00-03:00');
    await page.reload();
    await expect(page.getByTestId('upcoming-item')).toContainText('31/10/2026');
    await page.clock.setFixedTime('2026-11-01T12:00:00-03:00');
    await page.reload();
    await expect(page.getByTestId('upcoming-item')).toContainText('30/11/2026');
  });

  test('US-02.CA7: selo de teste grátis perto do fim', async ({ page }) => {
    await abrir(page, [sub({ emTeste: true, fimTeste: '2026-10-02' })]);
    await expect(page.getByTestId('badge-teste-fim')).toContainText('Teste grátis termina em 2 dias');
  });

  test('US-02.CA8: teste encerrado mostra aviso com a data', async ({ page }) => {
    await abrir(page, [sub({ emTeste: true, fimTeste: '2026-09-25' })]);
    await expect(page.getByTestId('aviso-teste-terminou')).toContainText('Teste terminou em 25/09/2026 — agora é cobrança normal');
    await expect(page.getByTestId('badge-teste-fim')).toHaveCount(0);
    await page.getByTestId('nav-totais').click();
    await expect(page.getByTestId('total-mensal')).toHaveText('R$ 44,90');
  });

  test('US-02.CA9: estado vazio com botão Adicionar assinatura', async ({ page }) => {
    await abrir(page);
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await page.getByRole('button', { name: /Adicionar assinatura/ }).click();
    await expect(page).toHaveURL(/#\/nova/);
  });

  test('US-02.CA10: pausadas e canceladas não aparecem', async ({ page }) => {
    await abrir(page, [sub({ id: '1', nome: 'P', status: 'pausada' }), sub({ id: '2', nome: 'C', status: 'cancelada', canceladaEm: '2026-09-01' }), sub({ id: '3', nome: 'Ativa' })]);
    await expect(page.getByTestId('upcoming-item')).toHaveCount(1);
    await expect(page.getByTestId('upcoming-item')).toContainText('Ativa');
  });
});
