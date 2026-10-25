// US-11 / US-12 — Tela "Mensalão Pro": oferta, compra única e restaurar compra (design.md 9.2 e 9.3).
// A área de compra e a de restauração são atualizadas no lugar (sem remontar a tela) a cada resposta da loja.
import {
  comprarPro,
  consultarPreco,
  ehPro,
  obterDisponibilidade,
  restaurarCompra,
  type ResultadoRestaurar,
} from '../../servicos/pro';
import { botao } from '../componentes';
import { h, novoId } from '../dom';
import { icone } from '../icones';
import { voltar } from '../navegacao';
import type { Tela } from '../tela';

/** Endereço da ficha na Google Play. Vazio enquanto o app não estiver publicado: o botão fica oculto (US-11.CA7). */
export const URL_FICHA_PLAY = '';

const RECURSOS: { nome: string; descricao: string }[] = [
  { nome: 'Assinaturas ilimitadas', descricao: 'O grátis vai até 5 ativas.' },
  { nome: 'Lembrete antes da cobrança', descricao: 'Aviso de 0 a 7 dias antes.' },
  { nome: 'Backup automático', descricao: 'Cópias no aparelho e lembrete para exportar um arquivo.' },
  { nome: 'Exportar planilha CSV', descricao: 'Para Excel ou Google Planilhas.' },
  { nome: 'Gráficos por categoria', descricao: 'Veja onde suas assinaturas mais pesam.' },
  { nome: 'Temas', descricao: 'Azul-noite, Grafite e Ameixa.' },
];

type EstadoPreco = { tipo: 'carregando' } | { tipo: 'ok'; preco: string } | { tipo: 'erro' };

interface EstadoTela {
  preco: EstadoPreco;
  precoPedido: boolean;
  comprando: boolean;
  msgCompra: 'cancelada' | 'erro' | null;
  restaurando: boolean;
  msgRestaurar: ResultadoRestaurar | null;
  /** Acabou de virar Pro nesta visita (foco e anúncio no "Você é Pro"). */
  virouPro: boolean;
}

function estadoInicial(): EstadoTela {
  return { preco: { tipo: 'carregando' }, precoPedido: false, comprando: false, msgCompra: null, restaurando: false, msgRestaurar: null, virouPro: false };
}

let st: EstadoTela = estadoInicial();
let areaCompra: HTMLElement | null = null;
let areaRestaurar: HTMLElement | null = null;

function online(): boolean {
  return navigator.onLine !== false;
}

function listaRecursos(): HTMLElement {
  return h(
    'ul',
    { class: 'pro-recursos', testid: 'pro-recursos' },
    RECURSOS.map((r) =>
      h('li', {}, icone('check', 'ic24'), h('div', {}, h('b', {}, r.nome), h('span', {}, r.descricao))),
    ),
  );
}

function indicador(texto: string, testid?: string): HTMLElement {
  return h('p', { class: 'carregando', 'aria-live': 'polite', testid }, icone('girar'), h('span', {}, texto));
}

function bannerArea(tipo: 'ok' | 'info' | 'erro', texto: string, testid: string): HTMLElement {
  return h(
    'div',
    { class: `banner ${tipo === 'erro' ? 'banner-erro' : 'banner-ok'}`, role: tipo === 'erro' ? 'alert' : 'status', tabindex: '-1', testid },
    icone(tipo === 'erro' ? 'alerta' : 'info', 'ic24'),
    h('div', { class: 'texto' }, h('p', {}, texto)),
  );
}

/** Pede o preço à loja (uma vez por visita, ou de novo em "Tentar de novo"). */
function pedirPreco(): void {
  st.precoPedido = true;
  st.preco = { tipo: 'carregando' };
  const visita = st;
  consultarPreco().then(
    (preco) => {
      if (visita !== st) return;
      st.preco = preco ? { tipo: 'ok', preco } : { tipo: 'erro' };
      atualizarCompra();
    },
    () => {
      if (visita !== st) return;
      st.preco = { tipo: 'erro' };
      atualizarCompra();
    },
  );
}

