// US-16 — Gráfico de rosca com legenda-tabela (design 8.8 e 9.6). SVG desenhado no código, sem biblioteca.
import { formatarBRL } from '../../domain/dinheiro';
import { dadosGrafico, formatarDecimos, type DadosGrafico } from '../../domain/grafico';
import { hoje, obterEstado } from '../../loja';
import { ehPro } from '../../servicos/pro';
import { cartaoRecursoPro } from '../componentes';
import { h } from '../dom';
import { navegar } from '../navegacao';

const NS = 'http://www.w3.org/2000/svg';
const TAMANHO = 176;
const ESPESSURA = 28;
const RAIO = (TAMANHO - ESPESSURA) / 2;
const VAO = 2;

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

function corFatia(i: number, outras: boolean): string {
  return outras ? 'var(--cor-grafico-7)' : `var(--cor-grafico-${i + 1})`;
}

function rosca(d: DadosGrafico, resumo: string): SVGSVGElement {
  const svg = svgEl('svg', { viewBox: `0 0 ${TAMANHO} ${TAMANHO}`, width: TAMANHO, height: TAMANHO, role: 'img', 'aria-labelledby': 'grafico-titulo', class: 'rosca' });
  const titulo = svgEl('title', { id: 'grafico-titulo' });
  titulo.textContent = resumo;
  svg.append(titulo);
  const c = TAMANHO / 2;
  const circ = 2 * Math.PI * RAIO;
  if (d.fatias.length === 1) {
    // Uma categoria: círculo completo, sem vão (CA5).
    svg.append(svgEl('circle', { cx: c, cy: c, r: RAIO, fill: 'none', stroke: corFatia(0, d.fatias[0].outras), 'stroke-width': ESPESSURA }));
    return svg;
  }
  const minimo = (circ * 2) / 360; // arco mínimo visível de 2°
  let inicio = 0;
  d.fatias.forEach((f, i) => {
    const frac = d.totalMensalCentavos > 0 ? f.mensalCentavos / d.totalMensalCentavos : 0;
    const comprimento = Math.max(minimo, frac * circ);
    const traco = Math.max(minimo / 2, comprimento - VAO);
    svg.append(
      svgEl('circle', {
        cx: c,
        cy: c,
        r: RAIO,
        fill: 'none',
        stroke: corFatia(i, f.outras),
        'stroke-width': ESPESSURA,
        'stroke-dasharray': `${traco.toFixed(3)} ${(circ - traco).toFixed(3)}`,
        'stroke-dashoffset': (-inicio).toFixed(3),
        transform: `rotate(-90 ${c} ${c})`,
      }),
    );
    inicio += comprimento;
  });
  return svg;
}

/** Bloco do gráfico em Totais: cartão bloqueado no grátis, gráfico no Pro. */
export function secaoGrafico(): HTMLElement {
  if (!ehPro()) {
    const previa = svgEl('svg', { viewBox: '0 0 64 64', width: 64, height: 64, 'aria-hidden': 'true', class: 'previa-rosca' });
    const circ = 2 * Math.PI * 24;
    for (let i = 0; i < 3; i += 1) {
      previa.append(
        svgEl('circle', {
          cx: 32, cy: 32, r: 24, fill: 'none', stroke: 'var(--cor-superficie-2)', 'stroke-width': 12,
          'stroke-dasharray': `${circ / 3 - 3} ${circ - circ / 3 + 3}`, 'stroke-dashoffset': -(i * circ) / 3, transform: 'rotate(-90 32 32)',
        }),
      );
    }
    return cartaoRecursoPro({
      testid: 'lock-grafico',
      titulo: 'Gráfico por categoria',
      descricao: ['Veja de relance onde suas assinaturas mais pesam. Os totais por categoria em lista continuam grátis, logo abaixo.'],
      recurso: 'ver o gráfico por categoria',
      previa: h('div', { class: 'previa' }, previa),
      aoConhecer: () => navegar('#/pro'),
    });
  }
  const d = dadosGrafico(obterEstado().assinaturas, hoje());
  const titulo = h('h2', { class: 'secao', id: 'titulo-grafico' }, 'Gasto mensal por categoria');
  if (d.fatias.length === 0) {
    return h(
      'section',
      { testid: 'grafico-categorias', 'aria-labelledby': 'titulo-grafico' },
      titulo,
      h('div', { class: 'cartao' }, h('p', { class: 'grafico-vazio', testid: 'grafico-vazio' }, 'Sem dados para o gráfico')),
    );
  }
  const resumo = `Gasto mensal por categoria: ${d.fatias.map((f) => `${f.rotulo} ${formatarDecimos(f.decimos)}`).join(', ')}`;
  return h(
    'section',
    { testid: 'grafico-categorias', 'aria-labelledby': 'titulo-grafico' },
    titulo,
    h(
      'div',
      { class: 'cartao grafico' },
      h(
        'div',
        { class: 'rosca-caixa' },
        rosca(d, resumo),
        h('div', { class: 'rosca-centro', 'aria-hidden': 'true' }, h('b', {}, formatarBRL(d.totalMensalCentavos)), h('span', {}, 'por mês')),
      ),
      h(
        'table',
        { class: 'legenda' },
        h('caption', { class: 'sr-only' }, 'Gasto mensal por categoria'),
        h(
          'thead',
          { class: 'sr-only' },
          h('tr', {}, h('th', { scope: 'col' }, 'Cor'), h('th', { scope: 'col' }, 'Categoria'), h('th', { scope: 'col' }, 'Por mês'), h('th', { scope: 'col' }, 'Parte')),
        ),
        h(
          'tbody',
          {},
          d.fatias.map((f, i) =>
            h(
              'tr',
              { testid: 'grafico-item' },
              h('td', { class: 'cor' }, h('i', { 'aria-hidden': 'true', style: `background: ${corFatia(i, f.outras)}` })),
              h('td', { class: 'cat' }, f.rotulo),
              h('td', { class: 'val' }, formatarBRL(f.mensalCentavos)),
              h('td', { class: 'pct', testid: 'grafico-pct' }, formatarDecimos(f.decimos)),
            ),
          ),
        ),
      ),
    ),
  );
}
