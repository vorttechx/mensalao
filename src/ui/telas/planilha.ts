// US-15 / US-22 — Exportar planilha CSV (design 4.7 e 4.8). Gerado no aparelho, sem rede.
// US-28 — No grátis, a oferta opcional do anúncio premiado (design 14.4): assistir até o fim libera UMA
// exportação da planilha CSV. As mensagens ficam logo abaixo do grupo, perto de onde a pessoa tocou.
import { gerarCsv, nomeArquivoCsv } from '../../domain/csv';
import { hoje, obterEstado } from '../../loja';
import type { ResultadoArquivo } from '../../plataforma/provedor';
import { aoMudarAnuncios } from '../../servicos/anuncios';
import { assistirPremiado, haCredito, ofertaAtual, usarCredito } from '../../servicos/premiado';
import { ehPro } from '../../servicos/pro';
import { renderizar } from '../app';
import { LINHAS_ERRO_ARQUIVO, salvadorArquivos } from '../backup';
import { cartaoRecursoPro, criarBanner, dialogoInfo, linhaAcao, type Banner } from '../componentes';
import { h } from '../dom';
import { icone } from '../icones';
import { avisar, navegar } from '../navegacao';

async function salvarCsv(): Promise<{ nome: string; r: ResultadoArquivo }> {
  const dia = hoje();
  const nome = nomeArquivoCsv(dia);
  const r = await salvadorArquivos.salvar(nome, gerarCsv(obterEstado(), dia), 'text/csv;charset=utf-8');
  return { nome, r };
}

function bannerSucesso(nome: string): Banner {
  return obterEstado().assinaturas.length === 0
    ? { tipo: 'info', linhas: ['Você ainda não tem assinaturas; o arquivo contém só o cabeçalho'], testid: 'csv-vazio' }
    : { tipo: 'ok', linhas: [`Planilha exportada: ${nome}`], testid: 'csv-ok' };
}

async function exportarCsv(): Promise<void> {
  if (!ehPro()) return;
  const { nome, r } = await salvarCsv();
  if (r === 'cancelado') return;
  if (r === 'erro') avisar({ tipo: 'erro', linhas: LINHAS_ERRO_ARQUIVO, testid: 'csv-erro' });
  else avisar(bannerSucesso(nome));
  renderizar();
}

/* ---------- Grátis: recurso Pro + premiado ---------- */

const MSG_FECHADO = 'O anúncio não foi concluído. Nenhuma exportação foi liberada.';
const MSG_SEM_ANUNCIO = 'Não há anúncio disponível agora. Tente mais tarde ou conheça o Pro.';
const MSG_ERRO_ARQUIVO = 'Não foi possível gerar o arquivo. Sua exportação liberada continua guardada.';

let carregando = false;
let mensagem: Banner | null = null;
let atualizar: (() => void) | null = null;
let ouvindo = false;

function focarOrigem(secao: HTMLElement): void {
  const alvo =
    secao.querySelector<HTMLElement>('[data-testid="premiado-oferta"]') ??
    secao.querySelector<HTMLElement>('[data-testid="premiado-credito-usar"]') ??
    secao.querySelector<HTMLElement>('[data-testid="lock-btn-pro"]');
  alvo?.focus();
}

/** Entrega o CSV com o crédito: consome só depois de o arquivo sair (US-28.CA6). */
async function usarExportacaoLiberada(secao: HTMLElement): Promise<void> {
  if (!haCredito() || ehPro()) return;
  const { nome, r } = await salvarCsv();
  if (r === 'ok') {
    usarCredito();
    mensagem = bannerSucesso(nome);
  } else if (r === 'erro') {
    mensagem = { tipo: 'erro', linhas: [MSG_ERRO_ARQUIVO], testid: 'premiado-msg' };
  } // cancelado (folha de compartilhar fechada): nenhuma mensagem e o crédito fica guardado
  atualizar?.();
  focarOrigem(secao);
}

