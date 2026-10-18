// Seção 5.1 do backlog (E-01 a E-08): o que é verificável sem a Play. Os marcadores a preencher pelo Renato são esperados.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ler = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

describe('empacotamento (sprint 2, seção 5.1)', () => {
  const twa = JSON.parse(ler('twa/twa-manifest.json'));
  const links = JSON.parse(ler('public/.well-known/assetlinks.json'));
  const manifest = JSON.parse(ler('public/manifest.webmanifest'));

  it('E-01: projeto TWA coerente com o manifest do PWA e com Play Billing ativo', () => {
    expect(twa.name).toBe(manifest.name);
    expect(twa.display).toBe(manifest.display);
    expect(twa.themeColor.toLowerCase()).toBe(manifest.theme_color.toLowerCase());
    expect(twa.features.playBilling.enabled).toBe(true);
    expect(twa.packageId).toBe('br.com.mensalao.app');
    expect(twa.enableSiteSettingsShortcut).toBe(true);
  });
  it('E-02: assetlinks.json válido, com o mesmo pacote da TWA e o SHA-256 ainda como marcador a preencher (pendência R-03)', () => {
    expect(Array.isArray(links)).toBe(true);
    expect(links[0].relation).toContain('delegate_permission/common.handle_all_urls');
    expect(links[0].target.namespace).toBe('android_app');
    expect(links[0].target.package_name).toBe(twa.packageId);
    expect(links[0].target.sha256_cert_fingerprints).toHaveLength(1);
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
    expect(ler('privacidade.html')).toMatch(/privacidade/i);
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
