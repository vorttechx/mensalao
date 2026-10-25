// Peças compartilhadas pelas telas de lista e detalhe.
import { formatarDataCurta } from '../../domain/datas';
import { textoReajuste, ultimoReajuste } from '../../domain/reajuste';
import { rotuloPagamento, type Assinatura } from '../../domain/tipos';
import { dinheiro, monogramaEl, selo } from '../componentes';
import { h, type Filho } from '../dom';

export function hrefDetalhe(a: Assinatura): string {
  return `#/assinatura/${encodeURIComponent(a.id)}`;
}

/** Meta do item no Início (design 9.2): "Dom, 18 out · Pix Automático · Nubank" (ano só quando for outro ano). */
export function metaCobrancaCurta(a: Assinatura, hoje: string): string {
  return [formatarDataCurta(a.proxima, hoje), rotuloPagamento(a.pagamento), a.banco].filter(Boolean).join(' · ');
}

/**
 * Item de lista (design 3.4): linha com divisor fino, monograma decorativo, nome e valor na primeira linha,
 * meta na segunda e marcas de estado na terceira. O link leva ao detalhe; o nome acessível começa pelo nome.
 */
export function itemAssinatura(
  a: Assinatura,
  op: { testid: string; valorCentavos: number; sufixo?: string; meta: string; selos?: HTMLElement[]; aviso?: Filho; apagado?: boolean },
): HTMLElement {
  const selos = op.selos ?? [];
  const valor = dinheiro(op.valorCentavos, 'lista', { sufixo: op.sufixo, testid: 'item-valor' });
  valor.classList.add('valor');
  return h(
    'li',
    { testid: op.testid, 'data-id': a.id },
    h(
      'a',
      { class: `item${op.apagado ? ' apagado' : ''}`, href: hrefDetalhe(a) },
      monogramaEl(a.nome, a.catalogoId),
      h(
        'span',
        { class: 'corpo' },
        h('span', { class: 'nome', testid: 'item-nome' }, a.nome),
        valor,
        h('span', { class: 'meta', testid: 'item-meta' }, op.meta),
        selos.length ? h('span', { class: 'marcas' }, selos) : null,
        op.aviso ?? null,
      ),
    ),
  );
}

/** Marca de reajuste (US-03): ferrugem quando subiu, tinta clara quando caiu (design 3.3). */
export function selosReajuste(a: Assinatura): HTMLElement[] {
  const r = ultimoReajuste(a);
  return r ? [selo(r.tipo === 'subiu' ? 'subiu' : 'caiu', textoReajuste(r), 'badge-reajuste')] : [];
}

/** "Valor subiu 12,5% (R$ 5,00)." para o banner após editar. */
export function textoReajusteBanner(a: Assinatura): string {
  const r = ultimoReajuste(a);
  return r ? `Valor ${textoReajuste(r)}.` : '';
}
