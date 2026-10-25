// US-02 / US-07 / US-22 — Ajustes em listas agrupadas: plano, avisos, backup, temas e sobre (design 4.7).
import { textoJanelaAviso } from '../../domain/proximas';
import { alterarDiasAviso } from '../../domain/operacoes';
import { lerDiasAviso } from '../../domain/validacao';
import { definirEstado, obterEstado } from '../../loja';
import { renderizar } from '../app';
import { exportarBackupComAviso, importarArquivo, seletorDeArquivo } from '../backup';
import { linhaAcao } from '../componentes';
import { h } from '../dom';
import { icone } from '../icones';
import { avisar, navegar } from '../navegacao';
import { ehPro } from '../../servicos/pro';
import { contarAtivas, textoContador } from '../../domain/plano';
import { seloPro } from '../componentes';
import { secaoBackupAutomatico } from './copias';
import { secaoLembretes } from './lembretes';
import { secaoPlanilha } from './planilha';
import { secaoAparencia } from './aparencia';
import { secaoTemas } from './temas';
import { secaoAnunciosPrivacidade } from './anuncios-privacidade';
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
    h('h2', { class: 'g-titulo', id: 'titulo-avisos' }, 'Avisos'),
    h(
      'form',
      { class: 'grupo', novalidate: true, onsubmit: salvar, testid: 'form-config' },
      h(
        'div',
        { class: 'lin-bloco campo-grupo' },
        h('label', { for: 'config-dias' }, 'Destacar cobranças com quantos dias de antecedência?'),
        h('div', { class: 'campo-curto' }, campo, h('span', { 'aria-hidden': 'true' }, 'dias')),
        erro,
      ),
      linhaAcao('Salvar aviso', () => undefined, { testid: 'btn-salvar-config', tipo: 'submit' }),
    ),
    h('p', { class: 'g-rodape', id: 'ajuda-config-dias' }, 'De 0 a 30 dias. 0 = só no dia.'),
  );
}

function secaoBackup(): HTMLElement {
  const seletor = seletorDeArquivo((f) => void importarArquivo(f, () => renderizar()));
  return h(
    'section',
    { 'aria-labelledby': 'titulo-backup' },
    h('h2', { class: 'g-titulo', id: 'titulo-backup' }, 'Backup e exportação'),
    // Sem botão primário em Ajustes (UX-S3-07): exportar e importar são linhas de ação.
    h(
      'div',
      { class: 'grupo' },
      linhaAcao('Exportar backup', () => void exportarBackupComAviso(renderizar), { testid: 'btn-exportar' }),
      linhaAcao('Importar backup', seletor.abrir, { testid: 'btn-importar' }),
    ),
    seletor.input,
    h('p', { class: 'g-rodape' }, 'Seus dados ficam só neste celular. Guarde uma cópia em arquivo para não perder tudo ao trocar de aparelho.'),
    secaoPlanilha(),
    secaoBackupAutomatico(),
  );
}

/** Plano: grátis com acesso à tela Pro, ou Pro com "Ver detalhes". */
function secaoPlano(): HTMLElement {
  const pro = ehPro();
  const grupo = pro
    ? h(
        'div',
        { class: 'grupo', testid: 'plano-cartao' },
        h('div', { class: 'lin-bloco' }, h('p', { class: 't' }, h('span', {}, 'Mensalão Pro'), seloPro()), h('p', { class: 'd' }, 'Compra ativa. Obrigado!')),
        linhaAcao('Ver detalhes', () => navegar('#/pro'), { testid: 'plano-btn-pro', seta: true }),
      )
    : h(
        'div',
        { class: 'grupo', testid: 'plano-cartao' },
        h('div', { class: 'lin-bloco' }, h('p', { class: 't' }, 'Plano grátis'), h('p', { class: 'd' }, textoContador(contarAtivas(obterEstado())))),
        linhaAcao('Conhecer o Pro', () => navegar('#/pro'), { testid: 'plano-btn-pro', seta: true }),
      );
  return h('section', { 'aria-labelledby': 'titulo-plano' }, h('h2', { class: 'g-titulo g-primeiro', id: 'titulo-plano' }, 'Plano'), grupo);
}

export function telaAjustes(): Tela {
  return {
    titulo: 'Ajustes',
    aba: 'ajustes',
    agrupado: true,
    conteudo: [
      secaoPlano(),
      secaoAvisos(),
      secaoLembretes(),
      secaoBackup(),
      secaoAparencia(),
      secaoTemas(),
      secaoAnunciosPrivacidade(),
      h(
        'section',
        { 'aria-labelledby': 'titulo-sobre' },
        h('h2', { class: 'g-titulo', id: 'titulo-sobre' }, 'Sobre'),
        h(
          'div',
          { class: 'grupo' },
          h('a', { class: 'lin lin-acao', href: './privacidade.html', testid: 'link-privacidade' }, h('span', {}, 'Política de privacidade'), icone('seta', 'ic seta')),
        ),
        // US-26.CA10 / design 17: a verdade nos dois planos.
        h(
          'p',
          { class: 'g-rodape', testid: 'sobre-anuncios' },
          ehPro()
            ? 'Mensalão não se conecta a bancos e suas assinaturas nunca saem deste celular. Sem anúncios.'
            : 'Mensalão não se conecta a bancos e suas assinaturas nunca saem deste celular. A versão grátis mostra anúncios do Google.',
        ),
      ),
    ],
  };
}
