// US-24 — Plataforma Android (Capacitor) com os plugins nativos SIMULADOS: Play Billing, notificações locais,
// entrega de arquivo e provedores "indisponível". O comportamento real em aparelho fica no roteiro manual
// (dev-notes §9, itens 5, 6, 12 e 13).
import { beforeEach, describe, expect, it, vi } from 'vitest';

const billing = vi.hoisted(() => ({
  isBillingSupported: vi.fn(),
  purchaseProduct: vi.fn(),
  getPurchases: vi.fn(),
  acknowledgePurchase: vi.fn(),
  getProduct: vi.fn(),
}));
const notif = vi.hoisted(() => ({ checkPermissions: vi.fn(), requestPermissions: vi.fn(), schedule: vi.fn() }));
const fs = vi.hoisted(() => ({ writeFile: vi.fn() }));
const share = vi.hoisted(() => ({ share: vi.fn() }));
const nativo = vi.hoisted(() => ({ native: true }));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => nativo.native, isPluginAvailable: () => nativo.native },
}));
vi.mock('@capgo/native-purchases', () => ({ NativePurchases: billing, PURCHASE_TYPE: { INAPP: 'inapp', SUBS: 'subs' } }));
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: notif }));
vi.mock('@capacitor/filesystem', () => ({ Filesystem: fs, Directory: { Cache: 'CACHE' }, Encoding: { UTF8: 'utf8' } }));
vi.mock('@capacitor/share', () => ({ Share: share }));

import { ProvedorPlayNativo } from '../../src/plataforma/compra-play';
import { NotificadorLocal } from '../../src/plataforma/notificador-local';
import { SalvadorNativo } from '../../src/plataforma/arquivos-nativo';
import { ProvedorIndisponivel } from '../../src/plataforma/indisponivel';
import { AnunciosIndisponivel } from '../../src/plataforma/anuncios-indisponivel';

const SKU = 'mensalao_pro';
const erro = (m: string) => Object.assign(new Error(m), { code: m });

beforeEach(() => {
  vi.clearAllMocks();
  nativo.native = true;
  billing.isBillingSupported.mockResolvedValue({ isBillingSupported: true });
  billing.acknowledgePurchase.mockResolvedValue(undefined);
});

describe('US-24.CA3 compra pelo Google Play Billing (plugin simulado)', () => {
  it('o preço mostrado vem da loja, com espaço normal no lugar do espaço de largura fixa', async () => {
    billing.getProduct.mockResolvedValue({ product: { priceString: 'R$ 19,99' } });
    expect(await new ProvedorPlayNativo().detalhes(SKU)).toEqual({ preco: 'R$ 19,99' });
    expect(billing.getProduct).toHaveBeenCalledWith({ productIdentifier: SKU, productType: 'inapp' });
  });
  it('produto não encontrado = a loja respondeu sem o produto (null); outro erro lança (o app mostra "tentar de novo")', async () => {
    billing.getProduct.mockRejectedValue(new Error('Product not found'));
    expect(await new ProvedorPlayNativo().detalhes(SKU)).toBeNull();
    billing.getProduct.mockRejectedValue(new Error('SERVICE_UNAVAILABLE'));
    await expect(new ProvedorPlayNativo().detalhes(SKU)).rejects.toThrow();
  });
  it('US-24.CA3: compra aprovada = ok; USER_CANCELED = cancelado; outros erros = erro', async () => {
    billing.purchaseProduct.mockResolvedValue({ purchaseState: '1', isAcknowledged: true, purchaseToken: 't' });
    expect(await new ProvedorPlayNativo().comprar(SKU)).toBe('ok');
    billing.purchaseProduct.mockRejectedValue(erro('USER_CANCELED'));
    expect(await new ProvedorPlayNativo().comprar(SKU)).toBe('cancelado');
    billing.purchaseProduct.mockRejectedValue(erro('BILLING_UNAVAILABLE'));
    expect(await new ProvedorPlayNativo().comprar(SKU)).toBe('erro');
  });
  it('US-24.CA3: compra pendente (purchaseState "2") não libera o Pro', async () => {
    billing.purchaseProduct.mockResolvedValue({ purchaseState: '2', isAcknowledged: false, purchaseToken: 't' });
    expect(await new ProvedorPlayNativo().comprar(SKU)).toBe('erro');
    expect(billing.acknowledgePurchase).not.toHaveBeenCalled();
  });
  it('fora do app Android (sem plugin) a compra é "erro" e a disponibilidade é falsa', async () => {
    nativo.native = false;
    const p = new ProvedorPlayNativo();
    expect(await p.disponivel()).toBe(false);
    expect(await p.comprar(SKU)).toBe('erro');
    await expect(p.listarCompras()).rejects.toThrow();
    expect(billing.purchaseProduct).not.toHaveBeenCalled();
  });
  it('Play Billing sem suporte no aparelho = indisponível', async () => {
    billing.isBillingSupported.mockResolvedValue({ isBillingSupported: false });
    expect(await new ProvedorPlayNativo().disponivel()).toBe(false);
    billing.isBillingSupported.mockRejectedValue(new Error('x'));
    expect(await new ProvedorPlayNativo().disponivel()).toBe(false);
  });
});

