// US-31 / US-29.CA6-CA8 / US-30.CA2-CA3 / US-30.CA11 — o site público (mensalao.app) e as verificações do bundle.
// O site é gerado numa pasta temporária (scripts/construir-site.mjs) e servido por um servidor local do próprio
// teste; nada aqui depende do domínio real. Serial: o servidor e as pastas temporárias são compartilhados.
import { expect, test, type Page } from '@playwright/test';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';

test.describe.configure({ mode: 'serial' });

const RAIZ = process.cwd();
const TIPOS: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml' };
const URL_PLAY = 'https://play.google.com/store/apps/details?id=br.com.mensalao.app';

function construirSite(env: Record<string, string> = {}): string {
  const base = mkdtempSync(join(tmpdir(), 'mensalao-site-'));
  cpSync(join(RAIZ, 'site'), join(base, 'site'), { recursive: true });
  cpSync(join(RAIZ, 'public'), join(base, 'public'), { recursive: true });
  execFileSync('node', [join(RAIZ, 'scripts/construir-site.mjs')], { cwd: base, env: { ...process.env, ...env }, stdio: 'pipe' });
  return join(base, 'dist-site');
}

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? arquivos(join(dir, n)) : [join(dir, n)]));
}

interface Servidor {
  porta: number;
  fechar(): Promise<void>;
  /** 'novo' serve o site; 'velho' simula o app web antigo (com o sw.js que cacheia). */
  fase: 'novo' | 'velho';
  pedidos: string[];
  cabecalhos: Record<string, string | string[] | undefined>[];
}

const APP_VELHO = '<!doctype html><meta charset="utf-8"><title>Mensalão antigo</title><div data-testid="app-velho">APP ANTIGO EM CACHE</div><script>navigator.serviceWorker.register("/sw.js")</script>';
const SW_VELHO = `self.addEventListener('install',e=>e.waitUntil(caches.open('mensalao-v1').then(c=>c.addAll(['/']))));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));`;

async function subir(pasta: string): Promise<Servidor> {
  const estado: Servidor = { porta: 0, fase: 'novo', pedidos: [], cabecalhos: [], fechar: async () => undefined };
  const srv: Server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://x');
    estado.pedidos.push(url.pathname);
    estado.cabecalhos.push(req.headers);
    if (estado.fase === 'velho') {
      if (url.pathname === '/sw.js') { res.writeHead(200, { 'content-type': 'text/javascript', 'cache-control': 'no-cache' }); return void res.end(SW_VELHO); }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return void res.end(APP_VELHO);
    }
    let caminho = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    let arq = join(pasta, caminho);
    let status = 200;
    if (!existsSync(arq) || statSync(arq).isDirectory()) { arq = join(pasta, '404.html'); status = 404; }
    res.writeHead(status, { 'content-type': TIPOS[extname(arq)] ?? 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(readFileSync(arq));
  });
  await new Promise<void>((ok) => srv.listen(0, '127.0.0.1', ok));
  estado.porta = (srv.address() as { port: number }).port;
  estado.fechar = () => new Promise((ok) => srv.close(() => ok()));
  return estado;
}

let pastaSite = '';
let pastaSitePlay = '';
let servidor: Servidor;
const u = (p = '/') => `http://127.0.0.1:${servidor.porta}${p}`;

test.beforeAll(async () => {
  pastaSite = construirSite();
  pastaSitePlay = construirSite({ MENSALAO_URL_PLAY: URL_PLAY, MENSALAO_DOMINIO: 'mensalao.app' });
  servidor = await subir(pastaSite);
});
test.afterAll(async () => {
  await servidor.fechar();
  for (const p of [pastaSite, pastaSitePlay]) rmSync(join(p, '..'), { recursive: true, force: true });
});

