// US-04 — Totais mensal e anual equivalentes.
// Para não ter erro de ponto flutuante, somamos em "duodécimos de centavo" (inteiros):
// mensal = valor × 12, anual = valor × 1, semanal = valor × 52. Assim o total anual é
// exato em centavos e o mensal é essa soma ÷ 12, arredondado só na exibição.
import { testeVigente } from './proximas';
import { FORMAS_PAGAMENTO, type Assinatura, type Ciclo, type FormaPagamento } from './tipos';

const FATOR_ANUAL: Record<Ciclo, number> = { mensal: 12, anual: 1, semanal: 52 };

/** Equivalente anual em centavos (inteiro, exato). */
export function equivalenteAnual(a: Pick<Assinatura, 'valorCentavos' | 'ciclo'>): number {
  return a.valorCentavos * FATOR_ANUAL[a.ciclo];
}

/** Equivalente mensal em centavos (pode ser fracionário; arredonde só ao exibir). */
export function equivalenteMensal(a: Pick<Assinatura, 'valorCentavos' | 'ciclo'>): number {
  return equivalenteAnual(a) / 12;
}

export interface Grupo<T> {
  chave: T;
  /** Equivalente mensal (fracionário) em centavos. */
  mensalCentavos: number;
}

export interface Totais {
  /** Equivalente mensal em centavos (fracionário; arredondar na exibição). */
  mensalCentavos: number;
  /** Equivalente anual em centavos (inteiro). */
  anualCentavos: number;
  /** Quantidade de assinaturas que entram nos totais. */
  quantidade: number;
  /** Só formas com valor > 0, na ordem cartão, Pix Automático, boleto, débito. */
  porPagamento: Grupo<FormaPagamento>[];
  /** Do maior para o menor (empate: nome da categoria). */
  porCategoria: Grupo<string>[];
  /** Testes grátis vigentes: fora dos totais, mostrados à parte (US-04.CA7). */
  emTeste: { quantidade: number; mensalCentavos: number };
}

/** Entra nos totais: ativa e sem teste grátis vigente (teste encerrado conta normalmente). */
export function contaNosTotais(a: Assinatura, hoje: string): boolean {
  return a.status === 'ativa' && !testeVigente(a, hoje);
}

export function calcularTotais(assinaturas: Assinatura[], hoje: string): Totais {
  let anual = 0;
  let quantidade = 0;
  const pag = new Map<FormaPagamento, number>();
  const cat = new Map<string, number>();
  let testeQtd = 0;
  let testeAnual = 0;

  for (const a of assinaturas) {
    if (a.status !== 'ativa') continue;
    const eq = equivalenteAnual(a);
    if (testeVigente(a, hoje)) {
      testeQtd += 1;
      testeAnual += eq;
      continue;
    }
    anual += eq;
    quantidade += 1;
    pag.set(a.pagamento, (pag.get(a.pagamento) ?? 0) + eq);
    cat.set(a.categoria, (cat.get(a.categoria) ?? 0) + eq);
  }

  return {
    mensalCentavos: anual / 12,
    anualCentavos: anual,
    quantidade,
    porPagamento: FORMAS_PAGAMENTO.filter((f) => (pag.get(f.valor) ?? 0) > 0).map((f) => ({ chave: f.valor, mensalCentavos: pag.get(f.valor)! / 12 })),
    porCategoria: [...cat.entries()]
      .filter(([, v]) => v > 0)
      .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0], 'pt-BR'))
      .map(([chave, v]) => ({ chave, mensalCentavos: v / 12 })),
    emTeste: { quantidade: testeQtd, mensalCentavos: testeAnual / 12 },
  };
}