describe('US-24.CA4 confirmação (acknowledge) da compra', () => {
  it('confirma a compra nova que ainda não foi confirmada', async () => {
    billing.purchaseProduct.mockResolvedValue({ purchaseState: '1', isAcknowledged: false, purchaseToken: 'tok1' });
    expect(await new ProvedorPlayNativo().comprar(SKU)).toBe('ok');
    expect(billing.acknowledgePurchase).toHaveBeenCalledWith({ purchaseToken: 'tok1' });
  });
  it('falha ao confirmar não tira o Pro agora (compra "ok") e é tentada de novo na próxima abertura (listarCompras)', async () => {
    billing.purchaseProduct.mockResolvedValue({ purchaseState: '1', isAcknowledged: false, purchaseToken: 'tok1' });
    billing.acknowledgePurchase.mockRejectedValueOnce(new Error('rede'));
    expect(await new ProvedorPlayNativo().comprar(SKU)).toBe('ok');
    billing.getPurchases.mockResolvedValue({ purchases: [{ productIdentifier: SKU, purchaseState: '1', isAcknowledged: false, purchaseToken: 'tok1' }] });
    expect(await new ProvedorPlayNativo().listarCompras()).toEqual([SKU]);
    expect(billing.acknowledgePurchase).toHaveBeenCalledTimes(2);
  });
  it('compra já confirmada não é confirmada de novo', async () => {
    billing.getPurchases.mockResolvedValue({ purchases: [{ productIdentifier: SKU, purchaseState: '1', isAcknowledged: true, purchaseToken: 't' }] });
    await new ProvedorPlayNativo().listarCompras();
    expect(billing.acknowledgePurchase).not.toHaveBeenCalled();
  });
});

describe('US-24.CA5 restaurar / listar compras', () => {
  it('lista só as compras com estado "comprado"; pendentes ficam de fora', async () => {
    billing.getPurchases.mockResolvedValue({
      purchases: [
        { productIdentifier: SKU, purchaseState: '2', isAcknowledged: false, purchaseToken: 'p' },
        { productIdentifier: 'outro', purchaseState: '1', isAcknowledged: true, purchaseToken: 'o' },
      ],
    });
    expect(await new ProvedorPlayNativo().listarCompras()).toEqual(['outro']);
  });
  it('loja que responde lista vazia devolve [] (revoga); falha da loja lança (mantém o Pro local)', async () => {
    billing.getPurchases.mockResolvedValue({ purchases: [] });
    expect(await new ProvedorPlayNativo().listarCompras()).toEqual([]);
    billing.getPurchases.mockRejectedValue(new Error('offline'));
    await expect(new ProvedorPlayNativo().listarCompras()).rejects.toThrow();
  });
});

describe('US-24.CA9 provedores "indisponível" (navegador de desenvolvimento) não quebram nada', () => {
  it('compra: sem disponibilidade, sem preço, compra = erro e a lista lança (nunca "vazia", que revogaria)', async () => {
    const p = new ProvedorIndisponivel();
    expect(await p.disponivel()).toBe(false);
    expect(await p.detalhes()).toBeNull();
    expect(await p.comprar()).toBe('erro');
    await expect(p.listarCompras()).rejects.toThrow();
  });
  it('anúncios: nada acontece e nada falha', async () => {
    const a = new AnunciosIndisponivel();
    expect(a.tipo).toBe('indisponivel');
    expect(await a.disponivel()).toBe(false);
    await expect(a.iniciar()).resolves.toBeUndefined();
    expect(await a.mostrarBanner()).toBe('sem-anuncio');
    await expect(a.esconderBanner()).resolves.toBeUndefined();
    expect(a.alturaBanner()).toBe(0);
    expect(await a.carregarPremiado()).toBe(false);
    expect(await a.mostrarPremiado()).toBe('sem-anuncio');
    await expect(a.consultarConsentimentoGoogle()).rejects.toThrow();
  });
});

