// Moldura da aplicação e roteador: decide a tela pela rota e monta topo, banner, conteúdo e navegação.
import { emRecuperacao, normalizarAgora } from '../loja';
import { processarLembretes } from '../servicos/lembretes';
import { aoMudarPlano, ehPro, fecharAvisoRevogacao, haAvisoRevogacao, verificarAoAbrir } from '../servicos/pro';
import { botao, criarBanner, seloPro } from './componentes';
import { h } from './dom';
import { icone, type NomeIcone } from './icones';
import { adicionar } from './limite';
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
            h('span', { class: 'pil' }, icone(a.icone, 'ic24')),
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
  const topo = h('header', { class: 'topo' });
  if (tela.voltar) {
    topo.append(h('button', { type: 'button', class: 'btn-voltar', 'aria-label': 'Voltar', testid: 'btn-voltar', onclick: tela.voltar }, icone('voltar', 'ic24')));
  }
  if (tela.marca) {
    topo.append(h('span', { class: 'marca' }, icone('moeda', 'ic24'), 'Mensalão'));
    // Reconhecimento discreto da compra (design 8.1, decisão S2-5).
    if (ehPro()) topo.append(seloPro({ testid: 'selo-pro', 'aria-label': 'Mensalão Pro ativo' }));
  } else topo.append(h1);

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

  const main = h(
    'main',
    { class: 'conteudo', id: 'conteudo' },
    elRevogacao,
    elBanner,
    tela.marca ? h1 : null,
    tela.subtitulo ? h('p', { class: 'sub', testid: 'subtitulo' }, tela.subtitulo) : null,
    tela.conteudo,
  );

  const app = h('div', { class: `app${tela.aba ? ' com-nav' : ''}` }, topo, main);
  if (tela.fab) app.append(botao('Adicionar', 'primario', adicionar, { testid: 'btn-adicionar', icone: 'mais', attrs: { class: 'btn btn-primario fab' } }));
  if (tela.aba) app.append(montarNav(tela.aba));

  raiz.replaceChildren(app);
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
    registrarTroca();
    renderizar();
  });
  // A resposta da loja chega depois da primeira tela (US-12.CA9) e atualiza a tela sem recarregar.
  aoMudarPlano((m) => {
    void processarLembretes();
    setTimeout(() => {
      const naTelaPro = rotaAtual() === '#/pro';
      if ((m.planoMudou || naTelaPro || haAvisoRevogacao()) && !telaComFormulario()) renderizar();
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
  registrarTroca();
  renderizar();
  void verificarAoAbrir();
}
