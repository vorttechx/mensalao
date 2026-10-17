// US-03 / US-05 / US-06 — Detalhe da assinatura (design.md 4.4).
import { formatarDataBR } from '../../domain/datas';
import { formatarBRL } from '../../domain/dinheiro';
import { rotuloCiclo, rotuloPagamento, sufixoCiclo, type Assinatura } from '../../domain/tipos';
import { obterEstado } from '../../loja';
import { botao, estadoVazio } from '../componentes';
import { h } from '../dom';
import { navegar, voltar } from '../navegacao';
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
        ),
      ),
      h(
        'div',
        { class: 'duas acoes-detalhe' },
        botao('Editar', 'secundario', () => navegar(`${hrefDetalhe(a)}/editar`), { testid: 'btn-editar' }),
      ),
      secaoHistorico(a),
    ],
  };
}
