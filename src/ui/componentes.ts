// Componentes de interface reutilizáveis (design.md seção 3, sprint 3 "Extrato").
import { anexar, h, novoId, type Filho } from './dom';
import { icone, type NomeIcone } from './icones';
import { mascararDataBR, posicaoCursorMascara } from '../domain/datas';
import { formatarBRL } from '../domain/dinheiro';
import { monograma } from '../domain/monograma';

/* ---------- Banner ---------- */

export interface Banner {
  /** Aviso de status (design 3.12): ✓ sucesso, "i" informativo, "!" erro. */
  tipo: 'ok' | 'erro' | 'info';
  linhas: string[];
  testid?: string;
}

export function criarBanner(b: Banner, aoFechar: () => void): HTMLElement {
  const el = h(
    'div',
    {
      class: `banner ${b.tipo === 'erro' ? 'banner-erro' : 'banner-ok'}`,
      role: b.tipo === 'erro' ? 'alert' : 'status',
      tabindex: '-1',
      testid: b.testid ?? (b.tipo === 'erro' ? 'banner-erro' : 'banner'),
    },
    icone(b.tipo === 'erro' ? 'alerta' : b.tipo === 'ok' ? 'check' : 'info', 'ic24'),
    h('div', { class: 'texto' }, b.linhas.map((l) => h('p', {}, l))),
    h('button', { type: 'button', class: 'fechar', 'aria-label': 'Fechar aviso', onclick: aoFechar }, icone('fechar', 'ic24')),
  );
  return el;
}

/* ---------- Marcas de estado (design 3.3) ---------- */

export type TipoSelo = 'logo' | 'teste' | 'subiu' | 'caiu' | 'neutro' | 'cancelada' | 'danificada';
const ICONE_SELO: Record<TipoSelo, NomeIcone> = {
  logo: 'relogio',
  teste: 'ampulheta',
  subiu: 'cima',
  caiu: 'baixo',
  neutro: 'pausa',
  cancelada: 'x',
  danificada: 'alerta',
};
/** Cor da marca: ferrugem (atenção), azul de caneta (teste grátis) ou tinta clara (neutro, inclusive "caiu"). */
const COR_SELO: Record<TipoSelo, 'alerta' | 'teste' | 'neutro'> = {
  logo: 'alerta',
  teste: 'teste',
  subiu: 'alerta',
  caiu: 'neutro',
  neutro: 'neutro',
  cancelada: 'neutro',
  danificada: 'alerta',
};

/** Anotação de extrato: ícone de 14 px + texto 13/600 na cor do estado, sem fundo (antigo "selo"). */
export function selo(tipo: TipoSelo, texto: string, testid: string): HTMLElement {
  return h('span', { class: `estado estado-${COR_SELO[tipo]}`, testid }, icone(ICONE_SELO[tipo]), texto);
}

/* ---------- Dinheiro (design 2.5) ---------- */

/**
 * Valor em reais com "R$" e centavos tratados só por <span>: o textContent continua exatamente o de
 * formatarBRL ("R$ 44,90"), seguido do sufixo de ciclo quando houver ("/mês").
 * `grande`: total de 40 px (R$ e centavos menores e elevados). `lista`: R$ e sufixo menores, centavos do mesmo tamanho.
 */
export function dinheiro(centavos: number, estilo: 'grande' | 'lista', extra: { sufixo?: string; testid?: string; tag?: 'span' | 'p' } = {}): HTMLElement {
  const texto = formatarBRL(centavos);
  const i = texto.indexOf(' ');
  const rs = texto.slice(0, i + 1);
  const numero = texto.slice(i + 1);
  const el = h(extra.tag ?? 'span', { class: `dinheiro-${estilo}`, testid: extra.testid });
  if (estilo === 'grande') {
    const v = numero.lastIndexOf(',');
    anexar(el, [h('span', { class: 'rs' }, rs), numero.slice(0, v), h('span', { class: 'ct' }, numero.slice(v))]);
  } else {
    anexar(el, [h('span', { class: 'rs' }, rs), numero]);
  }
  if (extra.sufixo) el.append(h('span', { class: 'sufixo' }, extra.sufixo));
  return el;
}

/* ---------- Monograma (design 3.5) ---------- */

/** Quadrado com as iniciais do serviço; decorativo (aria-hidden, US-21.CA4). */
export function monogramaEl(nome: string, catalogoId?: string | null, grande = false): HTMLElement {
  const m = monograma(nome, catalogoId);
  return h('span', { class: `mono${grande ? ' mono-grande' : ''}`, 'aria-hidden': 'true', style: `--mono-fundo: ${m.fundo}; --mono-texto: ${m.texto}` }, m.iniciais);
}

/* ---------- Campos ---------- */

export interface Campo<T extends HTMLElement> {
  raiz: HTMLElement;
  controle: T;
  definirErro(msg: string | null): void;
}

