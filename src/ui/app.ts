// Moldura da aplicação e roteador: decide a tela pela rota e monta topo, banner, conteúdo e navegação.
import { aoMudarEstado, emRecuperacao, normalizarAgora } from '../loja';
import { fecharErroEspaco, haErroEspaco, processarCopias } from '../servicos/copias';
import { processarLembretes } from '../servicos/lembretes';
import { aoMudarPlano, ehPro, fecharAvisoRevogacao, haAvisoRevogacao, verificarAoAbrir } from '../servicos/pro';
import { criarBanner, fecharDialogosAbertos, seloPro } from './componentes';
import { h } from './dom';
import { icone, type NomeIcone } from './icones';
import { observarAjustes } from './ajuste';
import { adicionar } from './limite';
import { aplicarTema } from './temas';
import { consumirBanner, fecharBanner, registrarTroca, rotaAtual } from './navegacao';
import type { Aba, Tela } from './tela';
import { telaAjustes } from './telas/ajustes';
import { telaAssinaturas } from './telas/assinaturas';
import { telaCatalogo } from './telas/catalogo';
import { telaDetalhe } from './telas/detalhe';
import { telaFormulario } from './telas/formulario';
import { telaInicio } from './telas/inicio';
import { telaPro } from './telas/pro';
import { telaRecuperacao } from './telas/recuperacao';
import { telaTotais } from './telas/totais';

const ABAS: { aba: Aba; rotulo: string; hash: string; icone: NomeIcone }[] = [
  { aba: 'inicio', rotulo: 'Início', hash: '#/', icone: 'inicio' },
  { aba: 'assinaturas', rotulo: 'Assinaturas', hash: '#/assinaturas', icone: 'lista' },
  { aba: 'totais', rotulo: 'Totais', hash: '#/totais', icone: 'totais' },
  { aba: 'ajustes', rotulo: 'Ajustes', hash: '#/ajustes', icone: 'ajustes' },
];

let raiz: HTMLElement;
let ultimaRota = '';

/** Escolhe a tela pela rota. */
function resolverTela(rota: string, trocou: boolean): Tela {
  if (emRecuperacao()) return telaRecuperacao();
  const partes = rota.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [p0, p1, p2] = partes;
  if (p0 === 'pro') return telaPro(trocou);
  if (p0 === 'nova' && p1 === 'form') return telaFormulario({ modo: 'nova', catalogoId: p2 ?? null });
  if (p0 === 'nova') return telaCatalogo();
  if (p0 === 'ajustes') return telaAjustes();
  if (p0 === 'totais') return telaTotais();
  if (p0 === 'assinaturas') return telaAssinaturas();
  if (p0 === 'assinatura' && p1 && p2 === 'editar') return telaFormulario({ modo: 'editar', id: p1 });
  if (p0 === 'assinatura' && p1) return telaDetalhe(p1);
  return telaInicio();
}

let observadorNav: ResizeObserver | null = null;

/**
 * BUG-08: com texto grande as abas se empilham (2 linhas ou mais) e a barra fica mais alta que os 56 px do design;
 * a altura real vai para --altura-nav-atual, usada no respiro do fim do conteúdo, para a barra não cobrir nada.
 */
function observarAlturaNav(nav: HTMLElement): void {
  observadorNav?.disconnect();
  if (typeof ResizeObserver === 'undefined') return;
  const lista = nav.firstElementChild as HTMLElement;
  observadorNav = new ResizeObserver(() => {
    document.documentElement.style.setProperty('--altura-nav-atual', `${Math.ceil(lista.getBoundingClientRect().height)}px`);
  });
  observadorNav.observe(lista);
}

function montarNav(ativa: Aba): HTMLElement {
  return h(
    'nav',
    { class: 'nav', 'aria-label': 'Principal' },
    h(
      'ul',
      {},
      ABAS.map((a) =>
        h(
          'li',
          {},
          h(
            'a',
            { href: a.hash, 'aria-current': a.aba === ativa ? 'page' : null, testid: `nav-${a.aba}` },
            icone(a.icone, 'ic24'),
            a.rotulo,
          ),
        ),
      ),
    ),
  );
}

