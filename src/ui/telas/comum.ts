// Peças compartilhadas pelas telas de lista e detalhe.
import { formatarDataBR } from '../../domain/datas';
import { formatarBRL } from '../../domain/dinheiro';
import { rotuloPagamento, type Assinatura } from '../../domain/tipos';
import { h, type Filho } from '../dom';

export function hrefDetalhe(a: Assinatura): string {
  return `#/assinatura/${encodeURIComponent(a.id)}`;
}

/** "17/10/2026 · Pix Automático · Nubank" */
export function metaCobranca(a: Assinatura): string {
  return [formatarDataBR(a.proxima), rotuloPagamento(a.pagamento), a.banco].filter(Boolean).join(' · ');
}

/** Cartão de assinatura (design.md 3.4): link para o detalhe com nome, valor, metadados e selos. */
export function itemAssinatura(
  a: Assinatura,
  op: { testid: string; valor: string; meta: string; selos?: HTMLElement[]; aviso?: Filho; apagado?: boolean },
): HTMLElement {
  const selos = op.selos ?? [];
  return h(
    'li',
    { testid: op.testid, 'data-id': a.id },
    h(
      'a',
      { class: `item${op.apagado ? ' apagado' : ''}`, href: hrefDetalhe(a) },
      h('div', { class: 'l1' }, h('span', { class: 'nome', testid: 'item-nome' }, a.nome), h('span', { class: 'valor', testid: 'item-valor' }, op.valor)),
      h('div', { class: 'meta', testid: 'item-meta' }, op.meta),
      selos.length ? h('div', { class: 'selos' }, selos) : null,
      op.aviso ?? null,
    ),
  );
}

export function valorSimples(a: Assinatura): string {
  return formatarBRL(a.valorCentavos);
}

/** Texto do reajuste para o banner de edição (implementado na US-03). */
export function textoReajusteBanner(_a: Assinatura): string {
  return '';
}
