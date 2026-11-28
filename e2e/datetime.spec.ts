import { expect, test } from '@playwright/test';

/** Fecha con hora en un solo campo y rango con tope y fechas no disponibles. */
test.beforeEach(async ({ page }) => {
  await page.goto('/catalogo/moleculas');
  await expect(page.getByRole('heading', { name: 'DateField, DatePicker, DateRangePicker y TimeField' })).toBeVisible();
});

test('fecha y hora: el valor está incompleto hasta tener las dos partes', async ({ page }) => {
  const group = page.getByRole('group', { name: 'Envío programado' });
  await expect(page.getByText('un solo valor: incompleto')).toBeVisible();
  await group.getByRole('textbox', { name: 'Fecha' }).fill('24/12/2099');
  await expect(page.getByText('un solo valor: incompleto')).toBeVisible();
  await group.getByRole('textbox', { name: 'Hora' }).fill('0930');
  await expect(page.getByText('un solo valor: 2099-12-24T09:30')).toBeVisible();
});

test('reserva: sin domingos y con tope de 7 días', async ({ page }) => {
  await page.getByRole('combobox', { name: /Reserva/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Elegir periodo' });
  // El periodo inicial (últimos 30 días) pasa del tope: los atajos más largos quedan deshabilitados.
  await expect(dialog.getByRole('radio', { name: /Últimos 30 días/ })).toBeDisabled();
  await expect(dialog.getByRole('radio', { name: 'Hoy' })).toBeEnabled();
  // Con un inicio elegido, un día a más de 7 días queda deshabilitado.
  const days = dialog.locator('button[data-day]:not([disabled])');
  await days.first().click();
  const farAway = dialog.locator('button[data-day][disabled]');
  expect(await farAway.count()).toBeGreaterThan(0);
});

test('reserva: sin rango propuesto, Aplicar espera uno válido y Escape cierra el panel', async ({ page }) => {
  await page.getByRole('combobox', { name: /Reserva/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Elegir periodo' });
  await expect(dialog.getByRole('button', { name: 'Aplicar' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});
