// Tela inicial (provisória na US-01: lista as assinaturas ativas).
import { obterEstado } from '../../loja';
import { h } from '../dom';
import type { Tela } from '../tela';
import { itemAssinatura, metaCobranca, valorSimples } from './comum';

export function telaInicio(): Tela {
  const ativas = obterEstado().assinaturas.filter((a) => a.status === 'ativa');
  return {
    titulo: 'Próximas cobranças',
    marca: true,
    aba: 'inicio',
    fab: true,
    conteudo: [
      h('ul', { class: 'lista', testid: 'upcoming-list' }, ativas.map((a) => itemAssinatura(a, { testid: 'upcoming-item', valor: valorSimples(a), meta: metaCobranca(a) }))),
    ],
  };
}
