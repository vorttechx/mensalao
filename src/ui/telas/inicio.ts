// US-02 — Início: próximas cobranças com destaques (design.md 4.1).
import { formatarDataBR } from '../../domain/datas';
import { listarProximas, textoFimTeste, textoJanelaAviso, textoVenceLogo, type ItemProximo } from '../../domain/proximas';
import { hoje, obterEstado } from '../../loja';
import { botao, estadoVazio, selo } from '../componentes';
import { h } from '../dom';
import { icone } from '../icones';
import { adicionar, contadorLimite } from '../limite';
import type { Tela } from '../tela';
import { avisoLembretes } from './lembretes';
import { itemAssinatura, metaCobranca, selosReajuste, valorSimples } from './comum';

function itemProximo(i: ItemProximo): HTMLElement {
  const a = i.assinatura;
  const selos: HTMLElement[] = [];
  if (i.seloTeste && i.diasFimTeste !== null) selos.push(selo('teste', textoFimTeste(i.diasFimTeste), 'badge-teste-fim'));
  if (i.seloVence) selos.push(selo('logo', textoVenceLogo(i.diasAteCobranca), 'badge-vence-logo'));
  selos.push(...selosReajuste(a));
  const aviso = i.testeTerminouEm
    ? h('div', { class: 'aviso', testid: 'aviso-teste-terminou' }, icone('info'), `Teste terminou em ${formatarDataBR(i.testeTerminouEm)} — agora é cobrança normal`)
    : null;
  return itemAssinatura(a, { testid: 'upcoming-item', valor: valorSimples(a), meta: metaCobranca(a), selos, aviso });
}

export function telaInicio(): Tela {
  const estado = obterEstado();
  const n = estado.config.diasAviso;
  const itens = listarProximas(estado.assinaturas, hoje(), n);

  if (itens.length === 0) {
    const temOutras = estado.assinaturas.length > 0;
    return {
      titulo: 'Próximas cobranças',
      marca: true,
      aba: 'inicio',
      conteudo: [
        contadorLimite(),
        estadoVazio({
          testid: 'empty-state',
          titulo: 'Nenhuma cobrança por aqui',
          textos: temOutras
            ? ['Nenhuma assinatura ativa no momento. As pausadas e canceladas ficam em Assinaturas.']
            : ['Cadastre suas assinaturas para ver o que vai ser cobrado e quando.', 'Seus dados ficam só neste celular.'],
          botao: botao('Adicionar assinatura', 'primario', adicionar, { testid: 'btn-adicionar-vazio', icone: 'mais' }),
        }),
      ],
    };
  }

  return {
    titulo: 'Próximas cobranças',
    marca: true,
    aba: 'inicio',
    fab: true,
    subtitulo: textoJanelaAviso(n),
    conteudo: [contadorLimite(), avisoLembretes(), h('ul', { class: 'lista', testid: 'upcoming-list', 'aria-label': 'Próximas cobranças' }, itens.map(itemProximo))],
  };
}
