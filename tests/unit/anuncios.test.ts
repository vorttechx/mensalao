// US-25 / US-26 — decisão de exibir anúncio (função pura) e regras da faixa do banner.
import { describe, expect, it } from 'vitest';
import {
  ALTURA_BANNER_PADRAO,
  INTERVALO_NOVA_TENTATIVA_MS,
  alturaFaixa,
  anunciosPermitidos,
  faixaCabe,
  margemBanner,
  planoParaAnuncios,
  podeTentarDeNovo,
  resultadoDeErroBanner,
  type EntradaDecisao,
  type PlanoAnuncios,
  type TelaAnuncio,
} from '../../src/domain/anuncios';
import { ESTADO_PRO_VAZIO } from '../../src/domain/pro';

const base: EntradaDecisao = {
  plano: 'gratis',
  tela: 'inicio',
  primeiraAbertura: false,
  provedorDisponivel: true,
  online: true,
  cabe: true,
  consentimento: { tipo: 'pronto', personalizado: true },
};
const com = (p: Partial<EntradaDecisao>): EntradaDecisao => ({ ...base, ...p });
const proCache = { ...ESTADO_PRO_VAZIO, pro: true, sku: 'mensalao_pro' };

describe('US-26.CA12 planoParaAnuncios (regra conservadora)', () => {
  it('US-26.CA3/CA5: Pro confirmado pela loja = pro', () => {
    expect(planoParaAnuncios({ confirmacao: 'confirmado', cache: proCache })).toBe('pro');
  });
  it('US-26.CA4: a loja respondeu sem a compra = grátis, mesmo com Pro no cache (revogado)', () => {
    expect(planoParaAnuncios({ confirmacao: 'sem-compra', cache: proCache })).toBe('gratis');
    expect(planoParaAnuncios({ confirmacao: 'sem-compra', cache: ESTADO_PRO_VAZIO })).toBe('gratis');
  });
  it('US-26.CA5: Pro em cache sem resposta da loja (indisponível, erro, offline) = pro-cache, sem anúncio', () => {
    expect(planoParaAnuncios({ confirmacao: 'pendente', cache: proCache })).toBe('pro-cache');
    expect(planoParaAnuncios({ confirmacao: 'falha', cache: proCache })).toBe('pro-cache');
  });
  it('US-26.CA6/CA8: sem resposta da loja e sem Pro no cache (1ª abertura, estado ilegível) = desconhecido', () => {
    expect(planoParaAnuncios({ confirmacao: 'pendente', cache: ESTADO_PRO_VAZIO })).toBe('desconhecido');
  });
});

describe('US-26.CA12 anunciosPermitidos: plano', () => {
  it('grátis efetivo em tela com banner e consentimento pronto = mostrar', () => {
    expect(anunciosPermitidos(base)).toEqual({ tipo: 'mostrar', personalizado: true });
  });
  it.each(['pro', 'pro-cache', 'desconhecido'] as PlanoAnuncios[])('US-26.CA3/CA5/CA6: plano %s nunca mostra, nem pergunta consentimento', (plano) => {
    for (const consentimento of [
      { tipo: 'pronto', personalizado: true },
      { tipo: 'perguntar' },
      { tipo: 'formulario-google' },
    ] as const) {
      expect(anunciosPermitidos(com({ plano, consentimento }))).toEqual({ tipo: 'nao', motivo: 'plano' });
    }
  });
  it('US-27.CA9: Pro não chega ao aviso nem ao formulário do UMP', () => {
    expect(anunciosPermitidos(com({ plano: 'pro', consentimento: { tipo: 'perguntar' } })).tipo).toBe('nao');
    expect(anunciosPermitidos(com({ plano: 'pro', consentimento: { tipo: 'formulario-google' } })).tipo).toBe('nao');
  });
});

describe('US-25.CA1/CA2 anunciosPermitidos: tela', () => {
  it.each(['inicio', 'assinaturas', 'totais'] as TelaAnuncio[])('US-25.CA1: tela %s tem banner', (tela) => {
    expect(anunciosPermitidos(com({ tela })).tipo).toBe('mostrar');
  });
  it('US-25.CA2/CA18: qualquer outra tela (form, Pro, Ajustes, Detalhe...) não tem banner, nem aviso', () => {
    expect(anunciosPermitidos(com({ tela: 'outra' }))).toEqual({ tipo: 'nao', motivo: 'tela' });
    expect(anunciosPermitidos(com({ tela: 'outra', consentimento: { tipo: 'perguntar' } }))).toEqual({ tipo: 'nao', motivo: 'tela' });
  });
});

describe('US-27.CA1 / UX-S4-04 anunciosPermitidos: 1ª abertura', () => {
  it('1ª abertura: sem banner e sem aviso de consentimento', () => {
    expect(anunciosPermitidos(com({ primeiraAbertura: true }))).toEqual({ tipo: 'nao', motivo: 'primeira-abertura' });
    expect(anunciosPermitidos(com({ primeiraAbertura: true, consentimento: { tipo: 'perguntar' } }))).toEqual({ tipo: 'nao', motivo: 'primeira-abertura' });
    expect(anunciosPermitidos(com({ primeiraAbertura: true, consentimento: { tipo: 'formulario-google' } }))).toEqual({ tipo: 'nao', motivo: 'primeira-abertura' });
  });
});