describe('US-24.CA7 / CA8 notificações locais nativas (plugin simulado)', () => {
  it('preparar lê a permissão: granted, denied e "prompt" (ainda dá para pedir)', async () => {
    const n = new NotificadorLocal();
    for (const [estado, esperado] of [['granted', 'granted'], ['denied', 'denied'], ['prompt', 'default'], ['prompt-with-rationale', 'default']] as const) {
      notif.checkPermissions.mockResolvedValue({ display: estado });
      await n.preparar();
      expect(n.permissao()).toBe(esperado);
      expect(n.suportado()).toBe(true);
    }
  });
  it('aparelho sem suporte (o plugin lança) = não suportado e negado, sem quebrar', async () => {
    notif.checkPermissions.mockRejectedValue(new Error('indisponível'));
    const n = new NotificadorLocal();
    await n.preparar();
    expect(n.suportado()).toBe(false);
    expect(n.permissao()).toBe('denied');
  });
  it('US-24.CA7: pedir permissão atualiza o estado; negar mantém "denied"', async () => {
    const n = new NotificadorLocal();
    notif.requestPermissions.mockResolvedValue({ display: 'granted' });
    expect(await n.pedirPermissao()).toBe('granted');
    notif.requestPermissions.mockResolvedValue({ display: 'denied' });
    expect(await n.pedirPermissao()).toBe('denied');
    notif.requestPermissions.mockRejectedValue(new Error('x'));
    expect(await n.pedirPermissao()).toBe('denied');
  });
  it('US-24.CA7: notifica na hora (sem agendar), com título, corpo e ícone; nunca sem permissão', async () => {
    const n = new NotificadorLocal();
    await n.notificar('Mensalão', 'Amanhã: Netflix — R$ 44,90');
    expect(notif.schedule).not.toHaveBeenCalled(); // permissão ainda não concedida
    notif.requestPermissions.mockResolvedValue({ display: 'granted' });
    await n.pedirPermissao();
    notif.schedule.mockResolvedValue({ notifications: [] });
    await n.notificar('Mensalão', 'Amanhã: Netflix — R$ 44,90');
    const arg = notif.schedule.mock.calls[0][0].notifications[0];
    expect(arg).toMatchObject({ title: 'Mensalão', body: 'Amanhã: Netflix — R$ 44,90', smallIcon: 'ic_stat_mensalao' });
    expect(arg.schedule).toBeUndefined();
    expect(Number.isInteger(arg.id) && arg.id >= 0).toBe(true);
  });
  it('corpos diferentes geram ids diferentes (um lembrete por par assinatura/data); o mesmo corpo repete o id', async () => {
    const n = new NotificadorLocal();
    notif.requestPermissions.mockResolvedValue({ display: 'granted' });
    await n.pedirPermissao();
    notif.schedule.mockResolvedValue({ notifications: [] });
    for (const c of ['Amanhã: Netflix — R$ 44,90', 'Amanhã: Spotify — R$ 21,90', 'Amanhã: Netflix — R$ 44,90']) await n.notificar('Mensalão', c);
    const ids = notif.schedule.mock.calls.map((c) => c[0].notifications[0].id);
    expect(ids[0]).not.toBe(ids[1]);
    expect(ids[0]).toBe(ids[2]);
  });
  it('falha do plugin ao notificar não lança (o aviso dentro do app continua valendo)', async () => {
    const n = new NotificadorLocal();
    notif.requestPermissions.mockResolvedValue({ display: 'granted' });
    await n.pedirPermissao();
    notif.schedule.mockRejectedValue(new Error('x'));
    await expect(n.notificar('t', 'c')).resolves.toBeUndefined();
  });
});

describe('US-24.CA11 entrega de arquivo no app Android', () => {
  it('grava no cache do app e abre a folha de compartilhar; resultado ok', async () => {
    fs.writeFile.mockResolvedValue({ uri: 'file:///cache/x.csv' });
    share.share.mockResolvedValue({});
    expect(await new SalvadorNativo().salvar('x.csv', 'a;b', 'text/csv')).toBe('ok');
    expect(fs.writeFile).toHaveBeenCalledWith({ path: 'x.csv', data: 'a;b', directory: 'CACHE', encoding: 'utf8' });
    expect(share.share).toHaveBeenCalledWith(expect.objectContaining({ files: ['file:///cache/x.csv'] }));
  });
  it('folha fechada sem escolher destino = cancelado (não é erro, o crédito do premiado fica guardado)', async () => {
    fs.writeFile.mockResolvedValue({ uri: 'file:///x' });
    share.share.mockRejectedValue(new Error('Share canceled'));
    expect(await new SalvadorNativo().salvar('x', 'a', 'text/plain')).toBe('cancelado');
  });
  it('falha ao gravar ou ao compartilhar = erro', async () => {
    fs.writeFile.mockRejectedValue(new Error('sem espaço'));
    expect(await new SalvadorNativo().salvar('x', 'a', 'text/plain')).toBe('erro');
    fs.writeFile.mockResolvedValue({ uri: 'file:///x' });
    share.share.mockRejectedValue(new Error('falhou'));
    expect(await new SalvadorNativo().salvar('x', 'a', 'text/plain')).toBe('erro');
  });
});
