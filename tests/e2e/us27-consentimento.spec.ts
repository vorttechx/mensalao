// US-27 — Consentimento (LGPD + UMP) e Ajustes > Anúncios e privacidade. Provedor de anúncios FALSO.
// Não coberto aqui (só em aparelho, dev-notes §9 itens 3 e 4): o formulário real do UMP, a região simulada
// (EEE) pelo SDK, TalkBack e o botão voltar do Android.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { semRolagemHorizontal, backupArquivo } from './helpers2';
import { texto200, transbordos } from './helpers3';
import { abrirAnuncios, ativas, chamadas, configurarAnuncios, escolherNoAviso, esperarBanner, estadoGravado, faixa, lerChave, semBanner, vigiarCsp } from './helpers4';

test.describe('US-27 Aviso de consentimento', () => {
  test('US-27.CA1: 2ª abertura sem escolha — o aviso aparece antes de qualquer anúncio, com o texto e o link da política', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: null });
    const aviso = page.getByTestId('consent-aviso');
    await expect(aviso).toBeVisible();
    await expect(aviso).toContainText('A versão grátis tem anúncios');
    await expect(aviso).toContainText('anúncio do Google');
    await expect(aviso).toContainText('Suas assinaturas nunca saem do seu celular');
    await expect(aviso).toContainText('identificador de publicidade');
    await expect(page.getByTestId('consent-saiba-mais')).toHaveAttribute('href', 'https://mensalao.app/privacidade.html');
    const c = await chamadas(page);
    expect(c.iniciar).toBe(0);
    expect(c.requisicoesBanner).toBe(0);
    await expect(faixa(page)).toHaveCount(0);
  });

  test('US-27.CA1 / UX-S4-04: na 1ª abertura não há aviso nem banner, em nenhuma tela', async ({ page }) => {
    await abrirAnuncios(page, { aberturas: 0, escolha: null, assinaturas: ativas(3) });
    for (const aba of ['nav-assinaturas', 'nav-totais', 'nav-inicio']) {
      await page.getByTestId(aba).click();
      await page.waitForTimeout(150);
    }
    await expect(page.getByTestId('consent-aviso')).toHaveCount(0);
    await expect(faixa(page)).toHaveCount(0);
    const c = await chamadas(page);
    expect(c.disponivel + c.consultarGoogle + c.iniciar + c.requisicoesBanner).toBe(0);
  });

  test('US-27.CA1: o aviso nunca aparece em telas sem banner (formulário, catálogo, Pro, Ajustes, Detalhe)', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: null, hash: '#/ajustes' });
    for (const hash of ['#/ajustes', '#/nova/form', '#/nova', '#/pro', '#/assinatura/a0']) {
      await page.evaluate((h) => { location.hash = h; }, hash);
      await page.waitForTimeout(250);
      await expect(page.getByTestId('consent-aviso'), hash).toHaveCount(0);
    }
  });

  test('US-27.CA1: o fluxo de compra do Pro não é interrompido pelo aviso', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: null, hash: '#/pro' });
    await page.getByTestId('pro-btn-comprar').click();
    await expect(page.getByTestId('pro-ativo')).toBeVisible();
    await expect(page.getByTestId('consent-aviso')).toHaveCount(0);
  });

  test('US-27.CA2: duas opções de mesmo peso (mesmo tamanho e estilo), sem pré-seleção, sem botão de fechar', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: null });
    const a = page.getByTestId('consent-personalizado');
    const b = page.getByTestId('consent-nao-personalizado');
    await expect(a).toHaveText('Anúncios personalizados');
    await expect(b).toHaveText('Anúncios não personalizados');
    const [ba, bb] = [await a.boundingBox(), await b.boundingBox()];
    expect(ba!.width).toBe(bb!.width);
    expect(ba!.height).toBe(bb!.height);
    const estilo = (l: typeof a) => l.evaluate((e) => { const s = getComputedStyle(e); return [s.backgroundColor, s.color, s.fontWeight, s.fontSize, s.borderTopWidth, s.borderTopColor].join('|'); });
    expect(await estilo(a)).toBe(await estilo(b));
    expect(await a.evaluate((e) => e.matches(':focus') || e.getAttribute('aria-pressed') === 'true' || e.getAttribute('aria-checked') === 'true')).toBe(false);
    await expect(page.getByTestId('consent-aviso').getByRole('button')).toHaveCount(2); // sem "×" nem "aceitar tudo"
    await expect(page.getByTestId('consent-aviso')).not.toContainText(/aceitar tudo|aceito/i);
  });

  test('US-27.CA2: Esc fecha sem gravar escolha, nenhum anúncio é pedido e o aviso volta ao entrar em outra tela com banner', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: null });
    await expect(page.getByTestId('consent-aviso')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('consent-aviso')).toHaveCount(0);
    expect((await estadoGravado(page)).escolha).toBeNull();
    let c = await chamadas(page);
    expect(c.iniciar + c.requisicoesBanner).toBe(0);
    await expect(faixa(page)).toHaveCount(0);
    await page.getByTestId('nav-assinaturas').click();
    await expect(page.getByTestId('consent-aviso')).toBeVisible();
    c = await chamadas(page);
    expect(c.iniciar + c.requisicoesBanner).toBe(0);
  });

  test('US-27.CA3: "não personalizados" pede com npa, grava com data e versão, e não pergunta de novo na próxima abertura', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: null });
    await escolherNoAviso(page, 'nao-personalizado');
    await esperarBanner(page);
    expect((await chamadas(page)).ultimoPersonalizado).toBe(false);
    const e = await estadoGravado(page);
    expect(e).toMatchObject({ escolha: 'nao-personalizado', versaoTexto: 1 });
    expect(new Date(e.decididoEm).getTime()).toBeGreaterThan(0);
    await page.reload();
    await esperarBanner(page);
    await expect(page.getByTestId('consent-aviso')).toHaveCount(0);
  });

  test('US-27.CA3: "personalizados" pede normalmente', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: null });
    await escolherNoAviso(page, 'personalizado');
    await esperarBanner(page);
    expect((await chamadas(page)).ultimoPersonalizado).toBe(true);
    expect((await estadoGravado(page)).escolha).toBe('personalizado');
  });

  test('US-27.CA14: foco no título ao abrir e depois da escolha, texto salvo para o leitor de tela', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: null });
    await expect(page.getByTestId('consent-aviso')).toBeVisible();
    expect(await page.evaluate(() => document.activeElement?.tagName + ':' + document.activeElement?.textContent)).toBe('H2:A versão grátis tem anúncios');
    await expect(page.getByTestId('consent-aviso')).toHaveAttribute('aria-labelledby', /.+/);
    await page.getByTestId('consent-nao-personalizado').click();
    await expect(page.getByTestId('consent-anuncio-leitor')).toHaveText('Escolha salva: anúncios não personalizados.');
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('titulo-tela');
  });

  test('US-27.CA14: Tab fica dentro do aviso e os dois botões têm foco visível e pelo menos 44×44 px', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: null });
    await expect(page.getByTestId('consent-aviso')).toBeVisible();
    for (const id of ['consent-personalizado', 'consent-nao-personalizado']) {
      const b = await page.getByTestId(id).boundingBox();
      expect(b!.width).toBeGreaterThanOrEqual(44);
      expect(b!.height).toBeGreaterThanOrEqual(44);
    }
    const vistos = new Set<string>();
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Tab');
      vistos.add(await page.evaluate(() => (document.activeElement?.closest('[data-testid="consent-aviso"]') ? document.activeElement?.getAttribute('data-testid') ?? 'x' : document.activeElement === document.body || document.activeElement === document.documentElement ? 'navegador' : 'FORA')));
    }
    expect(vistos.has('FORA')).toBe(false); // o foco nunca vai para a tela de trás (a volta passa pelo navegador)
    expect(vistos.has('consent-personalizado') && vistos.has('consent-nao-personalizado') && vistos.has('consent-saiba-mais')).toBe(true);
    await page.getByTestId('consent-personalizado').focus();
    const anel = await page.getByTestId('consent-personalizado').evaluate((e) => { const s = getComputedStyle(e); return parseFloat(s.outlineWidth) > 0 || s.boxShadow !== 'none'; });
    expect(anel).toBe(true);
  });

  test('US-27.CA14: 360 px sem rolagem horizontal; texto a 200% rola e os dois botões continuam alcançáveis com 44×44', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: null });
    await expect(page.getByTestId('consent-aviso')).toBeVisible();
    await semRolagemHorizontal(page);
    expect(await transbordos(page)).toEqual([]);
    await texto200(page);
    await expect(page.getByTestId('consent-aviso')).toBeVisible();
    for (const id of ['consent-personalizado', 'consent-nao-personalizado']) {
      const b = page.getByTestId(id);
      await b.scrollIntoViewIfNeeded();
      await expect(b).toBeVisible();
      const r = await b.boundingBox();
      expect(r!.height).toBeGreaterThanOrEqual(44);
      expect(r!.x).toBeGreaterThanOrEqual(0);
      expect(r!.x + r!.width).toBeLessThanOrEqual(360);
    }
    expect(await transbordos(page)).toEqual([]);
  });

  test('US-27.CA14: com prefers-reduced-motion o aviso abre sem animação', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: null });
    await expect(page.getByTestId('consent-aviso')).toBeVisible();
    const anim = await page.getByTestId('consent-aviso').evaluate((e) => { const s = getComputedStyle(e); return { a: s.animationName, d: s.animationDuration, t: s.transitionDuration }; });
    expect(anim.a === 'none' || parseFloat(anim.d) === 0).toBe(true);
    expect(parseFloat(anim.t)).toBe(0);
  });

  test('US-27.CA15: texto honesto e sem pressão', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: null });
    const t = (await page.getByTestId('consent-aviso').innerText()).toLowerCase();
    expect(t).toContain('não dá acesso às suas assinaturas');
    expect(t).toContain('mudar quando quiser em ajustes');
    for (const pressao of ['para continuar', 'obrigat', 'senão', 'de graça', 'ajude', 'apoie', 'por favor']) expect(t).not.toContain(pressao);
  });
});

