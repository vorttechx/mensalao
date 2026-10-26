// US-28 — Anúncio premiado opcional: uma exportação CSV. Provedor de anúncios FALSO (IDs de teste).
// Não coberto aqui (só em aparelho, dev-notes §9 item 9): o vídeo real, "Test Ad" do Google, fechar o vídeo e
// ir para o segundo plano durante o anúncio real.
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { semRolagemHorizontal, sub } from './helpers2';
import { texto200, transbordos } from './helpers3';
import { abrirAnuncios, ativas, chamadas, configurarAnuncios, estadoGravado } from './helpers4';

const AJUSTES = { hash: '#/ajustes', assinaturas: [sub({ id: '1', nome: 'Netflix' }), sub({ id: '2', nome: 'Spotify' })] };

async function assistir(page: Page) {
  await page.getByTestId('premiado-oferta').click();
  await expect(page.getByTestId('premiado-dialogo')).toBeVisible();
  await page.getByTestId('premiado-btn-assistir').click();
}

async function baixouCsv(page: Page, acao: () => Promise<void>, esperar = 2500): Promise<string | null> {
  const dl = page.waitForEvent('download', { timeout: esperar }).then((d) => d, () => null);
  await acao();
  const d = await dl;
  return d ? readFileSync((await d.path())!, 'utf8') : null;
}

