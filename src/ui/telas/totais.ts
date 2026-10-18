// US-04 — Totais (design.md 4.6).
import { formatarBRL } from '../../domain/dinheiro';
import { calcularTotais, type Grupo } from '../../domain/totais';
import { rotuloPagamento } from '../../domain/tipos';
import { hoje, obterEstado } from '../../loja';
import { botao, estadoVazio } from '../componentes';
import { h } from '../dom';
import { icone } from '../icones';
import { navegar } from '../navegacao';
import type { Tela } from '../tela';

function plural(n: number, singular: string, pluralTxt: string): string {
  return `${n} ${n === 1 ? singular : pluralTxt}`;
}

function grupo<T>(titulo: string, id: string, testid: string, itens: Grupo<T>[], rotulo: (c: T) => string): HTMLElement {
  const maior = Math.max(...itens.map((i) => i.mensalCentavos), 1);
  return h(
    'section',
    { 'aria-labelledby': id },
    h('h2', { class: 'secao', id }, titulo),
    h(
      'ul',
      { class: 'cartao grupo', testid },
      itens.map((i) =>
        h(
          'li',
          { testid: `${testid}-item` },
          h('div', { class: 'lin' }, h('span', {}, rotulo(i.chave)), h('b', {}, formatarBRL(i.mensalCentavos))),
          h('div', { class: 'barra', 'aria-hidden': 'true' }, h('i', { style: `width: ${Math.max(2, (i.mensalCentavos / maior) * 100).toFixed(1)}%` })),
        ),
      ),
    ),
  );
}

export function telaTotais(): Tela {
  const t = calcularTotais(obterEstado().assinaturas, hoje());
  const vazio = t.quantidade === 0;

  const cartao = h(
    'div',
    { class: 'total', testid: 'cartao-total' },
    h('span', { class: 'rot' }, 'Por mês'),
    h('span', { class: 'mes', testid: 'total-mensal' }, formatarBRL(t.mensalCentavos)),
    h('span', { class: 'rot' }, 'Por ano'),
    h('span', { class: 'ano', testid: 'total-anual' }, formatarBRL(t.anualCentavos)),
    vazio ? null : h('p', { class: 'rodape', testid: 'total-quantidade' }, plural(t.quantidade, 'assinatura ativa', 'assinaturas ativas')),
  );

  const emTeste =
    t.emTeste.quantidade > 0
      ? h(
          'div',
          { class: 'em-teste', testid: 'total-em-teste' },
          icone('ampulheta'),
          h('span', {}, `Em teste: ${plural(t.emTeste.quantidade, 'assinatura', 'assinaturas')} — ${formatarBRL(t.emTeste.mensalCentavos)}/mês após o teste`),
        )
      : null;

  return {
    titulo: 'Totais',
    aba: 'totais',
    conteudo: [
      cartao,
      emTeste,
      vazio
        ? estadoVazio({
            testid: 'empty-state-totais',
            ilustracao: false,
            textos: ['Sem assinaturas ativas. Os totais aparecem quando você cadastrar ou reativar uma.'],
            botao: botao('Adicionar assinatura', 'primario', () => navegar('#/nova'), { testid: 'btn-adicionar-vazio', icone: 'mais' }),
          })
        : null,
      vazio ? null : grupo('Por forma de pagamento', 'titulo-por-pagamento', 'total-por-pagamento', t.porPagamento, rotuloPagamento),
      vazio ? null : grupo('Por categoria', 'titulo-por-categoria', 'total-por-categoria', t.porCategoria, (c) => c),
      vazio ? null : h('p', { class: 'nota' }, 'Valores mensais equivalentes: anuais ÷ 12, semanais × 52 ÷ 12.'),
    ],
  };
}
