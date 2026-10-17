// Pequeno auxiliar para criar elementos do DOM sem framework.

type Valor = string | number | boolean | null | undefined | ((ev: Event) => void);
export type Filho = Node | string | null | undefined | false;

/**
 * Cria um elemento. Atributos: `class`, `testid` (vira data-testid),
 * `on<evento>` (ouvinte), booleanos (true = presente) e demais como atributos.
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, Valor> = {},
  ...filhos: (Filho | Filho[])[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [chave, valor] of Object.entries(attrs)) {
    if (valor === null || valor === undefined || valor === false) continue;
    if (typeof valor === 'function') {
      el.addEventListener(chave.slice(2).toLowerCase(), valor);
    } else if (chave === 'testid') {
      el.dataset.testid = String(valor);
    } else if (valor === true) {
      el.setAttribute(chave, '');
    } else {
      el.setAttribute(chave, String(valor));
    }
  }
  anexar(el, filhos);
  return el;
}

export function anexar(el: Element, filhos: (Filho | Filho[])[]): void {
  for (const f of filhos.flat()) {
    if (f === null || f === undefined || f === false) continue;
    el.append(typeof f === 'string' ? document.createTextNode(f) : f);
  }
}

let contadorId = 0;
/** Gera ids únicos para ligar label/campo/erro. */
export function novoId(prefixo: string): string {
  contadorId += 1;
  return `${prefixo}-${contadorId}`;
}
