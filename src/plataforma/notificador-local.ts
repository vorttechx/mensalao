// US-24.CA7 / CA8 — Notificador do app Android: notificações locais nativas (@capacitor/local-notifications),
// mesma interface e mesmas regras da US-13 (o app decide quando notificar; aqui só se exibe). Sem push.
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Notificador, PermissaoNotificacao } from './provedor';

function mapear(estado: string): PermissaoNotificacao {
  if (estado === 'granted') return 'granted';
  if (estado === 'denied') return 'denied';
  return 'default'; // 'prompt' e 'prompt-with-rationale': ainda dá para pedir
}

/** Id numérico estável por texto (um lembrete por par assinatura/data já é garantido pelo domínio). */
function idDe(texto: string): number {
  let h = 5381;
  for (let i = 0; i < texto.length; i += 1) h = ((h * 33) ^ texto.charCodeAt(i)) | 0;
  return Math.abs(h) % 2_000_000_000;
}

export class NotificadorLocal implements Notificador {
  private estado: PermissaoNotificacao = 'default';
  private disponivelNoAparelho = true;

  async preparar(): Promise<void> {
    try {
      this.estado = mapear((await LocalNotifications.checkPermissions()).display);
    } catch {
      this.disponivelNoAparelho = false;
      this.estado = 'denied';
    }
  }

  suportado(): boolean {
    return this.disponivelNoAparelho;
  }

  permissao(): PermissaoNotificacao {
    return this.estado;
  }

  /** Android 13+: o sistema pergunta; a explicação do app vem antes (US-13.CA5, diálogo em lembretes.ts). */
  async pedirPermissao(): Promise<PermissaoNotificacao> {
    try {
      this.estado = mapear((await LocalNotifications.requestPermissions()).display);
    } catch {
      this.estado = 'denied';
    }
    return this.estado;
  }

  async notificar(titulo: string, corpo: string): Promise<void> {
    if (this.estado !== 'granted') return;
    try {
      // Sem "schedule": a notificação aparece na hora.
      await LocalNotifications.schedule({ notifications: [{ id: idDe(corpo), title: titulo, body: corpo, smallIcon: 'ic_stat_mensalao' }] });
    } catch {
      // Sem notificação, o aviso dentro do app continua valendo.
    }
  }
}
