// US-08.CA4 — Dados corrompidos: oferece importar backup ou começar do zero (design.md 4.8).
import { estadoVazio as novoEstadoVazio } from '../../domain/tipos';
import { definirEstado, sairDaRecuperacao } from '../../loja';
import { renderizar } from '../app';
import { importarArquivo, seletorDeArquivo } from '../backup';
import { botao, confirmar } from '../componentes';
import { h } from '../dom';
import { avisar, substituir } from '../navegacao';
import type { Tela } from '../tela';

function concluir(): void {
  sairDaRecuperacao();
  substituir('#/');
  renderizar();
}

async function comecarDoZero(): Promise<void> {
  const ok = await confirmar({
    titulo: 'Apagar os dados salvos?',
    texto: 'Os dados danificados serão apagados e o app começará vazio. Se tiver um backup, importe-o antes.',
    rotuloConfirmar: 'Apagar e começar',
  });
  if (!ok) return;
  definirEstado(novoEstadoVazio());
  avisar({ tipo: 'ok', linhas: ['Pronto. O app começou vazio.'] });
  concluir();
}

export function telaRecuperacao(): Tela {
  const seletor = seletorDeArquivo((f) =>
    void importarArquivo(f, (importou) => {
      if (importou) concluir();
      else renderizar();
    }),
  );
  return {
    titulo: 'Não conseguimos ler seus dados salvos',
    marca: true,
    conteudo: [
      h(
        'div',
        { class: 'banner banner-erro', role: 'alert', testid: 'corrupt-warning' },
        h('div', { class: 'texto' }, h('p', {}, 'Os dados deste aparelho parecem danificados. Nada foi apagado. Você pode restaurar um backup ou começar do zero.')),
      ),
      h(
        'div',
        { class: 'pilha' },
        botao('Importar backup', 'primario', seletor.abrir, { testid: 'btn-importar', larga: true }),
        seletor.input,
        botao('Começar do zero', 'perigo', () => void comecarDoZero(), { testid: 'btn-comecar-zero', larga: true }),
      ),
    ],
  };
}
