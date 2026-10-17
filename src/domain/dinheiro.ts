// Valores monetários em centavos inteiros; formatação BRL só na exibição.

const formatadorBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Formata centavos (pode ser fracionário: arredonda para o centavo mais próximo). */
export function formatarBRL(centavos: number): string {
  const inteiro = Math.round(centavos);
  // Intl usa espaço não separável depois de "R$"; trocamos por espaço comum
  // para o texto exibido ser exatamente "R$ 39,90".
  return formatadorBRL.format(inteiro / 100).replace(/ /g, ' ');
}

export type ResultadoValor = { ok: true; centavos: number } | { ok: false; erro: 'invalido' | 'casas' };

/**
 * Converte o texto digitado ("39,90", "1.234,56", "10") em centavos.
 * Rejeita vazio, zero, negativo, letras e mais de 2 casas decimais.
 */
export function lerValor(texto: string): ResultadoValor {
  let t = texto.trim().replace(/^R\$\s*/i, '');
  if (t === '') return { ok: false, erro: 'invalido' };
  if (/^\d{1,3}(\.\d{3})+(,\d*)?$/.test(t)) t = t.replace(/\./g, ''); // separador de milhar
  // Aceita vírgula ou ponto como separador decimal.
  const m = /^(\d+)(?:[.,](\d+))?$/.exec(t);
  if (!m) return { ok: false, erro: 'invalido' };
  const decimais = m[2] ?? '';
  if (decimais.length > 2) return { ok: false, erro: 'casas' };
  const centavos = Number(m[1]) * 100 + Number(decimais.padEnd(2, '0'));
  if (!Number.isSafeInteger(centavos) || centavos <= 0) return { ok: false, erro: 'invalido' };
  return { ok: true, centavos };
}

/** Centavos → texto editável no campo ("39,90"). */
export function centavosParaCampo(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',');
}

/** Percentual com 1 casa decimal no formato brasileiro ("12,5%"). */
export function formatarPercentual(p: number): string {
  return `${p.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}
