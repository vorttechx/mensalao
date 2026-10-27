// US-30.CA1 — IDs dos blocos de anúncio. Nunca fixos no código para produção: o vite.config.ts injeta os IDs
// de TESTE oficiais do Google em todo build (desenvolvimento, teste, CI, APK de debug) e os IDs REAIS só no
// build de produção Android (MENSALAO_ANUNCIOS=producao, variáveis MENSALAO_ADMOB_*; ver scripts/android.mjs).
// Dev e QA: nunca troquem os IDs de teste por reais nem toquem em anúncios de produção (US-30.CA9).

/** IDs de teste oficiais do Google (https://developers.google.com/admob/android/test-ads). */
export const IDS_TESTE_GOOGLE = {
  app: 'ca-app-pub-3940256099942544~3347511713',
  banner: 'ca-app-pub-3940256099942544/9214589741',
  premiado: 'ca-app-pub-3940256099942544/5224354917',
} as const;

export const CONFIG_ANUNCIOS = __MENSALAO_ANUNCIOS__;
