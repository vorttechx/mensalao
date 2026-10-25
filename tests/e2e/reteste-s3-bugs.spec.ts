// Reteste da sprint 3 (D2, rodada 1): verificações específicas de cada bug, além das gerais de
// us20-inicio.spec.ts e us22-telas.spec.ts. Janela 360×780, texto a 200% onde o bug é de texto grande.
import { expect, test, type Page } from '@playwright/test';
import { abrirS2, sub } from './helpers2';
import { texto200 } from './helpers3';

const RELOGIO = '2026-10-18T12:00:00-03:00';
const LONGO = 'Assinatura com um nome realmente muito longo para caber';
const dados = [
  sub({ id: 'sp', nome: 'Spotify', catalogoId: 'spotify', valorCentavos: 2190, proxima: '2026-10-19', diaRef: 19, categoria: 'Música', pagamento: 'pix', banco: 'Banco com nome bem comprido' }),
  sub({ id: 'nf', nome: 'Netflix', catalogoId: 'netflix', proxima: '2026-10-20', diaRef: 20, historico: [{ data: '2026-09-01', deCentavos: 3990, paraCentavos: 4490 }] }),
  sub({ id: 'lg', nome: LONGO, valorCentavos: 123456, categoria: 'Streaming', ciclo: 'anual', proxima: '2027-01-15', diaRef: 15 }),
  sub({ id: 'ac', nome: 'Academia', catalogoId: 'academia', valorCentavos: 9990, proxima: '2026-11-05', diaRef: 5 }),
];
const COPIAS = [{ id: 'c', criadaEm: '2026-09-20T08:00', quantidade: 2, conteudo: '{}' }];

/** Retângulos de linha de um trecho de texto (Range); mais de um topo distinto = o trecho quebrou de linha. */
async function trechosPartidos(page: Page, seletor: string, padrao: string): Promise<string[]> {
  return page.evaluate(({ seletor, padrao }) => {
    const re = new RegExp(padrao, 'g');
    const ruins: string[] = [];
    for (const raiz of document.querySelectorAll(seletor)) {
      if ((raiz as HTMLElement).closest('.sr-only, [hidden]')) continue;
      const texto = raiz.textContent ?? '';
      // Mapeia o texto concatenado para os nós de texto, para o trecho poder atravessar <span>.
      const nos: { no: Text; ini: number }[] = [];
      let pos = 0;
      const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode() as Text | null; n; n = w.nextNode() as Text | null) { nos.push({ no: n, ini: pos }); pos += n.data.length; }
      const achar = (i: number) => { const x = [...nos].reverse().find((k) => k.ini <= i)!; return [x.no, i - x.ini] as const; };
      for (const m of texto.matchAll(re)) {
        const r = document.createRange();
        const [a, ia] = achar(m.index!);
        const [b, ib] = achar(m.index! + m[0].length - 1);
        r.setStart(a, ia); r.setEnd(b, ib + 1);
        // Linhas diferentes = dois retângulos sem sobreposição vertical (o "R$" menor e elevado fica na mesma linha).
        const qs = [...r.getClientRects()].filter((q) => q.width > 0);
        const partiu = qs.some((a) => qs.some((b) => b.top >= a.bottom - 1));
        const onde = a.parentElement?.closest<HTMLElement>('[data-testid]')?.dataset.testid ?? (raiz as HTMLElement).dataset.testid ?? raiz.className;
        if (partiu) ruins.push(`"${m[0]}" em ${onde}`);
      }
    }
    return ruins;
  }, { seletor, padrao });
}

