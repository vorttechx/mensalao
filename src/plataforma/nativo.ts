// US-24.CA13 / design 15.6 — Integração com o Android: botão voltar e cor dos ícones das barras do sistema.
// Só é importado pelo ambiente Android; no navegador não faz nada.
import { App } from '@capacitor/app';
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';

export function ehNativo(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Voltar do Android: fecha o diálogo aberto (sem escolher nada, como o Esc), senão volta no histórico
 * das telas (rotas por hash); na primeira tela, manda o app para segundo plano (como os apps do sistema).
 */
export function instalarVoltarAndroid(): void {
  if (!ehNativo()) return;
  void App.addListener('backButton', ({ canGoBack }) => {
    const dialogo = document.querySelector<HTMLDialogElement>('dialog[open]');
    if (dialogo) {
      // "cancel" é o mesmo evento do Esc: cada diálogo decide o que fazer (o de consentimento não grava escolha).
      const ev = new Event('cancel', { cancelable: true });
      if (dialogo.dispatchEvent(ev)) dialogo.close();
      return;
    }
    if (canGoBack && location.hash && location.hash !== '#/') history.back();
    else void App.minimizeApp();
  });
}

/** Ícones escuros no papel claro e claros no escuro, seguindo a Aparência efetiva (design 15.6). */
export function aplicarEstiloBarras(escuro: boolean | null): void {
  if (!ehNativo()) return;
  const style = escuro === null ? SystemBarsStyle.Default : escuro ? SystemBarsStyle.Dark : SystemBarsStyle.Light;
  void SystemBars.setStyle({ style }).catch(() => undefined);
}
