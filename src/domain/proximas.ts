// US-02 — Próximas cobranças: ordenação, destaque "vence logo" e testes grátis.
import { diferencaDias } from './datas';
import type { Assinatura } from './tipos';

export interface ItemProximo {
  assinatura: Assinatura;
  /** Dias entre hoje e a próxima cobrança (0 = hoje). */
  diasAteCobranca: number;
  /** Mostrar selo "vence logo" (hoje, amanhã, em X dias). */
  seloVence: boolean;
  /** Mostrar selo "Teste grátis termina em X dias". */
  seloTeste: boolean;
  /** Dias até o fim do teste (só para teste vigente). */
  diasFimTeste: number | null;
  /** Data ISO em que o teste terminou (teste já encerrado), para o aviso. */
  testeTerminouEm: string | null;
}

/** Teste grátis ainda vigente: marcado e com fim hoje ou no futuro. */
export function testeVigente(a: Assinatura, hoje: string): boolean {
  return a.emTeste && a.fimTeste !== null && a.fimTeste >= hoje;
}

/** Teste grátis marcado cujo fim já passou: agora é cobrança normal (US-02.CA8). */
export function testeEncerrado(a: Assinatura, hoje: string): boolean {
  return a.emTeste && a.fimTeste !== null && a.fimTeste < hoje;
}

function compararNome(a: Assinatura, b: Assinatura): number {
  return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
}

/**
 * Lista as assinaturas ativas pela próxima cobrança (empate: nome) e calcula os destaques.
 * `diasAviso` = N: destaca o que vence entre hoje e hoje + N (inclusive).
 */
export function listarProximas(assinaturas: Assinatura[], hoje: string, diasAviso: number): ItemProximo[] {
  return assinaturas
    .filter((a) => a.status === 'ativa')
    .slice()
    .sort((a, b) => (a.proxima < b.proxima ? -1 : a.proxima > b.proxima ? 1 : compararNome(a, b)))
    .map((a) => {
      const diasAteCobranca = diferencaDias(hoje, a.proxima);
      const vigente = testeVigente(a, hoje);
      const diasFimTeste = vigente ? diferencaDias(hoje, a.fimTeste!) : null;
      const seloTeste = diasFimTeste !== null && diasFimTeste <= diasAviso;
      // Fim do teste na mesma data da cobrança: só o selo de teste (design.md 4.1).
      const seloVence = diasAteCobranca >= 0 && diasAteCobranca <= diasAviso && !(seloTeste && a.fimTeste === a.proxima);
      return {
        assinatura: a,
        diasAteCobranca,
        seloVence,
        seloTeste,
        diasFimTeste,
        testeTerminouEm: testeEncerrado(a, hoje) ? a.fimTeste : null,
      };
    });
}

/** "hoje", "amanhã", "em 3 dias". */
export function textoVenceLogo(dias: number): string {
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'amanhã';
  return `em ${dias} dias`;
}

/** "Teste grátis termina hoje / amanhã / em X dias". */
export function textoFimTeste(dias: number): string {
  if (dias <= 0) return 'Teste grátis termina hoje';
  if (dias === 1) return 'Teste grátis termina amanhã';
  return `Teste grátis termina em ${dias} dias`;
}

/** Subtítulo do Início conforme N. */
export function textoJanelaAviso(n: number): string {
  if (n === 0) return 'Destaque só para cobranças de hoje';
  if (n === 1) return 'Destaque para hoje e amanhã';
  return `Destaque para os próximos ${n} dias`;
}
