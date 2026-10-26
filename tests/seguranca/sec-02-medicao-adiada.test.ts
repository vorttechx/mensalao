// SEC-02 — o SDK do Google Mobile Ads não pode iniciar a medição na abertura do app (Pro e grátis antes do
// consentimento). A meta-data DELAY_APP_MEASUREMENT_INIT adia a medição até o app chamar MobileAds.initialize.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const manifesto = readFileSync(resolve(__dirname, '../../android/app/src/main/AndroidManifest.xml'), 'utf8');
const semComentarios = manifesto.replace(/<!--[\s\S]*?-->/g, '');

describe('SEC-02: medição do SDK de anúncios adiada', () => {
  it('o <application> declara DELAY_APP_MEASUREMENT_INIT = true', () => {
    const app = semComentarios.match(/<application[\s\S]*?<\/application>/);
    expect(app).not.toBeNull();
    const meta = app![0].match(
      /<meta-data\s+android:name="com\.google\.android\.gms\.ads\.DELAY_APP_MEASUREMENT_INIT"\s+android:value="([^"]*)"\s*\/>/,
    );
    expect(meta, 'meta-data DELAY_APP_MEASUREMENT_INIT ausente').not.toBeNull();
    expect(meta![1]).toBe('true');
  });

  it('a meta-data aparece uma vez só (sem valor contraditório)', () => {
    expect(semComentarios.match(/DELAY_APP_MEASUREMENT_INIT/g)?.length).toBe(1);
  });
});
