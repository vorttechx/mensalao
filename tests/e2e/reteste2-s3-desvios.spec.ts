// Reteste 2 da sprint 3 (D2, rodada 2): os dois desvios novos do BUG-08 (dev-notes.md §11) contra a US-22.CA4/CA5
// e o design 2.5 / 3.15. (a) barra de abas: 4 colunas a 100%, 2×2 de 125% a 200%, 1 coluna a 300%, sem cobrir
// conteúdo; (b) número grande em min(2,5rem, 19cqi), "R$ n" inteiro e o sufixo descendo de linha. Janela 360×780.
import { expect, test, type Page } from '@playwright/test';
import { abrirS2, sub } from './helpers2';
import { transbordos } from './helpers3';

const RELOGIO = '2026-10-18T12:00:00-03:00';
const ABAS = ['#/', '#/assinaturas', '#/totais', '#/ajustes'];

/** Muitas assinaturas, para todas as telas com abas rolarem e o fim do conteúdo ficar atrás da barra se ela cobrir. */
const muitas = Array.from({ length: 12 }, (_, i) =>
  sub({ id: `s${i}`, nome: `Serviço número ${i + 1}`, valorCentavos: 1990 + i * 100, proxima: `2026-10-${String(19 + (i % 3)).padStart(2, '0')}`, diaRef: 19 + (i % 3) }),
);

/** Texto do sistema em N% (os tamanhos do app são em rem); troca de escala sem recarregar a tela. */
async function escala(page: Page, pct: number) {
  await page.evaluate((p) => document.documentElement.style.setProperty('font-size', `${p}%`, 'important'), pct);
  // O ResizeObserver da barra roda no próximo quadro.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

/** Transbordos da tela, menos o "Por ano" dos Totais, que tem teste próprio (BUG-09, aberto neste reteste). */
async function transbordosForaBug09(page: Page) {
  return (await transbordos(page)).filter((t) => !t.includes('[total-anual]'));
}

async function irPara(page: Page, rota: string) {
  await page.goto('./' + rota);
  await expect(page.getByTestId('titulo-tela')).toBeVisible();
}

/** Abas: posição, tamanho, coluna e linha da grade, corte do rótulo e tamanho da fonte. */
async function medirAbas(page: Page) {
  return page.locator('.nav a').evaluateAll((els) => els.map((e) => {
    const q = e.getBoundingClientRect();
    return {
      t: e.textContent?.trim() ?? '', l: q.left, r: q.right, top: q.top, w: q.width, h: q.height,
      cortado: e.scrollWidth > e.clientWidth + 1, fonte: parseFloat(getComputedStyle(e).fontSize),
    };
  }));
}

/** Palavras do rótulo que quebraram no meio (mais de uma linha para a mesma palavra). */
async function palavrasPartidas(page: Page, seletor: string): Promise<string[]> {
  return page.evaluate((sel) => {
    const ruins: string[] = [];
    for (const el of document.querySelectorAll(sel)) {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode() as Text | null; n; n = w.nextNode() as Text | null) {
        for (const m of n.data.matchAll(/\S+/g)) {
          const r = document.createRange();
          r.setStart(n, m.index!); r.setEnd(n, m.index! + m[0].length);
          const qs = [...r.getClientRects()].filter((q) => q.width > 0);
          if (qs.some((a) => qs.some((b) => b.top >= a.bottom - 1))) ruins.push(m[0]);
        }
      }
    }
    return ruins;
  }, seletor);
}

