import { expect, test } from '@playwright/test';
import { cadastroLivre, lerEstado, preencher } from './helpers';
import { abrirS2, ativas, backupArquivo, sub } from './helpers2';

test.describe('US-09 Limite de 5 ativas no plano grátis', () => {
  test('US-09.CA1: 4 ativas mostram "4 de 5 assinaturas ativas" e a quinta é cadastrada normalmente', async ({ page }) => {
    await abrirS2(page, { assinaturas: ativas(4) });
    await expect(page.getByTestId('limite-contador')).toHaveText('4 de 5 assinaturas ativas');
    await page.getByTestId('nav-assinaturas').click();
    await expect(page.getByTestId('limite-contador')).toHaveText('4 de 5 assinaturas ativas');
    await page.getByTestId('btn-adicionar').click();
    await expect(page).toHaveURL(/#\/nova$/);
    await expect(page.getByTestId('limite-aviso')).toHaveCount(0);
    await cadastroLivre(page);
    await preencher(page, { nome: 'Quinta', valor: '10,00', ciclo: 'mensal', proxima: '10/10/2026', pagamento: 'cartao', categoria: 'Outros' });
    await page.getByTestId('btn-salvar').click();
    await expect.poll(async () => (await lerEstado(page)).assinaturas.length).toBe(5);
    await page.goto('./#/');
    await expect(page.getByTestId('limite-contador')).toHaveText('5 de 5 assinaturas ativas');
  });

  test('US-09.CA2 / CA11: com 5 ativas, "Adicionar" mostra o aviso (alertdialog) e "Conhecer o Pro" leva à tela Pro', async ({ page }) => {
    await abrirS2(page, { assinaturas: ativas(5) });
    await page.getByTestId('btn-adicionar').click();
    const aviso = page.getByTestId('limite-aviso');
    await expect(aviso).toBeVisible();
    await expect(aviso).toHaveAttribute('role', 'alertdialog');
    await expect(aviso).toContainText('Você chegou ao limite de 5 assinaturas ativas do plano grátis');
    await expect(page).not.toHaveURL(/#\/(nova|pro)/);
    await expect(page.getByTestId('form-assinatura')).toHaveCount(0);
    await page.getByTestId('limite-btn-pro').click();
    await expect(page).toHaveURL(/#\/pro$/);
    await expect(page.getByTestId('pro-tela')).toBeVisible();
  });

  test('US-09.CA2: "Agora não" fecha o aviso e fica na mesma tela', async ({ page }) => {
    await abrirS2(page, { assinaturas: ativas(5) });
    await page.getByTestId('btn-adicionar').click();
    await page.getByTestId('limite-btn-agora-nao').click();
    await expect(page.getByTestId('limite-aviso')).toHaveCount(0);
    await expect(page).not.toHaveURL(/#\/(nova|pro)/);
  });

  test('US-09.CA2: catálogo e formulário livre abertos por URL com 5 ativas mostram o aviso', async ({ page }) => {
    for (const hash of ['#/nova', '#/nova/form']) {
      await abrirS2(page, { assinaturas: ativas(5), hash });
      await expect(page.getByTestId('limite-aviso')).toBeVisible();
    }
  });

  test('US-09.CA2 / CA6: botão do estado vazio das telas não existe com 5 ativas; nada é gravado ao ser bloqueado', async ({ page }) => {
    await abrirS2(page, { assinaturas: ativas(5) });
    const antes = await lerEstado(page);
    await page.getByTestId('btn-adicionar').click();
    await page.getByTestId('limite-btn-agora-nao').click();
    expect(await lerEstado(page)).toEqual(antes);
  });

  test('US-09.CA2: no grátis com lista vazia o "Adicionar" do estado vazio abre o cadastro (0 ativas, sem bloqueio)', async ({ page }) => {
    await abrirS2(page);
    await page.getByTestId('btn-adicionar-vazio').click();
    await expect(page).toHaveURL(/#\/nova$/);
  });

  test('US-09.CA3: pausar uma libera 1 vaga; pausadas e canceladas não contam', async ({ page }) => {
    const l = [...ativas(5), sub({ id: 'c', nome: 'Canc', status: 'cancelada', canceladaEm: '2026-09-10' })];
    await abrirS2(page, { assinaturas: l, hash: '#/assinatura/a0' });
    await page.getByTestId('btn-pausar').click();
    await page.goto('./#/');
    await expect(page.getByTestId('limite-contador')).toHaveText('4 de 5 assinaturas ativas');
    await page.getByTestId('btn-adicionar').click();
    await expect(page).toHaveURL(/#\/nova$/);
  });

  test('US-09.CA4: com 5 ativas, reativar a pausada é bloqueado e ela continua pausada', async ({ page }) => {
    await abrirS2(page, { assinaturas: [...ativas(5), sub({ id: 'p', nome: 'Pausada', status: 'pausada' })], hash: '#/assinatura/p' });
    await page.getByTestId('btn-reativar').click();
    await expect(page.getByTestId('limite-aviso')).toBeVisible();
    await page.getByTestId('limite-btn-agora-nao').click();
    expect((await lerEstado(page)).assinaturas.find((a: any) => a.id === 'p').status).toBe('pausada');
  });

  test('US-09.CA4: com 4 ativas, reativar funciona e o contador vira "5 de 5"', async ({ page }) => {
    await abrirS2(page, { assinaturas: [...ativas(4), sub({ id: 'p', nome: 'Pausada', status: 'pausada' })], hash: '#/assinatura/p' });
    await page.getByTestId('btn-reativar').click();
    await expect(page.getByTestId('limite-aviso')).toHaveCount(0);
    await page.goto('./#/');
    await expect(page.getByTestId('limite-contador')).toHaveText('5 de 5 assinaturas ativas');
  });

  test('US-09.CA5: com 5 ativas, editar, pausar, cancelar e excluir nunca são bloqueados', async ({ page }) => {
    await abrirS2(page, { assinaturas: ativas(5), hash: '#/assinatura/a1/editar' });
    await expect(page.getByTestId('form-assinatura')).toBeVisible();
    await page.getByTestId('field-nome').fill('Editada');
    await page.getByTestId('btn-salvar').click();
    await expect(page.getByTestId('limite-aviso')).toHaveCount(0);
    expect((await lerEstado(page)).assinaturas.find((a: any) => a.id === 'a1').nome).toBe('Editada');
    const status = async (id: string) => (await lerEstado(page)).assinaturas.find((x: any) => x.id === id)?.status;
    await page.goto('./#/assinatura/a2');
    await page.getByTestId('btn-pausar').click();
    await expect.poll(() => status('a2')).toBe('pausada');
    await page.goto('./#/assinatura/a3');
    await page.getByTestId('btn-cancelar').click();
    await expect.poll(() => status('a3')).toBe('cancelada');
    await page.goto('./#/assinatura/a4');
    await page.getByTestId('btn-excluir').click();
    await page.getByTestId('btn-confirmar').click();
    await expect.poll(async () => (await lerEstado(page)).assinaturas.length).toBe(4);
    const e = await lerEstado(page);
    expect(e.assinaturas).toHaveLength(4);
    expect(e.assinaturas.find((a: any) => a.id === 'a2').status).toBe('pausada');
    expect(e.assinaturas.find((a: any) => a.id === 'a3').status).toBe('cancelada');
  });

  test('US-09.CA7: no Pro não há contador nem bloqueio, e dá para ter 12 ativas', async ({ page }) => {
    await abrirS2(page, { assinaturas: ativas(12), pro: true });
    await expect(page.getByTestId('selo-pro')).toBeVisible();
    await expect(page.getByTestId('limite-contador')).toHaveCount(0);
    await page.getByTestId('btn-adicionar').click();
    await expect(page).toHaveURL(/#\/nova$/);
    await expect(page.getByTestId('limite-aviso')).toHaveCount(0);
    await cadastroLivre(page);
    await preencher(page, { nome: 'Decima terceira', valor: '1,00', ciclo: 'mensal', proxima: '10/10/2026', pagamento: 'cartao', categoria: 'Outros' });
    await page.getByTestId('btn-salvar').click();
    await expect.poll(async () => (await lerEstado(page)).assinaturas.length).toBe(13);
  });

  test('US-09.CA8: teste grátis conta como ativa no limite', async ({ page }) => {
    await abrirS2(page, { assinaturas: ativas(5, { emTeste: true, fimTeste: '2026-10-10' }) });
    await expect(page.getByTestId('limite-contador')).toHaveText('5 de 5 assinaturas ativas');
  });

  test('US-09.CA9: lista vazia mostra "0 de 5" e o estado vazio da sprint 1', async ({ page }) => {
    await abrirS2(page);
    await expect(page.getByTestId('limite-contador')).toHaveText('0 de 5 assinaturas ativas');
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('US-09.CA12: importar backup com 12 ativas traz todas, avisa na confirmação e bloqueia só adicionar/reativar', async ({ page }) => {
    await abrirS2(page, { assinaturas: ativas(2), hash: '#/ajustes' });
    await page.getByTestId('input-importar').setInputFiles(backupArquivo(ativas(12)));
    await expect(page.getByTestId('confirm-dialog')).toBeVisible();
    await expect(page.getByTestId('import-aviso-limite')).toContainText('12 assinaturas ativas');
    await page.getByTestId('btn-confirmar').click();
    await expect(page.getByTestId('import-ok')).toBeVisible();
    const e = await lerEstado(page);
    expect(e.assinaturas).toHaveLength(12);
    expect(e.assinaturas.every((a: any) => a.status === 'ativa')).toBe(true);
    await page.getByTestId('nav-inicio').click();
    await expect(page.getByTestId('limite-contador')).toHaveText('12 de 5 assinaturas ativas — acima do limite do plano grátis');
    await page.getByTestId('btn-adicionar').click();
    await expect(page.getByTestId('limite-aviso')).toBeVisible();
    await page.getByTestId('limite-btn-agora-nao').click();
    // Pausar continua liberado e as próximas cobranças/totais contam todas.
    await page.goto('./#/assinatura/a0');
    await page.getByTestId('btn-pausar').click();
    await page.goto('./#/totais');
    await expect(page.getByTestId('total-quantidade')).toContainText('11');
  });

  test('US-09.CA12: importar backup com exatamente 5 ativas também avisa', async ({ page }) => {
    await abrirS2(page, { hash: '#/ajustes' });
    await page.getByTestId('input-importar').setInputFiles(backupArquivo(ativas(5)));
    await expect(page.getByTestId('import-aviso-limite')).toContainText('5');
  });

  test('US-09.CA13: Pro revogado com 20 ativas: nada é apagado, contador "acima do limite" e só adicionar bloqueia', async ({ page }) => {
    await abrirS2(page, { assinaturas: ativas(20), proBruto: JSON.stringify({ pro: true, sku: 'mensalao_pro', verificadoEm: 'x' }), provedor: { compras: [] } });
    await expect(page.getByTestId('pro-revogado-aviso')).toBeVisible();
    await expect(page.getByTestId('limite-contador')).toHaveText('20 de 5 assinaturas ativas — acima do limite do plano grátis');
    expect((await lerEstado(page)).assinaturas).toHaveLength(20);
    await page.getByTestId('btn-adicionar').click();
    await expect(page.getByTestId('limite-aviso')).toBeVisible();
  });

  test('US-09 (observação do orquestrador): mudar a rota por hash com o diálogo de limite aberto não deve deixar o diálogo sobre a nova tela', async ({ page }) => {
    await abrirS2(page, { assinaturas: ativas(5) });
    await page.getByTestId('btn-adicionar').click();
    await expect(page.getByTestId('limite-aviso')).toBeVisible();
    await page.evaluate(() => { location.hash = '#/pro'; });
    await expect(page.getByTestId('pro-tela')).toBeAttached();
    await expect(page.getByTestId('limite-aviso')).toHaveCount(0);
  });
});