interface OpcoesCampo {
  rotulo: string;
  testid: string;
  erroTestid: string;
  ajuda?: string;
}

function montarCampo<T extends HTMLInputElement | HTMLSelectElement>(op: OpcoesCampo, controle: T, envolver?: (c: T) => HTMLElement): Campo<T> {
  const id = controle.id;
  const idAjuda = `ajuda-${id}`;
  const idErro = `erro-${id}`;
  const erro = h('div', { class: 'msg-erro', id: idErro, testid: op.erroTestid, hidden: true });
  const ajuda = op.ajuda ? h('span', { class: 'ajuda', id: idAjuda }, op.ajuda) : null;
  if (ajuda) controle.setAttribute('aria-describedby', idAjuda);
  const raiz = h('div', { class: 'campo' }, h('label', { for: id }, op.rotulo), ajuda, envolver ? envolver(controle) : controle, erro);
  return {
    raiz,
    controle,
    definirErro(msg) {
      erro.replaceChildren();
      if (msg) {
        erro.append(icone('alerta'), h('span', {}, msg));
        erro.hidden = false;
        controle.setAttribute('aria-invalid', 'true');
        controle.setAttribute('aria-describedby', [ajuda ? idAjuda : '', idErro].filter(Boolean).join(' '));
      } else {
        erro.hidden = true;
        controle.removeAttribute('aria-invalid');
        if (ajuda) controle.setAttribute('aria-describedby', idAjuda);
        else controle.removeAttribute('aria-describedby');
      }
    },
  };
}

export function campoTexto(
  op: OpcoesCampo & { valor?: string; inputmode?: string; placeholder?: string; prefixo?: string; tipo?: string; autocomplete?: string },
): Campo<HTMLInputElement> {
  const controle = h('input', {
    id: novoId('campo'),
    class: 'controle',
    type: op.tipo ?? 'text',
    inputmode: op.inputmode,
    placeholder: op.placeholder,
    autocomplete: op.autocomplete ?? 'off',
    testid: op.testid,
  });
  controle.value = op.valor ?? '';
  return montarCampo(op, controle, op.prefixo ? (c) => h('div', { class: 'prefixo' }, h('span', { 'aria-hidden': 'true' }, op.prefixo!), c) : undefined);
}

/**
 * Aplica a máscara dd/mm/aaaa num campo de data: mantém o teclado numérico
 * (inputmode="numeric") e insere as barras enquanto a pessoa digita.
 */
export function aplicarMascaraData(controle: HTMLInputElement): void {
  controle.addEventListener('input', () => {
    const bruto = controle.value;
    const mascarado = mascararDataBR(bruto);
    if (mascarado === bruto) return;
    const cursor = controle.selectionStart ?? bruto.length;
    const digitosAntes = bruto.slice(0, cursor).replace(/\D/g, '').length;
    controle.value = mascarado;
    const pos = cursor >= bruto.length ? mascarado.length : posicaoCursorMascara(mascarado, digitosAntes);
    try {
      controle.setSelectionRange(pos, pos);
    } catch {
      // Alguns navegadores não permitem seleção fora de foco; ignora.
    }
  });
}

export function campoSelecao(op: OpcoesCampo & { opcoes: { valor: string; rotulo: string }[]; valor?: string }): Campo<HTMLSelectElement> {
  const controle = h(
    'select',
    { id: novoId('campo'), class: 'controle', testid: op.testid },
    h('option', { value: '' }, 'Selecione…'),
    op.opcoes.map((o) => h('option', { value: o.valor }, o.rotulo)),
  );
  controle.value = op.valor ?? '';
  return montarCampo(op, controle, (c) => h('div', { class: 'selecao' }, c, icone('chevron-baixo')));
}

/* ---------- Botões ---------- */

type VarianteBotao = 'primario' | 'secundario' | 'perigo' | 'perigo-solido' | 'texto';

export function botao(
  texto: string,
  variante: VarianteBotao,
  aoClicar: (ev: Event) => void,
  extra: { testid?: string; larga?: boolean; icone?: NomeIcone; tipo?: 'button' | 'submit'; attrs?: Record<string, string>; classe?: string } = {},
): HTMLButtonElement {
  const b = h(
    'button',
    {
      type: extra.tipo ?? 'button',
      class: `btn btn-${variante}${extra.larga ? ' btn-larga' : ''}${extra.classe ? ` ${extra.classe}` : ''}`,
      testid: extra.testid,
      onclick: aoClicar,
    },
    extra.icone ? icone(extra.icone, 'ic24') : null,
    texto,
  );
  for (const [k, v] of Object.entries(extra.attrs ?? {})) b.setAttribute(k, v);
  return b;
}

/* ---------- Linha de ação de grupo (design 3.1 e 3.7) ---------- */

