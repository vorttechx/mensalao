// US-03 / US-05 / US-06 — Detalhe da assinatura (design.md 4.4).
import { formatarDataBR } from '../../domain/datas';
import { formatarBRL } from '../../domain/dinheiro';
import { rotuloCiclo, rotuloPagamento, sufixoCiclo, type Assinatura } from '../../domain/tipos';
import { montarGuia } from '../../domain/guia';
import { excluirAssinatura, marcarCancelada, pausar, reativar, substituirAssinatura } from '../../domain/operacoes';
import { definirEstado, hoje, obterEstado } from '../../loja';
import { renderizar } from '../app';
import { botao, confirmar, estadoVazio, selo } from '../componentes';
import { h } from '../dom';
import { icone } from '../icones';
import { avisar, navegar, substituir, voltar } from '../navegacao';
import type { Tela } from '../tela';
import { hrefDetalhe, selosReajuste } from './comum';

function linha(rotulo: string, valor: string | Node, testid?: string): HTMLElement {
  return h('div', {}, h('dt', {}, rotulo), h('dd', { testid }, valor));
}

/** Histórico de preços em ordem cronológica (US-03.CA5). */
function secaoHistorico(a: Assinatura): HTMLElement {
  const corpo =
    a.historico.length === 0
      ? h('p', { class: 'nota', testid: 'price-history-vazio' }, 'Sem alterações de preço desde o cadastro.')
      : h(
          'ol',
          { class: 'historico', testid: 'price-history' },
          a.historico.map((m) =>
            h(
              'li',
              { testid: 'price-history-item' },
              h('span', {}, formatarDataBR(m.data)),
              h('span', {}, `${formatarBRL(m.deCentavos)} → ${formatarBRL(m.paraCentavos)}`),
            ),
          ),
          h('li', { class: 'atual' }, h('span', {}, 'Valor atual'), h('span', {}, formatarBRL(a.valorCentavos))),
        );
  return h(
    'section',
    { 'aria-labelledby': 'titulo-historico' },
    h('h2', { class: 'secao', id: 'titulo-historico' }, 'Histórico de preços'),
    h('div', { class: 'cartao' }, corpo),
  );
}

function aplicar(nova: Assinatura, mensagem: string): void {
  definirEstado(substituirAssinatura(obterEstado(), nova));
  avisar({ tipo: 'ok', linhas: [mensagem] });
  renderizar();
}

/** Marca como cancelada (US-05.CA3). Também usada pelo guia "Como cancelar". */
export function acaoMarcarCancelada(a: Assinatura): void {
  aplicar(marcarCancelada(a, hoje()), `${a.nome} marcada como cancelada.`);
}

function acaoPausar(a: Assinatura): void {
  aplicar(pausar(a), `${a.nome} pausada. Ela não entra nos totais nem nas próximas cobranças.`);
}

function acaoReativar(a: Assinatura): void {
  const r = reativar(a, hoje());
  aplicar(r, `${a.nome} reativada. Próxima cobrança: ${formatarDataBR(r.proxima)}.`);
}

async function acaoExcluir(a: Assinatura): Promise<void> {
  const ok = await confirmar({ titulo: `Excluir ${a.nome}?`, texto: 'Esta ação não pode ser desfeita.', rotuloConfirmar: 'Excluir' });
  if (!ok) return;
  definirEstado(excluirAssinatura(obterEstado(), a.id));
  avisar({ tipo: 'ok', linhas: [`${a.nome} excluída.`] });
  substituir('#/');
}