async function oferecer(secao: HTMLElement): Promise<void> {
  const ok = await dialogoInfo({
    titulo: 'Assistir a um anúncio?',
    textos: ['É um anúncio em vídeo do Google, com alguns segundos. Você ganha uma exportação da planilha CSV.'],
    rotuloPrincipal: 'Assistir',
    rotuloSaida: 'Agora não',
    variantePrincipal: 'secundario',
    testid: 'premiado-dialogo',
    testidPrincipal: 'premiado-btn-assistir',
    testidSaida: 'premiado-btn-agora-nao',
  });
  if (ok !== true) return;
  carregando = true;
  mensagem = null;
  atualizar?.();
  secao.querySelector<HTMLElement>('[data-testid="premiado-oferta"]')?.focus();
  const r = await assistirPremiado();
  carregando = false;
  if (r === 'premiado') {
    atualizar?.();
    await usarExportacaoLiberada(secao); // o CSV sai na hora (US-28.CA3)
    return;
  }
  mensagem = { tipo: 'info', linhas: [r === 'fechado' ? MSG_FECHADO : MSG_SEM_ANUNCIO], testid: 'premiado-msg' };
  atualizar?.();
  focarOrigem(secao); // US-28.CA11: o foco volta à linha de origem
}

function linhasPremiado(secao: HTMLElement): Node[] {
  if (carregando) {
    return [
      h(
        'button',
        { type: 'button', class: 'lin lin-acao premiado-carregando', disabled: true, 'aria-busy': 'true', testid: 'premiado-oferta' },
        icone('girar'),
        h('span', {}, 'Carregando o anúncio…'),
      ),
    ];
  }
  const oferta = ofertaAtual();
  if (oferta === 'oferta') {
    return [linhaAcao('Assistir a um anúncio para exportar uma vez', () => void oferecer(secao), { testid: 'premiado-oferta' })];
  }
  if (oferta === 'credito') {
    return [
      h(
        'div',
        { class: 'lin-bloco', testid: 'premiado-credito' },
        h('p', { class: 't' }, '1 exportação liberada'),
        h('p', { class: 'd' }, 'Ganha com um anúncio. Não expira.'),
      ),
      linhaAcao('Exportar CSV', () => void usarExportacaoLiberada(secao), { testid: 'premiado-credito-usar' }),
    ];
  }
  return [];
}

function secaoPlanilhaGratis(titulo: HTMLElement): HTMLElement {
  const secao = h('section', { 'aria-labelledby': 'titulo-planilha' });
  mensagem = null;
  const preencher = (): void => {
    const linhas = linhasPremiado(secao);
    const comOferta = carregando || ofertaAtual() === 'oferta';
    const msg = mensagem
      ? criarBanner(mensagem, () => {
          mensagem = null;
          preencher();
          focarOrigem(secao);
        })
      : null;
    msg?.classList.add('status-perto');
    secao.replaceChildren(
      ...[
        titulo,
        cartaoRecursoPro({
          testid: 'lock-csv',
          titulo: 'Exportar planilha CSV',
          descricao: ['Abra suas assinaturas no Excel ou no Google Planilhas.'],
          recurso: 'exportar planilha CSV',
          antesDoPro: linhas,
          aoConhecer: () => navegar('#/pro'),
        }),
        msg,
        comOferta ? h('p', { class: 'g-rodape', testid: 'premiado-ajuda' }, 'O anúncio é um vídeo do Google de alguns segundos. A exportação liberada não expira.') : null,
      ].filter((n): n is HTMLElement => n !== null),
    );
  };
  preencher();
  atualizar = () => {
    if (secao.isConnected) preencher();
  };
  if (!ouvindo) {
    ouvindo = true;
    // Disponibilidade do SDK e consentimento chegam depois: a oferta entra sem remontar Ajustes.
    aoMudarAnuncios(() => {
      if (!carregando) atualizar?.();
    });
  }
  return secao;
}

export function secaoPlanilha(): HTMLElement {
  const titulo = h('h2', { class: 'g-titulo', id: 'titulo-planilha' }, 'Planilha');
  if (!ehPro()) return secaoPlanilhaGratis(titulo);
  return h(
    'section',
    { 'aria-labelledby': 'titulo-planilha' },
    titulo,
    h('div', { class: 'grupo' }, linhaAcao('Exportar CSV', () => void exportarCsv(), { testid: 'btn-exportar-csv' })),
    h('p', { class: 'g-rodape' }, 'Arquivo CSV para Excel ou Google Planilhas, com todas as assinaturas (ativas, pausadas e canceladas).'),
  );
}
