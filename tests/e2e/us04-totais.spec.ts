import { expect, test } from '@playwright/test';
import { abrir, sub } from './helpers';

test.describe('US-04 Totais', () => {
  test('US-04.CA1: R$ 58,80/mês e R$ 705,60/ano; CA4/CA5 agrupamentos', async ({ page }) => {
    await abrir(page, [
      sub({ id: '1', nome: 'Netflix', valorCentavos: 4490, pagamento: 'cartao', categoria: 'Streaming de vídeo' }),
      sub({ id: '2', nome: 'Amazon Prime', valorCentavos: 16680, ciclo: 'anual', pagamento: 'pix', categoria: 'Compras' }),
    ], 3, '#/totais');
    await expect(page.getByTestId('total-mensal')).toHaveText('R$ 58,80');
    await expect(page.getByTestId('total-anual')).toHaveText('R$ 705,60');
    const pag = page.getByTestId('total-por-pagamento');
    await expect(pag).toContainText('Cartão');
    await expect(pag).toContainText('Pix Automático');
    await expect(pag).not.toContainText('Boleto');
    await expect(pag).not.toContainText('Débito');
    await expect(page.getByTestId('total-por-categoria-item').first()).toContainText('Streaming de vídeo');
  });

  test('US-04.CA2: semanal R$ 10,00 = R$ 43,33 e R$ 520,00', async ({ page }) => {
    await abrir(page, [sub({ valorCentavos: 1000, ciclo: 'semanal' })], 3, '#/totais');
    await expect(page.getByTestId('total-mensal')).toHaveText('R$ 43,33');
    await expect(page.getByTestId('total-anual')).toHaveText('R$ 520,00');
  });

  test('US-04.CA3: 3 x R$ 0,10 = R$ 0,30', async ({ page }) => {
    await abrir(page, [1, 2, 3].map((i) => sub({ id: String(i), valorCentavos: 10 })), 3, '#/totais');
    await expect(page.getByTestId('total-mensal')).toHaveText('R$ 0,30');
  });

  test('US-04.CA6 / CA7: pausadas, canceladas e teste vigente ficam fora; teste aparece à parte', async ({ page }) => {
    await abrir(page, [
      sub({ id: '1' }),
      sub({ id: '2', status: 'pausada' }),
      sub({ id: '3', status: 'cancelada', canceladaEm: '2026-09-01' }),
      sub({ id: '4', emTeste: true, fimTeste: '2026-10-10', valorCentavos: 3990 }),
    ], 3, '#/totais');
    await expect(page.getByTestId('total-mensal')).toHaveText('R$ 44,90');
    await expect(page.getByTestId('total-em-teste')).toContainText('1');
    await expect(page.getByTestId('total-em-teste')).toContainText('R$ 39,90');
  });

  test('US-04.CA8: vazio mostra R$ 0,00 e mensagem', async ({ page }) => {
    await abrir(page, null, 3, '#/totais');
    await expect(page.getByTestId('total-mensal')).toHaveText('R$ 0,00');
    await expect(page.getByTestId('empty-state-totais')).toBeVisible();
  });

  test('US-04.CA9: totais recalculam após pausar e excluir', async ({ page }) => {
    await abrir(page, [sub({ id: '1' }), sub({ id: '2', nome: 'Spotify', valorCentavos: 2190 })], 3, '#/totais');
    await expect(page.getByTestId('total-mensal')).toHaveText('R$ 66,80');
    await page.goto('./#/assinatura/2');
    await page.getByTestId('btn-pausar').click();
    await page.goto('./#/totais');
    await expect(page.getByTestId('total-mensal')).toHaveText('R$ 44,90');
    await page.goto('./#/assinatura/1');
    await page.getByTestId('btn-excluir').click();
    await page.getByTestId('btn-confirmar').click();
    await expect(page.getByTestId('confirm-dialog')).toBeHidden();
    await expect(page.getByTestId('btn-excluir')).toHaveCount(0);
    await page.goto('./#/totais');
    await expect(page.getByTestId('total-mensal')).toHaveText('R$ 0,00');
  });
});
