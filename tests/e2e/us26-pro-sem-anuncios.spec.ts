// US-26 — Pro remove os anúncios. Provedor de anúncios e de compra FALSOS (IDs de teste).
// Não coberto aqui (só em aparelho, dev-notes §9 itens 5 a 8): compra real pelo Play Billing e reembolso na Play.
import { expect, test } from '@playwright/test';
import { abrirAnuncios, ativas, chamadas, configurarAnuncios, esperarBanner, estadoGravado, faixa, lerChave, semBanner } from './helpers4';
import { configurarProvedor } from './helpers2';

const PRO_JSON = JSON.stringify({ pro: true, sku: 'mensalao_pro', verificadoEm: '2026-09-01T00:00:00.000Z' });

async function nenhumaChamada(page: import('@playwright/test').Page) {
  const c = await chamadas(page);
  expect({ disponivel: c.disponivel, consultarGoogle: c.consultarGoogle, formularioGoogle: c.formularioGoogle, iniciar: c.iniciar, requisicoesBanner: c.requisicoesBanner, carregarPremiado: c.carregarPremiado }).toEqual({
    disponivel: 0, consultarGoogle: 0, formularioGoogle: 0, iniciar: 0, requisicoesBanner: 0, carregarPremiado: 0,
  });
}

test.describe('US-26 Pro sem anúncios', () => {
  test('US-26.CA1 / CA9: a tela Pro lista 7 benefícios, "Sem anúncios" com a explicação, a promessa e nenhum banner', async ({ page }) => {
    await abrirAnuncios(page, { hash: '#/pro' });
    await expect(page.getByTestId('pro-recursos').locator('li')).toHaveCount(7);
    await expect(page.getByTestId('pro-semanuncio')).toContainText('Sem anúncios');
    await expect(page.getByTestId('pro-semanuncio')).toContainText('O plano grátis mostra anúncios; o Pro remove todos.');
    await expect(page.getByTestId('pro-tela')).toContainText('Pague uma vez, use para sempre. Sem mensalidade e sem anúncios.');
    await semBanner(page);
  });

  test('US-26.CA2: comprar o Pro na sessão faz o banner sumir na hora, sem reiniciar e sem requisição nova', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), hash: '#/' });
    await esperarBanner(page);
    const antes = await chamadas(page);
    await page.evaluate(() => ((window as any).__marca = 'mesma-sessao'));
    await page.getByTestId('nav-ajustes').click();
    await page.evaluate(() => { location.hash = '#/pro'; });
    await page.getByTestId('pro-btn-comprar').click();
    await expect(page.getByTestId('pro-ativo')).toBeVisible();
    await page.getByTestId('pro-btn-voltar-app').click();
    await page.getByTestId('nav-inicio').click();
    await expect(page.getByTestId('selo-pro')).toBeVisible();
    await semBanner(page);
    await expect(page.locator('.com-anuncio')).toHaveCount(0);
    for (const aba of ['nav-assinaturas', 'nav-totais', 'nav-inicio']) {
      await page.getByTestId(aba).click();
      await expect(faixa(page)).toHaveCount(0);
    }
    expect(await page.evaluate(() => (window as any).__marca)).toBe('mesma-sessao'); // sem reiniciar
    const depois = await chamadas(page);
    expect(depois.requisicoesBanner).toBe(antes.requisicoesBanner);
    expect(depois.iniciar).toBe(antes.iniciar);
    expect(JSON.parse((await lerChave(page, 'mensalao:pro:v1'))!).pro).toBe(true);
  });

  test('US-26.CA2: o banner some mesmo sem sair da tela de listas (compra restaurada em outra aba da sessão)', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), hash: '#/assinaturas' });
    await esperarBanner(page);
    await page.evaluate(() => { location.hash = '#/pro'; });
    await configurarProvedor(page, { compras: ['mensalao_pro'] });
    await page.getByTestId('pro-btn-restaurar').click();
    await expect(page.getByTestId('pro-restaurar-msg')).toHaveText('Compra restaurada. Obrigado!'); // US-26.CA7
    await page.getByTestId('pro-btn-voltar-app').click();
    await semBanner(page);
    expect((await chamadas(page)).requisicoesBanner).toBe(1);
  });

  test('US-26.CA3: Pro confirmado pela loja — nenhum banner, nenhuma consulta de consentimento, SDK nunca iniciado', async ({ page }) => {
    await abrirAnuncios(page, { pro: true, assinaturas: ativas(3), escolha: null });
    await expect(page.getByTestId('selo-pro')).toBeVisible();
    for (const aba of ['nav-assinaturas', 'nav-totais', 'nav-inicio']) await page.getByTestId(aba).click();
    await page.waitForTimeout(500);
    await expect(faixa(page)).toHaveCount(0);
    await expect(page.getByTestId('consent-aviso')).toHaveCount(0);
    await nenhumaChamada(page);
  });

  test('US-26.CA3: Pro reaberto sem rede (loja e anúncios offline) continua sem banner e sem SDK', async ({ page, context }) => {
    await abrirAnuncios(page, { pro: true, assinaturas: ativas(3), provedor: { offline: true }, anuncios: { offline: true } });
    await context.setOffline(true);
    for (const aba of ['nav-assinaturas', 'nav-totais', 'nav-inicio']) await page.getByTestId(aba).click();
    await expect(page.getByTestId('selo-pro')).toBeVisible();
    await expect(faixa(page)).toHaveCount(0);
    await nenhumaChamada(page);
  });

  test('US-26.CA4 / US-27.CA10: Pro revogado — aviso "e os anúncios voltam", banner volta com a escolha anterior, sem perguntar de novo e sem reiniciar', async ({ page }) => {
    await abrirAnuncios(page, { proBruto: PRO_JSON, provedor: { compras: [] }, assinaturas: ativas(3), escolha: 'nao-personalizado' });
    await expect(page.getByTestId('pro-revogado-aviso')).toContainText('os anúncios voltam');
    await esperarBanner(page);
    await expect(page.getByTestId('consent-aviso')).toHaveCount(0);
    const c = await chamadas(page);
    expect(c.ultimoPersonalizado).toBe(false);
    expect((await estadoGravado(page)).escolha).toBe('nao-personalizado');
    expect(JSON.parse((await lerChave(page, 'mensalao:pro:v1'))!).pro).toBe(false);
  });

  test('US-26.CA4: revogado sem escolha anterior — o aviso de consentimento vem antes do primeiro banner', async ({ page }) => {
    await abrirAnuncios(page, { proBruto: PRO_JSON, provedor: { compras: [] }, assinaturas: ativas(3), escolha: null });
    await expect(page.getByTestId('consent-aviso')).toBeVisible();
    expect((await chamadas(page)).requisicoesBanner).toBe(0);
  });

  test('US-26.CA5: Pro em cache com a loja com erro — continua sem anúncio (regra conservadora)', async ({ page }) => {
    await abrirAnuncios(page, { proBruto: PRO_JSON, provedor: { listar: 'erro' }, assinaturas: ativas(3) });
    await expect(page.getByTestId('selo-pro')).toBeVisible();
    await page.getByTestId('nav-totais').click();
    await page.waitForTimeout(500);
    await expect(faixa(page)).toHaveCount(0);
    await nenhumaChamada(page);
  });

  test('US-26.CA5: Pro em cache com a loja offline — sem anúncio', async ({ page }) => {
    await abrirAnuncios(page, { proBruto: PRO_JSON, provedor: { offline: true }, assinaturas: ativas(3) });
    await page.waitForTimeout(500);
    await expect(faixa(page)).toHaveCount(0);
    await nenhumaChamada(page);
  });

  test('US-26.CA5: Pro em cache com a loja lenta — nada de anúncio enquanto ela não responde; se responder "sem compra", aí sim', async ({ page }) => {
    await abrirAnuncios(page, { proBruto: PRO_JSON, provedor: { compras: [], atrasoMs: 2500 }, assinaturas: ativas(3) });
    await page.waitForTimeout(800);
    await expect(faixa(page)).toHaveCount(0);
    await nenhumaChamada(page);
    await esperarBanner(page); // a loja respondeu sem a compra: revogado, os anúncios voltam
  });

  test('US-26.CA6: 1ª abertura — nenhum anúncio e nenhuma chamada, a tela abre sem esperar a loja', async ({ page }) => {
    await abrirAnuncios(page, { aberturas: 0, escolha: null, assinaturas: ativas(3), provedor: { atrasoMs: 2000 } });
    await expect(page.getByTestId('titulo-tela')).toBeVisible(); // não bloqueia a abertura
    await page.waitForTimeout(2600);
    await expect(faixa(page)).toHaveCount(0);
    await expect(page.getByTestId('consent-aviso')).toHaveCount(0);
    await nenhumaChamada(page);
  });

  test('US-26.CA6: plano ainda desconhecido (loja lenta, sem cache) — nenhum anúncio antes de saber; depois, o banner chega', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), provedor: { atrasoMs: 2500 } });
    await expect(page.getByTestId('titulo-tela')).toBeVisible();
    await page.waitForTimeout(800);
    await expect(faixa(page)).toHaveCount(0);
    expect((await chamadas(page)).disponivel).toBe(0);
    await esperarBanner(page);
  });

  test('US-26.CA8: estado Pro corrompido + loja com erro — plano grátis para limite, mas nenhum anúncio', async ({ page }) => {
    await abrirAnuncios(page, { proBruto: '{lixo', provedor: { listar: 'erro' }, assinaturas: ativas(6) });
    await page.waitForTimeout(600);
    await expect(page.getByTestId('limite-contador')).toContainText('6 de 5');
    await expect(faixa(page)).toHaveCount(0);
    await nenhumaChamada(page);
  });

  test('US-26.CA8: estado Pro corrompido + loja que responde "sem compra" — só então os anúncios aparecem', async ({ page }) => {
    await abrirAnuncios(page, { proBruto: '{"pro":"sim"}', provedor: { compras: [], atrasoMs: 1500 }, assinaturas: ativas(3) });
    await page.waitForTimeout(500);
    await expect(faixa(page)).toHaveCount(0);
    await esperarBanner(page);
  });

  test('US-26.CA10: textos honestos — grátis diz que há anúncios; só o Pro diz "Sem anúncios"', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), hash: '#/ajustes' });
    await expect(page.getByTestId('sobre-anuncios')).toContainText('A versão grátis mostra anúncios do Google');
    await expect(page.getByTestId('sobre-anuncios')).not.toContainText('Sem anúncios');
    for (const hash of ['#/', '#/assinaturas', '#/totais', '#/ajustes', '#/nova', '#/nova/form']) {
      await page.evaluate((h) => { location.hash = h; }, hash);
      await expect(page.locator('body')).not.toContainText(/sem an[úu]ncios/i);
    }
    await abrirAnuncios(page, { pro: true, assinaturas: ativas(3), hash: '#/ajustes' });
    await expect(page.getByTestId('sobre-anuncios')).toContainText('Sem anúncios');
  });

  test('US-26.CA11: no Pro, Ajustes > Anúncios e privacidade explica e esconde as opções de personalização', async ({ page }) => {
    await abrirAnuncios(page, { pro: true, assinaturas: ativas(3), hash: '#/ajustes' });
    const secao = page.getByTestId('consent-ajustes');
    await expect(secao).toContainText('Você é Pro: o Mensalão não mostra anúncios nem carrega o sistema de anúncios do Google');
    await expect(page.getByTestId('consent-ajustes-personalizado')).toHaveCount(0);
    await expect(page.getByTestId('consent-ajustes-nao-personalizado')).toHaveCount(0);
    await expect(page.getByTestId('consent-opcoes-google')).toHaveCount(0);
    await nenhumaChamada(page);
  });

  test('US-27.CA10: depois de escolher e comprar o Pro, a escolha continua guardada (sem efeito)', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), hash: '#/pro', escolha: 'nao-personalizado' });
    await page.getByTestId('pro-btn-comprar').click();
    await expect(page.getByTestId('pro-ativo')).toBeVisible();
    expect((await estadoGravado(page)).escolha).toBe('nao-personalizado');
    await page.getByTestId('pro-btn-voltar-app').click();
    await expect(faixa(page)).toHaveCount(0);
  });
});
