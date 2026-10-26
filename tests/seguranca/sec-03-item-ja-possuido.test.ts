// SEC-03 — o erro ITEM_ALREADY_OWNED da Play não pode liberar o Pro sozinho: a Play responde assim também com
// compra PENDENTE. Só a lista de compras (purchaseState "1") confirma o Pro.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CHAVE_PRO, SKU_PRO } from '../../src/domain/pro';

const plugin = vi.hoisted(() => ({
  isBillingSupported: vi.fn(),
  purchaseProduct: vi.fn(),
  getPurchases: vi.fn(),
  acknowledgePurchase: vi.fn(),
  getProduct: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true, isPluginAvailable: () => true },
}));
vi.mock('@capgo/native-purchases', () => ({
  NativePurchases: plugin,
  PURCHASE_TYPE: { INAPP: 'inapp', SUBS: 'subs' },
}));
vi.mock('@ambiente', async () => {
  const { ProvedorPlayNativo } = await import('../../src/plataforma/compra-play');
  return { criarProvedor: () => new ProvedorPlayNativo() };
});

const dados = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => dados.get(k) ?? null,
  setItem: (k: string, v: string) => void dados.set(k, String(v)),
  removeItem: (k: string) => void dados.delete(k),
  clear: () => dados.clear(),
});

function jaPossui(): Error {
  return Object.assign(new Error('Purchase failed: ITEM_ALREADY_OWNED'), { code: 'ITEM_ALREADY_OWNED' });
}

async function servico() {
  vi.resetModules();
  return import('../../src/servicos/pro');
}

describe('SEC-03: ITEM_ALREADY_OWNED só libera o Pro com compra confirmada na lista', () => {
  beforeEach(() => {
    dados.clear();
    vi.clearAllMocks();
    plugin.isBillingSupported.mockResolvedValue({ isBillingSupported: true });
    plugin.purchaseProduct.mockRejectedValue(jaPossui());
    plugin.acknowledgePurchase.mockResolvedValue(undefined);
  });

  it('compra pendente (purchaseState "2") → "erro" e o cache Pro não é gravado', async () => {
    plugin.getPurchases.mockResolvedValue({
      purchases: [{ productIdentifier: SKU_PRO, purchaseState: '2', purchaseToken: 't', isAcknowledged: false }],
    });
    const pro = await servico();
    expect(await pro.comprarPro()).toBe('erro');
    expect(pro.ehPro()).toBe(false);
    expect(dados.get(CHAVE_PRO)).toBeUndefined();
    expect(plugin.acknowledgePurchase).not.toHaveBeenCalled();
  });

  it('sem compra na lista → "erro"', async () => {
    plugin.getPurchases.mockResolvedValue({ purchases: [] });
    const pro = await servico();
    expect(await pro.comprarPro()).toBe('erro');
    expect(dados.get(CHAVE_PRO)).toBeUndefined();
  });

  it('lista falha (offline) → "erro"', async () => {
    plugin.getPurchases.mockRejectedValue(new Error('offline'));
    const pro = await servico();
    expect(await pro.comprarPro()).toBe('erro');
    expect(dados.get(CHAVE_PRO)).toBeUndefined();
  });

  it('compra confirmada (purchaseState "1") → "ok", Pro gravado e acknowledge feito', async () => {
    plugin.getPurchases.mockResolvedValue({
      purchases: [{ productIdentifier: SKU_PRO, purchaseState: '1', purchaseToken: 't', isAcknowledged: false }],
    });
    const pro = await servico();
    expect(await pro.comprarPro()).toBe('ok');
    expect(pro.ehPro()).toBe(true);
    expect(JSON.parse(dados.get(CHAVE_PRO)!).pro).toBe(true);
    expect(plugin.acknowledgePurchase).toHaveBeenCalledWith({ purchaseToken: 't' });
  });
});
