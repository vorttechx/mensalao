// US-01 — Nova assinatura, passo 1: busca no catálogo ou cadastro livre (design.md 4.2).
import { buscarCatalogo, type ServicoCatalogo } from '../../domain/catalogo';
import { formatarBRL } from '../../domain/dinheiro';
import { sufixoCiclo } from '../../domain/tipos';
import { botao } from '../componentes';
import { h } from '../dom';
import { icone } from '../icones';
import { avisarLimite, guardarTelaDeCadastro, podeAdicionar } from '../limite';
import { navegar, voltar } from '../navegacao';

/** Segue para o formulário só se houver vaga (US-09.CA2); senão, diálogo de limite. */
function irPara(hash: string): void {
  if (podeAdicionar()) navegar(hash);
  else void avisarLimite({ sobreTela: true });
}
import type { Tela } from '../tela';

function itemCatalogo(s: ServicoCatalogo): HTMLElement {
  return h(
    'li',
    {},
    h(
      'button',
      { type: 'button', class: 'cat', testid: 'catalog-item', 'data-catalogo-id': s.id, onclick: () => irPara(`#/nova/form/${encodeURIComponent(s.id)}`) },
      h('b', {}, s.nome),
      h('span', {}, `${formatarBRL(s.valorCentavos)}${sufixoCiclo(s.ciclo)} · ${s.categoria}`),
    ),
  );
}

export function telaCatalogo(): Tela {
  const lista = h('ul', { class: 'cartao-lista', testid: 'catalog-list', 'aria-labelledby': 'titulo-catalogo' });
  const anuncio = h('p', { class: 'sr-only', 'aria-live': 'polite', testid: 'catalog-contagem' });
  const semResultado = h('p', { class: 'nota', testid: 'catalog-vazio', hidden: true });

  const busca = h('input', {
    id: 'busca-catalogo',
    class: 'controle',
    type: 'search',
    placeholder: 'Ex.: Netflix, academia',
    autocomplete: 'off',
    testid: 'catalog-search',
  });

  function filtrar(): void {
    const termo = busca.value;
    const achados = buscarCatalogo(termo);
    lista.replaceChildren(...achados.map(itemCatalogo));
    lista.hidden = achados.length === 0;
    semResultado.hidden = achados.length > 0;
    semResultado.textContent = `Nenhum serviço encontrado para "${termo.trim()}". Use Cadastrar livremente.`;
    if (termo.trim() !== '') {
      anuncio.textContent = achados.length === 1 ? '1 serviço encontrado' : `${achados.length} serviços encontrados`;
    } else anuncio.textContent = '';
  }
  busca.addEventListener('input', filtrar);
  filtrar();
  guardarTelaDeCadastro();

  return {
    titulo: 'Nova assinatura',
    voltar: () => voltar('#/'),
    conteudo: [
      h(
        'div',
        { class: 'campo' },
        h('label', { for: 'busca-catalogo' }, 'Buscar serviço'),
        h('div', { class: 'prefixo busca' }, icone('busca'), busca),
      ),
      botao('Cadastrar livremente', 'secundario', () => irPara('#/nova/form'), { testid: 'btn-cadastrar-livre', larga: true }),
      h('h2', { class: 'secao', id: 'titulo-catalogo' }, 'Serviços conhecidos'),
      anuncio,
      lista,
      semResultado,
      h('p', { class: 'nota' }, 'Valores sugeridos podem estar desatualizados. Você confere antes de salvar.'),
    ],
  };
}
