import { expect, test } from '@playwright/test';

/**
 * Paneles flotantes (select, combobox, fecha, menú): nada se sale de su contenedor al abrirlos.
 * Antes, el pie de la multiselección empujaba "Listo" fuera del panel.
 */
const PAGES = ['/catalogo/moleculas', '/lotes', '/aprobaciones'];
const scanOverlay = () => {
  const out: string[] = [];
  const name = (el: Element) => el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
  document.querySelectorAll('.cdk-overlay-container *').forEach(el => {
    const cs = getComputedStyle(el);
    if (cs.position === 'absolute' || cs.position === 'fixed' || el.closest('svg, .sr-only, .animate-spin')) return;
    const p = el.parentElement; if (!p || /(auto|scroll|hidden|clip)/.test(getComputedStyle(p).overflowX)) return;
    const r = el.getBoundingClientRect(), pr = p.getBoundingClientRect();
    if (!r.width || !r.height || !pr.width) return;
    if (r.right > pr.right + 1.5 || r.left < pr.left - 1.5) out.push(name(el) + ' en ' + name(p));
  });
  return [...new Set(out)];
};

for (const path of PAGES) for (const width of [360, 1280]) {
  test(`paneles de ${path} · ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const combos = page.locator('main [role="combobox"]:visible');
    const n = Math.min(await combos.count(), 10);
    for (let i = 0; i < n; i++) {
      const c = combos.nth(i);
      if (!(await c.isEnabled())) continue;
      await c.click().catch(() => undefined);
      await page.waitForTimeout(150);
      expect(await page.evaluate(scanOverlay), `panel ${i} de ${path}`).toEqual([]);
      await page.keyboard.press('Escape');
    }
  });
}
