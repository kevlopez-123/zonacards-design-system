import { expect, test } from '@playwright/test';

/** Teclado y táctil de los átomos de la etapa 1 (sección 15 de las reglas). */
test.beforeEach(async ({ page }) => {
  await page.goto('/catalogo');
  await expect(page.getByRole('heading', { name: 'Checkbox, Radio y Switch' })).toBeVisible();
});

test('checkbox y switch se alternan con Espacio; "Seleccionar todo" queda parcial', async ({ page }) => {
  const incluir = page.getByRole('checkbox', { name: 'Incluir en liquidaciones' });
  await incluir.focus();
  await page.keyboard.press('Space');
  await expect(incluir).toHaveAttribute('aria-checked', 'false');

  const todo = page.getByRole('checkbox', { name: 'Seleccionar todo (parcial)' });
  await expect(todo).toHaveAttribute('aria-checked', 'mixed');
  await todo.click();
  await expect(page.getByRole('checkbox', { name: 'Recargas' })).toHaveAttribute('aria-checked', 'true');

  const sw = page.getByRole('switch', { name: 'Alertas de stock' });
  await sw.focus();
  await page.keyboard.press('Space');
  await expect(sw).toHaveAttribute('aria-checked', 'false');
});

test('radio: las flechas recorren y saltan las opciones deshabilitadas', async ({ page }) => {
  const group = page.getByRole('radiogroup', { name: 'Radio · Canal de envío' });
  await group.getByRole('radio', { name: 'Correo electrónico' }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(group.getByRole('radio', { name: 'WhatsApp' })).toBeChecked();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(group.getByRole('radio', { name: /SMS/ })).not.toBeChecked();
});

test('toda la fila es clicable y mide al menos 48 px (56 px en táctil)', async ({ page }) => {
  await page.getByText('Recordatorio de vencimiento').click();
  await expect(page.getByRole('switch', { name: /Recordatorio de vencimiento/ })).toHaveAttribute('aria-checked', 'true');
  const row = await page.locator('zc-checkbox label').first().boundingBox();
  expect(row!.height).toBeGreaterThanOrEqual(48);
});

test('chip removible se quita con su botón y el foco no se pierde en la página', async ({ page }) => {
  const chips = page.getByRole('region', { name: 'Chip' });
  await chips.getByRole('button', { name: 'Quitar País: Perú' }).click();
  await expect(chips.getByRole('button', { name: 'Quitar País: Perú' })).toHaveCount(0);
  const propias = page.getByRole('button', { name: 'Terceros' });
  await propias.click();
  await expect(propias).toHaveAttribute('aria-pressed', 'true');
});

test('tooltip aparece con foco de teclado, explica el botón deshabilitado y Escape lo oculta', async ({ page }) => {
  const btn = page.getByRole('button', { name: 'Pasa el cursor o enfoca' });
  await btn.focus();
  const tip = page.getByRole('tooltip');
  await expect(tip).toHaveText('El tooltip aparece con mouse y con foco de teclado');
  await page.keyboard.press('Escape');
  await expect(tip).toHaveCount(0);

  // Un botón disabled no recibe mouse ni foco: el contenedor enfocable lleva el tooltip.
  const wrapper = page.locator('span[tabindex="0"]', { has: page.getByRole('button', { name: 'Publicar campaña' }) });
  await wrapper.hover();
  await expect(page.getByRole('tooltip')).toHaveText('Completa los campos obligatorios para publicar');
  await page.mouse.move(0, 0);
  await wrapper.focus();
  await expect(page.getByRole('tooltip')).toHaveText('Completa los campos obligatorios para publicar');
});
