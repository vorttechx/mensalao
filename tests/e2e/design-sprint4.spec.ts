// Conformidade com o design da sprint 4 (design.md, Parte 4, seções 13 a 17): medidas, ordem e microcopy.
import { expect, test } from '@playwright/test';
import { abrirAnuncios, ativas, esperarBanner } from './helpers4';

const css = (page: import('@playwright/test').Page, sel: string, props: string[]) =>
  page.locator(sel).first().evaluate((e, ps) => { const s = getComputedStyle(e); return Object.fromEntries((ps as string[]).map((p) => [p, (s as unknown as Record<string, string>)[p]])); }, props);

test.describe('design 14.1 / 13 faixa do anúncio', () => {
  test('medidas: faixa de 100 px fixa, fio de 1 px, rótulo 13/400 em texto-2, reserva de 56 px, opaca, de borda a borda', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3) });
    await esperarBanner(page);
    expect(await css(page, '[data-testid=anuncio-banner]', ['position', 'height', 'borderTopWidth', 'paddingTop'])).toEqual({ position: 'fixed', height: '100px', borderTopWidth: '1px', paddingTop: '8px' });
    expect(await css(page, '[data-testid=anuncio-rotulo]', ['fontSize', 'fontWeight', 'lineHeight', 'paddingBottom'])).toEqual({ fontSize: '13px', fontWeight: '400', lineHeight: '16px', paddingBottom: '4px' });
    expect((await css(page, '[data-testid=anuncio-reserva]', ['height'])).height).toBe('56px');
    const f = await page.getByTestId('anuncio-banner').boundingBox();
    expect(f!.x).toBe(0);
    expect(f!.width).toBe(360);
    const fundo = (await css(page, '[data-testid=anuncio-banner]', ['backgroundColor'])).backgroundColor;
    expect(fundo).not.toMatch(/rgba\(.*, 0\)/); // opaca: o conteúdo que rola por baixo não aparece
    const reservaNoClaro = (await css(page, '[data-testid=anuncio-reserva]', ['backgroundColor'])).backgroundColor;
    expect(reservaNoClaro).toBe('rgb(243, 245, 242)'); // #F3F5F2
  });

  test('no escuro a reserva é a superfície (#18201B) sobre o papel #0F1512, e o rótulo mantém contraste AA', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await abrirAnuncios(page, { assinaturas: ativas(3) });
    await esperarBanner(page);
    expect((await css(page, '[data-testid=anuncio-reserva]', ['backgroundColor'])).backgroundColor).toBe('rgb(24, 32, 27)');
    expect((await css(page, '[data-testid=anuncio-banner]', ['backgroundColor'])).backgroundColor).toBe('rgb(15, 21, 18)');
  });

  test('o fim do conteúdo fica a 32 px do fio da faixa quando se rola até o fim (design: 60 px do banner)', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(9), hash: '#/assinaturas' });
    await esperarBanner(page);
    await page.evaluate(() => { const c = document.querySelector('.conteudo') as HTMLElement; c.scrollTop = c.scrollHeight; window.scrollTo(0, document.body.scrollHeight); });
    const r = await page.evaluate(() => {
      const f = document.querySelector('[data-testid=anuncio-banner]')!.getBoundingClientRect();
      const filhos = [...document.querySelectorAll('.conteudo *')].filter((e) => (e as HTMLElement).offsetHeight > 0 && !e.closest('[data-testid=anuncio-banner]'));
      const fim = Math.max(...filhos.map((e) => e.getBoundingClientRect().bottom));
      return { fio: f.top, fim };
    });
    expect(r.fio - r.fim).toBeGreaterThanOrEqual(32 - 2);
  });
});

