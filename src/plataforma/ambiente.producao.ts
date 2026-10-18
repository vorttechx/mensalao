// Ambiente de PRODUÇÃO (alias "@ambiente" no vite.config.ts). Não importa nada de teste:
// Google Play dentro da TWA; fora dela, compra indisponível. Nenhum controle para ativar o Pro.
import { ProvedorIndisponivel } from './indisponivel';
import { NotificadorNavegador } from './notificador';
import { ProvedorPlay, playSuportado } from './play';
import type { Notificador, ProvedorCompra } from './provedor';

export const MODO_BUILD = 'producao' as const;

export function criarProvedor(): ProvedorCompra {
  return playSuportado() ? new ProvedorPlay() : new ProvedorIndisponivel();
}

export function criarNotificador(): Notificador {
  return new NotificadorNavegador();
}

/** Em produção não há controles de teste. */
export function instalarControlesTeste(): void {
  // vazio de propósito
}
