// US-20 — Régua do mês (design 3.6): as cobranças do mês corrente, dia a dia, com altura proporcional
// ao valor e a separação entre o que já saiu e o que falta. Funções puras, sem DOM.
import { diasNoMes, lerIso, MESES_CURTOS, MESES_LONGOS, paraIso, proximoCiclo, somarDias, somarMeses } from './datas';
import { formatarBRL } from './dinheiro';
import { testeVigente } from './proximas';
import type { Assinatura } from './tipos';

/** Altura mínima da marca (% da régua), para valores pequenos ainda aparecerem. */
export const ALTURA_MINIMA = 18;

export interface CobrancaDoMes {
  assinaturaId: string;
  nome: string;
  data: string;
  dia: number;
  valorCentavos: number;
  /** Antes de hoje: já saiu (marca vazada). Hoje e depois: a cobrar (marca cheia). */
  jaCobrada: boolean;
}

export interface MarcaRegua {
  dia: number;
  totalCentavos: number;
  /** Altura em % da régua (ALTURA_MINIMA a 100). */
  alturaPct: number;
  /** Todas as cobranças do dia já saíram. */
  jaCobrada: boolean;
}

export interface ReguaMes {
  ano: number;
  mes: number;
  /** 28 a 31. */
  dias: number;
  /** Dia de hoje (1 a `dias`). */
  hoje: number;
  /** Cobranças do mês em ordem de data (empate: nome). */
  cobrancas: CobrancaDoMes[];
  /** Uma marca por dia com cobrança, em ordem de dia. */
  marcas: MarcaRegua[];
}

/** Data um ciclo antes (mensal: −1 mês; anual: −1 ano; semanal: −7 dias), mantendo o dia de referência. */
function cicloAnterior(a: Assinatura, iso: string): string {
  if (a.ciclo === 'semanal') return somarDias(iso, -7);
  return somarMeses(iso, a.ciclo === 'anual' ? -12 : -1, a.diaRef);
}

/**
 * Datas de cobrança de uma assinatura que caem no mês de `inicio`..`fim` (design 3.6): parte de um ciclo
 * antes da `proxima` (semanal: volta de 7 em 7 até antes do mês) e avança até sair do mês. Datas entre
 * hoje e a `proxima` não são cobranças (a próxima é a `proxima`). Teste grátis vigente: só a partir da `proxima`.
 */
function datasNoMes(a: Assinatura, inicio: string, fim: string, hoje: string): string[] {
  let d = a.proxima;
  if (!testeVigente(a, hoje)) {
    d = cicloAnterior(a, d);
    if (a.ciclo === 'semanal') while (d >= inicio) d = cicloAnterior(a, d);
  }
  const datas: string[] = [];
  for (let passos = 0; d <= fim && passos < 400; passos += 1) {
    const falsa = d >= hoje && d < a.proxima;
    if (d >= inicio && !falsa) datas.push(d);
    d = proximoCiclo(d, a.ciclo, a.diaRef);
  }
  return datas;
}

/** Monta a régua do mês de `hoje` com as assinaturas ativas (pausadas e canceladas não entram). */
export function marcasDoMes(assinaturas: Assinatura[], hoje: string): ReguaMes {
  const h = lerIso(hoje)!;
  const dias = diasNoMes(h.ano, h.mes);
  const inicio = paraIso({ ano: h.ano, mes: h.mes, dia: 1 });
  const fim = paraIso({ ano: h.ano, mes: h.mes, dia: dias });

  const cobrancas: CobrancaDoMes[] = [];
  for (const a of assinaturas) {
    if (a.status !== 'ativa' || !lerIso(a.proxima)) continue;
    for (const data of datasNoMes(a, inicio, fim, hoje)) {
      cobrancas.push({ assinaturaId: a.id, nome: a.nome, data, dia: lerIso(data)!.dia, valorCentavos: a.valorCentavos, jaCobrada: data < hoje });
    }
  }
  cobrancas.sort((x, y) => (x.data < y.data ? -1 : x.data > y.data ? 1 : x.nome.localeCompare(y.nome, 'pt-BR', { sensitivity: 'base' })));

  const porDia = new Map<number, CobrancaDoMes[]>();
  for (const c of cobrancas) porDia.set(c.dia, [...(porDia.get(c.dia) ?? []), c]);
  const somas = [...porDia.entries()].map(([dia, cs]) => ({ dia, total: cs.reduce((s, c) => s + c.valorCentavos, 0), jaCobrada: cs.every((c) => c.jaCobrada) }));
  const maior = Math.max(1, ...somas.map((s) => s.total));
  const marcas = somas
    .sort((x, y) => x.dia - y.dia)
    .map((s) => ({ dia: s.dia, totalCentavos: s.total, alturaPct: Math.max(ALTURA_MINIMA, Math.round((s.total / maior) * 100)), jaCobrada: s.jaCobrada }));

  return { ano: h.ano, mes: h.mes, dias, hoje: h.dia, cobrancas, marcas };
}

/** Rótulos da legenda (design 3.6): "1 out" some se hoje for dia 1 a 4; o número final some nos 4 últimos dias. */
export function legendaRegua(r: ReguaMes): { inicio: string | null; hoje: string; fim: string | null } {
  return {
    inicio: r.hoje <= 4 ? null : `1 ${MESES_CURTOS[r.mes - 1]}`,
    hoje: `hoje, ${r.hoje}`,
    fim: r.hoje > r.dias - 4 ? null : String(r.dias),
  };
}

function descrever(c: CobrancaDoMes, hojeDia: number): string {
  return `${c.dia === hojeDia ? 'hoje' : `dia ${c.dia}`}, ${c.nome}, ${formatarBRL(c.valorCentavos)}`;
}

/**
 * Equivalente em texto para leitor de tela (US-20.CA2): "Cobranças de outubro. Já saiu: dia 5, Academia,
 * R$ 99,90. Faltam: hoje, Spotify, R$ 21,90; dia 19, Netflix, R$ 44,90." Sem cobranças: "Nenhuma cobrança em outubro."
 */
export function textoRegua(r: ReguaMes): string {
  const mes = MESES_LONGOS[r.mes - 1];
  if (r.cobrancas.length === 0) return `Nenhuma cobrança em ${mes}.`;
  const saiu = r.cobrancas.filter((c) => c.jaCobrada).map((c) => descrever(c, r.hoje));
  const faltam = r.cobrancas.filter((c) => !c.jaCobrada).map((c) => descrever(c, r.hoje));
  const partes = [`Cobranças de ${mes}.`];
  if (saiu.length) partes.push(`Já saiu: ${saiu.join('; ')}.`);
  if (faltam.length) partes.push(`Faltam: ${faltam.join('; ')}.`);
  return partes.join(' ');
}
