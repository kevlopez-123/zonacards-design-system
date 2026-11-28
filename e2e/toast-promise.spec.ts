import { expect, test } from '@playwright/test';

/** toast.promise: un solo aviso que pasa de "cargando" a éxito o error en su lugar. */
test.beforeEach(async ({ page }) => {
  await page.goto('/catalogo/moleculas');
  await expect(page.getByRole('heading', { name: 'Tabs, ToggleButtonGroup, Breadcrumbs' })).toBeVisible();
});

test('éxito: "cargando" con giro y luego el mismo aviso en éxito', async ({ page }) => {
  await page.getByRole('button', { name: 'Guardar y esperar (éxito)' }).click();
  const toast = page.locator('zc-toast');
  await expect(toast).toHaveCount(1);
  await expect(toast.getByText('Guardando el lote…')).toBeVisible();
  await expect(toast.getByRole('status', { name: 'Cargando' })).toBeVisible();
  await expect(toast.getByText('Lote guardado')).toBeVisible();
  await expect(toast.getByText('120 códigos listos para enviar.')).toBeVisible();
  await expect(toast).toHaveCount(1);
  await expect(toast.getByRole('status', { name: 'Cargando' })).toHaveCount(0);
});

test('error: pasa a la región de alertas y se anuncia', async ({ page }) => {
  await page.getByRole('button', { name: 'Guardar y esperar (error)' }).click();
  await expect(page.locator('zc-toast').getByText('Guardando el lote…')).toBeVisible();
  const alert = page.getByRole('alert').locator('zc-toast');
  await expect(alert.getByText('No se pudo guardar el lote')).toBeVisible();
  await expect(page.locator('zc-toast')).toHaveCount(1);
});

test('el aviso de "cargando" se puede cerrar y el resultado igual aparece', async ({ page }) => {
  await page.getByRole('button', { name: 'Guardar y esperar (error)' }).click();
  await page.getByRole('button', { name: 'Cerrar notificación' }).click();
  await expect(page.locator('zc-toast')).toHaveCount(0);
  await expect(page.getByRole('alert').getByText('No se pudo guardar el lote')).toBeVisible();
});
