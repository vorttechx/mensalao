// Notificação local real (Notification API + service worker). Sem push (D-07).
import type { Notificador, PermissaoNotificacao } from './provedor';

export class NotificadorNavegador implements Notificador {
  suportado(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  permissao(): PermissaoNotificacao {
    return this.suportado() ? Notification.permission : 'denied';
  }

  async pedirPermissao(): Promise<PermissaoNotificacao> {
    if (!this.suportado()) return 'denied';
    try {
      return await Notification.requestPermission();
    } catch {
      return this.permissao();
    }
  }

  async notificar(titulo: string, corpo: string): Promise<void> {
    if (this.permissao() !== 'granted') return;
    const opcoes: NotificationOptions = { body: corpo, icon: './icons/icon-192.png', badge: './icons/icon-192.png', tag: `mensalao-${corpo}` };
    try {
      // No Android (e na TWA) só o service worker pode exibir notificações.
      const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
      if (reg) await reg.showNotification(titulo, opcoes);
      else new Notification(titulo, opcoes);
    } catch {
      // Sem notificação, o aviso dentro do app continua valendo.
    }
  }
}
