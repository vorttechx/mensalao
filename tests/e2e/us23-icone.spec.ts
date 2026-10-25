// US-23 — Ícone do app (design 5.2): pixels do PNG servido conferidos com o desenho aprovado.
import { expect, test } from '@playwright/test';

test('US-23.CA1: ícone 512 com fundo #1D5C3F, base e marcas brancas e linha "hoje" #9FD8B8 dentro da zona segura', async ({ page }) => {
  await page.goto('./');
  const px = await page.evaluate(async () => {
    const img = new Image();
    img.src = 'icons/icon-512.png';
    await img.decode();
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const p = (x: number, y: number) => '#' + [...ctx.getImageData(x, y, 1, 1).data.slice(0, 3)].map((v) => v.toString(16).padStart(2, '0')).join('');
    // Zona fora da área segura (80%) deve ser só fundo, para o maskable.
    let foraDaZona = 0;
    for (let x = 0; x < 512; x += 4) for (const y of [10, 40, 470, 500]) if (p(x, y) !== '#1d5c3f') foraDaZona++;
    return { canto: p(5, 5), base: p(250, 362), marca: p(154, 300), hoje: p(342, 200), foraDaZona };
  });
  expect(px).toEqual({ canto: '#1d5c3f', base: '#ffffff', marca: '#ffffff', hoje: '#9fd8b8', foraDaZona: 0 });
});