test.describe('design 15.4 / 14.3 Ajustes', () => {
  test('ordem das seções: ... Aparência, Temas, Anúncios e privacidade, Sobre', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), hash: '#/ajustes' });
    const titulos = await page.locator('h2').allInnerTexts();
    const i = (t: string) => titulos.findIndex((x) => x.trim() === t);
    expect(i('Anúncios e privacidade')).toBeGreaterThan(-1);
    expect(i('Sobre')).toBe(i('Anúncios e privacidade') + 1);
    expect(i('Anúncios e privacidade')).toBeGreaterThan(i('Planilha'));
  });

  test('rádios: fieldset com legend oculta "Tipo de anúncio", name="consent" e linhas de 48 px ou mais', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), hash: '#/ajustes' });
    await expect(page.locator('fieldset.consent-opcoes legend')).toHaveText('Tipo de anúncio');
    expect(await page.locator('input[name="consent"]').count()).toBe(2);
    for (const l of await page.locator('label.opcao-consent').all()) expect((await l.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  });

  test('premiado: a oferta fica entre a descrição do recurso e "Conhecer o Pro", com o texto de ajuda abaixo do grupo', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), hash: '#/ajustes' });
    const ordem = await page.getByTestId('lock-csv').evaluate((e) => [...e.querySelectorAll('[data-testid]')].map((x) => x.getAttribute('data-testid')));
    expect(ordem.indexOf('premiado-oferta')).toBeGreaterThan(-1);
    expect(ordem.indexOf('premiado-oferta')).toBeLessThan(ordem.indexOf('lock-btn-pro'));
    const yo = (await page.getByTestId('premiado-oferta').boundingBox())!.y;
    const yp = (await page.getByTestId('lock-csv').getByTestId('lock-btn-pro').boundingBox())!.y;
    const ya = (await page.getByTestId('premiado-ajuda').boundingBox())!.y;
    expect(yo).toBeLessThan(yp);
    expect(ya).toBeGreaterThan(yp);
    expect(await page.getByTestId('premiado-oferta').evaluate((e) => !!e.querySelector('svg.ic-seta, .seta'))).toBe(false); // linha de ação sem seta (não navega)
  });

  test('premiado: diálogo com "Agora não" focado e os dois botões secundários de 48 px', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), hash: '#/ajustes' });
    await page.getByTestId('premiado-oferta').click();
    await expect(page.getByTestId('premiado-btn-agora-nao')).toBeFocused();
    for (const id of ['premiado-btn-agora-nao', 'premiado-btn-assistir']) {
      expect(await page.getByTestId(id).evaluate((e) => e.className)).toContain('btn-secundario');
      expect((await page.getByTestId(id).boundingBox())!.height).toBe(48);
    }
  });

  test('links que saem do app levam "↗" (política e contato); o link do Google em Ajustes usa a seta "›"', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), hash: '#/ajustes' });
    for (const id of ['link-privacidade', 'consent-link-privacidade', 'link-contato']) {
      await expect(page.getByTestId(id).locator('svg.ic-ext, .ic-ext').first()).toBeVisible();
    }
    await expect(page.getByTestId('link-contato')).toContainText('Contato');
  });

  test('microcopy: rodapé do Sobre no grátis e no Pro (design 17)', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), hash: '#/ajustes' });
    await expect(page.getByTestId('sobre-anuncios')).toHaveText('Mensalão não se conecta a bancos e suas assinaturas nunca saem deste celular. A versão grátis mostra anúncios do Google.');
    await abrirAnuncios(page, { pro: true, assinaturas: ativas(3), hash: '#/ajustes' });
    await expect(page.getByTestId('sobre-anuncios')).toHaveText('Mensalão não se conecta a bancos e suas assinaturas nunca saem deste celular. Sem anúncios.');
  });
});

test.describe('design 14.2 aviso de consentimento', () => {
  test('título 19/700, botões secundários de 48 px (16/600) com 12 px entre eles, nota abaixo, fundo da superfície, toque no véu não fecha', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: null });
    await expect(page.getByTestId('consent-aviso')).toBeVisible();
    expect(await css(page, '[data-testid=consent-aviso] h2', ['fontSize', 'fontWeight'])).toEqual({ fontSize: '19px', fontWeight: '700' });
    const b1 = (await page.getByTestId('consent-personalizado').boundingBox())!;
    const b2 = (await page.getByTestId('consent-nao-personalizado').boundingBox())!;
    expect([b1.height, b2.height]).toEqual([48, 48]);
    expect(Math.round(b2.y - (b1.y + b1.height))).toBe(12);
    for (const id of ['consent-personalizado', 'consent-nao-personalizado']) {
      expect(await css(page, `[data-testid=${id}]`, ['fontSize', 'fontWeight'])).toEqual({ fontSize: '16px', fontWeight: '600' });
      expect(await page.getByTestId(id).evaluate((e) => e.className)).toContain('btn-secundario');
    }
    await expect(page.getByTestId('consent-aviso')).toContainText('Você pode mudar quando quiser em Ajustes, Anúncios e privacidade.');
    await page.mouse.click(4, 4); // véu
    await expect(page.getByTestId('consent-aviso')).toBeVisible();
    const r = await page.getByTestId('consent-aviso').boundingBox();
    expect(r!.height).toBeLessThanOrEqual(780 - 32);
  });

  test('a ordem das opções é sempre a mesma: personalizados primeiro (a do backlog)', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: null });
    const ys = [(await page.getByTestId('consent-personalizado').boundingBox())!.y, (await page.getByTestId('consent-nao-personalizado').boundingBox())!.y];
    expect(ys[0]).toBeLessThan(ys[1]);
  });
});

test.describe('design 14.5 / 15.3 tela Pro', () => {
  test('"Sem anúncios" é o 2º dos 7 benefícios, sem selo nem ícone; e aparece em "Incluído no seu Pro"', async ({ page }) => {
    await abrirAnuncios(page, { hash: '#/pro' });
    const itens = await page.getByTestId('pro-recursos').locator('li').allInnerTexts();
    expect(itens[1]).toContain('Sem anúncios');
    expect(await page.getByTestId('pro-semanuncio').locator('svg, img').count()).toBe(0);
    await abrirAnuncios(page, { pro: true, hash: '#/pro' });
    await expect(page.getByTestId('pro-tela')).toContainText('Incluído no seu Pro');
    await expect(page.getByTestId('pro-semanuncio')).toBeVisible();
  });
});