async function comprar(): Promise<void> {
  if (st.comprando) return; // toques repetidos não abrem duas compras (US-11.CA6)
  st.comprando = true;
  st.msgCompra = null;
  atualizarCompra();
  const visita = st;
  const r = await comprarPro();
  if (visita !== st) return;
  st.comprando = false;
  if (r === 'ok') {
    // O serviço avisa a moldura, que remonta a tela já como "Você é Pro" (sem recarregar, US-11.CA4).
    st.virouPro = true;
    return;
  }
  st.msgCompra = r === 'cancelado' ? 'cancelada' : 'erro';
  atualizarCompra();
  areaCompra?.querySelector<HTMLElement>('.banner')?.focus();
}

async function restaurar(): Promise<void> {
  if (st.restaurando) return;
  st.restaurando = true;
  st.msgRestaurar = null;
  atualizarRestaurar();
  const visita = st;
  const r = await restaurarCompra();
  if (visita !== st) return;
  st.restaurando = false;
  st.msgRestaurar = r;
  if (r === 'restaurado') {
    st.virouPro = true;
    return;
  }
  atualizarRestaurar();
  areaRestaurar?.querySelector<HTMLElement>('.banner')?.focus();
}

function conteudoCompra(): Node[] {
  const disp = obterDisponibilidade();
  if (disp === 'nao') {
    return [
      h(
        'div',
        { class: 'pro-indisponivel', testid: 'pro-indisponivel' },
        icone('info', 'ic24'),
        h(
          'div',
          {},
          h('p', { class: 'forte' }, 'A compra do Pro está disponível no app do Mensalão na Google Play'),
          h('p', { class: 'nota' }, 'Seus dados continuam funcionando normalmente aqui.'),
          URL_FICHA_PLAY
            ? h('a', { class: 'btn btn-primario', href: URL_FICHA_PLAY, rel: 'noopener', target: '_blank', testid: 'pro-btn-play' }, 'Abrir na Google Play')
            : null,
        ),
      ),
    ];
  }

  const filhos: Node[] = [];
  if (st.msgCompra === 'cancelada') filhos.push(bannerArea('info', 'Compra cancelada. Você não foi cobrado.', 'pro-cancelada'));
  if (st.msgCompra === 'erro') filhos.push(bannerArea('erro', 'Não foi possível concluir a compra. Tente novamente.', 'pro-erro'));

  const btnBase = { testid: 'pro-btn-comprar', larga: true };
  if (!online()) {
    const b = botao('Comprar Pro', 'primario', () => undefined, btnBase);
    b.disabled = true;
    filhos.push(b, h('p', { class: 'nota com-icone', testid: 'pro-offline' }, icone('info'), h('span', {}, 'Você está sem conexão. Para comprar, conecte-se à internet.')));
    return filhos;
  }
  if (disp === 'verificando' || st.preco.tipo === 'carregando') {
    const b = botao('Comprar Pro', 'primario', () => undefined, btnBase);
    b.disabled = true;
    filhos.push(b, indicador('Carregando preço…', 'pro-carregando'));
    return filhos;
  }
  if (st.preco.tipo === 'erro') {
    const b = botao('Comprar Pro', 'primario', () => undefined, btnBase);
    b.disabled = true;
    filhos.push(
      b,
      h('p', { class: 'msg-erro', role: 'alert', testid: 'pro-erro-preco' }, icone('alerta'), h('span', {}, 'Não foi possível consultar o preço agora. Tente de novo.')),
      botao('Tentar de novo', 'secundario', () => {
        pedirPreco();
        atualizarCompra();
      }, { testid: 'pro-btn-recarregar', larga: true }),
    );
    return filhos;
  }
  const b = botao(st.comprando ? 'Abrindo a Google Play…' : `Comprar Pro por ${st.preco.preco}`, 'primario', () => void comprar(), btnBase);
  b.classList.add('btn-alta');
  if (st.comprando) {
    b.disabled = true;
    b.setAttribute('aria-busy', 'true');
  }
  filhos.push(b, h('p', { class: 'nota centro' }, 'Compra única pela Google Play. Sem renovação e sem cobrança mensal.'));
  return filhos;
}

function atualizarCompra(): void {
  if (!areaCompra) return;
  const disp = obterDisponibilidade();
  if (disp === 'sim' && !st.precoPedido && online()) pedirPreco();
  const tinhaFoco = areaCompra.contains(document.activeElement);
  areaCompra.replaceChildren(...conteudoCompra());
  if (tinhaFoco) areaCompra.querySelector<HTMLElement>('button:not([disabled]), .banner')?.focus();
}

