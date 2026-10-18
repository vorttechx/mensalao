// US-13 — Lembretes antes da cobrança (puro). "Hoje" e os pares já avisados vêm por parâmetro (US-13.CA15).
import { diferencaDias } from './datas';
import { formatarBRL } from './dinheiro';
import { normalizarDatas } from './operacoes';
import { testeVigente } from './proximas';
import { LEMBRETE_DIAS_MAX } from './preferencias';
import type { Estado } from './tipos';

export interface ItemLembrete {
  /** Chave única do par (assinatura, data): "c|id|data" ou "t|id|data". */
  chave: string;
  tipo: 'cobranca' | 'fim-teste';
  assinaturaId: string;
  nome: string;
  /** Data ISO da cobrança ou do fim do teste. */
  data: string;
  diasAte: number;
  valorCentavos: number;
  /** "Amanhã: Netflix — R$ 44,90" ou "Teste grátis de Max termina amanhã". */
  texto: string;
}

/** "Hoje", "Amanhã", "Em 3 dias" (design 9.4, decisão S2-9). */
export function prefixoDias(dias: number): string {
  if (dias <= 0) return 'Hoje';
  if (dias === 1) return 'Amanhã';
  return `Em ${dias} dias`;
}

function textoFimTesteLembrete(nome: string, dias: number): string {
  const quando = dias <= 0 ? 'hoje' : dias === 1 ? 'amanhã' : `em ${dias} dias`;
  return `Teste grátis de ${nome} termina ${quando}`;
}

/**
 * Lembretes na janela [hoje, hoje + dias]. As datas vencidas são avançadas antes (US-13.CA9).
 * Cobrança: assinatura ativa fora de teste grátis vigente. Teste grátis vigente: avisa o fim do teste (CA8).
 * `itens` = tudo na janela (aviso dentro do app); `novos` = os ainda não notificados (CA4).
 */
export function lembretesDevidos(
  estado: Estado,
  hoje: string,
  dias: number,
  jaAvisados: readonly string[] = [],
): { itens: ItemLembrete[]; novos: ItemLembrete[] } {
  const { estado: e } = normalizarDatas(estado, hoje);
  const itens: ItemLembrete[] = [];
  for (const a of e.assinaturas) {
    if (a.status !== 'ativa') continue;
    if (testeVigente(a, hoje)) {
      const d = diferencaDias(hoje, a.fimTeste!);
      if (d >= 0 && d <= dias) {
        itens.push({
          chave: `t|${a.id}|${a.fimTeste}`,
          tipo: 'fim-teste',
          assinaturaId: a.id,
          nome: a.nome,
          data: a.fimTeste!,
          diasAte: d,
          valorCentavos: a.valorCentavos,
          texto: textoFimTesteLembrete(a.nome, d),
        });
      }
      continue;
    }
    const d = diferencaDias(hoje, a.proxima);
    if (d >= 0 && d <= dias) {
      itens.push({
        chave: `c|${a.id}|${a.proxima}`,
        tipo: 'cobranca',
        assinaturaId: a.id,
        nome: a.nome,
        data: a.proxima,
        diasAte: d,
        valorCentavos: a.valorCentavos,
        texto: `${prefixoDias(d)}: ${a.nome} — ${formatarBRL(a.valorCentavos)}`,
      });
    }
  }
  itens.sort((x, y) => (x.data < y.data ? -1 : x.data > y.data ? 1 : x.nome.localeCompare(y.nome, 'pt-BR', { sensitivity: 'base' })));
  const avisados = new Set(jaAvisados);
  return { itens, novos: itens.filter((i) => !avisados.has(i.chave)) };
}

/** Registra os pares avisados e descarta os de datas já passadas (a lista não cresce para sempre). */
export function registrarAvisados(jaAvisados: readonly string[], novos: readonly ItemLembrete[], hoje: string): string[] {
  const todos = [...jaAvisados, ...novos.map((n) => n.chave)];
  return [...new Set(todos)].filter((k) => {
    const data = k.split('|')[2] ?? '';
    return data >= hoje;
  });
}

/** Dias de antecedência: inteiro de 0 a 7 (US-13.CA2); inválido → null. */
export function lerDiasLembrete(texto: string): number | null {
  const t = texto.trim();
  if (!/^\d{1,2}$/.test(t)) return null;
  const n = Number(t);
  return n >= 0 && n <= LEMBRETE_DIAS_MAX ? n : null;
}

/** "1 dia antes da cobrança", "no dia da cobrança", "3 dias antes da cobrança". */
export function textoAntecedencia(dias: number): string {
  if (dias === 0) return 'no dia da cobrança';
  return `${dias} ${dias === 1 ? 'dia' : 'dias'} antes da cobrança`;
}
