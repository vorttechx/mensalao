// Conformidade das telas da sprint 2 (Pro, Ajustes, Totais, diálogos) com o design.md da sprint 3 (seções 3.1, 3.14,
// 3.16, 4.7 a 4.10 e 6), nos itens verificáveis por máquina. A verificação geral das telas está em us22-telas.spec.ts.
import { expect, test } from '@playwright/test';
import { abrirS2, ativas, semRolagemHorizontal, sub } from './helpers2';
import { transbordos } from './helpers3';

const dados = [
  ...ativas(3),
  sub({ id: 'p', nome: 'Pausada', status: 'pausada', categoria: 'Música' }),
  sub({ id: 'l', nome: 'Amanha', proxima: '2026-10-01', categoria: 'Compras' }),
];
const rotas = ['#/', '#/assinaturas', '#/totais', '#/ajustes', '#/pro'];

for (const pro of [false, true]) {
  test.describe(`Design sprint 3 nas telas da sprint 2 (${pro ? 'Pro' : 'grátis'})`, () => {
    test(`sem rolagem horizontal em 360 px em todas as telas (${pro ? 'Pro' : 'grátis'})`, async ({ page }) => {
      await abrirS2(page, { pro, assinaturas: dados, prefs: { lembrete: { ativo: true, dias: 3 }, backup: { ativo: true, inicioPro: '2026-08-01' } } });
      for (const r of rotas) {
        await page.goto('./' + r);
        await expect(page.getByTestId('titulo-tela')).toBeVisible();
        await semRolagemHorizontal(page);
        expect(await transbordos(page), `rota ${r}`).toEqual([]);
      }
    });

    test(`alvos de toque >= 44 px nas telas novas (${pro ? 'Pro' : 'grátis'})`, async ({ page }) => {
      await abrirS2(page, { pro, assinaturas: dados, copias: [{ id: 'c', criadaEm: '2026-09-20T08:00', quantidade: 2, conteudo: '{}' }] });
      for (const r of ['#/ajustes', '#/pro', '#/totais', '#/']) {
        await page.goto('./' + r);
        await expect(page.getByTestId('titulo-tela')).toBeVisible();
        const pequenos = await page.evaluate(() => {
          const alvos = [...document.querySelectorAll<HTMLElement>('button, a[href], input:not([type=hidden]), select, summary')];
          return alvos
            .filter((el) => {
              const cs = getComputedStyle(el);
              const rect = el.getBoundingClientRect();
              if (rect.width === 0 || rect.height === 0 || cs.visibility === 'hidden') return false;
              // rótulo associado conta como área de toque (interruptores e rádios)
              const rotulo = el.closest('label');
              const r = rotulo ? rotulo.getBoundingClientRect() : rect;
              return r.height < 43.5 || r.width < 43.5;
            })
            .map((el) => `${el.tagName}[${el.getAttribute('data-testid') ?? el.textContent?.trim().slice(0, 25)}]`);
        });
        expect(pequenos, `rota ${r}`).toEqual([]);
      }
    });

    test(`todos os controles têm nome acessível e imagens/SVG decorativos escondidos (${pro ? 'Pro' : 'grátis'})`, async ({ page }) => {
      await abrirS2(page, { pro, assinaturas: dados });
      for (const r of ['#/ajustes', '#/pro', '#/totais']) {
        await page.goto('./' + r);
        await expect(page.getByTestId('titulo-tela')).toBeVisible();
        const sem = await page.evaluate(() => {
          const els = [...document.querySelectorAll<HTMLElement>('button, a[href], input:not([type=hidden]):not([type=file]), select')];
          return els
            .filter((el) => {
              const nome = el.getAttribute('aria-label') || el.textContent?.trim() || (el as HTMLInputElement).labels?.[0]?.textContent?.trim() || el.getAttribute('aria-labelledby');
              return !nome;
            })
            .map((el) => el.outerHTML.slice(0, 80));
        });
        expect(sem, `rota ${r}`).toEqual([]);
      }
    });
  });
}

test.describe('Design 3.14 / 4.10: diálogo de limite', () => {
  test('foco vai para o diálogo, Esc fecha e devolve o foco, e o botão principal é o de "Conhecer o Pro"', async ({ page }) => {
    await abrirS2(page, { assinaturas: ativas(5) });
    await page.getByTestId('btn-adicionar').click();
    await expect(page.getByTestId('limite-aviso')).toBeVisible();
    const dentro = await page.evaluate(() => !!document.activeElement?.closest('[data-testid="limite-aviso"]'));
    expect(dentro).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('limite-aviso')).toHaveCount(0);
    await expect(page.getByTestId('btn-adicionar')).toBeFocused();
  });
  test('texto do diálogo sem tom de culpa ou urgência', async ({ page }) => {
    await abrirS2(page, { assinaturas: ativas(5) });
    await page.getByTestId('btn-adicionar').click();
    const t = (await page.getByTestId('limite-aviso').innerText()).toLowerCase();
    for (const p of ['bloquead', 'urgente', 'agora!', 'última chance', 'erro']) expect(t).not.toContain(p);
  });
  test('design 3.14: diálogo sem ícone, foco inicial em "Agora não" e "Conhecer o Pro" empilhado em cima em 360 px', async ({ page }) => {
    await abrirS2(page, { assinaturas: ativas(5) });
    await page.getByTestId('btn-adicionar').click();
    await expect(page.getByTestId('limite-btn-agora-nao')).toBeFocused();
    expect(await page.getByTestId('limite-aviso').locator('svg').count()).toBe(0);
    const pro = (await page.getByTestId('limite-btn-pro').boundingBox())!;
    const nao = (await page.getByTestId('limite-btn-agora-nao').boundingBox())!;
    expect(pro.y).toBeLessThan(nao.y);
  });
});

test.describe('Design 3.16: recurso Pro no grátis sem cadeado, tracejado nem cinza de desabilitado', () => {
  test('cartões lock-* em Ajustes e Totais com carimbo Pro e botão de nome completo', async ({ page }) => {
    await abrirS2(page, { assinaturas: ativas(2), hash: '#/ajustes' });
    for (const id of ['lock-lembrete', 'lock-backup', 'lock-csv', 'lock-aparencia', 'lock-temas']) {
      const c = page.getByTestId(id);
      await expect(c, id).toBeVisible();
      await expect(c.getByTestId('lock-btn-pro'), id).toHaveAccessibleName(/^Conhecer o Pro para /);
      const borda = await c.evaluate((e) => [...e.querySelectorAll<HTMLElement>('*')].concat(e as HTMLElement).map((x) => getComputedStyle(x).borderStyle).filter((b) => b.includes('dashed')));
      expect(borda, id).toEqual([]);
    }
    await page.goto('./#/totais');
    await expect(page.getByTestId('lock-grafico').getByTestId('lock-btn-pro')).toBeVisible();
  });
});