describe('US-25.CA5/CA6/CA9 anunciosPermitidos: provedor, rede e espaço', () => {
  it('US-24.CA12/US-25.CA6: SDK ausente ou ainda não verificado = nada', () => {
    expect(anunciosPermitidos(com({ provedorDisponivel: false }))).toEqual({ tipo: 'nao', motivo: 'provedor' });
    expect(anunciosPermitidos(com({ provedorDisponivel: null }))).toEqual({ tipo: 'nao', motivo: 'provedor' });
  });
  it('US-25.CA5: sem rede = nada, sem aviso', () => {
    expect(anunciosPermitidos(com({ online: false }))).toEqual({ tipo: 'nao', motivo: 'offline' });
    expect(anunciosPermitidos(com({ online: false, consentimento: { tipo: 'perguntar' } }))).toEqual({ tipo: 'nao', motivo: 'offline' });
  });
  it('US-25.CA9/CA10: não cabe nos 20% = omitido', () => {
    expect(anunciosPermitidos(com({ cabe: false }))).toEqual({ tipo: 'nao', motivo: 'espaco' });
  });
});

describe('US-25.CA15 / US-27 anunciosPermitidos: consentimento', () => {
  it('US-27.CA3: escolha não personalizada pede com personalizado=false (npa)', () => {
    expect(anunciosPermitidos(com({ consentimento: { tipo: 'pronto', personalizado: false } }))).toEqual({ tipo: 'mostrar', personalizado: false });
  });
  it('US-27.CA1: sem escolha = perguntar (e nada de banner antes)', () => {
    expect(anunciosPermitidos(com({ consentimento: { tipo: 'perguntar' } }))).toEqual({ tipo: 'perguntar' });
  });
  it('US-27.CA4: UMP exigido = formulário do Google, no lugar do aviso', () => {
    expect(anunciosPermitidos(com({ consentimento: { tipo: 'formulario-google' } }))).toEqual({ tipo: 'formulario-google' });
  });
  it('US-27.CA5/CA8: UMP pendente/com erro ou sem base = nenhum anúncio', () => {
    expect(anunciosPermitidos(com({ consentimento: { tipo: 'aguardar' } }))).toEqual({ tipo: 'nao', motivo: 'consentimento' });
    expect(anunciosPermitidos(com({ consentimento: { tipo: 'sem-base' } }))).toEqual({ tipo: 'nao', motivo: 'consentimento' });
  });
});

describe('US-25.CA3/CA4/CA9/CA10 faixa do banner', () => {
  it('faixa = cabeça 28 + banner + respiro 16 (padrão 56 quando o SDK ainda não informou)', () => {
    expect(alturaFaixa(0)).toBe(28 + ALTURA_BANNER_PADRAO + 16);
    expect(alturaFaixa(50)).toBe(94);
  });
  it('US-25.CA3: margem do banner = altura das abas + 16 px (nunca menos que 16)', () => {
    expect(margemBanner(56)).toBe(72);
    expect(margemBanner(55.2)).toBe(72);
    expect(margemBanner(0)).toBe(16);
  });
  it('US-25.CA9: 360×780 com abas de 64 px cabe; 360×640 com banner de 56 px cabe (20% de 576 = 115,2 ≥ 100)', () => {
    expect(faixaCabe({ alturaJanela: 780, alturaAbas: 64, alturaBanner: 56 })).toBe(true);
    expect(faixaCabe({ alturaJanela: 640, alturaAbas: 64, alturaBanner: 56 })).toBe(true);
  });
  it('US-25.CA10: paisagem baixa (altura útil pequena) omite o banner', () => {
    expect(faixaCabe({ alturaJanela: 360, alturaAbas: 56, alturaBanner: 50 })).toBe(false);
    expect(faixaCabe({ alturaJanela: 0, alturaAbas: 0, alturaBanner: 50 })).toBe(false);
  });
  it('US-25.CA9: o limite é exatamente 20% da altura útil', () => {
    const util = 500; // 20% = 100 = faixa de banner 56
    expect(faixaCabe({ alturaJanela: util + 64, alturaAbas: 64, alturaBanner: 56 })).toBe(true);
    expect(faixaCabe({ alturaJanela: util - 1 + 64, alturaAbas: 64, alturaBanner: 56 })).toBe(false);
  });
});

describe('US-25.CA6 intervalo entre tentativas', () => {
  it('sem falha anterior pode tentar; antes de 60 s não; a partir de 60 s sim', () => {
    expect(INTERVALO_NOVA_TENTATIVA_MS).toBe(60_000);
    expect(podeTentarDeNovo(null, 1000)).toBe(true);
    expect(podeTentarDeNovo(1000, 1000 + 59_999)).toBe(false);
    expect(podeTentarDeNovo(1000, 1000 + 60_000)).toBe(true);
  });
  it('código 3 do Google = sem anúncio; os demais = erro', () => {
    expect(resultadoDeErroBanner(3)).toBe('sem-anuncio');
    expect(resultadoDeErroBanner('3')).toBe('sem-anuncio');
    expect(resultadoDeErroBanner(0)).toBe('erro');
    expect(resultadoDeErroBanner(undefined)).toBe('erro');
    expect(resultadoDeErroBanner(null)).toBe('erro');
  });
});
