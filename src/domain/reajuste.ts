// US-03 — Reajuste: compara o valor atual com o imediatamente anterior do histórico.
import { formatarBRL, formatarPercentual } from './dinheiro';
import type { Assinatura } from './tipos';

export interface Reajuste {
  tipo: 'subiu' | 'caiu';
  /** Diferença absoluta, em centavos. */
  diferencaCentavos: number;
  /** Variação percentual absoluta sobre o valor anterior. */
  percentual: number;
}

/** Calcula a variação entre dois valores (em centavos); null se forem iguais ou inválidos. */
export function calcularReajuste(anteriorCentavos: number, atualCentavos: number): Reajuste | null {
  if (anteriorCentavos <= 0 || atualCentavos === anteriorCentavos) return null;
  const diferenca = atualCentavos - anteriorCentavos;
  return {
    tipo: diferenca > 0 ? 'subiu' : 'caiu',
    diferencaCentavos: Math.abs(diferenca),
    percentual: (Math.abs(diferenca) / anteriorCentavos) * 100,
  };
}

/** Reajuste mais recente da assinatura (sem histórico = sem selo, US-03.CA6). */
export function ultimoReajuste(a: Assinatura): Reajuste | null {
  const ultimo = a.historico[a.historico.length - 1];
  if (!ultimo) return null;
  return calcularReajuste(ultimo.deCentavos, a.valorCentavos);
}

/** Texto literal do backlog: "subiu 12,5% (R$ 5,00)" / "caiu R$ 5,00 (11,1%)". */
export function textoReajuste(r: Reajuste): string {
  const valor = formatarBRL(r.diferencaCentavos);
  const pct = formatarPercentual(r.percentual);
  return r.tipo === 'subiu' ? `subiu ${pct} (${valor})` : `caiu ${valor} (${pct})`;
}
