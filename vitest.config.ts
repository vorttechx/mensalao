import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// Testes unitários (escritos pelo QA) ficam em tests/; os E2E (Playwright) usam *.spec.ts em tests/e2e.
// O alias "@ambiente" aponta para o ambiente de teste (provedor falso), como no build de teste.
export default defineConfig({
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
