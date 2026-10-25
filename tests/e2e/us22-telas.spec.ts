// US-22 — Demais telas na nova linguagem (design 3, 4 e 6): 360 px e texto a 200%, alvos de 44 px, foco visível,
// Totais sem bloco chapado, erros, diálogos e estados.
import { expect, test, type Page } from '@playwright/test';
import { abrirS2, ativas, sub } from './helpers2';
import { texto200, transbordos } from './helpers3';

const dados = [
  sub({ id: 'sp', nome: 'Spotify', catalogoId: 'spotify', valorCentavos: 2190, proxima: '2026-10-01', diaRef: 1, categoria: 'Música', pagamento: 'pix', banco: 'Banco com nome bem comprido' }),
  sub({ id: 'nf', nome: 'Netflix', catalogoId: 'netflix', historico: [{ data: '2026-09-01', deCentavos: 3990, paraCentavos: 4490 }] }),
  sub({ id: 'mx', nome: 'Max (HBO)', emTeste: true, fimTeste: '2026-10-02', proxima: '2026-10-02', diaRef: 2 }),
  sub({ id: 'lg', nome: 'Assinatura com um nome realmente muito longo para caber', valorCentavos: 123456, categoria: 'Saúde e bem-estar', ciclo: 'anual', proxima: '2027-01-15', diaRef: 15 }),
  sub({ id: 'pa', nome: 'Deezer', status: 'pausada', categoria: 'Música' }),
  sub({ id: 'ca', nome: 'Globoplay', status: 'cancelada', canceladaEm: '2026-09-02' }),
];
const ROTAS = ['#/', '#/assinaturas', '#/totais', '#/ajustes', '#/assinatura/nf', '#/assinatura/lg', '#/nova', '#/nova/form', '#/pro'];
const PREFS = { lembrete: { ativo: true, dias: 3 }, backup: { ativo: true, inicioPro: '2026-08-01' } };
const COPIAS = [{ id: 'c', criadaEm: '2026-09-20T08:00', quantidade: 2, conteudo: '{}' }];

async function abrirTudo(page: Page, r: string) {
  await page.goto('./' + r);
  await expect(page.getByTestId('titulo-tela')).toBeVisible();
  // Abre o que fica recolhido (canceladas, "Mais N lembretes", guia) para medir também.
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => d.setAttribute('open', '')));
}

async function alvosPequenos(page: Page) {
  return page.evaluate(() => {
    const alvos = [...document.querySelectorAll<HTMLElement>('button, a[href], input:not([type=hidden]):not([type=file]), select, summary')];
    return alvos
      .filter((el) => {
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (el.closest('.sr-only') || rect.width === 0 || rect.height === 0 || cs.visibility === 'hidden') return false;
        const rotulo = el.closest('label') ?? (el.id ? document.querySelector(`label[for="${el.id}"]`) : null);
        const r = rotulo ? rotulo.getBoundingClientRect() : rect;
        return Math.max(r.height, rect.height) < 43.5 || Math.max(r.width, rect.width) < 43.5;
      })
      .map((el) => { const r = el.getBoundingClientRect(); return `${el.tagName}[${el.getAttribute('data-testid') ?? el.textContent?.trim().slice(0, 25)}] ${Math.round(r.width)}×${Math.round(r.height)}`; });
  });
}

