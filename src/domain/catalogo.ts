// Catálogo inicial de serviços (backlog, seção 4). Valores são sugestões editáveis.
import type { Ciclo } from './tipos';

export interface ServicoCatalogo {
  id: string;
  nome: string;
  categoria: string;
  ciclo: Ciclo;
  valorCentavos: number;
  comoCancelar: string;
}

export const CATALOGO: ServicoCatalogo[] = [
  { id: 'netflix', nome: 'Netflix', categoria: 'Streaming de vídeo', ciclo: 'mensal', valorCentavos: 4490, comoCancelar: 'No site ou app: Conta > Assinatura > Cancelar assinatura.' },
  { id: 'spotify', nome: 'Spotify', categoria: 'Música', ciclo: 'mensal', valorCentavos: 2190, comoCancelar: 'Pelo navegador: Conta > Seu plano > Mudar plano > Cancelar Premium.' },
  { id: 'amazon-prime', nome: 'Amazon Prime', categoria: 'Streaming / Compras', ciclo: 'anual', valorCentavos: 16680, comoCancelar: 'No site da Amazon: Sua conta > Assinatura Prime > Encerrar assinatura.' },
  { id: 'disney-plus', nome: 'Disney+', categoria: 'Streaming de vídeo', ciclo: 'mensal', valorCentavos: 4390, comoCancelar: 'No site ou app: Perfil > Conta > Assinatura > Cancelar assinatura.' },
  { id: 'max', nome: 'Max (HBO)', categoria: 'Streaming de vídeo', ciclo: 'mensal', valorCentavos: 3990, comoCancelar: 'No site: Perfil > Assinatura > Gerenciar assinatura > Cancelar.' },
  { id: 'globoplay', nome: 'Globoplay', categoria: 'Streaming de vídeo', ciclo: 'mensal', valorCentavos: 2990, comoCancelar: 'No site: Minha conta > Assinaturas > Cancelar assinatura.' },
  { id: 'youtube-premium', nome: 'YouTube Premium', categoria: 'Streaming de vídeo / Música', ciclo: 'mensal', valorCentavos: 2690, comoCancelar: 'No app ou site: Perfil > Compras e assinaturas > Premium > Desativar.' },
  { id: 'apple', nome: 'Apple (iCloud+ / Apple One)', categoria: 'Armazenamento em nuvem', ciclo: 'mensal', valorCentavos: 590, comoCancelar: 'No iPhone: Ajustes > [seu nome] > Assinaturas > escolher > Cancelar.' },
  { id: 'google-one', nome: 'Google One', categoria: 'Armazenamento em nuvem', ciclo: 'mensal', valorCentavos: 999, comoCancelar: 'No app Google One: Configurações > Gerenciar assinatura > Cancelar.' },
  { id: 'deezer', nome: 'Deezer', categoria: 'Música', ciclo: 'mensal', valorCentavos: 2290, comoCancelar: 'Pelo navegador: Minha conta > Minhas assinaturas > Cancelar.' },
  { id: 'paramount-plus', nome: 'Paramount+', categoria: 'Streaming de vídeo', ciclo: 'mensal', valorCentavos: 2790, comoCancelar: 'No site: Conta > Assinatura > Cancelar assinatura.' },
  { id: 'ifood-clube', nome: 'iFood Clube', categoria: 'Delivery', ciclo: 'mensal', valorCentavos: 1290, comoCancelar: 'No app: Perfil > Clube iFood > Gerenciar > Cancelar assinatura.' },
  { id: 'meli-plus', nome: 'Mercado Livre (Meli+)', categoria: 'Compras', ciclo: 'mensal', valorCentavos: 1990, comoCancelar: 'No app: Você > Meli+ > Gerenciar assinatura > Cancelar.' },
  { id: 'academia', nome: 'Academia', categoria: 'Saúde e bem-estar', ciclo: 'mensal', valorCentavos: 9990, comoCancelar: 'Verifique o contrato: em geral pelo app da rede ou na recepção; peça comprovante do cancelamento.' },
  { id: 'internet', nome: 'Internet residencial', categoria: 'Casa e serviços', ciclo: 'mensal', valorCentavos: 9990, comoCancelar: 'Pelo app ou central da operadora (área do cliente > Cancelamento); anote o protocolo.' },
  { id: 'celular', nome: 'Plano de celular', categoria: 'Telefonia', ciclo: 'mensal', valorCentavos: 4990, comoCancelar: 'Pelo app ou central da operadora; anote o número do protocolo.' },
  { id: 'microsoft-365', nome: 'Microsoft 365', categoria: 'Software / Produtividade', ciclo: 'anual', valorCentavos: 44900, comoCancelar: 'Na conta Microsoft: Serviços e assinaturas > Gerenciar > Cancelar assinatura.' },
  { id: 'chatgpt-plus', nome: 'ChatGPT Plus', categoria: 'Software / Produtividade', ciclo: 'mensal', valorCentavos: 11000, comoCancelar: 'No app ou site: Configurações > Conta/Assinatura > Gerenciar > Cancelar plano.' },
];

