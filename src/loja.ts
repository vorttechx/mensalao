// Estado em memória da aplicação + persistência. A UI lê e grava por aqui.
import { salvar } from './armazenamento';
import { isoDeDate } from './domain/datas';
import { normalizarDatas } from './domain/operacoes';
import { estadoVazio, type Estado } from './domain/tipos';

let estado: Estado = estadoVazio();
let recuperacao = false;

/** Modo de recuperação: dados salvos ilegíveis; nada é gravado até o usuário decidir. */
export function emRecuperacao(): boolean {
  return recuperacao;
}
export function entrarEmRecuperacao(): void {
  recuperacao = true;
}
export function sairDaRecuperacao(): void {
  recuperacao = false;
}

/** "Hoje" no fuso do aparelho, em ISO. Único ponto que consulta o relógio. */
export function hoje(): string {
  return isoDeDate(new Date());
}

export function obterEstado(): Estado {
  return estado;
}

const ouvintes = new Set<() => void>();

/** Avisado depois de cada gravação do estado (ex.: cópias automáticas, US-14.CA2). */
export function aoMudarEstado(fn: () => void): void {
  ouvintes.add(fn);
}

/** Substitui o estado e grava no localStorage. */
export function definirEstado(novo: Estado): void {
  estado = novo;
  salvar(novo);
  for (const fn of ouvintes) fn();
}

/** "Agora" local: dia ISO e "aaaa-mm-ddThh:mm" (cópias automáticas). */
export function agoraLocal(): { dia: string; dataHora: string } {
  const d = new Date();
  const dois = (n: number): string => String(n).padStart(2, '0');
  const dia = isoDeDate(d);
  return { dia, dataHora: `${dia}T${dois(d.getHours())}:${dois(d.getMinutes())}` };
}

/** Troca o estado em memória sem gravar (usado na carga inicial). */
export function iniciarEstado(inicial: Estado): void {
  estado = inicial;
}

/** Avança datas vencidas (US-02.CA4) e persiste se algo mudou. */
export function normalizarAgora(): void {
  if (recuperacao) return;
  const r = normalizarDatas(estado, hoje());
  if (r.mudou) definirEstado(r.estado);
}

export function gerarId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
