// US-09 — Limite do plano grátis na interface: contador (design 8.2) e diálogo de limite (design 9.1).
// O diálogo só abre por ação da pessoa (adicionar ou reativar), nunca sozinho.
import { contarAtivas, LIMITE_GRATIS, podeAtivarMais, textoContador } from '../domain/plano';
import { obterEstado } from '../loja';
import { ehPro } from '../servicos/pro';
import { botao, dialogoInfo } from './componentes';
import { h } from './dom';
import { navegar, substituir, voltar } from './navegacao';

let dialogoAberto = false;

/** Ainda cabe mais uma assinatura ativa no plano atual? */
export function podeAdicionar(): boolean {
  return podeAtivarMais(obterEstado(), ehPro());
}

/**
 * Abre o diálogo de limite. `sobreTela`: a pessoa já está no catálogo/formulário (ex.: URL digitada);
 * "Agora não" volta para a tela anterior e "Conhecer o Pro" troca a tela atual pela Pro.
 */
export async function avisarLimite(op: { reativarNome?: string; sobreTela?: boolean } = {}): Promise<void> {
  if (dialogoAberto) return;
  dialogoAberto = true;
  const apoio = op.reativarNome
    ? `Para reativar ${op.reativarNome}, pause ou cancele outra antes, ou conheça o Pro.`
    : 'Para adicionar outra, pause ou cancele uma que você não usa, ou conheça o Pro: compra única, assinaturas ilimitadas.';
  const irPro = await dialogoInfo({
    titulo: `Você chegou ao limite de ${LIMITE_GRATIS} assinaturas ativas do plano grátis`,
    textos: [apoio],
    rotuloPrincipal: 'Conhecer o Pro',
    rotuloSaida: 'Agora não',
    testid: 'limite-aviso',
    testidPrincipal: 'limite-btn-pro',
    testidSaida: 'limite-btn-agora-nao',
    alerta: true,
    icone: 'moeda',
  });
  dialogoAberto = false;
  // Fechado pela troca de rota: a pessoa já está em outra tela, nada a fazer (BUG-01).
  if (irPro === null) return;
  if (irPro) {
    if (op.sobreTela) substituir('#/pro');
    else navegar('#/pro');
  } else if (op.sobreTela) voltar('#/');
}

/** Todo botão "Adicionar" passa por aqui (flutuante, estados vazios). */
export function adicionar(): void {
  if (podeAdicionar()) navegar('#/nova');
  else void avisarLimite();
}

/** Catálogo e formulário de nova assinatura abertos já no limite: diálogo por cima (design 9.1). */
export function guardarTelaDeCadastro(): void {
  if (podeAdicionar()) return;
  setTimeout(() => void avisarLimite({ sobreTela: true }), 0);
}

/** Contador "N de 5 assinaturas ativas" + medidor + apoio (só no plano grátis; no Pro não existe). */
export function contadorLimite(): HTMLElement | null {
  if (ehPro()) return null;
  const ativas = contarAtivas(obterEstado());
  const medidor = h(
    'div',
    { class: 'medidor', 'aria-hidden': 'true' },
    Array.from({ length: LIMITE_GRATIS }, (_, i) => h('i', { class: i < ativas ? 'cheio' : '' })),
  );
  const noLimite = ativas >= LIMITE_GRATIS;
  const apoio =
    ativas > LIMITE_GRATIS
      ? 'Tudo continua funcionando. Para adicionar ou reativar, fique com menos de 5 ativas ou conheça o Pro.'
      : 'Para adicionar outra, pause ou cancele uma que você não usa, ou conheça o Pro.';
  return h(
    'div',
    { class: 'limite' },
    h('p', { class: 'limite-texto', testid: 'limite-contador' }, textoContador(ativas)),
    medidor,
    noLimite ? h('p', { class: 'limite-apoio' }, apoio) : null,
    noLimite ? botao('Conhecer o Pro', 'texto', () => navegar('#/pro'), { testid: 'limite-link-pro' }) : null,
  );
}
