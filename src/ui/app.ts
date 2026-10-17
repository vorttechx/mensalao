// Moldura da aplicação e roteador: decide a tela pela rota e monta topo, banner, conteúdo e navegação.
import { normalizarAgora } from '../loja';
import { botao, criarBanner } from './componentes';
import { h } from './dom';
import { icone, type NomeIcone } from './icones';
import { consumirBanner, fecharBanner, navegar, registrarTroca, rotaAtual } from './navegacao';
import type { Aba, Tela } from './tela';
import { telaAjustes } from './telas/ajustes';
import { telaCatalogo } from './telas/catalogo';
import { telaFormulario } from './telas/formulario';
import { telaInicio } from './telas/inicio';

const ABAS: { aba: Aba; rotulo: string; hash: string; icone: NomeIcone }[] = [
  { aba: 'inicio', rotulo: 'Início', hash: '#/', icone: 'inicio' },
  { aba: 'assinaturas', rotulo: 'Assinaturas', hash: '#/assinaturas', icone: 'lista' },
  { aba: 'totais', rotulo: 'Totais', hash: '#/totais', icone: 'totais' },
  { aba: 'ajustes', rotulo: 'Ajustes', hash: '#/ajustes', icone: 'ajustes' },
];

let raiz: HTMLElement;
let ultimaRota = '';

/** Escolhe a tela pela rota. */
function resolverTela(rota: string): Tela {
  const partes = rota.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [p0, p1, p2] = partes;
  if (p0 === 'nova' && p1 === 'form') return telaFormulario({ modo: 'nova', catalogoId: p2 ?? null });
  if (p0 === 'nova') return telaCatalogo();
  if (p0 === 'ajustes') return telaAjustes();
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
  const tela = resolverTela(rota);
  const { banner, novo } = consumirBanner(trocou);

  const h1 = h('h1', { tabindex: '-1', testid: 'titulo-tela' }, tela.titulo);
  const topo = h('header', { class: 'topo' });
  if (tela.voltar) {
    topo.append(h('button', { type: 'button', class: 'btn-voltar', 'aria-label': 'Voltar', testid: 'btn-voltar', onclick: tela.voltar }, icone('voltar', 'ic24')));
  }
  if (tela.marca) topo.append(h('span', { class: 'marca' }, icone('moeda', 'ic24'), 'Mensalão'));
  else topo.append(h1);

  const elBanner = banner
    ? criarBanner(banner, () => {
        fecharBanner();
        elBanner?.remove();
        h1.focus();
      })
    : null;

  const main = h(
    'main',
    { class: 'conteudo', id: 'conteudo' },
    elBanner,
    tela.marca ? h1 : null,
    tela.subtitulo ? h('p', { class: 'sub', testid: 'subtitulo' }, tela.subtitulo) : null,
    tela.conteudo,
  );

  const app = h('div', { class: `app${tela.aba ? ' com-nav' : ''}` }, topo, main);
  if (tela.fab) app.append(botao('Adicionar', 'primario', () => navegar('#/nova'), { testid: 'btn-adicionar', icone: 'mais', attrs: { class: 'btn btn-primario fab' } }));
  if (tela.aba) app.append(montarNav(tela.aba));

  raiz.replaceChildren(app);
  document.title = tela.marca ? 'Mensalão' : `${tela.titulo} — Mensalão`;

  if (elBanner && novo) elBanner.focus();
  else if (trocou) {
    h1.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}

export function iniciarApp(el: HTMLElement): void {
  raiz = el;
  window.addEventListener('hashchange', () => {
    registrarTroca();
    renderizar();
  });
  registrarTroca();
  renderizar();
}
