import { describe, expect, it } from 'vitest';
import { aplicarVerificacao, estadoProAtivo, lerEstadoPro, proEfetivo, SKU_PRO, type EstadoPro } from '../../src/domain/pro';

const AGORA = '2026-10-18T10:00:00';
const PRO: EstadoPro = { pro: true, sku: SKU_PRO, verificadoEm: 'x' };
const NAO: EstadoPro = { pro: false, sku: null, verificadoEm: null };

describe('estado Pro (US-12)', () => {
  it('US-12.CA1: estado gravado é lido de volta como Pro', () => {
    expect(lerEstadoPro(JSON.stringify(estadoProAtivo(AGORA))).pro).toBe(true);
  });
  it('US-12.CA11: JSON com tipos errados, ilegível ou ausente vira grátis sem lançar erro', () => {
    for (const b of [null, '', '{', 'null', '[]', '"pro"', '{"pro":"sim","sku":"mensalao_pro"}', '{"pro":1}', '{"pro":true}', '{"pro":true,"sku":"outro"}']) {
      expect(lerEstadoPro(b).pro).toBe(false);
    }
  });
  it('US-12.CA10/CA15: provedor indisponível nunca honra o cache', () => {
    expect(proEfetivo({ disponibilidade: 'nao', confirmacao: 'pendente', cache: PRO })).toBe(false);
    expect(proEfetivo({ disponibilidade: 'nao', confirmacao: 'confirmado', cache: PRO })).toBe(false);
  });
  it('US-12.CA7: pendente ou falha da loja mantém o cache (Pro e grátis)', () => {
    for (const c of ['pendente', 'falha'] as const) {
      expect(proEfetivo({ disponibilidade: 'sim', confirmacao: c, cache: PRO })).toBe(true);
      expect(proEfetivo({ disponibilidade: 'sim', confirmacao: c, cache: NAO })).toBe(false);
    }
  });
  it('US-12.CA5/CA6: loja confirmada vale Pro; loja sem compra vale grátis mesmo com cache Pro', () => {
    expect(proEfetivo({ disponibilidade: 'sim', confirmacao: 'confirmado', cache: NAO })).toBe(true);
    expect(proEfetivo({ disponibilidade: 'sim', confirmacao: 'sem-compra', cache: PRO })).toBe(false);
  });
  it('US-12.CA5: SKU presente grava Pro', () => {
    const r = aplicarVerificacao(NAO, { ok: true, skus: [SKU_PRO] }, AGORA);
    expect(r).toMatchObject({ confirmacao: 'confirmado', revogado: false, gravar: true });
    expect(r.cache.pro).toBe(true);
  });
  it('US-12.CA6: Pro em cache e loja sem a compra revoga e avisa', () => {
    const r = aplicarVerificacao(PRO, { ok: true, skus: [] }, AGORA);
    expect(r).toMatchObject({ confirmacao: 'sem-compra', revogado: true, gravar: true });
    expect(r.cache.pro).toBe(false);
  });
  it('US-12.CA6: outro SKU não conta como Pro', () => {
    expect(aplicarVerificacao(PRO, { ok: true, skus: ['outro'] }, AGORA).revogado).toBe(true);
  });
  it('US-12.CA7: falha da loja não revoga nem grava', () => {
    const r = aplicarVerificacao(PRO, { ok: false }, AGORA);
    expect(r).toMatchObject({ confirmacao: 'falha', revogado: false, gravar: false });
    expect(r.cache).toBe(PRO);
  });
  it('US-12.CA3: grátis sem compra na loja não grava nem avisa', () => {
    expect(aplicarVerificacao(NAO, { ok: true, skus: [] }, AGORA)).toMatchObject({ revogado: false, gravar: false, confirmacao: 'sem-compra' });
  });
});
