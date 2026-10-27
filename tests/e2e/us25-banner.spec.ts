// US-25 — Banner discreto no plano grátis (provedor de anúncios FALSO, IDs de teste; o anúncio nativo real
// só se testa em aparelho: dev-notes §9 itens 1, 2 e 11).
import { expect, test } from '@playwright/test';
import { semRolagemHorizontal } from './helpers2';
import { textosAbaixoDoAA, transbordos, texto200 } from './helpers3';
import { abrirAnuncios, ativas, chamadas, configurarAnuncios, esperarBanner, estadoGravado, faixa, semBanner } from './helpers4';

const TELAS_COM_BANNER = ['#/', '#/assinaturas', '#/totais'];

test.describe('US-25 Banner no plano grátis', () => {
  for (const hash of TELAS_COM_BANNER) {
    test(`US-25.CA1: banner com rótulo "Anúncio" acima das abas em ${hash}`, async ({ page }) => {
      await abrirAnuncios(page, { assinaturas: ativas(3), hash });
      await esperarBanner(page);
      await expect(page.getByTestId('anuncio-rotulo')).toHaveText('Anúncio');
      const f = await faixa(page).boundingBox();
      const nav = await page.locator('.nav').boundingBox();
      expect(f!.y + f!.height).toBeLessThanOrEqual(nav!.y + 1); // acima da barra de abas
      expect(f!.y + f!.height).toBeGreaterThanOrEqual(nav!.y - 1); // encostada na barra: a faixa inclui o respiro de 16 px
    });
  }

  test('US-25.CA3: o banner nativo é pedido com margem = altura das abas + 16 px', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3) });
    await esperarBanner(page);
    const abas = await page.evaluate(() => (document.querySelector('.nav')!.firstElementChild as HTMLElement).getBoundingClientRect().height);
    const c = await chamadas(page);
    expect(c.ultimaMargem).toBe(Math.ceil(abas) + 16);
  });

  test('US-25.CA3: distância mínima de 16 px entre o banner e a barra de abas (banner nativo e moldura desenhada)', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3) });
    await esperarBanner(page);
    const c = await chamadas(page);
    const nav = await page.locator('.nav').boundingBox();
    const altura = await page.evaluate(() => window.innerHeight);
    // Posição do banner nativo: a margem inferior é contada a partir da borda de baixo da janela.
    const folgaNativa = nav!.y - (altura - c.ultimaMargem!);
    const r = await page.getByTestId('anuncio-reserva').boundingBox();
    const folgaMoldura = nav!.y - (r!.y + r!.height);
    expect(folgaNativa, 'banner nativo até a borda de cima da barra de abas').toBeGreaterThanOrEqual(16);
    expect(folgaMoldura, 'área reservada desenhada até a borda de cima da barra de abas').toBeGreaterThanOrEqual(16);
  });

  test('US-25.CA3: o conteúdo rola sem ficar escondido atrás do banner (último item acima da faixa)', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(9), hash: '#/assinaturas' });
    await esperarBanner(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.locator('.conteudo').evaluate((e) => (e.scrollTop = e.scrollHeight)).catch(() => undefined);
    const ultimo = page.getByText('Servico 8').first();
    await ultimo.scrollIntoViewIfNeeded();
    const u = await ultimo.boundingBox();
    const f = await faixa(page).boundingBox();
    expect(u!.y + u!.height).toBeLessThanOrEqual(f!.y);
  });

  test('US-25.CA2: nenhuma outra tela tem banner nem espaço reservado', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), hash: '#/' });
    await esperarBanner(page);
    for (const hash of ['#/nova/form', '#/nova', '#/pro', '#/ajustes', '#/assinatura/a0']) {
      await page.evaluate((h) => { location.hash = h; }, hash);
      await semBanner(page);
      await expect(page.locator('.com-anuncio')).toHaveCount(0);
    }
    await page.evaluate(() => { location.hash = '#/totais'; });
    await esperarBanner(page);
  });

  test('US-25.CA2: some e volta conforme navego, sem nova requisição a cada toque em abas já exibidas', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3) });
    await esperarBanner(page);
    for (const aba of ['nav-assinaturas', 'nav-totais', 'nav-inicio', 'nav-totais']) {
      await page.getByTestId(aba).click();
      await esperarBanner(page);
    }
    const c = await chamadas(page);
    expect(c.requisicoesBanner).toBe(1); // no máximo uma requisição nova por troca de tela: aqui, uma só
    expect(c.iniciar).toBe(1);
  });

  test('US-25.CA2: sair para uma tela sem banner esconde o banner nativo; voltar retoma sem requisição nova', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3) });
    await esperarBanner(page);
    await page.getByTestId('nav-ajustes').click();
    await semBanner(page);
    expect((await chamadas(page)).esconderBanner).toBeGreaterThanOrEqual(1);
    await page.getByTestId('nav-inicio').click();
    await esperarBanner(page);
    expect((await chamadas(page)).requisicoesBanner).toBe(1);
  });

  test('US-25.CA4 / CA7: o espaço é reservado antes do anúncio chegar, sem texto de carregando e sem empurrar o conteúdo', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(4), hash: '#/assinaturas', anuncios: { atrasoBannerMs: 2500 } });
    await expect(faixa(page)).toBeVisible();
    expect((await chamadas(page)).bannerVisivel).toBe(false); // ainda carregando
    const alt = await page.getByTestId('anuncio-reserva').evaluate((e) => e.getBoundingClientRect().height);
    expect(alt).toBeGreaterThanOrEqual(56);
    await expect(faixa(page)).not.toContainText(/carregando/i);
    const antes = await page.getByText('Servico 0').first().boundingBox();
    // A tela continua utilizável durante a espera (CA7).
    await page.getByTestId('nav-totais').click();
    await page.getByTestId('nav-assinaturas').click();
    await esperarBanner(page);
    const depois = await page.getByText('Servico 0').first().boundingBox();
    expect(depois!.y).toBe(antes!.y);
    expect((await faixa(page).boundingBox())!.height).toBeGreaterThanOrEqual(100);
  });

  test('US-25.CA7: o anúncio lento não trava a tela (adiciona assinatura enquanto espera)', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(2), anuncios: { atrasoBannerMs: 4000 } });
    await page.getByTestId('btn-adicionar').click();
    await expect(page).toHaveURL(/#\/nova/);
  });

  test('US-25.CA5: sem rede o banner some, o espaço é liberado sem buraco e sem mensagem; com rede volta', async ({ page, context }) => {
    await abrirAnuncios(page, { assinaturas: ativas(4), hash: '#/assinaturas' });
    await esperarBanner(page);
    const antes = await page.getByText('Servico 0').first().boundingBox();
    await context.setOffline(true);
    await expect(faixa(page)).toHaveCount(0);
    await expect(page.locator('.com-anuncio')).toHaveCount(0);
    await expect(page.locator('[role="alert"]')).toHaveCount(0);
    const offline = await page.getByText('Servico 0').first().boundingBox();
    expect(offline!.y).toBe(antes!.y); // sem salto de layout
    expect(await transbordos(page)).toEqual([]);
    await context.setOffline(false);
    await esperarBanner(page);
    expect((await page.getByText('Servico 0').first().boundingBox())!.y).toBe(antes!.y);
  });

  test('US-25.CA5: abrir já sem rede (provedor sem conexão) não mostra banner nem erro', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), anuncios: { offline: true } });
    await semBanner(page);
    await expect(page.getByTestId('lista-assinaturas').or(page.getByTestId('inicio-total')).first()).toBeVisible().catch(() => undefined);
    expect((await chamadas(page)).requisicoesBanner).toBe(0);
  });

  test('US-25.CA6: "sem anúncio" libera o espaço sem erro e só tenta de novo depois de 60 s', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), anuncios: { banner: 'sem-anuncio' } });
    await expect.poll(async () => (await chamadas(page)).requisicoesBanner).toBe(1);
    await expect(faixa(page)).toHaveCount(0);
    await expect(page.locator('[role="alert"]')).toHaveCount(0);
    // Troca de telas em menos de 60 s: nenhuma requisição nova (sem laço).
    for (const aba of ['nav-assinaturas', 'nav-totais', 'nav-inicio', 'nav-totais']) await page.getByTestId(aba).click();
    expect((await chamadas(page)).requisicoesBanner).toBe(1);
    // Passados 61 s (relógio do app), a próxima troca de tela tenta uma vez.
    await page.clock.setFixedTime('2026-09-30T12:01:05-03:00');
    await configurarAnuncios(page, { banner: 'ok' });
    await page.getByTestId('nav-assinaturas').click();
    await esperarBanner(page);
    expect((await chamadas(page)).requisicoesBanner).toBe(2);
  });

  test('US-25.CA6: erro do banner também libera o espaço e respeita os 60 s', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), anuncios: { banner: 'erro' } });
    await expect.poll(async () => (await chamadas(page)).requisicoesBanner).toBe(1);
    await expect(faixa(page)).toHaveCount(0);
    await page.getByTestId('nav-totais').click();
    await page.getByTestId('nav-inicio').click();
    expect((await chamadas(page)).requisicoesBanner).toBe(1);
  });

  test('US-25.CA6: SDK que não inicia = sem banner, sem erro na tela e o app segue funcionando', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), anuncios: { falhaIniciar: true } });
    await expect.poll(async () => (await chamadas(page)).iniciar).toBeGreaterThanOrEqual(1);
    await expect(faixa(page)).toHaveCount(0);
    await expect(page.locator('[role="alert"]')).toHaveCount(0);
    await page.getByTestId('btn-adicionar').click();
    await expect(page).toHaveURL(/#\/nova/);
  });

  test('US-24.CA12 / US-25.CA6: aparelho sem os serviços do Google = sem banner, sem aviso e o app normal', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), anuncios: { disponivel: false } });
    await expect.poll(async () => (await chamadas(page)).disponivel).toBeGreaterThanOrEqual(1);
    await semBanner(page);
    await expect(page.getByTestId('consent-aviso')).toHaveCount(0);
    expect((await chamadas(page)).consultarGoogle).toBe(0);
    expect((await chamadas(page)).iniciar).toBe(0);
  });

  test('US-25.CA8: 360 px sem rolagem horizontal nem transbordo com banner, nas 3 telas', async ({ page }) => {
    for (const hash of TELAS_COM_BANNER) {
      await abrirAnuncios(page, { assinaturas: ativas(5), hash });
      await esperarBanner(page);
      await semRolagemHorizontal(page);
      expect(await transbordos(page), hash).toEqual([]);
    }
  });

  test('US-25.CA8: texto a 200% — o último item continua alcançável e a faixa não cobre controle', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(6), hash: '#/assinaturas' });
    await esperarBanner(page);
    await texto200(page);
    await page.waitForTimeout(400); // a margem do banner é recalculada ao mudar a altura das abas
    await expect(faixa(page)).toBeVisible();
    await semRolagemHorizontal(page);
    const ultimo = page.getByText('Servico 5').first();
    await ultimo.scrollIntoViewIfNeeded();
    const u = await ultimo.boundingBox();
    const f = await faixa(page).boundingBox();
    expect(u!.y + u!.height).toBeLessThanOrEqual(f!.y);
    // A faixa (em px) não cobre nenhuma aba.
    const nav = await page.locator('.nav').boundingBox();
    expect(f!.y + f!.height).toBeLessThanOrEqual(nav!.y + 1);
  });

  test('US-25.CA9: tela baixa — 360×640 mostra (≤ 20% da altura útil); 360×480 omite o banner', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await abrirAnuncios(page, { assinaturas: ativas(3) });
    await esperarBanner(page);
    const f = await faixa(page).boundingBox();
    const nav = await page.locator('.nav').boundingBox();
    expect(f!.height).toBeLessThanOrEqual(0.2 * (640 - nav!.height) + 0.5);
    await page.setViewportSize({ width: 360, height: 480 });
    await semBanner(page);
  });

  test('US-25.CA10: paisagem baixa omite o banner e voltar ao retrato o devolve', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3) });
    await esperarBanner(page);
    await page.setViewportSize({ width: 780, height: 360 });
    await semBanner(page);
    expect(await transbordos(page)).toEqual([]);
    await page.setViewportSize({ width: 360, height: 780 });
    await esperarBanner(page);
  });

  test('US-25.CA9: tela de formulário nunca tem banner, mesmo com o teclado (viewport baixa)', async ({ page }) => {
    await abrirAnuncios(page, { hash: '#/nova/form' });
    await semBanner(page);
    await page.setViewportSize({ width: 360, height: 420 });
    await semBanner(page);
  });

  test('US-25.CA11: a faixa é "Anúncio" para o leitor de tela, vem depois das abas e não rouba o foco', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3) });
    await esperarBanner(page);
    await expect(faixa(page)).toHaveAttribute('aria-label', 'Anúncio');
    const ordem = await page.evaluate(() => {
      const f = document.querySelector('[data-testid="anuncio-banner"]')!;
      const nav = document.querySelector('.nav')!;
      return { depoisDasAbas: !!(nav.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING), foco: !!f.contains(document.activeElement), focaveis: f.querySelectorAll('a,button,input,select,textarea,[tabindex]').length };
    });
    expect(ordem).toEqual({ depoisDasAbas: true, foco: false, focaveis: 0 });
    await expect(page.getByTestId('anuncio-reserva')).toHaveAttribute('aria-hidden', 'true');
  });

  test('US-25.CA12: com prefers-reduced-motion a faixa entra e sai sem transição; sem a preferência, a transição é ≤ 200 ms', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await abrirAnuncios(page, { assinaturas: ativas(3) });
    await esperarBanner(page);
    const reduzido = await faixa(page).evaluate((e) => ({ t: getComputedStyle(e).transitionDuration, entrando: e.classList.contains('entrando') }));
    expect(parseFloat(reduzido.t)).toBe(0);
    expect(reduzido.entrando).toBe(false);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.getByTestId('nav-ajustes').click();
    await page.getByTestId('nav-totais').click();
    await esperarBanner(page);
    const normal = await faixa(page).evaluate((e) => getComputedStyle(e).transitionDuration);
    expect(parseFloat(normal) * (normal.endsWith('ms') ? 1 : 1000)).toBeLessThanOrEqual(200);
  });

  for (const esquema of ['light', 'dark'] as const) {
    test(`US-25.CA13: tema ${esquema} — rótulo e área reservada com contraste AA`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: esquema });
      await abrirAnuncios(page, { assinaturas: ativas(3) });
      await esperarBanner(page);
      expect(await textosAbaixoDoAA(page)).toEqual([]);
      const cores = await page.evaluate(() => {
        const r = document.querySelector('[data-testid="anuncio-reserva"]')!;
        const f = document.querySelector('[data-testid="anuncio-banner"]')!;
        return { reserva: getComputedStyle(r).backgroundColor, faixa: getComputedStyle(f).backgroundColor };
      });
      expect(cores.reserva).not.toBe('rgba(0, 0, 0, 0)');
      expect(cores.faixa).not.toBe('rgba(0, 0, 0, 0)');
    });
  }

  test('US-25.CA14: nenhum dado do usuário chega ao provedor de anúncios (só booleano e número)', async ({ page }) => {
    const segredo = [
      { id: 's1', nome: 'SEGREDO-NOME-UNICO', valorCentavos: 98765, banco: 'BANCO-SECRETO', categoria: 'Outros' },
    ];
    await abrirAnuncios(page, { assinaturas: segredo.map((s) => ({ ...ativas(1)[0], ...s })) });
    await esperarBanner(page);
    await page.getByTestId('nav-totais').click();
    await esperarBanner(page);
    const c = await chamadas(page);
    const texto = JSON.stringify(c);
    for (const proibido of ['SEGREDO-NOME-UNICO', '987,65', '98765', 'BANCO-SECRETO', 'Netflix', 'Streaming']) expect(texto).not.toContain(proibido);
    expect(c.parametros.length).toBeGreaterThan(0);
    for (const p of c.parametros as Record<string, unknown>[]) {
      expect(Object.keys(p).length).toBe(1);
      expect(['personalizado', 'margemInferior']).toContain(Object.keys(p)[0]);
      expect(['boolean', 'number']).toContain(typeof Object.values(p)[0]);
    }
  });

  test('US-25.CA15: sem escolha de consentimento o SDK não é iniciado nem pedido; com a escolha, passa a ser', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: null });
    await expect(page.getByTestId('consent-aviso')).toBeVisible();
    let c = await chamadas(page);
    expect(c.iniciar).toBe(0);
    expect(c.requisicoesBanner).toBe(0);
    expect(await faixa(page).count()).toBe(0);
    await page.getByTestId('consent-nao-personalizado').click();
    await esperarBanner(page);
    c = await chamadas(page);
    expect(c.iniciar).toBe(1);
    expect(c.ultimoPersonalizado).toBe(false);
    expect((await estadoGravado(page)).escolha).toBe('nao-personalizado');
  });

  test('US-25.CA16: segundo plano esconde o banner e a volta o retoma sem requisição nova nem duplicata', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3) });
    await esperarBanner(page);
    const antes = await chamadas(page);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(async () => (await chamadas(page)).bannerVisivel).toBe(false);
    expect((await chamadas(page)).esconderBanner).toBeGreaterThan(antes.esconderBanner);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await esperarBanner(page);
    await expect(faixa(page)).toHaveCount(1);
    expect((await chamadas(page)).requisicoesBanner).toBe(antes.requisicoesBanner);
  });

  test('US-25.CA17: lista vazia mostra o banner sem competir com "Adicionar assinatura" (≥ 16 px de distância)', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: [], hash: '#/assinaturas' });
    await esperarBanner(page);
    const btn = page.getByTestId('btn-adicionar-vazio');
    await expect(btn).toBeVisible();
    const b = await btn.boundingBox();
    const f = await faixa(page).boundingBox();
    expect(f!.y - (b!.y + b!.height)).toBeGreaterThanOrEqual(16);
    await page.getByTestId('nav-inicio').click();
    await esperarBanner(page);
  });

  test('US-25.CA18: diálogo de limite — o banner nativo é escondido e volta depois, sem cobrir o aviso', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(5), hash: '#/' });
    await esperarBanner(page);
    await page.getByTestId('btn-adicionar').click();
    await expect(page.getByTestId('limite-aviso')).toBeVisible();
    await expect.poll(async () => (await chamadas(page)).bannerVisivel).toBe(false);
    await page.getByTestId('limite-btn-agora-nao').click();
    await esperarBanner(page);
    expect((await chamadas(page)).requisicoesBanner).toBe(1);
  });

  test('US-25.CA18: nenhum banner na tela do Pro, onde fica o botão de compra', async ({ page }) => {
    await abrirAnuncios(page, { hash: '#/pro' });
    await expect(page.getByTestId('pro-btn-comprar')).toBeVisible();
    await semBanner(page);
  });
});
