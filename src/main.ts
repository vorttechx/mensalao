// Ponto de entrada: carrega os dados do aparelho e inicia a interface.
import './styles.css';
import { instalarControlesTeste } from '@ambiente';
import { carregar } from './armazenamento';
import { entrarEmRecuperacao, iniciarEstado } from './loja';
import { iniciarApp } from './ui/app';

const carga = carregar();
if (carga.tipo === 'ok') iniciarEstado(carga.estado);
// Dados corrompidos: não sobrescreve nada sem confirmação (US-08.CA4).
if (carga.tipo === 'corrompido') entrarEmRecuperacao();

// Só o build de teste instala controles (o de produção exporta uma função vazia).
instalarControlesTeste();
iniciarApp(document.getElementById('app')!);

// Service worker só no build de produção (o sw.js é gerado pelo vite.config.ts).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Sem service worker o app continua funcionando online.
    });
  });
}
