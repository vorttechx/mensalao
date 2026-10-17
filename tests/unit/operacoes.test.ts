import { describe, expect, it } from 'vitest';
import { criarAssinatura, editarAssinatura, excluirAssinatura, marcarCancelada, normalizarDatas, pausar, reativar } from '../../src/domain/operacoes';
import { estadoVazio } from '../../src/domain/tipos';
import { validarFormulario, type EntradaFormulario } from '../../src/domain/validacao';
import { sub } from './fixtures';

const HOJE = '2026-09-30';
const entrada: EntradaFormulario = {
  nome: 'Netflix', valor: '39,90', ciclo: 'mensal', proxima: '15/10/2026', pagamento: 'cartao',
  banco: '', categoria: 'Streaming de vídeo', emTeste: false, fimTeste: '',
};
function dados(p: Partial<EntradaFormulario> = {}) {
  const r = validarFormulario({ ...entrada, ...p }, HOJE);
  if (!r.ok) throw new Error('inválido');
  return r.dados;
}

describe('operações', () => {
  it('US-01.CA4: cria com 3990 centavos, ativa e sem histórico', () => {
    const a = criarAssinatura(dados(), { id: 'a', hoje: HOJE });
    expect(a.valorCentavos).toBe(3990);
    expect(a.status).toBe('ativa');
    expect(a.historico).toEqual([]);
  });
  it('US-03.CA1: editar o valor registra o anterior no histórico com a data', () => {
    const a = criarAssinatura(dados(), { id: 'a', hoje: HOJE });
    const b = editarAssinatura(a, dados({ valor: '44,90' }), '2026-10-01', false);
    expect(b.historico).toEqual([{ data: '2026-10-01', deCentavos: 3990, paraCentavos: 4490 }]);
  });
  it('US-03.CA4: editar outro campo não mexe no histórico', () => {
    const a = criarAssinatura(dados(), { id: 'a', hoje: HOJE });
    const b = editarAssinatura(a, dados({ nome: 'Outro' }), HOJE, false);
    expect(b.historico).toHaveLength(0);
  });
  it('US-03.CA5: vários reajustes ficam em ordem cronológica', () => {
    let a = criarAssinatura(dados({ valor: '29,90' }), { id: 'a', hoje: HOJE });
    a = editarAssinatura(a, dados({ valor: '34,90' }), '2026-10-01', false);
    a = editarAssinatura(a, dados({ valor: '39,90' }), '2026-11-01', false);
    expect(a.historico.map((m) => [m.deCentavos, m.paraCentavos])).toEqual([[2990, 3490], [3490, 3990]]);
  });
  it('US-05.CA2/CA3: pausar e cancelar mudam o status; cancelar guarda a data', () => {
    expect(pausar(sub()).status).toBe('pausada');
    const c = marcarCancelada(sub(), HOJE);
    expect(c.status).toBe('cancelada');
    expect(c.canceladaEm).toBe(HOJE);
  });
  it('US-05.CA4: reativar avança data passada', () => {
    const r = reativar(sub({ status: 'pausada', proxima: '2026-08-20', diaRef: 20 }), HOJE);
    expect(r.status).toBe('ativa');
    expect(r.proxima).toBe('2026-10-20');
  });
  it('US-05.CA5/CA6: excluir remove a assinatura (e o histórico junto)', () => {
    const e = { ...estadoVazio(), assinaturas: [sub({ historico: [{ data: HOJE, deCentavos: 1, paraCentavos: 2 }] })] };
    expect(excluirAssinatura(e, 'x').assinaturas).toEqual([]);
  });
  it('US-02.CA4: normalizarDatas avança vencidas e sinaliza mudança', () => {
    const e = { ...estadoVazio(), assinaturas: [sub({ proxima: '2026-08-20' })] };
    const r = normalizarDatas(e, HOJE);
    expect(r.mudou).toBe(true);
    expect(r.estado.assinaturas[0].proxima).toBe('2026-10-20');
    expect(normalizarDatas(r.estado, HOJE).mudou).toBe(false);
  });
});
