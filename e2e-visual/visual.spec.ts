import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Una captura por sección del catálogo (cada componente con sus variantes y estados), en tema claro y oscuro.
 * Falla si una sección cambia más de 1 % de sus píxeles respecto de la referencia: así un cambio en un token, un componente o una
 * dependencia no altera otros componentes sin que se note.
 */
const LEVELS = ['fundamentos', 'atomos', 'moleculas', 'organismos', 'plantillas'];
const FIXED = new Date('2026-11-07T10:00:00-05:00');

async function prepare(page: Page, path: string, theme: 'light' | 'dark') {
  await page.clock.setFixedTime(FIXED);
  await page.addInitScript(t => {
    try { localStorage.setItem('zc-theme', t); } catch { /* sin almacenamiento */ }
    // Sin animaciones ni transiciones, y sin el parpadeo del cursor.
    const s = document.createElement('style');
    s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';
    document.addEventListener('DOMContentLoaded', () => document.head.append(s));
  }, theme);
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await page.evaluate(t => document.documentElement.classList.toggle('dark', t === 'dark'), theme);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
}

/**
 * Los bloques con @defer (on viewport) se dibujan al verse: sin recorrer la sección, la captura sale con recuadros en blanco o ya
 * cargados según el ritmo de la máquina (era la causa de las pruebas intermitentes). Se baja por toda la sección y se vuelve al inicio.
 */
async function loadDeferred(page: Page, section: Locator) {
  const height = await section.evaluate(el => { el.scrollIntoView({ block: 'start' }); return el.getBoundingClientRect().height; });
  await page.evaluate(async h => { for (let y = 0; y < h; y += 300) { window.scrollBy(0, 300); await new Promise(r => setTimeout(r, 120)); } }, height);
  await page.waitForLoadState('networkidle');
  // Misma posición que sin el recorrido: arriba del todo y la sección traída a la vista por Playwright.
  await page.evaluate(() => window.scrollTo(0, 0));
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
}

for (const level of LEVELS) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${level} · ${theme}`, async ({ page }) => {
      await prepare(page, `/catalogo/${level}`, theme);
      const ids = await page.locator('zc-ds-section[id]').evaluateAll(els => els.map(e => e.id));
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) {
        const section = page.locator(`zc-ds-section[id="${id}"]`);
        await section.scrollIntoViewIfNeeded();
        await loadDeferred(page, section);
        await page.waitForTimeout(150);
        // Gráficos (canvas) y mapas dibujan con ECharts de forma asíncrona: se enmascaran para no depender de su ritmo.
        await expect(section, `sección ${id}`).toHaveScreenshot(`${level}/${id}.${theme}.png`, {
          // El carrusel avanza solo (temporizador): también se enmascara.
          mask: [section.locator('canvas, [data-visual-ignore], zc-geo-map, video, zc-carousel')],
        });
      }
    });
  }
}
