// US-16 / US-22 — Gráfico por categoria como barra de composição com legenda-tabela (design 4.6). SVG no código, sem biblioteca.
import { formatarBRL } from '../../domain/dinheiro';
import { dadosGrafico, formatarDecimos } from '../../domain/grafico';
import { hoje, obterEstado } from '../../loja';
import { ehPro } from '../../servicos/pro';
import { cartaoRecursoPro } from '../componentes';
import { h } from '../dom';
import { navegar } from '../navegacao';

const NS = 'http://www.w3.org/2000/svg';
/** Largura lógica da barra (viewBox); a barra ocupa a largura toda do bloco. */
const LARGURA = 1000;
const ALTURA = 14;
/** Mínimo visível por fatia, em unidades do viewBox (cerca de 3 px numa barra de 328 px). */
const MINIMO = 10;

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

function corFatia(i: number, outras: boolean): string {
  return outras ? 'var(--cor-grafico-7)' : `var(--cor-grafico-${i + 1})`;
}

/**
 * Barra de composição horizontal (design 4.6, UX-S3-06): fatias do maior para o menor, vão de 2 px na cor
 * do papel e mínimo visível de 3 px por fatia. role="img" com <title> resumindo as porcentagens.
 * `pesos` vazio = prévia decorativa (cinza, sem números).
 */
function barraComposicao(pesos: { valor: number; cor: string }[], resumo: string | null): SVGSVGElement {
  const svg = svgEl('svg', { viewBox: `0 0 ${LARGURA} ${ALTURA}`, preserveAspectRatio: 'none', class: 'composicao', height: ALTURA });
  if (resumo) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-labelledby', 'grafico-titulo');
    const titulo = svgEl('title', { id: 'grafico-titulo' });
    titulo.textContent = resumo;
    svg.append(titulo);
  } else {
    svg.setAttribute('aria-hidden', 'true');
  }
  const total = pesos.reduce((s, p) => s + p.valor, 0);
  const util = LARGURA;
  // Garante o mínimo visível tirando o excedente proporcionalmente das fatias maiores.
  let larguras = pesos.map((p) => (total > 0 ? (p.valor / total) * util : 0));
  const pequenas = larguras.filter((w) => w < MINIMO).length;
  if (pequenas > 0) {
    const falta = larguras.reduce((s, w) => s + Math.max(0, MINIMO - w), 0);
    const grandes = larguras.reduce((s, w) => s + (w >= MINIMO ? w : 0), 0);
    larguras = larguras.map((w) => (w < MINIMO ? MINIMO : w - (grandes > 0 ? (w / grandes) * falta : 0)));
  }
  let x = 0;
  const divisas: number[] = [];
  pesos.forEach((p, i) => {
    svg.append(svgEl('rect', { x: x.toFixed(2), y: 0, width: larguras[i].toFixed(2), height: ALTURA, fill: p.cor }));
    x += larguras[i];
    if (i < pesos.length - 1) divisas.push(x);
  });
  // Vão de 2 px na cor do papel entre as fatias (traço que não escala com a largura da barra).
  for (const d of divisas) svg.append(svgEl('line', { x1: d.toFixed(2), x2: d.toFixed(2), y1: 0, y2: ALTURA, class: 'vao' }));
  return svg;
}

/** Bloco do gráfico em Totais: recurso Pro em linha no grátis, barra de composição e legenda-tabela no Pro. */
export function secaoGrafico(): HTMLElement {
  if (!ehPro()) {
    const cinza = 'var(--cor-linha)';
    return cartaoRecursoPro({
      testid: 'lock-grafico',
      formato: 'linha',
      titulo: 'Gráfico por categoria',
      descricao: ['Veja de relance onde suas assinaturas mais pesam. Os totais por categoria em lista continuam grátis, logo abaixo.'],
      recurso: 'ver o gráfico por categoria',
      previa: barraComposicao([{ valor: 5, cor: cinza }, { valor: 3, cor: cinza }, { valor: 2, cor: cinza }], null),
      aoConhecer: () => navegar('#/pro'),
    });
  }
  const d = dadosGrafico(obterEstado().assinaturas, hoje());
  const titulo = h('h2', { class: 'titulo-bloco', id: 'titulo-grafico' }, 'Gasto mensal por categoria');
  if (d.fatias.length === 0) {
    return h(
      'section',
      { class: 'bloco', testid: 'grafico-categorias', 'aria-labelledby': 'titulo-grafico' },
      titulo,
      h('p', { class: 'grafico-vazio', testid: 'grafico-vazio' }, 'Sem dados para o gráfico'),
    );
  }
  const resumo = `Gasto mensal por categoria: ${d.fatias.map((f) => `${f.rotulo} ${formatarDecimos(f.decimos)}`).join(', ')}`;
  return h(
    'section',
    { class: 'bloco', testid: 'grafico-categorias', 'aria-labelledby': 'titulo-grafico' },
    titulo,
    barraComposicao(d.fatias.map((f, i) => ({ valor: f.mensalCentavos, cor: corFatia(i, f.outras) })), resumo),
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
  );
}
