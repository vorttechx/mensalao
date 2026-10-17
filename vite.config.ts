import { defineConfig } from 'vite';

// base relativa: o build funciona em qualquer subdiretório (ex.: /apps/mensalao/).
export default defineConfig({
  base: './',
  build: { target: 'es2022' },
});
