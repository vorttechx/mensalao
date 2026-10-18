// US-16 — Agregação do gráfico "Gasto mensal por categoria" (puro). Mesma base do total por categoria
// (US-04): ativas, fora de teste grátis vigente, equivalente mensal. Proporções em inteiros; arredonda só na exibição.
import { calcularTotais, type Grupo } from './totais';
import type { Assinatura } from './tipos';

export const MAX_FATIAS = 6;
export const ROTULO_OUTRAS = 'Outras categorias';

export interface FatiaGrafico {
  rotulo: string;
  /** Equivalente mensal (fracionário) em centavos. */
  mensalCentavos: number;
  /** Percentual em décimos (500 = 50,0%). A soma das fatias é exatamente 1000. */
  decimos: number;
  outras: boolean;
}

export interface DadosGrafico {
  /** Equivalente mensal total (fracionário) em centavos; 0 = sem dados. */
  totalMensalCentavos: number;
  fatias: FatiaGrafico[];
}

/**
 * Distribui 1000 décimos de ponto percentual pelo método do maior resto (CA3): a soma exibida fecha 100,0%.
 * `pesos` são inteiros (equivalente anual em centavos), sem erro de ponto flutuante.
 */
export function percentuaisMaiorResto(pesos: number[], total = 1000): number[] {
  const soma = pesos.reduce((a, b) => a + b, 0);
  if (soma <= 0) return pesos.map(() => 0);
  const base = pesos.map((p) => Math.floor((p * total) / soma));
  const restos = pesos.map((p, i) => ({ i, resto: (p * total) % soma }));
  let falta = total - base.reduce((a, b) => a + b, 0);
  restos.sort((a, b) => b.resto - a.resto || a.i - b.i);
  for (const r of restos) {
    if (falta <= 0) break;
    base[r.i] += 1;
    falta -= 1;
  }
  return base;
}

/** Agrupa as categorias: 6 maiores + "Outras categorias" (CA4), já ordenadas do maior para o menor. */
export function agregarCategorias(porCategoria: Grupo<string>[], max = MAX_FATIAS): DadosGrafico {
  // Volta ao inteiro exato (equivalente anual em centavos) para as proporções.
  const itens = porCategoria
    .map((g) => ({ rotulo: g.chave, anual: Math.round(g.mensalCentavos * 12) }))
    .filter((g) => g.anual > 0)
    .sort((a, b) => b.anual - a.anual || a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
  if (itens.length === 0) return { totalMensalCentavos: 0, fatias: [] };
  const principais = itens.slice(0, max);
  const resto = itens.slice(max);
  const grupos = principais.map((g) => ({ ...g, outras: false }));
  if (resto.length > 0) grupos.push({ rotulo: ROTULO_OUTRAS, anual: resto.reduce((s, g) => s + g.anual, 0), outras: true });
  const decimos = percentuaisMaiorResto(grupos.map((g) => g.anual));
  const totalAnual = grupos.reduce((s, g) => s + g.anual, 0);
  return {
    totalMensalCentavos: totalAnual / 12,
    fatias: grupos.map((g, i) => ({ rotulo: g.rotulo, mensalCentavos: g.anual / 12, decimos: decimos[i], outras: g.outras })),
  };
}

/** Dados do gráfico direto das assinaturas (reaproveita calcularTotais). */
export function dadosGrafico(assinaturas: Assinatura[], hoje: string): DadosGrafico {
  return agregarCategorias(calcularTotais(assinaturas, hoje).porCategoria);
}

/** 500 → "50,0%". */
export function formatarDecimos(decimos: number): string {
  return `${Math.floor(decimos / 10)},${decimos % 10}%`;
}
