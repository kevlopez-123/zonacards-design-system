import { defineConfig, devices } from '@playwright/test';

/** Pruebas E2E contra el servidor de desarrollo (con datos simulados de MSW). */
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:4200', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'npm start', url: 'http://localhost:4200', reuseExistingServer: true, timeout: 180_000 },
});
