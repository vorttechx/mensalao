// Provedor Google Play (E-04): Digital Goods API + Payment Request, método https://play.google.com/billing.
// Só funciona dentro da TWA instalada pela Google Play (com playBilling ativado no twa-manifest).
import type { ProvedorCompra, ResultadoCompra } from './provedor';

const METODO_PLAY = 'https://play.google.com/billing';

interface DetalhesItem {
  itemId: string;
  price: { currency: string; value: string };
}
interface CompraPlay {
  itemId: string;
  purchaseToken: string;
}
interface ServicoDigitalGoods {
  getDetails(ids: string[]): Promise<DetalhesItem[]>;
  listPurchases(): Promise<CompraPlay[]>;
  /** Existe só na versão 1.0 da API; na 2.0 a confirmação acontece ao completar o pagamento. */
  acknowledge?(token: string, tipo: 'onetime' | 'repeatable'): Promise<void>;
}
type JanelaDigitalGoods = Window & { getDigitalGoodsService?: (metodo: string) => Promise<ServicoDigitalGoods | null | undefined> };

/** A API só existe na TWA (ou em navegador com recurso experimental). */
export function playSuportado(): boolean {
  return typeof (window as JanelaDigitalGoods).getDigitalGoodsService === 'function' && typeof PaymentRequest !== 'undefined';
}

/** Formata o preço devolvido pela loja na moeda dela (o app não fixa valor em código, D-04). */
function formatarPreco(p: DetalhesItem['price']): string {
  const valor = Number(p.value);
  if (!Number.isFinite(valor)) return `${p.currency} ${p.value}`;
  const idioma = navigator.language || 'pt-BR';
  return new Intl.NumberFormat(idioma, { style: 'currency', currency: p.currency }).format(valor).replace(/ /g, ' ');
}

export class ProvedorPlay implements ProvedorCompra {
  readonly tipo = 'play' as const;
  private servico: Promise<ServicoDigitalGoods | null> | null = null;

  private obterServico(): Promise<ServicoDigitalGoods | null> {
    if (!this.servico) {
      this.servico = (async () => {
        try {
          const s = await (window as JanelaDigitalGoods).getDigitalGoodsService!(METODO_PLAY);
          return s ?? null;
        } catch {
          return null;
        }
      })();
    }
    return this.servico;
  }

  async disponivel(): Promise<boolean> {
    return (await this.obterServico()) !== null;
  }

  async detalhes(sku: string): Promise<{ preco: string } | null> {
    const s = await this.obterServico();
    if (!s) return null;
    const itens = await s.getDetails([sku]);
    const item = itens.find((i) => i.itemId === sku);
    return item ? { preco: formatarPreco(item.price) } : null;
  }

  async listarCompras(): Promise<string[]> {
    const s = await this.obterServico();
    if (!s) throw new Error('Google Play indisponível');
    const compras = await s.listPurchases();
    return compras.map((c) => c.itemId);
  }

  async comprar(sku: string): Promise<ResultadoCompra> {
    const s = await this.obterServico();
    if (!s) return 'erro';
    let resposta: PaymentResponse;
    try {
      const pedido = new PaymentRequest([{ supportedMethods: METODO_PLAY, data: { sku } }], {
        // O valor real vem da Play; o total aqui é exigido pela API, mas ignorado pela loja.
        total: { label: 'Total', amount: { currency: 'BRL', value: '0' } },
      });
      resposta = await pedido.show();
    } catch (e) {
      // Fechar a janela da loja gera AbortError: é cancelamento, não erro (US-11.CA5).
      return e instanceof DOMException && e.name === 'AbortError' ? 'cancelado' : 'erro';
    }
    try {
      const token = (resposta.details as { purchaseToken?: string } | null)?.purchaseToken;
      // Confirmação (acknowledge) exigida pela Play para não estornar a compra em 3 dias.
      if (token && typeof s.acknowledge === 'function') await s.acknowledge(token, 'onetime');
      await resposta.complete('success');
      return 'ok';
    } catch {
      try {
        await resposta.complete('fail');
      } catch {
        // nada a fazer
      }
      return 'erro';
    }
  }
}
