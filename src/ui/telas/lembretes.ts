// US-13 — Lembrete antes da cobrança: aviso no Início (design 8.6) e seção de Ajustes (design 9.4).
import { lerDiasLembrete, textoAntecedencia } from '../../domain/lembretes';
import { notificador, lembretesAtuais, processarLembretes } from '../../servicos/lembretes';
import { alterarPrefs, obterPrefs } from '../../servicos/preferencias';
import { ehPro } from '../../servicos/pro';
import { renderizar } from '../app';
import { cartaoRecursoPro, dialogoInfo, interruptor, linhaAcao } from '../componentes';
import { h } from '../dom';
import { icone } from '../icones';
import { avisar, navegar } from '../navegacao';

export const TEXTO_LIMITE_LEMBRETE = 'Com o app fechado, o aviso depende do seu aparelho e pode atrasar. Abra o app para ver tudo.';

/** Linhas do aviso que ficam à vista; as demais vão para "Mais N lembretes" (design 3.11, US-20.CA4). */
const LEMBRETES_VISIVEIS = 2;

function linhaLembrete(i: ReturnType<typeof lembretesAtuais>[number]): HTMLElement {
  const teste = i.tipo === 'fim-teste';
  return h(
    'li',
    {},
    h(
      'a',
      { href: `#/assinatura/${encodeURIComponent(i.assinaturaId)}`, testid: 'lembrete-item', class: teste ? 'fim-teste' : null },
      icone(teste ? 'ampulheta' : 'sino'),
      h('span', {}, i.texto),
      icone('seta', 'ic seta'),
    ),
  );
}

/**
 * Aviso discreto de lembretes no Início (design 3.11): um trecho do extrato entre dois divisores,
 * sem faixa colorida. Até 2 linhas à vista; o resto dentro de "Mais N lembretes". Não existe sem lembrete na janela.
 */
export function avisoLembretes(): HTMLElement | null {
  const itens = lembretesAtuais();
  if (itens.length === 0) return null;
  const visiveis = itens.slice(0, LEMBRETES_VISIVEIS);
  const resto = itens.slice(LEMBRETES_VISIVEIS);
  return h(
    'section',
    { class: 'avisos', role: 'status', testid: 'lembrete-aviso', 'aria-labelledby': 'titulo-lembretes' },
    h('h2', { id: 'titulo-lembretes', class: 'sr-only' }, 'Lembretes'),
    h('ul', {}, visiveis.map(linhaLembrete)),
    resto.length
      ? h(
          'details',
          { class: 'mais-lembretes' },
          h('summary', {}, `Mais ${resto.length} ${resto.length === 1 ? 'lembrete' : 'lembretes'}`, icone('chevron-baixo', 'ic seta')),
          h('ul', {}, resto.map(linhaLembrete)),
        )
      : null,
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

/** Grupo do Pro: interruptor, dias de antecedência e "Salvar lembrete" como linha de ação (UX-S3-07). */
function formLembrete(interruptorEl: HTMLElement): HTMLElement {
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
    { class: 'grupo', novalidate: true, onsubmit: salvar, testid: 'form-lembrete' },
    interruptorEl,
    h(
      'div',
      { class: 'lin-bloco campo-grupo' },
      h('div', { class: 'campo-linha' }, h('label', { for: 'lembrete-dias' }, 'Quantos dias antes?'), h('div', { class: 'campo-curto' }, campo, h('span', { 'aria-hidden': 'true' }, 'dias'))),
      erro,
    ),
    linhaAcao('Salvar lembrete', () => undefined, { testid: 'lembrete-btn-salvar', tipo: 'submit' }),
  );
}

/** Seção "Lembretes antes da cobrança" dos Ajustes. */
export function secaoLembretes(): HTMLElement {
  const titulo = h('h2', { class: 'g-titulo', id: 'titulo-lembretes-ajustes' }, 'Lembretes antes da cobrança');
  if (!ehPro()) {
    return h(
      'section',
      { 'aria-labelledby': 'titulo-lembretes-ajustes' },
      titulo,
      cartaoRecursoPro({
        testid: 'lock-lembrete',
        titulo: 'Lembretes antes da cobrança',
        tituloOculto: true,
        descricao: ['Receba um aviso de 0 a 7 dias antes de cada cobrança, para cancelar a tempo.'],
        recurso: 'lembretes antes da cobrança',
        aoConhecer: () => navegar('#/pro'),
      }),
    );
  }
  const p = obterPrefs();
  const situacao: HTMLElement[] = [];
  if (!notificador.suportado()) {
    situacao.push(h('p', { class: 'g-rodape com-icone', testid: 'lembrete-sem-suporte' }, icone('info'), h('span', {}, 'Seu aparelho não permite notificações; usaremos o aviso dentro do app')));
  } else if (notificador.permissao() === 'denied') {
    situacao.push(
      h('p', { class: 'g-rodape com-icone', testid: 'lembrete-sem-permissao' }, icone('info'), h('span', {}, 'Notificações do sistema desativadas. Você verá os avisos ao abrir o app.')),
    );
  }
  const chave = interruptor({
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
  });
  return h(
    'section',
    { 'aria-labelledby': 'titulo-lembretes-ajustes' },
    titulo,
    formLembrete(chave),
    h('p', { class: 'g-rodape', id: 'ajuda-lembrete-dias' }, 'De 0 a 7. 0 = no dia da cobrança.'),
    h('p', { class: 'g-rodape com-icone', testid: 'lembrete-limite-texto' }, icone('info'), h('span', {}, TEXTO_LIMITE_LEMBRETE)),
    ...situacao,
  );
}
