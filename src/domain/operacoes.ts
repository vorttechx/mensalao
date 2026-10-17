// Operações puras sobre o estado: criar, editar, pausar, cancelar, reativar, excluir
// e normalizar datas vencidas. Nunca alteram o objeto recebido.
import { avancarAteHoje } from './datas';
import type { DadosAssinatura } from './validacao';
import type { Assinatura, Estado } from './tipos';

export function criarAssinatura(
  dados: DadosAssinatura,
  opcoes: { id: string; hoje: string; catalogoId?: string | null },
): Assinatura {
  return {
    id: opcoes.id,
    nome: dados.nome,
    valorCentavos: dados.valorCentavos,
    ciclo: dados.ciclo,
    proxima: dados.proxima,
    diaRef: dados.diaDigitado,
    pagamento: dados.pagamento,
    banco: dados.banco,
    categoria: dados.categoria,
    emTeste: dados.emTeste,
    fimTeste: dados.emTeste ? dados.fimTeste : null,
    status: 'ativa',
    canceladaEm: null,
    catalogoId: opcoes.catalogoId ?? null,
    historico: [],
    criadaEm: opcoes.hoje,
  };
}

/**
 * Aplica a edição. Se o valor mudou, registra o valor anterior no histórico
 * com a data de hoje (US-03.CA1); se não mudou, o histórico fica igual (US-03.CA4).
 * `dataFoiAlterada` indica se o usuário mudou a data exibida no formulário (redefine o dia de referência).
 */
export function editarAssinatura(a: Assinatura, dados: DadosAssinatura, hoje: string, dataFoiAlterada: boolean): Assinatura {
  const historico =
    dados.valorCentavos !== a.valorCentavos
      ? [...a.historico, { data: hoje, deCentavos: a.valorCentavos, paraCentavos: dados.valorCentavos }]
      : a.historico;
  return {
    ...a,
    nome: dados.nome,
    valorCentavos: dados.valorCentavos,
    ciclo: dados.ciclo,
    proxima: dados.proxima,
    diaRef: dataFoiAlterada ? dados.diaDigitado : a.diaRef,
    pagamento: dados.pagamento,
    banco: dados.banco,
    categoria: dados.categoria,
    emTeste: dados.emTeste,
    fimTeste: dados.emTeste ? dados.fimTeste : null,
    historico,
  };
}

export function pausar(a: Assinatura): Assinatura {
  return { ...a, status: 'pausada' };
}

export function marcarCancelada(a: Assinatura, hoje: string): Assinatura {
  return { ...a, status: 'cancelada', canceladaEm: hoje };
}

/** Volta para "ativa" e avança a próxima cobrança se estiver no passado (US-05.CA4). */
export function reativar(a: Assinatura, hoje: string): Assinatura {
  return { ...a, status: 'ativa', canceladaEm: null, proxima: avancarAteHoje(a.proxima, a.ciclo, hoje, a.diaRef) };
}

/** Avança as datas de cobrança vencidas para o próximo ciclo (US-02.CA4, US-07.CA6). */
export function normalizarDatas(estado: Estado, hoje: string): { estado: Estado; mudou: boolean } {
  let mudou = false;
  const assinaturas = estado.assinaturas.map((a) => {
    const proxima = avancarAteHoje(a.proxima, a.ciclo, hoje, a.diaRef);
    if (proxima === a.proxima) return a;
    mudou = true;
    return { ...a, proxima };
  });
  return { estado: mudou ? { ...estado, assinaturas } : estado, mudou };
}

export function substituirAssinatura(estado: Estado, a: Assinatura): Estado {
  return { ...estado, assinaturas: estado.assinaturas.map((x) => (x.id === a.id ? a : x)) };
}

export function adicionarAssinatura(estado: Estado, a: Assinatura): Estado {
  return { ...estado, assinaturas: [...estado.assinaturas, a] };
}

/** Remove a assinatura e, com ela, o histórico de preços (US-05.CA5). */
export function excluirAssinatura(estado: Estado, id: string): Estado {
  return { ...estado, assinaturas: estado.assinaturas.filter((x) => x.id !== id) };
}

export function alterarDiasAviso(estado: Estado, dias: number): Estado {
  return { ...estado, config: { ...estado.config, diasAviso: dias } };
}
