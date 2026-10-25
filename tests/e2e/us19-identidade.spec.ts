// US-19 — Identidade visual "Extrato": tokens (design 2.1 a 2.3a), contraste AA (2.4), tipografia e números (2.5),
// fonte local/offline (CA4), migração do tema da sprint 2 (CA5) e movimento reduzido (CA6).
import { expect, test } from '@playwright/test';
import { abrirS2, sub } from './helpers2';
import { contraste, MODOS, TEMAS, textosAbaixoDoAA, tokens } from './helpers3';

const COR = ['--cor-fundo', '--cor-fundo-agrupado', '--cor-superficie', '--cor-superficie-2', '--cor-texto', '--cor-texto-2', '--cor-borda', '--cor-marca', '--cor-marca-forte', '--cor-sobre-marca', '--cor-alerta', '--cor-sobre-alerta', '--cor-teste'];

// Valores da seção 2 do design.md aprovado (claro e escuro de cada tema).
const ESPERADO: Record<string, Record<string, Partial<Record<string, string>>>> = {
  'verde-cedula': {
    light: { '--cor-fundo': '#ffffff', '--cor-fundo-agrupado': '#f3f5f2', '--cor-texto': '#14201a', '--cor-texto-2': '#5a6760', '--cor-borda': '#7e8a84', '--cor-marca': '#1d5c3f', '--cor-alerta': '#a3400f', '--cor-teste': '#2f5b9a' },
    dark: { '--cor-fundo': '#0f1512', '--cor-superficie': '#18201b', '--cor-superficie-2': '#1f2923', '--cor-texto': '#e5ece7', '--cor-texto-2': '#a0ada6', '--cor-marca': '#7fcba2', '--cor-alerta': '#ee9a72', '--cor-teste': '#93b4e8', '--cor-sobre-marca': '#0f1512' },
  },
  'azul-noite': {
    light: { '--cor-fundo': '#ffffff', '--cor-fundo-agrupado': '#f2f4f8', '--cor-texto': '#121a2b', '--cor-marca': '#1f4e8c' },
    dark: { '--cor-fundo': '#0e1320', '--cor-superficie': '#161d2d', '--cor-texto': '#e4eaf5', '--cor-marca': '#8fb4f0' },
  },
  grafite: {
    light: { '--cor-fundo': '#ffffff', '--cor-fundo-agrupado': '#f3f3f2', '--cor-texto': '#1b1c1e', '--cor-marca': '#2f3b47' },
    dark: { '--cor-fundo': '#121212', '--cor-superficie': '#1c1c1e', '--cor-texto': '#ececec', '--cor-marca': '#c5cfd9' },
  },
  ameixa: {
    light: { '--cor-fundo': '#ffffff', '--cor-fundo-agrupado': '#f7f3f5', '--cor-texto': '#22161e', '--cor-marca': '#7a2e62' },
    dark: { '--cor-fundo': '#160f14', '--cor-superficie': '#20171e', '--cor-texto': '#f2e9ef', '--cor-marca': '#eba6d4' },
  },
};

const dados = [
  sub({ id: 'sp', nome: 'Spotify', catalogoId: 'spotify', valorCentavos: 2190, proxima: '2026-10-01', diaRef: 1, categoria: 'Música' }),
  sub({ id: 'nf', nome: 'Netflix', catalogoId: 'netflix', historico: [{ data: '2026-09-01', deCentavos: 3990, paraCentavos: 4490 }] }),
  sub({ id: 'mx', nome: 'Max (HBO)', emTeste: true, fimTeste: '2026-10-02', proxima: '2026-10-02', diaRef: 2 }),
  sub({ id: 'ac', nome: 'Academia', valorCentavos: 9990, categoria: 'Saúde e bem-estar', proxima: '2026-10-25', diaRef: 25 }),
  sub({ id: 'pa', nome: 'Deezer', status: 'pausada', categoria: 'Música' }),
];

