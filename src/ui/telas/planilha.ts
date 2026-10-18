// US-15 — Exportar planilha CSV (design 9.7). Gerado no aparelho, sem rede.
import { gerarCsv, nomeArquivoCsv } from '../../domain/csv';
import { hoje, obterEstado } from '../../loja';
import { ehPro } from '../../servicos/pro';
import { renderizar } from '../app';
import { botao, cartaoRecursoPro } from '../componentes';
import { h } from '../dom';
import { avisar, navegar } from '../navegacao';

function baixar(nome: string, conteudo: string): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }));
  const a = h('a', { href: url, download: nome, hidden: true });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportarCsv(): void {
  if (!ehPro()) return;
  const dia = hoje();
  const nome = nomeArquivoCsv(dia);
  baixar(nome, gerarCsv(obterEstado(), dia));
  if (obterEstado().assinaturas.length === 0) {
    avisar({ tipo: 'info', linhas: ['Você ainda não tem assinaturas; o arquivo contém só o cabeçalho'], testid: 'csv-vazio' });
  } else {
    avisar({ tipo: 'ok', linhas: [`Planilha exportada: ${nome}`], testid: 'csv-ok' });
  }
  renderizar();
}

export function secaoPlanilha(): HTMLElement {
  if (!ehPro()) {
    return cartaoRecursoPro({
      testid: 'lock-csv',
      titulo: 'Exportar planilha CSV',
      descricao: ['Abra suas assinaturas no Excel ou no Google Planilhas.'],
      recurso: 'exportar planilha CSV',
      aoConhecer: () => navegar('#/pro'),
    });
  }
  return h(
    'section',
    { 'aria-labelledby': 'titulo-planilha' },
    h('h3', { class: 'subsecao', id: 'titulo-planilha' }, 'Planilha'),
    h('p', { class: 'nota' }, 'Arquivo CSV para Excel ou Google Planilhas, com todas as assinaturas (ativas, pausadas e canceladas).'),
    botao('Exportar CSV', 'secundario', exportarCsv, { testid: 'btn-exportar-csv', larga: true, icone: 'tabela' }),
  );
}
