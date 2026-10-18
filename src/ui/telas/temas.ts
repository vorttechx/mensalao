// US-17 — Seção "Temas" dos Ajustes (design 8.5 e 9.8).
import { TEMA_PADRAO, type IdTema } from '../../domain/preferencias';
import { alterarPrefs, obterPrefs } from '../../servicos/preferencias';
import { ehPro } from '../../servicos/pro';
import { renderizar } from '../app';
import { cartaoRecursoPro } from '../componentes';
import { h } from '../dom';
import { avisar, navegar } from '../navegacao';
import { aplicarTema, nomeCurto, TEMAS_INFO } from '../temas';

function bolinhas(cores: string[]): HTMLElement {
  return h('span', { class: 'bolinhas' }, cores.map((c) => h('i', { style: `background: ${c}` })));
}

function escolher(id: IdTema): void {
  alterarPrefs((p) => ({ ...p, tema: id }));
  aplicarTema();
  avisar({ tipo: 'ok', linhas: [`Tema ${nomeCurto(id)} aplicado.`], testid: 'tema-aplicado' });
  renderizar();
}

export function secaoTemas(): HTMLElement {
  const titulo = h('h2', { class: 'secao', id: 'titulo-temas' }, 'Temas');
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
        previa: h('div', { class: 'previa previa-temas', 'aria-hidden': 'true' }, extras.map((t) => bolinhas(t.claro))),
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
      { class: 'temas', testid: 'temas-lista' },
      h('legend', {}, 'Tema do app'),
      TEMAS_INFO.map((t) => {
        const input = h('input', { type: 'radio', name: 'tema', value: t.id, testid: `tema-${t.id}`, id: `tema-${t.id}` });
        input.checked = t.id === atual;
        input.addEventListener('change', () => {
          if (input.checked) escolher(t.id);
        });
        return h(
          'label',
          { class: `opcao-tema${t.id === atual ? ' selecionado' : ''}`, for: `tema-${t.id}` },
          input,
          h('span', { class: 'previa-tema', 'aria-hidden': 'true' }, bolinhas(t.claro), bolinhas(t.escuro)),
          h('span', { class: 'nome-tema' }, t.nome),
          t.id === atual ? h('span', { class: 'em-uso' }, 'Em uso') : null,
        );
      }),
    ),
    h('p', { class: 'nota' }, 'Os temas seguem o modo claro ou escuro do seu celular.'),
  );
}
