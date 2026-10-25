// US-15 / US-22 — Exportar planilha CSV (design 4.7 e 4.8). Gerado no aparelho, sem rede.
import { gerarCsv, nomeArquivoCsv } from '../../domain/csv';
import { hoje, obterEstado } from '../../loja';
import { ehPro } from '../../servicos/pro';
import { renderizar } from '../app';
import { LINHAS_ERRO_ARQUIVO, salvadorArquivos } from '../backup';
import { cartaoRecursoPro, linhaAcao } from '../componentes';
import { h } from '../dom';
import { avisar, navegar } from '../navegacao';

async function exportarCsv(): Promise<void> {
  if (!ehPro()) return;
  const dia = hoje();
  const nome = nomeArquivoCsv(dia);
  const r = await salvadorArquivos.salvar(nome, gerarCsv(obterEstado(), dia), 'text/csv;charset=utf-8');
  if (r === 'cancelado') return;
  if (r === 'erro') {
    avisar({ tipo: 'erro', linhas: LINHAS_ERRO_ARQUIVO, testid: 'csv-erro' });
  } else if (obterEstado().assinaturas.length === 0) {
    avisar({ tipo: 'info', linhas: ['Você ainda não tem assinaturas; o arquivo contém só o cabeçalho'], testid: 'csv-vazio' });
  } else {
    avisar({ tipo: 'ok', linhas: [`Planilha exportada: ${nome}`], testid: 'csv-ok' });
  }
  renderizar();
}

export function secaoPlanilha(): HTMLElement {
  const titulo = h('h2', { class: 'g-titulo', id: 'titulo-planilha' }, 'Planilha');
  if (!ehPro()) {
    return h(
      'section',
      { 'aria-labelledby': 'titulo-planilha' },
      titulo,
      cartaoRecursoPro({
        testid: 'lock-csv',
        titulo: 'Exportar planilha CSV',
        descricao: ['Abra suas assinaturas no Excel ou no Google Planilhas.'],
        recurso: 'exportar planilha CSV',
        aoConhecer: () => navegar('#/pro'),
      }),
    );
  }
  return h(
    'section',
    { 'aria-labelledby': 'titulo-planilha' },
    titulo,
    h('div', { class: 'grupo' }, linhaAcao('Exportar CSV', () => void exportarCsv(), { testid: 'btn-exportar-csv' })),
    h('p', { class: 'g-rodape' }, 'Arquivo CSV para Excel ou Google Planilhas, com todas as assinaturas (ativas, pausadas e canceladas).'),
  );
}
