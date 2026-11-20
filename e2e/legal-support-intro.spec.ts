import { expect, test } from '@playwright/test';

/** Hoja legal con consentimiento, ayuda y soporte e introducción a pantalla completa (catálogo, moléculas). */
test.beforeEach(async ({ page }) => {
  await page.goto('/catalogo/moleculas');
  await expect(page.getByRole('heading', { name: 'Hoja legal y consentimiento' })).toBeVisible();
});

test('consentimiento: leer los términos y aceptar marca la casilla y muestra el chip', async ({ page }) => {
  const box = page.getByRole('region', { name: 'Hoja legal y consentimiento' });
  await page.getByRole('button', { name: 'Probar sin aceptar' }).click();
  await expect(box.getByText('Debes aceptar para continuar.')).toBeVisible();

  await box.getByRole('button', { name: 'Leer los términos' }).click();
  const dialog = page.getByRole('dialog', { name: 'Términos y condiciones' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('v2026.3')).toBeVisible();
  await expect(dialog.getByRole('heading', { name: '1. Uso de las gift cards' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Aceptar' }).click();
  await expect(dialog).toHaveCount(0);

  await expect(box.locator('zc-badge', { hasText: 'Términos aceptados' })).toBeVisible();
  await expect(box.getByText('Debes aceptar para continuar.')).toHaveCount(0);
});

test('soporte: una fila por canal con su enlace', async ({ page }) => {
  await page.getByRole('button', { name: 'Abrir ayuda y soporte' }).click();
  const dialog = page.getByRole('dialog', { name: 'Ayuda y soporte' });
  await expect(dialog.getByText('Lunes a viernes de 9:00 a 18:00')).toBeVisible();
  await expect(dialog.getByRole('link', { name: /Llamar: \+51 1 700 8000/ })).toHaveAttribute('href', 'tel:+5117008000');
  await expect(dialog.getByRole('link', { name: /WhatsApp: \+51 900 000 099/ })).toHaveAttribute('href', 'https://wa.me/51900000099');
  await expect(dialog.getByRole('link', { name: /Correo: soporte@zonacards.com/ })).toHaveAttribute('href', 'mailto:soporte@zonacards.com');
  await expect(dialog.getByRole('link', { name: /Centro de ayuda/ })).toHaveAttribute('href', 'https://ayuda.zonacards.com');
  await dialog.getByRole('button', { name: 'Cerrar', exact: true }).last().click();
  await expect(dialog).toHaveCount(0);
});

test('introducción: Continuar avanza, la última dice Empezar y Saltar desaparece', async ({ page }) => {
  const intro = page.locator('zc-intro-slides');
  await expect(intro.getByRole('heading', { name: 'Regala en segundos' })).toBeVisible();
  await expect(intro.getByRole('button', { name: 'Saltar' })).toBeVisible();
  await expect(intro.getByRole('img', { name: '1 / 3' })).toBeVisible();
  await intro.getByRole('button', { name: 'Continuar' }).click();
  await expect(intro.getByRole('heading', { name: 'Todo bajo control' })).toBeVisible();
  await intro.getByRole('button', { name: 'Continuar' }).click();
  await expect(intro.getByRole('heading', { name: 'Siempre contigo' })).toBeVisible();
  await expect(intro.getByRole('button', { name: 'Saltar' })).toHaveCount(0);
  await intro.getByRole('button', { name: 'Empezar' }).click();
  await expect(page.getByText('Introducción terminada.')).toBeVisible();
});

test('eliminar cuenta: enviar código, código inválido, código correcto y solicitud abierta', async ({ page }) => {
  const box = page.getByRole('region', { name: 'Eliminar mi cuenta' });
  await expect(box.getByText('¿Qué pasa si eliminas tu cuenta?')).toBeVisible();
  await box.getByRole('button', { name: 'Enviar código a mi correo' }).click();
  await expect(box.getByText(/Enviamos un código de 6 dígitos a tu correo a•••@empresa.com/)).toBeVisible();

  // Sin los 6 dígitos no se envía.
  await box.getByRole('button', { name: 'Solicitar eliminación' }).click();
  await expect(box.getByText('Ingresa los 6 dígitos del código.')).toBeVisible();

  const code = box.getByRole('textbox', { name: /Código de verificación|Dígito 1/ }).first();
  await code.click();
  await page.keyboard.type('111111');
  await box.getByRole('button', { name: 'Solicitar eliminación' }).click();
  await expect(box.getByText('El código no es válido.')).toBeVisible();

  await code.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('123456');
  await box.getByLabel('Motivo').fill('Ya no uso el servicio');
  await box.getByRole('button', { name: 'Solicitar eliminación' }).click();
  await expect(box.getByRole('heading', { name: 'Tu solicitud está «Pendiente»' })).toBeVisible();
  await expect(box.getByText(/La registraste el/)).toBeVisible();
  await box.getByRole('button', { name: 'Volver' }).click();
  await expect(box.getByRole('button', { name: 'Enviar código a mi correo' })).toBeVisible();
});
