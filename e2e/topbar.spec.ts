import { expect, test } from '@playwright/test';

/** Barra superior (topbar de index.html): país, idioma, búsqueda Ctrl+K y notificaciones. */
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/lotes');
  await expect(page.getByRole('heading', { name: 'Lotes', exact: true })).toBeVisible();
});

test('Ctrl+K abre la búsqueda: filtra sin tildes, flechas y Enter navegan, Escape devuelve el foco', async ({ page }) => {
  const btn = page.getByRole('button', { name: 'Buscar (Control K)' }).first();
  await btn.click();
  const dlg = page.getByRole('dialog', { name: 'Buscar en Zonacards' });
  await expect(dlg.getByRole('combobox')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dlg).toHaveCount(0);
  await expect(btn).toBeFocused();

  await page.keyboard.press('Control+k');
  await expect(dlg.getByRole('combobox')).toBeFocused();
  await page.keyboard.type('catalogo');
  await expect(dlg.getByRole('option')).toHaveCount(1);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/catalogo\/fundamentos$/);
});

test('notificaciones: contador, filtros por tipo, marcar todo como leído y abrir una', async ({ page }) => {
  const bell = page.getByRole('button', { name: 'Notificaciones, 3 sin leer' });
  await bell.click();
  const panel = page.getByRole('dialog', { name: 'Notificaciones' });
  await expect(panel.getByRole('tab', { name: 'Todas' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(panel.getByRole('tab', { name: 'Aprobaciones' })).toHaveAttribute('aria-selected', 'true');
  await expect(panel.getByRole('button', { name: /solicitó anular el lote/ })).toBeVisible();
  await expect(panel.getByRole('button', { name: /Stock bajo mínimo/ })).toHaveCount(0);
  await panel.getByRole('button', { name: 'Marcar todo como leído' }).click();
  await expect(page.getByRole('button', { name: 'Notificaciones, 0 sin leer' })).toBeVisible();
  await panel.getByRole('button', { name: /solicitó anular el lote/ }).click();
  await expect(page).toHaveURL(/\/aprobaciones/);
});

test('país de operación: lista con moneda e identificador, se recuerda al recargar', async ({ page }) => {
  await page.getByRole('button', { name: /País de operación: Perú, moneda PEN/ }).click();
  const dlg = page.getByRole('dialog', { name: 'País de operación' });
  await expect(dlg.getByRole('radio', { name: /Perú/ })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(dlg.getByRole('radio', { name: /Ecuador/ })).toBeFocused();
  await dlg.getByRole('radio', { name: /Chile/ }).click();
  await expect(page.getByRole('button', { name: /País de operación: Chile, moneda CLP/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: /País de operación: Chile, moneda CLP/ })).toBeVisible();
});

test('idioma: cambia toda la interfaz y portugués figura como próximamente', async ({ page }) => {
  await page.getByRole('button', { name: /^ES · Idioma: Español/ }).click();
  await expect(page.getByRole('menuitemradio', { name: /Português/ })).toHaveAttribute('aria-disabled', 'true');
  await page.getByRole('menuitemradio', { name: /English/ }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('button', { name: 'Search (Control K)' }).first()).toBeVisible();
  await page.getByRole('button', { name: /^EN · Language: English/ }).click();
  await page.getByRole('menuitemradio', { name: /Español/ }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('o-l10n del catálogo: país, formato e idioma cambian la vista previa al instante y la barra superior', async ({ page }) => {
  await page.goto('/catalogo/organismos');
  const r = page.getByRole('region', { name: /Selectores de idioma, país, moneda/ });
  await r.getByRole('combobox', { name: 'País de operación' }).click();
  await page.locator('.cdk-overlay-container').getByRole('option', { name: /Chile/ }).click();
  await expect(r.getByText('Chile · RUT 20100047218')).toBeVisible();
  // Chile se escribe con el código (el símbolo sería "$", ambiguo entre países).
  await expect(r.getByText(/CLP\s1\.250\.351/)).toBeVisible();
  await expect(page.getByRole('button', { name: /País de operación: Chile, moneda CLP/ })).toBeVisible();
  await r.getByRole('radio', { name: 'aaaa-mm-dd' }).click();
  await expect(r.getByText('2026-12-31')).toBeVisible();
  await r.getByRole('combobox', { name: 'Idioma de la interfaz' }).click();
  await page.locator('.cdk-overlay-container').getByRole('option', { name: /English/ }).click();
  await expect(r.getByText('Batch summary #02829')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
