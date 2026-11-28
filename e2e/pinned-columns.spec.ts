import { expect, test } from '@playwright/test';

/** Columnas fijas de la tabla de datos: `pin: 'start'` (Cliente) y `pin: 'end'` (Estado) se quedan en su borde al desplazar en horizontal. */
test('Cliente (izquierda) y Estado (derecha) no se mueven al desplazar; las demás sí', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/catalogo/organismos#o-table');
  await page.getByRole('radio', { name: 'Tabla' }).click();
  const table = page.getByRole('table', { name: /Lotes/ }).first();
  await expect(table).toBeVisible();
  const scroller = table.locator('xpath=ancestor::div[@data-allow-overlap][1]');
  // La tabla es más ancha que su contenedor: hay desplazamiento horizontal.
  expect(await scroller.evaluate(el => el.scrollWidth - el.clientWidth)).toBeGreaterThan(50);

  const head = (name: string) => table.getByRole('columnheader', { name });
  const left = async (name: string) => (await head(name).boundingBox())!.x;
  const right = async (name: string) => { const b = (await head(name).boundingBox())!; return b.x + b.width; };

  await expect.poll(() => scroller.evaluate(el => el.querySelector('thead th[data-col="client"]')!.getBoundingClientRect().left - el.getBoundingClientRect().left)).toBeGreaterThan(200); // tras la casilla y el Lote
  const before = { client: await left('Cliente'), state: await right('Estado'), country: await left('País') };
  await scroller.evaluate(el => { el.scrollLeft = 180; });
  await expect.poll(() => scroller.evaluate(el => el.scrollLeft)).toBeGreaterThan(100);
  await expect.poll(async () => Math.abs((await left('País')) - before.country)).toBeGreaterThan(80); // lo no fijo se movió
  expect(Math.abs((await left('Cliente')) - before.client)).toBeLessThan(1.5);
  expect(Math.abs((await right('Estado')) - before.state)).toBeLessThan(1.5);

  // Las celdas del cuerpo siguen a su encabezado.
  const cell = table.locator('tbody tr').first().locator('td').nth(2);
  const hx = await left('Cliente');
  expect(Math.abs((await cell.boundingBox())!.x - hx)).toBeLessThan(1.5);
});

test('en tarjetas (móvil) no hay columnas fijas ni desplazamiento horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/catalogo/organismos');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
