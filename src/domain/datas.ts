// Funções puras de data. Trabalham com strings ISO "aaaa-mm-dd" e componentes
// numéricos, sem fuso horário, para não sofrer com horário de verão.
import type { Ciclo } from './tipos';

export interface DataPartes {
  ano: number;
  mes: number; // 1–12
  dia: number; // 1–31
}

export function ehBissexto(ano: number): boolean {
  return (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
}

export function diasNoMes(ano: number, mes: number): number {
  return [31, ehBissexto(ano) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes - 1];
}

function dois(n: number): string {
  return String(n).padStart(2, '0');
}

export function paraIso(p: DataPartes): string {
  return `${String(p.ano).padStart(4, '0')}-${dois(p.mes)}-${dois(p.dia)}`;
}

/** Lê uma data ISO válida; retorna null se o texto não for uma data real. */
export function lerIso(iso: string): DataPartes | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const p = { ano: Number(m[1]), mes: Number(m[2]), dia: Number(m[3]) };
  return dataValida(p) ? p : null;
}

export function ehIsoValida(v: unknown): v is string {
  return typeof v === 'string' && lerIso(v) !== null;
}

function dataValida(p: DataPartes): boolean {
  return p.ano >= 1900 && p.ano <= 9999 && p.mes >= 1 && p.mes <= 12 && p.dia >= 1 && p.dia <= diasNoMes(p.ano, p.mes);
}

/** Converte "dd/mm/aaaa" (digitado) em ISO; null se vazio ou inválido (ex.: 31/02/2026). */
export function lerDataBR(texto: string): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto.trim());
  if (!m) return null;
  const p = { dia: Number(m[1]), mes: Number(m[2]), ano: Number(m[3]) };
  return dataValida(p) ? paraIso(p) : null;
}

/** ISO → "dd/mm/aaaa". */
export function formatarDataBR(iso: string): string {
  const p = lerIso(iso);
  if (!p) return iso;
  return `${dois(p.dia)}/${dois(p.mes)}/${p.ano}`;
}

/** Data local de um objeto Date em ISO (usado só na borda da UI para obter "hoje"). */
export function isoDeDate(d: Date): string {
  return paraIso({ ano: d.getFullYear(), mes: d.getMonth() + 1, dia: d.getDate() });
}

function diaJuliano(p: DataPartes): number {
  return Math.round(Date.UTC(p.ano, p.mes - 1, p.dia) / 86_400_000);
}

/** Diferença em dias (b − a). */
export function diferencaDias(aIso: string, bIso: string): number {
  const a = lerIso(aIso);
  const b = lerIso(bIso);
  if (!a || !b) return NaN;
  return diaJuliano(b) - diaJuliano(a);
}

export function somarDias(iso: string, dias: number): string {
  const p = lerIso(iso);
  if (!p) return iso;
  const d = new Date(Date.UTC(p.ano, p.mes - 1, p.dia + dias));
  return paraIso({ ano: d.getUTCFullYear(), mes: d.getUTCMonth() + 1, dia: d.getUTCDate() });
}

/**
 * Soma meses mantendo o dia de referência quando o mês permitir;
 * se o dia não existir, usa o último dia do mês (31/01 → 28/02 → 31/03).
 */
export function somarMeses(iso: string, meses: number, diaRef?: number): string {
  const p = lerIso(iso);
  if (!p) return iso;
  const total = p.ano * 12 + (p.mes - 1) + meses;
  const ano = Math.floor(total / 12);
  const mes = (total % 12) + 1;
  const dia = Math.min(diaRef ?? p.dia, diasNoMes(ano, mes));
  return paraIso({ ano, mes, dia });
}

/** Próxima data de cobrança após `iso`, conforme o ciclo. */
export function proximoCiclo(iso: string, ciclo: Ciclo, diaRef?: number): string {
  switch (ciclo) {
    case 'mensal':
      return somarMeses(iso, 1, diaRef);
    case 'anual':
      return somarMeses(iso, 12, diaRef);
    case 'semanal':
      return somarDias(iso, 7);
  }
}

/** Avança a data, ciclo a ciclo, até a primeira ocorrência igual ou posterior a hoje. */
export function avancarAteHoje(iso: string, ciclo: Ciclo, hoje: string, diaRef?: number): string {
  if (!lerIso(iso) || !lerIso(hoje)) return iso;
  let atual = iso;
  if (ciclo === 'semanal' && atual < hoje) {
    // Salta direto para perto de hoje, evitando muitos passos.
    const semanas = Math.floor(diferencaDias(atual, hoje) / 7);
    atual = somarDias(atual, semanas * 7);
  }
  while (atual < hoje) atual = proximoCiclo(atual, ciclo, diaRef);
  return atual;
}