test.describe('Reteste 2 sprint 3 — desvio (a): abas empilhadas com texto grande', () => {
  const casos: { pct: number; colunas: number; linhas: number }[] = [
    { pct: 100, colunas: 4, linhas: 1 },
    { pct: 125, colunas: 2, linhas: 2 },
    { pct: 150, colunas: 2, linhas: 2 },
    { pct: 200, colunas: 2, linhas: 2 },
    { pct: 300, colunas: 1, linhas: 4 },
  ];

  for (const c of casos) {
    test(`BUG-08 / US-22.CA4 + CA5 + design 3.15: a ${c.pct}%, abas em ${c.colunas} coluna(s), rótulos inteiros crescendo em rem, alvo ≥ 44 px`, async ({ page }) => {
      await abrirS2(page, { relogio: RELOGIO, assinaturas: muitas });
      for (const r of ABAS) {
        await irPara(page, r);
        await escala(page, c.pct);
        const abas = await medirAbas(page);
        expect(abas.map((a) => a.t), r).toEqual(['Início', 'Assinaturas', 'Totais', 'Ajustes']);
        // Grade: quantas colunas (lefts distintos) e linhas (tops distintos).
        const cols = new Set(abas.map((a) => Math.round(a.l))).size;
        const lins = new Set(abas.map((a) => Math.round(a.top))).size;
        expect([cols, lins], `${r} a ${c.pct}%`).toEqual([c.colunas, c.linhas]);
        // Ordem de leitura preservada (Início, Assinaturas, Totais, Ajustes: linha a linha, da esquerda para a direita).
        const ordem = [...abas].sort((a, b) => Math.round(a.top) - Math.round(b.top) || a.l - b.l).map((a) => a.t);
        expect(ordem, `${r} a ${c.pct}%`).toEqual(['Início', 'Assinaturas', 'Totais', 'Ajustes']);
        for (const a of abas) {
          expect(a.l, `${r} ${a.t}`).toBeGreaterThanOrEqual(-1);
          expect(a.r, `${r} ${a.t}`).toBeLessThanOrEqual(361);
          expect(a.cortado, `${r} ${a.t} cortado`).toBe(false);
          expect(a.w, `${r} ${a.t} alvo`).toBeGreaterThanOrEqual(44);
          expect(a.h, `${r} ${a.t} alvo`).toBeGreaterThanOrEqual(44);
          // Design 2.5: rótulo de 13 px em rem, sem teto (era 14 px no máximo antes do BUG-08).
          expect(a.fonte, `${r} ${a.t} fonte`).toBeCloseTo(13 * (c.pct / 100), 0);
        }
        expect(await palavrasPartidas(page, '.nav a'), `${r} a ${c.pct}%`).toEqual([]);
        // US-22.CA4 vale até 200%; a 300% só a barra é conferida (o resto do app não promete 300%).
        if (c.pct <= 200) expect(await transbordosForaBug09(page), `${r} a ${c.pct}%`).toEqual([]);
      }
    });
  }

  test('BUG-08 / design 3.15: a 100%, a barra continua com 56 px e uma linha de 4 abas (sem regressão do design)', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO, assinaturas: muitas });
    for (const r of ABAS) {
      await irPara(page, r);
      const alt = await page.locator('.nav ul').evaluate((e) => e.getBoundingClientRect().height);
      expect(alt, r).toBeCloseTo(56, 0);
      const abas = await medirAbas(page);
      for (const a of abas) expect(a.w, `${r} ${a.t}`).toBeCloseTo(90, 0);
    }
  });

  for (const pct of [100, 125, 200, 300]) {
    test(`BUG-08 / US-22.CA4: a ${pct}%, rolando até o fim, a barra de abas não cobre o último conteúdo de nenhuma tela`, async ({ page }) => {
      await abrirS2(page, { relogio: RELOGIO, assinaturas: muitas, pro: true });
      for (const r of ABAS) {
        await irPara(page, r);
        await escala(page, pct);
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
        const m = await page.evaluate(() => {
          const nav = document.querySelector('.nav')!.getBoundingClientRect();
          // Último elemento visível com caixa dentro do conteúdo (folha mais funda do fim).
          let ultimo = 0;
          for (const el of document.querySelectorAll<HTMLElement>('.conteudo *')) {
            if (el.closest('.sr-only, [hidden], dialog:not([open])')) continue;
            const q = el.getBoundingClientRect();
            if (q.width > 0 && q.height > 0) ultimo = Math.max(ultimo, q.bottom);
          }
          return { navTopo: nav.top, ultimo, altVar: getComputedStyle(document.documentElement).getPropertyValue('--altura-nav-atual').trim(), alt: nav.height };
        });
        expect(m.ultimo, `${r} a ${pct}%: último conteúdo em ${m.ultimo}, barra a partir de ${m.navTopo} (${m.altVar})`).toBeLessThanOrEqual(m.navTopo + 0.5);
        // --altura-nav-atual acompanha a altura real da barra.
        expect(parseFloat(m.altVar), `${r} a ${pct}%`).toBeGreaterThanOrEqual(Math.floor(m.alt) - 1);
      }
    });
  }

  test('BUG-08 / US-22.CA4: voltar de 200% para 100% devolve a barra a 1 linha e o respiro a 56 px', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO, assinaturas: muitas });
    await irPara(page, '#/assinaturas');
    await escala(page, 200);
    expect(parseFloat(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--altura-nav-atual')))).toBeGreaterThan(100);
    await escala(page, 100);
    expect(parseFloat(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--altura-nav-atual')))).toBeCloseTo(56, 0);
  });

  test('BUG-08 / US-22.CA5 + WCAG 2.4.11: a 200%, com Tab pela lista de Assinaturas, o item focado não fica escondido atrás da barra', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO, assinaturas: muitas });
    await irPara(page, '#/assinaturas');
    await escala(page, 200);
    const escondidos: string[] = [];
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(() => {
        const a = document.activeElement as HTMLElement | null;
        if (!a || !a.closest('.conteudo')) return null;
        const q = a.getBoundingClientRect();
        const nav = document.querySelector('.nav')!.getBoundingClientRect();
        // Totalmente coberto = começa abaixo do topo da barra.
        return { nome: a.textContent?.trim().slice(0, 30) ?? a.tagName, coberto: q.top >= nav.top - 0.5, topo: q.top, navTopo: nav.top };
      });
      if (f?.coberto) escondidos.push(`${f.nome} (topo ${Math.round(f.topo)}, barra ${Math.round(f.navTopo)})`);
    }
    expect(escondidos).toEqual([]);
  });
});

