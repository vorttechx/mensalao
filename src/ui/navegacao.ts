// Navegação por hash (funciona em subdiretório e offline) e avisos (banners) entre telas.
import type { Banner } from './componentes';

const pilha: string[] = [];
let substituindo = false;
let bannerPendente: Banner | null = null;
let bannerAtual: Banner | null = null;

/** Hash normalizado da rota atual (ex.: "#/", "#/totais"). */
export function rotaAtual(): string {
  const h = location.hash;
  return h === '' || h === '#' ? '#/' : h;
}

/** Atualiza a pilha interna a cada troca de hash. */
export function registrarTroca(): void {
  const atual = rotaAtual();
  if (substituindo) {
    substituindo = false;
    if (pilha.length === 0) pilha.push(atual);
    else pilha[pilha.length - 1] = atual;
  } else if (pilha.length >= 2 && pilha[pilha.length - 2] === atual) {
    pilha.pop();
  } else if (pilha[pilha.length - 1] !== atual) {
    pilha.push(atual);
  }
}

export function navegar(hash: string): void {
  if (rotaAtual() === hash) return;
  location.hash = hash;
}

export function substituir(hash: string): void {
  if (rotaAtual() === hash) return;
  substituindo = true;
  location.replace(hash);
}

/** "Voltar" da barra de topo: igual ao do navegador quando há histórico interno. */
export function voltar(padrao = '#/'): void {
  if (pilha.length > 1) history.back();
  else substituir(padrao);
}

/** Volta no histórico até a última rota que satisfaz o critério (ex.: a tela de origem). */
export function voltarAte(criterio: (hash: string) => boolean, padrao: string): void {
  for (let i = pilha.length - 2; i >= 0; i -= 1) {
    if (criterio(pilha[i])) {
      history.go(-(pilha.length - 1 - i));
      return;
    }
  }
  substituir(padrao);
}

/** Agenda um banner para a próxima renderização. */
export function avisar(b: Banner): void {
  bannerPendente = b;
}

/**
 * Banner a exibir na renderização atual. `trocouDeTela` limpa o banner antigo
 * (banners saem ao trocar de tela). Retorna também se é um banner novo (para focar).
 */
export function consumirBanner(trocouDeTela: boolean): { banner: Banner | null; novo: boolean } {
  if (bannerPendente) {
    bannerAtual = bannerPendente;
    bannerPendente = null;
    return { banner: bannerAtual, novo: true };
  }
  if (trocouDeTela) bannerAtual = null;
  return { banner: bannerAtual, novo: false };
}

export function fecharBanner(): void {
  bannerAtual = null;
}
