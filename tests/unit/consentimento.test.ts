// US-27.CA16 — estados e transições do consentimento (módulo puro).
import { describe, expect, it } from 'vitest';
import {
  CHAVE_ANUNCIOS,
  ESTADO_ANUNCIOS_VAZIO,
  VERSAO_TEXTO_CONSENTIMENTO,
  ehPrimeiraAbertura,
  escolhaVigente,
  lerEstadoAnuncios,
  registrarAbertura,
  registrarEscolha,
  resolverConsentimento,
  serializarEstadoAnuncios,
  varianteAjustes,
  type SituacaoUmp,
} from '../../src/domain/consentimento';

const ok = (exigido: boolean, respondido: boolean, podeAnunciar: boolean): SituacaoUmp => ({ tipo: 'ok', resposta: { exigido, respondido, podeAnunciar } });
const ISO = '2026-10-26T12:00:00.000Z';

describe('US-27.CA16 resolverConsentimento', () => {
  it('US-27.CA1/CA5: UMP não exigido (Brasil) sem escolha = perguntar com o aviso do app', () => {
    expect(resolverConsentimento({ escolha: null, google: ok(false, false, true) })).toEqual({ tipo: 'perguntar' });
  });
  it('US-27.CA3: UMP não exigido com escolha = pronto no modo escolhido', () => {
    expect(resolverConsentimento({ escolha: 'personalizado', google: ok(false, false, true) })).toEqual({ tipo: 'pronto', personalizado: true });
    expect(resolverConsentimento({ escolha: 'nao-personalizado', google: ok(false, false, true) })).toEqual({ tipo: 'pronto', personalizado: false });
  });
  it('US-27.CA4: UMP exigido e não respondido = formulário do Google, mesmo com escolha do app antiga', () => {
    expect(resolverConsentimento({ escolha: null, google: ok(true, false, false) })).toEqual({ tipo: 'formulario-google' });
    expect(resolverConsentimento({ escolha: 'personalizado', google: ok(true, false, false) })).toEqual({ tipo: 'formulario-google' });
  });
  it('US-27.CA4/CA8: UMP exigido e respondido: com base = pronto; sem base = sem-base (nenhum anúncio)', () => {
    expect(resolverConsentimento({ escolha: null, google: ok(true, true, true) }).tipo).toBe('pronto');
    expect(resolverConsentimento({ escolha: null, google: ok(true, true, false) })).toEqual({ tipo: 'sem-base' });
  });
  it('US-27.CA5: UMP pendente ou com erro = aguardar, qualquer que seja a escolha', () => {
    for (const escolha of [null, 'personalizado', 'nao-personalizado'] as const) {
      expect(resolverConsentimento({ escolha, google: { tipo: 'pendente' } })).toEqual({ tipo: 'aguardar' });
      expect(resolverConsentimento({ escolha, google: { tipo: 'erro' } })).toEqual({ tipo: 'aguardar' });
    }
  });
});

describe('US-27.CA10/CA11 escolha vigente e versão do texto', () => {
  it('escolha com a versão atual vale', () => {
    const e = registrarEscolha(ESTADO_ANUNCIOS_VAZIO, 'nao-personalizado', ISO);
    expect(escolhaVigente(e)).toBe('nao-personalizado');
    expect(e.versaoTexto).toBe(VERSAO_TEXTO_CONSENTIMENTO);
    expect(e.decididoEm).toBe(ISO);
  });
  it('US-27.CA11: texto novo (versão maior) = pergunta de novo, uma vez; ao escolher, vale outra vez', () => {
    const velho = registrarEscolha(ESTADO_ANUNCIOS_VAZIO, 'personalizado', ISO, 1);
    expect(escolhaVigente(velho, 2)).toBeNull();
    expect(escolhaVigente(registrarEscolha(velho, 'personalizado', ISO, 2), 2)).toBe('personalizado');
  });
  it('US-27.CA10: a escolha continua guardada (para a revogação do Pro) e sem escolha = null', () => {
    expect(escolhaVigente(ESTADO_ANUNCIOS_VAZIO)).toBeNull();
    const e = registrarEscolha(ESTADO_ANUNCIOS_VAZIO, 'nao-personalizado', ISO);
    expect(lerEstadoAnuncios(serializarEstadoAnuncios(e)).escolha).toBe('nao-personalizado');
  });
  it('registrar a escolha não mexe em aberturas nem no crédito do premiado', () => {
    const e = registrarEscolha({ ...ESTADO_ANUNCIOS_VAZIO, aberturas: 4, credito: 1 }, 'personalizado', ISO);
    expect(e.aberturas).toBe(4);
    expect(e.credito).toBe(1);
  });
});

