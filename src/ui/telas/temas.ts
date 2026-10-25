// US-17 / US-22 — Seção "Temas" dos Ajustes (design 3.10 e 4.8).
import { TEMA_PADRAO, type IdTema } from '../../domain/preferencias';
import { alterarPrefs, obterPrefs } from '../../servicos/preferencias';
import { ehPro } from '../../servicos/pro';
import { renderizar } from '../app';
import { cartaoRecursoPro } from '../componentes';
import { h } from '../dom';
import { avisar, navegar } from '../navegacao';
import { aplicarTema, nomeCurto, TEMAS_INFO } from '../temas';

/** Amostras do tema (design 3.10): papel claro e papel escuro, cada um com um traço na marca. */
function amostras(t: { claro: [string, string]; escuro: [string, string] }, classe = 'amostras'): HTMLElement {
  return h(
    'span',
    { class: classe, 'aria-hidden': 'true' },
    [t.claro, t.escuro].map(([papel, marca]) => h('i', { style: `--amostra-papel: ${papel}; --amostra-marca: ${marca}` })),
  );
}

function escolher(id: IdTema): void {
  alterarPrefs((p) => ({ ...p, tema: id }));
  aplicarTema();
  avisar({ tipo: 'ok', linhas: [`Tema ${nomeCurto(id)} aplicado.`], testid: 'tema-aplicado' });
  renderizar();
}

export function secaoTemas(): HTMLElement {
  const titulo = h('h2', { class: 'g-titulo', id: 'titulo-temas' }, 'Temas');
  if (!ehPro()) {
    const extras = TEMAS_INFO.filter((t) => t.id !== TEMA_PADRAO);
    return h(
      'section',
      { 'aria-labelledby': 'titulo-temas' },
      titulo,
      cartaoRecursoPro({
        testid: 'lock-temas',
        titulo: 'Temas de cores',
        descricao: [
          'Mais 3 temas no Pro: Azul-noite, Grafite e Ameixa, cada um no claro e no escuro. O verde-cédula, com claro e escuro automáticos, continua no grátis.',
        ],
        recurso: 'temas de cores',
        previa: h('div', { class: 'previa-temas', 'aria-hidden': 'true' }, extras.map((t) => amostras(t))),
        aoConhecer: () => navegar('#/pro'),
      }),
    );
  }
  const atual = obterPrefs().tema;
  return h(
    'section',
    { 'aria-labelledby': 'titulo-temas' },
    titulo,
    h(
      'fieldset',
      { class: 'grupo temas', testid: 'temas-lista' },
      h('legend', { class: 'sr-only' }, 'Tema do app'),
      TEMAS_INFO.map((t) => {
        const input = h('input', { type: 'radio', name: 'tema', value: t.id, testid: `tema-${t.id}`, id: `tema-${t.id}`, class: 'radio' });
        input.checked = t.id === atual;
        input.addEventListener('change', () => {
          if (input.checked) escolher(t.id);
        });
        return h(
          'label',
          { class: `lin opcao-tema${t.id === atual ? ' selecionado' : ''}`, for: `tema-${t.id}` },
          amostras(t, 'amostras previa-tema'),
          h('span', { class: 'nome-tema' }, t.nome, t.id === atual ? h('small', { class: 'em-uso' }, 'Em uso') : null),
          input,
        );
      }),
    ),
    h('p', { class: 'g-rodape' }, 'Os temas seguem o modo claro ou escuro do seu celular.'),
  );
}
