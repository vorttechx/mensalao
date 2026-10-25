// US-02 / US-07 — Ajustes: dias de aviso e backup (design.md 4.7).
import { textoJanelaAviso } from '../../domain/proximas';
import { alterarDiasAviso } from '../../domain/operacoes';
import { lerDiasAviso } from '../../domain/validacao';
import { definirEstado, obterEstado } from '../../loja';
import { renderizar } from '../app';
import { exportarBackup, importarArquivo, seletorDeArquivo } from '../backup';
import { botao } from '../componentes';
import { h } from '../dom';
import { icone } from '../icones';
import { avisar, navegar } from '../navegacao';
import { ehPro } from '../../servicos/pro';
import { contarAtivas, textoContador } from '../../domain/plano';
import { seloPro } from '../componentes';
import { secaoBackupAutomatico } from './copias';
import { secaoLembretes } from './lembretes';
import { secaoPlanilha } from './planilha';
import { secaoTemas } from './temas';
import type { Tela } from '../tela';

function secaoAvisos(): HTMLElement {
  const atual = obterEstado().config.diasAviso;
  const campo = h('input', {
    id: 'config-dias',
    class: 'controle',
    type: 'text',
    inputmode: 'numeric',
    autocomplete: 'off',
    testid: 'config-dias-aviso',
    'aria-describedby': 'ajuda-config-dias',
  });
  campo.value = String(atual);
  const erro = h('div', { class: 'msg-erro', id: 'erro-config-dias', testid: 'error-config-dias', hidden: true });

  function salvar(ev: Event): void {
    ev.preventDefault();
    const n = lerDiasAviso(campo.value);
    if (n === null) {
      // Valor inválido: mostra o erro e mantém o valor salvo anteriormente (US-02.CA3).
      erro.replaceChildren(icone('alerta'), h('span', {}, 'Use um número inteiro de 0 a 30'));
      erro.hidden = false;
      campo.setAttribute('aria-invalid', 'true');
      campo.setAttribute('aria-describedby', 'ajuda-config-dias erro-config-dias');
      campo.focus();
      return;
    }
    definirEstado(alterarDiasAviso(obterEstado(), n));
    const janela = textoJanelaAviso(n);
    avisar({ tipo: 'ok', linhas: [`Aviso atualizado: ${janela.charAt(0).toLowerCase()}${janela.slice(1)}.`], testid: 'aviso-config-salva' });
    renderizar();
  }

  return h(
    'section',
    { 'aria-labelledby': 'titulo-avisos' },
    h('h2', { class: 'secao', id: 'titulo-avisos' }, 'Avisos'),
    h(
      'form',
      { novalidate: true, onsubmit: salvar, testid: 'form-config' },
      h(
        'div',
        { class: 'campo' },
        h('label', { for: 'config-dias' }, 'Destacar cobranças com quantos dias de antecedência?'),
        h('span', { class: 'ajuda', id: 'ajuda-config-dias' }, 'De 0 a 30 dias. 0 = só no dia.'),
        h('div', { class: 'campo-curto' }, campo, h('span', { 'aria-hidden': 'true' }, 'dias')),
        erro,
      ),
      botao('Salvar aviso', 'secundario', () => undefined, { testid: 'btn-salvar-config', tipo: 'submit' }),
    ),
  );
}

function secaoBackup(): HTMLElement {
  const seletor = seletorDeArquivo((f) => void importarArquivo(f, () => renderizar()));
  return h(
    'section',
    { 'aria-labelledby': 'titulo-backup' },
    h('h2', { class: 'secao', id: 'titulo-backup' }, 'Backup e exportação'),
    h('h3', { class: 'subsecao' }, 'Backup em arquivo'),
    h('p', { class: 'nota' }, 'Seus dados ficam só neste celular. Guarde uma cópia em arquivo para não perder tudo ao trocar de aparelho.'),
    h(
      'div',
      { class: 'pilha' },
      botao('Exportar backup', 'primario', () => {
        const nome = exportarBackup();
        avisar({ tipo: 'ok', linhas: [`Backup exportado: ${nome}`], testid: 'export-ok' });
        renderizar();
      }, { testid: 'btn-exportar', larga: true }),
      botao('Importar backup', 'secundario', seletor.abrir, { testid: 'btn-importar', larga: true }),
      seletor.input,
    ),
    secaoPlanilha(),
    secaoBackupAutomatico(),
  );
}

/** Plano (design 9.8): grátis com acesso à tela Pro, ou Pro com "Ver detalhes". */
function secaoPlano(): HTMLElement {
  const pro = ehPro();
  const cartao = pro
    ? h(
        'div',
        { class: 'cartao plano-cartao', testid: 'plano-cartao' },
        h('p', { class: 'plano-nome' }, 'Mensalão Pro'),
        h('p', { class: 'nota' }, 'Compra ativa. Obrigado!'),
        botao('Ver detalhes', 'texto', () => navegar('#/pro'), { testid: 'plano-btn-pro' }),
      )
    : h(
        'div',
        { class: 'cartao plano-cartao', testid: 'plano-cartao' },
        h('p', { class: 'plano-nome' }, 'Plano grátis'),
        h('p', { class: 'nota' }, textoContador(contarAtivas(obterEstado()))),
        botao('Conhecer o Pro', 'secundario', () => navegar('#/pro'), { testid: 'plano-btn-pro' }),
      );
  return h('section', { 'aria-labelledby': 'titulo-plano' }, h('h2', { class: 'secao', id: 'titulo-plano' }, 'Plano', pro ? ' ' : null, pro ? seloPro() : null), cartao);
}

export function telaAjustes(): Tela {
  return {
    titulo: 'Ajustes',
    aba: 'ajustes',
    conteudo: [
      secaoPlano(),
      secaoAvisos(),
      secaoLembretes(),
      secaoBackup(),
      secaoTemas(),
      h(
        'section',
        { 'aria-labelledby': 'titulo-sobre' },
        h('h2', { class: 'secao', id: 'titulo-sobre' }, 'Sobre'),
        h('p', { class: 'nota' }, 'Mensalão não se conecta a bancos e não envia seus dados para a internet.'),
        h('a', { class: 'link-privacidade', href: './privacidade.html', testid: 'link-privacidade' }, 'Política de privacidade'),
      ),
    ],
  };
}