/**
 * Linha inteira de um grupo que age (texto na cor da marca) ou navega (com a seta "›").
 * `perigo`: texto ferrugem centralizado (Excluir). `forte`: peso 600 (Reativar).
 */
export function linhaAcao(
  texto: string,
  aoClicar: (ev: Event) => void,
  extra: { testid?: string; seta?: boolean; forte?: boolean; perigo?: boolean; tipo?: 'button' | 'submit'; attrs?: Record<string, string> } = {},
): HTMLButtonElement {
  const classes = ['lin', 'lin-acao', extra.forte ? 'forte' : '', extra.perigo ? 'perigo' : ''].filter(Boolean).join(' ');
  const b = h(
    'button',
    { type: extra.tipo ?? 'button', class: classes, testid: extra.testid, onclick: aoClicar },
    h('span', {}, texto),
    extra.seta ? icone('seta', 'ic seta') : null,
  );
  for (const [k, v] of Object.entries(extra.attrs ?? {})) b.setAttribute(k, v);
  return b;
}

/* ---------- Estado vazio ---------- */

/** Estado vazio (design 3.13): alinhado à esquerda, sem ilustração. */
export function estadoVazio(op: {
  titulo?: string;
  textos: string[];
  botao?: HTMLElement;
  testid: string;
}): HTMLElement {
  return h(
    'div',
    { class: 'vazio', testid: op.testid },
    op.titulo ? h('h2', {}, op.titulo) : null,
    op.textos.map((t) => h('p', {}, t)),
    op.botao,
  );
}

/* ---------- Diálogo de confirmação ---------- */

/** Valor de retorno que marca o diálogo fechado pela troca de rota (não é escolha da pessoa). */
const FECHADO_POR_ROTA = 'rota';

/**
 * Fecha todos os diálogos modais abertos sem executar a ação (BUG-01). Chamado pelo roteador
 * a cada troca de rota (hash, link, Voltar do Android/navegador).
 */
export function fecharDialogosAbertos(): void {
  document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach((d) => d.close(FECHADO_POR_ROTA));
}

/**
 * Abre um <dialog> modal. Resolve true ao confirmar e false ao voltar/Esc.
 * O foco abre no botão seguro ("Voltar") e retorna ao elemento que abriu.
 * `extra`: parágrafo adicional com ícone "i" entre o texto e os botões (ex.: aviso de limite na importação).
 */
export function confirmar(op: { titulo: string; texto: string; rotuloConfirmar: string; extra?: { texto: string; testid: string } }): Promise<boolean> {
  return new Promise((resolver) => {
    const anterior = document.activeElement as HTMLElement | null;
    const idTitulo = novoId('dlg-titulo');
    const idTexto = novoId('dlg-texto');
    let confirmado = false;
    const dlg = h('dialog', { class: 'dialogo', testid: 'confirm-dialog', 'aria-labelledby': idTitulo, 'aria-describedby': idTexto });
    const voltar = botao('Voltar', 'secundario', () => dlg.close(), { testid: 'btn-dialogo-voltar' });
    const ok = botao(op.rotuloConfirmar, 'perigo-solido', () => {
      confirmado = true;
      dlg.close();
    }, { testid: 'btn-confirmar' });
    anexar(dlg, [
      h('h2', { id: idTitulo }, op.titulo),
      h('p', { id: idTexto }, op.texto),
      op.extra ? h('p', { class: 'dialogo-extra', testid: op.extra.testid }, icone('info'), h('span', {}, op.extra.texto)) : null,
      h('div', { class: 'acoes' }, voltar, ok),
    ]);
    dlg.addEventListener('close', () => {
      dlg.remove();
      if (dlg.returnValue === FECHADO_POR_ROTA) return resolver(false);
      if (anterior && anterior.isConnected) anterior.focus();
      resolver(confirmado);
    });
    document.body.append(dlg);
    dlg.showModal();
    voltar.focus();
  });
}

export function paragrafos(textos: Filho[]): HTMLElement[] {
  return textos.filter(Boolean).map((t) => h('p', {}, t));
}

/* ---------- Diálogo informativo (design 3.14, sem ícone) ---------- */

/**
 * Diálogo que não destrói nada (limite, permissão de notificação). Ação principal primária à direita,
 * saída secundária à esquerda com o foco inicial. Resolve true na ação principal; false em sair/Esc;
 * null quando fechado pela troca de rota (nenhuma das ações deve ser executada).
 */
