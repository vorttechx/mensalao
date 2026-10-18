// US-13 — Dispara as notificações locais devidas (uma vez por par assinatura/data) e expõe o notificador.
import { criarNotificador } from '@ambiente';
import { lembretesDevidos, registrarAvisados, type ItemLembrete } from '../domain/lembretes';
import { hoje, obterEstado, emRecuperacao } from '../loja';
import type { Notificador } from '../plataforma/provedor';
import { alterarPrefs, obterPrefs } from './preferencias';
import { ehPro } from './pro';

export const notificador: Notificador = criarNotificador();

/** Lembretes visíveis no Início agora (vazio se não for Pro ou se o lembrete estiver desligado). */
export function lembretesAtuais(): ItemLembrete[] {
  const p = obterPrefs();
  if (!ehPro() || !p.lembrete.ativo || emRecuperacao()) return [];
  return lembretesDevidos(obterEstado(), hoje(), p.lembrete.dias, p.lembretesAvisados).itens;
}

/**
 * Notifica os pares ainda não avisados (US-13.CA4, CA6). Pode ser chamado várias vezes:
 * ao abrir, quando a loja confirma o Pro, ao ligar o lembrete e ao voltar ao app.
 */
export async function processarLembretes(): Promise<void> {
  const p = obterPrefs();
  if (!ehPro() || !p.lembrete.ativo || emRecuperacao()) return; // revogado: param (US-13.CA13)
  const dia = hoje();
  const { novos } = lembretesDevidos(obterEstado(), dia, p.lembrete.dias, p.lembretesAvisados);
  const avisados = registrarAvisados(p.lembretesAvisados, novos, dia);
  if (novos.length > 0 || avisados.length !== p.lembretesAvisados.length) {
    alterarPrefs((x) => ({ ...x, lembretesAvisados: avisados }));
  }
  if (notificador.suportado() && notificador.permissao() === 'granted') {
    for (const n of novos) await notificador.notificar('Mensalão', n.texto);
  }
}
