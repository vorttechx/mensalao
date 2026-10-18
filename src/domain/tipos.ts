// Tipos do domínio do Mensalão. Datas são strings ISO "aaaa-mm-dd" (sem fuso).

export type Ciclo = 'mensal' | 'anual' | 'semanal';
export type FormaPagamento = 'cartao' | 'pix' | 'boleto' | 'debito';
export type Status = 'ativa' | 'pausada' | 'cancelada';

/** Registro de mudança de preço: valor anterior, novo valor e data da alteração. */
export interface MudancaPreco {
  data: string;
  deCentavos: number;
  paraCentavos: number;
}

export interface Assinatura {
  id: string;
  nome: string;
  /** Valor em centavos inteiros. */
  valorCentavos: number;
  ciclo: Ciclo;
  /** Data ISO da próxima cobrança. */
  proxima: string;
  /** Dia de referência original (1–31) para manter o "dia 31" ao avançar meses. */
  diaRef: number;
  pagamento: FormaPagamento;
  banco: string;
  categoria: string;
  emTeste: boolean;
  /** Data ISO de fim do teste grátis (só quando emTeste). */
  fimTeste: string | null;
  status: Status;
  /** Data ISO do cancelamento (só quando status = cancelada). */
  canceladaEm: string | null;
  /** Id do serviço do catálogo, quando criada a partir dele. */
  catalogoId: string | null;
  /** Histórico de preços em ordem cronológica. */
  historico: MudancaPreco[];
  criadaEm: string;
}

export interface Config {
  diasAviso: number;
}

export interface Estado {
  versao: 1;
  config: Config;
  assinaturas: Assinatura[];
}

export const VERSAO_ESTADO = 1 as const;
export const DIAS_AVISO_PADRAO = 3;

export function estadoVazio(): Estado {
  return { versao: VERSAO_ESTADO, config: { diasAviso: DIAS_AVISO_PADRAO }, assinaturas: [] };
}

export const CICLOS: { valor: Ciclo; rotulo: string; sufixo: string }[] = [
  { valor: 'mensal', rotulo: 'Mensal', sufixo: '/mês' },
  { valor: 'anual', rotulo: 'Anual', sufixo: '/ano' },
  { valor: 'semanal', rotulo: 'Semanal', sufixo: '/semana' },
];

export const FORMAS_PAGAMENTO: { valor: FormaPagamento; rotulo: string }[] = [
  { valor: 'cartao', rotulo: 'Cartão' },
  { valor: 'pix', rotulo: 'Pix Automático' },
  { valor: 'boleto', rotulo: 'Boleto' },
  { valor: 'debito', rotulo: 'Débito' },
];

/** Categorias do MVP (backlog, seção 4) + as compostas usadas pelo catálogo. */
export const CATEGORIAS: string[] = [
  'Streaming de vídeo',
  'Música',
  'Streaming de vídeo / Música',
  'Streaming / Compras',
  'Armazenamento em nuvem',
  'Software / Produtividade',
  'Compras',
  'Delivery',
  'Saúde e bem-estar',
  'Casa e serviços',
  'Telefonia',
  'Educação',
  'Outros',
];

export function rotuloCiclo(c: Ciclo): string {
  return CICLOS.find((x) => x.valor === c)?.rotulo ?? c;
}
export function sufixoCiclo(c: Ciclo): string {
  return CICLOS.find((x) => x.valor === c)?.sufixo ?? '';
}
export function rotuloPagamento(p: FormaPagamento): string {
  return FORMAS_PAGAMENTO.find((x) => x.valor === p)?.rotulo ?? p;
}
export function ehCiclo(v: unknown): v is Ciclo {
  return v === 'mensal' || v === 'anual' || v === 'semanal';
}
export function ehPagamento(v: unknown): v is FormaPagamento {
  return v === 'cartao' || v === 'pix' || v === 'boleto' || v === 'debito';
}
export function ehStatus(v: unknown): v is Status {
  return v === 'ativa' || v === 'pausada' || v === 'cancelada';
}
