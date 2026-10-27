// Interface única de pagamento (Definição técnica da sprint 2). Toda a lógica de compra passa por aqui.

export type ResultadoCompra = 'ok' | 'cancelado' | 'erro';

export interface ProvedorCompra {
  /** Qual implementação está em uso (Google Play Billing nativo, indisponível fora do app Android ou falsa de teste). */
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
  /** Lê o estado inicial (ex.: permissão do Android, que é assíncrona). Chamado uma vez ao abrir, antes da 1ª tela. */
  preparar?(): Promise<void>;
  suportado(): boolean;
  permissao(): PermissaoNotificacao;
  pedirPermissao(): Promise<PermissaoNotificacao>;
  notificar(titulo: string, corpo: string): Promise<void>;
}

/** Resultado de entregar um arquivo gerado no aparelho (backup JSON ou planilha CSV, US-24.CA11). */
export type ResultadoArquivo = 'ok' | 'cancelado' | 'erro';

/**
 * Entrega de arquivo: download do navegador (desenvolvimento e build de teste) ou gravação + folha de
 * compartilhar do Android (a WebView do Capacitor não baixa arquivos por link).
 */
export interface SalvadorArquivos {
  salvar(nome: string, conteudo: string, tipoMime: string): Promise<ResultadoArquivo>;
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