test.describe('Reteste sprint 3 — BUG-01 a BUG-06', () => {
  test('BUG-01 / US-20.CA4 + design 3.11: com 3 ou mais lembretes o aviso mede no máximo 184 px e a nota não estoura', async ({ page }) => {
    const varios = [1, 2, 3, 4].map((i) => sub({ id: `l${i}`, nome: `Serviço ${i}`, proxima: `2026-10-${18 + (i % 2)}`, diaRef: 18 + (i % 2) }));
    await abrirS2(page, { relogio: RELOGIO, pro: true, prefs: { lembrete: { ativo: true, dias: 3 } }, assinaturas: varios });
    const caixa = (await page.getByTestId('lembrete-aviso').boundingBox())!;
    expect(caixa.height).toBeLessThanOrEqual(184.5);
    // A nota cabe em até 2 linhas (era 3, 56,5 px).
    const nota = page.getByTestId('lembrete-limite-texto');
    if (await nota.count()) {
      const linhas = await nota.evaluate((e) => Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)));
      expect(linhas).toBeLessThanOrEqual(2);
    }
  });

  test('BUG-02 / US-22.CA4: a 200%, as quatro abas ficam dentro da tela, com 1/4 da largura e rótulos inteiros', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO, assinaturas: dados });
    for (const r of ['#/', '#/assinaturas', '#/totais', '#/ajustes']) {
      await page.goto('./' + r);
      await texto200(page);
      const abas = await page.locator('.nav a').evaluateAll((els) => els.map((e) => {
        const q = e.getBoundingClientRect();
        return { t: e.textContent?.trim(), l: q.left, r: q.right, w: q.width, h: q.height, sw: e.scrollWidth, cw: e.clientWidth };
      }));
      expect(abas.map((a) => a.t), r).toEqual(['Início', 'Assinaturas', 'Totais', 'Ajustes']);
      for (const a of abas) {
        expect(a.l, `${r} ${a.t}`).toBeGreaterThanOrEqual(-1);
        expect(a.r, `${r} ${a.t}`).toBeLessThanOrEqual(361);
        expect(a.w, `${r} ${a.t}`).toBeGreaterThanOrEqual(88);
        expect(a.sw, `${r} ${a.t} cortado`).toBeLessThanOrEqual(a.cw + 1);
        expect(a.h, `${r} ${a.t}`).toBeGreaterThanOrEqual(56);
      }
      // "Assinaturas" inteiro em uma linha, sem partir a palavra.
      expect(await trechosPartidos(page, '.nav a', '[A-Za-zÀ-ú]+'), r).toEqual([]);
    }
  });

  test('BUG-03 / US-22.CA4 + US-21.CA3: a 200%, o nome nas listas é legível e as iniciais ficam dentro do monograma', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO, assinaturas: dados });
    for (const r of ['#/assinaturas', '#/']) {
      await page.goto('./' + r);
      await texto200(page);
      // O nome longo usa a largura toda (o valor desce): bem mais que os 23 px de antes, e a 1ª palavra inteira.
      const nome = page.getByTestId('item-nome').filter({ hasText: 'Assinatura com' }).first();
      const largura = (await nome.boundingBox())!.width;
      expect(largura, r).toBeGreaterThan(200);
      expect(await trechosPartidos(page, '[data-testid="item-nome"]', 'Assinatura|Academia|Netflix|Spotify'), r).toEqual([]);
      // Valor inteiro, sem quebrar, dentro da tela.
      expect(await trechosPartidos(page, '[data-testid="item-valor"]', 'R\\$\\s?[\\d.]+,\\d{2}'), r).toEqual([]);
    }
    for (const r of ['#/assinaturas', '#/nova', '#/assinatura/nf']) {
      await page.goto('./' + r);
      await texto200(page);
      const vazados = await page.locator('.mono').evaluateAll((els) => els.flatMap((m) => {
        const q = m.getBoundingClientRect();
        if (q.width === 0) return [];
        const rg = document.createRange(); rg.selectNodeContents(m);
        const t = rg.getBoundingClientRect();
        return t.left < q.left - 0.5 || t.right > q.right + 0.5 || t.top < q.top - 0.5 || t.bottom > q.bottom + 0.5
          ? [`${m.textContent} ${Math.round(t.width)}×${Math.round(t.height)} em ${Math.round(q.width)}`] : [];
      }));
      expect(vazados, r).toEqual([]);
    }
  });

  test('BUG-04 / US-22.CA4: a 200%, no Detalhe o valor fica na tela, sem sobrepor o título, e os dados não quebram no meio da palavra', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO, assinaturas: dados });
    for (const id of ['lg', 'nf']) {
      await page.goto(`./#/assinatura/${id}`);
      await texto200(page);
      const valor = (await page.getByTestId('detalhe-valor').boundingBox())!;
      expect(valor.x, id).toBeGreaterThanOrEqual(0);
      expect(valor.x + valor.width, id).toBeLessThanOrEqual(360.5);
      const titulo = (await page.getByTestId('titulo-tela').boundingBox())!;
      const cabeca = (await page.locator('.cabeca-detalhe').boundingBox())!;
      expect(titulo.y + titulo.height, `${id}: título invade o bloco do valor`).toBeLessThanOrEqual(cabeca.y + 0.5);
      const marca = page.getByTestId('badge-reajuste');
      if (await marca.count()) {
        const m = (await marca.first().boundingBox())!;
        expect(m.x + m.width, `${id}: marca de reajuste`).toBeLessThanOrEqual(360.5);
      }
      // "15/01/2027", "Streaming" e demais valores dos dados: nenhuma palavra partida.
      expect(await trechosPartidos(page, '[data-testid="detalhe-dados"] dd', '\\S+'), id).toEqual([]);
      expect(await trechosPartidos(page, '[data-testid="price-history"] .lin', 'R\\$\\s?[\\d.]+,\\d{2}'), id).toEqual([]);
    }
  });

  test('BUG-05 / US-22.CA4: a 200%, "Restaurar" nas cópias guardadas fica inteiro dentro do grupo (Pro)', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO, pro: true, assinaturas: dados, prefs: { backup: { ativo: true, inicioPro: '2026-08-01' } }, copias: COPIAS, hash: '#/ajustes' });
    await texto200(page);
    const grupo = (await page.getByTestId('copias-lista').boundingBox())!;
    const botoes = page.getByTestId('copia-restaurar');
    expect(await botoes.count()).toBeGreaterThan(0);
    for (const b of await botoes.all()) {
      const q = (await b.boundingBox())!;
      expect(q.x + q.width).toBeLessThanOrEqual(grupo.x + grupo.width + 0.5);
      expect(await b.evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
      await expect(b).toHaveText('Restaurar');
    }
    expect(await page.getByTestId('copias-lista').evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  });

  test('BUG-06 / design 2.1 + 5.1: recarregar o Início sem interação não mostra anel no título; Tab depois mostra o anel nos interativos', async ({ page }) => {
    await abrirS2(page, { relogio: RELOGIO, assinaturas: dados });
    await page.reload();
    await expect(page.getByTestId('titulo-tela')).toBeFocused();
    expect(await page.getByTestId('titulo-tela').evaluate((e) => getComputedStyle(e).outlineStyle)).toBe('none');
    await page.keyboard.press('Tab');
    const anel = await page.evaluate(() => { const a = document.activeElement as HTMLElement; const s = getComputedStyle(a); return `${s.outlineStyle} ${s.outlineWidth}`; });
    expect(anel).toBe('solid 3px');
  });
});

