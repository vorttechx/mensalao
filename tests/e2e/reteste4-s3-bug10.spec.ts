// Reteste 4 da sprint 3 (D2, rodada 4): BUG-10 (dev-notes.md §13) contra a US-22.CA4 e o design 2.5.
// O número grande (`.dinheiro-grande`) de Início (total do mês), Totais (total por mês) e Detalhe (valor da
// assinatura) fica dentro da tela, sem rolagem horizontal e sem partir "R$ n", em 360 px, com o texto do sistema
// a 100%, 150% e 200% e valores de 5, 6 e 7 dígitos (incluindo os limiares R$ 100.000,00 e R$ 1.000.000,00).
// Teto da fonte (CSS do design): min(40 px × escala, k × largura do bloco), com k = 17,5cqi, ou 15cqi com 7 dígitos
// ou mais. Reteste 5 (dev-notes §14, ajuste ao espaço real): a fonte real depende da fonte do sistema (Inter aqui,
// DejaVu Sans no CI). O teste confere o teto, e que a fonte fica no teto quando o texto cabe nele (com Inter, a
// fórmula exata; a 100%, os 40 px do design), ou abaixo, em ≥ 16 px e o maior tamanho que cabe, quando não cabe.
import { expect, test, type Page } from '@playwright/test';
import { formatarBRL } from '../../src/domain/dinheiro';
import { abrirS2, sub } from './helpers2';
import { conferirAjuste, medirAjuste, transbordos } from './helpers3';

const RELOGIO = '2026-10-18T12:00:00-03:00';

