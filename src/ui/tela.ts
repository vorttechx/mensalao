// Contrato entre as telas e a moldura (barra de topo, título, banner, navegação).
export type Aba = 'inicio' | 'assinaturas' | 'totais' | 'ajustes';

export interface Tela {
  /** Texto do h1 e do document.title. */
  titulo: string;
  /** Aba ativa da navegação inferior; sem aba = navegação oculta. */
  aba?: Aba;
  /** Mostra o botão "Voltar" na barra de topo (telas internas). */
  voltar?: () => void;
  /** Barra de topo com a marca "Mensalão"; o h1 vira cabeçalho de seção dentro do conteúdo (Início). */
  marca?: boolean;
  /** Subtítulo logo abaixo do h1. */
  subtitulo?: string;
  /** Mostra o "+" (Adicionar assinatura): na barra de topo (Início) ou ao lado do título grande (Assinaturas). */
  adicionar?: boolean;
  /** Papel agrupado atrás de grupos (Detalhe, Ajustes, Pro). */
  agrupado?: boolean;
  /** Conteúdo antes do h1 (Início: total, régua e avisos; recuperação: ícone de erro). */
  antesDoTitulo?: (Node | null | false | undefined)[];
  conteudo: (Node | null | false | undefined)[];
  /** Chamado depois de montar; se devolver um elemento, ele recebe o foco no lugar do título. */
  aoMontar?: () => HTMLElement | null | void;
}
