// Provedor FALSO, só para o build de teste (VITE_MODO=teste). Nunca entra no build de produção (D-10, US-12.CA14):
// só é importado por ambiente.teste.ts, que o vite.config.ts escolhe pelo alias "@ambiente" no build de teste.
// O teste controla o comportamento pela chave `mensalao:teste:provedor` do localStorage (lida a cada chamada)
// ou por `window.__mensalaoTeste.provedor.configurar({...})`.
import type { ProvedorCompra, ResultadoCompra } from './provedor';

/** Identificador procurado pelo script de verificação do bundle (scripts/verificar-provedor-falso.mjs). */
export const ID_PROVEDOR_FALSO = 'provedor-falso-mensalao';
export const CHAVE_CONTROLE_PROVEDOR = 'mensalao:teste:provedor';
export const CHAVE_CHAMADAS_PROVEDOR = 'mensalao:teste:provedor-chamadas';

export interface ControleProvedorFalso {
  /** Provedor disponível (como dentro da TWA). Padrão: true. Use false para simular o navegador comum. */
  disponivel: boolean;
  /** Preço devolvido por detalhes(); null = loja não devolveu o produto. Padrão: "R$ 16,90". */
  preco: string | null;
  /** 'erro' faz detalhes() falhar (US-11.CA3). Padrão: 'ok'. */
  detalhes: 'ok' | 'erro';
  /** Resultado de comprar(). Padrão: 'ok'. */
  compra: ResultadoCompra;
  /** SKUs que a "conta da Google Play" possui. Padrão: []. Compra 'ok' acrescenta "mensalao_pro". */
  compras: string[];
  /** 'erro' faz listarCompras() falhar (erro/timeout da loja). Padrão: 'ok'. */
  listar: 'ok' | 'erro';
  /** Simula falta de rede (também vale quando navigator.onLine é false). Padrão: false. */
  offline: boolean;
  /** Atraso artificial de cada resposta, em ms. Padrão: 0. */
  atrasoMs: number;
}

export const CONTROLE_PADRAO: ControleProvedorFalso = {
  disponivel: true,
  preco: 'R$ 16,90',
  detalhes: 'ok',
  compra: 'ok',
  compras: [],
  listar: 'ok',
  offline: false,
  atrasoMs: 0,
};

export function lerControle(): ControleProvedorFalso {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE_CONTROLE_PROVEDOR) ?? '{}') as Partial<ControleProvedorFalso>;
    return { ...CONTROLE_PADRAO, ...(typeof v === 'object' && v !== null ? v : {}) };
  } catch {
    return { ...CONTROLE_PADRAO };
  }
}

export function configurarControle(parcial: Partial<ControleProvedorFalso>): ControleProvedorFalso {
  const novo = { ...lerControle(), ...parcial };
  localStorage.setItem(CHAVE_CONTROLE_PROVEDOR, JSON.stringify(novo));
  return novo;
}

export type Chamadas = Record<'disponivel' | 'detalhes' | 'comprar' | 'listarCompras', number>;

export function lerChamadas(): Chamadas {
  try {
    return { disponivel: 0, detalhes: 0, comprar: 0, listarCompras: 0, ...JSON.parse(localStorage.getItem(CHAVE_CHAMADAS_PROVEDOR) ?? '{}') };
  } catch {
    return { disponivel: 0, detalhes: 0, comprar: 0, listarCompras: 0 };
  }
}

function contar(metodo: keyof Chamadas): void {
  const c = lerChamadas();
  c[metodo] += 1;
  localStorage.setItem(CHAVE_CHAMADAS_PROVEDOR, JSON.stringify(c));
}

function esperar(ms: number): Promise<void> {
  return ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve();
}

function semRede(c: ControleProvedorFalso): boolean {
  return c.offline || (typeof navigator !== 'undefined' && navigator.onLine === false);
}

export class ProvedorFalso implements ProvedorCompra {
  readonly tipo = 'falso' as const;
  readonly id = ID_PROVEDOR_FALSO;

  async disponivel(): Promise<boolean> {
    contar('disponivel');
    return lerControle().disponivel;
  }

  async detalhes(sku: string): Promise<{ preco: string } | null> {
    contar('detalhes');
    const c = lerControle();
    await esperar(c.atrasoMs);
    if (!c.disponivel) return null;
    if (semRede(c) || c.detalhes === 'erro') throw new Error(`${ID_PROVEDOR_FALSO}: falha ao consultar ${sku}`);
    return c.preco === null ? null : { preco: c.preco };
  }

  async comprar(sku: string): Promise<ResultadoCompra> {
    contar('comprar');
    const c = lerControle();
    await esperar(c.atrasoMs);
    if (!c.disponivel || semRede(c)) return 'erro';
    if (c.compra === 'ok' && !c.compras.includes(sku)) configurarControle({ compras: [...c.compras, sku] });
    return c.compra;
  }

  async listarCompras(): Promise<string[]> {
    contar('listarCompras');
    const c = lerControle();
    await esperar(c.atrasoMs);
    if (!c.disponivel || semRede(c) || c.listar === 'erro') throw new Error(`${ID_PROVEDOR_FALSO}: falha ao listar compras`);
    return [...c.compras];
  }
}