export function dialogoInfo(op: {
  titulo: string;
  textos: string[];
  rotuloPrincipal: string;
  rotuloSaida: string;
  testid: string;
  testidPrincipal: string;
  testidSaida: string;
  alerta?: boolean;
}): Promise<boolean | null> {
  return new Promise((resolver) => {
    const anterior = document.activeElement as HTMLElement | null;
    const idTitulo = novoId('dlg-titulo');
    const idTexto = novoId('dlg-texto');
    let principal = false;
    const dlg = h('dialog', {
      class: 'dialogo',
      testid: op.testid,
      role: op.alerta ? 'alertdialog' : null,
      'aria-labelledby': idTitulo,
      'aria-describedby': idTexto,
    });
    const sair = botao(op.rotuloSaida, 'secundario', () => dlg.close(), { testid: op.testidSaida });
    const ok = botao(op.rotuloPrincipal, 'primario', () => {
      principal = true;
      dlg.close();
    }, { testid: op.testidPrincipal });
    anexar(dlg, [
      h('h2', { id: idTitulo }, op.titulo),
      h('div', { id: idTexto }, op.textos.map((t) => h('p', {}, t))),
      h('div', { class: 'acoes' }, sair, ok),
    ]);
    dlg.addEventListener('close', () => {
      dlg.remove();
      if (dlg.returnValue === FECHADO_POR_ROTA) return resolver(null);
      resolver(principal);
      if (anterior && anterior.isConnected) anterior.focus();
    });
    document.body.append(dlg);
    dlg.showModal();
    sair.focus();
  });
}

/* ---------- Carimbo Pro (design 3.3) ---------- */

export function seloPro(attrs: Record<string, string> = {}): HTMLElement {
  return h('span', { class: 'carimbo', ...attrs }, 'Pro');
}

/* ---------- Recurso Pro no plano grátis (design 3.16) ---------- */

/**
 * Recurso Pro onde ele estaria, sem cadeado nem tracejado. `formato`:
 * - 'grupo' (Ajustes): grupo com bloco (título, descrição e carimbo), prévia opcional e linha "Conhecer o Pro ›";
 *   `tituloOculto` esconde o título quando ele repete o cabeçalho da seção.
 * - 'linha' (Totais): trecho entre divisores com título + carimbo, descrição, prévia e botão texto.
 */
export function cartaoRecursoPro(op: {
  testid: string;
  titulo: string;
  descricao: string[];
  /** Nome do recurso no rótulo acessível do botão ("Conhecer o Pro para <recurso>"). */
  recurso: string;
  previa?: Node | null;
  extra?: Node | null;
  formato?: 'grupo' | 'linha';
  tituloOculto?: boolean;
  aoConhecer: () => void;
}): HTMLElement {
  const idTitulo = novoId('lock-titulo');
  const rotulo = { 'aria-label': `Conhecer o Pro para ${op.recurso}` };
  if (op.formato === 'linha') {
    return h(
      'section',
      { class: 'recurso-pro-linha', testid: op.testid, 'aria-labelledby': idTitulo },
      h('div', { class: 't' }, h('h2', { id: idTitulo }, op.titulo), seloPro()),
      op.descricao.map((d) => h('p', { class: 'nota' }, d)),
      op.previa ?? null,
      op.extra ?? null,
      botao('Conhecer o Pro', 'texto', op.aoConhecer, { testid: 'lock-btn-pro', attrs: rotulo }),
    );
  }
  const titulo = h('h3', { id: idTitulo, class: op.tituloOculto ? 'sr-only' : 't' }, op.titulo);
  return h(
    'section',
    { class: 'grupo recurso-pro', testid: op.testid, 'aria-labelledby': idTitulo },
    h(
      'div',
      { class: 'lin-bloco' },
      op.tituloOculto ? titulo : null,
      h(
        'div',
        { class: 'recurso-pro-desc' },
        h('div', {}, op.tituloOculto ? null : titulo, op.descricao.map((d) => h('p', {}, d))),
        seloPro(),
      ),
    ),
    op.previa ? h('div', { class: 'lin-bloco recurso-pro-previa' }, op.previa) : null,
    op.extra ? h('div', { class: 'lin-bloco' }, op.extra) : null,
    linhaAcao('Conhecer o Pro', op.aoConhecer, { testid: 'lock-btn-pro', seta: true, attrs: rotulo }),
  );
}

/* ---------- Interruptor (design 3.8): linha de grupo com o switch à direita ---------- */

export function interruptor(op: { rotulo: string; testid: string; marcado: boolean; aoMudar: (ligado: boolean, input: HTMLInputElement) => void }): HTMLElement {
  const input = h('input', { type: 'checkbox', role: 'switch', class: 'switch-input', testid: op.testid });
  input.checked = op.marcado;
  input.addEventListener('change', () => op.aoMudar(input.checked, input));
  return h(
    'label',
    { class: 'lin switch' },
    h('span', { class: 'switch-rotulo' }, op.rotulo),
    input,
    h('span', { class: 'switch-trilho', 'aria-hidden': 'true' }, h('span', { class: 'switch-botao' }, icone('check'))),
  );
}