for (const pro of [false, true]) {
  const plano = pro ? 'Pro' : 'grátis';
  test.describe(`US-22 telas (${plano})`, () => {
    test(`US-22.CA4: 360 px sem rolagem horizontal nem conteúdo fora da tela, em todas as telas (${plano})`, async ({ page }) => {
      await abrirS2(page, { pro, assinaturas: dados, prefs: PREFS, copias: COPIAS });
      const falhas: string[] = [];
      for (const r of ROTAS) {
        await abrirTudo(page, r);
        falhas.push(...(await transbordos(page)).map((f) => `${r} ${f}`));
      }
      expect(falhas).toEqual([]);
    });

    test(`US-22.CA4: texto a 200% sem rolagem horizontal nem texto cortado (${plano})`, async ({ page }) => {
      await abrirS2(page, { pro, assinaturas: dados, prefs: PREFS, copias: COPIAS });
      const falhas: string[] = [];
      for (const r of ROTAS) {
        await abrirTudo(page, r);
        await texto200(page);
        falhas.push(...(await transbordos(page)).map((f) => `${r} ${f}`));
      }
      expect(falhas).toEqual([]);
    });

    test(`US-22.CA5: todo alvo de toque tem pelo menos 44×44 px (${plano})`, async ({ page }) => {
      await abrirS2(page, { pro, assinaturas: dados, prefs: PREFS, copias: COPIAS });
      const falhas: string[] = [];
      for (const r of ROTAS) {
        await abrirTudo(page, r);
        falhas.push(...(await alvosPequenos(page)).map((f) => `${r} ${f}`));
      }
      expect(falhas).toEqual([]);
    });
  });
}

