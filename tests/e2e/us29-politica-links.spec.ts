// US-29.CA3 — Os links da política no app apontam para a URL pública; sem rede, abrem a cópia do pacote.
// US-29.CA8 — o app (build de teste) tem a CSP por <meta> e nenhuma tela viola a CSP.
import { expect, test } from '@playwright/test';
import { abrirAnuncios, ativas, escolherNoAviso, esperarBanner, vigiarCsp } from './helpers4';
import { sub } from './helpers2';
import { transbordos } from './helpers3';

test.describe('US-29.CA3 link da política', () => {
  test('em Ajustes > Sobre e em Anúncios e privacidade, o link é a URL pública, abre fora do app (noopener) e não troca a tela do app', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(2), hash: '#/ajustes' });
    for (const id of ['link-privacidade', 'consent-link-privacidade']) {
      const a = page.getByTestId(id);
      await expect(a).toHaveAttribute('href', 'https://mensalao.app/privacidade.html');
      await expect(a).toHaveAttribute('rel', /noopener/);
      await expect(a).toContainText('Política de privacidade');
    }
    await expect(page.getByTestId('link-contato')).toHaveAttribute('href', 'mailto:contato@mensalao.app');
    await expect(page.getByTestId('link-contato')).toContainText('contato@mensalao.app');
  });

  test('com rede, tocar no link vai para https://mensalao.app/privacidade.html', async ({ page }) => {
    await page.route('https://mensalao.app/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>pública</title><p data-testid="publica">ok</p>' }));
    await abrirAnuncios(page, { assinaturas: ativas(2), hash: '#/ajustes' });
    await page.getByTestId('link-privacidade').click();
    await expect(page).toHaveURL('https://mensalao.app/privacidade.html');
  });

  test('sem rede (navigator.onLine = false), abre a cópia empacotada ./privacidade.html, com o mesmo texto', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(2), hash: '#/ajustes' });
    await page.evaluate(() => Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false }));
    await page.getByTestId('link-privacidade').click();
    await expect(page).toHaveURL(/\/privacidade\.html$/);
    expect(new URL(page.url()).origin).toBe(new URL(await page.evaluate(() => document.baseURI)).origin);
    await expect(page.getByTestId('privacidade')).toBeVisible();
    await expect(page.getByTestId('privacidade-data')).toContainText('Atualizada em');
    await expect(page.getByTestId('privacidade-contato')).toContainText('contato@mensalao.app');
    await expect(page.getByTestId('privacidade-voltar')).toBeVisible();
  });

  test('o link "Saiba mais" do aviso de consentimento também usa a URL pública e, sem rede, a cópia do pacote', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(2), escolha: null });
    await expect(page.getByTestId('consent-saiba-mais')).toHaveAttribute('href', 'https://mensalao.app/privacidade.html');
    await page.evaluate(() => Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false }));
    await page.getByTestId('consent-saiba-mais').click();
    await expect(page).toHaveURL(/\/privacidade\.html$/);
  });

  test('a política empacotada cabe em 360 px, sem rolagem horizontal, e em texto de 200%', async ({ page }) => {
    await page.goto('./privacidade.html');
    await expect(page.getByTestId('privacidade')).toBeVisible();
    const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(r.sw).toBeLessThanOrEqual(r.cw);
    await page.evaluate(() => document.documentElement.style.setProperty('font-size', '200%', 'important'));
    const r2 = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(r2.sw).toBeLessThanOrEqual(r2.cw);
    expect(await transbordos(page)).toEqual([]);
  });

  test('o "Voltar" da política empacotada leva de volta ao app', async ({ page }) => {
    await page.goto('./privacidade.html');
    await page.getByTestId('privacidade-voltar').click();
    await expect(page.getByTestId('titulo-tela')).toBeVisible();
  });
});

test.describe('US-29.CA8 CSP no app', () => {
  test('o index.html carrega a CSP estrita por <meta> e o referrer no-referrer', async ({ page }) => {
    await page.goto('./');
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    expect(csp).toBe("default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'");
    await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer');
  });

  test('um <style> ou script inline injetado é BLOQUEADO pela CSP (a proteção está de fato ativa)', async ({ page }) => {
    await page.goto('./');
    const r = await page.evaluate(async () => {
      let disparou = false;
      (window as any).__xss = () => (disparou = true);
      const s = document.createElement('script');
      s.textContent = 'window.__xss()';
      document.head.append(s);
      const est = document.createElement('style');
      est.textContent = 'body{outline:9px solid red !important}';
      document.head.append(est);
      await new Promise((ok) => setTimeout(ok, 100));
      return { script: disparou, estilo: getComputedStyle(document.body).outlineWidth };
    });
    expect(r.script).toBe(false);
    expect(r.estilo).not.toBe('9px');
  });

  test('nenhuma violação de CSP navegando por todas as telas, com banner, aviso, premiado e telas de erro', async ({ page }) => {
    const violacoes = vigiarCsp(page);
    await abrirAnuncios(page, { assinaturas: [...ativas(3), sub({ id: 'p', nome: 'Pausada', status: 'pausada' })], escolha: null });
    await escolherNoAviso(page, 'personalizado');
    await esperarBanner(page);
    for (const hash of ['#/', '#/assinaturas', '#/totais', '#/ajustes', '#/pro', '#/nova', '#/nova/form', '#/assinatura/a0', '#/assinatura/nao-existe', '#/rota/inventada']) {
      await page.evaluate((h) => { location.hash = h; }, hash);
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => { location.hash = '#/ajustes'; });
    await page.getByTestId('premiado-oferta').click();
    await page.getByTestId('premiado-btn-agora-nao').click();
    expect(violacoes).toEqual([]);
  });

  test('os atributos style do app (monograma, régua, legenda do gráfico) continuam funcionando sob a CSP: o monograma tem cor de fundo', async ({ page }) => {
    const violacoes = vigiarCsp(page);
    await abrirAnuncios(page, { assinaturas: ativas(2), hash: '#/assinaturas', anuncios: { disponivel: false } });
    const cor = await page.locator('.mono, [class*="monograma"], [data-testid="item-monograma"]').first().evaluate((e) => getComputedStyle(e).backgroundColor);
    expect(cor).not.toBe('rgba(0, 0, 0, 0)');
    expect(violacoes).toEqual([]);
  });
});
