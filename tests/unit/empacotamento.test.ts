// Seção 5.1 do backlog (E-01 a E-08): o que é verificável sem a Play. Os marcadores a preencher pelo Renato são esperados.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ler = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

describe('empacotamento (sprint 2, seção 5.1)', () => {
  const cap = JSON.parse(ler('capacitor.config.json'));
  const manifest = JSON.parse(ler('public/manifest.webmanifest'));

  it('E-01 (US-24.CA2): projeto Capacitor coerente com o manifest do PWA; TWA e assetlinks.json saíram', () => {
    expect(cap.appName).toBe(manifest.name);
    expect(cap.appId).toBe('br.com.mensalao.app');
    expect(cap.webDir).toBe('dist');
    expect(existsSync(new URL('../../twa', import.meta.url))).toBe(false);
    expect(existsSync(new URL('../../public/.well-known/assetlinks.json', import.meta.url))).toBe(false);
    expect(existsSync(new URL('../../android/app/src/main/AndroidManifest.xml', import.meta.url))).toBe(true);
  });
  it('E-02 (US-24.CA2): o guia de publicação descreve o .aab (npm run android:aab) e não manda mais gerar assetlinks.json', () => {
    const guia = ler('docs/loja/guia-publicacao.md');
    expect(guia).toMatch(/android:aab/);
    expect(guia).toMatch(/\.aab/);
    expect(guia).not.toMatch(/bubblewrap/i);
  });
  it('E-03: manifest tem id, escopo, start_url e ícones any e maskable 192/512', () => {
    expect(manifest.id).toBeTruthy();
    expect(manifest.scope).toBe('./');
    expect(manifest.start_url).toBe('./');
    for (const proposito of ['any', 'maskable']) {
      for (const tam of ['192x192', '512x512']) expect(manifest.icons.some((i: any) => i.purpose === proposito && i.sizes === tam)).toBe(true);
    }
  });
  it('E-05: política de privacidade em docs e página privacidade.html', () => {
    expect(existsSync(new URL('../../docs/loja/politica-de-privacidade.md', import.meta.url))).toBe(true);
    expect(ler('public/privacidade.html')).toMatch(/privacidade/i);
  });
  it('E-06: ficha da loja com descrição curta de até 80 caracteres e o SKU do Pro', () => {
    const ficha = ler('docs/loja/ficha-play.md');
    const curta = ficha.split('## Descrição curta')[1].split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('('))!;
    expect(curta.length).toBeLessThanOrEqual(80);
    expect(ficha).toContain('mensalao_pro');
  });
  it('E-07/E-08: capturas e guia de publicação existem', () => {
    expect(existsSync(new URL('../../docs/loja/capturas/5-pro.png', import.meta.url))).toBe(true);
    expect(existsSync(new URL('../../docs/loja/guia-publicacao.md', import.meta.url))).toBe(true);
  });
});
