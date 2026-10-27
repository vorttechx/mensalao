// US-31.CA1 / CA6 / CA7 / CA11 / CA13 — Confere a pasta que o GitHub Pages publica (dist-site/).
// Falha (código 1) se o app web aparecer nela ou se faltar algo que a Play e o AdMob exigem.
// Uso: node scripts/verificar-site.mjs [pasta]   (padrão: dist-site; roda dentro do npm run verificar:bundle)
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const pasta = process.argv[2] ?? 'dist-site';
let falhou = false;
const erro = (m) => {
  falhou = true;
  console.error(`ERRO: ${m}`);
};

if (!existsSync(pasta)) {
  console.error(`ERRO: ${pasta}/ não existe. Rode "npm run build:site".`);
  process.exit(1);
}

function arquivos(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho];
  });
}
const todos = arquivos(pasta).map((a) => relative(pasta, a).split('\\').join('/'));
const ler = (f) => readFileSync(join(pasta, f), 'utf8');

// CA1: nada do app web.
for (const f of todos) {
  if (f.startsWith('assets/')) erro(`${f}: arquivo do build do app (assets/) na pasta do site.`);
  if (f.endsWith('.webmanifest')) erro(`${f}: manifesto do PWA na pasta do site.`);
  if (f.startsWith('.well-known/')) erro(`${f}: .well-known (assetlinks.json da TWA) não é mais publicado (CA13).`);
}
const htmls = todos.filter((f) => f.endsWith('.html'));
for (const f of htmls) {
  const html = ler(f);
  if (/rel=["']?manifest/i.test(html)) erro(`${f}: <link rel="manifest">.`);
  if (/id=["']app["']/.test(html) || /src\/main\.ts|assets\/main-/.test(html)) erro(`${f}: parece o index.html do app.`);
  // CA11: CSP por <meta>, referrer, sem style nem script inline.
  if (!/http-equiv=["']Content-Security-Policy["']/i.test(html)) erro(`${f}: sem CSP por <meta>.`);
  if (/'unsafe-inline'|'unsafe-eval'/.test(html)) erro(`${f}: CSP com unsafe-inline/unsafe-eval.`);
  if (!/name=["']referrer["'][^>]*no-referrer/i.test(html)) erro(`${f}: sem <meta name="referrer" content="no-referrer">.`);
  if (/\sstyle=/i.test(html) || /<style[\s>]/i.test(html)) erro(`${f}: style inline.`);
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/\ssrc=/.test(m[1]) || m[2].trim()) erro(`${f}: script inline.`);
  }
  if (/\son[a-z]+=/i.test(html)) erro(`${f}: ouvinte de evento inline (on...=).`);
}
const index = existsSync(join(pasta, 'index.html')) ? ler('index.html') : '';
if (!index.includes('data-testid="site-apresentacao"')) erro('index.html não é a página de apresentação (site-apresentacao).');
if (!/data-testid="site-play(-em-breve)?"/.test(index)) erro('index.html sem "Baixar na Google Play" nem "Em breve na Google Play".');
if (!existsSync(join(pasta, '404.html'))) erro('falta 404.html.');

// CA3: o único sw.js é o de autodestruição (não cacheia nada).
if (!existsSync(join(pasta, 'sw.js'))) erro('falta sw.js de autodestruição (quem tinha o app web ficaria com o cache antigo).');
else {
  const sw = ler('sw.js');
  if (!/registration\.unregister\(\)/.test(sw) || !/caches\.delete/.test(sw) || !/skipWaiting/.test(sw) || !/clients\.claim/.test(sw)) {
    erro('sw.js não é o de autodestruição (skipWaiting, clients.claim, caches.delete, unregister).');
  }
  if (/addEventListener\(\s*['"]fetch['"]/.test(sw) || /\.addAll\(|cache\.put\(|caches\.open\(/.test(sw)) erro('sw.js cacheia arquivos.');
  if (/localStorage|indexedDB/.test(sw)) erro('sw.js mexe em armazenamento de dados.');
}

// CA5 / CA7: no máximo um script pequeno, que não apaga dados.
const scripts = todos.filter((f) => /\.m?js$/.test(f) && f !== 'sw.js');
if (scripts.length > 1) erro(`mais de um script no site: ${scripts.join(', ')}.`);
for (const s of scripts) {
  const tamanho = statSync(join(pasta, s)).size;
  if (tamanho > 2048) erro(`${s} tem ${tamanho} bytes (máximo 2 KB).`);
  const js = ler(s);
  if (/localStorage\.(clear|removeItem|setItem|getItem)|indexedDB\.deleteDatabase|document\.cookie|fetch\(|XMLHttpRequest|sendBeacon/.test(js)) {
    erro(`${s} lê, altera ou envia dados (só pode conferir se a chave existe).`);
  }
}
const total = todos.reduce((t, f) => t + statSync(join(pasta, f)).size, 0);
if (total > 150 * 1024) erro(`o site tem ${Math.round(total / 1024)} KB (máximo 150 KB).`);

// CA6 / US-29.CA7: política e app-ads.txt.
if (!existsSync(join(pasta, 'privacidade.html'))) erro('falta privacidade.html.');
else if (!/data-testid="privacidade-data"/.test(ler('privacidade.html'))) erro('privacidade.html sem a data de atualização.');
if (!existsSync(join(pasta, 'app-ads.txt'))) erro('falta app-ads.txt.');
else {
  const linhas = ler('app-ads.txt').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  if (linhas.length === 0) erro('app-ads.txt sem nenhuma linha de vendedor.');
  for (const l of linhas) {
    if (!/^google\.com, pub-(X{16}|\d{16}), DIRECT, f08c47fec0942fa0$/.test(l)) erro(`app-ads.txt: linha fora do formato do AdMob: "${l}".`);
    if (l.includes('3940256099942544')) erro('app-ads.txt contém o ID de teste do Google.');
  }
}

if (!falhou) console.log(`OK: ${pasta}/ é só o site (${todos.length} arquivos, ${Math.round(total / 1024)} KB), sem o app web, com política, app-ads.txt e sw.js de autodestruição.`);
process.exit(falhou ? 1 : 0);
