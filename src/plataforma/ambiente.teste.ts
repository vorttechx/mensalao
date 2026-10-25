// Ambiente de TESTE (só no build `npm run build:teste`, VITE_MODO=teste). O provedor é sempre o falso
// (US-12.CA16) e os testes E2E o controlam por localStorage ou por window.__mensalaoTeste.
import { CONTROLE_PADRAO, ID_PROVEDOR_FALSO, ProvedorFalso, configurarControle, lerChamadas, lerControle, type ControleProvedorFalso } from './falso';
import {
  CONTROLE_NOTIFICACAO_PADRAO,
  NotificadorFalso,
  configurarNotificacao,
  lerControleNotificacao,
  notificacoesEnviadas,
  type ControleNotificacao,
} from './notificador-falso';
import { SalvadorNavegador } from './arquivos';
import type { Notificador, ProvedorCompra, SalvadorArquivos } from './provedor';

export const MODO_BUILD = 'teste' as const;

export function criarProvedor(): ProvedorCompra {
  return new ProvedorFalso();
}

export function criarNotificador(): Notificador {
  return new NotificadorFalso();
}

/** No build de teste os arquivos saem pelo download do navegador (o Playwright espera o evento de download). */
export function criarSalvadorArquivos(): SalvadorArquivos {
  return new SalvadorNavegador();
}

/** Sem integração nativa no navegador do teste. */
export function instalarPlataforma(): void {
  // vazio de propósito
}

export function aplicarBarrasSistema(_escuro: boolean | null): void {
  // sem barras nativas no navegador
}

export function usarServiceWorker(): boolean {
  return true;
}

/** Expõe os controles do provedor falso no console/Playwright (só existe no build de teste). */
export function instalarControlesTeste(): void {
  (window as unknown as Record<string, unknown>).__mensalaoTeste = {
    id: ID_PROVEDOR_FALSO,
    provedor: {
      padrao: CONTROLE_PADRAO,
      ler: lerControle,
      configurar: (parcial: Partial<ControleProvedorFalso>) => configurarControle(parcial),
      chamadas: lerChamadas,
    },
    notificacao: {
      padrao: CONTROLE_NOTIFICACAO_PADRAO,
      ler: lerControleNotificacao,
      configurar: (parcial: Partial<ControleNotificacao>) => configurarNotificacao(parcial),
      enviadas: notificacoesEnviadas,
    },
  };
}