test.describe('US-27 UMP (formulário do Google)', () => {
  test('US-27.CA4: UMP exigido (EEE) — formulário do Google no lugar do aviso do app, sem pedido duplo', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: null, anuncios: { google: 'exigido', googleResposta: 'consentiu' } });
    await esperarBanner(page);
    await expect(page.getByTestId('consent-aviso')).toHaveCount(0);
    const c = await chamadas(page);
    expect(c.formularioGoogle).toBe(1);
    expect(c.requisicoesBanner).toBe(1);
    expect(c.iniciar).toBe(1);
    // O formulário não repete ao navegar.
    await page.getByTestId('nav-totais').click();
    expect((await chamadas(page)).formularioGoogle).toBe(1);
  });

  test('US-27.CA4: UMP exigido já respondido não mostra formulário de novo', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: null, anuncios: { google: 'exigido', googleRespondido: true } });
    await esperarBanner(page);
    expect((await chamadas(page)).formularioGoogle).toBe(0);
  });

  test('US-27.CA5: UMP não exigido (Brasil) — aparece o aviso do app', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: null, anuncios: { google: 'nao-exigido' } });
    await expect(page.getByTestId('consent-aviso')).toBeVisible();
    expect((await chamadas(page)).formularioGoogle).toBe(0);
  });

  test('US-27.CA5: UMP com falha — nenhum anúncio, nenhum aviso, o app não trava e a consulta é tentada de novo ao trocar de tela', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: 'personalizado', anuncios: { google: 'erro' } });
    await expect.poll(async () => (await chamadas(page)).consultarGoogle).toBeGreaterThanOrEqual(1);
    await expect(faixa(page)).toHaveCount(0);
    await expect(page.getByTestId('consent-aviso')).toHaveCount(0);
    expect((await chamadas(page)).iniciar).toBe(0);
    const antes = (await chamadas(page)).consultarGoogle;
    await page.clock.setFixedTime('2026-09-30T12:01:00-03:00'); // passou a espera de 30 s
    await configurarAnuncios(page, { google: 'nao-exigido' });
    await page.getByTestId('nav-assinaturas').click();
    await expect.poll(async () => (await chamadas(page)).consultarGoogle).toBeGreaterThan(antes);
    await esperarBanner(page); // o UMP voltou: o banner sai com a escolha guardada
  });

  test('US-27.CA8: UMP recusado — nenhum anúncio e o espaço do banner não é reservado', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: null, anuncios: { google: 'exigido', googleResposta: 'recusou' } });
    await expect.poll(async () => (await chamadas(page)).formularioGoogle).toBe(1);
    await page.waitForTimeout(400);
    await expect(faixa(page)).toHaveCount(0);
    await expect(page.locator('.com-anuncio')).toHaveCount(0);
    const c = await chamadas(page);
    expect(c.iniciar + c.requisicoesBanner).toBe(0);
  });

  test('US-27.CA6: Ajustes na região do UMP mostra "Opções de privacidade do Google", que reabre o formulário', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: null, hash: '#/ajustes', anuncios: { google: 'exigido', googleRespondido: true } });
    const opcoes = page.getByTestId('consent-opcoes-google');
    await expect(opcoes).toBeVisible();
    await expect(page.getByTestId('consent-ajustes-personalizado')).toHaveCount(0);
    await opcoes.click();
    await expect.poll(async () => (await chamadas(page)).opcoesPrivacidade).toBe(1);
  });

  test('US-27.CA6: fora da região do UMP o botão do Google não aparece', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), hash: '#/ajustes' });
    await expect(page.getByTestId('consent-ajustes-personalizado')).toBeVisible();
    await expect(page.getByTestId('consent-opcoes-google')).toHaveCount(0);
  });
});

