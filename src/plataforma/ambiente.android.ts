// Ambiente de PRODUÇÃO (alias "@ambiente" no vite.config.ts): o build que vai dentro do app Android (Capacitor).
// Não importa nada de teste. No app: Google Play Billing, notificações locais e arquivos nativos.
// Fora do app (npm run dev no navegador), os plugins nativos não existem e tudo cai no "indisponível"
// (US-24.CA9): compra indisponível e notificação do navegador, sem quebrar. Nenhum controle para ativar o Pro.
import { AnunciosAdMob } from './anuncios-admob';
import { AnunciosIndisponivel } from './anuncios-indisponivel';
import type { ProvedorAnuncios } from './anuncios';
import { SalvadorNavegador } from './arquivos';
import { SalvadorNativo } from './arquivos-nativo';
import { ProvedorPlayNativo } from './compra-play';
import { ProvedorIndisponivel } from './indisponivel';
import { aplicarEstiloBarras, ehNativo, instalarVoltarAndroid } from './nativo';
import { NotificadorNavegador } from './notificador';
import { NotificadorLocal } from './notificador-local';
import type { Notificador, ProvedorCompra, SalvadorArquivos } from './provedor';

export const MODO_BUILD = 'producao' as const;

export function criarProvedor(): ProvedorCompra {
  return ehNativo() ? new ProvedorPlayNativo() : new ProvedorIndisponivel();
}

export function criarNotificador(): Notificador {
  return ehNativo() ? new NotificadorLocal() : new NotificadorNavegador();
}

/** AdMob real só dentro do app; no navegador, sem anúncios (US-24.CA9). */
export function criarProvedorAnuncios(): ProvedorAnuncios {
  return ehNativo() ? new AnunciosAdMob() : new AnunciosIndisponivel();
}

export function criarSalvadorArquivos(): SalvadorArquivos {
  return ehNativo() ? new SalvadorNativo() : new SalvadorNavegador();
}

/** Integração com o sistema (voltar do Android). */
export function instalarPlataforma(): void {
  instalarVoltarAndroid();
}

/** Cor dos ícones das barras do sistema: null = segue o aparelho; true = tema escuro forçado (Pro). */
export function aplicarBarrasSistema(escuro: boolean | null): void {
  aplicarEstiloBarras(escuro);
}

/** Service worker de cache só fora do app (no app os arquivos já estão dentro do pacote, US-24.CA1). */
export function usarServiceWorker(): boolean {
  return !ehNativo();
}

/** Em produção não há controles de teste. */
export function instalarControlesTeste(): void {
  // vazio de propósito
}
