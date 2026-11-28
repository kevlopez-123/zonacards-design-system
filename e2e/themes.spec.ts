import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Accesibilidad por marca y por tema: la auditoría de `audit.spec.ts` solo corre con la marca y el tema por defecto, pero el contraste
 * cambia con cada marca (`data-brand`) y con el modo oscuro (`.dark`). Aquí se repite el axe de WCAG 2 A y AA con las cuatro marcas en
 * claro y oscuro, en escritorio (la forma de móvil ya la cubre `audit.spec.ts`). El tema y la marca se fijan con las mismas claves de
 * almacenamiento que lee `ThemeService`.
 */
const BRANDS = ['zonacards', 'giftealo', 'enjoy', 'motiva'] as const;
const MODES = ['light', 'dark'] as const;
const PAGES = ['/catalogo/fundamentos', '/catalogo/atomos', '/catalogo/moleculas', '/catalogo/organismos', '/catalogo/plantillas', '/lotes', '/aprobaciones'];

for (const path of PAGES) {
  for (const brand of BRANDS) {
    for (const mode of MODES) {
      test(`${path} · ${brand} · ${mode}`, async ({ page }) => {
        await page.addInitScript(([b, m]) => { localStorage.setItem('zc-brand', b); localStorage.setItem('zc-theme', m); }, [brand, mode]);
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        // La marca y el modo se aplicaron de verdad (si no, la prueba no probaría nada).
        const root = await page.evaluate(() => ({ brand: document.documentElement.getAttribute('data-brand'), dark: document.documentElement.classList.contains('dark') }));
        expect(root.brand, 'marca aplicada').toBe(brand === 'zonacards' ? null : brand);
        expect(root.dark, 'modo aplicado').toBe(mode === 'dark');
        const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).exclude('.leaflet-pane').analyze();
        const serious = axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
        const detail = serious.map(v => `${v.id}: ${v.help} · ${v.nodes.length} nodos, p. ej. ${v.nodes.slice(0, 3).map(n => n.target.join(' ') + ' → ' + (n.any[0]?.message ?? '').slice(0, 110)).join(' | ')}`);
        expect(detail, 'accesibilidad').toEqual([]);
      });
    }
  }
}
