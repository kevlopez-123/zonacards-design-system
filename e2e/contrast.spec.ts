import { expect, test } from '@playwright/test';

/**
 * Contraste de los colores del sistema en las 4 marcas, en claro y oscuro (8 temas), medido sobre el CSS real (incluye color-mix y los
 * ajustes de cada marca). axe solo revisa texto sobre lo que hay en pantalla; aquí se revisan también los pares que definen los tokens:
 *  - texto: 4,5:1 (WCAG 1.4.3 AA);
 *  - componentes de interfaz (borde de un campo, anillo de foco): 3:1 contra lo que los rodea (WCAG 1.4.11).
 * Con `?discover` en CONTRAST_DISCOVER=1 imprime todas las razones sin fallar.
 */
const BRANDS = ['zonacards', 'giftealo', 'enjoy', 'motiva'] as const;
const MODES = ['light', 'dark'] as const;

/** [primer plano, fondo, mínimo, qué es] */
const TEXT: [string, string, number, string][] = [
  ['--text', '--bg', 4.5, 'texto sobre el fondo'],
  ['--text', '--surface', 4.5, 'texto sobre la superficie'],
  ['--text-muted', '--bg', 4.5, 'texto atenuado sobre el fondo'],
  ['--text-muted', '--surface', 4.5, 'texto atenuado sobre la superficie'],
  ['--text-muted', '--surface-2', 4.5, 'texto atenuado sobre la superficie 2'],
  ['--text-subtle', '--bg', 4.5, 'texto de apoyo sobre el fondo'],
  ['--text-subtle', '--surface', 4.5, 'texto de apoyo sobre la superficie'],
  ['--text-subtle', '--surface-2', 4.5, 'texto de apoyo sobre la superficie 2'],
  ['--on-primary', '--primary', 4.5, 'texto sobre el color primario'],
  ['--on-secondary', '--secondary', 4.5, 'texto sobre el color secundario'],
  ['--danger-fg', '--danger-bg', 4.5, 'error sobre su fondo'],
  ['--success-fg', '--success-bg', 4.5, 'éxito sobre su fondo'],
  ['--warning-fg', '--warning-bg', 4.5, 'advertencia sobre su fondo'],
  ['--info-fg', '--info-bg', 4.5, 'información sobre su fondo'],
  ['--sidebar-fg', '--sidebar-bg', 4.5, 'texto del sidebar'],
  ['--sidebar-fg-active', '--sidebar-bg', 4.5, 'texto activo del sidebar'],
  ['--sidebar-brand-fg', '--sidebar-brand-bg', 4.5, 'texto del sidebar de marca'],
  ['--sidebar-brand-fg-active', '--sidebar-brand-bg', 4.5, 'texto activo del sidebar de marca'],
];
const UI: [string, string, number, string][] = [
  ['--field-bd', '--bg', 3, 'borde de campo contra el fondo de la página'],
  ['--field-bd', '--surface', 3, 'borde de campo contra la superficie'],
  ['--field-bd', '--field-bg', 3, 'borde de campo contra su relleno'],
  ['--focus', '--bg', 3, 'anillo de foco contra el fondo'],
  ['--focus', '--surface', 3, 'anillo de foco contra la superficie'],
  ['--danger-fg', '--surface', 3, 'borde de error contra la superficie'],
];

for (const brand of BRANDS) {
  for (const mode of MODES) {
    test(`contraste de los tokens · ${brand} · ${mode}`, async ({ page }) => {
      await page.addInitScript(([b, m]) => { localStorage.setItem('zc-brand', b); localStorage.setItem('zc-theme', m); }, [brand, mode]);
      await page.goto('/catalogo/fundamentos');
      await page.waitForLoadState('networkidle');
      const rows = await page.evaluate(([text, ui]) => {
        // Cualquier color que entienda el navegador (hex, color-mix, oklab…) pasa a RGB con un canvas de 1 píxel.
        const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
        const rgb = (cssVar: string) => {
          const v = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
          ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = v; ctx.fillRect(0, 0, 1, 1);
          const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255];
        };
        const lum = ([r, g, b]: number[]) => { const f = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
        const ratio = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
        return [...text, ...ui].map(([fg, bg, min, what]: [string, string, number, string]) => {
          const a = rgb(fg), b = rgb(bg);
          // Un color con transparencia se compone sobre el fondo de la página.
          const page = rgb('--bg'); const over = (c: number[], base: number[]) => c[3] >= 1 ? c : c.slice(0, 3).map((x, i) => x * c[3] + base[i] * (1 - c[3]));
          const ratioV = ratio(over(a, over(b, page)), over(b, page));
          return { fg, bg, min, what, ratio: Math.round(ratioV * 100) / 100 };
        });
      }, [TEXT, UI] as const);
      if (process.env.CONTRAST_DISCOVER) {
        console.log(`\n== ${brand} · ${mode}\n` + rows.filter(r => r.ratio < r.min).map(r => `  FALLA ${r.ratio.toFixed(2)} < ${r.min}  ${r.fg} sobre ${r.bg}  (${r.what})`).join('\n'));
        return;
      }
      const bad = rows.filter(r => r.ratio < r.min).map(r => `${r.ratio.toFixed(2)}:1 < ${r.min}:1  ${r.fg} sobre ${r.bg}  (${r.what})`);
      expect(bad, `${brand} · ${mode}`).toEqual([]);
    });
  }
}
