import { defineConfig, devices } from '@playwright/test';

// E2E contra o build de produção servido pelo `vite preview`.
// O Chromium já está instalado em /opt/pw-browsers (não rodar "playwright install").
const porta = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${porta}/`,
    trace: 'retain-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
  projects: [
    {
      name: 'mobile-360',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 360, height: 780 },
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${porta} --strictPort`,
    url: `http://localhost:${porta}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
