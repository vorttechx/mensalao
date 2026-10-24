import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { abrir, lerEstado, sub } from './helpers';

const dados = [
  sub({ id: '1', valorCentavos: 4499, historico: [{ data: '2026-09-01', deCentavos: 3999, paraCentavos: 4499 }] }),
  sub({ id: '2', nome: 'Pausada', status: 'pausada' }),
  sub({ id: '3', nome: 'Cancelada', status: 'cancelada', canceladaEm: '2026-09-10' }),
];

async function exportar(page: import('@playwright/test').Page) {
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('btn-exportar').click()]);
  const caminho = await dl.path();
  return { nome: dl.suggestedFilename(), json: JSON.parse(readFileSync(caminho, 'utf8')), caminho };
}

test.describe('US-07 Backup', () => {
  test('US-07.CA1: exporta arquivo nomeado com data e conteúdo completo', async ({ page }) => {
    await abrir(page, dados, 5, '#/ajustes');
    const { nome, json } = await exportar(page);
    expect(nome).toBe('mensalao-backup-2026-09-30.json');
    expect(json.versao).toBe(1);
    expect(json.exportadoEm).toBeTruthy();
    expect(json.config.diasAviso).toBe(5);
    expect(json.assinaturas).toHaveLength(3);
    expect(json.assinaturas[0].historico).toHaveLength(1);
  });

  test('US-07.CA2 / CA4: importa com confirmação e a ida e volta é idêntica', async ({ page }) => {
    await abrir(page, dados, 5, '#/ajustes');
    const { caminho } = await exportar(page);
    const antes = await lerEstado(page);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByTestId('input-importar').setInputFiles(caminho);
    await expect(page.getByTestId('confirm-dialog')).toContainText('3');
    await expect(page.getByTestId('confirm-dialog')).toContainText(/substitu/i);
    await page.getByTestId('btn-confirmar').click();
    await expect(page.getByTestId('import-ok')).toBeVisible();
    expect(await lerEstado(page)).toEqual(antes);
  });

  test('US-07.CA3: arquivo inválido mostra erro e preserva os dados', async ({ page }) => {
    await abrir(page, dados, 3, '#/ajustes');
    const antes = await lerEstado(page);
    const casos = [
      'isto não é json',
      '{"formato":"outro"}',
      JSON.stringify({ formato: 'mensalao-backup', versao: 99, exportadoEm: 'x', config: { diasAviso: 3 }, assinaturas: [] }),
      JSON.stringify({ formato: 'mensalao-backup', versao: 1, exportadoEm: 'x', config: { diasAviso: 3 }, assinaturas: [{ ...dados[0], valorCentavos: -1 }] }),
      JSON.stringify({ formato: 'mensalao-backup', versao: 1, exportadoEm: 'x', config: { diasAviso: 3 }, assinaturas: [{ ...dados[0], proxima: '2026-02-31' }] }),
    ];
    for (const c of casos) {
      await page.getByTestId('input-importar').setInputFiles({ name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(c) });
      await expect(page.getByTestId('import-error')).toBeVisible();
      expect(await lerEstado(page)).toEqual(antes);
    }
  });

  test('US-07.CA5: backup vazio exporta e importa sem erro', async ({ page }) => {
    await abrir(page, [], 3, '#/ajustes');
    const { json, caminho } = await exportar(page);
    expect(json.assinaturas).toEqual([]);
    await page.getByTestId('input-importar').setInputFiles(caminho);
    await page.getByTestId('btn-confirmar').click();
    await expect(page.getByTestId('import-ok')).toBeVisible();
    await page.getByTestId('nav-inicio').click();
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('US-07.CA6: datas passadas são avançadas ao importar', async ({ page }) => {
    await abrir(page, null, 3, '#/ajustes');
    const b = { formato: 'mensalao-backup', versao: 1, exportadoEm: '2026-01-01T00:00:00Z', config: { diasAviso: 3 }, assinaturas: [sub({ proxima: '2026-08-20' })] };
    await page.getByTestId('input-importar').setInputFiles({ name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(b)) });
    await page.getByTestId('btn-confirmar').click();
    await expect.poll(async () => (await lerEstado(page))?.assinaturas[0]?.proxima).toBe('2026-10-20');
  });

  test('US-07.CA7: não envia dados à rede', async ({ page }) => {
    const externas: string[] = [];
    page.on('request', (r) => { if (!r.url().startsWith('http://localhost:4173') && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) externas.push(r.url()); });
    await abrir(page, dados, 3, '#/ajustes');
    await exportar(page);
    expect(externas).toEqual([]);
  });
});
