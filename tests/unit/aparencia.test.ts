// US-19.CA7 a CA10 — Aparência (Automático/Claro/Escuro) no Pro: preferencias.ts e TEMAS_INFO (theme-color).
import { describe, expect, it } from 'vitest';
import {
  APARENCIA_PADRAO,
  APARENCIAS,
  aparenciaEfetiva,
  coresNavegador,
  ehAparencia,
  lerPreferencias,
  preferenciasPadrao,
} from '../../src/domain/preferencias';
import { TEMAS_INFO } from '../../src/ui/temas';

describe('US-19.CA7 campo aparencia em mensalao:prefs:v1', () => {
  it('US-19.CA7: valores auto, claro e escuro; padrão auto', () => {
    expect(APARENCIAS).toEqual(['auto', 'claro', 'escuro']);
    expect(APARENCIA_PADRAO).toBe('auto');
    expect(preferenciasPadrao().aparencia).toBe('auto');
  });
  it('US-19.CA7: escolha gravada é lida de volta', () => {
    for (const a of APARENCIAS) expect(lerPreferencias(JSON.stringify({ aparencia: a })).aparencia).toBe(a);
  });
  it('US-19.CA7: ausente ou inválido = auto, sem afetar os outros campos', () => {
    for (const v of [undefined, null, '', 'Claro', 'dark', 'ESCURO', 1, true, {}, []]) {
      const p = lerPreferencias(JSON.stringify({ tema: 'grafite', aparencia: v }));
      expect(p.aparencia).toBe('auto');
      expect(p.tema).toBe('grafite');
    }
    for (const b of [null, '{', '[]', '"escuro"']) expect(lerPreferencias(b).aparencia).toBe('auto');
    expect(ehAparencia('claro')).toBe(true);
    expect(ehAparencia('light')).toBe(false);
  });
  it('US-19.CA5: preferências da sprint 2 (sem aparencia) mantêm o tema e ficam em auto', () => {
    const p = lerPreferencias(JSON.stringify({ tema: 'ameixa', lembrete: { ativo: true, dias: 2 }, backup: { ativo: false } }));
    expect(p).toMatchObject({ tema: 'ameixa', aparencia: 'auto', lembrete: { ativo: true, dias: 2 }, backup: { ativo: false } });
  });
});

describe('US-19.CA8 / CA9 aparência efetiva', () => {
  it('US-19.CA7: no Pro vale a escolha', () => {
    for (const a of APARENCIAS) expect(aparenciaEfetiva({ ...preferenciasPadrao(), aparencia: a }, true)).toBe(a);
  });
  it('US-19.CA8 / CA9: sem Pro (grátis ou revogado) é sempre auto, sem apagar a escolha', () => {
    const p = lerPreferencias(JSON.stringify({ aparencia: 'escuro' }));
    expect(aparenciaEfetiva(p, false)).toBe('auto');
    expect(p.aparencia).toBe('escuro');
    expect(aparenciaEfetiva(p, true)).toBe('escuro');
  });
});

describe('US-19.CA10 theme-color com aparência forçada', () => {
  it('US-19.CA10: automático mantém o par claro/escuro; claro e escuro põem a mesma cor nas duas metas', () => {
    expect(coresNavegador(['#FFFFFF', '#0F1512'], 'auto')).toEqual(['#FFFFFF', '#0F1512']);
    expect(coresNavegador(['#FFFFFF', '#0F1512'], 'claro')).toEqual(['#FFFFFF', '#FFFFFF']);
    expect(coresNavegador(['#FFFFFF', '#0F1512'], 'escuro')).toEqual(['#0F1512', '#0F1512']);
  });
  it('design 2.3 / UX-S3-09: theme-color de cada tema é o papel (claro #FFFFFF, escuro do tema)', () => {
    expect(Object.fromEntries(TEMAS_INFO.map((t) => [t.id, t.corNavegador]))).toEqual({
      'verde-cedula': ['#FFFFFF', '#0F1512'],
      'azul-noite': ['#FFFFFF', '#0E1320'],
      grafite: ['#FFFFFF', '#121212'],
      ameixa: ['#FFFFFF', '#160F14'],
    });
  });
  it('design 3.10: prévia dos temas usa [papel, marca] claros e escuros', () => {
    expect(TEMAS_INFO.map((t) => [t.claro, t.escuro])).toEqual([
      [['#FFFFFF', '#1D5C3F'], ['#0F1512', '#7FCBA2']],
      [['#FFFFFF', '#1F4E8C'], ['#0E1320', '#8FB4F0']],
      [['#FFFFFF', '#2F3B47'], ['#121212', '#C5CFD9']],
      [['#FFFFFF', '#7A2E62'], ['#160F14', '#EBA6D4']],
    ]);
  });
});
