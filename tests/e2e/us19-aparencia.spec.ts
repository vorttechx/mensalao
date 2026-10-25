// US-19.CA7 a CA10 — Aparência (Automático/Claro/Escuro) só no Pro (D-07, design 2.3a, 3.10a, 4.7 e 4.8).
import { expect, test, type Page } from '@playwright/test';
import { abrirS2, configurarProvedor, lerChave, sub } from './helpers2';
import { tokens } from './helpers3';

const PRO_REVOGADO = { proBruto: JSON.stringify({ pro: true, sku: 'mensalao_pro', verificadoEm: 'x' }), provedor: { compras: [] as string[] } };
const aparencia = (page: Page) => page.evaluate(() => document.documentElement.dataset.aparencia ?? null);
const metas = (page: Page) => page.evaluate(() => [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')].map((m) => m.content.toLowerCase()));
const fundo = async (page: Page) => (await tokens(page, ['--cor-fundo']))['--cor-fundo'];
const prefsGravadas = async (page: Page) => JSON.parse((await lerChave(page, 'mensalao:prefs:v1')) ?? '{}');

test.describe('US-19 Aparência no Pro', () => {
  test('US-19.CA7: no Pro, Ajustes mostra Aparência com Automático (padrão), Claro e Escuro, acima de Temas', async ({ page }) => {
    await abrirS2(page, { pro: true, hash: '#/ajustes' });
    const lista = page.getByTestId('aparencia-lista');
    await expect(lista).toBeVisible();
    await expect(page.getByRole('group', { name: 'Aparência' })).toBeVisible();
    await expect(lista.locator('label')).toHaveText(['Automático', 'Claro', 'Escuro']);
    await expect(page.getByTestId('aparencia-auto')).toBeChecked();
    await expect(page.getByRole('radio', { name: 'Escuro' })).not.toBeChecked();
    await expect(page.getByTestId('lock-aparencia')).toHaveCount(0);
    await expect(page.getByText('Automático segue o modo do seu celular.')).toBeVisible();
    const yAp = (await lista.boundingBox())!.y;
    const yTemas = (await page.getByTestId('temas-lista').boundingBox())!.y;
    expect(yAp).toBeLessThan(yTemas);
    await expect(page.getByText('Cada tema tem versão clara e escura, conforme a Aparência.')).toBeVisible();
    for (const id of ['auto', 'claro', 'escuro']) {
      const b = (await page.locator(`label[for="aparencia-${id}"]`).boundingBox())!;
      expect(b.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('US-19.CA7: Escuro vale na hora com o celular claro, sem banner, grava "escuro" e continua após reabrir', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await abrirS2(page, { pro: true, hash: '#/ajustes', assinaturas: [sub()] });
    expect(await fundo(page)).toBe('#ffffff');
    const pedidos: string[] = [];
    page.on('request', (r) => pedidos.push(r.url()));
    await page.getByTestId('aparencia-escuro').check();
    expect(await aparencia(page)).toBe('escuro');
    expect(await fundo(page)).toBe('#0f1512');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark');
    await expect(page.getByTestId('aparencia-escuro')).toBeFocused();
    await expect(page.getByTestId('banner')).toHaveCount(0);
    expect((await prefsGravadas(page)).aparencia).toBe('escuro');
    expect(pedidos).toEqual([]);
    await page.reload();
    expect(await aparencia(page)).toBe('escuro');
    await page.goto('./#/');
    expect(await fundo(page)).toBe('#0f1512');
  });

  test('US-19.CA7: Claro vale com o celular escuro; Automático volta a seguir o celular', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await abrirS2(page, { pro: true, hash: '#/ajustes' });
    expect(await fundo(page)).toBe('#0f1512');
    await page.getByTestId('aparencia-claro').check();
    expect(await aparencia(page)).toBe('claro');
    expect(await fundo(page)).toBe('#ffffff');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('light');
    await page.getByTestId('aparencia-auto').check();
    expect(await aparencia(page)).toBeNull();
    expect(await fundo(page)).toBe('#0f1512');
    expect((await prefsGravadas(page)).aparencia).toBe('auto');
  });

  test('US-19.CA7: a aparência combina com o tema de cor escolhido', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await abrirS2(page, { pro: true, hash: '#/ajustes', prefs: { tema: 'azul-noite', aparencia: 'escuro' } });
    expect(await page.evaluate(() => document.documentElement.dataset.tema)).toBe('azul-noite');
    expect(await tokens(page, ['--cor-fundo', '--cor-marca', '--cor-texto'])).toEqual({ '--cor-fundo': '#0e1320', '--cor-marca': '#8fb4f0', '--cor-texto': '#e4eaf5' });
    await page.getByTestId('tema-ameixa').check({ force: true });
    expect(await tokens(page, ['--cor-fundo', '--cor-marca'])).toEqual({ '--cor-fundo': '#160f14', '--cor-marca': '#eba6d4' });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.getByTestId('aparencia-claro').check();
    expect(await tokens(page, ['--cor-fundo', '--cor-marca', '--cor-fundo-agrupado'])).toEqual({ '--cor-fundo': '#ffffff', '--cor-marca': '#7a2e62', '--cor-fundo-agrupado': '#f7f3f5' });
  });

  test('US-19.CA7: setas do teclado trocam a opção (grupo de rádios nativo) com foco visível', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await abrirS2(page, { pro: true, hash: '#/ajustes' });
    await page.getByTestId('aparencia-auto').focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByTestId('aparencia-claro')).toBeChecked();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByTestId('aparencia-escuro')).toBeChecked();
    expect(await aparencia(page)).toBe('escuro');
    const contorno = await page.getByTestId('aparencia-escuro').evaluate((e) => { const s = getComputedStyle(e); return `${s.outlineStyle} ${s.outlineWidth}`; });
    expect(contorno).toBe('solid 3px');
  });

  test('US-19.CA7: valor gravado inválido = Automático, sem travar', async ({ page }) => {
    for (const v of ['neon', 7, null]) {
      await page.emulateMedia({ colorScheme: 'light' });
      await abrirS2(page, { pro: true, hash: '#/ajustes', prefs: { aparencia: v } });
      await expect(page.getByTestId('aparencia-auto')).toBeChecked();
      expect(await aparencia(page)).toBeNull();
    }
  });

  test('US-19.CA8: no grátis a Aparência aparece como recurso Pro e o app segue o celular', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await abrirS2(page, { hash: '#/ajustes', prefs: { aparencia: 'claro' } });
    const lock = page.getByTestId('lock-aparencia');
    await expect(lock).toBeVisible();
    await expect(page.getByTestId('aparencia-lista')).toHaveCount(0);
    await expect(lock).toContainText('Escolha entre claro, escuro ou automático.');
    await expect(lock).toContainText('Pro');
    await expect(page.getByText('Hoje o app segue o modo do celular.')).toBeVisible();
    expect(await aparencia(page)).toBeNull();
    expect(await fundo(page)).toBe('#0f1512');
    // Fica acima de Temas e o botão tem o nome acessível completo.
    expect((await lock.boundingBox())!.y).toBeLessThan((await page.getByTestId('lock-temas').boundingBox())!.y);
    const btn = lock.getByTestId('lock-btn-pro');
    await expect(btn).toHaveAccessibleName('Conhecer o Pro para escolher a aparência');
    expect((await btn.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await btn.click();
    await expect(page).toHaveURL(/#\/pro/);
  });

  test('US-19.CA9: Pro revogado volta a seguir o celular sem apagar a escolha; se o Pro volta, a escolha volta', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await abrirS2(page, { ...PRO_REVOGADO, hash: '#/ajustes', prefs: { aparencia: 'escuro', tema: 'grafite' } });
    await expect(page.getByTestId('pro-revogado-aviso')).toBeVisible();
    expect(await aparencia(page)).toBeNull();
    expect(await fundo(page)).toBe('#ffffff');
    expect(await metas(page)).toEqual(['#ffffff', '#0f1512']);
    await expect(page.getByTestId('lock-aparencia')).toBeVisible();
    expect(await prefsGravadas(page)).toMatchObject({ aparencia: 'escuro', tema: 'grafite' });
    await configurarProvedor(page, { compras: ['mensalao_pro'] });
    await page.reload();
    await expect(page.getByTestId('aparencia-escuro')).toBeChecked();
    expect(await aparencia(page)).toBe('escuro');
    expect(await fundo(page)).toBe('#121212');
    expect(await metas(page)).toEqual(['#121212', '#121212']);
  });

  test('US-19.CA9: perder o Pro com o app aberto (restaurar sem a compra) também remove a aparência forçada', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await abrirS2(page, { pro: true, hash: '#/ajustes', prefs: { aparencia: 'escuro' } });
    expect(await aparencia(page)).toBe('escuro');
    await configurarProvedor(page, { compras: [] });
    await page.reload();
    await expect(page.getByTestId('pro-revogado-aviso')).toBeVisible();
    expect(await aparencia(page)).toBeNull();
    expect((await prefsGravadas(page)).aparencia).toBe('escuro');
  });

  test('US-19.CA10: theme-color acompanha a aparência escolhida, não a do celular', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await abrirS2(page, { pro: true, hash: '#/ajustes' });
    expect(await metas(page)).toEqual(['#ffffff', '#0f1512']);
    await page.getByTestId('aparencia-escuro').check();
    expect(await metas(page)).toEqual(['#0f1512', '#0f1512']);
    await page.getByTestId('tema-ameixa').check({ force: true });
    expect(await metas(page)).toEqual(['#160f14', '#160f14']);
    await page.getByTestId('aparencia-claro').check();
    expect(await metas(page)).toEqual(['#ffffff', '#ffffff']);
    await page.getByTestId('aparencia-auto').check();
    expect(await metas(page)).toEqual(['#ffffff', '#160f14']);
    // Também na abertura (sem passar por Ajustes).
    await abrirS2(page, { pro: true, prefs: { aparencia: 'escuro', tema: 'azul-noite' }, assinaturas: [sub()] });
    expect(await metas(page)).toEqual(['#0e1320', '#0e1320']);
  });
});
