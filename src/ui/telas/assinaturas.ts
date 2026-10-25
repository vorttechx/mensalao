// US-05 / US-21 — Assinaturas: lista geral com pausadas e seção recolhível de canceladas (design 4.2).
import { formatarDataBR } from '../../domain/datas';
import { rotuloPagamento, sufixoCiclo, type Assinatura } from '../../domain/tipos';
import { obterEstado } from '../../loja';
import { botao, estadoVazio, selo } from '../componentes';
import { h } from '../dom';
import { icone } from '../icones';
import { adicionar, contadorLimite } from '../limite';
import type { Tela } from '../tela';
import { itemAssinatura, selosReajuste } from './comum';

function porNome(a: Assinatura, b: Assinatura): number {
  return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
}

function contar(n: number, singular: string, plural: string): string | null {
  return n === 0 ? null : `${n} ${n === 1 ? singular : plural}`;
}

function item(a: Assinatura): HTMLElement {
  const selos: HTMLElement[] = [];
  if (a.status === 'pausada') selos.push(selo('neutro', 'Pausada', 'badge-pausada'));
  if (a.status === 'cancelada') selos.push(selo('cancelada', a.canceladaEm ? `Cancelada em ${formatarDataBR(a.canceladaEm)}` : 'Cancelada', 'badge-cancelada'));
  selos.push(...selosReajuste(a));
  return itemAssinatura(a, {
    testid: 'sub-item',
    valorCentavos: a.valorCentavos,
    sufixo: sufixoCiclo(a.ciclo),
    meta: `${a.categoria} · ${rotuloPagamento(a.pagamento)}`,
    selos,
    apagado: a.status !== 'ativa',
  });
}

export function telaAssinaturas(): Tela {
  const todas = obterEstado().assinaturas.slice().sort(porNome);
  if (todas.length === 0) {
    return {
      titulo: 'Assinaturas',
      aba: 'assinaturas',
      conteudo: [
        contadorLimite(),
        estadoVazio({
          testid: 'empty-state-assinaturas',
          textos: ['Você ainda não cadastrou assinaturas.'],
          botao: botao('Adicionar assinatura', 'primario', adicionar, { testid: 'btn-adicionar-vazio' }),
        }),
      ],
    };
  }
  const principais = todas.filter((a) => a.status !== 'cancelada');
  const canceladas = todas.filter((a) => a.status === 'cancelada');
  const ativas = principais.filter((a) => a.status === 'ativa').length;
  const resumo = [contar(ativas, 'ativa', 'ativas'), contar(principais.length - ativas, 'pausada', 'pausadas')].filter(Boolean).join(' · ');

  return {
    titulo: 'Assinaturas',
    aba: 'assinaturas',
    adicionar: true,
    subtitulo: resumo || 'Nenhuma assinatura ativa',
    conteudo: [
      principais.length ? h('ul', { class: 'lista lista-respiro', testid: 'sub-list', 'aria-label': 'Assinaturas ativas e pausadas' }, principais.map(item)) : null,
      contadorLimite(),
      canceladas.length
        ? h(
            'details',
            { class: 'canceladas', testid: 'filtro-canceladas' },
            h('summary', {}, h('span', {}, `Canceladas (${canceladas.length})`), icone('chevron-baixo', 'ic seta')),
            h('ul', { class: 'lista', testid: 'canceladas-list', 'aria-label': 'Canceladas' }, canceladas.map(item)),
          )
        : null,
    ],
  };
}
