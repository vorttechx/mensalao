// US-03 / US-05 / US-06 / US-22 — Detalhe da assinatura em listas agrupadas (design 4.5).
import { formatarDataBR } from '../../domain/datas';
import { formatarBRL } from '../../domain/dinheiro';
import { rotuloCiclo, rotuloPagamento, sufixoCiclo, type Assinatura } from '../../domain/tipos';
import { montarGuia } from '../../domain/guia';
import { excluirAssinatura, marcarCancelada, pausar, reativar, substituirAssinatura } from '../../domain/operacoes';
import { definirEstado, hoje, obterEstado } from '../../loja';
import { renderizar } from '../app';
import { confirmar, dinheiro, estadoVazio, linhaAcao, monogramaEl, selo } from '../componentes';
import { h } from '../dom';
import { icone } from '../icones';
import { avisarLimite, podeAdicionar } from '../limite';
import { avisar, navegar, substituir, voltar } from '../navegacao';
import type { Tela } from '../tela';
import { hrefDetalhe, selosReajuste } from './comum';

function linha(rotulo: string, valor: string | Node, testid?: string): HTMLElement {
  return h('div', { class: 'lin' }, h('dt', {}, rotulo), h('dd', { testid }, valor));
}

/** Histórico de preços em ordem cronológica (US-03.CA5). */
function secaoHistorico(a: Assinatura): HTMLElement {
  const corpo =
    a.historico.length === 0
      ? h('div', { class: 'grupo' }, h('p', { class: 'lin historico-vazio', testid: 'price-history-vazio' }, 'Sem alterações de preço desde o cadastro.'))
      : h(
          'ol',
          { class: 'grupo historico', testid: 'price-history' },
          a.historico.map((m) =>
            h(
              'li',
              { class: 'lin', testid: 'price-history-item' },
              h('span', { class: 'data' }, formatarDataBR(m.data)),
              // Cada valor não quebra; a linha pode quebrar só na seta (BUG-04, texto a 200%).
              h('span', {}, h('span', { class: 'sem-quebra' }, formatarBRL(m.deCentavos)), ' → ', h('span', { class: 'sem-quebra' }, formatarBRL(m.paraCentavos))),
            ),
          ),
          h('li', { class: 'lin atual' }, h('span', {}, 'Valor atual'), h('span', { class: 'sem-quebra' }, formatarBRL(a.valorCentavos))),
        );
  return h(
    'section',
    { 'aria-labelledby': 'titulo-historico' },
    h('h2', { class: 'g-titulo', id: 'titulo-historico' }, 'Histórico de preços'),
    corpo,
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
  // Reativar cria uma nova ativa: no limite do grátis, continua pausada/cancelada (US-09.CA4).
  if (!podeAdicionar()) {
    void avisarLimite({ reativarNome: a.nome });
    return;
  }
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

/** Guia "Como cancelar" (US-06): linha disclosure + painel dentro do mesmo grupo. */
function guiaCancelamento(a: Assinatura): { botao: HTMLButtonElement; painel: HTMLElement; marcar: HTMLElement | null } {
  const g = montarGuia(a);
  const painel = h(
    'div',
    { class: 'guia', id: 'guia', testid: 'cancel-guide', hidden: true, role: 'region', 'aria-label': 'Como cancelar' },
    g.servico ? h('p', { testid: 'guia-servico' }, g.servico) : null,
    g.lojaApps ? h('p', { class: 'nota', testid: 'guia-loja' }, g.lojaApps) : null,
    g.pix ? h('div', { testid: 'guia-pix' }, h('h3', {}, 'Pix Automático'), h('p', {}, g.pix)) : null,
    h('p', { class: 'nota com-icone' }, icone('info'), h('span', {}, g.avisoFinal)),
  );
  // "Marcar como cancelada" fecha o guia, para quem acabou de ler (só aparece com o guia aberto).
  const marcar =
    a.status !== 'cancelada' ? linhaAcao('Marcar como cancelada', () => acaoMarcarCancelada(a), { testid: 'btn-guia-marcar-cancelada' }) : null;
  if (marcar) marcar.hidden = true;
  const seta = icone('chevron-baixo', 'ic seta');
  const b = linhaAcao('Como cancelar', () => {
    const abrir = painel.hidden;
    painel.hidden = !abrir;
    if (marcar) marcar.hidden = !abrir;
    b.setAttribute('aria-expanded', String(abrir));
  }, { testid: 'btn-como-cancelar', attrs: { 'aria-expanded': 'false', 'aria-controls': 'guia' } });
  b.append(seta);
  return { botao: b, painel, marcar };
}

function situacao(a: Assinatura): Node {
  if (a.status === 'pausada') return selo('neutro', 'Pausada', 'badge-pausada');
  if (a.status === 'cancelada') return selo('cancelada', 'Cancelada', 'badge-cancelada');
  return document.createTextNode('Ativa');
}

/** Ações de mudança de situação e, isolada no fim, a exclusão (design 4.5). */
function acoesSituacao(a: Assinatura): HTMLElement[] {
  const grupo = h('div', { class: 'grupo grupo-espaco' });
  if (a.status === 'ativa') grupo.append(linhaAcao('Pausar', () => acaoPausar(a), { testid: 'btn-pausar' }));
  else grupo.append(linhaAcao('Reativar', () => acaoReativar(a), { testid: 'btn-reativar', forte: true }));
  if (a.status !== 'cancelada') grupo.append(linhaAcao('Marcar como cancelada', () => acaoMarcarCancelada(a), { testid: 'btn-cancelar' }));
  const perigo = h('div', { class: 'grupo zona-perigo' }, linhaAcao('Excluir assinatura', () => void acaoExcluir(a), { testid: 'btn-excluir', perigo: true }));
  return [grupo, perigo];
}

export function telaDetalhe(id: string): Tela {
  const a = obterEstado().assinaturas.find((x) => x.id === id);
  if (!a) {
    return {
      titulo: 'Assinatura não encontrada',
      voltar: () => voltar('#/'),
      conteudo: [estadoVazio({ testid: 'nao-encontrada', textos: ['Esta assinatura não existe mais.'] })],
    };
  }
  const selos = selosReajuste(a);
  const guia = guiaCancelamento(a);

  return {
    titulo: a.nome,
    voltar: () => voltar('#/'),
    agrupado: true,
    conteudo: [
      h(
        'div',
        { class: 'cabeca-detalhe' },
        monogramaEl(a.nome, a.catalogoId, true),
        h(
          'div',
          {},
          dinheiro(a.valorCentavos, 'grande', { sufixo: sufixoCiclo(a.ciclo), testid: 'detalhe-valor', tag: 'p' }),
          selos.length ? h('div', { class: 'marcas' }, selos) : null,
        ),
      ),
      h(
        'dl',
        { class: 'grupo dados', testid: 'detalhe-dados' },
        linha('Próxima cobrança', formatarDataBR(a.proxima), 'detalhe-proxima'),
        linha('Ciclo', rotuloCiclo(a.ciclo)),
        linha('Pagamento', rotuloPagamento(a.pagamento)),
        a.banco ? linha('Banco ou cartão', a.banco) : null,
        linha('Categoria', a.categoria),
        a.emTeste && a.fimTeste ? linha('Fim do teste grátis', formatarDataBR(a.fimTeste)) : null,
        linha('Situação', situacao(a), 'detalhe-situacao'),
        a.status === 'cancelada' && a.canceladaEm ? linha('Cancelada em', formatarDataBR(a.canceladaEm), 'detalhe-cancelada-em') : null,
      ),
      h(
        'div',
        { class: 'grupo grupo-espaco' },
        linhaAcao('Editar', () => navegar(`${hrefDetalhe(a)}/editar`), { testid: 'btn-editar', seta: true }),
        guia.botao,
        guia.painel,
        guia.marcar,
      ),
      secaoHistorico(a),
      ...acoesSituacao(a),
    ],
  };
}
