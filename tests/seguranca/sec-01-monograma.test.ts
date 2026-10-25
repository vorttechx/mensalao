// SEC-01 — catalogoId igual a chave herdada do protótipo não pode gerar monograma vazio.
import { describe, expect, it } from 'vitest';
import { MONOGRAMAS_CATALOGO } from '../../src/domain/catalogo';
import { PALETA_NEUTRA, iniciaisDe, monograma } from '../../src/domain/monograma';

describe('SEC-01: monograma com catalogoId de protótipo', () => {
  const chaves = ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf', '__defineGetter__'];

  it.each(chaves)('catalogoId "%s" cai nas iniciais e na cor neutra', (id) => {
    const m = monograma('Meu Serviço', id);
    expect(m.iniciais).toBe(iniciaisDe('Meu Serviço'));
    expect(m.iniciais).toBe('MS');
    expect(PALETA_NEUTRA).toContain(m.fundo);
    expect(m.texto).toBe('#FFFFFF');
    expect(typeof m.fundo).toBe('string');
  });

  it('catalogoId de protótipo não esconde o serviço do catálogo pelo nome', () => {
    const [id, esperado] = Object.entries(MONOGRAMAS_CATALOGO)[0];
    expect(monograma('qualquer', id)).toEqual(esperado);
    // Nome igual a uma chave do protótipo também não quebra.
    const m = monograma('constructor', '__proto__');
    expect(m.iniciais).toBe('Co');
    expect(PALETA_NEUTRA).toContain(m.fundo);
  });
});
