import { expect, test } from '@playwright/test';

/** Barra de acciones sobre una selección múltiple (catálogo, m-action-bar). */
test.beforeEach(async ({ page }) => {
  await page.goto('/catalogo/moleculas');
  await expect(page.getByRole('heading', { name: 'ActionBar', exact: true })).toBeVisible();
});

const section = (page: import('@playwright/test').Page) => page.locator('#m-action-bar');
const bar = (page: import('@playwright/test').Page) => section(page).getByRole('region', { name: 'Acciones sobre la selección' });

test('aparece al elegir, cuenta, ejecuta una acción y se quita con la X', async ({ page }) => {
  await expect(bar(page)).toHaveCount(0);
  await section(page).getByText('Lote #02829').click();
  await section(page).getByText('Lote #02830').click();
  await expect(bar(page)).toBeVisible();
  await expect(bar(page)).toContainText('2 seleccionados');
  await bar(page).getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('send: 2 lotes')).toBeVisible();
  await bar(page).getByRole('button', { name: 'Quitar selección' }).click();
  await expect(bar(page)).toHaveCount(0);
});

test('una acción deshabilitada explica el motivo y no se ejecuta', async ({ page }) => {
  await section(page).getByText('Lote #02831', { exact: true }).click();
  const exportar = bar(page).getByRole('button', { name: 'Exportar' });
  await expect(exportar).toBeDisabled();
  await bar(page).locator('span[tabindex="0"]').focus();
  await expect(page.getByRole('tooltip')).toContainText('Un borrador no se puede exportar');
});

test('flotante: queda pegada abajo, dentro de la pantalla', async ({ page }) => {
  await section(page).getByText('Lote #02829').click();
  await section(page).getByRole('button', { name: 'Probar flotante' }).click();
  const box = await bar(page).boundingBox();
  const vp = page.viewportSize()!;
  expect(box!.y + box!.height).toBeLessThanOrEqual(vp.height);
  expect(box!.y + box!.height).toBeGreaterThan(vp.height - 40);
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width);
});

test('en 375 px las acciones dejan solo el ícono y conservan su nombre', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await section(page).getByText('Lote #02829').click();
  const enviar = bar(page).getByRole('button', { name: 'Enviar' });
  await expect(enviar).toBeVisible();
  expect((await enviar.boundingBox())!.width).toBeLessThan(64);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