/**
 * Monogramas dos serviços do catálogo (sprint 3, design 3.5): iniciais e cor que lembra a do serviço,
 * escurecida até passar 4,5:1 com o texto. Serviços genéricos usam tons da paleta neutra.
 */
export const MONOGRAMAS_CATALOGO: Record<string, { iniciais: string; fundo: string; texto: string }> = {
  netflix: { iniciais: 'N', fundo: '#B1060F', texto: '#FFFFFF' },
  spotify: { iniciais: 'Sp', fundo: '#147A3D', texto: '#FFFFFF' },
  'amazon-prime': { iniciais: 'Pr', fundo: '#146EB4', texto: '#FFFFFF' },
  'disney-plus': { iniciais: 'D+', fundo: '#113CCF', texto: '#FFFFFF' },
  max: { iniciais: 'M', fundo: '#1A3BD6', texto: '#FFFFFF' },
  globoplay: { iniciais: 'G', fundo: '#C8193C', texto: '#FFFFFF' },
  'youtube-premium': { iniciais: 'YT', fundo: '#C4120C', texto: '#FFFFFF' },
  apple: { iniciais: 'A', fundo: '#3A3A3C', texto: '#FFFFFF' },
  'google-one': { iniciais: 'G1', fundo: '#1967D2', texto: '#FFFFFF' },
  deezer: { iniciais: 'Dz', fundo: '#7B2CBF', texto: '#FFFFFF' },
  'paramount-plus': { iniciais: 'P+', fundo: '#0057D9', texto: '#FFFFFF' },
  'ifood-clube': { iniciais: 'iF', fundo: '#C8102E', texto: '#FFFFFF' },
  'meli-plus': { iniciais: 'ML', fundo: '#FFE600', texto: '#2D3277' },
  academia: { iniciais: 'Ac', fundo: '#5B6670', texto: '#FFFFFF' },
  internet: { iniciais: 'In', fundo: '#4D6878', texto: '#FFFFFF' },
  celular: { iniciais: 'Ce', fundo: '#5E5A7A', texto: '#FFFFFF' },
  'microsoft-365': { iniciais: 'MS', fundo: '#C43E00', texto: '#FFFFFF' },
  'chatgpt-plus': { iniciais: 'Ch', fundo: '#0B7A5E', texto: '#FFFFFF' },
};

/** Remove acentos e passa para minúsculas, para busca tolerante. */
export function normalizarBusca(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Serviços cujo nome contém o termo (sem diferenciar maiúsculas/acentos), em ordem alfabética. */
export function buscarCatalogo(termo: string, catalogo: ServicoCatalogo[] = CATALOGO): ServicoCatalogo[] {
  const t = normalizarBusca(termo);
  return catalogo
    .filter((s) => t === '' || normalizarBusca(s.nome).includes(t))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
}

export function servicoPorId(id: string | null | undefined, catalogo: ServicoCatalogo[] = CATALOGO): ServicoCatalogo | undefined {
  return id ? catalogo.find((s) => s.id === id) : undefined;
}
