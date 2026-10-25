// Ponto de entrada: carrega os dados do aparelho e inicia a interface.
import './styles.css';
import { instalarControlesTeste, instalarPlataforma, usarServiceWorker } from '@ambiente';
import { carregar } from './armazenamento';
import { entrarEmRecuperacao, iniciarEstado } from './loja';
import { comPrazo } from './plataforma/provedor';
import { notificador } from './servicos/lembretes';
import { iniciarApp } from './ui/app';

const carga = carregar();
if (carga.tipo === 'ok') iniciarEstado(carga.estado);
// Dados corrompidos: não sobrescreve nada sem confirmação (US-08.CA4).
if (carga.tipo === 'corrompido') entrarEmRecuperacao();

// Só o build de teste instala controles (o de produção exporta uma função vazia).
instalarControlesTeste();
instalarPlataforma();
// No Android a permissão de notificação é lida de forma assíncrona; no máximo 1 s antes da primeira tela.
if (notificador.preparar) await comPrazo(notificador.preparar(), 1000).catch(() => undefined);
iniciarApp(document.getElementById('app')!);

// Service worker de cache só no navegador (build de teste e desenvolvimento); no app Android os arquivos
// já vão dentro do pacote e funcionam offline desde a primeira abertura (US-24.CA1).
if ('serviceWorker' in navigator && import.meta.env.PROD && usarServiceWorker()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Sem service worker o app continua funcionando online.
    });
  });
}
