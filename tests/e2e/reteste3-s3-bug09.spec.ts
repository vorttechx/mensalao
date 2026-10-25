// Reteste 3 da sprint 3 (D2, rodada 3): BUG-09 (dev-notes.md §12) contra a US-22.CA4 e o design 2.5 / 4.6.
// Em Totais, o valor "Por ano" (`total-anual`) não sai da tela nem parte "R$ n" com o texto do sistema a 100%, 125%,
// 150%, 200% e 300%, em 360 px; quando não cabe ao lado do rótulo, desce inteiro e fica alinhado à direita.
// Inclui o BUG-10 (aberto neste reteste; falha hoje): o número grande com 6 dígitos (R$ 100.000,00/mês ou mais)
// passa 3 px da borda a 200% em Início, Totais e Detalhe.
import { expect, test, type Page } from '@playwright/test';
import { abrirS2, sub } from './helpers2';
import { transbordos } from './helpers3';

const RELOGIO = '2026-10-18T12:00:00-03:00';

async function escala(page: Page, pct: number) {
  await page.evaluate((p) => document.documentElement.style.setProperty('font-size', `${p}%`, 'important'), pct);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

/** Mede o rótulo e o valor da linha "Por ano". */
async function medirPar(page: Page) {
  return page.getByTestId('total-anual').evaluate((v) => {
    const par = v.parentElement!;
    const rot = par.firstElementChild as HTMLElement;
    const linhas = (el: Element) => {
      const r = document.createRange();
      r.selectNodeContents(el);
      return new Set([...r.getClientRects()].filter((q) => q.width > 0).map((q) => Math.round(q.top))).size;
    };
    const qv = v.getBoundingClientRect();
    const qr = rot.getBoundingClientRect();
    const qp = par.getBoundingClientRect();
    const cs = getComputedStyle(par);
    return {
      texto: v.textContent ?? '',
      direita: qv.right, esquerda: qv.left,
      direitaPar: qp.right - parseFloat(cs.paddingRight),
      fonte: parseFloat(getComputedStyle(v).fontSize),
      linhasValor: linhas(v), linhasRotulo: linhas(rot),
      desceu: qv.top >= qr.bottom - 1,
      vw: document.documentElement.clientWidth,
    };
  });
}

// Mensalidade em centavos → total anual exibido.
const valores: { mes: number; ano: string }[] = [
  { mes: 990, ano: 'R$ 118,80' },
  { mes: 10288, ano: 'R$ 1.234,56' },
  { mes: 833334, ano: 'R$ 100.000,08' },
  { mes: 83333333, ano: 'R$ 9.999.999,96' },
];
const escalas = [100, 125, 150, 200, 300];

test.describe('Reteste 3 sprint 3 — BUG-09: "Por ano" dos Totais com texto grande', () => {
  for (const pct of escalas) {
    test(`BUG-09 / US-22.CA4 + design 2.5: a ${pct}%, "Por ano" dentro da tela, "R$ n" numa linha, à direita, fonte min(19 px × escala, 12cqi)`, async ({ page }) => {
      const falhas: string[] = [];
      for (const v of valores) {
        await abrirS2(page, { relogio: RELOGIO, assinaturas: [sub({ id: 't', nome: 'T', valorCentavos: v.mes, proxima: '2026-10-19', diaRef: 19 })] });
        await page.goto('./#/totais');
        await expect(page.getByTestId('titulo-tela')).toBeVisible();
        await escala(page, pct);
        const m = await medirPar(page);
        const id = `${pct}% ${v.ano}`;
        if (m.texto !== v.ano) falhas.push(`${id}: texto "${m.texto}"`);
        if (m.direita > m.vw + 0.5 || m.esquerda < 0) falhas.push(`${id}: fora da tela (${Math.round(m.esquerda)}..${Math.round(m.direita)})`);
        if (m.linhasValor !== 1) falhas.push(`${id}: valor em ${m.linhasValor} linhas`);
        if (m.linhasRotulo !== 1) falhas.push(`${id}: rótulo em ${m.linhasRotulo} linhas`);
        if (Math.abs(m.direita - m.direitaPar) > 1) falhas.push(`${id}: valor não alinhado à direita (${m.direita} vs ${m.direitaPar})`);
        const esperada = Math.min(19 * pct / 100, 0.12 * 320);
        if (Math.abs(m.fonte - esperada) > 0.2) falhas.push(`${id}: fonte ${m.fonte} px, esperado ${esperada}`);
        // A 100% fica como no design 4.6: ao lado do rótulo, em 19 px.
        if (pct === 100 && m.desceu) falhas.push(`${id}: desceu a 100%`);
        // Até 200% (US-22.CA4) nada da tela de Totais transborda.
        // O número grande com 6 dígitos (R$ 833.333,33/mês) é o BUG-10, com teste próprio abaixo.
        if (pct <= 200) {
          for (const t of await transbordos(page)) {
            if (v.mes >= 10_000_000 && /span\.(valor|ct)\[/.test(t)) continue;
            falhas.push(`${id}: ${t}`);
          }
        }
      }
      expect(falhas).toEqual([]);
    });
  }
});

// BUG-10 (aberto no reteste 3; falha hoje): o número grande (`min(2,5rem, 19cqi)`) com 6 dígitos passa da tela a 200%.
test.describe('Reteste 3 sprint 3 — número grande com 6 dígitos a 200%', () => {
  test('BUG-10 / US-22.CA4: a 200%, com R$ 100.000,00 por mês, o número grande de Início, Totais e Detalhe fica dentro da tela', async ({ page }) => {
    const falhas: string[] = [];
    for (const rota of ['#/', '#/totais', '#/assinatura/t']) {
      await abrirS2(page, { relogio: RELOGIO, assinaturas: [sub({ id: 't', nome: 'T', valorCentavos: 10_000_000, proxima: '2026-10-19', diaRef: 19 })] });
      await page.goto('./' + rota);
      await expect(page.getByTestId('titulo-tela')).toBeVisible();
      await escala(page, 200);
      const q = await page.evaluate(() => ({
        valores: [...document.querySelectorAll('.dinheiro-grande .valor')].map((e) => ({ t: e.textContent, r: e.getBoundingClientRect().right })),
        sw: document.documentElement.scrollWidth,
      }));
      for (const v of q.valores) if (v.r > 360.5) falhas.push(`${rota}: "${v.t}" vai até ${Math.round(v.r)} px de 360`);
      if (q.sw > 360) falhas.push(`${rota}: rolagem horizontal (${q.sw} px)`);
    }
    expect(falhas).toEqual([]);
  });
});
