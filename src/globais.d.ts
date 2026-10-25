// Constantes injetadas pelo vite.config.ts (define). Ver src/plataforma/ids-anuncios.ts.
declare const __MENSALAO_ANUNCIOS__: {
  /** Bloco do banner adaptativo. */
  banner: string;
  /** Bloco do anúncio premiado. */
  premiado: string;
  /** true em todo build que não é o de produção Android: IDs de teste do Google e aparelho de teste. */
  teste: boolean;
  /** Só fora da produção: região simulada do UMP ('EEA' para o teste manual da US-30.CA5, item 4). */
  umpDepuracao: string;
  /** Só fora da produção: IDs de aparelhos de teste do AdMob/UMP. */
  aparelhosTeste: string[];
};
