// Notificador FALSO, só no build de teste. Controle: chave `mensalao:teste:notificacao` do localStorage
// ({ suporte, permissao, resposta }); notificações "exibidas" ficam em `mensalao:teste:notificacoes`.
import type { Notificador, PermissaoNotificacao } from './provedor';

export const CHAVE_CONTROLE_NOTIFICACAO = 'mensalao:teste:notificacao';
export const CHAVE_NOTIFICACOES_ENVIADAS = 'mensalao:teste:notificacoes';

export interface ControleNotificacao {
  /** O aparelho suporta notificações. Padrão: true. */
  suporte: boolean;
  /** Permissão atual. Padrão: 'default' (ainda não perguntado). */
  permissao: PermissaoNotificacao;
  /** Resposta da pessoa ao pedido de permissão. Padrão: 'granted'. */
  resposta: PermissaoNotificacao;
}

export const CONTROLE_NOTIFICACAO_PADRAO: ControleNotificacao = { suporte: true, permissao: 'default', resposta: 'granted' };

export function lerControleNotificacao(): ControleNotificacao {
  try {
    return { ...CONTROLE_NOTIFICACAO_PADRAO, ...JSON.parse(localStorage.getItem(CHAVE_CONTROLE_NOTIFICACAO) ?? '{}') };
  } catch {
    return { ...CONTROLE_NOTIFICACAO_PADRAO };
  }
}

export function configurarNotificacao(parcial: Partial<ControleNotificacao>): ControleNotificacao {
  const novo = { ...lerControleNotificacao(), ...parcial };
  localStorage.setItem(CHAVE_CONTROLE_NOTIFICACAO, JSON.stringify(novo));
  return novo;
}

export function notificacoesEnviadas(): { titulo: string; corpo: string }[] {
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE_NOTIFICACOES_ENVIADAS) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export class NotificadorFalso implements Notificador {
  suportado(): boolean {
    return lerControleNotificacao().suporte;
  }

  permissao(): PermissaoNotificacao {
    const c = lerControleNotificacao();
    return c.suporte ? c.permissao : 'denied';
  }

  async pedirPermissao(): Promise<PermissaoNotificacao> {
    const c = lerControleNotificacao();
    if (!c.suporte) return 'denied';
    if (c.permissao !== 'default') return c.permissao;
    configurarNotificacao({ permissao: c.resposta });
    return c.resposta;
  }

  async notificar(titulo: string, corpo: string): Promise<void> {
    if (this.permissao() !== 'granted') return;
    localStorage.setItem(CHAVE_NOTIFICACOES_ENVIADAS, JSON.stringify([...notificacoesEnviadas(), { titulo, corpo }]));
  }
}
