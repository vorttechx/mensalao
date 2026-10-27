// Sprint 4 — verificações estáticas do repositório (arquivos, textos, manifesto, dependências). Nada aqui
// precisa de build, de aparelho ou de rede. Cada teste cita o critério de aceite que cobre.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = resolve(__dirname, '../..');
const ler = (p: string) => readFileSync(resolve(raiz, p), 'utf8');
const semTags = (html: string) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
const arquivosVersionados = (): string[] => execFileSync('git', ['ls-files'], { cwd: raiz, encoding: 'utf8' }).split('\n').filter(Boolean);
const EXT_TEXTO = /\.(ts|mjs|js|json|md|html|css|xml|gradle|yml|yaml|txt|webmanifest|svg|java|properties|pro)$/;
const EDITOR_TESTE = '3940256099942544';

describe('US-24.CA10 / CA14 manifesto Android e extração de dados', () => {
  const manifesto = ler('android/app/src/main/AndroidManifest.xml').replace(/<!--[\s\S]*?-->/g, '');
  const permissoes = [...manifesto.matchAll(/<uses-permission\s+android:name="([^"]+)"([^>]*)\/>/g)].map((m) => ({ nome: m[1], remove: /tools:node="remove"/.test(m[2]) }));
  const ativas = permissoes.filter((p) => !p.remove).map((p) => p.nome).sort();

  it('US-24.CA14: allowBackup=false e regras de extração que excluem tudo (nada de assinaturas no backup do Google)', () => {
    expect(manifesto).toMatch(/android:allowBackup="false"/);
    expect(manifesto).toMatch(/android:dataExtractionRules="@xml\/data_extraction_rules"/);
    const regras = ler('android/app/src/main/res/xml/data_extraction_rules.xml');
    expect(regras).toMatch(/<cloud-backup>[\s\S]*<exclude domain="sharedpref"[\s\S]*<\/cloud-backup>/);
    expect(regras).toMatch(/<device-transfer>[\s\S]*<exclude domain="file"[\s\S]*<\/device-transfer>/);
    expect(regras).not.toMatch(/<include/);
  });
  it('US-24.CA14: só as permissões necessárias (internet, ID de publicidade, notificações)', () => {
    expect(ativas).toEqual(['android.permission.INTERNET', 'android.permission.POST_NOTIFICATIONS', 'com.google.android.gms.permission.AD_ID']);
  });
  it('US-24.CA7: sem alarme exato, sem iniciar no boot e sem wake lock (lembretes só ao abrir)', () => {
    const removidas = permissoes.filter((p) => p.remove).map((p) => p.nome);
    expect(removidas).toEqual(expect.arrayContaining(['android.permission.SCHEDULE_EXACT_ALARM', 'android.permission.RECEIVE_BOOT_COMPLETED', 'android.permission.WAKE_LOCK']));
  });
  it('US-24.CA14: nenhuma permissão sensível (contatos, local, câmera, microfone, armazenamento, telefone, SMS)', () => {
    for (const proibida of ['CONTACTS', 'LOCATION', 'CAMERA', 'RECORD_AUDIO', 'EXTERNAL_STORAGE', 'READ_PHONE', 'SMS', 'CALENDAR', 'BODY_SENSORS']) {
      expect(manifesto, proibida).not.toContain(proibida);
    }
  });
  it('US-30.CA1: o ID do app no AdMob no manifesto é um marcador do build, nunca um ID fixo', () => {
    expect(manifesto).toMatch(/com\.google\.android\.gms\.ads\.APPLICATION_ID"\s+android:value="\$\{admobAppId\}"/);
    expect(manifesto).not.toMatch(/ca-app-pub-\d/);
  });
  it('US-24.CA1/CA2: pacote br.com.mensalao.app, Capacitor apontando para o dist/ e a atividade principal exportada só para o launcher', () => {
    const cap = JSON.parse(ler('capacitor.config.json'));
    expect(cap.appId).toBe('br.com.mensalao.app');
    expect(cap.webDir).toBe('dist');
    expect(cap.server).toBeUndefined(); // nada de URL remota: o app abre os arquivos do pacote (funciona offline)
    expect(cap.android?.allowMixedContent).toBe(false);
    expect(ler('android/app/build.gradle')).toMatch(/applicationId "br\.com\.mensalao\.app"/);
  });
  it('US-24.CA13/CA14: o FileProvider não é exportado e só compartilha o cache do app', () => {
    expect(manifesto).toMatch(/FileProvider[\s\S]*android:exported="false"/);
    expect(ler('android/app/src/main/res/xml/file_paths.xml')).toMatch(/cache-path/);
    expect(ler('android/app/src/main/res/xml/file_paths.xml')).not.toMatch(/external-path|root-path/);
  });
});

describe('US-30.CA1 / CA2 / CA9 nenhum ID real de anúncio no repositório', () => {
  it('nenhum arquivo versionado tem ID do AdMob que não seja de teste do Google', () => {
    const achados: string[] = [];
    for (const f of arquivosVersionados().filter((a) => EXT_TEXTO.test(a) && !a.endsWith('package-lock.json'))) {
      const t = readFileSync(resolve(raiz, f), 'utf8');
      for (const m of t.matchAll(/ca-app-pub-(\d{16})/g)) if (m[1] !== EDITOR_TESTE) achados.push(`${f}: ${m[0]}`);
      for (const m of t.matchAll(/\bpub-(\d{16})\b/g)) if (m[1] !== EDITOR_TESTE) achados.push(`${f}: ${m[0]} (ID de editor)`);
    }
    expect(achados).toEqual([]);
  });
  it('US-30.CA1: o build.gradle só tem o ID de app de TESTE e recusa o release sem ID real ou com o de teste', () => {
    const g = ler('android/app/build.gradle');
    expect(g).toMatch(/ADMOB_APP_ID_TESTE = 'ca-app-pub-3940256099942544~3347511713'/);
    expect(g).toMatch(/MENSALAO_ADMOB_APP_ID/);
    expect(g).toMatch(/Release sem MENSALAO_ADMOB_APP_ID válido/);
    expect(g).toMatch(/Release com o ID de TESTE/);
    expect(g).toMatch(/debug \{\s*manifestPlaceholders = \[admobAppId: ADMOB_APP_ID_TESTE\]/);
  });
  it('US-30.CA1: o vite.config.ts injeta só IDs de teste fora da produção e recusa ID de teste ou mal formado na produção', () => {
    const v = ler('vite.config.ts');
    expect(v).toContain('3940256099942544');
    expect(v).toMatch(/MENSALAO_ANUNCIOS/);
    expect(v).toMatch(/MENSALAO_ADMOB_BANNER_ID/);
    expect(v).toMatch(/MENSALAO_ADMOB_PREMIADO_ID/);
  });
  it('US-30.CA9: o aviso de nunca trocar os IDs de teste nem tocar em anúncio real está no README, no dev-notes e no guia', () => {
    expect(ler('README.md')).toMatch(/nunca[\s\S]{0,80}IDs de teste[\s\S]{0,200}nunca[\s\S]{0,60}an[úu]ncios? de produ/i);
    expect(ler('docs/loja/guia-publicacao.md')).toMatch(/nunca toque em anúncios reais/i);
  });
  it('US-29.CA10: o guia nunca instrui a clicar em anúncio real', () => {
    const g = ler('docs/loja/guia-publicacao.md').toLowerCase();
    for (const linha of g.split('\n').filter((l) => /clic|clique|tocar|toque/.test(l))) {
      expect(linha, linha).toMatch(/nunca|não|inválido|teste|sem/);
    }
  });
});

describe('US-30.CA10 (SUG-SEC-01) dependências com versão exata, Vitest 5.x e lock versionado', () => {
  const pkg = JSON.parse(ler('package.json'));
  const todas = { ...pkg.dependencies, ...pkg.devDependencies } as Record<string, string>;
  it('nenhuma dependência usa ^, ~, *, latest nem faixa', () => {
    const soltas = Object.entries(todas).filter(([, v]) => !/^\d+\.\d+\.\d+$/.test(v));
    expect(soltas).toEqual([]);
  });
  it('as dependências novas da sprint estão presentes: Capacitor, AdMob, Play Billing e notificações', () => {
    for (const d of ['@capacitor/core', '@capacitor/android', '@capacitor/cli', '@capacitor-community/admob', '@capgo/native-purchases', '@capacitor/local-notifications']) {
      expect(todas[d], d).toBeTruthy();
    }
  });
  it('Vitest na linha 5.x', () => {
    expect(todas.vitest).toMatch(/^5\./);
  });
  it('package-lock.json versionado e coerente com o package.json', () => {
    expect(arquivosVersionados()).toContain('package-lock.json');
    const lock = JSON.parse(ler('package-lock.json'));
    for (const [nome, versao] of Object.entries(todas)) expect(lock.packages[`node_modules/${nome}`]?.version, nome).toBe(versao);
  });
  it('US-24.CA2: Capacitor sem projeto TWA: nada de @bubblewrap/twa no projeto', () => {
    expect(Object.keys(todas).some((d) => /bubblewrap/i.test(d))).toBe(false);
    expect(existsSync(resolve(raiz, 'twa'))).toBe(false);
  });
});

describe('US-30.CA7 CI roda build, testes, verificação do bundle e E2E sem conta AdMob', () => {
  const ci = ler('.github/workflows/ci.yml');
  it('o workflow roda npm ci, npm test, verificar:bundle (que faz o build) e test:e2e', () => {
    expect(ci).toMatch(/npm ci/);
    expect(ci).toMatch(/npm test/);
    expect(ci).toMatch(/npm run verificar:bundle/);
    expect(ci).toMatch(/npm run test:e2e/);
  });
  it('nenhum segredo nem ID do AdMob na CI (só IDs de teste)', () => {
    expect(ci).not.toMatch(/secrets\./);
    expect(ci).not.toMatch(/MENSALAO_ADMOB/);
    expect(ci).not.toMatch(/MENSALAO_ANUNCIOS\s*[:=]\s*producao/);
  });
  it('o script verificar:bundle encadeia as três verificações', () => {
    const s = JSON.parse(ler('package.json')).scripts['verificar:bundle'] as string;
    for (const parte of ['verificar-provedor-falso', 'verificar-anuncios', 'verificar-site', 'build:site', 'cap sync android']) expect(s).toContain(parte);
  });
  it('US-31.CA1: o workflow do Pages publica só dist-site/ (nunca o dist/ do app)', () => {
    const pages = ler('.github/workflows/pages.yml');
    expect(pages).toMatch(/path:\s*dist-site/);
    expect(pages).not.toMatch(/path:\s*dist\s*$/m);
  });
});

describe('US-29.CA1 / CA2 / CA3 / CA9 / CA12 política de privacidade', () => {
  const html = ler('public/privacidade.html');
  const texto = semTags(html);
  const md = ler('docs/loja/politica-de-privacidade.md');
  it('US-29.CA1: não diz mais "não coletamos dados" nem "não mostramos anúncios" (HTML e Markdown)', () => {
    for (const t of [texto, md]) {
      expect(t).not.toMatch(/n[ãa]o coletamos (nenhum )?dados?/i);
      expect(t).not.toMatch(/n[ãa]o mostramos an[úu]ncios/i);
      expect(t).not.toMatch(/app (é|e) sem an[úu]ncios|nunca mostra an[úu]ncios/i);
    }
  });
  it('US-29.CA1: diz a verdade — assinaturas nunca saem, anúncios do Google (AdMob), ID de publicidade, IP, interações, diagnóstico, Pro sem SDK, escolha em Ajustes, LGPD e contato', () => {
    for (const t of [texto, md]) {
      for (const trecho of [
        /Suas assinaturas,? valores|assinaturas e valores|nunca envia ao Google as suas assinaturas|nunca saem/i,
        /AdMob/,
        /identificador de publicidade/i,
        /endere[çc]o IP/i,
        /intera[çc][õo]es com os an[úu]ncios/i,
        /diagn[óo]stico/i,
        /Pro[\s\S]{0,200}n[ãa]o mostra an[úu]ncios/i,
        /Anúncios e privacidade/,
        /LGPD/,
        /contato@mensalao\.app/,
      ]) expect(t).toMatch(trecho);
    }
    expect(texto).toMatch(/n[ãa]o inicia o sistema de an[úu]ncios|nem [ée] iniciado/i);
  });
  it('US-29.CA2: Google como controlador, links da política do Google e da central de anúncios, 18+, sem crianças, compra pela Google Play', () => {
    expect(texto).toMatch(/O Google [ée] o controlador/);
    expect(html).toMatch(/href="https:\/\/policies\.google\.com\/privacy"/);
    expect(html).toMatch(/href="https:\/\/policies\.google\.com\/technologies\/partner-sites"/);
    expect(html).toMatch(/href="https:\/\/myadcenter\.google\.com\/?"/);
    expect(texto).toMatch(/18 anos/);
    expect(texto).toMatch(/n[ãa]o [ée] direcionado a crian[çc]as/);
    expect(texto).toMatch(/Google Play/);
  });
  it('US-29.CA3: data da última atualização e página que cabe em 360 px (viewport, sem largura fixa)', () => {
    expect(texto).toMatch(/Atualizada em \d{1,2} de \w+ de 20\d\d/);
    expect(html).toMatch(/name="viewport" content="width=device-width/);
    expect(html).toMatch(/data-testid="privacidade-data"/);
    expect(ler('public/pagina.css')).not.toMatch(/(?<![-\w])width:\s*\d{4,}px/);
  });
  it('US-29.CA12: leitura em até 1 minuto — o resumo no topo e o texto todo em até ~700 palavras', () => {
    const palavras = texto.trim().split(/\s+/).length;
    expect(palavras).toBeLessThanOrEqual(700);
    const resumo = html.split('Em resumo')[1]?.split('<h2')[0] ?? '';
    expect(semTags(resumo).trim().split(/\s+/).length).toBeLessThanOrEqual(80);
  });
  it('US-29.CA9: a política e o app dizem o mesmo (grátis tem anúncios do Google; Pro não tem)', () => {
    const ajustes = ler('src/ui/telas/ajustes.ts');
    expect(ajustes).toMatch(/A versão grátis mostra anúncios do Google/);
    expect(ajustes).toMatch(/contato@mensalao\.app/);
    expect(texto).toMatch(/A vers[ãa]o gr[áa]tis mostra um an[úu]ncio do Google/);
  });
  it('US-29.CA3: a política no pacote e a do site são o mesmo arquivo (public/privacidade.html)', () => {
    expect(existsSync(resolve(raiz, 'privacidade.html'))).toBe(false);
    const construir = ler('scripts/construir-site.mjs');
    expect(construir).toMatch(/privacidade\.html/);
  });
});

describe('US-29.CA4 / CA5 / CA6 ficha da Play', () => {
  const ficha = ler('docs/loja/ficha-play.md');
  it('US-29.CA4: "Contém anúncios: sim" e a descrição curta/completa não prometem "sem anúncios" para o grátis', () => {
    expect(ficha).toMatch(/Contém anúncios: sim/);
    const curta = ficha.split('## Descrição curta')[1].split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('('))!;
    expect(curta.length).toBeLessThanOrEqual(80);
    expect(curta).not.toMatch(/sem an[úu]ncios/i);
    const completa = ficha.split('## Descrição completa')[1]?.split('\n## ')[0] ?? '';
    expect(completa.length).toBeGreaterThan(100);
    // "Sem anúncios" só aparece como benefício do Pro.
    for (const linha of completa.split('\n').filter((l) => /sem an[úu]ncios/i.test(l))) expect(linha).toMatch(/Pro|•/);
    expect(completa).toMatch(/• Sem anúncios/);
    expect(ficha).toContain('mensalao_pro');
    expect(ficha).toMatch(/19,99/);
  });
  it('US-29.CA5: Segurança dos dados — ID de publicidade, atividade no app, diagnóstico e local aproximado coletados e compartilhados; dados financeiros e conteúdo do usuário NÃO', () => {
    const tabela = ficha.split('## Segurança dos dados')[1].split('\n## ')[0];
    expect(tabela).toMatch(/ID de publicidade[^\n]*\| sim \| sim \(Google\)/);
    expect(tabela).toMatch(/Atividade no app[^\n]*\| sim \| sim \(Google\)/);
    expect(tabela).toMatch(/diagn[óo]stico[^\n]*\| sim \| sim \(Google\)/);
    expect(tabela).toMatch(/Local aproximado[^\n]*\| sim \| sim \(Google\)/);
    expect(tabela).toMatch(/Informações financeiras[^\n]*\*\*não\*\* \| \*\*não\*\*/);
    expect(tabela).toMatch(/Conteúdo do usuário[^\n]*\*\*não\*\* \| \*\*não\*\*/);
    expect(tabela).toMatch(/criptografados em trânsito\? \*\*Sim\*\*/);
    expect(tabela).toMatch(/opcional\? \*\*Não\*\*/);
  });
  it('US-29.CA6: AD_ID declarado, público 18+, fora do programa Famílias, classificação "Livre" com anúncios', () => {
    expect(ficha).toMatch(/com\.google\.android\.gms\.permission\.AD_ID/);
    expect(ficha).toMatch(/18 anos ou mais/);
    expect(ficha).toMatch(/Fora do programa Famílias/);
    expect(ficha).toMatch(/Livre\.[\s\S]*Contém anúncios/);
  });
});

describe('US-31.CA7 / US-29.CA7 fontes do site público', () => {
  it('US-29.CA7: app-ads.txt no formato do IAB com o marcador do Renato e sem ID de teste', () => {
    const linhas = ler('site/app-ads.txt').split('\n').filter((l) => l.trim() && !l.startsWith('#'));
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toMatch(/^google\.com, pub-(XXXXXXXXXXXXXXXX|\d{16}), DIRECT, f08c47fec0942fa0$/);
    expect(linhas[0]).not.toContain(EDITOR_TESTE);
  });
  it('US-31.CA7: o script do site tem até 2 KB e só uma linha de <script src>', () => {
    expect(Buffer.byteLength(ler('site/site.js'))).toBeLessThanOrEqual(2048);
    const index = ler('site/index.html');
    expect(index.match(/<script\b/g)).toHaveLength(1);
    expect(index).not.toMatch(/https?:\/\/(?!www\.w3\.org)/); // nenhum recurso de terceiros
  });
  it('US-31.CA5: o script do site nunca apaga, escreve nem lê o valor de dados do navegador', () => {
    const js = ler('site/site.js');
    for (const proibido of [/localStorage\.(clear|removeItem|setItem|getItem)/, /indexedDB/, /sessionStorage/, /document\.cookie/, /fetch\(|XMLHttpRequest|sendBeacon/]) expect(js).not.toMatch(proibido);
  });
  it('US-31.CA3: o sw.js do site só apaga caches (nunca dados), assume o controle, se desregistra e não cacheia nada', () => {
    const sw = ler('site/sw.js');
    for (const requerido of [/skipWaiting\(\)/, /clients\.claim\(\)/, /caches\.keys\(\)/, /caches\.delete\(/, /registration\.unregister\(\)/, /navigate\(/]) expect(sw).toMatch(requerido);
    for (const proibido of [/localStorage|indexedDB|clear\(/, /caches\.open|cache\.add|cache\.put/, /addEventListener\(\s*['"]fetch['"]/]) expect(sw).not.toMatch(proibido);
  });
});

describe('US-25.CA14 / US-28.CA13 a interface de anúncios não tem como carregar dado do usuário', () => {
  const iface = ler('src/plataforma/anuncios.ts');
  it('os únicos tipos de entrada são ConsentimentoAnuncios {personalizado: boolean} e PosicaoBanner {margemInferior: number}', () => {
    expect(iface).toMatch(/interface ConsentimentoAnuncios \{\s*readonly personalizado: boolean;\s*\}/);
    expect(iface).toMatch(/interface PosicaoBanner \{\s*readonly margemInferior: number;\s*\}/);
    // Linhas de método da interface: "nome(parâmetros): retorno;" (parâmetros podem ter parênteses de função).
    const metodos = [...iface.matchAll(/^ {2}(\w+)\((.*)\): [^;]+;$/gm)].map((m) => [m[1], m[2].trim()] as const);
    expect(metodos.map(([n]) => n)).toEqual(expect.arrayContaining(['disponivel', 'iniciar', 'mostrarBanner', 'carregarPremiado', 'mostrarPremiado']));
    const comParametro = metodos.filter(([, p]) => p);
    expect(comParametro.map(([n]) => n).sort()).toEqual(['aoMudarAltura', 'iniciar', 'mostrarBanner']);
    expect(comParametro.find(([n]) => n === 'iniciar')![1]).toBe('consentimento: ConsentimentoAnuncios');
    expect(comParametro.find(([n]) => n === 'mostrarBanner')![1]).toBe('posicao: PosicaoBanner');
    expect(comParametro.find(([n]) => n === 'aoMudarAltura')![1]).toBe('fn: (altura: number) => void');
  });
  it('as implementações de anúncios (real, falsa, indisponível) e o serviço nunca leem o armazenamento das assinaturas', () => {
    for (const f of ['src/plataforma/anuncios-admob.ts', 'src/plataforma/anuncios-indisponivel.ts', 'src/servicos/anuncios.ts', 'src/domain/anuncios.ts', 'src/domain/premiado.ts']) {
      const t = ler(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/.*$/gm, '');
      expect(t, f).not.toMatch(/from '\.\.\/loja'|from '\.\/loja'|obterEstado|valorCentavos|mensalao:v1|localStorage|domain\/tipos/);
    }
  });
  it('o adaptador real só repassa ID de bloco, posição, npa e flags fixas (sem palavras-chave, categorias nem conteúdo)', () => {
    const t = ler('src/plataforma/anuncios-admob.ts');
    expect(t).not.toMatch(/keywords|contentUrl|neighboringContentUrls|customTargeting|extras|userId|setUserId|ppid/i);
    expect(t).toMatch(/tagForChildDirectedTreatment: false/);
    expect(t).toMatch(/npa: this\.npa/);
  });
  it('o serviço do premiado não passa o conteúdo exportado ao provedor de anúncios', () => {
    const t = ler('src/servicos/premiado.ts');
    expect(t).not.toMatch(/gerarCsv|obterEstado|nomeArquivoCsv/);
  });
});

describe('US-29.CA8 / SUG-SEC-02 CSP', () => {
  const v = ler('vite.config.ts');
  const csp = v.slice(v.indexOf('export const CSP_APP'), v.indexOf('].join', v.indexOf('export const CSP_APP')));
  it('a CSP do app não tem unsafe-inline, unsafe-eval, curingas nem domínio de anúncio', () => {
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("style-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'none'");
    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|\*|https?:|googlesyndication|doubleclick|googleads/);
  });
  it('o código não escreve style="..." como atributo de texto (h() converte para setProperty, aceito pela CSP)', () => {
    const dom = ler('src/ui/dom.ts');
    expect(dom).toMatch(/style\.setProperty/);
    const outros = arquivosVersionados().filter((f) => f.startsWith('src/') && f.endsWith('.ts'));
    for (const f of outros) expect(ler(f), f).not.toMatch(/\.setAttribute\(\s*['"]style['"]|\.innerHTML\s*=\s*[`'"][^`'"]*style=/);
  });
  it('nenhuma página estática (política e site) tem style, script inline ou evento inline', () => {
    for (const f of ['public/privacidade.html', 'site/index.html', 'site/404.html']) {
      const t = ler(f);
      expect(t, f).toMatch(/Content-Security-Policy/);
      expect(t, f).not.toMatch(/'unsafe-inline'/);
      expect(t, f).not.toMatch(/\sstyle=|<style[\s>]|\son[a-z]+=/i);
      expect(t, f).toMatch(/name="referrer" content="no-referrer"/);
    }
  });
});
