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
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:4200', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'npm start', url: 'http://localhost:4200', reuseExistingServer: true, timeout: 180_000 },
});
