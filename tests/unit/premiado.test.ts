// US-28.CA14 — crédito do anúncio premiado (ganhar, consumir, limite de 1) e quando a oferta aparece.
import { describe, expect, it } from 'vitest';
import { ESTADO_ANUNCIOS_VAZIO, lerEstadoAnuncios, serializarEstadoAnuncios } from '../../src/domain/consentimento';
import { LIMITE_CREDITO, consumirCredito, ganharCredito, ofertaPremiado, temCredito } from '../../src/domain/premiado';

describe('US-28.CA14 crédito', () => {
  it('US-28.CA3: ganhar leva o crédito a 1; consumir volta a 0', () => {
    const g = ganharCredito(ESTADO_ANUNCIOS_VAZIO);
    expect(g.credito).toBe(1);
    expect(temCredito(g)).toBe(true);
    expect(consumirCredito(g).credito).toBe(0);
    expect(temCredito(consumirCredito(g))).toBe(false);
  });
  it('US-28.CA6: não acumula acima do limite de 1, mesmo ganhando duas vezes', () => {
    expect(LIMITE_CREDITO).toBe(1);
    expect(ganharCredito(ganharCredito(ESTADO_ANUNCIOS_VAZIO)).credito).toBe(1);
  });
  it('US-28.CA6: consumir sem crédito não fica negativo', () => {
    expect(consumirCredito(ESTADO_ANUNCIOS_VAZIO).credito).toBe(0);
    expect(consumirCredito(consumirCredito(ganharCredito(ESTADO_ANUNCIOS_VAZIO))).credito).toBe(0);
  });
  it('US-28.CA6: o crédito não expira (sobrevive a gravar e ler) e não mexe na escolha', () => {
    const e = ganharCredito({ ...ESTADO_ANUNCIOS_VAZIO, escolha: 'personalizado', versaoTexto: 1, decididoEm: '2026-10-26T12:00:00Z', aberturas: 9 });
    const volta = lerEstadoAnuncios(serializarEstadoAnuncios(e));
    expect(volta).toEqual(e);
    expect(consumirCredito(e).escolha).toBe('personalizado');
    expect(consumirCredito(e).aberturas).toBe(9);
  });
  it('as funções são puras: o estado original não muda', () => {
    const e = ESTADO_ANUNCIOS_VAZIO;
    ganharCredito(e);
    expect(e.credito).toBe(0);
  });
});

describe('US-28.CA1/CA7/CA8 ofertaPremiado', () => {
  const pronto = { tipo: 'pronto', personalizado: false } as const;
  const base = { pro: false, credito: 0, plano: 'gratis', provedorDisponivel: true, consentimento: pronto } as const;
  it('US-28.CA1: grátis confirmado, SDK presente, consentimento pronto = oferta', () => {
    expect(ofertaPremiado(base)).toBe('oferta');
  });
  it('US-28.CA7: Pro = nenhuma, mesmo com crédito guardado', () => {
    expect(ofertaPremiado({ ...base, pro: true })).toBe('nenhuma');
    expect(ofertaPremiado({ ...base, pro: true, credito: 1 })).toBe('nenhuma');
  });
  it('US-28.CA6: com crédito guardado = bloco do crédito, mesmo sem SDK nem consentimento (usar não depende de anúncio)', () => {
    expect(ofertaPremiado({ ...base, credito: 1 })).toBe('credito');
    expect(ofertaPremiado({ ...base, credito: 1, provedorDisponivel: false, consentimento: { tipo: 'aguardar' } })).toBe('credito');
  });
  it.each(['pro-cache', 'desconhecido', 'pro'] as const)('plano %s não é grátis confirmado = nenhuma', (plano) => {
    expect(ofertaPremiado({ ...base, plano })).toBe('nenhuma');
  });
  it('SDK ausente ou não verificado = nenhuma', () => {
    expect(ofertaPremiado({ ...base, provedorDisponivel: false })).toBe('nenhuma');
    expect(ofertaPremiado({ ...base, provedorDisponivel: null })).toBe('nenhuma');
  });
  it('US-28.CA8: consentimento ausente/pendente/sem base = nenhuma (o aviso vem antes)', () => {
    for (const consentimento of [{ tipo: 'perguntar' }, { tipo: 'formulario-google' }, { tipo: 'aguardar' }, { tipo: 'sem-base' }] as const) {
      expect(ofertaPremiado({ ...base, consentimento })).toBe('nenhuma');
    }
  });
});
