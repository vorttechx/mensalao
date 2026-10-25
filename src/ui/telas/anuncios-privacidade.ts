// US-27.CA6 / CA7 / US-26.CA11 — Seção "Anúncios e privacidade" dos Ajustes (design 14.3), logo acima de
// "Sobre". Variantes: grátis com escolha, grátis sem escolha, região do formulário do Google e Pro.
// A troca vale na hora: o rádio é anunciado, o rodapé atualiza a data e a faixa do anúncio segue a 14.1.
import { formatarDataBR, isoDeDate } from '../../domain/datas';
import { varianteAjustes, type EscolhaAnuncios, type VarianteAjustesAnuncios } from '../../domain/consentimento';
import { anunciosDisponiveis } from '../../servicos/anuncios';
import {
  abrirOpcoesGoogle,
  aoMudarConsentimento,
  conhecerRegiao,
  dataEscolha,
  escolhaAtual,
  escolher,
  situacaoGoogle,
} from '../../servicos/consentimento';
import { ehPro, planoAnuncios } from '../../servicos/pro';
import { linhaAcao } from '../componentes';
import { h } from '../dom';
import { linhaPolitica } from '../politica';

const OPCOES: { id: EscolhaAnuncios; nome: string; testid: string }[] = [
  { id: 'personalizado', nome: 'Anúncios personalizados', testid: 'consent-ajustes-personalizado' },
  { id: 'nao-personalizado', nome: 'Anúncios não personalizados', testid: 'consent-ajustes-nao-personalizado' },
];

const BLOCO_GRATIS = 'A versão grátis mostra anúncios do Google no rodapé do Início, de Assinaturas e de Totais.';
const BLOCO_PRO = 'Você é Pro: o Mensalão não mostra anúncios nem carrega o sistema de anúncios do Google.';

function variante(): VarianteAjustesAnuncios {
  return varianteAjustes({ pro: ehPro(), escolha: escolhaAtual(), google: situacaoGoogle() });
}

function textoRodape(v: VarianteAjustesAnuncios): string | null {
  if (v === 'pro') return null;
  if (v === 'google') return 'Na sua região, a escolha é feita no formulário de privacidade do Google.';
  const data = dataEscolha();
  if (v === 'sem-escolha' || data === null) return 'Você ainda não escolheu. O app não mostra anúncios até você escolher.';
  const dia = formatarDataBR(isoDeDate(new Date(data)));
  return `Escolha feita em ${dia}. Vale só para os anúncios: o Google não vê suas assinaturas. O ID de publicidade pode ser redefinido nas configurações do Android.`;
}

function bloco(texto: string): HTMLElement {
  return h('div', { class: 'lin-bloco' }, h('p', { class: 'consent-bloco' }, texto));
}

function radios(): HTMLElement {
  const atual = escolhaAtual();
  return h(
    'fieldset',
    { class: 'consent-opcoes' },
    h('legend', { class: 'sr-only' }, 'Tipo de anúncio'),
    OPCOES.map((o) => {
      const id = `consent-${o.id}`;
      const input = h('input', { type: 'radio', name: 'consent', value: o.id, id, class: 'radio', testid: o.testid });
      input.checked = o.id === atual; // sem escolha (ou ilegível), nenhum marcado (US-27.CA12)
      input.addEventListener('change', () => {
        if (input.checked) escolher(o.id);
      });
      return h('label', { class: 'lin opcao-consent', for: id }, h('span', { class: 'nome-consent' }, o.nome), input);
    }),
  );
}

function montar(v: VarianteAjustesAnuncios): { grupo: HTMLElement; rodape: HTMLElement | null } {
  const filhos: HTMLElement[] = [];
  if (v === 'pro') filhos.push(bloco(BLOCO_PRO));
  else {
    filhos.push(bloco(BLOCO_GRATIS));
    if (v === 'google') {
      filhos.push(linhaAcao('Opções de privacidade do Google', () => void abrirOpcoesGoogle(), { testid: 'consent-opcoes-google', seta: true }));
    } else filhos.push(radios());
  }
  filhos.push(linhaPolitica('consent-link-privacidade'));
  const texto = textoRodape(v);
  return {
    grupo: h('div', { class: 'grupo' }, filhos),
    rodape: texto === null ? null : h('p', { class: 'g-rodape', testid: 'consent-ajustes-data' }, texto),
  };
}

export function secaoAnunciosPrivacidade(): HTMLElement {
  const secao = h('section', { 'aria-labelledby': 'titulo-anuncios', testid: 'consent-ajustes' });
  const titulo = h('h2', { class: 'g-titulo', id: 'titulo-anuncios' }, 'Anúncios e privacidade');
  let atual = variante();
  const preencher = (): void => {
    const m = montar(atual);
    secao.replaceChildren(titulo, m.grupo, ...(m.rodape ? [m.rodape] : []));
  };
  preencher();

  // A região (UMP) só é consultada para o plano grátis efetivo com o SDK presente (US-27.CA9).
  if (!ehPro() && planoAnuncios() === 'gratis' && anunciosDisponiveis() === true) conhecerRegiao();

  const parar = aoMudarConsentimento(() => {
    if (!secao.isConnected) return parar();
    const nova = variante();
    if (nova !== atual && !(atual === 'sem-escolha' && nova === 'com-escolha') && !(atual === 'com-escolha' && nova === 'sem-escolha')) {
      atual = nova;
      preencher();
      return;
    }
    // Mesma variante (troca de rádio): só o estado dos rádios e o rodapé, sem tirar o foco do rádio.
    atual = nova;
    const escolha = escolhaAtual();
    secao.querySelectorAll<HTMLInputElement>('input[name="consent"]').forEach((i) => (i.checked = i.value === escolha));
    const rodape = secao.querySelector('[data-testid="consent-ajustes-data"]');
    const texto = textoRodape(nova);
    if (rodape && texto) rodape.textContent = texto;
  });
  return secao;
}