function conteudoRestaurar(): Node[] {
  const filhos: Node[] = [];
  const disp = obterDisponibilidade();
  const msg = st.msgRestaurar;
  if (msg === 'sem-compra') filhos.push(bannerArea('info', 'Não encontramos compra do Pro nesta conta da Google Play', 'pro-restaurar-msg'));
  if (msg === 'erro') filhos.push(bannerArea('erro', 'Não foi possível verificar agora. Tente de novo mais tarde.', 'pro-restaurar-msg'));
  const idAjuda = novoId('ajuda-restaurar');
  const b = botao(st.restaurando ? 'Verificando…' : 'Restaurar compra', 'secundario', () => void restaurar(), {
    testid: 'pro-btn-restaurar',
    larga: true,
    attrs: { 'aria-describedby': idAjuda },
  });
  if (disp !== 'sim' || st.restaurando) b.disabled = true;
  if (st.restaurando) b.setAttribute('aria-busy', 'true');
  filhos.push(b);
  if (st.restaurando) filhos.push(indicador('Verificando…'));
  filhos.push(
    h(
      'p',
      { class: 'nota', id: idAjuda },
      disp === 'nao' ? 'A compra e a restauração só funcionam no app da Google Play.' : 'Já comprou em outro celular? Use a mesma conta da Google Play.',
    ),
  );
  return filhos;
}

function atualizarRestaurar(): void {
  if (!areaRestaurar) return;
  areaRestaurar.replaceChildren(...conteudoRestaurar());
}

function blocoPro(): HTMLElement[] {
  const restaurou = st.msgRestaurar === 'restaurado';
  return [
    restaurou ? bannerArea('ok', 'Compra restaurada. Obrigado!', 'pro-restaurar-msg') : null,
    h(
      'div',
      { class: 'pro-ativo', testid: 'pro-ativo' },
      h('h2', { id: 'titulo-pro-ativo', tabindex: '-1' }, icone('check', 'ic24'), 'Você é Pro'),
      h('p', {}, 'Obrigado por apoiar o Mensalão. Todos os recursos estão liberados neste aparelho.'),
    ),
    h('p', { class: 'sr-only', 'aria-live': 'polite' }, st.virouPro ? 'Você é Pro' : ''),
    h('h2', { class: 'secao' }, 'Incluído no seu Pro'),
    listaRecursos(),
    botao('Voltar ao Mensalão', 'primario', () => voltar('#/'), { testid: 'pro-btn-voltar-app', larga: true }),
  ].filter((x): x is HTMLElement => x !== null);
}

/** `entrou` = acabou de chegar à rota (zera mensagens e consulta o preço de novo). */
export function telaPro(entrou: boolean): Tela {
  if (entrou) st = estadoInicial();
  const pro = ehPro();
  let conteudo: HTMLElement;
  if (pro) {
    areaCompra = null;
    areaRestaurar = null;
    conteudo = h('div', { class: 'pro-tela', testid: 'pro-tela' }, ...blocoPro());
  } else {
    areaCompra = h('div', { class: 'pro-compra pilha' });
    areaRestaurar = h('div', { class: 'pro-restaurar pilha' });
    conteudo = h(
      'div',
      { class: 'pro-tela', testid: 'pro-tela' },
      h('p', { class: 'pro-promessa' }, h('strong', {}, 'Pague uma vez, use para sempre.'), ' ', h('span', {}, 'Sem mensalidade e sem anúncios.')),
      h('h2', { class: 'secao' }, 'O que vem no Pro'),
      listaRecursos(),
      areaCompra,
      areaRestaurar,
      h(
        'p',
        { class: 'nota com-icone', testid: 'pro-nota-gratis' },
        icone('info'),
        h('span', {}, 'O Mensalão grátis continua funcionando, sem prazo: até 5 assinaturas ativas, próximas cobranças, totais, guia de cancelamento e backup em arquivo.'),
      ),
    );
    atualizarCompra();
    atualizarRestaurar();
  }
  const virou = st.virouPro && pro;
  return {
    titulo: 'Mensalão Pro',
    voltar: () => voltar('#/'),
    conteudo: [conteudo],
    aoMontar: virou ? () => conteudo.querySelector<HTMLElement>('#titulo-pro-ativo') : undefined,
  };
}
