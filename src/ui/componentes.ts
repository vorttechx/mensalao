// Componentes de interface reutilizáveis (design.md seção 3).
import { h, novoId, type Filho } from './dom';
import { icone, ilustracaoCarteira, type NomeIcone } from './icones';

/* ---------- Banner ---------- */

export interface Banner {
  tipo: 'ok' | 'erro';
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

export type TipoSelo = 'logo' | 'teste' | 'subiu' | 'caiu' | 'neutro' | 'cancelada';
const ICONE_SELO: Record<TipoSelo, NomeIcone> = {
  logo: 'relogio',
  teste: 'ampulheta',
  subiu: 'cima',
  caiu: 'baixo',
  neutro: 'pausa',
  cancelada: 'x',
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

/**
 * Abre um <dialog> modal. Resolve true ao confirmar e false ao voltar/Esc.
 * O foco abre no botão seguro ("Voltar") e retorna ao elemento que abriu.
 */
export function confirmar(op: { titulo: string; texto: string; rotuloConfirmar: string }): Promise<boolean> {
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
    dlg.append(h('h2', { id: idTitulo }, op.titulo), h('p', { id: idTexto }, op.texto), h('div', { class: 'acoes' }, voltar, ok));
    dlg.addEventListener('close', () => {
      dlg.remove();
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
