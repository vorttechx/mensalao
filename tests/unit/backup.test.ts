import { describe, expect, it } from 'vitest';
import { gerarBackup, lerBackup, nomeArquivoBackup } from '../../src/domain/backup';
import { estadoVazio } from '../../src/domain/tipos';
import { sub } from './fixtures';

const HOJE = '2026-09-30';
const estado = () => ({ ...estadoVazio(), assinaturas: [
  sub({ id: 'a', valorCentavos: 3999, historico: [{ data: '2026-09-01', deCentavos: 2990, paraCentavos: 3999 }] }),
  sub({ id: 'b', nome: 'Pausada', status: 'pausada' }),
  sub({ id: 'c', nome: 'Cancelada', status: 'cancelada', canceladaEm: '2026-09-10' }),
] });

describe('backup', () => {
  it('US-07.CA1: nome do arquivo e conteúdo completo', () => {
    expect(nomeArquivoBackup('2026-09-30')).toBe('mensalao-backup-2026-09-30.json');
    const b = gerarBackup(estado(), '2026-09-30T10:00:00Z');
    expect(b.assinaturas).toHaveLength(3);
    expect(b.config.diasAviso).toBe(3);
    expect(b.versao).toBe(1);
    expect(b.exportadoEm).toBeTruthy();
  });
  it('US-07.CA4: ida e volta sem perdas', () => {
    const e = estado();
    const r = lerBackup(JSON.stringify(gerarBackup(e, 'x')), HOJE);
    expect(r.ok && r.estado).toEqual(e);
  });
  it('US-07.CA5: backup vazio importa como estado vazio', () => {
    const r = lerBackup(JSON.stringify(gerarBackup(estadoVazio(), 'x')), HOJE);
    expect(r.ok && r.quantidade).toBe(0);
  });
  it('US-07.CA3: rejeita não-JSON, formato errado, versão desconhecida', () => {
    expect(lerBackup('não é json', HOJE)).toEqual({ ok: false, motivo: 'json' });
    expect(lerBackup('{"a":1}', HOJE).ok).toBe(false);
    expect(lerBackup('[]', HOJE).ok).toBe(false);
    const b = { ...gerarBackup(estado(), 'x'), versao: 99 };
    expect(lerBackup(JSON.stringify(b), HOJE)).toEqual({ ok: false, motivo: 'versao' });
  });
  it('US-07.CA3: rejeita valor negativo e data inválida', () => {
    const neg = gerarBackup(estado(), 'x');
    neg.assinaturas[0].valorCentavos = -5;
    expect(lerBackup(JSON.stringify(neg), HOJE).ok).toBe(false);
    const data = gerarBackup(estado(), 'x');
    data.assinaturas[0].proxima = '2026-02-31';
    expect(lerBackup(JSON.stringify(data), HOJE).ok).toBe(false);
  });
  it('US-07.CA6: datas passadas são avançadas na importação', () => {
    const b = gerarBackup({ ...estadoVazio(), assinaturas: [sub({ proxima: '2026-08-20' })] }, 'x');
    const r = lerBackup(JSON.stringify(b), HOJE);
    expect(r.ok && r.estado.assinaturas[0].proxima).toBe('2026-10-20');
  });
});
