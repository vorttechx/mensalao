// US-20 — Início redesenhado (design 4.1, 3.6 e 3.11): total, régua do mês, lembretes discretos, vazio e limite.
import { expect, test } from '@playwright/test';
import { abrirS2, ativas, sub } from './helpers2';

// Exemplo do design: hoje = domingo, 18/10/2026, aviso de 3 dias.
const RELOGIO = '2026-10-18T12:00:00-03:00';
const dados = [
  sub({ id: 'ac', nome: 'Academia', catalogoId: 'academia', valorCentavos: 9990, proxima: '2026-11-05', diaRef: 5, categoria: 'Saúde e bem-estar', pagamento: 'debito' }),
  sub({ id: 'sp', nome: 'Spotify', catalogoId: 'spotify', valorCentavos: 2190, proxima: '2026-10-18', diaRef: 18, categoria: 'Música', pagamento: 'pix', banco: 'Nubank' }),
  sub({ id: 'nf', nome: 'Netflix', catalogoId: 'netflix', valorCentavos: 4490, proxima: '2026-10-19', diaRef: 19 }),
  sub({ id: 'mx', nome: 'Max (HBO)', catalogoId: 'max', valorCentavos: 3990, proxima: '2026-10-21', diaRef: 21, emTeste: true, fimTeste: '2026-10-21' }),
];