// BUG-07 (aberto no reteste): a 200%, "R$" e o número se separam na marca de reajuste e no lembrete do Início.
test.describe('Reteste sprint 3 — design 2.5 / 6: valores, "R$" e % não quebram a 200%', () => {
  test('BUG-07 / design 2.5 + 6: nenhum valor "R$ n" nem percentual quebra de linha em nenhuma tela a 200%', async ({ page }) => {
    const reaj = [...dados, sub({ id: 'dz', nome: 'Deezer com nome comprido de verdade', valorCentavos: 4500, proxima: '2026-10-21', diaRef: 21, historico: [{ data: '2026-09-01', deCentavos: 4000, paraCentavos: 4500 }] })];
    await abrirS2(page, { relogio: RELOGIO, pro: true, assinaturas: reaj, prefs: { lembrete: { ativo: true, dias: 3 } } });
    const falhas: string[] = [];
    for (const r of ['#/', '#/assinaturas', '#/totais', '#/assinatura/dz', '#/assinatura/lg', '#/assinatura/nf']) {
      await page.goto('./' + r);
      await expect(page.getByTestId('titulo-tela')).toBeVisible();
      await texto200(page);
      falhas.push(...(await trechosPartidos(page, '.conteudo', 'R\\$\\s?[\\d.]+,\\d{2}|\\d+(,\\d+)?\\s?%')).map((f) => `${r} ${f}`));
    }
    expect([...new Set(falhas)]).toEqual([]);
  });
});
