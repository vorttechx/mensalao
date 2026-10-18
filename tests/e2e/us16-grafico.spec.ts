import { expect, test } from '@playwright/test';
import { abrirS2, ativas, semRolagemHorizontal, sub } from './helpers2';

const trio = [
  sub({ id: '1', nome: 'A', categoria: 'Streaming de vídeo', valorCentavos: 10000 }),
  sub({ id: '2', nome: 'B', categoria: 'Música', valorCentavos: 5000 }),
  sub({ id: '3', nome: 'C', categoria: 'Compras', valorCentavos: 5000 }),
];

test.describe('US-16 Gráfico por categoria (Pro)', () => {
  test('US-16.CA1: no grátis o gráfico é um cartão bloqueado e a lista por categoria continua', async ({ page }) => {
    await abrirS2(page, { assinaturas: trio, hash: '#/totais' });
    await expect(page.getByTestId('lock-grafico')).toBeVisible();
    await expect(page.getByTestId('grafico-categorias')).toHaveCount(0);
    await expect(page.getByTestId('total-por-categoria')).toBeVisible();
  });

  test('US-16.CA2 / CA3: Pro vê o gráfico com 50,0%, 25,0% e 25,0% (soma 100%) e valores em BRL', async ({ page }) => {
    await abrirS2(page, { pro: true, assinaturas: trio, hash: '#/totais' });
    await expect(page.getByTestId('grafico-categorias')).toBeVisible();
    await expect(page.getByTestId('grafico-categorias')).toContainText('Gasto mensal por categoria');
    await expect(page.getByTestId('grafico-pct')).toHaveText(['50,0%', '25,0%', '25,0%']);
    await expect(page.getByTestId('grafico-item').first()).toContainText('Streaming de vídeo');
    await expect(page.getByTestId('grafico-item').first()).toContainText('R$ 100,00');
  });

  test('US-16.CA2: usa só ativas fora de teste (mesma base de total-por-categoria)', async ({ page }) => {
    await abrirS2(page, {
      pro: true, hash: '#/totais',
      assinaturas: [...trio, sub({ id: '4', nome: 'P', categoria: 'Delivery', status: 'pausada' }), sub({ id: '5', nome: 'T', categoria: 'Telefonia', emTeste: true, fimTeste: '2026-10-05' })],
    });
    await expect(page.getByTestId('grafico-item')).toHaveCount(3);
  });

  test('US-16.CA3: três categorias iguais fecham exatamente 100,0%', async ({ page }) => {
    await abrirS2(page, { pro: true, hash: '#/totais', assinaturas: ['Streaming de vídeo', 'Música', 'Compras'].map((c, i) => sub({ id: String(i), nome: 'S' + i, categoria: c, valorCentavos: 1000 })) });
    const pcts = (await page.getByTestId('grafico-pct').allInnerTexts()).map((t) => Number(t.replace('%', '').replace(',', '.')));
    expect(Math.round(pcts.reduce((a, b) => a + b, 0) * 10)).toBe(1000);
  });

  test('US-16.CA4: mais de 6 categorias agrupam as menores em "Outras categorias"; a lista completa continua', async ({ page }) => {
    const cats = ['Streaming de vídeo', 'Música', 'Compras', 'Delivery', 'Telefonia', 'Educação', 'Outros', 'Casa e serviços'];
    await abrirS2(page, { pro: true, hash: '#/totais', assinaturas: cats.map((c, i) => sub({ id: String(i), nome: 'S' + i, categoria: c, valorCentavos: (cats.length - i) * 1000 })) });
    await expect(page.getByTestId('grafico-item')).toHaveCount(7);
    await expect(page.getByTestId('grafico-item').last()).toContainText('Outras categorias');
    await expect(page.getByTestId('grafico-item').first()).toContainText('Streaming de vídeo');
    await expect(page.getByTestId('total-por-categoria-item')).toHaveCount(8);
  });

  test('US-16.CA5: uma categoria = 100,0% sem erro de desenho', async ({ page }) => {
    await abrirS2(page, { pro: true, hash: '#/totais', assinaturas: ativas(2) });
    await expect(page.getByTestId('grafico-pct')).toHaveText(['100,0%']);
    await expect(page.locator('[data-testid="grafico-categorias"] svg circle')).toHaveCount(1);
  });

  test('US-16.CA6: lista vazia ou sem ativas mostra "Sem dados para o gráfico" sem NaN', async ({ page }) => {
    await abrirS2(page, { pro: true, hash: '#/totais' });
    await expect(page.getByTestId('grafico-vazio')).toHaveText('Sem dados para o gráfico');
    await abrirS2(page, { pro: true, hash: '#/totais', assinaturas: [sub({ status: 'pausada' })] });
    await expect(page.getByTestId('grafico-vazio')).toBeVisible();
    expect(await page.locator('body').innerText()).not.toContain('NaN');
  });

  test('US-16.CA7: 3 × R$ 0,10 totalizam R$ 0,30', async ({ page }) => {
    await abrirS2(page, { pro: true, hash: '#/totais', assinaturas: [1, 2, 3].map((i) => sub({ id: String(i), nome: 'S' + i, valorCentavos: 10 })) });
    await expect(page.getByTestId('grafico-categorias')).toContainText('R$ 0,30');
  });

  test('US-16.CA8: SVG com texto equivalente, legenda sempre visível e tabela legível', async ({ page }) => {
    await abrirS2(page, { pro: true, hash: '#/totais', assinaturas: trio });
    const svg = page.locator('[data-testid="grafico-categorias"] svg');
    await expect(svg).toHaveAttribute('role', 'img');
    await expect(svg.locator('title')).toContainText('Streaming de vídeo 50,0%');
    for (const t of await page.getByTestId('grafico-item').all()) {
      const txt = await t.innerText();
      expect(txt).toMatch(/R\$ [\d.,]+/);
      expect(txt).toMatch(/\d+,\d%/);
    }
  });

  test('US-16.CA9: cabe em 360 px sem rolagem horizontal', async ({ page }) => {
    const cats = ['Streaming de vídeo', 'Música', 'Compras', 'Delivery', 'Telefonia', 'Educação', 'Outros', 'Software / Produtividade'];
    await abrirS2(page, { pro: true, hash: '#/totais', assinaturas: cats.map((c, i) => sub({ id: String(i), nome: 'S' + i, categoria: c, valorCentavos: 123456 + i })) });
    await expect(page.getByTestId('grafico-categorias')).toBeVisible();
    await semRolagemHorizontal(page);
  });

  test('US-16.CA10: atualiza após pausar, reativar, cancelar e excluir', async ({ page }) => {
    await abrirS2(page, { pro: true, hash: '#/totais', assinaturas: trio });
    await expect(page.getByTestId('grafico-item')).toHaveCount(3);
    const status = async (id: string) => JSON.parse((await page.evaluate(() => localStorage.getItem('mensalao:v1')))!).assinaturas.find((x: any) => x.id === id)?.status;
    await page.goto('./#/assinatura/2');
    await page.getByTestId('btn-pausar').click();
    await expect.poll(() => status('2')).toBe('pausada');
    await page.goto('./#/totais');
    await expect(page.getByTestId('grafico-item')).toHaveCount(2);
    await expect(page.getByTestId('grafico-pct')).toHaveText(['66,7%', '33,3%']);
    await page.goto('./#/assinatura/2');
    await page.getByTestId('btn-reativar').click();
    await expect.poll(() => status('2')).toBe('ativa');
    await page.goto('./#/assinatura/3');
    await page.getByTestId('btn-cancelar').click();
    await expect.poll(() => status('3')).toBe('cancelada');
    await page.goto('./#/totais');
    await expect(page.getByTestId('grafico-item')).toHaveCount(2);
    await page.goto('./#/assinatura/1');
    await page.getByTestId('btn-excluir').click();
    await page.getByTestId('btn-confirmar').click();
    await expect.poll(async () => (await status('1')) ?? 'sumiu').toBe('sumiu');
    await page.goto('./#/totais');
    await expect(page.getByTestId('grafico-pct')).toHaveText(['100,0%']);
  });

  test('US-16.CA11: Pro revogado volta ao cartão bloqueado', async ({ page }) => {
    await abrirS2(page, { proBruto: JSON.stringify({ pro: true, sku: 'mensalao_pro', verificadoEm: 'x' }), provedor: { compras: [] }, assinaturas: trio, hash: '#/totais' });
    await expect(page.getByTestId('lock-grafico')).toBeVisible();
  });
});
