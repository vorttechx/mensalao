import type { Assinatura } from '../../src/domain/tipos';

export function sub(p: Partial<Assinatura> = {}): Assinatura {
  return {
    id: 'x', nome: 'Netflix', valorCentavos: 4490, ciclo: 'mensal', proxima: '2026-10-20', diaRef: 20,
    pagamento: 'cartao', banco: '', categoria: 'Streaming de vídeo', emTeste: false, fimTeste: null,
    status: 'ativa', canceladaEm: null, catalogoId: null, historico: [], criadaEm: '2026-09-01', ...p,
  };
}
