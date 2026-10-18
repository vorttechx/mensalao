import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { abrirS2, ativas, lerChave, sub } from './helpers2';

const estadoJson = (n: number, nome = 'Copia') => JSON.stringify({ versao: 1, config: { diasAviso: 3 }, assinaturas: ativas(n).map((a, i) => ({ ...a, nome: `${nome} ${i}` })) });
const copia = (id: string, criadaEm: string, n: number, extra: Record<string, unknown> = {}) => ({ id, criadaEm, quantidade: n, conteudo: estadoJson(n), inutilizavel: false, ...extra });
const copiasSalvas = async (page: import('@playwright/test').Page) => JSON.parse((await lerChave(page, 'mensalao:copias:v1')) ?? '[]');

test.describe('US-14 Backup automático local (Pro)', () => {
  test('US-14.CA1: no grátis o backup automático está bloqueado e a exportação manual continua', async ({ page }) => {
    await abrirS2(page, { assinaturas: [sub()], hash: '#/ajustes' });
    await expect(page.getByTestId('lock-backup')).toBeVisible();
    await expect(page.getByTestId('btn-exportar')).toBeEnabled();
    expect(await lerChave(page, 'mensalao:copias:v1')).toBeNull();
  });

  test('US-14.CA2 / CA4: no Pro, ao abrir com dados, cria uma cópia com data/hora e quantidade na lista', async ({ page }) => {
    await abrirS2(page, { pro: true, assinaturas: ativas(3) });
    await expect.poll(async () => (await copiasSalvas(page)).length).toBe(1);
    await page.getByTestId('nav-ajustes').click();
    await expect(page.getByTestId('copia-item')).toHaveCount(1);
    await expect(page.getByTestId('copia-item')).toContainText('30/09/2026 12:00');
    await expect(page.getByTestId('copia-item')).toContainText('3 assinaturas');
    await expect(page.getByTestId('copia-restaurar')).toBeVisible();
  });

  test('US-14.CA2 / CA4 (abertura direta em Ajustes): a lista mostra a cópia criada ao abrir, sem precisar trocar de tela', async ({ page }) => {
    await abrirS2(page, { pro: true, assinaturas: ativas(3), hash: '#/ajustes' });
    await expect.poll(async () => (await copiasSalvas(page)).length).toBe(1);
    await expect(page.getByTestId('copia-item')).toHaveCount(1);
    await expect(page.getByTestId('copias-vazia')).toHaveCount(0);
  });

  test('US-14.CA3: sem mudança, reabrir não cria outra cópia, mesmo em outro dia', async ({ page }) => {
    await abrirS2(page, { pro: true, assinaturas: ativas(2) });
    await expect.poll(async () => (await copiasSalvas(page)).length).toBe(1);
    await page.clock.setFixedTime('2026-10-02T09:00:00-03:00');
    await page.reload();
    await page.waitForTimeout(400);
    expect(await copiasSalvas(page)).toHaveLength(1);
  });

  test('US-14.CA2: no máximo uma por dia (mudou no mesmo dia: continua 1); em outro dia com mudança cria; mantém só 3', async ({ page }) => {
    await abrirS2(page, { pro: true, assinaturas: ativas(2) });
    await expect.poll(async () => (await copiasSalvas(page)).length).toBe(1);
    await page.goto('./#/assinatura/a0');
    await page.getByTestId('btn-pausar').click();
    await page.waitForTimeout(400);
    expect(await copiasSalvas(page)).toHaveLength(1);
    for (const [i, dia] of ['2026-10-01', '2026-10-02', '2026-10-03'].entries()) {
      await page.clock.setFixedTime(`${dia}T09:00:00-03:00`);
      await page.reload();
      await page.goto('./#/assinatura/a1');
      await page.getByTestId(i % 2 === 0 ? 'btn-pausar' : 'btn-reativar').click();
      await page.waitForTimeout(300);
    }
    const l = await copiasSalvas(page);
    expect(l).toHaveLength(3);
    expect(l[0].criadaEm.startsWith('2026-10-03')).toBe(true);
    expect(l.some((c: any) => c.criadaEm.startsWith('2026-09-30'))).toBe(false);
  });

  test('US-14.CA9: lista vazia não cria cópia nem lembrete de exportar', async ({ page }) => {
    await abrirS2(page, { pro: true, prefs: { backup: { ativo: true, inicioPro: '2026-08-01' } } });
    await expect(page.getByTestId('empty-state')).toBeVisible();
    expect(await lerChave(page, 'mensalao:copias:v1')).toBeNull();
    await expect(page.getByTestId('backup-lembrete')).toHaveCount(0);
  });

  test('US-14.CA2: com o backup automático desligado nada é criado', async ({ page }) => {
    await abrirS2(page, { pro: true, assinaturas: ativas(2), prefs: { backup: { ativo: false } }, hash: '#/ajustes' });
    await expect(page.getByTestId('backup-ativar')).not.toBeChecked();
    await page.waitForTimeout(400);
    expect(await lerChave(page, 'mensalao:copias:v1')).toBeNull();
  });

  test('US-14.CA5: restaurar pede confirmação, guarda a cópia do estado atual antes e atualiza as telas; cancelar não altera', async ({ page }) => {
    await abrirS2(page, { pro: true, assinaturas: ativas(4), copias: [copia('c1', '2026-09-20T08:00', 2)], hash: '#/ajustes' });
    await page.getByTestId('copia-restaurar').first().click();
    await expect(page.getByTestId('confirm-dialog')).toContainText('Substituir os dados atuais por esta cópia (2 assinaturas)?');
    await page.getByTestId('btn-dialogo-voltar').click();
    expect(JSON.parse((await lerChave(page, 'mensalao:v1'))!).assinaturas).toHaveLength(4);
    await page.getByTestId('copia-restaurar').last().click();
    await page.getByTestId('btn-confirmar').click();
    await expect(page.getByTestId('copia-restaurada')).toBeVisible();
    const e = JSON.parse((await lerChave(page, 'mensalao:v1'))!);
    expect(e.assinaturas).toHaveLength(2);
    expect(e.assinaturas[0].nome).toBe('Copia 0');
    const l = await copiasSalvas(page);
    expect(l.some((c: any) => c.quantidade === 4)).toBe(true);
    await page.getByTestId('nav-assinaturas').click();
    await expect(page.getByTestId('sub-item').first()).toContainText('Copia 0');
  });

  test('US-14.CA6: cópia corrompida: erro claro, dados intactos e cópia marcada como inutilizável (não descartada)', async ({ page }) => {
    await abrirS2(page, { pro: true, assinaturas: ativas(2), copias: [copia('ruim', '2026-09-20T08:00', 3, { conteudo: '{quebrado' })], hash: '#/ajustes' });
    const antes = await lerChave(page, 'mensalao:v1');
    await page.getByTestId('copia-restaurar').last().click();
    await expect(page.getByTestId('copia-erro')).toBeVisible();
    expect(await lerChave(page, 'mensalao:v1')).toBe(antes);
    await expect(page.getByTestId('copia-inutilizavel')).toBeVisible();
    await expect(page.getByTestId('badge-danificada')).toContainText('Danificada');
  });

  test('US-14.CA7: sem espaço para a cópia o app não trava, preserva os dados e avisa', async ({ page }) => {
    await abrirS2(page, { pro: true, assinaturas: ativas(2) });
    await expect.poll(async () => (await copiasSalvas(page)).length).toBe(1);
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k: string, v: string) {
        if (k === 'mensalao:copias:v1') throw new DOMException('cota', 'QuotaExceededError');
        return original.call(this, k, v);
      };
    });
    await page.clock.setFixedTime('2026-10-05T09:00:00-03:00');
    await page.goto('./#/assinatura/a0');
    await page.getByTestId('btn-pausar').click();
    await expect(page.getByTestId('backup-erro-espaco')).toContainText('Não foi possível criar a cópia automática (sem espaço)');
    expect(JSON.parse((await lerChave(page, 'mensalao:v1'))!).assinaturas.find((a: any) => a.id === 'a0').status).toBe('pausada');
  });

  test('US-14.CA8: com 7 dias sem exportar mostra o lembrete; "Exportar agora" baixa o arquivo e zera a contagem', async ({ page }) => {
    await abrirS2(page, { pro: true, assinaturas: [sub()], prefs: { backup: { ativo: true, ultimaExportacao: '2026-09-20' } } });
    await expect(page.getByTestId('backup-lembrete')).toContainText('Faz 10 dias que você não exporta um arquivo de backup');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('backup-btn-exportar').click()]);
    expect(dl.suggestedFilename()).toBe('mensalao-backup-2026-09-30.json');
    await expect(page.getByTestId('backup-lembrete')).toHaveCount(0);
    expect(JSON.parse((await lerChave(page, 'mensalao:prefs:v1'))!).backup.ultimaExportacao).toBe('2026-09-30');
  });

  test('US-14.CA8: 6 dias não lembra; sem exportação usa o início do Pro; "Lembrar depois" adia 7 dias', async ({ page }) => {
    await abrirS2(page, { pro: true, assinaturas: [sub()], prefs: { backup: { ativo: true, ultimaExportacao: '2026-09-24' } } });
    await expect(page.getByTestId('upcoming-list')).toBeVisible();
    await expect(page.getByTestId('backup-lembrete')).toHaveCount(0);
    await abrirS2(page, { pro: true, assinaturas: [sub()], prefs: { backup: { ativo: true, inicioPro: '2026-09-20' } } });
    await expect(page.getByTestId('backup-lembrete')).toContainText('Faz 10 dias');
    await page.getByTestId('backup-btn-depois').click();
    await expect(page.getByTestId('backup-lembrete')).toHaveCount(0);
    expect(JSON.parse((await lerChave(page, 'mensalao:prefs:v1'))!).backup.adiadoAte).toBe('2026-10-07');
    await page.reload();
    await expect(page.getByTestId('backup-lembrete')).toHaveCount(0);
  });

  test('US-14.CA10: a tela de backup explica o limite das cópias locais', async ({ page }) => {
    await abrirS2(page, { pro: true, assinaturas: [sub()], hash: '#/ajustes' });
    await expect(page.getByTestId('backup-aviso-limite')).toContainText(
      'As cópias automáticas ficam neste aparelho. Se você limpar os dados do navegador, desinstalar o app ou perder o celular, elas se vão. Exporte um arquivo e guarde onde quiser.',
    );
  });

  test('US-14.CA11: Pro revogado: não cria cópias novas, preserva as existentes e bloqueia o restauro', async ({ page }) => {
    await abrirS2(page, {
      proBruto: JSON.stringify({ pro: true, sku: 'mensalao_pro', verificadoEm: 'x' }), provedor: { compras: [] },
      assinaturas: ativas(2), copias: [copia('c1', '2026-09-20T08:00', 2)], hash: '#/ajustes',
    });
    await page.waitForTimeout(500);
    expect(await copiasSalvas(page)).toHaveLength(1);
    await expect(page.getByTestId('lock-backup')).toBeVisible();
    await expect(page.getByTestId('copia-restaurar')).toHaveCount(0);
    await expect(page.getByTestId('btn-exportar')).toBeEnabled();
  });

  test('US-14.CA13: as cópias automáticas não entram no arquivo de backup JSON', async ({ page }) => {
    await abrirS2(page, { pro: true, assinaturas: ativas(2), copias: [copia('c1', '2026-09-20T08:00', 2)], hash: '#/ajustes' });
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('btn-exportar').click()]);
    const texto = readFileSync((await dl.path())!, 'utf8');
    const j = JSON.parse(texto);
    expect(Object.keys(j).sort()).toEqual(['assinaturas', 'config', 'exportadoEm', 'formato', 'versao']);
    expect(texto).not.toContain('Copia 0');
    expect(texto).not.toContain('mensalao:copias');
  });
});
