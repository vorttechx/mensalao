import { describe, expect, it } from 'vitest';
import { ehTema, lerPreferencias, preferenciasPadrao, temaEfetivo, TEMAS } from '../../src/domain/preferencias';

describe('preferências e temas (US-17, US-13, US-12.CA13)', () => {
  it('US-17.CA2: existem verde-cédula e 3 temas extras', () => {
    expect(TEMAS).toEqual(['verde-cedula', 'azul-noite', 'grafite', 'ameixa']);
  });
  it('US-17.CA3: tema salvo é lido de volta', () => {
    expect(lerPreferencias(JSON.stringify({ tema: 'grafite' })).tema).toBe('grafite');
  });
  it('US-17.CA7: tema desconhecido, corrompido ou JSON inválido usa o padrão sem travar', () => {
    for (const b of [null, '{', '[]', '{"tema":"neon"}', '{"tema":3}', '{"tema":null}']) {
      expect(lerPreferencias(b).tema).toBe('verde-cedula');
    }
    expect(ehTema('neon')).toBe(false);
    expect(ehTema('ameixa')).toBe(true);
  });
  it('US-12.CA13/US-17.CA6: sem Pro o tema efetivo é o padrão, mas a preferência é mantida', () => {
    const p = lerPreferencias(JSON.stringify({ tema: 'azul-noite' }));
    expect(temaEfetivo(p, false)).toBe('verde-cedula');
    expect(p.tema).toBe('azul-noite');
    expect(temaEfetivo(p, true)).toBe('azul-noite');
  });
  it('US-13.CA2: padrões (lembrete desligado, 1 dia; backup ligado)', () => {
    const p = preferenciasPadrao();
    expect(p.lembrete).toEqual({ ativo: false, dias: 1 });
    expect(p.backup.ativo).toBe(true);
  });
  it('US-13.CA2: dias fora da faixa ou não inteiros mantêm o padrão', () => {
    for (const d of [-1, 8, 1.5, '3', null]) {
      expect(lerPreferencias(JSON.stringify({ lembrete: { ativo: true, dias: d } })).lembrete.dias).toBe(1);
    }
    expect(lerPreferencias(JSON.stringify({ lembrete: { ativo: true, dias: 0 } })).lembrete).toEqual({ ativo: true, dias: 0 });
    expect(lerPreferencias(JSON.stringify({ lembrete: { dias: 7 } })).lembrete.dias).toBe(7);
  });
  it('US-14: datas de backup inválidas viram null', () => {
    const p = lerPreferencias(JSON.stringify({ backup: { ativo: false, ultimaExportacao: 'ontem', adiadoAte: '2026-10-25', inicioPro: 5 } }));
    expect(p.backup).toEqual({ ativo: false, ultimaExportacao: null, adiadoAte: '2026-10-25', inicioPro: null });
  });
  it('US-13: lembretesAvisados descarta itens que não são texto', () => {
    expect(lerPreferencias(JSON.stringify({ lembretesAvisados: ['c|a|2026-10-01', 3, null] })).lembretesAvisados).toEqual(['c|a|2026-10-01']);
  });
});
