// US-30.CA2 / US-29.CA8 / US-30.CA11 (SUG-SEC-03) — Verificações de anúncios e de conteúdo externo.
//
// Sem --producao (CI, QA): confere dist/, dist-teste/, o conteúdo web do pacote Android
// (android/app/src/main/assets/public, se existir) e o site (dist-site/, se existir):
//   1. nenhum ID REAL do AdMob (só os de teste do Google, editor 3940256099942544);
//   2. nenhum domínio de anúncio (googlesyndication, doubleclick, googleads) nem script do AdMob na parte web;
//   3. nenhuma URL externa fora da lista permitida (abaixo) e nenhum @import, @font-face ou url() remoto no CSS.
//   E no projeto Android: o manifesto usa o marcador ${admobAppId} (nunca um ID fixo) e o build.gradle só
//   tem o ID de app de TESTE (o real vem de MENSALAO_ADMOB_APP_ID, só no release).
// Com --producao <pastas...> (scripts/android.mjs aab): as pastas não podem ter ID de teste e precisam ter
//   os dois IDs reais dos blocos; as verificações 2 e 3 valem também.
// Uso: node scripts/verificar-anuncios.mjs            (padrão: CI)
//      node scripts/verificar-anuncios.mjs --producao dist android/app/src/main/assets/public
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const EDITOR_TESTE = '3940256099942544';
const ID_ADMOB = /ca-app-pub-(\d{16})[~/]\d{10}/g;
const DOMINIOS_ANUNCIO = ['googlesyndication', 'doubleclick', 'googleads', 'admob.google', 'imasdk.googleapis'];

/**
 * URLs externas permitidas no conteúdo web (lista curta, US-30.CA11): namespaces do SVG, a mensagem de erro
 * do núcleo do Capacitor, o próprio site, a política e o controle de anúncios do Google (links que a pessoa
 * toca na política) e a ficha do app na Play (site). A antiga https://play.google.com/billing saiu com a
 * Digital Goods API.
 */
const PERMITIDAS = [
  /^http:\/\/www\.w3\.org\/(2000\/svg|1999\/xlink)$/,
  /^https:\/\/capacitorjs\.com\/?$/,
  /^https:\/\/mensalao\.app(\/[\w./-]*)?$/,
  /^https:\/\/policies\.google\.com\/(privacy|technologies\/partner-sites)$/,
  /^https:\/\/myadcenter\.google\.com\/?$/,
  /^https:\/\/play\.google\.com\/store\/apps\/details\?id=br\.com\.mensalao\.app$/,
];
const URL_EXTERNA = /\bhttps?:\/\/[^\s"'`<>()\\]+/g;
const EXTENSOES = /\.(js|mjs|cjs|html|css|json|webmanifest|txt|xml|svg)$/;

const args = process.argv.slice(2);
const producao = args[0] === '--producao';
const PASTA_ANDROID = 'android/app/src/main/assets/public';
const pastas = producao
  ? args.slice(1)
  : ['dist', 'dist-teste', PASTA_ANDROID, 'dist-site'].filter((p, i) => i < 2 || existsSync(p));

let falhou = false;
const erro = (m) => {
  falhou = true;
  console.error(`ERRO: ${m}`);
};

function arquivos(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho];
  });
}

if (producao && pastas.length === 0) erro('informe as pastas do build de produção depois de --producao.');

for (const pasta of pastas) {
  if (!existsSync(pasta)) {
    erro(`a pasta ${pasta}/ não existe (rode os builds antes).`);
    continue;
  }
  const editoresReais = new Set();
  let idsTeste = 0;
  const problemas = [];
  for (const arq of arquivos(pasta).filter((a) => EXTENSOES.test(a))) {
    const texto = readFileSync(arq, 'utf8');
    for (const m of texto.matchAll(ID_ADMOB)) {
      if (m[1] === EDITOR_TESTE) idsTeste += 1;
      else editoresReais.add(`${m[0]} (${arq})`);
    }
    for (const d of DOMINIOS_ANUNCIO) if (texto.includes(d)) problemas.push(`domínio de anúncio "${d}" em ${arq}`);
    for (const m of texto.matchAll(URL_EXTERNA)) {
      const url = m[0].replace(/[.,;:]+$/, '');
      if (!PERMITIDAS.some((r) => r.test(url))) problemas.push(`URL externa fora da lista permitida: ${url} (${arq})`);
    }
    if (arq.endsWith('.css')) {
      if (/@import\b/.test(texto)) problemas.push(`@import no CSS (${arq})`);
      if (/url\(\s*['"]?\s*(https?:)?\/\//i.test(texto)) problemas.push(`url() remoto no CSS (${arq})`);
      if (/@font-face/i.test(texto)) problemas.push(`@font-face no CSS (${arq}); o app usa a fonte do sistema`);
    }
  }
  for (const p of problemas) erro(`${pasta}/: ${p}`);
  if (producao) {
    if (idsTeste > 0) erro(`${pasta}/ é de produção mas contém ID de teste do Google (${idsTeste} ocorrência(s)).`);
    if (editoresReais.size < 2) erro(`${pasta}/ é de produção mas não contém os IDs reais do banner e do premiado.`);
  } else if (editoresReais.size > 0) {
    erro(`${pasta}/ não é de produção e contém ID real do AdMob: ${[...editoresReais].join(', ')}`);
  }
  if (!falhou) console.log(`OK: ${pasta}/ (${producao ? 'produção' : 'não produção'}) sem ID indevido, sem domínio de anúncio e sem URL externa fora da lista.`);
}

// Projeto Android versionado: nenhum ID real fixo (US-30.CA1).
const MANIFESTO = 'android/app/src/main/AndroidManifest.xml';
const GRADLE = 'android/app/build.gradle';
if (existsSync(MANIFESTO)) {
  const m = readFileSync(MANIFESTO, 'utf8');
  if (!m.includes('${admobAppId}')) erro(`${MANIFESTO} deveria usar o marcador \${admobAppId} no APPLICATION_ID do AdMob.`);
  if (/ca-app-pub-\d/.test(m)) erro(`${MANIFESTO} tem um ID do AdMob fixo.`);
  for (const id of readFileSync(GRADLE, 'utf8').matchAll(ID_ADMOB)) {
    if (id[1] !== EDITOR_TESTE) erro(`${GRADLE} tem um ID real do AdMob fixo: ${id[0]}`);
  }
  if (!falhou) console.log(`OK: ${MANIFESTO} e ${GRADLE} sem ID real fixo (o real vem de MENSALAO_ADMOB_APP_ID no release).`);
}

process.exit(falhou ? 1 : 0);
