// US-24 / design 5.2 — Gera os ícones PNG do app Android (mipmap, para Android 7: o 8+ usa o ícone adaptativo
// em vetor) a partir de public/icons/icone.svg. Uso: node scripts/icones-android.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const svg = readFileSync('public/icons/icone.svg', 'utf8');
const densidades = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const navegador = await chromium.launch();
const page = await navegador.newPage();
for (const [pasta, lado] of Object.entries(densidades)) {
  for (const [nome, raio] of [['ic_launcher', '18%'], ['ic_launcher_round', '50%']]) {
    await page.setViewportSize({ width: lado, height: lado });
    await page.setContent(
      `<html><body style="margin:0;background:transparent"><div style="width:${lado}px;height:${lado}px;border-radius:${raio};overflow:hidden">${svg.replace('<svg ', `<svg width="${lado}" height="${lado}" `)}</div></body></html>`,
    );
    await page.screenshot({ path: `android/app/src/main/res/mipmap-${pasta}/${nome}.png`, omitBackground: true });
  }
}
await navegador.close();
console.log('Ícones gerados em android/app/src/main/res/mipmap-*/');
