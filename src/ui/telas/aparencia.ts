// US-19.CA7 a CA10 — Seção "Aparência" dos Ajustes (design 3.10a, 4.7 e 4.8, UX-S3-12). Só no Pro (D-07).
import { type Aparencia } from '../../domain/preferencias';
import { alterarPrefs, obterPrefs } from '../../servicos/preferencias';
import { ehPro } from '../../servicos/pro';
import { cartaoRecursoPro } from '../componentes';
import { h } from '../dom';
import { navegar } from '../navegacao';
import { aplicarTema } from '../temas';

const OPCOES: { id: Aparencia; nome: string }[] = [
  { id: 'auto', nome: 'Automático' },
  { id: 'claro', nome: 'Claro' },
  { id: 'escuro', nome: 'Escuro' },
];

/** Troca imediata, sem banner nem remontagem: o foco fica no rádio e o leitor de tela anuncia o marcado. */
function escolher(id: Aparencia): void {
  alterarPrefs((p) => ({ ...p, aparencia: id }));
  aplicarTema();
}

export function secaoAparencia(): HTMLElement {
  const titulo = h('h2', { class: 'g-titulo', id: 'titulo-aparencia' }, 'Aparência');
  if (!ehPro()) {
    // Grátis ou Pro revogado: recurso Pro em linha (3.16) e o app segue o celular (US-19.CA8, CA9).
    return h(
      'section',
      { 'aria-labelledby': 'titulo-aparencia' },
      titulo,
      cartaoRecursoPro({
        testid: 'lock-aparencia',
        titulo: 'Aparência',
        tituloOculto: true,
        descricao: ['Escolha entre claro, escuro ou automático.'],
        recurso: 'escolher a aparência',
        aoConhecer: () => navegar('#/pro'),
      }),
      h('p', { class: 'g-rodape' }, 'Hoje o app segue o modo do celular.'),
    );
  }
  const atual = obterPrefs().aparencia;
  return h(
    'section',
    { 'aria-labelledby': 'titulo-aparencia' },
    titulo,
    h(
      'fieldset',
      { class: 'grupo aparencias', testid: 'aparencia-lista' },
      h('legend', { class: 'sr-only' }, 'Aparência'),
      OPCOES.map((o) => {
        const input = h('input', { type: 'radio', name: 'aparencia', value: o.id, testid: `aparencia-${o.id}`, id: `aparencia-${o.id}`, class: 'radio' });
        input.checked = o.id === atual;
        input.addEventListener('change', () => {
          if (input.checked) escolher(o.id);
        });
        return h('label', { class: 'lin opcao-aparencia', for: `aparencia-${o.id}` }, h('span', { class: 'nome-aparencia' }, o.nome), input);
      }),
    ),
    h('p', { class: 'g-rodape' }, 'Automático segue o modo do seu celular.'),
  );
}
