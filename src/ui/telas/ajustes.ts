// US-02 / US-07 — Ajustes: dias de aviso e backup (design.md 4.7).
import { textoJanelaAviso } from '../../domain/proximas';
import { alterarDiasAviso } from '../../domain/operacoes';
import { lerDiasAviso } from '../../domain/validacao';
import { definirEstado, obterEstado } from '../../loja';
import { renderizar } from '../app';
import { botao } from '../componentes';
import { h } from '../dom';
import { icone } from '../icones';
import { avisar } from '../navegacao';
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

export function telaAjustes(): Tela {
  return {
    titulo: 'Ajustes',
    aba: 'ajustes',
    conteudo: [
      secaoAvisos(),
      h(
        'section',
        { 'aria-labelledby': 'titulo-sobre' },
        h('h2', { class: 'secao', id: 'titulo-sobre' }, 'Sobre'),
        h('p', { class: 'nota' }, 'Mensalão não se conecta a bancos e não envia seus dados para a internet.'),
      ),
    ],
  };
}