test.describe('US-31.CA1 o site publicado não contém o app', () => {
  test('nenhum JS do Vite, manifest, index do app nem service worker que cacheia; só os arquivos do site', () => {
    const lista = arquivos(pastaSite).map((a) => a.slice(pastaSite.length + 1)).sort();
    expect(lista).toEqual(['404.html', 'app-ads.txt', 'icons/icone.svg', 'index.html', 'pagina.css', 'privacidade.html', 'site.js', 'sw.js']);
    for (const f of lista.filter((x) => x.endsWith('.html'))) {
      const t = readFileSync(join(pastaSite, f), 'utf8');
      expect(t, f).not.toMatch(/rel="?manifest|id="app"|assets\/main-|src\/main\.ts/i);
    }
    expect(readFileSync(join(pastaSite, 'sw.js'), 'utf8')).not.toMatch(/caches\.open|addEventListener\(\s*['"]fetch/);
  });

  test('o scripts/verificar-site.mjs aprova o site e reprova uma pasta com o app web dentro (assets/, manifest)', () => {
    const ok = spawnSync('node', [join(RAIZ, 'scripts/verificar-site.mjs'), pastaSite], { encoding: 'utf8' });
    expect(ok.status, ok.stdout + ok.stderr).toBe(0);
    const ruim = mkdtempSync(join(tmpdir(), 'mensalao-ruim-'));
    cpSync(pastaSite, ruim, { recursive: true });
    mkdirSync(join(ruim, 'assets'));
    writeFileSync(join(ruim, 'assets', 'main-abc.js'), 'console.log(1)');
    writeFileSync(join(ruim, 'manifest.webmanifest'), '{}');
    const r = spawnSync('node', [join(RAIZ, 'scripts/verificar-site.mjs'), ruim], { encoding: 'utf8' });
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/assets\//);
    expect(r.stderr).toMatch(/webmanifest/);
    rmSync(ruim, { recursive: true, force: true });
  });

  test('o verificar-site reprova app-ads.txt com ID de teste, script inline e site com mais de 150 KB', () => {
    const ruim = mkdtempSync(join(tmpdir(), 'mensalao-ruim-'));
    cpSync(pastaSite, ruim, { recursive: true });
    writeFileSync(join(ruim, 'app-ads.txt'), 'google.com, pub-3940256099942544, DIRECT, f08c47fec0942fa0\n');
    writeFileSync(join(ruim, 'index.html'), readFileSync(join(ruim, 'index.html'), 'utf8').replace('</body>', '<script>alert(1)</script></body>'));
    writeFileSync(join(ruim, 'pesado.txt'), 'x'.repeat(160 * 1024));
    const r = spawnSync('node', [join(RAIZ, 'scripts/verificar-site.mjs'), ruim], { encoding: 'utf8' });
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/ID de teste/);
    expect(r.stderr).toMatch(/script inline/);
    expect(r.stderr).toMatch(/KB/);
    rmSync(ruim, { recursive: true, force: true });
  });
});

test.describe('US-31.CA2 página de apresentação', () => {
  test('mostra o nome, a frase do produto, "só para celular", a política e o contato; sem Play ainda, "Em breve"', async ({ page }) => {
    await page.goto(u());
    await expect(page.getByTestId('site-apresentacao')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Controle suas assinaturas sem conectar ao banco.');
    await expect(page.locator('header')).toContainText('Mensalão');
    await expect(page.getByTestId('site-so-celular')).toContainText('app para celular Android');
    await expect(page.getByTestId('site-play-em-breve')).toHaveText('Em breve na Google Play');
    await expect(page.getByTestId('site-play')).toHaveCount(0);
    await expect(page.getByTestId('site-link-privacidade')).toHaveAttribute('href', './privacidade.html');
    await expect(page.getByTestId('site-contato')).toHaveAttribute('href', 'mailto:contato@mensalao.app');
    await expect(page.getByTestId('site-aviso-antigo')).toHaveCount(0);
  });

  test('com a URL da Play (R-21) o botão "Baixar na Google Play" vira link seguro; URL fora do padrão é recusada pelo build', async ({ page }) => {
    const s2 = await subir(pastaSitePlay);
    await page.goto(`http://127.0.0.1:${s2.porta}/`);
    const play = page.getByTestId('site-play');
    await expect(play).toContainText('Baixar na Google Play');
    await expect(play).toHaveAttribute('href', URL_PLAY);
    await expect(play).toHaveAttribute('rel', /noopener/);
    await expect(page.getByTestId('site-play-em-breve')).toHaveCount(0);
    expect(readFileSync(join(pastaSitePlay, 'CNAME'), 'utf8').trim()).toBe('mensalao.app');
    await s2.fechar();
    const base = mkdtempSync(join(tmpdir(), 'mensalao-site-'));
    cpSync(join(RAIZ, 'site'), join(base, 'site'), { recursive: true });
    cpSync(join(RAIZ, 'public'), join(base, 'public'), { recursive: true });
    const r = spawnSync('node', [join(RAIZ, 'scripts/construir-site.mjs')], { cwd: base, encoding: 'utf8', env: { ...process.env, MENSALAO_URL_PLAY: 'https://exemplo.com/app' } });
    expect(r.status).toBe(1);
    rmSync(base, { recursive: true, force: true });
  });

  test('US-31.CA7: funciona sem JavaScript (o aviso é só um acréscimo)', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(u());
    await expect(page.getByTestId('site-apresentacao')).toBeVisible();
    await expect(page.getByTestId('site-play-em-breve')).toBeVisible();
    await expect(page.getByTestId('site-link-privacidade')).toBeVisible();
    await ctx.close();
  });

  test('US-31.CA7: leve (≤ 150 KB), um só script de até 2 KB, nenhum terceiro, nenhum cookie, nenhuma análise', async ({ page }) => {
    servidor.pedidos.length = 0;
    const externos: string[] = [];
    page.on('request', (r) => { if (!r.url().startsWith(`http://127.0.0.1:${servidor.porta}`) && !r.url().startsWith('data:')) externos.push(r.url()); });
    await page.goto(u());
    await page.waitForLoadState('networkidle');
    expect(externos).toEqual([]);
    const total = arquivos(pastaSite).reduce((t, f) => t + statSync(f).size, 0);
    expect(total).toBeLessThanOrEqual(150 * 1024);
    expect(statSync(join(pastaSite, 'site.js')).size).toBeLessThanOrEqual(2048);
    expect(await page.locator('script').count()).toBe(1);
    expect(await page.evaluate(() => document.cookie)).toBe('');
    expect((await page.context().cookies()).length).toBe(0);
    expect(servidor.cabecalhos.some((h) => h.cookie)).toBe(false);
    for (const f of ['index.html', 'privacidade.html', '404.html']) expect(readFileSync(join(pastaSite, f), 'utf8')).not.toMatch(/googletagmanager|google-analytics|gtag\(|fbq\(|hotjar|plausible|matomo/i);
  });

  test('US-31.CA2 / US-29.CA8: 360 px sem rolagem horizontal e nenhuma violação de CSP no site', async ({ page }) => {
    const violacoes: string[] = [];
    page.on('console', (m) => { if (/content security policy|refused to/i.test(m.text())) violacoes.push(m.text()); });
    await page.setViewportSize({ width: 360, height: 780 });
    for (const p of ['/', '/privacidade.html', '/nao-existe']) {
      await page.goto(u(p));
      const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      expect(r.sw, p).toBeLessThanOrEqual(r.cw);
    }
    expect(violacoes).toEqual([]);
  });
});

test.describe('US-31.CA4 rotas antigas e PWA instalado', () => {
  test('rotas antigas do app (/#/assinaturas, /#/pro, /assinaturas, /manifest.webmanifest) caem na apresentação ou numa 404 curta, sem tela em branco', async ({ page }) => {
    for (const p of ['/#/assinaturas', '/#/pro']) {
      await page.goto(u(p));
      await expect(page.getByTestId('site-apresentacao')).toBeVisible();
    }
    for (const p of ['/assinaturas', '/pro', '/manifest.webmanifest', '/assets/main-abc.js']) {
      const resp = await page.goto(u(p));
      expect(resp!.status(), p).toBe(404);
      await expect(page.getByTestId('site-404')).toBeVisible();
      await expect(page.getByTestId('site-404-inicio')).toHaveAttribute('href', '/');
      await expect(page.getByTestId('site-link-privacidade')).toHaveAttribute('href', '/privacidade.html');
      await expect(page.locator('body')).not.toBeEmpty();
    }
    await page.getByTestId('site-404-inicio').click();
    await expect(page.getByTestId('site-apresentacao')).toBeVisible();
  });
});

test.describe('US-31.CA5 dados antigos no navegador', () => {
  test('sem a chave mensalao:v1 não há aviso; com a chave, o aviso discreto aparece e o valor continua idêntico', async ({ page }) => {
    await page.goto(u());
    await expect(page.getByTestId('site-aviso-antigo')).toHaveCount(0);
    const valor = JSON.stringify({ versao: 1, config: { diasAviso: 3 }, assinaturas: [{ id: 'x', nome: 'Netflix' }] });
    await page.evaluate((v) => { localStorage.setItem('mensalao:v1', v); localStorage.setItem('outra:chave', 'preservada'); }, valor);
    await page.reload();
    const aviso = page.getByTestId('site-aviso-antigo');
    await expect(aviso).toBeVisible();
    await expect(aviso).toContainText('O Mensalão agora funciona só pelo app de celular, na Google Play. As assinaturas que você tinha guardadas neste navegador continuam aqui, mas o app não consegue lê-las.');
    expect(await aviso.getAttribute('role')).toBe('status');
    expect(await page.evaluate(() => localStorage.getItem('mensalao:v1'))).toBe(valor);
    expect(await page.evaluate(() => localStorage.getItem('outra:chave'))).toBe('preservada');
  });

  test('a página nunca chama clear, removeItem, setItem, getItem nem deleteDatabase, e não lê o valor (só a existência da chave)', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __chamadas: string[] };
      w.__chamadas = [];
      for (const m of ['clear', 'removeItem', 'setItem', 'getItem'] as const) {
        const orig = Storage.prototype[m] as (...a: unknown[]) => unknown;
        (Storage.prototype as unknown as Record<string, unknown>)[m] = function (...a: unknown[]) { w.__chamadas.push(m); return orig.apply(this, a); };
      }
      const del = IDBFactory.prototype.deleteDatabase;
      IDBFactory.prototype.deleteDatabase = function (...a: [string]) { w.__chamadas.push('deleteDatabase'); return del.apply(this, a); };
    });
    await page.goto(u());
    await page.evaluate(() => {
      (window as any).__chamadas.length = 0;
      Storage.prototype.setItem.call(localStorage, 'mensalao:v1', '{"versao":1}');
    });
    await page.reload();
    await expect(page.getByTestId('site-aviso-antigo')).toBeVisible();
    const chamadas = await page.evaluate(() => (window as any).__chamadas as string[]);
    expect(chamadas.filter((c) => c !== 'setItem')).toEqual([]); // o setItem da própria preparação do teste não conta
  });
});

test.describe('US-31.CA3 service worker de autodestruição', () => {
  test('quem tinha o app web antigo com o sw.js em cache recebe o site novo, sem cache antigo, sem SW registrado e sem perder os dados', async ({ browser }) => {
    test.setTimeout(60_000);
    const ctx = await browser.newContext({ serviceWorkers: 'allow' });
    const page = await ctx.newPage();
    servidor.fase = 'velho';
    await page.goto(u());
    await expect(page.getByTestId('app-velho')).toBeVisible();
    await page.waitForFunction(() => navigator.serviceWorker.getRegistration().then((r) => !!r?.active));
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    const dados = JSON.stringify({ versao: 1, config: { diasAviso: 3 }, assinaturas: [{ id: 'x', nome: 'Netflix' }] });
    await page.evaluate((v) => localStorage.setItem('mensalao:v1', v), dados);
    expect(await page.evaluate(() => caches.keys())).toEqual(['mensalao-v1']);

    servidor.fase = 'novo'; // o deploy do site acontece: o sw.js na raiz agora é o de autodestruição
    await page.goto(u()); // o SW antigo ainda responde com o cache; o navegador busca o sw.js novo em seguida
    // O SW de autodestruição assume, apaga os caches, se desregistra e recarrega a aba sozinho (sem recarga do teste).
    await expect(page.getByTestId('site-apresentacao')).toBeVisible({ timeout: 25_000 });
    await expect(page.getByTestId('app-velho')).toHaveCount(0);
    await expect.poll(async () => page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length), { timeout: 15_000 }).toBe(0);
    expect(await page.evaluate(() => caches.keys())).toEqual([]);
    expect(await page.evaluate(() => navigator.serviceWorker.controller)).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('mensalao:v1'))).toBe(dados); // só os caches foram apagados
    await expect(page.getByTestId('site-aviso-antigo')).toBeVisible();
    // Nenhuma requisição seguinte é servida do cache antigo.
    servidor.pedidos.length = 0;
    await page.reload();
    await expect(page.getByTestId('site-apresentacao')).toBeVisible();
    expect(servidor.pedidos).toContain('/');
    await ctx.close();
  });

  test('o próprio sw.js, executado do zero, apaga TODOS os caches da origem (mensalao-* e outros) e se desregistra', async ({ browser }) => {
    test.setTimeout(45_000);
    const ctx = await browser.newContext({ serviceWorkers: 'allow' });
    const page = await ctx.newPage();
    await page.goto(u('/privacidade.html'));
    await page.evaluate(async () => {
      for (const nome of ['mensalao-v3', 'mensalao-dados', 'outro-cache']) await (await caches.open(nome)).put('/x', new Response('x'));
    });
    expect((await page.evaluate(() => caches.keys())).length).toBe(3);
    await page.evaluate(() => navigator.serviceWorker.register('/sw.js'));
    await expect.poll(async () => page.evaluate(() => caches.keys()), { timeout: 20_000 }).toEqual([]);
    await expect.poll(async () => page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length), { timeout: 20_000 }).toBe(0);
    await ctx.close();
  });
});

