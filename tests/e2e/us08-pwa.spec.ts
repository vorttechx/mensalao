import { expect, test } from '@playwright/test';
import { abrir, sub } from './helpers';

test.describe('US-08 PWA e robustez', () => {
  test('US-08.CA1: manifest válido com ícones 192/512 e standalone', async ({ page, request }) => {
    await page.goto('./');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(href).toBeTruthy();
    const r = await request.get(new URL(href!, page.url()).toString());
    const m = await r.json();
    expect(m.name).toBe('Mensalão');
    expect(m.display).toBe('standalone');
    const tamanhos = m.icons.map((i: { sizes: string }) => i.sizes);
    expect(tamanhos).toEqual(expect.arrayContaining(['192x192', '512x512']));
    expect(m.theme_color).toBeTruthy();
    for (const i of m.icons) expect((await request.get(new URL(i.src, page.url()).toString())).ok()).toBe(true);
  });

  test('US-08.CA2: após o primeiro acesso, abre offline com os dados', async ({ page, context }) => {
    await abrir(page, [sub()]);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByTestId('upcoming-item')).toContainText('Netflix');
    for (const t of ['nav-assinaturas', 'nav-totais', 'nav-ajustes']) {
      await page.getByTestId(t).click();
      await expect(page.getByTestId('titulo-tela')).toBeVisible();
    }
  });

  test('US-08.CA3: caminhos relativos (base ./)', async ({ request }) => {
    const html = await (await request.get('/')).text();
    expect(html).not.toMatch(/(src|href)="\/(?!\/)/);
  });

  test('US-08.CA4: dados corrompidos mostram aviso, não são sobrescritos, e dá para começar do zero', async ({ page }) => {
    await page.goto('./');
    await page.evaluate(() => localStorage.setItem('mensalao:v1', '{quebrado'));
    await page.reload();
    await expect(page.getByTestId('corrupt-warning')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('mensalao:v1'))).toBe('{quebrado');
    await page.getByTestId('btn-comecar-zero').click();
    const conf = page.getByTestId('btn-confirmar');
    if (await conf.isVisible().catch(() => false)) await conf.click();
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('US-08.CA5: sem rolagem horizontal em 360 px e alvos >= 44 px', async ({ page }) => {
    await abrir(page, [sub()], 3, '#/');
    for (const hash of ['#/', '#/assinaturas', '#/totais', '#/ajustes', '#/nova', '#/nova/form', '#/assinatura/x']) {
      await page.goto('./' + hash);
      const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(sobra, hash).toBeLessThanOrEqual(0);
    }
    await page.goto('./#/');
    for (const t of ['nav-inicio', 'nav-assinaturas', 'nav-totais', 'nav-ajustes', 'btn-adicionar']) {
      const b = await page.getByTestId(t).boundingBox();
      expect(b!.width, t).toBeGreaterThanOrEqual(44);
      expect(b!.height, t).toBeGreaterThanOrEqual(44);
    }
    await page.goto('./#/nova/form');
    const lab = await page.locator('label[for="campo-teste"]').boundingBox();
    expect(lab!.height, 'label do teste grátis').toBeGreaterThanOrEqual(44);
    for (const t of ['btn-salvar', 'field-nome', 'field-valor']) {
      const b = await page.getByTestId(t).boundingBox();
      expect(b!.height, t).toBeGreaterThanOrEqual(44);
    }
  });

  test('DoD 10: sem erros no console num fluxo básico', async ({ page }) => {
    const erros: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
    page.on('pageerror', (e) => erros.push(String(e)));
    await abrir(page, [sub()]);
    for (const t of ['nav-assinaturas', 'nav-totais', 'nav-ajustes', 'nav-inicio']) await page.getByTestId(t).click();
    expect(erros).toEqual([]);
  });
});
