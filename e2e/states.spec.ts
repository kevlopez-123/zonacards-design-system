import { expect, test } from '@playwright/test';

/** Estados con token: un solo valor de opacidad para todo control deshabilitado y el anillo de foco de teclado. */
test('los tokens de estado valen lo documentado', async ({ page }) => {
  await page.goto('/catalogo/atomos');
  const t = (n: string) => page.evaluate(v => getComputedStyle(document.documentElement).getPropertyValue(v).trim(), n);
  expect(await t('--opacity-disabled')).toBe('0.45');
  expect(await t('--focus-ring-width')).toBe('2px');
  expect(await t('--focus-ring-offset')).toBe('2px');
});

test('todo control deshabilitado se atenúa con la misma opacidad', async ({ page }) => {
  await page.goto('/catalogo/atomos');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /Button, ButtonGroup/ })).toBeVisible();
  const opacities = await page.evaluate(() => {
    const out: Record<string, number> = {};
    const els = [...document.querySelectorAll<HTMLElement>('main button[disabled], main input[disabled], main textarea[disabled], main [aria-disabled="true"], main [data-disabled], main [data-disabled="true"]')];
    for (const el of els) {
      if (el.closest('.sr-only')) continue;
      const own = parseFloat(getComputedStyle(el).opacity);
      // Un control dentro de otro ya atenuado no suma: se mira el primero de la cadena.
      if (own < 1) out[`${el.tagName.toLowerCase()}${el.getAttribute('role') ? '[' + el.getAttribute('role') + ']' : ''}`] = Math.round(own * 100) / 100;
    }
    return out;
  });
  expect(Object.keys(opacities).length, 'hay controles deshabilitados en la página').toBeGreaterThan(2);
  expect([...new Set(Object.values(opacities))], JSON.stringify(opacities)).toEqual([0.45]);
});

test('el foco de teclado dibuja el anillo del token', async ({ page }) => {
  await page.goto('/catalogo/atomos');
  await page.waitForLoadState('networkidle');
  await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => { const el = document.activeElement as HTMLElement; const c = getComputedStyle(el); return { width: c.outlineWidth, offset: c.outlineOffset, style: c.outlineStyle }; });
  expect(ring).toEqual({ width: '2px', offset: '2px', style: 'solid' });
});

test('los roles de capa de estado y la escala del pulsado valen lo documentado', async ({ page }) => {
  await page.goto('/catalogo/atomos');
  await page.waitForLoadState('networkidle');
  const r = await page.evaluate(() => {
    const probe = (v: string) => { const d = document.createElement('i'); d.style.background = `var(${v})`; document.body.append(d); const c = getComputedStyle(d).backgroundColor; d.remove(); return c; };
    return { scale: getComputedStyle(document.documentElement).getPropertyValue('--scale-pressed').trim(), hover: probe('--state-hover-bg'), active: probe('--state-active-bg'), surface2: probe('--surface-2'), selected: probe('--state-selected-bg'), rowSelected: probe('--row-selected-bg') };
  });
  expect(r.scale).toBe('0.97');
  expect(r.hover).toBe(r.surface2);
  expect(r.active).toBe(r.surface2);
  expect(r.selected).toBe(r.rowSelected);
});

test('un botón fantasma toma el fondo de hover del token y un botón pulsado se aprieta a la escala del token', async ({ page }) => {
  await page.goto('/catalogo/atomos');
  await page.waitForLoadState('networkidle');
  const ghost = page.locator('main button[data-variant="ghost"]:not([disabled])').first();
  await ghost.scrollIntoViewIfNeeded();
  const expected = await page.evaluate(() => { const d = document.createElement('i'); d.style.background = 'var(--state-hover-bg)'; document.body.append(d); const c = getComputedStyle(d).backgroundColor; d.remove(); return c; });
  await ghost.hover();
  await expect.poll(() => ghost.evaluate(el => getComputedStyle(el).backgroundColor)).toBe(expected);
  await page.mouse.down();
  await expect.poll(() => ghost.evaluate(el => getComputedStyle(el).scale)).toBe('0.97');
  await page.mouse.up();
});