test.describe('US-27 Ajustes > Anúncios e privacidade', () => {
  test('US-27.CA6: mostra a escolha atual, a data, o link da política e troca na hora', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), hash: '#/ajustes', escolha: 'personalizado' });
    const secao = page.getByTestId('consent-ajustes');
    await expect(secao).toBeVisible();
    await expect(secao).toContainText('A versão grátis mostra anúncios do Google no rodapé do Início, de Assinaturas e de Totais.');
    await expect(page.getByTestId('consent-ajustes-personalizado')).toBeChecked();
    await expect(page.getByTestId('consent-ajustes-nao-personalizado')).not.toBeChecked();
    await expect(page.getByTestId('consent-ajustes-data')).toContainText('Escolha feita em 20/09/2026');
    await expect(page.getByTestId('consent-link-privacidade')).toHaveAttribute('href', 'https://mensalao.app/privacidade.html');
    await page.getByTestId('consent-ajustes-nao-personalizado').check();
    await expect(page.getByTestId('consent-ajustes-nao-personalizado')).toBeChecked();
    await expect(page.getByTestId('consent-ajustes-data')).toContainText('Escolha feita em 30/09/2026');
    expect((await estadoGravado(page)).escolha).toBe('nao-personalizado');
  });

  test('US-27.CA6: sem escolha, nenhum rádio marcado e o texto avisa que não há anúncios até escolher', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), hash: '#/ajustes', escolha: null });
    await expect(page.getByTestId('consent-ajustes-personalizado')).not.toBeChecked();
    await expect(page.getByTestId('consent-ajustes-nao-personalizado')).not.toBeChecked();
    await expect(page.getByTestId('consent-ajustes-data')).toContainText('Você ainda não escolheu. O app não mostra anúncios até você escolher.');
  });

  test('US-27.CA6 / CA7: alterar para "não personalizados" vale já no próximo anúncio, sem reiniciar, e o banner é pedido de novo no novo modo', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: 'personalizado' });
    await esperarBanner(page);
    expect((await chamadas(page)).ultimoPersonalizado).toBe(true);
    await page.evaluate(() => ((window as any).__marca = 1));
    await page.getByTestId('nav-ajustes').click();
    await page.getByTestId('consent-ajustes-nao-personalizado').check();
    await page.getByTestId('nav-inicio').click();
    await esperarBanner(page);
    await expect.poll(async () => (await chamadas(page)).ultimoPersonalizado).toBe(false);
    const c = await chamadas(page);
    expect(c.requisicoesBanner).toBe(2); // a escolha mudou: banner novo no outro modo
    expect(c.iniciar).toBeGreaterThanOrEqual(2);
    expect(await page.evaluate(() => (window as any).__marca)).toBe(1);
  });

  test('US-27.CA7: trocar a escolha com o banner visível o remove em até 5 s e o novo sai no outro modo', async ({ page }) => {
    // O banner só aparece nas telas permitidas; a troca é feita em Ajustes e, ao voltar, o antigo já foi descartado.
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: 'nao-personalizado' });
    await esperarBanner(page);
    await page.getByTestId('nav-ajustes').click();
    await page.getByTestId('consent-ajustes-personalizado').check();
    await expect.poll(async () => (await chamadas(page)).bannerVisivel, { timeout: 5000 }).toBe(false);
    await page.getByTestId('nav-totais').click();
    await esperarBanner(page);
    expect((await chamadas(page)).ultimoPersonalizado).toBe(true);
  });

  test('US-27.CA9: no Pro, o UMP não é consultado nem o aviso aparece, mesmo em região do UMP', async ({ page }) => {
    await abrirAnuncios(page, { pro: true, assinaturas: ativas(3), escolha: null, anuncios: { google: 'exigido' } });
    for (const aba of ['nav-assinaturas', 'nav-totais', 'nav-ajustes']) await page.getByTestId(aba).click();
    await page.waitForTimeout(400);
    const c = await chamadas(page);
    expect(c.consultarGoogle + c.formularioGoogle + c.iniciar + c.disponivel).toBe(0);
    await expect(page.getByTestId('consent-aviso')).toHaveCount(0);
  });

  test('US-27.CA12: escolha com tipos errados = sem escolha: pergunta de novo, nenhum anúncio antes e as assinaturas intactas', async ({ page }) => {
    for (const bruto of ['{"escolha":"sim","versaoTexto":"1","decididoEm":5,"aberturas":1}', '{"escolha":"personalizado","versaoTexto":1,"decididoEm":"ontem","aberturas":1}', '{"escolha":"personalizado","versaoTexto":"x","decididoEm":"2026-09-20T12:00:00Z","aberturas":1}']) {
      await abrirAnuncios(page, { assinaturas: ativas(3), estadoBruto: bruto });
      await expect(page.getByTestId('consent-aviso'), bruto).toBeVisible();
      expect((await chamadas(page)).iniciar).toBe(0);
      await expect(faixa(page)).toHaveCount(0);
      expect(JSON.parse((await lerChave(page, 'mensalao:v1'))!).assinaturas).toHaveLength(3);
    }
  });

  test('US-27.CA12: JSON inteiro ilegível = estado vazio: nenhum anúncio, assinaturas intactas, e o aviso vem na abertura seguinte', async ({ page }) => {
    for (const bruto of ['{{{', '[]', '"texto"']) {
      await abrirAnuncios(page, { assinaturas: ativas(3), estadoBruto: bruto });
      await page.waitForTimeout(300);
      await expect(faixa(page)).toHaveCount(0);
      expect((await chamadas(page)).iniciar).toBe(0);
      expect(JSON.parse((await lerChave(page, 'mensalao:v1'))!).assinaturas).toHaveLength(3);
      await page.reload(); // 2ª abertura depois de o estado ter sido refeito
      await expect(page.getByTestId('consent-aviso'), bruto).toBeVisible();
      expect((await chamadas(page)).iniciar).toBe(0);
    }
  });

  test('US-27.CA12: Ajustes com a escolha ilegível não marca nenhum rádio', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), estadoBruto: '{"escolha":42}', hash: '#/ajustes' });
    await expect(page.getByTestId('consent-ajustes-personalizado')).not.toBeChecked();
    await expect(page.getByTestId('consent-ajustes-nao-personalizado')).not.toBeChecked();
  });

  test('US-27.CA13: o backup JSON exportado não inclui a escolha nem o crédito', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), hash: '#/ajustes', escolha: 'nao-personalizado', credito: 1 });
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('btn-exportar').click()]);
    const texto = readFileSync((await dl.path())!, 'utf8');
    const json = JSON.parse(texto);
    expect(Object.keys(json).sort()).toEqual(['assinaturas', 'config', 'exportadoEm', 'formato', 'versao']);
    expect(texto).not.toMatch(/escolha|credito|anuncios|personalizado|versaoTexto|aberturas/i);
  });

  test('US-27.CA13: importar um backup (mesmo com campos forjados de anúncios) nunca altera a escolha nem o crédito', async ({ page }) => {
    await abrirAnuncios(page, { assinaturas: ativas(3), hash: '#/ajustes', escolha: 'nao-personalizado', credito: 0 });
    const antes = await lerChave(page, 'mensalao:anuncios:v1');
    const arq = backupArquivo(ativas(2), { escolha: 'personalizado', credito: 1, anuncios: { escolha: 'personalizado', credito: 1 } });
    await page.getByTestId('input-importar').setInputFiles(arq);
    await page.getByTestId('btn-confirmar').click();
    await expect(page.getByTestId('import-ok')).toBeVisible();
    expect(JSON.parse((await lerChave(page, 'mensalao:anuncios:v1'))!)).toEqual(JSON.parse(antes!));
    expect((await estadoGravado(page)).credito).toBe(0);
  });

  test('US-29.CA8: nenhuma violação de CSP ao navegar com banner, aviso de consentimento e Ajustes', async ({ page }) => {
    const violacoes = vigiarCsp(page);
    await abrirAnuncios(page, { assinaturas: ativas(3), escolha: null });
    await escolherNoAviso(page, 'personalizado');
    await esperarBanner(page);
    for (const hash of ['#/assinaturas', '#/totais', '#/ajustes', '#/pro', '#/nova/form', '#/']) {
      await page.evaluate((h) => { location.hash = h; }, hash);
      await page.waitForTimeout(150);
    }
    expect(violacoes).toEqual([]);
  });
});
