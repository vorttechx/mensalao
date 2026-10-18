// Interface única de pagamento (Definição técnica da sprint 2). Toda a lógica de compra passa por aqui.

export type ResultadoCompra = 'ok' | 'cancelado' | 'erro';

export interface ProvedorCompra {
  /** Qual implementação está em uso (Google Play, indisponível no navegador comum ou falsa de teste). */
  readonly tipo: 'play' | 'indisponivel' | 'falso';
  disponivel(): Promise<boolean>;
  /** Preço já formatado pela loja na moeda do usuário; null se a loja não devolveu o produto. */
  detalhes(sku: string): Promise<{ preco: string } | null>;
  comprar(sku: string): Promise<ResultadoCompra>;
  /** SKUs possuídos. Lança erro em falha/offline (diferente de "lista vazia"). */
  listarCompras(): Promise<string[]>;
}

/** Notificações locais (US-13), atrás de interface substituível (US-13.CA15). */
export type PermissaoNotificacao = 'default' | 'granted' | 'denied';

export interface Notificador {
  suportado(): boolean;
  permissao(): PermissaoNotificacao;
  pedirPermissao(): Promise<PermissaoNotificacao>;
  notificar(titulo: string, corpo: string): Promise<void>;
}

/** Rejeita se a promessa não responder no prazo (verificação sem travar o app). */
export function comPrazo<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolver, rejeitar) => {
    const t = setTimeout(() => rejeitar(new Error('tempo esgotado')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolver(v);
      },
      (e: unknown) => {
        clearTimeout(t);
        rejeitar(e instanceof Error ? e : new Error(String(e)));
      },
    );
  });
}
