import { expect, test } from '@playwright/test';
import { abrirS2, ativas, configurarProvedor, lerChave, semRolagemHorizontal } from './helpers2';

test.describe('US-11 Tela Mensalão Pro e compra única', () => {
  test('US-11.CA1: tela Pro no grátis mostra título, promessa, 6 recursos e o botão de compra', async ({ page }) => {
    await abrirS2(page, { hash: '#/pro' });
    await expect(page.getByTestId('pro-tela')).toBeVisible();
    await expect(page.getByTestId('titulo-tela')).toHaveText('Mensalão Pro');
    await expect(page.getByTestId('pro-tela')).toContainText('Pague uma vez, use para sempre');
    await expect(page.getByTestId('pro-tela')).toContainText('Sem mensalidade e sem anúncios');
    await expect(page.getByTestId('pro-recursos').locator('li')).toHaveCount(6);
    for (const r of ['Assinaturas ilimitadas', 'Lembrete antes da cobrança', 'Backup automático', 'Exportar planilha CSV', 'Gráficos por categoria', 'Temas']) {
      await expect(page.getByTestId('pro-recursos')).toContainText(r);
    }
    await expect(page.getByTestId('pro-btn-comprar')).toBeVisible();
  });

  test('US-11.CA1: acessível por Ajustes, pelo limite e por recurso bloqueado', async ({ page }) => {
    await abrirS2(page, { hash: '#/ajustes' });
    await page.getByTestId('plano-btn-pro').click();
    await expect(page).toHaveURL(/#\/pro$/);
    await page.goto('./#/ajustes');
    await page.getByTestId('lock-csv').getByTestId('lock-btn-pro').click();
    await expect(page.getByTestId('pro-tela')).toBeVisible();
  });

  test('US-11.CA2: o botão mostra o preço devolvido pelo provedor (padrão e outro valor)', async ({ page }) => {
    await abrirS2(page, { hash: '#/pro' });
    await expect(page.getByTestId('pro-btn-comprar')).toHaveText('Comprar Pro por R$ 19,99');
    await abrirS2(page, { hash: '#/pro', provedor: { preco: 'R$ 19,90' } });
    await expect(page.getByTestId('pro-btn-comprar')).toHaveText('Comprar Pro por R$ 19,90');
  });

  test('US-11.CA3: carregando o preço o botão fica desabilitado com "Carregando preço…"', async ({ page }) => {
    await abrirS2(page, { hash: '#/pro', provedor: { atrasoMs: 1500 } });
    await expect(page.getByTestId('pro-carregando')).toContainText('Carregando preço…');
    await expect(page.getByTestId('pro-btn-comprar')).toBeDisabled();
    await expect(page.getByTestId('pro-btn-comprar')).toHaveText('Comprar Pro por R$ 19,99', { timeout: 6000 });
  });

  test('US-11.CA3: falha ao consultar o preço mostra erro e "Tentar de novo" recupera', async ({ page }) => {
    await abrirS2(page, { hash: '#/pro', provedor: { detalhes: 'erro' } });
    await expect(page.getByTestId('pro-erro-preco')).toContainText('Não foi possível consultar o preço agora. Tente de novo.');
    await expect(page.getByTestId('pro-btn-comprar')).toBeDisabled();
    await configurarProvedor(page, { detalhes: 'ok' });
    await page.getByTestId('pro-btn-recarregar').click();
    await expect(page.getByTestId('pro-btn-comprar')).toBeEnabled();
    await expect(page.getByTestId('pro-btn-comprar')).toContainText('R$ 19,99');
  });

  test('US-11.CA3: loja sem o produto (preço null) também mostra o erro, nunca tela em branco', async ({ page }) => {
    await abrirS2(page, { hash: '#/pro', provedor: { preco: null } });
    await expect(page.getByTestId('pro-erro-preco')).toBeVisible();
    await expect(page.getByTestId('pro-recursos')).toBeVisible();
  });

  test('US-11.CA4: compra ok ativa o Pro sem recarregar, grava, tira o contador e libera os recursos', async ({ page }) => {
    await abrirS2(page, { assinaturas: ativas(5), hash: '#/pro' });
    await page.getByTestId('pro-btn-comprar').click();
    await expect(page.getByTestId('pro-ativo')).toBeVisible();
    await expect(page.getByTestId('pro-ativo')).toContainText('Você é Pro');
    await expect(page.getByTestId('pro-btn-comprar')).toHaveCount(0);
    expect(JSON.parse((await lerChave(page, 'mensalao:pro:v1'))!)).toMatchObject({ pro: true, sku: 'mensalao_pro' });
    await page.getByTestId('pro-btn-voltar-app').click();
    await expect(page.getByTestId('selo-pro')).toBeVisible();
    await expect(page.getByTestId('limite-contador')).toHaveCount(0);
    await page.getByTestId('nav-ajustes').click();
    await expect(page.getByTestId('lock-csv')).toHaveCount(0);
    await expect(page.getByTestId('btn-exportar-csv')).toBeVisible();
    await expect(page.getByTestId('lembrete-ativar')).toBeAttached();
    await expect(page.getByTestId('temas-lista')).toBeVisible();
  });

  test('US-11.CA5: compra cancelada não muda nada e mostra aviso discreto', async ({ page }) => {
    await abrirS2(page, { hash: '#/pro', provedor: { compra: 'cancelado' } });
    await page.getByTestId('pro-btn-comprar').click();
    await expect(page.getByTestId('pro-cancelada')).toHaveText('Compra cancelada. Você não foi cobrado.');
    await expect(page.getByTestId('pro-erro')).toHaveCount(0);
    await expect(page.getByTestId('pro-ativo')).toHaveCount(0);
    expect(await lerChave(page, 'mensalao:pro:v1')).toBeNull();
  });

  test('US-11.CA6: erro na compra mantém o grátis, não mexe nos dados e permite nova tentativa', async ({ page }) => {
    await abrirS2(page, { assinaturas: ativas(3), hash: '#/pro', provedor: { compra: 'erro' } });
    const antes = await lerChave(page, 'mensalao:v1');
    await page.getByTestId('pro-btn-comprar').click();
    await expect(page.getByTestId('pro-erro')).toContainText('Não foi possível concluir a compra. Tente novamente.');
    await expect(page.getByTestId('pro-btn-comprar')).toBeEnabled();
    expect(await lerChave(page, 'mensalao:v1')).toBe(antes);
    await configurarProvedor(page, { compra: 'ok' });
    await page.getByTestId('pro-btn-comprar').click();
    await expect(page.getByTestId('pro-ativo')).toBeVisible();
  });

  test('US-11.CA6: toques repetidos durante a compra não abrem duas compras', async ({ page }) => {
    await abrirS2(page, { hash: '#/pro', provedor: { atrasoMs: 1000 } });
    await expect(page.getByTestId('pro-btn-comprar')).toBeEnabled();
    const b = page.getByTestId('pro-btn-comprar');
    await b.click();
    await expect(b).toBeDisabled();
    await b.click({ force: true, noWaitAfter: true, trial: false }).catch(() => undefined);
    await page.getByTestId('pro-btn-comprar').dispatchEvent('click').catch(() => undefined);
    await expect(page.getByTestId('pro-ativo')).toBeVisible({ timeout: 8000 });
    const c = await page.evaluate(() => (window as any).__mensalaoTeste.provedor.chamadas());
    expect(c.comprar).toBe(1);
  });

  test('US-11.CA7: navegador comum mostra oferta e explicação, sem botão de comprar nem de Play', async ({ page }) => {
    await abrirS2(page, { hash: '#/pro', provedor: { disponivel: false } });
    await expect(page.getByTestId('pro-recursos')).toBeVisible();
    await expect(page.getByTestId('pro-indisponivel')).toContainText('A compra do Pro está disponível no app do Mensalão na Google Play');
    await expect(page.getByTestId('pro-indisponivel')).toContainText('Seus dados continuam funcionando normalmente aqui.');
    await expect(page.getByTestId('pro-btn-comprar')).toHaveCount(0);
    await expect(page.getByTestId('pro-btn-play')).toHaveCount(0);
    await expect(page.getByTestId('pro-btn-restaurar')).toBeDisabled();
  });

  test('US-11.CA8: já Pro mostra "Você é Pro", sem oferta nem botão de comprar', async ({ page }) => {
    await abrirS2(page, { hash: '#/pro', pro: true });
    await expect(page.getByTestId('pro-ativo')).toContainText('Você é Pro');
    await expect(page.getByTestId('pro-btn-comprar')).toHaveCount(0);
    await expect(page.getByTestId('pro-btn-restaurar')).toHaveCount(0);
    await expect(page.getByTestId('pro-tela')).not.toContainText('Pague uma vez');
  });

  test('US-11.CA9: sem conexão a tela avisa que é preciso conexão e o botão fica inativo', async ({ page, context }) => {
    await abrirS2(page, { hash: '#/pro' });
    await expect(page.getByTestId('pro-btn-comprar')).toBeEnabled();
    await context.setOffline(true);
    await expect(page.getByTestId('pro-offline')).toContainText('sem conexão');
    await expect(page.getByTestId('pro-btn-comprar')).toBeDisabled();
    await expect(page.getByTestId('pro-recursos')).toBeVisible();
  });

  test('US-11.CA9: a tela Pro abre a partir do cache, offline', async ({ page, context }) => {
    await abrirS2(page, { hash: '#/pro' });
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByTestId('pro-tela')).toBeVisible();
    await expect(page.getByTestId('pro-offline')).toBeVisible();
    await expect(page.getByTestId('pro-btn-comprar')).toBeDisabled();
  });

  test('US-11.CA10: 360 px sem rolagem horizontal, botão >= 44 px, foco visível por teclado, rótulos', async ({ page }) => {
    await abrirS2(page, { hash: '#/pro' });
    await semRolagemHorizontal(page);
    const btn = page.getByTestId('pro-btn-comprar');
    await expect(btn).toBeEnabled();
    const box = (await btn.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
    await btn.focus();
    const contorno = await btn.evaluate((el) => getComputedStyle(el).outlineStyle !== 'none' || getComputedStyle(el).boxShadow !== 'none');
    expect(contorno).toBe(true);
    await expect(page.getByTestId('pro-btn-restaurar')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mensalão Pro');
  });

  test('US-11.CA11: sem linguagem de pressão e deixa claro que o grátis continua', async ({ page }) => {
    await abrirS2(page, { hash: '#/pro' });
    const t = (await page.getByTestId('pro-tela').innerText()).toLowerCase();
    for (const proibido of ['oferta limitada', 'últimas', 'só hoje', 'corra', 'termina em', 'desconto']) expect(t).not.toContain(proibido);
    await expect(page.getByTestId('pro-nota-gratis')).toContainText('continua funcionando');
  });
});
