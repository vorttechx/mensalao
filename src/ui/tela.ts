// Contrato entre as telas e a moldura (barra de topo, banner, navegação, botão flutuante).
export type Aba = 'inicio' | 'assinaturas' | 'totais' | 'ajustes';

export interface Tela {
  /** Texto do h1 e do document.title. */
  titulo: string;
  /** Aba ativa da navegação inferior; sem aba = navegação oculta. */
  aba?: Aba;
  /** Mostra o botão "Voltar" na barra de topo (telas internas). */
  voltar?: () => void;
  /** Barra de topo com a marca "Mensalão" e h1 dentro do conteúdo (Início). */
  marca?: boolean;
  /** Subtítulo logo abaixo do h1 do conteúdo. */
  subtitulo?: string;
  /** Mostra o botão flutuante "Adicionar". */
  fab?: boolean;
  conteudo: Node[];
}