/** Monta a tela atual. Chamado a cada troca de rota e após ações na mesma tela. */
export function renderizar(): void {
  normalizarAgora();
  const rota = rotaAtual();
  const trocou = rota !== ultimaRota;
  ultimaRota = rota;
  const tela = resolverTela(rota, trocou);
  const { banner, novo } = consumirBanner(trocou);

  const h1 = h('h1', { tabindex: '-1', testid: 'titulo-tela' }, tela.titulo);
  // "+" simples na cor da marca (design 3.1): topo do Início e ao lado do título de Assinaturas.
  const btnMais = tela.adicionar
    ? h('button', { type: 'button', class: 'btn-mais', 'aria-label': 'Adicionar assinatura', testid: 'btn-adicionar', onclick: adicionar }, icone('mais'))
    : null;

  // Três formatos de topo (design 3.15): marca (Início, recuperação), interno (Voltar + h1) e título grande (abas).
  let topo: HTMLElement | null = null;
  let cabecalho: HTMLElement;
  if (tela.marca) {
    topo = h(
      'header',
      { class: 'topo' },
      h(
        'span',
        { class: 'marca' },
        'Mensalão',
        // Reconhecimento discreto da compra (carimbo Pro).
        ehPro() ? seloPro({ testid: 'selo-pro', 'aria-label': 'Mensalão Pro ativo' }) : null,
      ),
      btnMais,
    );
    cabecalho = h('div', { class: `secao-titulo${tela.classeTitulo ? ` ${tela.classeTitulo}` : ''}` }, h1, tela.subtitulo ? h('p', { class: 'sub', testid: 'subtitulo' }, tela.subtitulo) : null);
  } else if (tela.voltar) {
    topo = h(
      'header',
      { class: 'topo topo-interno' },
      h('button', { type: 'button', class: 'btn-voltar', 'aria-label': 'Voltar', testid: 'btn-voltar', onclick: tela.voltar }, icone('voltar', 'ic24')),
      h1,
    );
    cabecalho = h('div', {}, tela.subtitulo ? h('p', { class: 'sub', testid: 'subtitulo' }, tela.subtitulo) : null);
  } else {
    cabecalho = h(
      'div',
      {},
      h('div', { class: 'titulo-grande' }, h1, btnMais),
      tela.subtitulo ? h('p', { class: 'sub', testid: 'subtitulo' }, tela.subtitulo) : null,
    );
  }

  const elBanner = banner
    ? criarBanner(banner, () => {
        fecharBanner();
        elBanner?.remove();
        h1.focus();
      })
    : null;

  // Aviso único de revogação do Pro (US-12.CA6), neutro, no topo do conteúdo.
  const elRevogacao =
    haAvisoRevogacao() && !emRecuperacao()
      ? criarBanner(
          {
            tipo: 'info',
            linhas: ['Seu Mensalão Pro não foi encontrado na Google Play. Você voltou ao plano grátis; seus dados continuam todos aqui.'],
            testid: 'pro-revogado-aviso',
          },
          () => {
            fecharAvisoRevogacao();
            elRevogacao?.remove();
            h1.focus();
          },
        )
      : null;

  // Cópia automática sem espaço (US-14.CA7): aviso até ser fechado.
  const elEspaco =
    haErroEspaco() && !emRecuperacao()
      ? criarBanner(
          {
            tipo: 'erro',
            linhas: ['Não foi possível criar a cópia automática (sem espaço)', 'Exporte um arquivo de backup para não ficar sem cópia.'],
            testid: 'backup-erro-espaco',
          },
          () => {
            fecharErroEspaco();
            elEspaco?.remove();
            h1.focus();
          },
        )
      : null;

  const main = h(
    'main',
    { class: 'conteudo', id: 'conteudo' },
    elRevogacao,
    elBanner,
    elEspaco,
    tela.antesDoTitulo ?? [],
    cabecalho,
    tela.conteudo,
  );

  const app = h('div', { class: `app${tela.aba ? ' com-nav' : ''}` }, topo, main);
  if (tela.aba) {
    const nav = montarNav(tela.aba);
    app.append(nav);
    observarAlturaNav(nav);
  }
  document.body.classList.toggle('agrupado', !!tela.agrupado);

  raiz.replaceChildren(app);
  // US-22.CA4: número grande, "Por ano", abas e aviso de lembretes ajustados ao espaço real (qualquer fonte).
  observarAjustes(raiz);
  document.title = tela.marca ? 'Mensalão' : `${tela.titulo} — Mensalão`;

  const focoTela = tela.aoMontar?.();
  if (focoTela) focoTela.focus();
  else if (elBanner && novo) elBanner.focus();
  else if (trocou) {
    h1.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  } else if (!document.activeElement || document.activeElement === document.body) {
    // O elemento focado saiu do DOM na nova montagem: devolve o foco ao título.
    h1.focus({ preventScroll: true });
  }
}

/** Telas com campos em edição não são remontadas por eventos de fundo (para não perder o que foi digitado). */
function telaComFormulario(): boolean {
  const r = rotaAtual();
  return r.startsWith('#/nova/form') || r.endsWith('/editar');
}

export function iniciarApp(el: HTMLElement): void {
  raiz = el;
  window.addEventListener('hashchange', () => {
    // Diálogo modal aberto não sobrevive à troca de tela (BUG-01).
    fecharDialogosAbertos();
    registrarTroca();
    renderizar();
  });
  // A resposta da loja chega depois da primeira tela (US-12.CA9) e atualiza a tela sem recarregar.
  aoMudarEstado(() => processarCopias());
  aoMudarPlano((m) => {
    aplicarTema(); // revogado: volta ao padrão sem apagar a escolha (US-17.CA6)
    const criouCopia = processarCopias();
    void processarLembretes();
    setTimeout(() => {
      const naTelaPro = rotaAtual() === '#/pro';
      // Ajustes lista as cópias: a criada após a primeira montagem precisa aparecer (BUG-02).
      const listaCopiasMudou = criouCopia && rotaAtual() === '#/ajustes';
      if ((m.planoMudou || naTelaPro || listaCopiasMudou || haAvisoRevogacao() || haErroEspaco()) && !telaComFormulario()) renderizar();
    }, 0);
  });
  const aoMudarRede = (): void => {
    if (rotaAtual() === '#/pro') renderizar();
  };
  window.addEventListener('online', aoMudarRede);
  window.addEventListener('offline', aoMudarRede);
  // Ao voltar ao app (aba visível), recalcula datas e lembretes (melhor esforço, D-07).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    void processarLembretes();
    if (!telaComFormulario() && !document.querySelector('dialog[open]')) renderizar();
  });
  // BUG-06: marca se o teclado está em uso, para o anel do título (foco por script) aparecer só nesse caso.
  const raizDoc = document.documentElement;
  document.addEventListener('keydown', (ev) => { if (!ev.altKey && !ev.ctrlKey && !ev.metaKey) raizDoc.classList.add('teclado'); }, true);
  document.addEventListener('pointerdown', () => raizDoc.classList.remove('teclado'), true);
  aplicarTema();
  registrarTroca();
  renderizar();
  void verificarAoAbrir();
}
