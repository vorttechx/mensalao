// US-01 / US-05 — Formulário de assinatura (nova ou edição), design.md 4.3.
import { servicoPorId } from '../../domain/catalogo';
import { formatarDataBR, lerDataBR } from '../../domain/datas';
import { centavosParaCampo } from '../../domain/dinheiro';
import { adicionarAssinatura, criarAssinatura, editarAssinatura, substituirAssinatura } from '../../domain/operacoes';
import { CATEGORIAS, CICLOS, FORMAS_PAGAMENTO, type Assinatura } from '../../domain/tipos';
import { ORDEM_CAMPOS, validarFormulario, type CampoFormulario, type EntradaFormulario } from '../../domain/validacao';
import { definirEstado, gerarId, hoje, obterEstado } from '../../loja';
import { botao, campoSelecao, campoTexto, estadoVazio, type Banner, type Campo } from '../componentes';
import { h } from '../dom';
import { avisar, voltar, voltarAte } from '../navegacao';
import type { Tela } from '../tela';
import { textoReajusteBanner } from './comum';

export type ModoFormulario = { modo: 'nova'; catalogoId: string | null } | { modo: 'editar'; id: string };

export function telaFormulario(m: ModoFormulario): Tela {
  const existente: Assinatura | undefined = m.modo === 'editar' ? obterEstado().assinaturas.find((a) => a.id === m.id) : undefined;
  if (m.modo === 'editar' && !existente) {
    return {
      titulo: 'Assinatura não encontrada',
      voltar: () => voltar('#/'),
      conteudo: [estadoVazio({ testid: 'nao-encontrada', ilustracao: false, textos: ['Esta assinatura não existe mais.'] })],
    };
  }
  const servico = m.modo === 'nova' ? servicoPorId(m.catalogoId) : undefined;

  // Valores iniciais: edição usa os dados atuais; catálogo pré-preenche nome, valor, ciclo e categoria.
  const ini = existente
    ? {
        nome: existente.nome,
        valor: centavosParaCampo(existente.valorCentavos),
        ciclo: existente.ciclo as string,
        proxima: formatarDataBR(existente.proxima),
        pagamento: existente.pagamento as string,
        banco: existente.banco,
        categoria: existente.categoria,
        emTeste: existente.emTeste,
        fimTeste: existente.fimTeste ? formatarDataBR(existente.fimTeste) : '',
      }
    : {
        nome: servico?.nome ?? '',
        valor: servico ? centavosParaCampo(servico.valorCentavos) : '',
        ciclo: servico?.ciclo ?? '',
        proxima: '',
        pagamento: '',
        banco: '',
        categoria: servico?.categoria ?? '',
        emTeste: false,
        fimTeste: '',
      };

  const campos: Record<CampoFormulario, Campo<HTMLInputElement | HTMLSelectElement>> = {
    nome: campoTexto({ rotulo: 'Nome', testid: 'field-nome', erroTestid: 'error-nome', valor: ini.nome }),
    valor: campoTexto({
      rotulo: 'Valor (R$)',
      testid: 'field-valor',
      erroTestid: 'error-valor',
      valor: ini.valor,
      inputmode: 'decimal',
      placeholder: '0,00',
      prefixo: 'R$',
      ajuda: servico ? 'Sugestão do catálogo; confira o que você paga.' : undefined,
    }),
    ciclo: campoSelecao({ rotulo: 'Ciclo', testid: 'field-ciclo', erroTestid: 'error-ciclo', opcoes: CICLOS, valor: ini.ciclo }),
    proxima: campoTexto({
      rotulo: 'Próxima cobrança',
      testid: 'field-proxima',
      erroTestid: 'error-proxima',
      valor: ini.proxima,
      inputmode: 'numeric',
      placeholder: 'dd/mm/aaaa',
    }),
    pagamento: campoSelecao({ rotulo: 'Forma de pagamento', testid: 'field-pagamento', erroTestid: 'error-pagamento', opcoes: FORMAS_PAGAMENTO, valor: ini.pagamento }),
    categoria: campoSelecao({
      rotulo: 'Categoria',
      testid: 'field-categoria',
      erroTestid: 'error-categoria',
      opcoes: CATEGORIAS.map((c) => ({ valor: c, rotulo: c })),
      valor: ini.categoria,
    }),
    fimTeste: campoTexto({
      rotulo: 'Fim do teste grátis',
      testid: 'field-fim-teste',
      erroTestid: 'error-fim-teste',
      valor: ini.fimTeste,
      inputmode: 'numeric',
      placeholder: 'dd/mm/aaaa',
    }),
  };
  const banco = campoTexto({
    rotulo: 'Banco ou cartão (opcional)',
    testid: 'field-banco',
    erroTestid: 'error-banco',
    valor: ini.banco,
    placeholder: 'Ex.: Nubank, Itaú, cartão final 1234',
  });

  const teste = h('input', { type: 'checkbox', id: 'campo-teste', testid: 'field-teste' });
  teste.checked = ini.emTeste;
  const blocoFim = campos.fimTeste.raiz;
  blocoFim.hidden = !teste.checked;
  campos.fimTeste.controle.disabled = !teste.checked;
  teste.addEventListener('change', () => {
    blocoFim.hidden = !teste.checked;
    campos.fimTeste.controle.disabled = !teste.checked;
    if (!teste.checked) campos.fimTeste.definirErro(null);
  });

  function lerEntrada(): EntradaFormulario {
    return {
      nome: campos.nome.controle.value,
      valor: campos.valor.controle.value,
      ciclo: campos.ciclo.controle.value,
      proxima: campos.proxima.controle.value,
      pagamento: campos.pagamento.controle.value,
      banco: banco.controle.value,
      categoria: campos.categoria.controle.value,
      emTeste: teste.checked,
      fimTeste: campos.fimTeste.controle.value,
    };
  }

  function salvar(ev: Event): void {
    ev.preventDefault();
    const r = validarFormulario(lerEntrada(), hoje());
    for (const c of ORDEM_CAMPOS) campos[c].definirErro(r.ok ? null : r.erros[c] ?? null);
    if (!r.ok) {
      const primeiro = ORDEM_CAMPOS.find((c) => r.erros[c]);
      if (primeiro) campos[primeiro].controle.focus();
      return;
    }
    const linhas: string[] = [];
    let testid: string | undefined;
    if (existente) {
      const dataFoiAlterada = lerDataBR(campos.proxima.controle.value) !== existente.proxima;
      const editada = editarAssinatura(existente, r.dados, hoje(), dataFoiAlterada);
      definirEstado(substituirAssinatura(obterEstado(), editada));
      const reaj = editada.historico.length > existente.historico.length ? textoReajusteBanner(editada) : '';
      linhas.push(`${editada.nome} salva.${reaj ? ` ${reaj}` : ''}`);
    } else {
      const nova = criarAssinatura(r.dados, { id: gerarId(), hoje: hoje(), catalogoId: servico?.id ?? null });
      definirEstado(adicionarAssinatura(obterEstado(), nova));
      linhas.push(`${nova.nome} salva.`);
    }
    if (r.dataAvancada) {
      linhas.push(`A próxima cobrança estava no passado e foi ajustada para ${formatarDataBR(r.dados.proxima)}.`);
      testid = 'aviso-data-avancada';
    }
    const b: Banner = { tipo: 'ok', linhas, testid };
    avisar(b);
    if (existente) voltarAte((hs) => hs === `#/assinatura/${encodeURIComponent(existente.id)}`, `#/assinatura/${encodeURIComponent(existente.id)}`);
    else voltarAte((hs) => !hs.startsWith('#/nova'), '#/');
  }

  const form = h(
    'form',
    { novalidate: true, testid: 'form-assinatura', onsubmit: salvar },
    campos.nome.raiz,
    campos.valor.raiz,
    campos.ciclo.raiz,
    campos.proxima.raiz,
    campos.pagamento.raiz,
    banco.raiz,
    campos.categoria.raiz,
    h('div', { class: 'campo' }, h('label', { class: 'check', for: 'campo-teste' }, teste, 'Está em teste grátis')),
    blocoFim,
    botao(existente ? 'Salvar alterações' : 'Salvar assinatura', 'primario', () => undefined, { testid: 'btn-salvar', larga: true, tipo: 'submit' }),
  );

  return {
    titulo: existente ? `Editar ${existente.nome}` : 'Nova assinatura',
    voltar: () => voltar(existente ? `#/assinatura/${encodeURIComponent(existente.id)}` : '#/'),
    conteudo: [form],
  };
}
