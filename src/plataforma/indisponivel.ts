// Provedor "Indisponível": navegador comum, fora da TWA da Google Play (D-02, US-11.CA7).
import type { ProvedorCompra, ResultadoCompra } from './provedor';

export class ProvedorIndisponivel implements ProvedorCompra {
  readonly tipo = 'indisponivel' as const;

  async disponivel(): Promise<boolean> {
    return false;
  }

  async detalhes(): Promise<{ preco: string } | null> {
    return null;
  }

  async comprar(): Promise<ResultadoCompra> {
    return 'erro';
  }

  /** Sem loja não há resposta: falha (nunca "lista vazia", que revogaria o Pro). */
  async listarCompras(): Promise<string[]> {
    throw new Error('compra indisponível neste ambiente');
  }
}
