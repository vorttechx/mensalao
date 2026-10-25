// US-21 — Listas com identidade de cada serviço (design 3.3, 3.4 e 3.5): monogramas e marcas de estado.
import { expect, test } from '@playwright/test';
import { abrirS2, sub } from './helpers2';
import { transbordos } from './helpers3';

const RELOGIO = '2026-10-18T12:00:00-03:00';
const mono = (page: import('@playwright/test').Page, nome: string) => page.locator('[data-testid="sub-item"]', { has: page.getByTestId('item-nome').getByText(nome, { exact: true }) }).locator('.mono');

test.describe('US-21 Monogramas e marcas de estado', () => {
  test('US-21.CA1: serviço do catálogo mostra iniciais sobre a cor dele (Assinaturas, Início e catálogo)', async ({ page }) => {
    await abrirS2(page, {
      relogio: RELOGIO, hash: '#/assinaturas',
      assinaturas: [sub({ id: 'n', nome: 'Netflix', catalogoId: 'netflix' }), sub({ id: 'm', nome: 'Meu Meli', catalogoId: 'meli-plus' }), sub({ id: 's', nome: 'spotify' })],
    });
    const n = mono(page, 'Netflix');
    await expect(n).toHaveText('N');
    expect(await n.evaluate((e) => [getComputedStyle(e).backgroundColor, getComputedStyle(e).color])).toEqual(['rgb(177, 6, 15)', 'rgb(255, 255, 255)']);
    // catalogoId vale mesmo com outro nome; sem catalogoId, o nome igual ao do catálogo (sem caixa) usa a cor do serviço.
    expect(await mono(page, 'Meu Meli').evaluate((e) => [e.textContent, getComputedStyle(e).backgroundColor, getComputedStyle(e).color])).toEqual(['ML', 'rgb(255, 230, 0)', 'rgb(45, 50, 119)']);
    await expect(mono(page, 'spotify')).toHaveText('Sp');
    await page.getByTestId('nav-inicio').click();
    await expect(page.locator('[data-testid="upcoming-item"] .mono').first()).toBeVisible();
    await page.goto('./#/nova');
    await expect(page.locator('.mono').first()).toBeVisible();
    expect(await page.locator('.mono').count()).toBeGreaterThanOrEqual(18);
  });

  test('US-21.CA2: nome digitado à mão usa iniciais e cor neutra estável (a mesma após recarregar e em outra tela)', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO, hash: '#/assinaturas', assinaturas: [sub({ id: 'c', nome: 'Conta de luz' }), sub({ id: 'p', nome: 'Plano de saúde' })] });
    const neutras = ['rgb(91, 102, 112)', 'rgb(106, 93, 77)', 'rgb(79, 107, 90)', 'rgb(94, 90, 122)', 'rgb(122, 85, 96)', 'rgb(77, 104, 120)', 'rgb(110, 102, 80)', 'rgb(96, 90, 85)'];
    await expect(mono(page, 'Conta de luz')).toHaveText('CL');
    await expect(mono(page, 'Plano de saúde')).toHaveText('PS');
    const cor = await mono(page, 'Conta de luz').evaluate((e) => getComputedStyle(e).backgroundColor);
    expect(neutras).toContain(cor);
    await page.reload();
    expect(await mono(page, 'Conta de luz').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(cor);
    await page.goto('./#/assinatura/c');
    expect(await page.locator('.mono-grande').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(cor);
  });

  test('US-21.CA3: acento, número, emoji e uma palavra só mostram até 2 caracteres, sem quebrar o layout', async ({ page }) => {
    const nomes = ['Ágora', '99Pay', 'X', '🎵🎶', 'WWWWWW', 'Nome de serviço muito comprido que precisa quebrar em duas linhas'];
    await abrirS2(page, { relogio: RELOGIO, pro: true, hash: '#/assinaturas', assinaturas: nomes.map((nome, i) => sub({ id: `n${i}`, nome })) });
    const esperado: Record<string, string> = { 'Ágora': 'Ág', '99Pay': '99', X: 'X', '🎵🎶': '•', WWWWWW: 'Ww' };
    for (const [nome, ini] of Object.entries(esperado)) await expect(mono(page, nome)).toHaveText(ini);
    const caixas = await page.locator('[data-testid="sub-item"] .mono').evaluateAll((ms) => ms.map((m) => { const r = m.getBoundingClientRect(); return { w: r.width, h: r.height, sw: (m as HTMLElement).scrollWidth, cw: (m as HTMLElement).clientWidth, sh: (m as HTMLElement).scrollHeight, ch: (m as HTMLElement).clientHeight }; }));
    for (const c of caixas) {
      expect(c.w).toBe(36);
      expect(c.h).toBe(36);
      expect(c.sw).toBeLessThanOrEqual(c.cw);
      expect(c.sh).toBeLessThanOrEqual(c.ch);
    }
    expect(await transbordos(page)).toEqual([]);
    // Nome longo quebra linha (até 2 linhas) e o valor não quebra.
    const longo = page.locator('[data-testid="sub-item"]').last();
    await expect(longo.getByTestId('item-valor')).toBeVisible();
    const hValor = (await longo.getByTestId('item-valor').boundingBox())!.height;
    expect(hValor).toBeLessThan(30);
  });

  test('US-21.CA4: monograma é decorativo e o nome acessível do item começa pelo nome do serviço', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO, hash: '#/assinaturas', assinaturas: [sub({ id: 'n', nome: 'Netflix', catalogoId: 'netflix' })] });
    await expect(page.locator('.mono').first()).toHaveAttribute('aria-hidden', 'true');
    await expect(page.getByRole('link', { name: /^Netflix/ })).toBeVisible();
    await page.goto('./#/assinatura/n');
    await expect(page.locator('.mono-grande')).toHaveAttribute('aria-hidden', 'true');
    const g = (await page.locator('.mono-grande').boundingBox())!;
    expect([g.width, g.height]).toEqual([48, 48]);
  });

  test('US-21.CA5: pausada, cancelada, teste grátis e reajuste mantêm as marcas com texto no novo estilo', async ({ page }) => {
    await abrirS2(page, {
      relogio: RELOGIO, hash: '#/assinaturas',
      assinaturas: [
        sub({ id: 'p', nome: 'Deezer', catalogoId: 'deezer', status: 'pausada' }),
        sub({ id: 'c', nome: 'Globoplay', status: 'cancelada', canceladaEm: '2026-09-02' }),
        sub({ id: 'r', nome: 'Netflix', valorCentavos: 4490, historico: [{ data: '2026-10-01', deCentavos: 3990, paraCentavos: 4490 }] }),
        sub({ id: 't', nome: 'Max (HBO)', emTeste: true, fimTeste: '2026-10-21', proxima: '2026-10-21', diaRef: 21 }),
      ],
    });
    await expect(page.getByTestId('badge-pausada')).toHaveText('Pausada');
    await expect(page.getByTestId('badge-reajuste')).toContainText('subiu 12,5% (R$ 5,00)');
    // Marcas viram anotação: sem fundo e sem pílula (design 3.3).
    const est = await page.getByTestId('badge-pausada').evaluate((e) => { const s = getComputedStyle(e); return [s.backgroundColor, s.borderRadius, s.fontSize, s.fontWeight]; });
    expect(est[0]).toBe('rgba(0, 0, 0, 0)');
    expect(est[1]).not.toBe('999px');
    expect(est.slice(2)).toEqual(['13px', '600']);
    expect(await page.getByTestId('badge-reajuste').evaluate((e) => getComputedStyle(e).color)).toBe('rgb(163, 64, 15)');
    // Pausada apagada: nome em tinta clara e monograma em escala de cinza.
    const pausada = page.locator('[data-testid="sub-item"][data-id="p"]');
    expect(await pausada.locator('.mono').evaluate((e) => getComputedStyle(e).filter)).toBe('grayscale(1)');
    expect(await pausada.getByTestId('item-nome').evaluate((e) => getComputedStyle(e).color)).toBe('rgb(90, 103, 96)');
    await page.getByTestId('filtro-canceladas').locator('summary').click();
    await expect(page.getByTestId('badge-cancelada')).toHaveText('Cancelada em 02/09/2026');
    await page.getByTestId('nav-inicio').click();
    await expect(page.getByTestId('badge-teste-fim')).toHaveText('Teste grátis termina em 3 dias');
  });

  test('SEC-01 (verificação do QA): catalogoId de protótipo vindo do armazenamento cai nas iniciais e na cor neutra', async ({ page }) => {
    await abrirS2(page, {
      relogio: RELOGIO, hash: '#/assinaturas',
      assinaturas: ['constructor', '__proto__', 'toString', 'hasOwnProperty'].map((id, i) => sub({ id: `s${i}`, nome: `Meu Serviço ${i}`, catalogoId: id })),
    });
    const monos = page.locator('[data-testid="sub-item"] .mono');
    await expect(monos).toHaveCount(4);
    await expect(monos).toHaveText(['MS', 'MS', 'MS', 'MS']);
    const estilos = await monos.evaluateAll((ms) => ms.map((m) => m.getAttribute('style') ?? ''));
    for (const e of estilos) {
      expect(e).not.toContain('undefined');
      expect(e).toMatch(/--mono-fundo: #[0-9A-F]{6}; --mono-texto: #FFFFFF/);
    }
    await page.goto('./#/assinatura/s0');
    await expect(page.locator('.mono-grande')).toHaveText('MS');
  });
});
