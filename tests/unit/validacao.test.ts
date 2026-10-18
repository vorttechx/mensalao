import { describe, expect, it } from 'vitest';
import { lerDiasAviso, validarFormulario, type EntradaFormulario } from '../../src/domain/validacao';

const HOJE = '2026-09-30';
const base: EntradaFormulario = {
  nome: 'Netflix', valor: '39,90', ciclo: 'mensal', proxima: '15/10/2026', pagamento: 'cartao',
  banco: '', categoria: 'Streaming de vídeo', emTeste: false, fimTeste: '',
};

describe('validarFormulario', () => {
  it('US-01.CA4: entrada válida grava 3990 centavos', () => {
    const r = validarFormulario(base, HOJE);
    expect(r.ok && r.dados.valorCentavos).toBe(3990);
  });
  it.each(['', '0', '-1', 'abc', '10,999'])('US-01.CA5: valor "%s" gera erro no campo valor', (valor) => {
    const r = validarFormulario({ ...base, valor }, HOJE);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.valor).toBeTruthy();
  });
  it('US-01.CA6: nome vazio ou só espaços -> "Informe o nome"', () => {
    for (const nome of ['', '   ']) {
      const r = validarFormulario({ ...base, nome }, HOJE);
      expect(!r.ok && r.erros.nome).toBe('Informe o nome');
    }
  });
  it('US-01.CA7: próxima vazia ou inválida gera erro', () => {
    for (const proxima of ['', '31/02/2026']) {
      const r = validarFormulario({ ...base, proxima }, HOJE);
      expect(!r.ok && r.erros.proxima).toBeTruthy();
    }
  });
  it('US-01.CA8: data passada é avançada e sinalizada', () => {
    const r = validarFormulario({ ...base, proxima: '15/08/2026' }, HOJE);
    expect(r.ok && r.dados.proxima).toBe('2026-10-15');
    expect(r.ok && r.dataAvancada).toBe(true);
  });
  it('US-01.CA9: teste grátis sem fim gera erro; sem teste ignora fim', () => {
    const r = validarFormulario({ ...base, emTeste: true }, HOJE);
    expect(!r.ok && r.erros.fimTeste).toBeTruthy();
    const r2 = validarFormulario({ ...base, emTeste: false, fimTeste: '10/10/2026' }, HOJE);
    expect(r2.ok && r2.dados.fimTeste).toBeNull();
  });
  it('US-01.CA3: ciclo, pagamento e categoria são obrigatórios', () => {
    const r = validarFormulario({ ...base, ciclo: '', pagamento: '', categoria: '' }, HOJE);
    expect(!r.ok && Object.keys(r.erros)).toEqual(expect.arrayContaining(['ciclo', 'pagamento', 'categoria']));
  });
});

describe('lerDiasAviso', () => {
  it('US-02.CA3: aceita inteiros de 0 a 30', () => {
    expect(lerDiasAviso('0')).toBe(0);
    expect(lerDiasAviso('7')).toBe(7);
    expect(lerDiasAviso('30')).toBe(30);
  });
  it.each(['31', '-1', 'abc', '', '2,5', '1.5'])('US-02.CA3: rejeita "%s"', (t) => {
    expect(lerDiasAviso(t)).toBeNull();
  });
});
