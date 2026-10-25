// US-04 / US-22 — Totais: total como tipografia, gráfico e grupos com divisor (design 4.6).
import { formatarBRL } from '../../domain/dinheiro';
import { calcularTotais, type Grupo } from '../../domain/totais';
import { rotuloPagamento } from '../../domain/tipos';
import { hoje, obterEstado } from '../../loja';
import { botao, dinheiro, estadoVazio } from '../componentes';
import { h } from '../dom';
import { icone } from '../icones';
import { adicionar } from '../limite';
import type { Tela } from '../tela';
import { secaoGrafico } from './grafico';

function plural(n: number, singular: string, pluralTxt: string): string {
  return `${n} ${n === 1 ? singular : pluralTxt}`;
}

function grupo<T>(titulo: string, id: string, testid: string, itens: Grupo<T>[], rotulo: (c: T) => string): HTMLElement {
  const maior = Math.max(...itens.map((i) => i.mensalCentavos), 1);
  return h(
    'section',
    { class: 'bloco', 'aria-labelledby': id },
    h('h2', { class: 'titulo-bloco', id }, titulo),
    h(
      'ul',
      { class: 'grupo-total', testid },
      itens.map((i) =>
        h(
          'li',
          { testid: `${testid}-item` },
          h('div', { class: 'l' }, h('span', {}, rotulo(i.chave)), h('b', {}, formatarBRL(i.mensalCentavos))),
          h('div', { class: 'barra', 'aria-hidden': 'true' }, h('i', { style: `width: ${Math.max(2, (i.mensalCentavos / maior) * 100).toFixed(1)}%` })),
        ),
      ),
    ),
  );
}

export function telaTotais(): Tela {
  const t = calcularTotais(obterEstado().assinaturas, hoje());
  const vazio = t.quantidade === 0;

  // Sem o bloco verde: o total é tipografia sobre o papel; cartao-total é só o contêiner (US-22.CA2).
  const cartao = h(
    'div',
    { class: 'bloco bloco-total', testid: 'cartao-total' },
    h('p', { class: 'rotulo' }, 'Por mês'),
    dinheiro(t.mensalCentavos, 'grande', { testid: 'total-mensal', tag: 'p' }),
    h('div', { class: 'par' }, h('span', {}, 'Por ano'), h('span', { class: 'total-ano', testid: 'total-anual' }, formatarBRL(t.anualCentavos))),
    vazio ? null : h('p', { class: 'nota', testid: 'total-quantidade' }, plural(t.quantidade, 'assinatura ativa', 'assinaturas ativas')),
    t.emTeste.quantidade > 0
      ? h(
          'p',
          { class: 'linha-teste', testid: 'total-em-teste' },
          icone('ampulheta'),
          h('span', {}, `Em teste: ${plural(t.emTeste.quantidade, 'assinatura', 'assinaturas')} — ${formatarBRL(t.emTeste.mensalCentavos)}/mês após o teste`),
        )
      : null,
  );

  return {
    titulo: 'Totais',
    aba: 'totais',
    conteudo: [
      cartao,
      secaoGrafico(),
      vazio
        ? estadoVazio({
            testid: 'empty-state-totais',
            textos: ['Sem assinaturas ativas. Os totais aparecem quando você cadastrar ou reativar uma.'],
            botao: botao('Adicionar assinatura', 'primario', adicionar, { testid: 'btn-adicionar-vazio' }),
          })
        : null,
      vazio ? null : grupo('Por forma de pagamento', 'titulo-por-pagamento', 'total-por-pagamento', t.porPagamento, rotuloPagamento),
      vazio ? null : grupo('Por categoria', 'titulo-por-categoria', 'total-por-categoria', t.porCategoria, (c) => c),
      vazio ? null : h('p', { class: 'nota bloco' }, 'Valores mensais equivalentes: anuais ÷ 12, semanais × 52 ÷ 12.'),
    ],
  };
}
