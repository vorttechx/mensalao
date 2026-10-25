// US-27 — Aviso de consentimento do app (design 14.2) e ligação com o formulário do Google (UMP).
// O aviso aparece por cima do Início, de Assinaturas ou de Totais, antes de qualquer pedido ao SDK, a
// partir da 2ª abertura (UX-S4-04). Duas escolhas de mesmo peso, sem "×": Esc e o voltar do Android fecham
// sem gravar, e o aviso volta na próxima vez que um anúncio fosse aparecer (US-27.CA2).
import type { EscolhaAnuncios } from '../domain/consentimento';
import { escolher, mostrarFormularioGoogle, primeiraAbertura, resolverAgora } from '../servicos/consentimento';
import { integrarConsentimento } from './anuncios';
import { botao } from './componentes';
import { h, novoId } from './dom';
import { linkPolitica } from './politica';

const NOME_ESCOLHA: Record<EscolhaAnuncios, string> = {
  personalizado: 'anúncios personalizados',
  'nao-personalizado': 'anúncios não personalizados',
};

let dialogo: HTMLDialogElement | null = null;
/** Fechado sem escolher nesta visita à tela: só volta ao entrar de novo numa tela com banner. */
let dispensado = false;
/** O formulário do Google já foi mostrado nesta visita à tela (evita repetir em seguida). */
let formularioMostrado = false;
let aviso: HTMLElement | null = null;

/** Texto sr-only com aria-live, fora da tela montada (sobrevive à remontagem). */
function anunciar(texto: string): void {
  if (!aviso || !aviso.isConnected) {
    aviso = h('p', { class: 'sr-only', 'aria-live': 'polite', testid: 'consent-anuncio-leitor' });
    document.body.append(aviso);
  }
  const el = aviso;
  el.textContent = '';
  setTimeout(() => (el.textContent = texto), 50);
}

function focarTitulo(): void {
  document.querySelector<HTMLElement>('[data-testid="titulo-tela"]')?.focus({ preventScroll: true });
}

function abrirAviso(): void {
  const idTitulo = novoId('consent-titulo');
  const idTexto = novoId('consent-texto');
  let escolhida: EscolhaAnuncios | null = null;
  const dlg = h('dialog', {
    class: 'dialogo dialogo-consent',
    testid: 'consent-aviso',
    'aria-labelledby': idTitulo,
    'aria-describedby': idTexto,
  });
  const titulo = h('h2', { id: idTitulo, tabindex: '-1' }, 'A versão grátis tem anúncios');
  const escolherCom = (e: EscolhaAnuncios) => () => {
    escolhida = e;
    dlg.close();
  };
  dlg.append(
    h(
      'div',
      { class: 'consent-corpo' },
      titulo,
      h('p', { id: idTexto }, 'O Mensalão grátis mostra um anúncio do Google no rodapé do Início, de Assinaturas e de Totais.'),
      h(
        'p',
        {},
        'Suas assinaturas nunca saem do seu celular. Para escolher os anúncios, o Google usa o identificador de publicidade do aparelho. Esta escolha vale só para os anúncios e não dá acesso às suas assinaturas.',
      ),
      h(
        'dl',
        { class: 'consent-explica' },
        h('div', {}, h('dt', {}, 'Anúncios personalizados'), h('dd', {}, 'O Google escolhe o anúncio pelo que sabe do uso de apps e sites neste aparelho.')),
        h(
          'div',
          {},
          h('dt', {}, 'Anúncios não personalizados'),
          h('dd', {}, 'O Google escolhe pelo assunto do app e pela região aproximada. A quantidade de anúncios é a mesma.'),
        ),
      ),
      linkPolitica('Saiba mais na política de privacidade', 'consent-saiba-mais'),
    ),
    h(
      'div',
      { class: 'consent-pe' },
      botao('Anúncios personalizados', 'secundario', escolherCom('personalizado'), { testid: 'consent-personalizado', larga: true }),
      botao('Anúncios não personalizados', 'secundario', escolherCom('nao-personalizado'), { testid: 'consent-nao-personalizado', larga: true }),
      h('p', { class: 'nota' }, 'Você pode mudar quando quiser em Ajustes, Anúncios e privacidade.'),
    ),
  );
  dlg.addEventListener('close', () => {
    dlg.remove();
    if (dialogo === dlg) dialogo = null;
    if (escolhida === null) {
      // Esc, voltar do Android ou troca de rota: nada é gravado e nenhum anúncio é pedido.
      dispensado = true;
      return;
    }
    focarTitulo();
    anunciar(`Escolha salva: ${NOME_ESCOLHA[escolhida]}.`);
    escolher(escolhida); // reavalia a tela: a faixa entra no estado Reservado
  });
  dialogo = dlg;
  document.body.append(dlg);
  dlg.showModal();
  titulo.focus();
}

function perguntar(trocou: boolean): void {
  if (trocou) dispensado = false;
  if (dispensado || dialogo?.isConnected) return;
  if (document.querySelector('dialog[open]')) return; // outro diálogo na frente: pergunta quando ele fechar
  abrirAviso();
}

function formularioGoogle(trocou: boolean): void {
  if (trocou) formularioMostrado = false;
  if (formularioMostrado || document.querySelector('dialog[open]')) return;
  formularioMostrado = true;
  void mostrarFormularioGoogle();
}

/** Liga o consentimento à faixa do anúncio (chamado uma vez ao iniciar o app). */
export function instalarConsentimento(): void {
  integrarConsentimento({
    resolver: resolverAgora,
    primeiraAbertura,
    perguntar,
    formularioGoogle,
  });
}