for (const tema of TEMAS) {
  for (const modo of MODOS) {
    test.describe(`US-19 tema ${tema} (${modo === 'light' ? 'claro' : 'escuro'})`, () => {
      test(`US-19.CA1/CA2: tokens do design e pares de contraste AA (${tema}, ${modo})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: modo });
        await abrirS2(page, { pro: true, prefs: { tema }, assinaturas: dados });
        const t = await tokens(page, COR);
        expect(t).toMatchObject(ESPERADO[tema][modo]);
        const pares: [string, string, number][] = [];
        for (const fundo of ['--cor-fundo', '--cor-fundo-agrupado', '--cor-superficie', '--cor-superficie-2']) {
          for (const texto of ['--cor-texto', '--cor-texto-2', '--cor-marca', '--cor-alerta', '--cor-teste']) pares.push([texto, fundo, 4.5]);
          pares.push(['--cor-borda', fundo, 3]);
        }
        pares.push(['--cor-sobre-marca', '--cor-marca', 4.5], ['--cor-sobre-marca', '--cor-marca-forte', 4.5], ['--cor-sobre-alerta', '--cor-alerta', 4.5]);
        const falhas = pares.filter(([a, b, min]) => contraste(t[a], t[b]) < min).map(([a, b, min]) => `${a} ${t[a]} / ${b} ${t[b]} = ${contraste(t[a], t[b]).toFixed(2)} (< ${min})`);
        expect(falhas).toEqual([]);
      });

      test(`US-19.CA2: todo texto visível das telas principais passa AA (${tema}, ${modo})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: modo });
        await abrirS2(page, { pro: true, prefs: { tema, lembrete: { ativo: true, dias: 3 } }, assinaturas: dados });
        const falhas: string[] = [];
        for (const r of ['#/', '#/assinaturas', '#/totais', '#/ajustes', '#/assinatura/nf', '#/nova', '#/nova/form', '#/pro']) {
          await page.goto('./' + r);
          await expect(page.getByTestId('titulo-tela')).toBeVisible();
          falhas.push(...(await textosAbaixoDoAA(page)).map((f) => `${r} ${f}`));
        }
        expect(falhas).toEqual([]);
      });
    });
  }
}

