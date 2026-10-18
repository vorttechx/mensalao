import { expect, test } from '@playwright/test';
import { abrirS2, ativas, lerChave, sub } from './helpers2';

const PREFS_ON = (dias = 1) => ({ tema: 'verde-cedula', lembrete: { ativo: true, dias }, lembretesAvisados: [], backup: { ativo: true } });
const enviadas = (page: import('@playwright/test').Page) => page.evaluate(() => (window as any).__mensalaoTeste.notificacao.enviadas());

test.describe('US-13 Lembrete antes da cobrança (Pro)', () => {
  test('US-13.CA1: no grátis a seção aparece bloqueada e nenhum lembrete é gerado', async ({ page }) => {
    await abrirS2(page, { assinaturas: [sub({ proxima: '2026-10-01' })], prefs: PREFS_ON(), notificacao: { permissao: 'granted' }, hash: '#/ajustes' });
    await expect(page.getByTestId('lock-lembrete')).toBeVisible();
    await expect(page.getByTestId('lembrete-ativar')).toHaveCount(0);
    await page.getByTestId('nav-inicio').click();
    await expect(page.getByTestId('lembrete-aviso')).toHaveCount(0);
    expect(await enviadas(page)).toEqual([]);
  });

  test('US-13.CA2: no Pro há o interruptor e o campo de dias (padrão 1); valor inválido mostra erro e mantém o anterior', async ({ page }) => {
    await abrirS2(page, { pro: true, hash: '#/ajustes' });
    await expect(page.getByTestId('lembrete-ativar')).toBeAttached();
    await expect(page.getByTestId('lembrete-dias')).toHaveValue('1');
    for (const ruim of ['8', '-1', 'abc', '1,5', '']) {
      await page.getByTestId('lembrete-dias').fill(ruim);
      await page.getByTestId('lembrete-btn-salvar').click();
      await expect(page.getByTestId('error-lembrete-dias')).toBeVisible();
    }
    expect(JSON.parse((await lerChave(page, 'mensalao:prefs:v1')) ?? '{}').lembrete?.dias ?? 1).toBe(1);
    await page.getByTestId('lembrete-dias').fill('7');
    await page.getByTestId('lembrete-btn-salvar').click();
    await expect(page.getByTestId('lembrete-salvo')).toBeVisible();
    expect(JSON.parse((await lerChave(page, 'mensalao:prefs:v1'))!).lembrete.dias).toBe(7);
    await expect(page.getByTestId('lembrete-dias')).toHaveValue('7');
  });

  test('US-13.CA3: cobrança amanhã com 1 dia mostra "Amanhã: Netflix — R$ 44,90" no topo do Início', async ({ page }) => {
    await abrirS2(page, { pro: true, prefs: PREFS_ON(), assinaturas: [sub({ proxima: '2026-10-01' })] });
    await expect(page.getByTestId('lembrete-aviso')).toBeVisible();
    await expect(page.getByTestId('lembrete-item')).toHaveText('Amanhã: Netflix — R$ 44,90');
  });

  test('US-13.CA3: vários vencimentos viram lista ordenada por data e nome', async ({ page }) => {
    await abrirS2(page, {
      pro: true, prefs: PREFS_ON(3),
      assinaturas: [
        sub({ id: '1', nome: 'Spotify', proxima: '2026-10-01' }),
        sub({ id: '2', nome: 'Disney', proxima: '2026-10-01' }),
        sub({ id: '3', nome: 'Alura', proxima: '2026-10-02' }),
      ],
    });
    await expect(page.getByTestId('lembrete-item')).toHaveCount(3);
    const textos = await page.getByTestId('lembrete-item').allInnerTexts();
    expect(textos.map((t) => t.split(':')[1].split('—')[0].trim())).toEqual(['Disney', 'Spotify', 'Alura']);
  });

  test('US-13.CA4 / CA6: notifica uma só vez por par (título "Mensalão"); o aviso interno continua ao reabrir', async ({ page }) => {
    await abrirS2(page, { pro: true, prefs: PREFS_ON(), notificacao: { permissao: 'granted' }, assinaturas: [sub({ proxima: '2026-10-01' })] });
    await expect(page.getByTestId('lembrete-item')).toBeVisible();
    await expect.poll(async () => (await enviadas(page)).length).toBe(1);
    expect((await enviadas(page))[0]).toEqual({ titulo: 'Mensalão', corpo: 'Amanhã: Netflix — R$ 44,90' });
    await page.reload();
    await expect(page.getByTestId('lembrete-item')).toBeVisible();
    await page.waitForTimeout(500);
    expect(await enviadas(page)).toHaveLength(1);
  });

  test('US-13.CA5: ligar pela primeira vez explica e só então pede a permissão (concedida)', async ({ page }) => {
    await abrirS2(page, { pro: true, hash: '#/ajustes' });
    await page.getByTestId('lembrete-ativar').check({ force: true });
    await expect(page.getByTestId('lembrete-dialogo')).toBeVisible();
    expect(JSON.parse((await lerChave(page, 'mensalao:teste:notificacao')) ?? '{}').permissao ?? 'default').toBe('default');
    await page.getByTestId('lembrete-btn-continuar').click();
    await expect.poll(async () => JSON.parse((await lerChave(page, 'mensalao:teste:notificacao'))!).permissao).toBe('granted');
    expect(JSON.parse((await lerChave(page, 'mensalao:prefs:v1'))!).lembrete.ativo).toBe(true);
    await expect(page.getByTestId('lembrete-sem-permissao')).toHaveCount(0);
  });

  test('US-13.CA5: permissão negada mantém o lembrete só dentro do app, com o texto de aviso', async ({ page }) => {
    await abrirS2(page, { pro: true, notificacao: { resposta: 'denied' }, assinaturas: [sub({ proxima: '2026-10-01' })], hash: '#/ajustes' });
    await page.getByTestId('lembrete-ativar').check({ force: true });
    await page.getByTestId('lembrete-btn-continuar').click();
    await expect(page.getByTestId('lembrete-sem-permissao')).toHaveText('Notificações do sistema desativadas. Você verá os avisos ao abrir o app.');
    await page.getByTestId('nav-inicio').click();
    await expect(page.getByTestId('lembrete-item')).toBeVisible();
    expect(await enviadas(page)).toEqual([]);
  });

  test('US-13.CA5: "Voltar" no diálogo deixa o lembrete desligado e sem pedir permissão', async ({ page }) => {
    await abrirS2(page, { pro: true, hash: '#/ajustes' });
    await page.getByTestId('lembrete-ativar').check({ force: true });
    await page.getByTestId('lembrete-btn-voltar').click();
    await expect(page.getByTestId('lembrete-ativar')).not.toBeChecked();
    expect(JSON.parse((await lerChave(page, 'mensalao:teste:notificacao')) ?? '{}').permissao ?? 'default').toBe('default');
  });

  test('US-13.CA7: aparelho sem suporte mostra a mensagem e o aviso interno funciona', async ({ page }) => {
    await abrirS2(page, { pro: true, prefs: PREFS_ON(), notificacao: { suporte: false }, assinaturas: [sub({ proxima: '2026-10-01' })], hash: '#/ajustes' });
    await expect(page.getByTestId('lembrete-sem-suporte')).toContainText('Seu aparelho não permite notificações; usaremos o aviso dentro do app');
    await page.getByTestId('nav-inicio').click();
    await expect(page.getByTestId('lembrete-item')).toBeVisible();
  });

  test('US-13.CA8: pausadas, canceladas e em teste não geram cobrança; o fim do teste é avisado', async ({ page }) => {
    await abrirS2(page, {
      pro: true, prefs: PREFS_ON(),
      assinaturas: [
        sub({ id: '1', nome: 'Pausada', proxima: '2026-10-01', status: 'pausada' }),
        sub({ id: '2', nome: 'Cancelada', proxima: '2026-10-01', status: 'cancelada', canceladaEm: '2026-09-10' }),
        sub({ id: '3', nome: 'Max', proxima: '2026-10-01', emTeste: true, fimTeste: '2026-10-01' }),
      ],
    });
    await expect(page.getByTestId('lembrete-item')).toHaveCount(1);
    await expect(page.getByTestId('lembrete-item')).toHaveText('Teste grátis de Max termina amanhã');
  });

  test('US-13.CA9: data de cobrança no passado é avançada antes de montar os lembretes', async ({ page }) => {
    await abrirS2(page, { pro: true, prefs: PREFS_ON(), assinaturas: [sub({ proxima: '2026-09-01', diaRef: 1 })] });
    await expect(page.getByTestId('lembrete-item')).toHaveText('Amanhã: Netflix — R$ 44,90');
    const e = JSON.parse((await lerChave(page, 'mensalao:v1'))!);
    expect(e.assinaturas[0].proxima >= '2026-09-30').toBe(true);
  });

  test('US-13.CA10: 0 dias é do dia ("Hoje: Spotify — R$ 21,90") e não mostra amanhã', async ({ page }) => {
    await abrirS2(page, {
      pro: true, prefs: PREFS_ON(0),
      assinaturas: [sub({ id: '1', nome: 'Spotify', valorCentavos: 2190, proxima: '2026-09-30' }), sub({ id: '2', nome: 'Amanha', proxima: '2026-10-01' })],
    });
    await expect(page.getByTestId('lembrete-item')).toHaveCount(1);
    await expect(page.getByTestId('lembrete-item')).toHaveText('Hoje: Spotify — R$ 21,90');
  });

  test('US-13.CA11: centavos exatos (R$ 9,99)', async ({ page }) => {
    await abrirS2(page, { pro: true, prefs: PREFS_ON(), assinaturas: [sub({ valorCentavos: 999, proxima: '2026-10-01' })] });
    await expect(page.getByTestId('lembrete-item')).toHaveText('Amanhã: Netflix — R$ 9,99');
  });

  test('US-13.CA12: lista vazia ou nada na janela não mostra aviso nem erro', async ({ page }) => {
    await abrirS2(page, { pro: true, prefs: PREFS_ON() });
    await expect(page.getByTestId('lembrete-aviso')).toHaveCount(0);
    await abrirS2(page, { pro: true, prefs: PREFS_ON(), assinaturas: ativas(2, { proxima: '2026-12-01' }) });
    await expect(page.getByTestId('upcoming-list')).toBeVisible();
    await expect(page.getByTestId('lembrete-aviso')).toHaveCount(0);
  });

  test('US-13.CA13: Pro revogado para os lembretes e mantém as configurações', async ({ page }) => {
    await abrirS2(page, {
      proBruto: JSON.stringify({ pro: true, sku: 'mensalao_pro', verificadoEm: 'x' }), provedor: { compras: [] },
      prefs: PREFS_ON(2), notificacao: { permissao: 'granted' }, assinaturas: [sub({ proxima: '2026-10-01' })],
    });
    await expect(page.getByTestId('pro-revogado-aviso')).toBeVisible();
    await expect(page.getByTestId('lembrete-aviso')).toHaveCount(0);
    expect(await enviadas(page)).toEqual([]);
    expect(JSON.parse((await lerChave(page, 'mensalao:prefs:v1'))!).lembrete).toEqual({ ativo: true, dias: 2 });
  });

  test('US-13.CA14: o texto da limitação aparece nas configurações e no aviso', async ({ page }) => {
    const frase = 'Com o app fechado, o aviso depende do seu aparelho e pode atrasar. Abra o app para ver tudo.';
    await abrirS2(page, { pro: true, prefs: PREFS_ON(), assinaturas: [sub({ proxima: '2026-10-01' })] });
    await expect(page.getByTestId('lembrete-limite-texto')).toContainText(frase);
    await page.goto('./#/ajustes');
    await expect(page.getByTestId('lembrete-limite-texto')).toContainText(frase);
  });
});
