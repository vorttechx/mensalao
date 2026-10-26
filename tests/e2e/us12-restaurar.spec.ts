import { expect, test } from '@playwright/test';
import { abrirS2, ativas, backupArquivo, configurarProvedor, lerChave, sub } from './helpers2';

const PRO_JSON = JSON.stringify({ pro: true, sku: 'mensalao_pro', verificadoEm: '2026-09-01T00:00:00.000Z' });

test.describe('US-12 Restaurar compra e estado Pro persistido', () => {
  test('US-12.CA1: Pro continua após fechar e reabrir, inclusive com a loja sem resposta (offline)', async ({ page }) => {
    await abrirS2(page, { pro: true });
    await expect(page.getByTestId('selo-pro')).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('selo-pro')).toBeVisible();
    await configurarProvedor(page, { offline: true });
    await page.reload();
    await expect(page.getByTestId('selo-pro')).toBeVisible();
  });

  test('US-12.CA2: restaurar com a compra na conta ativa o Pro e diz "Compra restaurada. Obrigado!"', async ({ page }) => {
    await abrirS2(page, { hash: '#/pro' });
    await expect(page.getByTestId('pro-btn-restaurar')).toBeEnabled();
    await configurarProvedor(page, { compras: ['mensalao_pro'] });
    await page.getByTestId('pro-btn-restaurar').click();
    await expect(page.getByTestId('pro-restaurar-msg')).toHaveText('Compra restaurada. Obrigado!');
    await expect(page.getByTestId('pro-ativo')).toBeVisible();
    expect(JSON.parse((await lerChave(page, 'mensalao:pro:v1'))!).pro).toBe(true);
  });

  test('US-12.CA3: restaurar sem compra mostra a mensagem e segue grátis', async ({ page }) => {
    await abrirS2(page, { hash: '#/pro' });
    await page.getByTestId('pro-btn-restaurar').click();
    await expect(page.getByTestId('pro-restaurar-msg')).toHaveText('Não encontramos compra do Pro nesta conta da Google Play');
    await expect(page.getByTestId('pro-ativo')).toHaveCount(0);
    await expect(page.getByTestId('pro-btn-comprar')).toBeVisible();
  });

  test('US-12.CA4: restaurar com erro da loja ou offline mostra mensagem e nada muda', async ({ page }) => {
    await abrirS2(page, { hash: '#/pro' });
    await configurarProvedor(page, { listar: 'erro' });
    await page.getByTestId('pro-btn-restaurar').click();
    await expect(page.getByTestId('pro-restaurar-msg')).toHaveText('Não foi possível verificar agora. Tente de novo mais tarde.');
    await expect(page.getByTestId('pro-ativo')).toHaveCount(0);
    await configurarProvedor(page, { listar: 'ok', offline: true });
    await page.getByTestId('pro-btn-restaurar').click();
    await expect(page.getByTestId('pro-restaurar-msg')).toContainText('Não foi possível verificar agora');
    await expect(page.getByTestId('pro-btn-restaurar')).toBeEnabled();
  });

  test('US-12.CA5: reinstalação (armazenamento limpo, compra na conta) ativa o Pro sozinho ao abrir', async ({ page }) => {
    await abrirS2(page, { provedor: { compras: ['mensalao_pro'] } });
    await expect(page.getByTestId('selo-pro')).toBeVisible();
    await page.goto('./#/pro');
    await expect(page.getByTestId('pro-ativo')).toBeVisible();
  });

  test('US-12.CA5: sem Pro, o botão "Restaurar compra" continua disponível', async ({ page }) => {
    await abrirS2(page, { hash: '#/pro' });
    await expect(page.getByTestId('pro-btn-restaurar')).toBeEnabled();
  });

  test('US-12.CA6 (texto novo: US-26.CA4): reembolso (loja sem a compra) revoga o Pro, avisa uma vez e preserva os dados', async ({ page }) => {
    await abrirS2(page, { assinaturas: ativas(8), proBruto: PRO_JSON, provedor: { compras: [] } });
    await expect(page.getByTestId('pro-revogado-aviso')).toContainText('Seu Mensalão Pro não foi encontrado na Google Play. Você voltou ao plano grátis e os anúncios voltam. Seus dados continuam todos aqui.');
    await expect(page.getByTestId('selo-pro')).toHaveCount(0);
    await expect(page.getByTestId('limite-contador')).toContainText('8 de 5');
    expect(JSON.parse((await lerChave(page, 'mensalao:v1'))!).assinaturas).toHaveLength(8);
    expect(JSON.parse((await lerChave(page, 'mensalao:pro:v1'))!).pro).toBe(false);
    await page.reload();
    await expect(page.getByTestId('pro-revogado-aviso')).toHaveCount(0);
  });

  test('US-12.CA7: Pro com erro/timeout da loja continua Pro, sem aviso', async ({ page }) => {
    await abrirS2(page, { pro: true, provedor: { listar: 'erro' } });
    await expect(page.getByTestId('selo-pro')).toBeVisible();
    await expect(page.getByTestId('pro-revogado-aviso')).toHaveCount(0);
    expect(JSON.parse((await lerChave(page, 'mensalao:pro:v1'))!).pro).toBe(true);
  });

  test('US-12.CA7: Pro offline continua Pro, sem aviso', async ({ page }) => {
    await abrirS2(page, { pro: true, provedor: { offline: true } });
    await expect(page.getByTestId('selo-pro')).toBeVisible();
    await expect(page.getByTestId('pro-revogado-aviso')).toHaveCount(0);
  });

  test('US-12.CA8: importar backup, excluir e limpar assinaturas não mudam o Pro', async ({ page }) => {
    await abrirS2(page, { pro: true, assinaturas: [sub()], hash: '#/ajustes' });
    await page.getByTestId('input-importar').setInputFiles(backupArquivo(ativas(2)));
    await page.getByTestId('btn-confirmar').click();
    await expect(page.getByTestId('import-ok')).toBeVisible();
    await page.goto('./#/assinatura/a0');
    await page.getByTestId('btn-excluir').click();
    await page.getByTestId('btn-confirmar').click();
    await expect.poll(async () => JSON.parse((await lerChave(page, 'mensalao:v1')) ?? '{"assinaturas":[]}').assinaturas.length).toBe(1);
    await page.getByTestId('nav-ajustes').click();
    await page.getByTestId('input-importar').setInputFiles(backupArquivo([]));
    await page.getByTestId('btn-confirmar').click();
    await page.getByTestId('nav-inicio').click();
    await expect(page.getByTestId('selo-pro')).toBeVisible();
    expect(JSON.parse((await lerChave(page, 'mensalao:pro:v1'))!).pro).toBe(true);
  });

  test('US-12.CA9: a primeira tela não espera a loja e a verificação roda uma vez por abertura', async ({ page }) => {
    await abrirS2(page, { assinaturas: [sub()], provedor: { atrasoMs: 3000 } });
    await expect(page.getByTestId('upcoming-item')).toBeVisible({ timeout: 1500 });
    await page.evaluate(() => localStorage.removeItem('mensalao:teste:provedor-chamadas'));
    await page.reload();
    await page.waitForTimeout(4500);
    await page.getByTestId('nav-ajustes').click();
    await page.getByTestId('nav-inicio').click();
    const c = await page.evaluate(() => (window as any).__mensalaoTeste.provedor.chamadas());
    expect(c.listarCompras).toBe(1);
    expect(c.disponivel).toBe(1);
  });

  test('US-12.CA10: navegador comum nunca honra o Pro em cache e o restaurar fica desabilitado', async ({ page }) => {
    await abrirS2(page, { proBruto: PRO_JSON, provedor: { disponivel: false }, hash: '#/pro' });
    await expect(page.getByTestId('selo-pro')).toHaveCount(0);
    await expect(page.getByTestId('pro-ativo')).toHaveCount(0);
    await expect(page.getByTestId('pro-indisponivel')).toBeVisible();
    await expect(page.getByTestId('pro-btn-restaurar')).toBeDisabled();
  });

  test('US-12.CA11: mensalao:pro:v1 com tipos errados ou ilegível = grátis, sem travar e sem mexer nos dados', async ({ page }) => {
    for (const bruto of ['{"pro":"sim","sku":"mensalao_pro"}', '{"pro":1}', '{quebrado', '[]']) {
      await abrirS2(page, { assinaturas: ativas(6), proBruto: bruto, provedor: { disponivel: true, offline: true } });
      await expect(page.getByTestId('upcoming-list')).toBeVisible();
      await expect(page.getByTestId('selo-pro')).toHaveCount(0);
      expect(JSON.parse((await lerChave(page, 'mensalao:v1'))!).assinaturas).toHaveLength(6);
    }
  });

  test('US-12.CA12: campos de Pro dentro de um backup são ignorados; importar nunca concede nem remove o Pro', async ({ page }) => {
    await abrirS2(page, { hash: '#/ajustes' });
    await page.getByTestId('input-importar').setInputFiles(backupArquivo(ativas(1), { pro: true, compra: 'mensalao_pro', token: 'abc', sku: 'mensalao_pro' }));
    await page.getByTestId('btn-confirmar').click();
    await expect(page.getByTestId('import-ok')).toBeVisible();
    await expect(page.getByTestId('selo-pro')).toHaveCount(0);
    expect(await lerChave(page, 'mensalao:pro:v1')).toBeNull();
    // Pro continua Pro após importar.
    await abrirS2(page, { pro: true, hash: '#/ajustes' });
    await page.getByTestId('input-importar').setInputFiles(backupArquivo(ativas(1), { pro: false }));
    await page.getByTestId('btn-confirmar').click();
    await expect(page.getByTestId('import-ok')).toBeVisible();
    await page.getByTestId('nav-inicio').click();
    await expect(page.getByTestId('selo-pro')).toBeVisible();
  });

  test('US-12.CA13: revogado volta ao tema padrão sem apagar as preferências; ao voltar o Pro, reaplica', async ({ page }) => {
    const prefs = { tema: 'azul-noite', lembrete: { ativo: true, dias: 3 }, lembretesAvisados: [], backup: { ativo: true } };
    await abrirS2(page, { assinaturas: [sub()], prefs, proBruto: PRO_JSON, provedor: { compras: [] } });
    await expect(page.getByTestId('pro-revogado-aviso')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.dataset.tema)).toBeUndefined();
    expect(JSON.parse((await lerChave(page, 'mensalao:prefs:v1'))!)).toMatchObject({ tema: 'azul-noite', lembrete: { ativo: true, dias: 3 } });
    await configurarProvedor(page, { compras: ['mensalao_pro'] });
    await page.reload();
    await expect(page.getByTestId('selo-pro')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.dataset.tema)).toBe('azul-noite');
  });

  test('US-12.CA16: o build de teste usa o provedor falso e expõe os controles', async ({ page }) => {
    await abrirS2(page);
    const t = await page.evaluate(() => ({ id: (window as any).__mensalaoTeste?.id, tipo: typeof (window as any).__mensalaoTeste?.provedor?.configurar }));
    expect(t).toEqual({ id: 'provedor-falso-mensalao', tipo: 'function' });
  });
});