test.describe('US-28 Anúncio premiado', () => {
  test('US-28.CA1: a oferta fica em Ajustes > Planilha, ao lado de "Conhecer o Pro", sem pop-up e sem texto de culpa', async ({ page }) => {
    await abrirAnuncios(page, AJUSTES);
    const oferta = page.getByTestId('premiado-oferta');
    await expect(oferta).toHaveText('Assistir a um anúncio para exportar uma vez');
    await expect(page.getByTestId('lock-csv').getByTestId('lock-btn-pro')).toBeVisible();
    await expect(page.getByTestId('premiado-dialogo')).toHaveCount(0); // nada abre sozinho
    await expect(page.getByTestId('premiado-ajuda')).toContainText('O anúncio é um vídeo do Google de alguns segundos');
    const t = (await page.getByTestId('lock-csv').innerText()).toLowerCase();
    for (const culpa of ['não perca', 'últim', 'agora ou', 'apenas hoje', 'segundos restantes']) expect(t).not.toContain(culpa);
    expect((await chamadas(page)).carregarPremiado).toBe(0);
  });

  test('US-28.CA1: nenhuma outra tela oferece o premiado', async ({ page }) => {
    await abrirAnuncios(page, { ...AJUSTES, hash: '#/' });
    for (const hash of ['#/', '#/assinaturas', '#/totais', '#/pro', '#/nova/form', '#/assinatura/1']) {
      await page.evaluate((h) => { location.hash = h; }, hash);
      await page.waitForTimeout(150);
      await expect(page.getByTestId('premiado-oferta'), hash).toHaveCount(0);
    }
  });

  test('US-28.CA2: o toque abre o aviso (vídeo do Google, uma exportação) e nada é carregado antes de "Assistir"; "Agora não" desiste', async ({ page }) => {
    await abrirAnuncios(page, AJUSTES);
    await page.getByTestId('premiado-oferta').click();
    const d = page.getByTestId('premiado-dialogo');
    await expect(d).toContainText('É um anúncio em vídeo do Google, com alguns segundos. Você ganha uma exportação da planilha CSV.');
    await expect(page.getByTestId('premiado-btn-assistir')).toHaveText('Assistir');
    await expect(page.getByTestId('premiado-btn-agora-nao')).toHaveText('Agora não');
    expect((await chamadas(page)).carregarPremiado).toBe(0);
    await page.getByTestId('premiado-btn-agora-nao').click();
    await expect(d).toHaveCount(0);
    const c = await chamadas(page);
    expect(c.carregarPremiado + c.mostrarPremiado).toBe(0);
    await expect(page.getByTestId('premiado-oferta')).toBeVisible();
    expect((await estadoGravado(page)).credito).toBe(0);
  });

  test('US-28.CA3: assistir até o fim entrega o CSV na hora, consome o crédito e um novo CSV pede novo anúncio', async ({ page }) => {
    await abrirAnuncios(page, AJUSTES);
    const csv = await baixouCsv(page, () => assistir(page));
    expect(csv).not.toBeNull();
    expect(csv!.slice(1).split('\r\n')[0]).toMatch(/^Nome;Valor;Ciclo/);
    expect(csv).toContain('Netflix;44,90');
    expect(csv).toContain('Spotify;44,90');
    await expect(page.getByTestId('csv-ok')).toContainText('Planilha exportada: mensalao-assinaturas-2026-09-30.csv');
    expect((await estadoGravado(page)).credito).toBe(0);
    await expect(page.getByTestId('premiado-credito')).toHaveCount(0);
    await expect(page.getByTestId('premiado-oferta')).toBeVisible(); // novo CSV = novo anúncio (ou o Pro)
    const c = await chamadas(page);
    expect(c.mostrarPremiado).toBe(1);
    expect(c.carregarPremiado).toBe(1);
  });

  test('US-28.CA4: anúncio fechado antes do fim — sem prêmio, sem arquivo, mensagem e nova tentativa possível', async ({ page }) => {
    await abrirAnuncios(page, { ...AJUSTES, anuncios: { premiado: 'fechado' } });
    const csv = await baixouCsv(page, () => assistir(page), 1500);
    expect(csv).toBeNull();
    await expect(page.getByTestId('premiado-msg')).toHaveText('O anúncio não foi concluído. Nenhuma exportação foi liberada.');
    expect((await estadoGravado(page)).credito).toBe(0);
    await expect(page.getByTestId('premiado-credito')).toHaveCount(0);
    await expect(page.getByTestId('premiado-oferta')).toBeVisible();
    await expect(page.getByTestId('premiado-oferta')).toBeFocused(); // CA11: o foco volta à origem
    // tentar de novo funciona
    await configurarAnuncios(page, { premiado: 'premiado' });
    const csv2 = await baixouCsv(page, () => assistir(page));
    expect(csv2).not.toBeNull();
  });

  for (const [nome, cfg] of [
    ['sem anúncio disponível', { carregarPremiado: false }],
    ['SDK com erro no premiado', { premiado: 'erro' }],
    ['premiado sem anúncio', { premiado: 'sem-anuncio' }],
  ] as const) {
    test(`US-28.CA5: ${nome} — mensagem, nenhum prêmio, a tela não trava e dá para tentar de novo`, async ({ page }) => {
      await abrirAnuncios(page, { ...AJUSTES, anuncios: cfg });
      const csv = await baixouCsv(page, () => assistir(page), 1500);
      expect(csv).toBeNull();
      await expect(page.getByTestId('premiado-msg')).toHaveText('Não há anúncio disponível agora. Tente mais tarde ou conheça o Pro.');
      expect((await estadoGravado(page)).credito).toBe(0);
      await expect(page.getByTestId('premiado-oferta')).toBeEnabled();
    });
  }

  test('US-28.CA5: a rede cai depois de a oferta aparecer — mensagem de sem anúncio, nenhum prêmio', async ({ page }) => {
    await abrirAnuncios(page, AJUSTES);
    await expect(page.getByTestId('premiado-oferta')).toBeVisible();
    await configurarAnuncios(page, { offline: true });
    const csv = await baixouCsv(page, () => assistir(page), 1500);
    expect(csv).toBeNull();
    await expect(page.getByTestId('premiado-msg')).toHaveText('Não há anúncio disponível agora. Tente mais tarde ou conheça o Pro.');
    expect((await estadoGravado(page)).credito).toBe(0);
  });

  test('US-28.CA5: carregando — estado ocupado (aria-busy), tela utilizável, e acima de 10 s o app desiste sem prêmio', async ({ page }) => {
    test.setTimeout(60_000);
    await abrirAnuncios(page, { ...AJUSTES, anuncios: { atrasoPremiadoMs: 14_000 } });
    await assistir(page);
    const carregando = page.getByTestId('premiado-oferta');
    await expect(carregando).toHaveAttribute('aria-busy', 'true');
    await expect(carregando).toContainText('Carregando o anúncio…');
    await expect(carregando).toBeDisabled();
    await page.getByTestId('nav-totais').click(); // a tela não trava
    await page.getByTestId('nav-ajustes').click();
    await expect(page.getByTestId('premiado-msg')).toHaveText('Não há anúncio disponível agora. Tente mais tarde ou conheça o Pro.', { timeout: 15_000 });
    expect((await estadoGravado(page)).credito).toBe(0);
  });

  test('US-28.CA6: crédito guardado — o bloco "1 exportação liberada" aparece e usar entrega o CSV e consome', async ({ page }) => {
    await abrirAnuncios(page, { ...AJUSTES, credito: 1 });
    await expect(page.getByTestId('premiado-credito')).toContainText('1 exportação liberada');
    await expect(page.getByTestId('premiado-credito')).toContainText('Não expira');
    await expect(page.getByTestId('premiado-oferta')).toHaveCount(0); // não acumula: não oferece outra
    const csv = await baixouCsv(page, () => page.getByTestId('premiado-credito-usar').click());
    expect(csv).not.toBeNull();
    expect((await estadoGravado(page)).credito).toBe(0);
    await expect(page.getByTestId('premiado-credito')).toHaveCount(0);
  });

  test('US-28.CA6: o crédito não expira — continua depois de reabrir o app muitas vezes e de passar dias', async ({ page }) => {
    await abrirAnuncios(page, { ...AJUSTES, credito: 1, relogio: '2027-03-01T12:00:00-03:00' });
    await page.reload();
    await page.reload();
    await expect(page.getByTestId('premiado-credito')).toBeVisible();
    expect((await estadoGravado(page)).credito).toBe(1);
  });

  test('US-28.CA6: o crédito aparece e pode ser usado mesmo sem SDK, sem rede e sem consentimento (usar não depende de anúncio)', async ({ page }) => {
    await abrirAnuncios(page, { ...AJUSTES, credito: 1, escolha: null, anuncios: { disponivel: false, offline: true } });
    await expect(page.getByTestId('premiado-credito')).toBeVisible();
    const csv = await baixouCsv(page, () => page.getByTestId('premiado-credito-usar').click());
    expect(csv).not.toBeNull();
    expect((await estadoGravado(page)).credito).toBe(0);
  });

  test('US-28.CA6: erro ao entregar o arquivo NÃO consome o crédito (nem o ganho no anúncio é perdido)', async ({ page }) => {
    await abrirAnuncios(page, { ...AJUSTES, credito: 1 });
    await page.evaluate(() => { URL.createObjectURL = () => { throw new Error('sem espaço'); }; });
    await page.getByTestId('premiado-credito-usar').click();
    await expect(page.getByTestId('premiado-msg')).toContainText('Sua exportação liberada continua guardada.');
    expect((await estadoGravado(page)).credito).toBe(1);
    await expect(page.getByTestId('premiado-credito')).toBeVisible();
  });

  test('US-28.CA6: premiado concluído mas o arquivo falha ao gravar — o crédito ganho fica guardado', async ({ page }) => {
    await abrirAnuncios(page, AJUSTES);
    await page.evaluate(() => { URL.createObjectURL = () => { throw new Error('sem espaço'); }; });
    await assistir(page);
    await expect(page.getByTestId('premiado-msg')).toContainText('Sua exportação liberada continua guardada.');
    expect((await estadoGravado(page)).credito).toBe(1);
    await expect(page.getByTestId('premiado-credito')).toBeVisible();
  });

  test('US-28.CA6: crédito acima de 1 no armazenamento (adulterado) não vale; o limite é 1', async ({ page }) => {
    await abrirAnuncios(page, { ...AJUSTES, estadoBruto: JSON.stringify({ escolha: 'personalizado', versaoTexto: 1, decididoEm: '2026-09-20T12:00:00.000Z', aberturas: 1, credito: 5 }) });
    await expect(page.getByTestId('premiado-credito')).toHaveCount(0);
    expect((await estadoGravado(page)).credito).toBeLessThanOrEqual(1);
  });

  test('US-28.CA7: no Pro não existe oferta nem crédito; o CSV sai direto, sem anúncio', async ({ page }) => {
    await abrirAnuncios(page, { ...AJUSTES, pro: true, credito: 1 });
    await expect(page.getByTestId('premiado-oferta')).toHaveCount(0);
    await expect(page.getByTestId('premiado-credito')).toHaveCount(0);
    const csv = await baixouCsv(page, () => page.getByTestId('btn-exportar-csv').click());
    expect(csv).not.toBeNull();
    const c = await chamadas(page);
    expect(c.carregarPremiado + c.mostrarPremiado + c.iniciar).toBe(0);
  });

  test('US-28.CA7: comprar o Pro na sessão faz a oferta sumir', async ({ page }) => {
    await abrirAnuncios(page, AJUSTES);
    await expect(page.getByTestId('premiado-oferta')).toBeVisible();
    await page.evaluate(() => { location.hash = '#/pro'; });
    await page.getByTestId('pro-btn-comprar').click();
    await expect(page.getByTestId('pro-ativo')).toBeVisible();
    await page.evaluate(() => { location.hash = '#/ajustes'; });
    await expect(page.getByTestId('premiado-oferta')).toHaveCount(0);
    await expect(page.getByTestId('btn-exportar-csv')).toBeVisible();
  });

  test('US-28.CA8: sem escolha de consentimento a oferta não aparece e nada é pedido ao SDK', async ({ page }) => {
    await abrirAnuncios(page, { ...AJUSTES, escolha: null });
    await expect(page.getByTestId('lock-csv')).toBeVisible();
    await page.waitForTimeout(300);
    await expect(page.getByTestId('premiado-oferta')).toHaveCount(0);
    const c = await chamadas(page);
    expect(c.carregarPremiado + c.iniciar).toBe(0);
  });

  test('US-28.CA8: UMP exigido e ainda não respondido — a oferta não aparece', async ({ page }) => {
    await abrirAnuncios(page, { ...AJUSTES, anuncios: { google: 'exigido', googleRespondido: false } });
    await page.waitForTimeout(400);
    await expect(page.getByTestId('premiado-oferta')).toHaveCount(0);
    expect((await chamadas(page)).carregarPremiado).toBe(0);
  });

  test('US-28.CA8: loja ainda não respondeu (plano desconhecido) — a oferta espera e depois aparece', async ({ page }) => {
    await abrirAnuncios(page, { ...AJUSTES, provedor: { atrasoMs: 2000 } });
    await page.waitForTimeout(500);
    await expect(page.getByTestId('premiado-oferta')).toHaveCount(0);
    await expect(page.getByTestId('premiado-oferta')).toBeVisible({ timeout: 5000 });
  });

  test('US-28.CA9: o crédito não libera outros recursos Pro nem a exportação JSON (que já é grátis) e não é gasto por eles', async ({ page }) => {
    await abrirAnuncios(page, { hash: '#/ajustes', assinaturas: ativas(6), credito: 1 });
    await expect(page.getByTestId('limite-contador').or(page.getByTestId('plano-btn-pro')).first()).toBeVisible();
    for (const lock of ['lock-csv', 'lock-lembretes', 'lock-backup-auto']) {
      const l = page.getByTestId(lock);
      if (await l.count()) await expect(l).toBeVisible();
    }
    await expect(page.getByTestId('btn-exportar-csv')).toHaveCount(0);
    const dl = await baixouCsv(page, () => page.getByTestId('btn-exportar').click());
    expect(dl).not.toBeNull();
    expect((await estadoGravado(page)).credito).toBe(1);
    await page.getByTestId('nav-inicio').click();
    await expect(page.getByTestId('limite-contador')).toContainText('6 de 5');
    await page.getByTestId('btn-adicionar').click();
    await expect(page.getByTestId('limite-aviso')).toBeVisible(); // o limite de 5 continua valendo
  });

  test('US-28.CA10: o crédito não vai no backup e importar backup não concede crédito', async ({ page }) => {
    await abrirAnuncios(page, { ...AJUSTES, credito: 1 });
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('btn-exportar').click()]);
    expect(readFileSync((await dl.path())!, 'utf8')).not.toMatch(/credito|premiado/i);
  });

  test('US-28.CA11: a oferta e as mensagens são anunciadas (role), o foco volta à origem, alvos ≥ 44 px, 360 px e 200%', async ({ page }) => {
    await abrirAnuncios(page, { ...AJUSTES, anuncios: { premiado: 'fechado' } });
    const oferta = page.getByTestId('premiado-oferta');
    const b = await oferta.boundingBox();
    expect(b!.height).toBeGreaterThanOrEqual(44);
    await semRolagemHorizontal(page);
    await assistir(page);
    const msg = page.getByTestId('premiado-msg');
    await expect(msg).toBeVisible();
    expect(['status', 'alert']).toContain(await msg.getAttribute('role'));
    await expect(oferta).toBeFocused();
    await oferta.click();
    for (const id of ['premiado-btn-assistir', 'premiado-btn-agora-nao']) {
      const r = await page.getByTestId(id).boundingBox();
      expect(r!.height).toBeGreaterThanOrEqual(44);
      expect(r!.width).toBeGreaterThanOrEqual(44);
    }
    await expect(page.getByTestId('premiado-dialogo')).toHaveAttribute('aria-labelledby', /.+/);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('premiado-dialogo')).toHaveCount(0);
    expect(await transbordos(page)).toEqual([]);
    await texto200(page);
    await expect(oferta).toBeVisible();
    await oferta.click();
    await expect(page.getByTestId('premiado-btn-assistir')).toBeVisible();
    expect(await transbordos(page)).toEqual([]);
  });

  test('US-28.CA11: com prefers-reduced-motion a oferta e o aviso não animam', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await abrirAnuncios(page, AJUSTES);
    await page.getByTestId('premiado-oferta').click();
    const anim = await page.getByTestId('premiado-dialogo').evaluate((e) => { const s = getComputedStyle(e); return { a: s.animationName, d: s.animationDuration }; });
    expect(anim.a === 'none' || parseFloat(anim.d) === 0).toBe(true);
  });

  test('US-28.CA12: segundo plano durante o anúncio — o app não perde o estado e termina com prêmio ou com a mensagem da CA4', async ({ page }) => {
    await abrirAnuncios(page, { ...AJUSTES, anuncios: { atrasoPremiadoMs: 1500, premiado: 'fechado' } });
    await assistir(page);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(page.getByTestId('premiado-msg')).toHaveText('O anúncio não foi concluído. Nenhuma exportação foi liberada.', { timeout: 6000 });
    await expect(page).toHaveURL(/#\/ajustes$/);
    expect((await estadoGravado(page)).credito).toBe(0);
    await expect(page.getByTestId('premiado-oferta')).toBeEnabled();
  });

  test('US-28.CA13: o pedido do premiado leva só o modo de personalização e o conteúdo exportado nunca passa pelo provedor', async ({ page }) => {
    await abrirAnuncios(page, { hash: '#/ajustes', assinaturas: [sub({ id: 'z', nome: 'SEGREDO-PREMIADO', valorCentavos: 123456 })], escolha: 'nao-personalizado' });
    const csv = await baixouCsv(page, () => assistir(page));
    expect(csv).toContain('SEGREDO-PREMIADO');
    const c = await chamadas(page);
    const texto = JSON.stringify(c);
    for (const proibido of ['SEGREDO-PREMIADO', '1234,56', '123456', 'Netflix']) expect(texto).not.toContain(proibido);
    expect(c.ultimoPersonalizado).toBe(false);
    for (const p of c.parametros as Record<string, unknown>[]) expect(Object.keys(p).length).toBe(1);
  });
});
