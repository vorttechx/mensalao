import { defineConfig, devices } from '@playwright/test';

// E2E (sprint 2):
// - projeto "mobile-360": build de TESTE (npm run build:teste → dist-teste/, provedor de compra falso)
//   servido na porta 4173. Todos os *.spec.ts, exceto os *.prod.spec.ts.
// - projeto "producao-360": build de PRODUÇÃO (npm run build → dist/) na porta 4174, só para os
//   *.prod.spec.ts (ex.: tentar ativar o Pro por URL/console/localStorage, US-12.CA15).
// O Chromium já está instalado em /opt/pw-browsers (não rodar "playwright install").
const portaTeste = 4173;
const portaProducao = 4174;

const dispositivo = {
  ...devices['Desktop Chrome'],
  viewport: { width: 360, height: 780 },
  hasTouch: true,
};

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'retain-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
  projects: [
    {
      name: 'mobile-360',
      testIgnore: '**/*.prod.spec.ts',
      use: { ...dispositivo, baseURL: `http://localhost:${portaTeste}/` },
    },
    {
      name: 'producao-360',
      testMatch: '**/*.prod.spec.ts',
      use: { ...dispositivo, baseURL: `http://localhost:${portaProducao}/` },
    },
  ],
  webServer: [
    {
      command: `npm run build:teste && npx vite preview --mode teste --port ${portaTeste} --strictPort`,
      url: `http://localhost:${portaTeste}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `npm run build && npx vite preview --port ${portaProducao} --strictPort`,
      url: `http://localhost:${portaProducao}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
