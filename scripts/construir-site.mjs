// US-31 — Monta o site público (mensalao.app) em dist-site/: página de apresentação, 404, política de
// privacidade (a mesma de public/, que também vai no pacote do app), app-ads.txt, o script pequeno e o
// sw.js de autodestruição. O app (dist/) NÃO entra aqui: ele só existe no pacote Android.
// Variáveis (opcionais):
//   MENSALAO_URL_PLAY  ficha do app na Play; sem ela, a página mostra "Em breve na Google Play" (US-31.CA14)
//   MENSALAO_DOMINIO   domínio próprio do GitHub Pages; grava o arquivo CNAME (US-31.CA12)
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const SAIDA = 'dist-site';
const URL_PLAY_VALIDA = /^https:\/\/play\.google\.com\/store\/apps\/details\?id=br\.com\.mensalao\.app$/;

const copiar = (de, para) => {
  mkdirSync(dirname(join(SAIDA, para)), { recursive: true });
  copyFileSync(de, join(SAIDA, para));
};

rmSync(SAIDA, { recursive: true, force: true });
mkdirSync(SAIDA, { recursive: true });

const urlPlay = process.env.MENSALAO_URL_PLAY?.trim() ?? '';
if (urlPlay && !URL_PLAY_VALIDA.test(urlPlay)) {
  console.error(`ERRO: MENSALAO_URL_PLAY deve ser https://play.google.com/store/apps/details?id=br.com.mensalao.app (recebido: ${urlPlay}).`);
  process.exit(1);
}
const EXTERNO =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 4.5h5.5V10M19.5 4.5L11 13M17 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 4 18.5v-10A1.5 1.5 0 0 1 5.5 7H10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
let index = readFileSync('site/index.html', 'utf8');
if (urlPlay) {
  index = index.replace(
    /<!--PLAY-->[\s\S]*?<!--\/PLAY-->/,
    `<a class="site-play" href="${urlPlay}" rel="noopener noreferrer" data-testid="site-play">Baixar na Google Play${EXTERNO}</a>`,
  );
} else {
  index = index.replace(/<!--\/?PLAY-->/g, '');
}
writeFileSync(join(SAIDA, 'index.html'), index);

for (const f of ['404.html', 'site.js', 'sw.js', 'app-ads.txt']) copiar(join('site', f), f);
copiar('public/privacidade.html', 'privacidade.html');
copiar('public/pagina.css', 'pagina.css');
copiar('public/icons/icone.svg', 'icons/icone.svg');

const dominio = process.env.MENSALAO_DOMINIO?.trim();
if (dominio) writeFileSync(join(SAIDA, 'CNAME'), `${dominio}\n`);

console.log(`Site gerado em ${SAIDA}/ (${urlPlay ? 'com o botão da Play' : '"Em breve na Google Play"'}${dominio ? `, CNAME ${dominio}` : ''}).`);
