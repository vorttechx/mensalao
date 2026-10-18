// US-12.CA14/CA15 contra o build de PRODUÇÃO (projeto producao-360, porta 4174).
import { expect, test } from '@playwright/test';

function assinaturas(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `a${i}`, nome: `Servico ${i}`, valorCentavos: 1000, ciclo: 'mensal', proxima: '2026-10-20', diaRef: 20, pagamento: 'cartao', banco: '',
    categoria: 'Outros', emTeste: false, fimTeste: null, status: 'ativa', canceladaEm: null, catalogoId: null, historico: [], criadaEm: '2026-09-01',
  }));
}

async function semear(page: import('@playwright/test').Page, itens: [string, string][]) {
  await page.clock.setFixedTime('2026-09-30T12:00:00-03:00');
  await page.goto('./');
  await page.evaluate((e) => e.forEach(([k, v]) => localStorage.setItem(k, v)), itens);
  await page.reload();
}

test.describe('US-12 produção: nada ativa o Pro de graça', () => {
  test('US-12.CA14: não existe window.__mensalaoTeste nem o identificador do provedor falso', async ({ page, request }) => {
    await page.goto('./');
    expect(await page.evaluate(() => typeof (window as any).__mensalaoTeste)).toBe('undefined');
    const html = await (await request.get('./')).text();
    const scripts = [...html.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1]);
    expect(scripts.length).toBeGreaterThan(0);
    for (const s of scripts) {
      const js = await (await request.get(new URL(s, page.url()).toString())).text();
      for (const proibido of ['provedor-falso-mensalao', 'mensalao:teste:provedor', 'mensalao:teste:notificacao', '__mensalaoTeste']) {
        expect(js, `${s} contém ${proibido}`).not.toContain(proibido);
      }
    }
  });

  test('US-12.CA15: parâmetros de URL (?pro=1, #/pro?pro=1, ?modo=teste) não ativam o Pro', async ({ page }) => {
    for (const url of ['./?pro=1', './?pro=true&teste=1', './?modo=teste', './#/pro?pro=1', './?compra=ok#/pro']) {
      await page.goto(url);
      await page.reload();
      await expect(page.getByTestId('selo-pro')).toHaveCount(0);
    }
    await page.goto('./?pro=1#/pro');
    await page.reload();
    await expect(page.getByTestId('pro-ativo')).toHaveCount(0);
    await expect(page.getByTestId('pro-indisponivel')).toBeVisible();
    await expect(page.getByTestId('pro-btn-comprar')).toHaveCount(0);
  });

  test('US-12.CA15: valor forjado em mensalao:pro:v1 não é honrado (navegador comum)', async ({ page }) => {
    await semear(page, [
      ['mensalao:v1', JSON.stringify({ versao: 1, config: { diasAviso: 3 }, assinaturas: assinaturas(6) })],
      ['mensalao:pro:v1', JSON.stringify({ pro: true, sku: 'mensalao_pro', verificadoEm: '2026-09-30T00:00:00.000Z' })],
    ]);
    await expect(page.getByTestId('upcoming-list')).toBeVisible();
    await expect(page.getByTestId('selo-pro')).toHaveCount(0);
    await expect(page.getByTestId('limite-contador')).toContainText('6 de 5');
    await page.getByTestId('btn-adicionar').click();
    await expect(page.getByTestId('limite-aviso')).toBeVisible();
    await page.getByTestId('limite-btn-agora-nao').click();
    await page.goto('./#/ajustes');
    await expect(page.getByTestId('lock-csv')).toBeVisible();
    await expect(page.getByTestId('lock-temas')).toBeVisible();
    await expect(page.getByTestId('btn-exportar-csv')).toHaveCount(0);
  });

  test('US-12.CA15: chaves e objetos de teste (provedor/controle/prefs) não têm efeito em produção', async ({ page }) => {
    await semear(page, [
      ['mensalao:v1', JSON.stringify({ versao: 1, config: { diasAviso: 3 }, assinaturas: assinaturas(6) })],
      ['mensalao:teste:provedor', JSON.stringify({ compras: ['mensalao_pro'], disponivel: true })],
      ['mensalao:teste:notificacao', JSON.stringify({ permissao: 'granted' })],
      ['mensalao:prefs:v1', JSON.stringify({ tema: 'ameixa', pro: true, lembrete: { ativo: true, dias: 3 } })],
    ]);
    await expect(page.getByTestId('upcoming-list')).toBeVisible();
    await expect(page.getByTestId('selo-pro')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.dataset.tema)).toBeUndefined();
    await expect(page.getByTestId('lembrete-aviso')).toHaveCount(0);
  });

  test('US-12.CA15: tentar criar objetos globais no console não ativa o Pro', async ({ page }) => {
    await page.goto('./');
    await page.evaluate(() => {
      (window as any).__mensalaoTeste = { provedor: { configurar() {} } };
      (window as any).pro = true;
      (window as any).ehPro = () => true;
      localStorage.setItem('mensalao:pro:v1', '{"pro":true,"sku":"mensalao_pro"}');
    });
    await page.reload();
    await expect(page.getByTestId('selo-pro')).toHaveCount(0);
    await page.goto('./#/pro');
    await expect(page.getByTestId('pro-indisponivel')).toBeVisible();
    await expect(page.getByTestId('pro-btn-restaurar')).toBeDisabled();
  });

  test('US-11.CA7 / US-12.CA10: em produção, num navegador comum, a tela Pro mostra a oferta sem comprar', async ({ page }) => {
    await page.goto('./#/pro');
    await page.reload();
    await expect(page.getByTestId('pro-recursos')).toBeVisible();
    await expect(page.getByTestId('pro-indisponivel')).toContainText('disponível no app do Mensalão na Google Play');
    await expect(page.getByTestId('pro-btn-comprar')).toHaveCount(0);
  });
});
