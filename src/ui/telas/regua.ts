// US-20 — Régua do mês na interface (design 3.6). O cálculo fica em domain/regua.ts; aqui só o desenho.
// O desenho e a legenda são decorativos (aria-hidden); o figcaption diz o mesmo em texto (US-20.CA2).
import { legendaRegua, marcasDoMes, textoRegua } from '../../domain/regua';
import type { Assinatura } from '../../domain/tipos';
import { h } from '../dom';

/** Posição horizontal (%) do centro de um dia na régua. */
function posicao(dia: number, dias: number): string {
  return `${(((dia - 0.5) / dias) * 100).toFixed(2)}%`;
}

export function reguaDoMes(assinaturas: Assinatura[], hoje: string): HTMLElement {
  const r = marcasDoMes(assinaturas, hoje);
  const leg = legendaRegua(r);
  const xHoje = posicao(r.hoje, r.dias);
  // Perto das pontas, o rótulo "hoje" encosta na borda em vez de centralizar (sem sair da tela).
  const alinhamento = r.hoje <= 4 ? 'inicio' : r.hoje > r.dias - 4 ? 'fim' : 'meio';
  return h(
    'figure',
    { class: 'regua-bloco', testid: 'regua-mes' },
    h(
      'div',
      { class: 'regua', 'aria-hidden': 'true', style: `--dias: ${r.dias}` },
      r.marcas.map((m) => h('b', { class: m.jaCobrada ? 'pago' : null, style: `grid-column: ${m.dia}; height: ${m.alturaPct}%` })),
      h('span', { class: 'hoje', style: `left: ${xHoje}` }),
    ),
    h(
      'div',
      { class: 'regua-leg', 'aria-hidden': 'true' },
      leg.inicio ? h('span', { class: 'ini' }, leg.inicio) : null,
      h('span', { class: `h h-${alinhamento}`, style: alinhamento === 'meio' ? `left: ${xHoje}` : null }, leg.hoje),
      leg.fim ? h('span', { class: 'fim' }, leg.fim) : null,
    ),
    h('figcaption', { class: 'sr-only', testid: 'regua-texto' }, textoRegua(r)),
  );
}
