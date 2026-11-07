import { defineConfig, devices } from '@playwright/test';

/**
 * Regresión visual del sistema de diseño: una captura por sección del catálogo, en tema claro y oscuro (npm run test:visual).
 * Las referencias viven en e2e-visual/__screenshots__ y se versionan. Si un cambio visual es intencional:
 *   npm run test:visual -- --update-snapshots   y revisa las imágenes nuevas antes del commit.
 * Hora fija y sin animaciones: lo que cambia entre corridas es el componente, no el reloj ni el movimiento.
 */
export default defineConfig({
  testDir: 'e2e-visual',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  timeout: 120_000,
  workers: 4,
  // Un reintento: el servidor de desarrollo cargado puede tardar en pintar una sección; un cambio visual real falla las dos veces.
  retries: 1,
  fullyParallel: true,
  expect: { timeout: 15_000, toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'hide', scale: 'css' } },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-visual' }]],
  use: { baseURL: 'http://localhost:4310', viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, colorScheme: 'light', locale: 'es-PE', timezoneId: 'America/Lima' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 } }],
  // Puerto propio: el 4200 puede estar ocupado por otro proyecto y Playwright lo reutilizaría.
  webServer: { command: 'npx ng serve zonacards-admin --port 4310', url: 'http://localhost:4310', reuseExistingServer: true, timeout: 300_000 },
});
