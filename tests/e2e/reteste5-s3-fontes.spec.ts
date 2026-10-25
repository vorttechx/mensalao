// Reteste 5 da sprint 3 (CI, dev-notes.md §14): layout com texto grande ajustado ao espaço real, com qualquer fonte
// do sistema (Inter neste container, DejaVu Sans no runner do CI). Nada aqui confere métricas de uma fonte: cada
// verificação compara o que a página mediu com o espaço que ela tem. Rodar também com FONTCONFIG_FILE (DejaVu).
// Cobre US-22.CA4 (360 px, até 200%, sem rolagem horizontal nem texto cortado), US-22.CA5 (alvos ≥ 44 px),
// design 2.5 (valores sem quebrar; tamanho do design quando cabe), 3.11 / US-20.CA4 (aviso ≤ 1/4 da tela) e
// US-13.CA14 (a nota de limitação no aviso).
import { expect, test, type Page } from '@playwright/test';
import { abrirS2, sub } from './helpers2';
import { transbordos, trechosPartidos } from './helpers3';

const RELOGIO = '2026-10-18T12:00:00-03:00';
const NOTA = 'Com o app fechado, o aviso depende do seu aparelho e pode atrasar. Abra o app para ver tudo.';

async function escala(page: Page, pct: number) {
  await page.evaluate((p) => document.documentElement.style.setProperty('font-size', `${p}%`, 'important'), pct);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

/**
 * Regras do ajuste ao espaço real em todo elemento ajustável da tela (número grande, "Por ano", valor dos itens de
 * lista, valores dos grupos de Totais, legenda do gráfico): cabe no bloco; nunca passa do teto do CSS (tamanho do
 * design); se cabe no teto, fica no teto; se não cabe, fica em min(16 px, teto) ou mais.
 */
async function ajustesForaDaRegra(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const ruins: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('.dinheiro-grande, .total-ano, .item .valor, .grupo-total .l b, table.legenda')) {
      if (el.closest('details:not([open]), [hidden], .sr-only') || el.getBoundingClientRect().width === 0) continue;
      const alvo = el.querySelector<HTMLElement>(':scope > .valor') ?? el;
      let bloco = el.parentElement;
      while (bloco && !getComputedStyle(bloco).containerType.includes('inline-size')) bloco = bloco.parentElement;
      bloco ??= el.parentElement!;
      const cs = getComputedStyle(bloco);
      const disponivel = bloco.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const fonte = parseFloat(getComputedStyle(el).fontSize);
      const largura = alvo.getBoundingClientRect().width;
      const salvo = el.style.getPropertyValue('font-size');
      el.style.removeProperty('font-size');
      const teto = parseFloat(getComputedStyle(el).fontSize);
      const cabeNoTeto = alvo.getBoundingClientRect().width <= disponivel + 0.5;
      if (salvo) el.style.setProperty('font-size', salvo);
      const nome = `${el.className || el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 24)}"`;
      if (largura > disponivel + 0.5) ruins.push(`${nome}: não cabe (${largura.toFixed(1)} > ${disponivel.toFixed(1)})`);
      if (fonte > teto + 0.2) ruins.push(`${nome}: ${fonte} px acima do teto ${teto}`);
      if (cabeNoTeto && Math.abs(fonte - teto) > 0.2) ruins.push(`${nome}: cabe no teto ${teto} px, mas está em ${fonte}`);
      if (!cabeNoTeto && fonte < Math.min(16, teto) - 0.01) ruins.push(`${nome}: ${fonte} px abaixo do piso`);
    }
    return ruins;
  });
}

async function alvosPequenos(page: Page): Promise<string[]> {
  return page.evaluate(() => [...document.querySelectorAll<HTMLElement>('button, a[href], input:not([type=hidden]):not([type=file]), select, summary')]
    .filter((el) => {
      const r = el.getBoundingClientRect();
      if (el.closest('.sr-only') || r.width === 0 || r.height === 0 || getComputedStyle(el).visibility === 'hidden') return false;
      const rotulo = el.closest('label') ?? (el.id ? document.querySelector(`label[for="${el.id}"]`) : null);
      const q = rotulo ? rotulo.getBoundingClientRect() : r;
      return Math.max(q.height, r.height) < 43.5 || Math.max(q.width, r.width) < 43.5;
    })
    .map((el) => `${el.tagName}[${el.dataset.testid ?? el.textContent?.trim().slice(0, 20)}] ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`));
}