/** Guia "Como cancelar" (US-06): botão disclosure + painel com os textos. */
function guiaCancelamento(a: Assinatura): { botao: HTMLButtonElement; painel: HTMLElement } {
  const g = montarGuia(a);
  const painel = h(
    'div',
    { class: 'guia', id: 'guia', testid: 'cancel-guide', hidden: true, role: 'region', 'aria-label': 'Como cancelar' },
    g.servico ? h('p', { testid: 'guia-servico' }, g.servico) : null,
    g.lojaApps ? h('p', { testid: 'guia-loja' }, g.lojaApps) : null,
    g.pix ? h('div', { testid: 'guia-pix' }, h('h3', {}, 'Pix Automático'), h('p', {}, g.pix)) : null,
    h('p', { class: 'aviso-guia' }, icone('info'), h('span', {}, g.avisoFinal)),
    a.status !== 'cancelada'
      ? botao('Marcar como cancelada', 'secundario', () => acaoMarcarCancelada(a), { testid: 'btn-guia-marcar-cancelada', larga: true })
      : null,
  );
  const b = botao('Como cancelar', 'secundario', () => {
    const abrir = painel.hidden;
    painel.hidden = !abrir;
    b.setAttribute('aria-expanded', String(abrir));
  }, { testid: 'btn-como-cancelar', attrs: { 'aria-expanded': 'false', 'aria-controls': 'guia' } });
  return { botao: b, painel };
}

function situacao(a: Assinatura): Node {
  if (a.status === 'pausada') return selo('neutro', 'Pausada', 'badge-pausada');
  if (a.status === 'cancelada') return selo('cancelada', 'Cancelada', 'badge-cancelada');
  return document.createTextNode('Ativa');
}

/** Ações de mudança de situação e exclusão, conforme o status (design.md 4.4). */
function acoesSituacao(a: Assinatura): HTMLElement[] {
  const pilha = h('div', { class: 'pilha acoes-detalhe' });
  if (a.status === 'ativa') pilha.append(botao('Pausar', 'secundario', () => acaoPausar(a), { testid: 'btn-pausar', larga: true }));
  else pilha.append(botao('Reativar', 'primario', () => acaoReativar(a), { testid: 'btn-reativar', larga: true }));
  if (a.status !== 'cancelada') {
    pilha.append(botao('Marcar como cancelada', 'secundario', () => acaoMarcarCancelada(a), { testid: 'btn-cancelar', larga: true }));
  }
  const perigo = h('div', { class: 'zona-perigo' }, botao('Excluir assinatura', 'perigo', () => void acaoExcluir(a), { testid: 'btn-excluir', larga: true }));
  return [pilha, perigo];
}

export function telaDetalhe(id: string): Tela {
  const a = obterEstado().assinaturas.find((x) => x.id === id);
  if (!a) {
    return {
      titulo: 'Assinatura não encontrada',
      voltar: () => voltar('#/'),
      conteudo: [estadoVazio({ testid: 'nao-encontrada', ilustracao: false, textos: ['Esta assinatura não existe mais.'] })],
    };
  }
  const selos = selosReajuste(a);
  const guia = guiaCancelamento(a);

  return {
    titulo: a.nome,
    voltar: () => voltar('#/'),
    conteudo: [
      h('p', { class: 'valor-detalhe', testid: 'detalhe-valor' }, formatarBRL(a.valorCentavos), ' ', h('small', {}, sufixoCiclo(a.ciclo))),
      selos.length ? h('div', { class: 'selos' }, selos) : null,
      h(
        'div',
        { class: 'cartao' },
        h(
          'dl',
          { class: 'dados', testid: 'detalhe-dados' },
          linha('Próxima cobrança', formatarDataBR(a.proxima), 'detalhe-proxima'),
          linha('Ciclo', rotuloCiclo(a.ciclo)),
          linha('Pagamento', rotuloPagamento(a.pagamento)),
          a.banco ? linha('Banco ou cartão', a.banco) : null,
          linha('Categoria', a.categoria),
          a.emTeste && a.fimTeste ? linha('Fim do teste grátis', formatarDataBR(a.fimTeste)) : null,
          linha('Situação', situacao(a), 'detalhe-situacao'),
          a.status === 'cancelada' && a.canceladaEm ? linha('Cancelada em', formatarDataBR(a.canceladaEm), 'detalhe-cancelada-em') : null,
        ),
      ),
      h(
        'div',
        { class: 'duas acoes-detalhe' },
        botao('Editar', 'secundario', () => navegar(`${hrefDetalhe(a)}/editar`), { testid: 'btn-editar' }),
        guia.botao,
      ),
      guia.painel,
      secaoHistorico(a),
      ...acoesSituacao(a),
    ],
  };
}
