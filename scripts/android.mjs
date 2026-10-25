// US-24 / US-30 — Gera o app Android a partir do mesmo código web (Vite → dist/ → Capacitor → Gradle).
// Uso:
//   node scripts/android.mjs sync   build web (IDs de TESTE) + npx cap sync android (não precisa do Android SDK)
//   node scripts/android.mjs apk    sync + APK de debug (android/app/build/outputs/apk/debug/app-debug.apk)
//   node scripts/android.mjs aab    build de PRODUÇÃO: exige os IDs reais do AdMob e a chave de upload por
//                                   variável de ambiente (ver docs/loja/guia-publicacao.md) e gera
//                                   android/app/build/outputs/bundle/release/app-release.aab
// Precisa do Android SDK (ANDROID_HOME) e do JDK 21 para apk/aab.
import { spawnSync } from 'node:child_process';

const alvo = process.argv[2] ?? 'sync';
const windows = process.platform === 'win32';

function rodar(cmd, args, opcoes = {}) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: windows, ...opcoes });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const npm = windows ? 'npm.cmd' : 'npm';
const npx = windows ? 'npx.cmd' : 'npx';
const gradlew = windows ? 'gradlew.bat' : './gradlew';

if (!['sync', 'apk', 'aab'].includes(alvo)) {
  console.error('Uso: node scripts/android.mjs sync|apk|aab');
  process.exit(1);
}

if (alvo === 'aab') {
  // IDs reais só aqui, por variável; o build web falha sem eles (vite.config.ts) e o script confere o resultado.
  const env = { ...process.env, MENSALAO_ANUNCIOS: 'producao' };
  rodar(npm, ['run', 'build'], { env });
  rodar('node', ['scripts/verificar-anuncios.mjs', '--producao', 'dist'], { env });
  rodar(npx, ['cap', 'sync', 'android'], { env });
  rodar('node', ['scripts/verificar-anuncios.mjs', '--producao', 'android/app/src/main/assets/public'], { env });
  rodar(gradlew, ['bundleRelease'], { cwd: 'android', env });
} else {
  rodar(npm, ['run', 'build']);
  rodar(npx, ['cap', 'sync', 'android']);
  if (alvo === 'apk') rodar(gradlew, ['assembleDebug'], { cwd: 'android' });
}
