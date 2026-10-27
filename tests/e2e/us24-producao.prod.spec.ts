// US-24.CA9/CA10 / US-25 / US-28.CA10 / US-30.CA3 contra o build de PRODUÇÃO (projeto producao-360, porta 4174).
// No navegador, sem o app Android, os plugins nativos não existem: tudo cai nos provedores "Indisponível".
// Anúncio real e crédito forjado: o build de produção não tem controle para conceder nada.
import { expect, test } from '@playwright/test';

const CHAVE_ANUNCIOS = 'mensalao:anuncios:v1';
function sub(i: number) {
  return {
    id: `a${i}`, nome: `Servico ${i}`, valorCentavos: 1000, ciclo: 'mensal', proxima: '2026-10-20', diaRef: 20, pagamento: 'cartao', banco: '',
    categoria: 'Outros', emTeste: false, fimTeste: null, status: 'ativa', canceladaEm: null, catalogoId: null, historico: [], criadaEm: '2026-09-01',
  };
}

async function abrir(page: import('@playwright/test').Page, itens: [string, string][] = [], hash = '') {
  await page.clock.setFixedTime('2026-09-30T12:00:00-03:00');
  await page.goto('./');
  await page.evaluate((e) => e.forEach(([k, v]) => localStorage.setItem(k, v)), itens);
  await page.goto('./' + hash);
  await page.reload();
}

test.describe('produção: anúncios e crédito não podem ser forçados', () => {
  test('US-30.CA3: não existem os controles nem o provedor de anúncios falso (window e bundle)', async ({ page, request }) => {
    await page.goto('./');
    expect(await page.evaluate(() => typeof (window as any).__mensalaoTeste)).toBe('undefined');
    const html = await (await request.get('./')).text();
    for (const s of [...html.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1])) {
      const js = await (await request.get(new URL(s, page.url()).toString())).text();
      for (const proibido of ['anuncios-falso-mensalao', 'mensalao:teste:anuncios', 'mensalao:teste:anuncios-chamadas']) expect(js, `${s} contém ${proibido}`).not.toContain(proibido);
    }
    const css = [...html.matchAll(/href="([^"]+\.css)"/g)].map((m) => m[1]);
    expect(css.length).toBeGreaterThan(0);
  });

  test('US-24.CA9: no navegador (sem o app Android) não há banner, aviso nem oferta, mesmo depois de várias aberturas e com a chave de controle de teste gravada', async ({ page }) => {
    const itens: [string, string][] = [
      ['mensalao:v1', JSON.stringify({ versao: 1, config: { diasAviso: 3 }, assinaturas: [sub(0), sub(1)] })],
      ['mensalao:teste:anuncios', JSON.stringify({ disponivel: true, banner: 'ok', google: 'exigido' })],
      [CHAVE_ANUNCIOS, JSON.stringify({ escolha: null, versaoTexto: null, decididoEm: null, aberturas: 5, credito: 0 })],
    ];
    await abrir(page, itens);
    for (const hash of ['#/', '#/assinaturas', '#/totais']) {
      await page.goto('./' + hash);
      await page.waitForTimeout(250);
      await expect(page.getByTestId('anuncio-banner'), hash).toHaveCount(0);
      await expect(page.getByTestId('consent-aviso')).toHaveCount(0);
    }
    await page.goto('./#/ajustes');
    await expect(page.getByTestId('premiado-oferta')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('mensalao:teste:anuncios-chamadas'))).toBeNull();
  });

  test('US-28.CA10: crédito forjado em mensalao:anuncios:v1 não faz o CSV sair no grátis em produção (a exportação segue exigindo o Pro)', async ({ page }) => {
    await abrir(page, [
      ['mensalao:v1', JSON.stringify({ versao: 1, config: { diasAviso: 3 }, assinaturas: [sub(0)] })],
      [CHAVE_ANUNCIOS, JSON.stringify({ escolha: 'personalizado', versaoTexto: 1, decididoEm: '2026-09-20T12:00:00.000Z', aberturas: 3, credito: 1 })],
    ], '#/ajustes');
    // Sem o app Android não há anúncio nem "uso" de crédito por URL: nada de download espontâneo.
    const downloads: string[] = [];
    page.on('download', (d) => downloads.push(d.suggestedFilename()));
    await page.goto('./?credito=1&premiado=1#/ajustes');
    await page.waitForTimeout(400);
    expect(downloads).toEqual([]);
    await expect(page.getByTestId('btn-exportar-csv')).toHaveCount(0);
    await expect(page.getByTestId('lock-csv')).toBeVisible();
  });

  test('US-24.CA9 / US-29.CA3: o app abre normalmente sem plugins; compra fica indisponível; a política abre pela cópia empacotada', async ({ page }) => {
    await abrir(page, [], '#/pro');
    await expect(page.getByTestId('pro-indisponivel')).toBeVisible();
    await expect(page.getByTestId('pro-btn-comprar')).toHaveCount(0);
    const r = await page.request.get('./privacidade.html');
    expect(r.status()).toBe(200);
    expect(await r.text()).toContain('Política de privacidade');
  });

  test('US-29.CA8: nenhuma violação de CSP no build de produção ao navegar por todas as telas', async ({ page }) => {
    const violacoes: string[] = [];
    page.on('console', (m) => { if (/content security policy|refused to/i.test(m.text())) violacoes.push(m.text()); });
    page.on('pageerror', (e) => { if (/content security policy/i.test(e.message)) violacoes.push(e.message); });
    await abrir(page, [['mensalao:v1', JSON.stringify({ versao: 1, config: { diasAviso: 3 }, assinaturas: [sub(0), sub(1)] })]]);
    for (const hash of ['#/', '#/assinaturas', '#/totais', '#/ajustes', '#/pro', '#/nova', '#/nova/form', '#/assinatura/a0']) {
      await page.goto('./' + hash);
      await page.waitForTimeout(150);
    }
    expect(violacoes).toEqual([]);
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toMatch(/unsafe-inline|googlesyndication|doubleclick|googleads/);
  });
});
