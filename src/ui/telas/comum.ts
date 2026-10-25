// Peças compartilhadas pelas telas de lista e detalhe.
import { formatarDataCurta } from '../../domain/datas';
import { formatarBRL } from '../../domain/dinheiro';
import { textoReajuste, ultimoReajuste } from '../../domain/reajuste';
import { rotuloPagamento, type Assinatura } from '../../domain/tipos';
import { selo } from '../componentes';
import { h, type Filho } from '../dom';

export function hrefDetalhe(a: Assinatura): string {
  return `#/assinatura/${encodeURIComponent(a.id)}`;
}

/** Meta do item no Início (design 9.2): "Dom, 18 out · Pix Automático · Nubank" (ano só quando for outro ano). */
export function metaCobrancaCurta(a: Assinatura, hoje: string): string {
  return [formatarDataCurta(a.proxima, hoje), rotuloPagamento(a.pagamento), a.banco].filter(Boolean).join(' · ');
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

/** Selo de reajuste (US-03): vermelho quando subiu, menta quando caiu. */
export function selosReajuste(a: Assinatura): HTMLElement[] {
  const r = ultimoReajuste(a);
  return r ? [selo(r.tipo === 'subiu' ? 'subiu' : 'caiu', textoReajuste(r), 'badge-reajuste')] : [];
}

/** "Valor subiu 12,5% (R$ 5,00)." para o banner após editar. */
export function textoReajusteBanner(a: Assinatura): string {
  const r = ultimoReajuste(a);
  return r ? `Valor ${textoReajuste(r)}.` : '';
}