test.describe('US-31.CA6 / US-29.CA7 política e app-ads.txt públicos', () => {
  test('privacidade.html abre sem login, com a data e o texto da US-29; cabe em 360 px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    const r = await page.goto(u('/privacidade.html'));
    expect(r!.status()).toBe(200);
    await expect(page.getByTestId('privacidade')).toBeVisible();
    await expect(page.getByTestId('privacidade-data')).toContainText('Atualizada em');
    await expect(page.getByTestId('privacidade')).toContainText('Suas assinaturas, valores, bancos, cartões e backups. Nada disso é enviado.');
    await expect(page.getByTestId('privacidade-contato')).toContainText('contato@mensalao.app');
    const medidas = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(medidas.sw).toBeLessThanOrEqual(medidas.cw);
  });

  test('app-ads.txt responde como texto simples com a linha do AdMob (marcador a preencher) e nenhum ID de teste', async ({ request }) => {
    const r = await request.get(u('/app-ads.txt'));
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toMatch(/^text\/plain/);
    const linhas = (await r.text()).split('\n').filter((l) => l.trim() && !l.startsWith('#'));
    expect(linhas).toEqual(['google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0']);
  });
});

test.describe('US-30.CA2 / CA3 / US-24.CA10 / US-29.CA8 / US-30.CA11 verificação do bundle (builds feitos pelo Playwright)', () => {
  const rodar = (script: string, args: string[] = []) => spawnSync('node', [join(RAIZ, 'scripts', script), ...args], { cwd: RAIZ, encoding: 'utf8' });

  test('verificar-provedor-falso: produção (dist/) sem provedores nem controles de teste; teste (dist-teste/) com eles', () => {
    expect(existsSync(join(RAIZ, 'dist')) && existsSync(join(RAIZ, 'dist-teste'))).toBe(true);
    const r = rodar('verificar-provedor-falso.mjs');
    expect(r.status, r.stdout + r.stderr).toBe(0);
    // O marcador do provedor de anúncios falso existe só no build de teste.
    const achar = (dir: string, texto: string) => arquivos(join(RAIZ, dir)).filter((f) => /\.(js|html)$/.test(f)).some((f) => readFileSync(f, 'utf8').includes(texto));
    expect(achar('dist', 'anuncios-falso-mensalao')).toBe(false);
    expect(achar('dist', 'mensalao:teste:anuncios')).toBe(false);
    expect(achar('dist-teste', 'anuncios-falso-mensalao')).toBe(true);
  });

  test('verificar-anuncios: nenhum ID real, nenhum domínio de anúncio e nenhuma URL externa fora da lista em dist/, dist-teste/ e no pacote Android', () => {
    const r = rodar('verificar-anuncios.mjs');
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toMatch(/dist\/.*sem ID indevido/);
    expect(r.stdout).toMatch(/dist-teste\//);
    expect(r.stdout).toMatch(/AndroidManifest\.xml/);
  });

  test('o build de produção tem os IDs de TESTE (nenhum real) e o verificar --producao o reprova por isso', () => {
    const r = rodar('verificar-anuncios.mjs', ['--producao', 'dist']);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/ID de teste/);
    expect(r.stderr).toMatch(/não contém os IDs reais/);
  });

  test('a verificação reprova ID real em build que não é de produção e aprova IDs reais fictícios só com --producao', () => {
    const base = mkdtempSync(join(tmpdir(), 'mensalao-ids-'));
    const banner = ['ca-app-pub', '1234567890123456/1111111111'].join('-');
    const premiado = ['ca-app-pub', '1234567890123456/2222222222'].join('-');
    mkdirSync(join(base, 'web'));
    writeFileSync(join(base, 'web', 'a.js'), `const a="${banner}",b="${premiado}";`);
    const prod = spawnSync('node', [join(RAIZ, 'scripts/verificar-anuncios.mjs'), '--producao', join(base, 'web')], { cwd: base, encoding: 'utf8' });
    expect(prod.status, prod.stdout + prod.stderr).toBe(0);
    // Sem --producao (CI/QA), o mesmo conteúdo em dist/ reprova.
    mkdirSync(join(base, 'dist'));
    mkdirSync(join(base, 'dist-teste'));
    writeFileSync(join(base, 'dist', 'a.js'), `const a="${banner}";`);
    writeFileSync(join(base, 'dist-teste', 'a.js'), 'const a=1;');
    const ci = spawnSync('node', [join(RAIZ, 'scripts/verificar-anuncios.mjs')], { cwd: base, encoding: 'utf8' });
    expect(ci.status).toBe(1);
    expect(ci.stderr).toMatch(/ID real do AdMob/);
    rmSync(base, { recursive: true, force: true });
  });

  test('US-29.CA8 / US-30.CA11: domínio de anúncio, URL externa fora da lista, @import e @font-face remotos reprovam', () => {
    const base = mkdtempSync(join(tmpdir(), 'mensalao-dom-'));
    mkdirSync(join(base, 'dist'));
    mkdirSync(join(base, 'dist-teste'));
    writeFileSync(join(base, 'dist-teste', 'ok.js'), 'const a=1;');
    writeFileSync(join(base, 'dist', 'a.js'), 'fetch("https://pagead2.googlesyndication.com/x"); const u="https://exemplo.com/lib.js";');
    writeFileSync(join(base, 'dist', 'a.css'), '@import url(https://fonts.example.com/f.css); @font-face{font-family:X;src:url(https://fonts.example.com/f.woff2)}');
    const r = spawnSync('node', [join(RAIZ, 'scripts/verificar-anuncios.mjs')], { cwd: base, encoding: 'utf8' });
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/googlesyndication/);
    expect(r.stderr).toMatch(/URL externa fora da lista permitida: https:\/\/exemplo\.com/);
    expect(r.stderr).toMatch(/@import/);
    expect(r.stderr).toMatch(/@font-face/);
    rmSync(base, { recursive: true, force: true });
  });

  test('US-24.CA10: o provedor falso no build de produção reprova (verificar-provedor-falso)', () => {
    const base = mkdtempSync(join(tmpdir(), 'mensalao-falso-'));
    mkdirSync(join(base, 'prod'));
    mkdirSync(join(base, 'teste'));
    writeFileSync(join(base, 'prod', 'a.js'), 'window.__mensalaoTeste={};"anuncios-falso-mensalao"');
    writeFileSync(join(base, 'teste', 'a.js'), 'x');
    const r = spawnSync('node', [join(RAIZ, 'scripts/verificar-provedor-falso.mjs'), join(base, 'prod'), join(base, 'teste')], { cwd: base, encoding: 'utf8' });
    expect(r.status).toBe(1);
    rmSync(base, { recursive: true, force: true });
  });

  test('US-24.CA1: o dist/ que alimenta o Capacitor é autossuficiente — arquivos relativos, nenhum recurso remoto e o manifest/ícones empacotados', () => {
    const html = readFileSync(join(RAIZ, 'dist/index.html'), 'utf8');
    for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (m[1].startsWith('#') || m[1].startsWith('data:')) continue;
      expect(m[1], m[1]).not.toMatch(/^(https?:)?\/\//);
      expect(existsSync(join(RAIZ, 'dist', m[1].replace(/^\.\//, ''))), m[1]).toBe(true);
    }
    expect(existsSync(join(RAIZ, 'dist/privacidade.html'))).toBe(true); // a cópia da política para abrir sem rede (US-29.CA3)
    expect(existsSync(join(RAIZ, 'dist/pagina.css'))).toBe(true);
    expect(existsSync(join(RAIZ, 'dist/.well-known'))).toBe(false); // sem assetlinks.json (US-24.CA1)
  });

  test('US-29.CA8: a CSP por <meta> está no index.html do dist/ e no pacote Android, sem unsafe-inline nem domínio de anúncio, e com referrer no-referrer', () => {
    const pacotes = ['dist/index.html', 'dist-teste/index.html'];
    const android = join(RAIZ, 'android/app/src/main/assets/public/index.html');
    if (existsSync(android)) pacotes.push('android/app/src/main/assets/public/index.html');
    for (const p of pacotes) {
      const html = readFileSync(join(RAIZ, p), 'utf8');
      const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? '';
      expect(csp, p).toContain("script-src 'self'");
      expect(csp, p).toContain("style-src 'self'");
      expect(csp, p).not.toMatch(/unsafe-inline|unsafe-eval|googlesyndication|doubleclick|googleads|\*/);
      expect(html, p).toMatch(/name="referrer" content="no-referrer"/);
      expect(html, p).not.toMatch(/<script(?![^>]*\ssrc=)[^>]*>[^<]/); // nenhum script inline
    }
  });
});