test.describe('US-19 identidade', () => {
  test('US-19.CA10: com aparência forçada os tokens são exatamente os do modo escolhido (pares AA da 2.4)', async ({ page }) => {
    for (const tema of TEMAS) {
      await page.emulateMedia({ colorScheme: 'light' });
      await abrirS2(page, { pro: true, prefs: { tema, aparencia: 'escuro' } });
      expect(await tokens(page, COR), `${tema} escuro forçado`).toMatchObject(ESPERADO[tema].dark);
      await page.emulateMedia({ colorScheme: 'dark' });
      await abrirS2(page, { pro: true, prefs: { tema, aparencia: 'claro' } });
      expect(await tokens(page, COR), `${tema} claro forçado`).toMatchObject(ESPERADO[tema].light);
    }
  });

  test('US-19.CA2: texto visível passa AA com aparência forçada e diálogo aberto (escuro)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await abrirS2(page, { pro: true, prefs: { aparencia: 'escuro' }, assinaturas: dados, hash: '#/assinatura/nf' });
    await page.getByTestId('btn-excluir').click();
    await expect(page.getByTestId('confirm-dialog')).toBeVisible();
    expect(await textosAbaixoDoAA(page)).toEqual([]);
  });

  test('US-19.CA1: nenhuma sombra no app e raios dos tokens (8 px campo/botão, 12 px grupo)', async ({ page }) => {
    await abrirS2(page, { pro: true, assinaturas: dados, hash: '#/ajustes' });
    const sombras = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('body *')].map((e) => getComputedStyle(e).boxShadow).filter((s) => s !== 'none' && !/inset/.test(s)));
    expect(sombras).toEqual([]);
    expect(await page.locator('.grupo').first().evaluate((e) => getComputedStyle(e).borderTopLeftRadius)).toBe('12px');
    await page.goto('./#/nova/form');
    expect(await page.getByTestId('field-nome').evaluate((e) => getComputedStyle(e).borderTopLeftRadius)).toBe('8px');
    expect(await page.getByTestId('btn-salvar').evaluate((e) => getComputedStyle(e).borderTopLeftRadius)).toBe('8px');
  });

  test('US-19.CA3: algarismos tabulares, textContent igual ao formatarBRL e coluna de valores alinhada', async ({ page }) => {
    await abrirS2(page, { assinaturas: [sub({ id: '1', nome: 'A', valorCentavos: 111 }), sub({ id: '2', nome: 'B', valorCentavos: 99990 }), sub({ id: '3', nome: 'C', valorCentavos: 4490 })], hash: '#/assinaturas' });
    expect(await page.evaluate(() => getComputedStyle(document.body).fontVariantNumeric)).toContain('tabular-nums');
    await expect(page.getByTestId('item-valor')).toHaveText([/^R\$ 1,11/, /^R\$ 999,90/, /^R\$ 44,90/]);
    const direitas = await page.getByTestId('item-valor').evaluateAll((vs) => vs.map((v) => Math.round(v.getBoundingClientRect().right)));
    expect(new Set(direitas).size).toBe(1);
    // "R$ " menor e em tinta clara; reais e centavos do mesmo tamanho na lista (design 2.5).
    const rs = await page.getByTestId('item-valor').first().locator('.rs').evaluate((e) => [getComputedStyle(e).fontSize, getComputedStyle(e).color]);
    expect(rs).toEqual(['13px', 'rgb(90, 103, 96)']);
    await page.getByTestId('nav-totais').click();
    await expect(page.getByTestId('total-mensal')).toHaveText('R$ 1.045,91');
    const grande = await page.getByTestId('total-mensal').evaluate((e) => [getComputedStyle(e).fontSize, getComputedStyle(e).fontWeight]);
    expect(grande).toEqual(['40px', '700']);
  });

  test('US-19.CA4: fonte do sistema, sem @font-face e sem nenhuma requisição externa ao abrir e navegar', async ({ page }) => {
    const externos: string[] = [];
    const fontes: string[] = [];
    page.on('request', (r) => {
      const u = new URL(r.url());
      if (u.hostname !== 'localhost' && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) externos.push(r.url());
      if (r.resourceType() === 'font') fontes.push(r.url());
    });
    await abrirS2(page, { pro: true, assinaturas: dados });
    for (const t of ['nav-assinaturas', 'nav-totais', 'nav-ajustes', 'nav-inicio']) await page.getByTestId(t).click();
    expect(externos).toEqual([]);
    expect(fontes).toEqual([]);
    const faces = await page.evaluate(() => [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules].filter((r) => r instanceof CSSFontFaceRule).map((r) => r.cssText); } catch { return ['inacessível']; } }));
    expect(faces).toEqual([]);
    expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toMatch(/^system-ui/);
  });

  test('US-19.CA4: offline, o app abre com a mesma tipografia (após o primeiro acesso)', async ({ page, context }) => {
    await abrirS2(page, { assinaturas: dados });
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    const online = await page.getByTestId('inicio-total').evaluate((e) => `${getComputedStyle(e).fontFamily}|${e.getBoundingClientRect().width}`);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByTestId('regua-mes')).toBeVisible();
    const offline = await page.getByTestId('inicio-total').evaluate((e) => `${getComputedStyle(e).fontFamily}|${e.getBoundingClientRect().width}`);
    expect(offline).toBe(online);
    await context.setOffline(false);
  });

  test('US-19.CA5: quem escolheu tema Pro na sprint 2 continua nele (prefs sem o campo aparencia)', async ({ page }) => {
    for (const tema of ['azul-noite', 'grafite', 'ameixa']) {
      await abrirS2(page, { pro: true, prefs: { tema, lembrete: { ativo: false, dias: 1 }, lembretesAvisados: [], backup: { ativo: true, ultimaExportacao: null, adiadoAte: null, inicioPro: '2026-09-01' } }, hash: '#/ajustes' });
      expect(await page.evaluate(() => document.documentElement.dataset.tema)).toBe(tema);
      await expect(page.getByTestId(`tema-${tema}`)).toBeChecked();
      await expect(page.getByTestId('aparencia-auto')).toBeChecked();
    }
  });

  test('US-19.CA6: com prefers-reduced-motion: reduce, nenhuma transição ou animação dura mais que 0', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await abrirS2(page, { pro: true, assinaturas: dados, prefs: { lembrete: { ativo: true, dias: 3 } } });
    const rotas = ['#/', '#/assinaturas', '#/ajustes', '#/assinatura/nf', '#/pro'];
    const comMovimento: string[] = [];
    for (const r of rotas) {
      await page.goto('./' + r);
      await expect(page.getByTestId('titulo-tela')).toBeVisible();
      comMovimento.push(...(await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('body *')].filter((e) => {
        const s = getComputedStyle(e);
        const dur = (v: string) => v.split(',').some((x) => parseFloat(x) > 0);
        return dur(s.transitionDuration) || (s.animationName !== 'none' && dur(s.animationDuration));
      }).map((e) => `${e.tagName}.${e.className}`))).map((x) => `${r} ${x}`));
    }
    expect(comMovimento).toEqual([]);
  });
});
