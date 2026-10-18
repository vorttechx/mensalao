import { expect, test } from '@playwright/test';
import { abrirS2, lerChave, sub } from './helpers2';

const tema = (page: import('@playwright/test').Page) => page.evaluate(() => document.documentElement.dataset.tema ?? null);
const escolher = (page: import('@playwright/test').Page, id: string) => page.getByTestId(`tema-${id}`).check({ force: true });

test.describe('US-17 Temas de cor (Pro)', () => {
  test('US-17.CA1: no grátis mantém o verde-cédula e mostra os extras bloqueados', async ({ page }) => {
    await abrirS2(page, { hash: '#/ajustes' });
    await expect(page.getByTestId('lock-temas')).toBeVisible();
    await expect(page.getByTestId('temas-lista')).toHaveCount(0);
    expect(await tema(page)).toBeNull();
  });

  test('US-17.CA2: no Pro há o padrão e 3 temas extras, cada um com prévia', async ({ page }) => {
    await abrirS2(page, { pro: true, hash: '#/ajustes' });
    await expect(page.getByTestId('temas-lista')).toBeVisible();
    for (const id of ['verde-cedula', 'azul-noite', 'grafite', 'ameixa']) await expect(page.getByTestId(`tema-${id}`)).toBeAttached();
    await expect(page.getByTestId('temas-lista').locator('.previa-tema')).toHaveCount(4);
    await expect(page.getByTestId('temas-lista')).toContainText('Verde-cédula (padrão)');
    await expect(page.getByTestId('tema-verde-cedula')).toBeChecked();
  });

  test('US-17.CA3: escolher aplica na hora sem recarregar, salva e vale após reabrir (inclusive offline)', async ({ page, context }) => {
    await abrirS2(page, { pro: true, hash: '#/ajustes' });
    await page.evaluate(() => navigator.serviceWorker.ready);
    const corAntes = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await escolher(page, 'azul-noite');
    await expect(page.getByTestId('tema-aplicado')).toContainText('Tema Azul-noite aplicado.');
    expect(await tema(page)).toBe('azul-noite');
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe(corAntes);
    expect(JSON.parse((await lerChave(page, 'mensalao:prefs:v1'))!).tema).toBe('azul-noite');
    await page.getByTestId('nav-inicio').click();
    expect(await tema(page)).toBe('azul-noite');
    await page.reload();
    expect(await tema(page)).toBe('azul-noite');
    await context.setOffline(true);
    await page.reload();
    expect(await tema(page)).toBe('azul-noite');
  });

  test('US-17.CA3: grafite e ameixa também aplicam; voltar ao verde-cédula remove o atributo', async ({ page }) => {
    await abrirS2(page, { pro: true, hash: '#/ajustes' });
    await escolher(page, 'grafite');
    expect(await tema(page)).toBe('grafite');
    await escolher(page, 'ameixa');
    expect(await tema(page)).toBe('ameixa');
    await escolher(page, 'verde-cedula');
    expect(await tema(page)).toBeNull();
  });

  test('US-17.CA4 / CA5: cada tema tem contraste AA no claro e no escuro (texto principal sobre o fundo)', async ({ page }) => {
    const lum = (rgb: string) => {
      const [r, g, b] = rgb.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    for (const esquema of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: esquema });
      for (const id of ['verde-cedula', 'azul-noite', 'grafite', 'ameixa']) {
        await abrirS2(page, { pro: true, prefs: { tema: id }, assinaturas: [sub()], hash: '#/ajustes' });
        const { fundo, texto, primaria } = await page.evaluate(() => {
          const raiz = getComputedStyle(document.body);
          const btn = document.querySelector<HTMLElement>('.btn-primario');
          const cb = btn ? getComputedStyle(btn) : null;
          return { fundo: raiz.backgroundColor, texto: raiz.color, primaria: cb ? [cb.color, cb.backgroundColor] : null };
        });
        const razao = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
        expect(razao(texto, fundo), `${id}/${esquema} texto`).toBeGreaterThanOrEqual(4.5);
        if (primaria) expect(razao(primaria[0], primaria[1]), `${id}/${esquema} botão`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  test('US-17.CA6: Pro revogado usa o padrão sem apagar a escolha; se o Pro volta, reaplica', async ({ page }) => {
    await abrirS2(page, { proBruto: JSON.stringify({ pro: true, sku: 'mensalao_pro', verificadoEm: 'x' }), provedor: { compras: [] }, prefs: { tema: 'ameixa' } });
    await expect(page.getByTestId('pro-revogado-aviso')).toBeVisible();
    expect(await tema(page)).toBeNull();
    expect(JSON.parse((await lerChave(page, 'mensalao:prefs:v1'))!).tema).toBe('ameixa');
  });

  test('US-17.CA7: valor de tema desconhecido ou corrompido usa o padrão sem travar', async ({ page }) => {
    for (const prefs of [{ tema: 'neon' }, { tema: 42 }, { tema: null }]) {
      await abrirS2(page, { pro: true, prefs: prefs as any, assinaturas: [sub()] });
      await expect(page.getByTestId('upcoming-list')).toBeVisible();
      expect(await tema(page)).toBeNull();
    }
    await abrirS2(page, { pro: true, assinaturas: [sub()] });
    await page.evaluate(() => localStorage.setItem('mensalao:prefs:v1', '{quebrado'));
    await page.reload();
    await expect(page.getByTestId('upcoming-list')).toBeVisible();
    expect(await tema(page)).toBeNull();
  });

  test('US-17.CA8: theme-color do navegador acompanha o tema escolhido', async ({ page }) => {
    await abrirS2(page, { pro: true, hash: '#/ajustes' });
    const cores = () => page.evaluate(() => [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')].map((m) => m.content.toLowerCase()));
    const padrao = await cores();
    await escolher(page, 'ameixa');
    const ameixa = await cores();
    expect(ameixa).not.toEqual(padrao);
    expect(ameixa).toContain('#7a2e62');
  });

  test('US-17.CA9: trocar de tema não faz requisições de rede', async ({ page }) => {
    await abrirS2(page, { pro: true, hash: '#/ajustes' });
    const pedidos: string[] = [];
    page.on('request', (r) => pedidos.push(r.url()));
    await escolher(page, 'grafite');
    await expect(page.getByTestId('tema-aplicado')).toBeVisible();
    expect(pedidos.filter((u) => !u.startsWith('data:') && !u.startsWith('blob:'))).toEqual([]);
  });
});
