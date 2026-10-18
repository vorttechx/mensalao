// E-07 — Gera as capturas da loja a partir do build de teste (provedor falso, Pro ativo).
// Uso: npm run build:teste && npx vite preview --mode teste --port 4173 & node scripts/capturas.mjs
// Saída: docs/loja/capturas/*.png em 1080×1920 (360×640 a 3x; proporção 9:16, aceita pela Play).
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/';
const SAIDA = 'docs/loja/capturas';
mkdirSync(SAIDA, { recursive: true });

const s = (p) => ({
  id: p.nome.toLowerCase().replace(/\W/g, ''), valorCentavos: 0, ciclo: 'mensal', proxima: '2026-10-20', diaRef: 20, pagamento: 'cartao', banco: '',
  categoria: 'Streaming de vídeo', emTeste: false, fimTeste: null, status: 'ativa', canceladaEm: null, catalogoId: null, historico: [], criadaEm: '2026-09-01', ...p,
});
const assinaturas = [
  s({ nome: 'Netflix', valorCentavos: 4490, proxima: '2026-10-19', diaRef: 19, historico: [{ data: '2026-08-01', deCentavos: 3990, paraCentavos: 4490 }] }),
  s({ nome: 'Spotify', valorCentavos: 2190, proxima: '2026-10-18', diaRef: 18, categoria: 'Música', pagamento: 'pix', banco: 'Nubank' }),
  s({ nome: 'Google One', valorCentavos: 999, proxima: '2026-10-25', diaRef: 25, categoria: 'Armazenamento em nuvem' }),
  s({ nome: 'Amazon Prime', valorCentavos: 16680, ciclo: 'anual', proxima: '2027-02-10', diaRef: 10, categoria: 'Streaming / Compras' }),
  s({ nome: 'Academia', valorCentavos: 11990, proxima: '2026-11-05', diaRef: 5, categoria: 'Saúde e bem-estar', pagamento: 'boleto' }),
  s({ nome: 'iFood Clube', valorCentavos: 1190, proxima: '2026-10-28', diaRef: 28, categoria: 'Delivery' }),
];

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
const page = await ctx.newPage();
await page.clock.setFixedTime('2026-10-18T09:00:00-03:00');
await page.goto(BASE);
await page.evaluate((a) => {
  localStorage.setItem('mensalao:v1', JSON.stringify({ versao: 1, config: { diasAviso: 3 }, assinaturas: a }));
  localStorage.setItem('mensalao:teste:provedor', JSON.stringify({ compras: ['mensalao_pro'] }));
  localStorage.setItem('mensalao:prefs:v1', JSON.stringify({ lembrete: { ativo: true, dias: 1 }, backup: { ativo: true, ultimaExportacao: '2026-10-17' } }));
}, assinaturas);

for (const [nome, hash] of [['1-inicio', '#/'], ['2-totais', '#/totais'], ['3-assinaturas', '#/assinaturas'], ['4-detalhe', '#/assinatura/netflix'], ['5-pro', '#/pro'], ['6-ajustes', '#/ajustes']]) {
  await page.goto(BASE + hash);
  await page.reload();
  await page.waitForTimeout(400);
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
  await page.screenshot({ path: `${SAIDA}/${nome}.png` });
  console.log(`${SAIDA}/${nome}.png`);
}
await navegador.close();