describe('US-27.CA12 leitura do estado guardado (campo a campo)', () => {
  const ruins: [string, string | null][] = [
    ['ausente', null],
    ['texto que não é JSON', '{{{'],
    ['array', '[]'],
    ['número', '5'],
    ['null', 'null'],
  ];
  it.each(ruins)('%s = estado vazio, sem lançar', (_n, bruto) => {
    expect(lerEstadoAnuncios(bruto)).toEqual(ESTADO_ANUNCIOS_VAZIO);
  });
  it('escolha com tipo errado, data inválida ou versão errada = sem escolha, mantendo aberturas e crédito', () => {
    const ok = { escolha: 'personalizado', versaoTexto: 1, decididoEm: ISO, aberturas: 3, credito: 1 };
    expect(lerEstadoAnuncios(JSON.stringify(ok)).escolha).toBe('personalizado');
    for (const ruim of [{ escolha: 'sim' }, { escolha: 1 }, { versaoTexto: '1' }, { versaoTexto: 0 }, { decididoEm: 'ontem' }, { decididoEm: 5 }]) {
      const e = lerEstadoAnuncios(JSON.stringify({ ...ok, ...ruim }));
      expect(e.escolha).toBeNull();
      expect(e.aberturas).toBe(3);
      expect(e.credito).toBe(1);
    }
  });
  it('aberturas e crédito ilegíveis viram 0 sem apagar a escolha; crédito acima de 1 não vale', () => {
    const base = { escolha: 'nao-personalizado', versaoTexto: 1, decididoEm: ISO };
    for (const ruim of [{ aberturas: -1 }, { aberturas: 1.5 }, { aberturas: '2' }, { aberturas: 1e9 }]) {
      const e = lerEstadoAnuncios(JSON.stringify({ ...base, ...ruim, credito: 0 }));
      expect(e.aberturas).toBe(0);
      expect(e.escolha).toBe('nao-personalizado');
    }
    expect(lerEstadoAnuncios(JSON.stringify({ ...base, aberturas: 2, credito: 2 })).credito).toBe(0);
    expect(lerEstadoAnuncios(JSON.stringify({ ...base, aberturas: 2, credito: -1 })).credito).toBe(0);
    expect(lerEstadoAnuncios(JSON.stringify({ ...base, aberturas: 2, credito: '1' })).credito).toBe(0);
  });
  it('a chave é separada do estado das assinaturas e do backup (US-27.CA13)', () => {
    expect(CHAVE_ANUNCIOS).toBe('mensalao:anuncios:v1');
    expect(CHAVE_ANUNCIOS).not.toBe('mensalao:v1');
  });
});

describe('UX-S4-04 aberturas', () => {
  it('1ª abertura = aberturas ≤ 1; a partir da 2ª já não é', () => {
    const a1 = registrarAbertura(ESTADO_ANUNCIOS_VAZIO);
    expect(a1.aberturas).toBe(1);
    expect(ehPrimeiraAbertura(a1)).toBe(true);
    expect(ehPrimeiraAbertura(registrarAbertura(a1))).toBe(false);
  });
});

describe('US-27.CA6 / US-26.CA11 variante de Ajustes > Anúncios e privacidade', () => {
  it('Pro = variante pro, qualquer coisa que o resto diga', () => {
    expect(varianteAjustes({ pro: true, escolha: 'personalizado', google: ok(true, false, false) })).toBe('pro');
  });
  it('grátis: google quando o UMP é exigido; senão com-escolha/sem-escolha', () => {
    expect(varianteAjustes({ pro: false, escolha: null, google: ok(true, false, false) })).toBe('google');
    expect(varianteAjustes({ pro: false, escolha: 'personalizado', google: ok(false, false, true) })).toBe('com-escolha');
    expect(varianteAjustes({ pro: false, escolha: null, google: ok(false, false, true) })).toBe('sem-escolha');
    expect(varianteAjustes({ pro: false, escolha: null, google: { tipo: 'pendente' } })).toBe('sem-escolha');
  });
});
