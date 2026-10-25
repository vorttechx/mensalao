// US-02 / US-20 — Início: total do mês, régua do mês e próximas cobranças com destaques (design 4.1).
import { formatarDataBR } from '../../domain/datas';
import { listarProximas, textoFimTeste, textoJanelaAviso, textoVenceLogo, type ItemProximo } from '../../domain/proximas';
import { calcularTotais } from '../../domain/totais';
import { hoje, obterEstado } from '../../loja';
import { botao, dinheiro, estadoVazio, selo } from '../componentes';
import { h } from '../dom';
import { icone } from '../icones';
import { adicionar, contadorLimite } from '../limite';
import type { Tela } from '../tela';
import { lembreteExportar } from './copias';
import { avisoLembretes } from './lembretes';
import { reguaDoMes } from './regua';
import { itemAssinatura, metaCobrancaCurta, selosReajuste } from './comum';

function itemProximo(i: ItemProximo, dia: string): HTMLElement {
  const a = i.assinatura;
  const selos: HTMLElement[] = [];
  if (i.seloTeste && i.diasFimTeste !== null) selos.push(selo('teste', textoFimTeste(i.diasFimTeste), 'badge-teste-fim'));
  if (i.seloVence) selos.push(selo('logo', textoVenceLogo(i.diasAteCobranca), 'badge-vence-logo'));
  selos.push(...selosReajuste(a));
  const aviso = i.testeTerminouEm
    ? h('span', { class: 'nota-item', testid: 'aviso-teste-terminou' }, icone('info'), `Teste terminou em ${formatarDataBR(i.testeTerminouEm)} — agora é cobrança normal`)
    : null;
  return itemAssinatura(a, { testid: 'upcoming-item', valorCentavos: a.valorCentavos, meta: metaCobrancaCurta(a, dia), selos, aviso });
}

/** Total por mês como tipografia sobre o papel (mesmo cálculo de Totais, US-20.CA1). */
function resumo(mensalCentavos: number): HTMLElement {
  return h(
    'div',
    { class: 'resumo', testid: 'inicio-resumo' },
    h('p', { class: 'rotulo' }, 'Total por mês'),
    dinheiro(mensalCentavos, 'grande', { testid: 'inicio-total', tag: 'p' }),
  );
}

export function telaInicio(): Tela {
  const estado = obterEstado();
  const dia = hoje();
  const n = estado.config.diasAviso;
  const itens = listarProximas(estado.assinaturas, dia, n);
  const total = calcularTotais(estado.assinaturas, dia).mensalCentavos;
  // O total e a régua ficam sempre no alto: são o trabalho da tela (design 4.1).
  const topo = [resumo(total), reguaDoMes(estado.assinaturas, dia)];

  if (itens.length === 0) {
    const temOutras = estado.assinaturas.length > 0;
    return {
      titulo: 'Próximas cobranças',
      marca: true,
      aba: 'inicio',
      antesDoTitulo: topo,
      conteudo: [
        estadoVazio({
          testid: 'empty-state',
          titulo: 'Nenhuma cobrança por aqui',
          textos: temOutras
            ? ['Nenhuma assinatura ativa no momento. As pausadas e canceladas ficam em Assinaturas.']
            : ['Cadastre suas assinaturas para ver o que vai ser cobrado e quando.', 'Seus dados ficam só neste celular.'],
          botao: botao('Adicionar assinatura', 'primario', adicionar, { testid: 'btn-adicionar-vazio' }),
        }),
        contadorLimite(),
      ],
    };
  }

  return {
    titulo: 'Próximas cobranças',
    marca: true,
    aba: 'inicio',
    adicionar: true,
    subtitulo: textoJanelaAviso(n),
    antesDoTitulo: [...topo, avisoLembretes(), lembreteExportar()],
    conteudo: [
      h('ul', { class: 'lista', testid: 'upcoming-list', 'aria-label': 'Próximas cobranças' }, itens.map((i) => itemProximo(i, dia))),
      contadorLimite(),
    ],
  };
}
