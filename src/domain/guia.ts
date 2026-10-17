// US-06 — Guia "onde cancelar". Textos curtos, sem URLs, telefones ou e-mails (funciona offline).
import { CATALOGO, servicoPorId, type ServicoCatalogo } from './catalogo';
import type { Assinatura } from './tipos';

export const TEXTO_GENERICO =
  'Procure no app ou site do serviço a área Conta/Perfil > Assinatura ou Plano > Cancelar. Se pagar no cartão, guarde o comprovante do cancelamento.';

export const TEXTO_LOJA_APPS =
  'Comprou pela loja de apps? Cancele na própria loja: no iPhone, em Ajustes > [seu nome] > Assinaturas; no Android, na Play Store > Perfil > Pagamentos e assinaturas > Assinaturas.';

export const AVISO_FINAL =
  'O Mensalão não cancela nada automaticamente. Depois de cancelar no serviço, use Marcar como cancelada.';

/** Instrução genérica do Pix Automático (US-06.CA2), citando o banco quando informado. */
export function textoPix(banco: string): string {
  const b = banco.trim();
  const abrir = b ? `Abra o app do banco de onde sai o pagamento (no app do ${b})` : 'Abra o app do banco de onde sai o pagamento';
  return `${abrir}, procure Pix > Pix Automático (ou 'Recorrências/Autorizações') e revogue a autorização deste recebedor. Cancelar no banco interrompe as cobranças futuras, mas confira também o contrato com a empresa.`;
}

export interface Guia {
  /** Texto do serviço (catálogo) ou genérico; null em cadastro livre pago por Pix Automático. */
  servico: string | null;
  /** Observação da loja de apps (só itens do catálogo). */
  lojaApps: string | null;
  /** Instrução do Pix Automático (só se a forma de pagamento for Pix). */
  pix: string | null;
  avisoFinal: string;
}

export function montarGuia(a: Assinatura, catalogo: ServicoCatalogo[] = CATALOGO): Guia {
  const servico = servicoPorId(a.catalogoId, catalogo);
  const ehPix = a.pagamento === 'pix';
  return {
    servico: servico ? servico.comoCancelar : ehPix ? null : TEXTO_GENERICO,
    lojaApps: servico ? TEXTO_LOJA_APPS : null,
    pix: ehPix ? textoPix(a.banco) : null,
    avisoFinal: AVISO_FINAL,
  };
}