// Itens com valores realistas e irreais (até R$ 99.999.999,99 por item, mensal e anual), categorias e pagamentos
// diferentes para Totais ter grupos e gráfico, e lembretes no Início.
const REALISTAS = [
  sub({ id: 'sp', nome: 'Spotify', catalogoId: 'spotify', valorCentavos: 990, proxima: '2026-10-19', diaRef: 19, categoria: 'Música', pagamento: 'pix' }),
  sub({ id: 'nf', nome: 'Netflix', catalogoId: 'netflix', valorCentavos: 5990, proxima: '2026-10-20', diaRef: 20 }),
  sub({ id: 'ac', nome: 'Academia', valorCentavos: 999_999, proxima: '2026-10-21', diaRef: 21, categoria: 'Saúde e bem-estar', ciclo: 'anual' }),
];
const GRANDES = [
  ...REALISTAS,
  sub({ id: 'g6', nome: 'Seis dígitos', valorCentavos: 99_999_999, proxima: '2026-11-03', diaRef: 3, categoria: 'Outros' }),
  sub({ id: 'g8', nome: 'Oito dígitos', valorCentavos: 9_999_999_999, proxima: '2026-11-04', diaRef: 4, categoria: 'Software', pagamento: 'boleto' }),
  sub({ id: 'ga', nome: 'Anual enorme', valorCentavos: 9_999_999_999, ciclo: 'anual', proxima: '2027-01-15', diaRef: 15, categoria: 'Educação' }),
];
const ROTAS = ['#/', '#/assinaturas', '#/totais', '#/ajustes', '#/assinatura/sp', '#/assinatura/g8', '#/assinatura/ga', '#/nova/form'];
const PREFS = { lembrete: { ativo: true, dias: 3 } };

