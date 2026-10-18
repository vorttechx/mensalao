import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { abrirS2, lerChave, sub } from './helpers2';

async function exportar(page: import('@playwright/test').Page) {
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('btn-exportar-csv').click()]);
  const buf = readFileSync((await dl.path())!);
  return { nome: dl.suggestedFilename(), buf, texto: buf.toString('utf8') };
}

test.describe('US-15 Exportar CSV (Pro)', () => {
  test('US-15.CA1: no grátis o botão aparece bloqueado', async ({ page }) => {
    await abrirS2(page, { assinaturas: [sub()], hash: '#/ajustes' });
    await expect(page.getByTestId('lock-csv')).toBeVisible();
    await expect(page.getByTestId('btn-exportar-csv')).toHaveCount(0);
  });

  test('US-15.CA2 / CA3: baixa mensalao-assinaturas-aaaa-mm-dd.csv em UTF-8 com BOM, ";" e "\\r\\n", com cabeçalho', async ({ page }) => {
    await abrirS2(page, { pro: true, assinaturas: [sub()], hash: '#/ajustes' });
    const r = await exportar(page);
    expect(r.nome).toBe('mensalao-assinaturas-2026-09-30.csv');
    expect([...r.buf.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const linhas = r.texto.slice(1).split('\r\n');
    expect(linhas[0]).toBe('Nome;Valor;Ciclo;Equivalente mensal;Equivalente anual;Próxima cobrança;Forma de pagamento;Banco/cartão;Categoria;Status;Em teste grátis;Fim do teste;Cancelada em;Criada em');
    expect(linhas[1].startsWith('Netflix;44,90;Mensal;44,90;538,80;20/10/2026;')).toBe(true);
    expect(r.texto.endsWith('\r\n')).toBe(true);
    await expect(page.getByTestId('csv-ok')).toBeVisible();
  });

  test('US-15.CA4 / CA5 / CA6: valores, equivalentes e todas as situações em ordem alfabética', async ({ page }) => {
    await abrirS2(page, {
      pro: true, hash: '#/ajustes',
      assinaturas: [
        sub({ id: '1', nome: 'Prime', valorCentavos: 16680, ciclo: 'anual', proxima: '2027-01-10' }),
        sub({ id: '2', nome: 'Gym', valorCentavos: 1000, ciclo: 'semanal', proxima: '2026-10-02' }),
        sub({ id: '3', nome: 'Caro', valorCentavos: 123456, status: 'cancelada', canceladaEm: '2026-09-10' }),
        sub({ id: '4', nome: 'Beta', status: 'pausada', emTeste: true, fimTeste: '2026-10-05' }),
      ],
    });
    const { texto } = await exportar(page);
    const l = texto.slice(1).split('\r\n').slice(1, 5).map((x) => x.split(';'));
    expect(l.map((c) => c[0])).toEqual(['Beta', 'Caro', 'Gym', 'Prime']);
    expect(l[1].slice(1, 5)).toEqual(['1234,56', 'Mensal', '1234,56', '14814,72']);
    expect(l[1][9]).toBe('Cancelada');
    expect(l[1][12]).toBe('10/09/2026');
    expect(l[2].slice(3, 5)).toEqual(['43,33', '520,00']);
    expect(l[3].slice(3, 5)).toEqual(['13,90', '166,80']);
    expect(l[0][9]).toBe('Pausada');
    expect(l[0][10]).toBe('Sim');
    expect(l[0][11]).toBe('05/10/2026');
  });

  test('US-15.CA7 / CA8 / CA9: aspas e ponto e vírgula escapados, fórmulas neutralizadas, acentos e emoji íntegros', async ({ page }) => {
    await abrirS2(page, {
      pro: true, hash: '#/ajustes',
      assinaturas: [
        sub({ id: '1', nome: 'Plano "Família"; 2 telas' }),
        sub({ id: '2', nome: '=1+1', banco: '@banco' }),
        sub({ id: '3', nome: 'Cinéfilo 🎬' }),
      ],
    });
    const { texto } = await exportar(page);
    expect(texto).toContain('"Plano ""Família""; 2 telas";44,90;');
    expect(texto).toContain("'=1+1;44,90;");
    expect(texto).toContain("'@banco");
    expect(texto).toContain('Cinéfilo 🎬;44,90;');
  });

  test('US-15.CA10: lista vazia exporta só o cabeçalho e avisa', async ({ page }) => {
    await abrirS2(page, { pro: true, hash: '#/ajustes' });
    const { texto } = await exportar(page);
    expect(texto.slice(1).split('\r\n')).toHaveLength(2);
    await expect(page.getByTestId('csv-vazio')).toContainText('Você ainda não tem assinaturas; o arquivo contém só o cabeçalho');
  });

  test('US-15.CA11: Pro revogado volta a bloquear e não perde dados', async ({ page }) => {
    await abrirS2(page, { proBruto: JSON.stringify({ pro: true, sku: 'mensalao_pro', verificadoEm: 'x' }), provedor: { compras: [] }, assinaturas: [sub()], hash: '#/ajustes' });
    await expect(page.getByTestId('lock-csv')).toBeVisible();
    expect(JSON.parse((await lerChave(page, 'mensalao:v1'))!).assinaturas).toHaveLength(1);
  });

  test('US-15.CA12: funciona offline, sem requisições de rede e sem alterar o estado', async ({ page, context }) => {
    await abrirS2(page, { pro: true, assinaturas: [sub()], hash: '#/ajustes' });
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await context.setOffline(true);
    const antes = await lerChave(page, 'mensalao:v1');
    const pedidos: string[] = [];
    page.on('request', (r) => { if (!r.url().startsWith('blob:') && !r.url().startsWith('data:')) pedidos.push(r.url()); });
    const { texto } = await exportar(page);
    expect(texto).toContain('Netflix');
    expect(pedidos).toEqual([]);
    expect(await lerChave(page, 'mensalao:v1')).toBe(antes);
  });
});
