import { expect, test } from '@playwright/test';

/** Errores del servidor en formularios: caen en su campo, el foco va al primero y el error se borra al editar. */
test.beforeEach(async ({ page }) => {
  await page.goto('/catalogo/atomos');
  await expect(page.getByRole('heading', { name: 'Input, Textarea, Label y mensajes' })).toBeVisible();
});

test('los errores del servidor caen en su campo y el foco va al primero', async ({ page }) => {
  const form = page.getByRole('form', { name: 'Errores del servidor' });
  await form.getByRole('button', { name: 'Guardar y simular error del servidor' }).click();
  await expect(form.getByText('Ya existe una cuenta con este correo.')).toBeVisible();
  await expect(form.getByText('El nombre no puede llevar números.')).toBeVisible();
  await expect(form.getByRole('alert').filter({ hasText: 'la cuenta está suspendida' })).toBeVisible();
  await expect(form.getByRole('textbox', { name: /Correo de la cuenta/ })).toBeFocused();
  await expect(form.getByRole('textbox', { name: /Correo de la cuenta/ })).toHaveAttribute('aria-invalid', 'true');
});

test('el error de un campo desaparece cuando se edita, y los demás se quedan', async ({ page }) => {
  const form = page.getByRole('form', { name: 'Errores del servidor' });
  await form.getByRole('button', { name: 'Guardar y simular error del servidor' }).click();
  await expect(form.getByText('Ya existe una cuenta con este correo.')).toBeVisible();
  await form.getByRole('textbox', { name: /Correo de la cuenta/ }).fill('otra@empresa.com');
  await expect(form.getByText('Ya existe una cuenta con este correo.')).toHaveCount(0);
  await expect(form.getByText('El nombre no puede llevar números.')).toBeVisible();
});
