// US-24.CA3 a CA6 — Compra do Pro pelo Google Play Billing nativo (plugin @capgo/native-purchases, que usa a
// Play Billing Library direto no aparelho, sem servidor de terceiros). Mesmo contrato ProvedorCompra da sprint 2:
// as regras de verificação, cache, revogação e restauração continuam em domain/pro.ts e servicos/pro.ts.
import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE, type Transaction } from '@capgo/native-purchases';
import type { ProvedorCompra, ResultadoCompra } from './provedor';

/** Estado "comprado" da Play Billing Library (Purchase.PurchaseState.PURCHASED); "2" = pendente. */
const COMPRADO = '1';

function mensagem(e: unknown): string {
  if (e instanceof Error) return `${e.message} ${(e as { code?: string }).code ?? ''}`;
  return String(e);
}

export class ProvedorPlayNativo implements ProvedorCompra {
  readonly tipo = 'play' as const;
  private suporte: Promise<boolean> | null = null;

  disponivel(): Promise<boolean> {
    if (!this.suporte) {
      this.suporte = (async () => {
        if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('NativePurchases')) return false;
        try {
          return (await NativePurchases.isBillingSupported()).isBillingSupported === true;
        } catch {
          return false;
        }
      })();
    }
    return this.suporte;
  }

  /** Preço formatado pela própria Play, na moeda da conta (sem valor em código, US-24.CA3). */
  async detalhes(sku: string): Promise<{ preco: string } | null> {
    if (!(await this.disponivel())) return null;
    try {
      const { product } = await NativePurchases.getProduct({ productIdentifier: sku, productType: PURCHASE_TYPE.INAPP });
      return product?.priceString ? { preco: product.priceString.replace(/ /g, ' ') } : null;
    } catch (e) {
      if (/not found/i.test(mensagem(e))) return null; // a loja respondeu sem o produto
      throw e instanceof Error ? e : new Error(String(e));
    }
  }

  async comprar(sku: string): Promise<ResultadoCompra> {
    if (!(await this.disponivel())) return 'erro';
    let t: Transaction;
    try {
      t = await NativePurchases.purchaseProduct({ productIdentifier: sku, productType: PURCHASE_TYPE.INAPP, quantity: 1 });
    } catch (e) {
      const m = mensagem(e);
      if (/USER_CANCELED/i.test(m)) return 'cancelado'; // fechar a folha da Play não é erro (US-11.CA5)
      if (!/ITEM_ALREADY_OWNED/i.test(m)) return 'erro';
      // SEC-03: a Play também diz "já possui" com compra PENDENTE; só a lista (purchaseState "1") libera o Pro.
      try {
        return (await this.listarCompras()).includes(sku) ? 'ok' : 'erro';
      } catch {
        return 'erro';
      }
    }
    if (t.purchaseState !== undefined && t.purchaseState !== COMPRADO) return 'erro'; // pendente: sem Pro ainda
    await this.confirmar(t);
    return 'ok';
  }

  /** SKUs comprados. Lança em falha da loja/offline (diferente de "lista vazia", que revoga). */
  async listarCompras(): Promise<string[]> {
    if (!(await this.disponivel())) throw new Error('Google Play indisponível');
    const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP });
    const compradas = purchases.filter((p) => p.purchaseState === undefined || p.purchaseState === COMPRADO);
    // US-24.CA4: compra sem confirmação (falhou da outra vez) é confirmada de novo ao abrir.
    for (const p of compradas) await this.confirmar(p);
    return compradas.map((p) => p.productIdentifier);
  }

  /** Confirma (acknowledge) na Play; sem isso a Play reembolsa em 3 dias. Falha aqui não tira o Pro. */
  private async confirmar(t: Transaction): Promise<void> {
    if (t.isAcknowledged !== false || !t.purchaseToken) return;
    try {
      await NativePurchases.acknowledgePurchase({ purchaseToken: t.purchaseToken });
    } catch {
      // Tenta de novo na próxima abertura (listarCompras).
    }
  }
}
