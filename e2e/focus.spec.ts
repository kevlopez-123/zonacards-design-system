import { expect, test, type Locator } from '@playwright/test';

/**
 * Foco de los campos: un solo indicador (borde + halo) del color del estado, y todo lo enfocable con teclado se ve distinto al enfocarlo.
 * El contorno global (:focus-visible) queda fuera de los campos: `outline-none!` en `zcInput` (el contorno global está fuera de las capas
 * de Tailwind y, sin el `!`, le ganaba a `outline-none` y dejaba un aro azul incluso en un campo con error).
 */
const look = (loc: Locator) => loc.evaluate(el => {
  const c = getComputedStyle(el);
  const halos = c.boxShadow.split(/,(?![^(]*\))/).map(s => s.trim()).filter(s => !/^rgba\(0, 0, 0, 0\)/.test(s) && s !== 'none');
  return { border: c.borderTopColor, halos, outline: c.outlineStyle };
});
const BLUE = 'rgb(37, 99, 235)', RED = 'rgb(185, 28, 28)';
/** Espera el valor final: el borde y la sombra transicionan (~200 ms, más con el servidor cargado). */
const settled = (loc: Locator, ok: (l: Awaited<ReturnType<typeof look>>) => boolean) => expect.poll(async () => ok(await look(loc)), { timeout: 8000 }).toBe(true);

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
});

test('campo válido: borde y halo azules, sin contorno extra', async ({ page }) => {
  await page.goto('/catalogo/atomos');
  await page.waitForLoadState('networkidle');
  const ok = page.locator('main zc-field input[zcinput]:not([aria-invalid="true"]):not([disabled]):not(.zc-bare)').first();
  await ok.focus();
  await settled(ok, l => l.border === BLUE && l.halos.length === 1 && l.halos[0].includes('0px 0px 0px 3px'));
  const l = await look(ok);
  expect(l.border).toBe(BLUE);
  expect(l.halos[0]).toContain('0px 0px 0px 3px');
  expect(l.outline).toBe('none');
});

test('campo con error: borde y halo rojos (30 %), sin contorno azul', async ({ page }) => {
  await page.goto('/catalogo/atomos');
  await page.waitForLoadState('networkidle');
  const bad = page.locator('main zc-field input[zcinput][aria-invalid="true"]').first();
  await bad.focus();
  await settled(bad, l => l.border === RED && l.halos.length === 1 && /\/ 0\.3\d*\)/.test(l.halos[0]) && l.halos[0].includes('0px 0px 0px 3px'));
  const l = await look(bad);
  expect(l.border).toBe(RED);
  expect(l.halos[0]).toContain('0px 0px 0px 3px');
  expect(l.halos[0]).toMatch(/\/ 0\.3\d*\)/);
  expect(l.outline).toBe('none');
});

test('campo compuesto con error: el halo también es rojo', async ({ page }) => {
  await page.goto('/catalogo/moleculas');
  await page.waitForLoadState('networkidle');
  const box = page.locator('main [data-invalid="true"]').first();
  await box.locator('input, button, [role="combobox"]').first().focus();
  await settled(box, l => l.border === RED && l.halos.length === 1 && /\/ 0\.3\d*\)/.test(l.halos[0]) && l.halos[0].includes('0px 0px 0px 3px'));
  const l = await look(box);
  expect(l.border).toBe(RED);
  expect(l.halos.length).toBe(1);
  expect(l.halos[0]).toContain('0px 0px 0px 3px');
  expect(l.halos[0]).toMatch(/\/ 0\.3\d*\)/);
});

/** Aspecto de un elemento y de hasta tres ancestros (los campos compuestos y las tarjetas dibujan el foco en el contenedor). */
const SIGNATURE = (el: Element | null) => {
  const out: string[] = [];
  let n: Element | null = el;
  for (let i = 0; i < 4 && n; i++, n = n.parentElement) {
    const c = getComputedStyle(n);
    out.push([c.outlineStyle, c.outlineWidth, c.outlineColor, c.boxShadow, c.borderTopColor, c.backgroundColor, c.color, c.textDecorationLine, c.transform, c.opacity].join('|'));
  }
  return out.join('~');
};

for (const path of ['/catalogo/atomos', '/catalogo/moleculas']) {
  test(`todo lo enfocable con teclado cambia de aspecto al enfocarse · ${path}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const seen = new Set<string>();
    const bad: string[] = [];
    let last: { id: string; name: string; sig: string; skip: boolean } | null = null;
    for (let i = 0; i < 140; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(330);   // las sombras y bordes transicionan (~200 ms)
      const cur = await page.evaluate(sigSrc => {
        const sig = new Function('el', `return (${sigSrc})(el)`) as (el: Element | null) => string;
        const el = document.activeElement as (HTMLElement & { __zcId?: string }) | null;
        if (!el || el === document.body) return null;
        el.__zcId ??= 'f' + Math.random().toString(36).slice(2);
        const type = (el as HTMLInputElement).type;
        const label = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 28);
        const b = el.getBoundingClientRect();
        // Se omiten los ocultos, la demo estática "estado enfocado" del catálogo y los deslizadores (dibujan el foco en el pseudoelemento ::-webkit-slider-thumb, que los estilos computados no ven).
        return { id: el.__zcId, sig: sig(el), skip: type === 'range' || !!el.closest('.sr-only, [class*="border-focus!"]'), name: `${el.tagName.toLowerCase()}${type ? '(' + type + ')' : ''}[${label}] ${Math.round(b.width)}x${Math.round(b.height)} en ${el.closest('zc-ds-section')?.id ?? '?'}` };
      }, SIGNATURE.toString());
      if (last) {
        const now = await page.evaluate(([sigSrc, id]) => {
          const sig = new Function('el', `return (${sigSrc})(el)`) as (el: Element | null) => string;
          const el = [...document.querySelectorAll<HTMLElement & { __zcId?: string }>('*')].find(e => e.__zcId === id);
          if (!el) return '';
          // Un campo compuesto (fecha, hora, contraseña…) tiene más de una parada de Tab: mientras el foco siga dentro del mismo recuadro,
          // el recuadro sigue enfocado y no hay "sin foco" con qué comparar.
          const box = el.closest('[data-invalid]');
          if (box && document.activeElement && box.contains(document.activeElement)) return 'MISMO-RECUADRO';
          return sig(el);
        }, [SIGNATURE.toString(), last.id]);
        if (now !== 'MISMO-RECUADRO' && now === last.sig && !last.skip) bad.push(last.name);
      }
      if (!cur || seen.has(cur.id)) break;
      seen.add(cur.id);
      last = cur;
    }
    expect(seen.size, 'se recorrieron elementos').toBeGreaterThan(20);
    expect(bad, 'enfocados sin cambio visible').toEqual([]);
  });
}