test.describe('US-20 Início redesenhado', () => {
  test('US-20.CA1: total por mês igual ao de Totais (sem o teste grátis vigente), com R$ e centavos separados', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO, assinaturas: dados });
    await expect(page.getByTestId('inicio-resumo')).toContainText('Total por mês');
    const total = page.getByTestId('inicio-total');
    await expect(total).toHaveText('R$ 166,70'); // 99,90 + 21,90 + 44,90 (Max em teste fica fora)
    await expect(total.locator('.rs')).toHaveText(/R\$/);
    await expect(total.locator('.ct')).toHaveText(',70');
    await page.getByTestId('nav-totais').click();
    await expect(page.getByTestId('total-mensal')).toHaveText('R$ 166,70');
  });

  test('US-20.CA1: próximas em ordem de data, destaque com texto e cor (nunca só cor)', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO, assinaturas: dados });
    const itens = page.getByTestId('upcoming-item');
    await expect(itens.getByTestId('item-nome')).toHaveText(['Spotify', 'Netflix', 'Max (HBO)', 'Academia']);
    await expect(itens.nth(0).getByTestId('item-meta')).toHaveText('Dom, 18 out · Pix Automático · Nubank');
    await expect(itens.nth(0).getByTestId('badge-vence-logo')).toHaveText('hoje');
    await expect(itens.nth(1).getByTestId('badge-vence-logo')).toHaveText('amanhã');
    await expect(itens.nth(3).getByTestId('badge-vence-logo')).toHaveCount(0);
    const cor = await itens.nth(0).getByTestId('badge-vence-logo').evaluate((e) => getComputedStyle(e).color);
    const corMeta = await itens.nth(0).getByTestId('item-meta').evaluate((e) => getComputedStyle(e).color);
    expect(cor).toBe('rgb(163, 64, 15)'); // --cor-alerta (ferrugem) no claro
    expect(cor).not.toBe(corMeta);
    await expect(itens.nth(2).getByTestId('badge-teste-fim')).toHaveText('Teste grátis termina em 3 dias');
    expect(await itens.nth(2).getByTestId('badge-teste-fim').evaluate((e) => getComputedStyle(e).color)).toBe('rgb(47, 91, 154)'); // --cor-teste
  });

  test('design 4.1: ordem total → régua → lista → contador, e o título continua sendo o h1', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO, assinaturas: dados });
    const ys = [];
    for (const t of ['inicio-total', 'regua-mes', 'titulo-tela', 'upcoming-list', 'limite-contador']) ys.push((await page.getByTestId(t).boundingBox())!.y);
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Próximas cobranças');
    await expect(page.getByRole('button', { name: 'Adicionar assinatura' })).toBeVisible();
  });

  test('US-20.CA2: régua com marcas por dia, desenho decorativo e texto equivalente para leitor de tela', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO, assinaturas: dados });
    const regua = page.getByTestId('regua-mes');
    await expect(regua).toBeVisible();
    expect(await regua.evaluate((e) => e.tagName)).toBe('FIGURE');
    await expect(page.getByTestId('regua-texto')).toHaveText(
      'Cobranças de outubro. Já saiu: dia 5, Academia, R$ 99,90. Faltam: hoje, Spotify, R$ 21,90; dia 19, Netflix, R$ 44,90; dia 21, Max (HBO), R$ 39,90.',
    );
    expect(await page.getByTestId('regua-texto').evaluate((e) => e.tagName)).toBe('FIGCAPTION');
    // Desenho e legenda escondidos do leitor de tela; o figcaption é o equivalente.
    const visiveisAoLeitor = await regua.evaluate((f) => [...f.children].filter((c) => c.getAttribute('aria-hidden') !== 'true').map((c) => c.tagName));
    expect(visiveisAoLeitor).toEqual(['FIGCAPTION']);
    // Uma marca por dia com cobrança: 5 (vazada, já cobrada), 18, 19 e 21 (cheias).
    const marcas = await regua.locator('.regua b').evaluateAll((bs) => bs.map((b) => `${(b as HTMLElement).style.gridColumnStart}${b.classList.contains('pago') ? 'p' : ''}`));
    expect(marcas).toEqual(['5p', '18', '19', '21']);
    await expect(regua.locator('.regua-leg')).toContainText('1 out');
    await expect(regua.locator('.regua-leg')).toContainText('hoje, 18');
    await expect(regua.locator('.regua-leg')).toContainText('31');
    // Não é interativa e não é o único lugar com a informação: a lista traz as mesmas datas.
    expect(await regua.locator('a, button, [tabindex]').count()).toBe(0);
    await expect(page.getByTestId('upcoming-list')).toContainText('Seg, 19 out');
  });

  test('design 3.6: régua cabe em 360 px com legenda sem sobreposição perto das pontas', async ({ page }) => {
    for (const relogio of ['2026-10-02T12:00:00-03:00', '2026-10-30T12:00:00-03:00']) {
      await abrirS2(page, { relogio, assinaturas: dados });
      const regua = (await page.getByTestId('regua-mes').boundingBox())!;
      expect(regua.x).toBeGreaterThanOrEqual(0);
      expect(regua.x + regua.width).toBeLessThanOrEqual(360);
      const spans = await page.locator('.regua-leg span').evaluateAll((ss) => ss.map((s) => { const r = s.getBoundingClientRect(); return [r.left, r.right]; }));
      for (const [l, r] of spans) { expect(l).toBeGreaterThanOrEqual(0); expect(r).toBeLessThanOrEqual(360); }
      for (let i = 1; i < spans.length; i++) expect(spans[i][0]).toBeGreaterThanOrEqual(spans[i - 1][1]);
    }
  });

  test('US-20.CA3: estado vazio com total R$ 0,00, régua vazia e ação de adicionar (sem o "+" do topo)', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO });
    await expect(page.getByTestId('inicio-total')).toHaveText('R$ 0,00');
    await expect(page.getByTestId('regua-texto')).toHaveText('Nenhuma cobrança em outubro.');
    await expect(page.locator('[data-testid="regua-mes"] .regua b')).toHaveCount(0);
    await expect(page.locator('[data-testid="regua-mes"] .hoje')).toHaveCount(1);
    await expect(page.getByTestId('empty-state')).toContainText('Nenhuma cobrança por aqui');
    await expect(page.getByTestId('empty-state')).toContainText('Cadastre suas assinaturas para ver o que vai ser cobrado e quando.');
    await expect(page.getByTestId('btn-adicionar')).toHaveCount(0);
    await page.getByTestId('btn-adicionar-vazio').click();
    await expect(page).toHaveURL(/#\/nova/);
  });

  test('US-20.CA3: só pausadas/canceladas mostra o texto da sprint 1', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO, assinaturas: [sub({ status: 'pausada' })] });
    await expect(page.getByTestId('empty-state')).toContainText('Nenhuma assinatura ativa no momento. As pausadas e canceladas ficam em Assinaturas.');
    await expect(page.getByTestId('inicio-total')).toHaveText('R$ 0,00');
  });

  test('US-20.CA4: lembretes discretos entre régua e lista, até 2 à vista e o resto em "Mais N lembretes", ≤ 1/4 da tela', async ({ page }) => {
    const varios = [1, 2, 3, 4].map((i) => sub({ id: `l${i}`, nome: `Serviço ${i}`, proxima: `2026-10-${18 + (i % 2)}`, diaRef: 18 + (i % 2) }));
    await abrirS2(page, { relogio: RELOGIO, pro: true, prefs: { lembrete: { ativo: true, dias: 3 } }, assinaturas: varios });
    const aviso = page.getByTestId('lembrete-aviso');
    await expect(aviso).toBeVisible();
    await expect(aviso).toHaveAttribute('role', 'status');
    await expect(page.getByTestId('lembrete-item')).toHaveCount(4);
    await expect(page.getByTestId('lembrete-item').filter({ visible: true })).toHaveCount(2);
    await expect(aviso.locator('details > summary')).toHaveText('Mais 2 lembretes');
    const caixa = (await aviso.boundingBox())!;
    expect(caixa.height).toBeLessThanOrEqual(780 / 4);
    const yRegua = (await page.getByTestId('regua-mes').boundingBox())!.y;
    const yLista = (await page.getByTestId('upcoming-list').boundingBox())!.y;
    expect(caixa.y).toBeGreaterThan(yRegua);
    expect(caixa.y).toBeLessThan(yLista);
    // Cada linha é um link de pelo menos 44 px que leva ao detalhe.
    const h0 = (await page.getByTestId('lembrete-item').first().boundingBox())!.height;
    expect(h0).toBeGreaterThanOrEqual(44);
    expect((await aviso.locator('summary').boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await aviso.locator('summary').click();
    await expect(page.getByTestId('lembrete-item').nth(3)).toBeVisible();
  });

  test('US-20.CA4: com 1 lembrete não há "Mais N lembretes"; sem lembrete na janela o aviso não existe', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO, pro: true, prefs: { lembrete: { ativo: true, dias: 1 } }, assinaturas: [sub({ proxima: '2026-10-19', diaRef: 19 })] });
    await expect(page.getByTestId('lembrete-item')).toHaveText('Amanhã: Netflix — R$ 44,90');
    await expect(page.locator('[data-testid="lembrete-aviso"] details')).toHaveCount(0);
    await abrirS2(page, { relogio: RELOGIO, pro: true, prefs: { lembrete: { ativo: true, dias: 1 } }, assinaturas: [sub({ proxima: '2026-10-25', diaRef: 25 })] });
    await expect(page.getByTestId('upcoming-item')).toHaveCount(1);
    await expect(page.getByTestId('lembrete-aviso')).toHaveCount(0);
  });

  test('US-20.CA5: grátis com 5 ativas mostra o contador e o "+" abre o diálogo de limite', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO, assinaturas: ativas(5) });
    await expect(page.getByTestId('limite-contador')).toHaveText('5 de 5 assinaturas ativas');
    await expect(page.getByTestId('limite-link-pro')).toBeVisible();
    await page.getByTestId('btn-adicionar').click();
    await expect(page.getByTestId('limite-aviso')).toBeVisible();
    await expect(page.getByTestId('limite-aviso')).toContainText('Você chegou ao limite de 5 assinaturas ativas do plano grátis');
  });

  test('design 2.1 / 5.1: ao abrir o Início, o foco programático no título não mostra anel sem interação', async ({ page }) => {
    // Observação do status (portão G2). O anel de foco é dos elementos interativos (design 2.1); o h1 recebe
    // foco só para o leitor de tela (5.1). Sem teclado, o título não deve aparecer com anel verde de 3 px.
    await abrirS2(page, { relogio: RELOGIO, assinaturas: dados });
    await expect(page.getByTestId('titulo-tela')).toBeFocused();
    const contorno = await page.getByTestId('titulo-tela').evaluate((e) => { const s = getComputedStyle(e); return `${s.outlineStyle} ${s.outlineWidth}`; });
    expect(contorno).toMatch(/^none|0px$/);
  });

  test('design 5.1: após tocar numa aba o título recebe o foco sem anel; pelo teclado, o anel aparece', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO, assinaturas: dados });
    await page.getByTestId('nav-assinaturas').click();
    await expect(page.getByTestId('titulo-tela')).toBeFocused();
    expect(await page.getByTestId('titulo-tela').evaluate((e) => getComputedStyle(e).outlineStyle)).toBe('none');
    await page.getByTestId('nav-inicio').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('titulo-tela')).toBeFocused();
    expect(await page.getByTestId('titulo-tela').evaluate((e) => getComputedStyle(e).outlineStyle)).toBe('solid');
  });
});
