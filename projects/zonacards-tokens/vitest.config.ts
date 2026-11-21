import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Pruebas del paquete neutral: dominio y marcas. jsdom para el lector de Excel (usa DOMParser).
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  cacheDir: fileURLToPath(new URL('../../node_modules/.vite/zonacards-tokens', import.meta.url)),
  test: { environment: 'jsdom', globals: true, include: ['src/**/*.spec.ts'] },
});
