// Componentes de interface reutilizáveis (design.md seção 3).
import { anexar, h, novoId, type Filho } from './dom';
import { icone, ilustracaoCarteira, type NomeIcone } from './icones';
import { mascararDataBR, posicaoCursorMascara } from '../domain/datas';

/* ---------- Banner ---------- */

export interface Banner {
  /** 'info' = banner informativo neutro (design 8.11), mesmo visual do 'ok' com ícone "i". */
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
    icone(b.tipo === 'erro' ? 'alerta' : 'info', 'ic24'),
    h('div', { class: 'texto' }, b.linhas.map((l) => h('p', {}, l))),
    h('button', { type: 'button', class: 'fechar', 'aria-label': 'Fechar aviso', onclick: aoFechar }, icone('fechar', 'ic24')),
  );
  return el;
}

/* ---------- Selos ---------- */

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

export function selo(tipo: TipoSelo, texto: string, testid: string): HTMLElement {
  return h('span', { class: `selo selo-${tipo}`, testid }, icone(ICONE_SELO[tipo]), texto);
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
  return montarCampo(op, controle);
}

/* ---------- Botões ---------- */

type VarianteBotao = 'primario' | 'secundario' | 'perigo' | 'perigo-solido' | 'texto';

export function botao(
  texto: string,
  variante: VarianteBotao,
  aoClicar: (ev: Event) => void,
  extra: { testid?: string; larga?: boolean; icone?: NomeIcone; tipo?: 'button' | 'submit'; attrs?: Record<string, string> } = {},
): HTMLButtonElement {
  const b = h(
    'button',
    {
      type: extra.tipo ?? 'button',
      class: `btn btn-${variante}${extra.larga ? ' btn-larga' : ''}`,
      testid: extra.testid,
      onclick: aoClicar,
    },
    extra.icone ? icone(extra.icone, 'ic24') : null,
    texto,
  );
  for (const [k, v] of Object.entries(extra.attrs ?? {})) b.setAttribute(k, v);
  return b;
}

/* ---------- Estado vazio ---------- */

export function estadoVazio(op: {
  titulo?: string;
  textos: string[];
  botao?: HTMLElement;
  ilustracao?: boolean;
  testid: string;
}): HTMLElement {
  return h(
    'div',
    { class: 'vazio', testid: op.testid },
    op.ilustracao === false ? null : ilustracaoCarteira(),
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

/* ---------- Diálogo informativo (design 8.10) ---------- */

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
  icone?: NomeIcone;
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
      op.icone ? h('div', { class: 'dialogo-icone' }, icone(op.icone, 'ic24')) : null,
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

/* ---------- Selo Pro (design 8.1) ---------- */

export function seloPro(attrs: Record<string, string> = {}): HTMLElement {
  return h('span', { class: 'selo selo-pro', ...attrs }, icone('moeda'), 'Pro');
}

/* ---------- Cartão de recurso Pro (design 8.3) ---------- */

export function cartaoRecursoPro(op: {
  testid: string;
  titulo: string;
  descricao: string[];
  /** Nome do recurso no rótulo acessível do botão ("Conhecer o Pro para <recurso>"). */
  recurso: string;
  previa?: Node | null;
  extra?: Node | null;
  aoConhecer: () => void;
}): HTMLElement {
  const idTitulo = novoId('lock-titulo');
  return h(
    'section',
    { class: 'cartao-pro', testid: op.testid, 'aria-labelledby': idTitulo },
    h('div', { class: 'cartao-pro-topo' }, h('h3', { id: idTitulo }, op.titulo), seloPro()),
    op.descricao.map((d) => h('p', { class: 'cartao-pro-desc' }, d)),
    op.previa ?? null,
    op.extra ?? null,
    botao('Conhecer o Pro', 'secundario', op.aoConhecer, { testid: 'lock-btn-pro', attrs: { 'aria-label': `Conhecer o Pro para ${op.recurso}` } }),
  );
}

/* ---------- Interruptor (design 8.4) ---------- */

export function interruptor(op: { rotulo: string; testid: string; marcado: boolean; aoMudar: (ligado: boolean, input: HTMLInputElement) => void }): HTMLElement {
  const input = h('input', { type: 'checkbox', role: 'switch', class: 'switch-input', testid: op.testid });
  input.checked = op.marcado;
  input.addEventListener('change', () => op.aoMudar(input.checked, input));
  return h(
    'label',
    { class: 'switch' },
    h('span', { class: 'switch-rotulo' }, op.rotulo),
    input,
    h('span', { class: 'switch-trilho', 'aria-hidden': 'true' }, h('span', { class: 'switch-botao' }, icone('check'))),
  );
}
