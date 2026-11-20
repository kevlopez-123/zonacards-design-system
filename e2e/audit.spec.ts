import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Auditoría de layout y accesibilidad (sección 16 de las reglas).
 * Falla si hay desplazamiento horizontal, elementos fuera de su contenedor o solapados,
 * o violaciones de accesibilidad serias o críticas.
 */
const WIDTHS = [360, 390, 768, 1024, 1280, 1440];
const PAGES = ['/catalogo/fundamentos', '/catalogo/atomos', '/catalogo/moleculas', '/catalogo/organismos', '/catalogo/plantillas', '/lotes', '/lotes?vista=tabla&pais=pe', '/lotes?scenario=vacio', '/lotes?scenario=error', '/lotes?q=zzzz', '/lotes/02829', '/lotes/99999',
  '/aprobaciones', '/aprobaciones?bandeja=mis-solicitudes&vista=tabla', '/aprobaciones?vista=tabla', '/aprobaciones?scenario=vacio', '/aprobaciones/AP-101', '/aprobaciones/AP-130'];

for (const path of PAGES) {
  for (const width of WIDTHS) {
    test(`${path} · ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const report = await page.evaluate(() => {
        const W = innerWidth; const out: string[] = []; const overlaps: string[] = [];
        const visible = (el: Element) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
        const name = (el: Element) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/)[0] : '');
        document.querySelectorAll('main *').forEach(el => {
          // Las teselas de un mapa se recortan a propósito con el contenedor del mapa (overflow oculto).
          if (!visible(el) || el.closest('.sr-only, svg, .leaflet-pane')) return;
          let p = el.parentElement; while (p && p !== document.body && !/(auto|scroll)/.test(getComputedStyle(p).overflowX)) p = p.parentElement;
          if (p && p !== document.body) return;
          if (el.getBoundingClientRect().right > W + 1) out.push(name(el));
        });
        document.querySelectorAll('main *').forEach(par => {
          if (par.closest('svg')) return; // los trazos internos de un ícono no cuentan
          if (par.closest('[data-allow-overlap]')) return; // solapamiento de diseño (grupos de avatares), sección 16
          // Los inline dentro de un texto (code, a, strong) que se parten en dos líneas tienen cajas que se cruzan sin solaparse de verdad.
          const kids = Array.from(par.children).filter(k => visible(k) && !['absolute', 'fixed'].includes(getComputedStyle(k).position) && getComputedStyle(k).display !== 'inline' && !k.classList.contains('sr-only'));
          for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
            const a = kids[i].getBoundingClientRect(), b = kids[j].getBoundingClientRect();
            if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) overlaps.push(name(kids[i]) + ' × ' + name(kids[j]));
          }
        });
        // Se sale de su contenedor (no solo de la ventana): un hijo más ancho que su padre sin desplazamiento propio.
        const escapes: string[] = [];
        document.querySelectorAll('main *').forEach(el => {
          const cs = getComputedStyle(el);
          if (!visible(el) || ['absolute', 'fixed'].includes(cs.position) || el.closest('svg, .sr-only, [data-allow-overlap], .animate-spin, .leaflet-pane')) return;
          // El contenedor real: se saltan padres "contents" (sin caja) e inline (su caja no envuelve a hijos de bloque).
          let p = el.parentElement;
          while (p && ['contents', 'inline'].includes(getComputedStyle(p).display)) p = p.parentElement;
          if (!p || cs.display === 'inline' || /(auto|scroll|hidden|clip)/.test(getComputedStyle(p).overflowX)) return;
          const r = el.getBoundingClientRect(), pr = p.getBoundingClientRect();
          if (r.right > pr.right + 1.5 || r.left < pr.left - 1.5) escapes.push(name(el) + ' en ' + name(p));
        });
        return { scrollWidth: document.documentElement.scrollWidth, width: W, outOfBox: out.slice(0, 10), overlaps: overlaps.slice(0, 10), escapes: escapes.slice(0, 10) };
      });
      expect(report.scrollWidth, 'sin desplazamiento horizontal').toBeLessThanOrEqual(report.width);
      expect(report.outOfBox, 'elementos fuera del borde').toEqual([]);
      expect(report.overlaps, 'elementos solapados').toEqual([]);
      expect(report.escapes, 'elementos fuera de su contenedor').toEqual([]);
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      const serious = axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map(v => `${v.id}: ${v.help}`), 'accesibilidad').toEqual([]);
    });
  }
}