test.describe('Reteste 2 sprint 3 — desvio (b): número grande limitado a 19cqi', () => {
  const casos = [
    { nome: 'mensal de 5 dígitos', subs: [sub({ id: 'g', nome: 'Grande', valorCentavos: 9999999, proxima: '2026-10-19', diaRef: 19 })], detalhe: 'g' },
    { nome: 'anual de 4 dígitos', subs: [sub({ id: 'a', nome: 'Assinatura anual com nome longo', valorCentavos: 123456, ciclo: 'anual', proxima: '2027-01-15', diaRef: 15 })], detalhe: 'a' },
    { nome: 'mensal pequeno', subs: [sub({ id: 'p', nome: 'Pequena', valorCentavos: 990, proxima: '2026-10-19', diaRef: 19 })], detalhe: 'p' },
  ];

  /** Mede um número grande: fonte, largura do bloco, se "R$ n" quebrou, se o sufixo desceu e se algo saiu da tela. */
  async function medirNumero(page: Page, testid: string) {
    return page.getByTestId(testid).evaluate((el) => {
      const valor = el.querySelector('.valor')!;
      const rects = (n: Element) => [...n.getClientRects()].filter((q) => q.width > 0);
      const linhas = (qs: DOMRect[]) => new Set(qs.map((q) => Math.round(q.bottom))).size;
      const rv = document.createRange(); rv.selectNodeContents(valor);
      const vq = [...rv.getClientRects()].filter((q) => q.width > 0);
      const partiu = vq.some((a) => vq.some((b) => b.top >= a.bottom - 1));
      const suf = el.querySelector('.sufixo');
      const bloco = el.parentElement!.getBoundingClientRect();
      const q = el.getBoundingClientRect();
      const v = valor.getBoundingClientRect();
      const s = suf?.getBoundingClientRect();
      return {
        fonte: parseFloat(getComputedStyle(el).fontSize),
        larguraBloco: bloco.width,
        partiu,
        sufixoLinhas: suf ? linhas(rects(suf)) : 0,
        sufixoDesceu: s ? s.top >= v.bottom - 1 : false,
        cabeNaLinha: s ? v.width + s.width <= q.width : true,
        direita: Math.max(q.right, v.right, s?.right ?? 0),
        esquerda: Math.min(q.left, v.left),
        texto: el.textContent,
      };
    });
  }

  for (const c of casos) {
    for (const pct of [100, 200, 300]) {
      test(`BUG-08 / US-22.CA4 + design 2.5: valor ${c.nome} a ${pct}% — cresce em rem até 19cqi, "R$ n" não quebra e nada sai da tela`, async ({ page }) => {
        await abrirS2(page, { relogio: RELOGIO, assinaturas: c.subs });
        const telas: [string, string][] = [['#/', 'inicio-total'], ['#/totais', 'total-mensal'], [`#/assinatura/${c.detalhe}`, 'detalhe-valor']];
        for (const [rota, id] of telas) {
          await irPara(page, rota);
          await escala(page, pct);
          const m = await medirNumero(page, id);
          const ctx = `${rota} ${id} a ${pct}%: ${JSON.stringify(m)}`;
          // min(2,5rem, 19cqi): nunca maior que 2,5rem nem que 19% da largura do bloco.
          expect(m.fonte, ctx).toBeLessThanOrEqual(40 * (pct / 100) + 0.5);
          expect(m.fonte, ctx).toBeLessThanOrEqual(0.19 * m.larguraBloco + 0.5);
          // A 100% fica nos 40 px do design; com texto maior cresce (antes do BUG-08 parava em 43 px).
          if (pct === 100) expect(m.fonte, ctx).toBeCloseTo(40, 0);
          else expect(m.fonte, ctx).toBeGreaterThan(55);
          expect(m.partiu, `${ctx}: "R$ n" quebrou`).toBe(false);
          expect(m.direita, ctx).toBeLessThanOrEqual(360.5);
          expect(m.esquerda, ctx).toBeGreaterThanOrEqual(-0.5);
          if (id === 'detalhe-valor') {
            // O sufixo nunca parte e só desce quando não cabe junto ao valor.
            expect(m.sufixoLinhas, ctx).toBe(1);
            if (m.cabeNaLinha) expect(m.sufixoDesceu, ctx).toBe(false);
          }
          if (pct <= 200) expect(await transbordosForaBug09(page), ctx).toEqual([]);
        }
      });
    }
  }

  test('BUG-08 / design 2.5 (regra de DOM): o textContent do número grande continua o de formatarBRL + sufixo, sem caracteres extras', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO, assinaturas: casos[1].subs });
    await irPara(page, '#/assinatura/a');
    expect(await page.getByTestId('detalhe-valor').textContent()).toMatch(/^R\$ ?\s?1\.234,56\/ano$/);
    await irPara(page, '#/totais');
    expect(await page.getByTestId('total-mensal').textContent()).toMatch(/^R\$\s?102,88$/);
  });

  test('BUG-08 / design 2.5: a 200% no Detalhe, com valor anual alto, o sufixo "/ano" desce inteiro para a linha de baixo', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO, assinaturas: [sub({ id: 'x', nome: 'X', valorCentavos: 9999999, ciclo: 'anual', proxima: '2027-01-15', diaRef: 15 })] });
    await irPara(page, '#/assinatura/x');
    await escala(page, 200);
    const m = await medirNumero(page, 'detalhe-valor');
    expect(m.partiu).toBe(false);
    expect(m.sufixoDesceu, JSON.stringify(m)).toBe(true);
    expect(m.sufixoLinhas).toBe(1);
    expect(m.direita).toBeLessThanOrEqual(360.5);
  });
});

// BUG-09 (aberto no reteste 2; falha hoje): o "Por ano" dos Totais é nowrap ao lado do rótulo e sai da tela com texto grande.
test.describe('Reteste 2 sprint 3 — Totais "Por ano" com texto grande', () => {
  test('BUG-09 / US-22.CA4: a 200%, com total anual de 6 dígitos (R$ 100.000,08), o "Por ano" fica dentro da tela; a 300%, com qualquer valor', async ({ page }) => {
    const falhas: string[] = [];
    for (const [pct, centavos] of [[200, 833334], [300, 10288]] as const) {
      await abrirS2(page, { relogio: RELOGIO, assinaturas: [sub({ id: 't', nome: 'T', valorCentavos: centavos, proxima: '2026-10-19', diaRef: 19 })] });
      await irPara(page, '#/totais');
      await escala(page, pct);
      const q = await page.getByTestId('total-anual').evaluate((e) => ({ t: e.textContent, r: e.getBoundingClientRect().right }));
      if (q.r > 360.5) falhas.push(`${pct}%: "${q.t}" vai até ${Math.round(q.r)} px de 360`);
    }
    expect(falhas).toEqual([]);
  });
});
