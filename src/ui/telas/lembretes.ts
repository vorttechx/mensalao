// US-13 — Lembrete antes da cobrança: aviso no Início (design 8.6) e seção de Ajustes (design 9.4).
import { lerDiasLembrete, textoAntecedencia } from '../../domain/lembretes';
import { notificador, lembretesAtuais, processarLembretes } from '../../servicos/lembretes';
import { alterarPrefs, obterPrefs } from '../../servicos/preferencias';
import { ehPro } from '../../servicos/pro';
import { renderizar } from '../app';
import { botao, cartaoRecursoPro, dialogoInfo, interruptor } from '../componentes';
import { h } from '../dom';
import { icone } from '../icones';
import { avisar, navegar } from '../navegacao';

export const TEXTO_LIMITE_LEMBRETE = 'Com o app fechado, o aviso depende do seu aparelho e pode atrasar. Abra o app para ver tudo.';

/** Aviso de lembretes no topo do Início; não existe sem lembrete na janela. */
export function avisoLembretes(): HTMLElement | null {
  const itens = lembretesAtuais();
  if (itens.length === 0) return null;
  return h(
    'section',
    { class: 'aviso-lembretes', role: 'status', testid: 'lembrete-aviso', 'aria-labelledby': 'titulo-lembretes' },
    h('h2', { id: 'titulo-lembretes' }, icone('sino'), 'Lembretes'),
    h(
      'ul',
      {},
      itens.map((i) =>
        h(
          'li',
          {},
          h(
            'a',
            { href: `#/assinatura/${encodeURIComponent(i.assinaturaId)}`, testid: 'lembrete-item', class: i.tipo === 'fim-teste' ? 'fim-teste' : null },
            i.tipo === 'fim-teste' ? icone('ampulheta') : null,
            h('span', {}, i.texto),
          ),
        ),
      ),
    ),
    h('p', { class: 'nota', testid: 'lembrete-limite-texto' }, TEXTO_LIMITE_LEMBRETE),
  );
}

/** Liga o lembrete: explica antes de pedir a permissão do sistema (US-13.CA5). */
async function ligarLembrete(): Promise<void> {
  if (notificador.suportado() && notificador.permissao() === 'default') {
    const continuar = await dialogoInfo({
      titulo: 'Avisar antes das cobranças?',
      textos: [
        'Para avisar também com o Mensalão fechado, o celular vai pedir permissão para mostrar notificações.',
        'Se você não permitir, os avisos continuam aparecendo quando abrir o app.',
      ],
      rotuloPrincipal: 'Continuar',
      rotuloSaida: 'Voltar',
      testid: 'lembrete-dialogo',
      testidPrincipal: 'lembrete-btn-continuar',
      testidSaida: 'lembrete-btn-voltar',
    });
    if (continuar === null) return; // fechado pela troca de rota: nada a fazer (BUG-01)
    if (!continuar) {
      renderizar(); // "Voltar" deixa o lembrete desligado
      return;
    }
    alterarPrefs((p) => ({ ...p, lembrete: { ...p.lembrete, ativo: true } }));
    await notificador.pedirPermissao();
  } else {
    alterarPrefs((p) => ({ ...p, lembrete: { ...p.lembrete, ativo: true } }));
  }
  await processarLembretes();
  renderizar();
  document.querySelector<HTMLElement>('[data-testid="lembrete-ativar"]')?.focus();
}