test.describe('Reteste 5 sprint 3 — layout com qualquer fonte', () => {
  for (const pct of [100, 150, 200]) {
    test(`US-22.CA4 + design 2.5: a ${pct}%, com valores até R$ 99.999.999,99, nenhuma tela rola na horizontal, nada sai da tela e "R$ n" fica numa linha`, async ({ page }) => {
      await abrirS2(page, { relogio: RELOGIO, pro: true, assinaturas: GRANDES, prefs: PREFS });
      const falhas: string[] = [];
      for (const r of ROTAS) {
        await page.goto('./' + r);
        await expect(page.getByTestId('titulo-tela')).toBeVisible();
        await escala(page, pct);
        for (const aberto of [false, true]) {
          if (aberto) {
            await page.evaluate(() => document.querySelectorAll('details').forEach((d) => d.setAttribute('open', '')));
            await page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
          }
          const id = `${r} ${pct}%${aberto ? ' (aberto)' : ''}`;
          const sw = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
          if (sw.s > sw.c) falhas.push(`${id}: rolagem horizontal (${sw.s} > ${sw.c})`);
          falhas.push(...(await transbordos(page)).map((f) => `${id}: ${f}`));
          falhas.push(...(await trechosPartidos(page, '.conteudo', 'R\\$\\s?[\\d.]+,\\d{2}')).map((f) => `${id}: partido ${f}`));
          falhas.push(...(await ajustesForaDaRegra(page)).map((f) => `${id}: ${f}`));
        }
      }
      expect([...new Set(falhas)]).toEqual([]);
    });
  }

  test('design 2.5: a 100%, com valores realistas (até R$ 9.999,99), número grande, "Por ano", listas, grupos e legenda ficam no tamanho do design', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO, pro: true, assinaturas: REALISTAS, prefs: PREFS });
    const falhas: string[] = [];
    for (const r of ['#/', '#/assinaturas', '#/totais', '#/assinatura/sp', '#/assinatura/ac']) {
      await page.goto('./' + r);
      await expect(page.getByTestId('titulo-tela')).toBeVisible();
      const reduzidos = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.dinheiro-grande, .total-ano, .item .valor, .grupo-total .l b, table.legenda')]
        .filter((el) => el.style.getPropertyValue('font-size'))
        .map((el) => `${el.className} "${el.textContent?.trim().slice(0, 24)}" ${el.style.fontSize}`));
      falhas.push(...reduzidos.map((f) => `${r}: reduzido ${f}`));
    }
    const tamanhos = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('[data-testid="detalhe-valor"]')!).fontSize));
    if (Math.abs(tamanhos - 40) > 0.2) falhas.push(`Detalhe: número grande em ${tamanhos} px, não 40`);
    expect(falhas).toEqual([]);
  });

  for (const pct of [100, 200]) {
    test(`US-22.CA5 + design 3.15: a ${pct}%, abas com rótulos inteiros, sem encostar uns nos outros, e todo alvo ≥ 44×44 px`, async ({ page }) => {
      await abrirS2(page, { relogio: RELOGIO, pro: true, assinaturas: GRANDES, prefs: PREFS });
      const falhas: string[] = [];
      for (const r of ROTAS) {
        await page.goto('./' + r);
        await expect(page.getByTestId('titulo-tela')).toBeVisible();
        await escala(page, pct);
        await page.evaluate(() => document.querySelectorAll('details').forEach((d) => d.setAttribute('open', '')));
        falhas.push(...(await alvosPequenos(page)).map((f) => `${r} ${pct}%: alvo pequeno ${f}`));
        const abas = await page.locator('.nav a').evaluateAll((els) => els.map((a) => {
          const no = [...a.childNodes].find((n) => n.nodeType === Node.TEXT_NODE)!;
          const rg = document.createRange();
          rg.selectNodeContents(no);
          const qs = [...rg.getClientRects()].filter((q) => q.width > 0);
          const t = rg.getBoundingClientRect();
          const q = a.getBoundingClientRect();
          return { nome: a.textContent?.trim(), linhas: new Set(qs.map((x) => Math.round(x.top))).size, tl: t.left, tr: t.right, tt: t.top, l: q.left, r: q.right };
        }));
        for (const a of abas) {
          if (a.linhas !== 1) falhas.push(`${r} ${pct}%: aba ${a.nome} em ${a.linhas} linhas`);
          if (a.tl < a.l - 0.5 || a.tr > a.r + 0.5) falhas.push(`${r} ${pct}%: rótulo ${a.nome} sai da aba (${a.tl.toFixed(1)}..${a.tr.toFixed(1)} em ${a.l}..${a.r})`);
        }
        // Rótulos na mesma linha da grade não se tocam (sem o respiro de 2 px, a separação vem da centralização).
        for (let i = 1; i < abas.length; i++) {
          const [p, q] = [abas[i - 1], abas[i]];
          if (Math.abs(p.tt - q.tt) < 1 && q.tl - p.tr < 2) falhas.push(`${r} ${pct}%: rótulos ${p.nome} e ${q.nome} a ${(q.tl - p.tr).toFixed(1)} px`);
        }
      }
      expect(falhas).toEqual([]);
    });
  }

  test('US-20.CA4 + design 3.11: em 360×780 a 100%, com 3 ou mais lembretes, o aviso fechado mede até 184 px e até 1/4 da tela; a nota está à vista ou dentro de "Mais N lembretes"', async ({ page }) => {
    const varios = [1, 2, 3, 4].map((i) => sub({ id: `l${i}`, nome: `Serviço ${i}`, proxima: `2026-10-${18 + (i % 2)}`, diaRef: 18 + (i % 2) }));
    await abrirS2(page, { relogio: RELOGIO, pro: true, prefs: PREFS, assinaturas: varios });
    const m = await page.getByTestId('lembrete-aviso').evaluate((a) => ({
      h: a.getBoundingClientRect().height,
      notas: a.querySelectorAll('[data-testid="lembrete-limite-texto"]').length,
      dentro: !!a.querySelector('details [data-testid="lembrete-limite-texto"]'),
    }));
    expect(m.h).toBeLessThanOrEqual(Math.min(184, 780 / 4) + 0.5);
    expect(m.notas).toBe(1);
    await page.getByTestId('lembrete-aviso').locator('summary').click();
    await expect(page.getByTestId('lembrete-limite-texto')).toBeVisible();
    await expect(page.getByTestId('lembrete-limite-texto')).toHaveText(NOTA);
  });

  test('US-13.CA14: com 1 ou 2 lembretes, a nota de limitação do aviso fica sempre à vista, a 100% e a 200%', async ({ page }) => {
    for (const n of [1, 2]) {
      const itens = Array.from({ length: n }, (_, i) => sub({ id: `l${i}`, nome: `Serviço ${i}`, proxima: '2026-10-19', diaRef: 19 }));
      await abrirS2(page, { relogio: RELOGIO, pro: true, prefs: PREFS, assinaturas: itens });
      for (const pct of [100, 200]) {
        await escala(page, pct);
        await expect(page.getByTestId('lembrete-limite-texto'), `${n} lembrete(s) a ${pct}%`).toBeVisible();
        expect(await page.getByTestId('lembrete-limite-texto').evaluate((e) => !!e.closest('details')), `${n} lembrete(s) a ${pct}%`).toBe(false);
      }
    }
  });

  // BUG-12 (aberto no reteste 5): a nota só deveria ir para "Mais N lembretes" quando, à vista, ela fizesse o aviso
  // passar do limite do design (3.11 / US-20.CA4). Com texto grande, os dois lembretes à vista já passam desse limite
  // sozinhos; esconder a nota não faz o aviso caber e tira a limitação (US-13.CA14) de quem usa texto grande.
  test('BUG-12 / US-13.CA14 + design 3.11: a 150% e 200%, com 3 ou mais lembretes, a nota não vai para "Mais N lembretes" quando nem sem ela o aviso caberia no limite', async ({ page }) => {
    const varios = [1, 2, 3, 4].map((i) => sub({ id: `l${i}`, nome: `Serviço ${i}`, proxima: `2026-10-${18 + (i % 2)}`, diaRef: 18 + (i % 2) }));
    await abrirS2(page, { relogio: RELOGIO, pro: true, prefs: PREFS, assinaturas: varios });
    const falhas: string[] = [];
    for (const pct of [150, 200]) {
      await escala(page, pct);
      const m = await page.getByTestId('lembrete-aviso').evaluate((a) => ({
        h: a.getBoundingClientRect().height,
        dentro: !!a.querySelector('details [data-testid="lembrete-limite-texto"]'),
        limite: Math.min(184, window.innerHeight / 4),
      }));
      if (m.dentro && m.h > m.limite + 0.5) falhas.push(`${pct}%: nota escondida em "Mais N lembretes" e o aviso ainda mede ${m.h.toFixed(1)} px (limite ${m.limite})`);
    }
    expect(falhas).toEqual([]);
  });
});