async function escala(page: Page, pct: number) {
  await page.evaluate((p) => document.documentElement.style.setProperty('font-size', `${p}%`, 'important'), pct);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

const telas = [
  { nome: 'Início', rota: '#/', testid: 'inicio-total' },
  { nome: 'Totais', rota: '#/totais', testid: 'total-mensal' },
  { nome: 'Detalhe', rota: '#/assinatura/t', testid: 'detalhe-valor' },
];
// Centavos por mês: 5 dígitos, limiar de 6, 6 dígitos, limiar de 7, 7 dígitos.
const valores = [9_999_999, 10_000_000, 99_999_999, 100_000_000, 999_999_999];
const escalas = [100, 150, 200];

test.describe('Reteste 4 sprint 3 — BUG-10: número grande com 5, 6 e 7 dígitos', () => {
  for (const t of telas) {
    for (const pct of escalas) {
      test(`BUG-10 / US-22.CA4 + design 2.5: ${t.nome} a ${pct}%, número grande dentro da tela, "R$ n" numa linha, fonte ≤ teto min(40 px × escala, 17,5cqi | 15cqi), no teto quando cabe, ≥ 16 px`, async ({ page }) => {
        const falhas: string[] = [];
        for (const c of valores) {
          await abrirS2(page, { relogio: RELOGIO, assinaturas: [sub({ id: 't', nome: 'T', valorCentavos: c, proxima: '2026-10-19', diaRef: 19 })] });
          await page.goto('./' + t.rota);
          await expect(page.getByTestId('titulo-tela')).toBeVisible();
          await escala(page, pct);
          const m = await page.getByTestId(t.testid).evaluate((el) => {
            const v = el.querySelector('.valor') as HTMLElement;
            let bloco: HTMLElement | null = el.parentElement;
            while (bloco && getComputedStyle(bloco).containerType !== 'inline-size') bloco = bloco.parentElement;
            const cb = bloco!.getBoundingClientRect();
            const cs = getComputedStyle(bloco!);
            // "R$", número e centavos têm alinhamentos verticais diferentes; uma quebra é um trecho que recomeça à esquerda.
            const textos = document.createTreeWalker(v, NodeFilter.SHOW_TEXT);
            let linhas = 1;
            let ultimo = -Infinity;
            for (let n = textos.nextNode(); n; n = textos.nextNode()) {
              const r = document.createRange();
              r.selectNodeContents(n);
              for (const q of [...r.getClientRects()].filter((x) => x.width > 0)) {
                if (q.left < ultimo - 1) linhas++;
                ultimo = q.right;
              }
            }
            const qv = v.getBoundingClientRect();
            return {
              texto: v.textContent ?? '',
              esquerda: qv.left, direita: qv.right,
              fimBloco: cb.right - parseFloat(cs.paddingRight),
              larguraBloco: cb.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
              fonte: parseFloat(getComputedStyle(el).fontSize),
              longo: el.classList.contains('longo'),
              linhas,
              vw: document.documentElement.clientWidth,
              sw: document.documentElement.scrollWidth,
            };
          });
          const id = `${t.nome} ${pct}% ${formatarBRL(c)}`;
          if (m.texto !== formatarBRL(c)) falhas.push(`${id}: texto "${m.texto}"`);
          if (m.direita > m.vw + 0.5 || m.esquerda < 0) falhas.push(`${id}: fora da tela (${Math.round(m.esquerda)}..${Math.round(m.direita)} de ${m.vw})`);
          if (m.direita > m.fimBloco + 0.5) falhas.push(`${id}: passa do bloco (${m.direita.toFixed(1)} > ${m.fimBloco.toFixed(1)})`);
          if (m.sw > m.vw && !(c >= 833_333_334 && t.testid === 'total-mensal' && pct === 200)) falhas.push(`${id}: rolagem horizontal (${m.sw} px)`);
          if (m.linhas !== 1) falhas.push(`${id}: "R$ n" em ${m.linhas} linhas`);
          const seteDigitos = c >= 100_000_000;
          if (m.longo !== seteDigitos) falhas.push(`${id}: classe .longo = ${m.longo}`);
          // Teto do design (CSS, independe da fonte) e o ajuste ao espaço real abaixo dele.
          const teto = Math.min(40 * pct / 100, (seteDigitos ? 0.15 : 0.175) * m.larguraBloco);
          const a = await medirAjuste(page, t.testid, '.valor');
          if (Math.abs(a.teto - teto) > 0.2) falhas.push(`${id}: teto do CSS ${a.teto} px, esperado ${teto.toFixed(2)}`);
          falhas.push(...conferirAjuste(a, id));
          // A 100% o número grande fica nos 40 px do design (--texto-2xl) até 6 dígitos sempre que couber (com Inter,
          // sempre). Com 7 dígitos, no Detalhe (bloco ao lado do monograma, 256 px), o teto é 15cqi = 38,4 px.
          if (pct === 100 && !seteDigitos && a.cabeNoTeto && Math.abs(m.fonte - 40) > 0.2) falhas.push(`${id}: a 100% a fonte é ${m.fonte} px, não 40`);
          // O "Por ano" dos Totais com 9 dígitos (R$ 9.999.999,99/mês = R$ 119.999.999,88/ano) é o BUG-11, com teste próprio.
          for (const f of await transbordos(page)) {
            if (c >= 833_333_334 && /total-anual/.test(f)) continue;
            falhas.push(`${id}: ${f}`);
          }
        }
        expect(falhas).toEqual([]);
      });
    }
  }
});

// BUG-11 (aberto no reteste 4; baixa): sem teto de valor no formulário, quantias irreais saíam da tela.
// Reteste 5: corrigido pelo ajuste ao espaço real (dev-notes §14); o test.fail() saiu e o teste vale como regressão.
test.describe('Reteste 4 sprint 3 — valores de 8 dígitos por mês e 9 dígitos por ano', () => {
  test('BUG-11 / US-22.CA4: a 150% e 200%, com R$ 8.333.333,34 e R$ 10.000.000,00 por mês, Início, Totais e Detalhe ficam dentro da tela', async ({ page }) => {
    const falhas: string[] = [];
    for (const c of [833_333_334, 1_000_000_000]) {
      for (const pct of [150, 200]) {
        for (const rota of ['#/', '#/totais', '#/assinatura/t']) {
          await abrirS2(page, { relogio: RELOGIO, assinaturas: [sub({ id: 't', nome: 'T', valorCentavos: c, proxima: '2026-10-19', diaRef: 19 })] });
          await page.goto('./' + rota);
          await expect(page.getByTestId('titulo-tela')).toBeVisible();
          await escala(page, pct);
          const sw = await page.evaluate(() => document.documentElement.scrollWidth);
          if (sw > 360) falhas.push(`${rota} ${pct}% ${formatarBRL(c)}: rolagem horizontal (${sw} px)`);
          for (const f of await transbordos(page)) falhas.push(`${rota} ${pct}% ${formatarBRL(c)}: ${f}`);
        }
      }
    }
    expect(falhas).toEqual([]);
  });
});
