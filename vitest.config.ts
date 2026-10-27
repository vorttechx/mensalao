import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// Testes unitários (escritos pelo QA) ficam em tests/; os E2E (Playwright) usam *.spec.ts em tests/e2e.
// O alias "@ambiente" aponta para o ambiente de teste (provedor falso), como no build de teste.
export default defineConfig({
  // Mesmas constantes do build (IDs de TESTE do Google; nunca reais em teste).
  define: {
    __MENSALAO_ANUNCIOS__: JSON.stringify({
      banner: 'ca-app-pub-3940256099942544/9214589741',
      premiado: 'ca-app-pub-3940256099942544/5224354917',
      teste: true,
      umpDepuracao: '',
      aparelhosTeste: [],
    }),
  },
  resolve: {
    alias: { '@ambiente': resolve(__dirname, 'src/plataforma/ambiente.teste.ts') },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    environment: 'node',
    passWithNoTests: true,
  },
});
