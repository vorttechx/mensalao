// Validação pura do formulário de assinatura (US-01, US-03.CA7, US-05.CA1).
import { avancarAteHoje, lerDataBR, lerIso } from './datas';
import { lerValor } from './dinheiro';
import { CATEGORIAS, ehCiclo, ehPagamento, type Ciclo, type FormaPagamento } from './tipos';

/** Valores crus do formulário, como digitados. */
export interface EntradaFormulario {
  nome: string;
  valor: string;
  ciclo: string;
  proxima: string;
  pagamento: string;
  banco: string;
  categoria: string;
  emTeste: boolean;
  fimTeste: string;
}

export type CampoFormulario = 'nome' | 'valor' | 'ciclo' | 'proxima' | 'pagamento' | 'categoria' | 'fimTeste';

/** Ordem dos campos na tela (para focar o primeiro com erro). */
export const ORDEM_CAMPOS: CampoFormulario[] = ['nome', 'valor', 'ciclo', 'proxima', 'pagamento', 'categoria', 'fimTeste'];

export interface DadosAssinatura {
  nome: string;
  valorCentavos: number;
  ciclo: Ciclo;
  proxima: string;
  /** Dia digitado na próxima cobrança (antes de qualquer avanço). */
  diaDigitado: number;
  pagamento: FormaPagamento;
  banco: string;
  categoria: string;
  emTeste: boolean;
  fimTeste: string | null;
}

export type ResultadoValidacao =
  | { ok: true; dados: DadosAssinatura; dataAvancada: boolean }
  | { ok: false; erros: Partial<Record<CampoFormulario, string>> };

export const MENSAGENS = {
  nome: 'Informe o nome',
  valorInvalido: 'Informe um valor maior que zero, como 39,90',
  valorCasas: 'Use no máximo 2 casas decimais, como 10,99',
  proximaVazia: 'Informe a data da próxima cobrança',
  proximaInvalida: 'Data inválida. Use dd/mm/aaaa, como 15/10/2026',
  fimTeste: 'Informe quando o teste termina (dd/mm/aaaa)',
  ciclo: 'Escolha o ciclo',
  pagamento: 'Escolha a forma de pagamento',
  categoria: 'Escolha a categoria',
} as const;

/**
 * Valida a entrada. Se a próxima cobrança estiver no passado, devolve a data
 * já avançada para a primeira ocorrência igual ou posterior a `hoje` (US-01.CA8).
 */
export function validarFormulario(e: EntradaFormulario, hoje: string): ResultadoValidacao {
  const erros: Partial<Record<CampoFormulario, string>> = {};

  const nome = e.nome.trim();
  if (nome === '') erros.nome = MENSAGENS.nome;

  const valor = lerValor(e.valor);
  if (!valor.ok) erros.valor = valor.erro === 'casas' ? MENSAGENS.valorCasas : MENSAGENS.valorInvalido;

  if (!ehCiclo(e.ciclo)) erros.ciclo = MENSAGENS.ciclo;

  let proxima: string | null = null;
  if (e.proxima.trim() === '') erros.proxima = MENSAGENS.proximaVazia;
  else {
    proxima = lerDataBR(e.proxima);
    if (!proxima) erros.proxima = MENSAGENS.proximaInvalida;
  }

  if (!ehPagamento(e.pagamento)) erros.pagamento = MENSAGENS.pagamento;
  if (!CATEGORIAS.includes(e.categoria)) erros.categoria = MENSAGENS.categoria;

  let fimTeste: string | null = null;
  if (e.emTeste) {
    fimTeste = lerDataBR(e.fimTeste);
    if (!fimTeste) erros.fimTeste = MENSAGENS.fimTeste;
  }

  if (Object.keys(erros).length > 0 || !valor.ok || !proxima || !ehCiclo(e.ciclo) || !ehPagamento(e.pagamento)) {
    return { ok: false, erros };
  }

  const diaDigitado = lerIso(proxima)!.dia;
  const avancada = avancarAteHoje(proxima, e.ciclo, hoje, diaDigitado);
  return {
    ok: true,
    dataAvancada: avancada !== proxima,
    dados: {
      nome,
      valorCentavos: valor.centavos,
      ciclo: e.ciclo,
      proxima: avancada,
      diaDigitado,
      pagamento: e.pagamento,
      banco: e.banco.trim(),
      categoria: e.categoria,
      emTeste: e.emTeste,
      fimTeste,
    },
  };
}

/** Valida o N de dias de aviso: inteiro de 0 a 30 (US-02.CA3). */
export function lerDiasAviso(texto: string): number | null {
  const t = texto.trim();
  if (!/^\d{1,2}$/.test(t)) return null;
  const n = Number(t);
  return n >= 0 && n <= 30 ? n : null;
}