test.describe('US-22 componentes', () => {
  test('US-22.CA5: foco visível (contorno de 3 px na cor de foco) em cada interativo ao navegar com Tab', async ({ page }) => {
    await abrirS2(page, { pro: true, assinaturas: dados, prefs: PREFS });
    const semFoco: string[] = [];
    for (const r of ['#/', '#/assinaturas', '#/ajustes', '#/assinatura/nf', '#/nova/form']) {
      await page.goto('./' + r);
      await expect(page.getByTestId('titulo-tela')).toBeVisible();
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press('Tab');
        const info = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return null;
          const alvo = el.matches('.switch-input') ? (el.nextElementSibling as HTMLElement) : el;
          const s = getComputedStyle(alvo);
          return { nome: `${el.tagName}[${el.dataset.testid ?? el.textContent?.trim().slice(0, 20)}]`, ok: s.outlineStyle === 'solid' && parseFloat(s.outlineWidth) >= 2 };
        });
        if (info && !info.ok) semFoco.push(`${r} ${info.nome}`);
      }
    }
    expect([...new Set(semFoco)]).toEqual([]);
  });

  test('US-22.CA2: Totais sem bloco de cor chapado; gráfico em barra (role=img) com legenda-tabela acessível', async ({ page }) => {
    await abrirS2(page, { pro: true, assinaturas: dados, hash: '#/totais' });
    const fundoTotal = await page.getByTestId('cartao-total').evaluate((e) => getComputedStyle(e).backgroundColor);
    expect(['rgba(0, 0, 0, 0)', 'rgb(255, 255, 255)']).toContain(fundoTotal);
    const g = page.getByTestId('grafico-categorias');
    const svg = g.locator('svg[role="img"]');
    await expect(svg).toHaveCount(1);
    expect(await svg.evaluate((s) => s.querySelector('title')?.textContent ?? s.getAttribute('aria-label'))).toMatch(/%/);
    await expect(g.locator('table')).toBeVisible();
    await expect(g.locator('th')).not.toHaveCount(0);
    await expect(page.getByTestId('grafico-item')).not.toHaveCount(0);
    expect(await g.locator('circle').count()).toBe(0);
    const caixa = (await svg.boundingBox())!;
    expect(caixa.height).toBeGreaterThanOrEqual(12);
    expect(caixa.height).toBeLessThanOrEqual(16);
  });

  test('US-22.CA2: no grátis o gráfico é recurso Pro em linha, com "Conhecer o Pro"', async ({ page }) => {
    await abrirS2(page, { assinaturas: dados, hash: '#/totais' });
    const lock = page.getByTestId('lock-grafico');
    await expect(lock).toBeVisible();
    await expect(lock).toContainText('Gráfico por categoria');
    await expect(lock.getByTestId('lock-btn-pro')).toBeVisible();
    await expect(page.getByTestId('grafico-categorias')).toHaveCount(0);
  });

  test('US-22.CA3: erro de formulário em ferrugem com aria-invalid, aria-describedby e foco no primeiro erro', async ({ page }) => {
    await abrirS2(page, { hash: '#/nova/form' });
    await page.getByTestId('btn-salvar').click();
    const nome = page.getByTestId('field-nome');
    await expect(nome).toBeFocused();
    await expect(nome).toHaveAttribute('aria-invalid', 'true');
    const desc = (await nome.getAttribute('aria-describedby')) ?? '';
    expect(desc).toContain((await page.getByTestId('error-nome').getAttribute('id'))!);
    expect(await page.getByTestId('error-nome').evaluate((e) => [getComputedStyle(e).color, getComputedStyle(e).fontSize])).toEqual(['rgb(163, 64, 15)', '13px']);
    expect(await nome.evaluate((e) => getComputedStyle(e).boxShadow)).toContain('inset');
  });

  test('US-22.CA3: confirmação de exclusão no diálogo do design (foco em Voltar, Esc fecha e devolve o foco)', async ({ page }) => {
    await abrirS2(page, { assinaturas: dados, hash: '#/assinatura/nf' });
    await page.getByTestId('btn-excluir').click();
    const d = page.getByTestId('confirm-dialog');
    await expect(d).toBeVisible();
    await expect(d).toContainText('Excluir Netflix?');
    await expect(d).toContainText('Esta ação não pode ser desfeita.');
    await expect(page.getByTestId('btn-dialogo-voltar')).toBeFocused();
    expect(await d.locator('svg').count()).toBe(0); // sem ícone (UX-S3-11)
    expect(await page.getByTestId('btn-confirmar').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(163, 64, 15)');
    await page.keyboard.press('Escape');
    await expect(d).toHaveCount(0);
    await expect(page.getByTestId('btn-excluir')).toBeFocused();
    await page.getByTestId('btn-excluir').click();
    await page.getByTestId('btn-confirmar').click();
    await expect(page.getByTestId('banner')).toBeVisible();
  });

  test('design 4.10: no diálogo de limite em 360 px os botões empilham com "Conhecer o Pro" em cima', async ({ page }) => {
    await abrirS2(page, { assinaturas: ativas(5) });
    await page.getByTestId('btn-adicionar').click();
    const pro = (await page.getByTestId('limite-btn-pro').boundingBox())!;
    const nao = (await page.getByTestId('limite-btn-agora-nao').boundingBox())!;
    expect(pro.y + pro.height).toBeLessThanOrEqual(nao.y + 1);
    expect(await page.getByTestId('limite-aviso').locator('svg').count()).toBe(0);
  });

  test('US-22.CA1: telas agrupadas (Detalhe, Ajustes, Pro) usam o papel agrupado; telas de lista, o papel', async ({ page }) => {
    await abrirS2(page, { assinaturas: dados });
    const fundo = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    for (const [r, cor] of [['#/', 'rgb(255, 255, 255)'], ['#/assinaturas', 'rgb(255, 255, 255)'], ['#/totais', 'rgb(255, 255, 255)'], ['#/ajustes', 'rgb(243, 245, 242)'], ['#/assinatura/nf', 'rgb(243, 245, 242)'], ['#/pro', 'rgb(243, 245, 242)']] as const) {
      await page.goto('./' + r);
      await expect(page.getByTestId('titulo-tela')).toBeVisible();
      expect(await fundo(), r).toBe(cor);
    }
  });

  test('design 3.15: abas sem pílula, aba ativa na cor da marca com aria-current', async ({ page }) => {
    await abrirS2(page, { assinaturas: dados, hash: '#/totais' });
    const ativa = page.getByTestId('nav-totais');
    await expect(ativa).toHaveAttribute('aria-current', 'page');
    expect(await ativa.evaluate((e) => getComputedStyle(e).color)).toBe('rgb(29, 92, 63)');
    expect(await page.locator('.nav .pil').count()).toBe(0);
    expect(await page.getByTestId('nav-inicio').evaluate((e) => getComputedStyle(e).color)).toBe('rgb(90, 103, 96)');
  });
});
