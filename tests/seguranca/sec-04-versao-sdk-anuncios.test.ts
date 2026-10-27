// SEC-04 — o SDK de anúncios (play-services-ads) precisa entrar no build com versão exata, revisada, e não com
// a versão dinâmica do plugin AdMob ("25.4.+"), que muda a cada compilação sem revisão.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ler = (p: string) => readFileSync(resolve(__dirname, '../..', p), 'utf8').replace(/\/\/.*$/gm, '');
const variaveis = ler('android/variables.gradle');
const raiz = ler('android/build.gradle');

describe('SEC-04: play-services-ads com versão fixa', () => {
  it('variables.gradle fixa playServicesAdsVersion em versão exata (x.y.z, sem "+")', () => {
    const m = variaveis.match(/playServicesAdsVersion\s*=\s*['"]([^'"]+)['"]/);
    expect(m, 'playServicesAdsVersion ausente em android/variables.gradle').not.toBeNull();
    expect(m![1]).toMatch(/^\d+\.\d+\.\d+$/);
    expect(m![1]).not.toContain('+');
  });

  it('a versão fixa fica na linha 25.4 que o plugin AdMob instalado suporta', () => {
    const plugin = ler('node_modules/@capacitor-community/admob/android/build.gradle');
    const dinamica = plugin.match(/playServicesAdsVersion\s*=.*:\s*['"]([^'"]+)['"]/)![1]; // ex.: 25.4.+
    const fixa = variaveis.match(/playServicesAdsVersion\s*=\s*['"]([^'"]+)['"]/)![1];
    expect(fixa.startsWith(dinamica.replace(/\+$/, ''))).toBe(true);
  });

  it('variables.gradle é aplicado pelo build.gradle da raiz (vale para o plugin)', () => {
    expect(raiz).toMatch(/apply from:\s*["']variables\.gradle["']/);
  });
});