function formDias(): HTMLElement {
  const atual = obterPrefs().lembrete.dias;
  const campo = h('input', {
    id: 'lembrete-dias',
    class: 'controle',
    type: 'text',
    inputmode: 'numeric',
    autocomplete: 'off',
    testid: 'lembrete-dias',
    'aria-describedby': 'ajuda-lembrete-dias',
  });
  campo.value = String(atual);
  const erro = h('div', { class: 'msg-erro', id: 'erro-lembrete-dias', testid: 'error-lembrete-dias', hidden: true });
  function salvar(ev: Event): void {
    ev.preventDefault();
    const n = lerDiasLembrete(campo.value);
    if (n === null) {
      // Valor inválido: erro e o valor salvo continua valendo (US-13.CA2).
      erro.replaceChildren(icone('alerta'), h('span', {}, 'Use um número inteiro de 0 a 7'));
      erro.hidden = false;
      campo.setAttribute('aria-invalid', 'true');
      campo.setAttribute('aria-describedby', 'ajuda-lembrete-dias erro-lembrete-dias');
      campo.focus();
      return;
    }
    alterarPrefs((p) => ({ ...p, lembrete: { ...p.lembrete, dias: n } }));
    avisar({ tipo: 'ok', linhas: [`Lembrete atualizado: ${textoAntecedencia(n)}.`], testid: 'lembrete-salvo' });
    void processarLembretes();
    renderizar();
  }
  return h(
    'form',
    { novalidate: true, onsubmit: salvar, testid: 'form-lembrete' },
    h(
      'div',
      { class: 'campo' },
      h('label', { for: 'lembrete-dias' }, 'Quantos dias antes?'),
      h('span', { class: 'ajuda', id: 'ajuda-lembrete-dias' }, 'De 0 a 7. 0 = no dia da cobrança.'),
      h('div', { class: 'campo-curto' }, campo, h('span', { 'aria-hidden': 'true' }, 'dias')),
      erro,
    ),
    botao('Salvar lembrete', 'secundario', () => undefined, { testid: 'lembrete-btn-salvar', tipo: 'submit' }),
  );
}

/** Seção "Lembretes antes da cobrança" dos Ajustes. */
export function secaoLembretes(): HTMLElement {
  const titulo = h('h2', { class: 'secao', id: 'titulo-lembretes-ajustes' }, 'Lembretes antes da cobrança');
  if (!ehPro()) {
    return h(
      'section',
      { 'aria-labelledby': 'titulo-lembretes-ajustes' },
      titulo,
      cartaoRecursoPro({
        testid: 'lock-lembrete',
        titulo: 'Lembretes antes da cobrança',
        descricao: ['Receba um aviso de 0 a 7 dias antes de cada cobrança, para cancelar a tempo.'],
        recurso: 'lembretes antes da cobrança',
        aoConhecer: () => navegar('#/pro'),
      }),
    );
  }
  const p = obterPrefs();
  const situacao: HTMLElement[] = [];
  if (!notificador.suportado()) {
    situacao.push(h('p', { class: 'nota com-icone', testid: 'lembrete-sem-suporte' }, icone('info'), h('span', {}, 'Seu aparelho não permite notificações; usaremos o aviso dentro do app')));
  } else if (notificador.permissao() === 'denied') {
    situacao.push(
      h('p', { class: 'nota com-icone', testid: 'lembrete-sem-permissao' }, icone('info'), h('span', {}, 'Notificações do sistema desativadas. Você verá os avisos ao abrir o app.')),
    );
  }
  return h(
    'section',
    { 'aria-labelledby': 'titulo-lembretes-ajustes' },
    titulo,
    h(
      'div',
      { class: 'cartao cartao-switch' },
      interruptor({
        rotulo: 'Lembrar antes da cobrança',
        testid: 'lembrete-ativar',
        marcado: p.lembrete.ativo,
        aoMudar: (ligado) => {
          if (ligado) void ligarLembrete();
          else {
            alterarPrefs((x) => ({ ...x, lembrete: { ...x.lembrete, ativo: false } }));
            renderizar();
            document.querySelector<HTMLElement>('[data-testid="lembrete-ativar"]')?.focus();
          }
        },
      }),
    ),
    formDias(),
    h('p', { class: 'nota com-icone', testid: 'lembrete-limite-texto' }, icone('info'), h('span', {}, TEXTO_LIMITE_LEMBRETE)),
    ...situacao,
  );
}
