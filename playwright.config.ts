import { defineConfig, devices } from '@playwright/test';

/** Pruebas E2E contra el servidor de desarrollo (con datos simulados de MSW). */
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  // El servidor de desarrollo (sin empaquetar) se satura con muchos workers: el catálogo tarda más de 5 s en pintar
  // y aparecen fallos intermitentes. 4 workers y 10 s por expectativa los evitan sin alargar mucho la corrida.
  workers: 4,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  // En CI, un reintento absorbe los fallos intermitentes del servidor de desarrollo (queda marcado como "flaky" en el informe).
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:4320', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Puerto propio: el 4200 puede estar ocupado por otro proyecto y Playwright lo reutilizaría (probaría otra app).
  webServer: { command: 'npx ng serve zonacards-admin --port 4320', url: 'http://localhost:4320', reuseExistingServer: true, timeout: 300_000 },
});
