import { defineConfig } from 'vitest/config';

// Testes unitários (escritos pelo QA) ficam em tests/; os E2E (Playwright) usam *.spec.ts em tests/e2e.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    environment: 'node',
    passWithNoTests: true,
  },
});
