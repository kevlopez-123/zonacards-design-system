import { expect, test } from '@playwright/test';

/** Tanda 5: tabla editable, constructor de reglas, checkout y tarjetas de comercio. */
test.beforeEach(async ({ page }) => { await page.setViewportSize({ width: 1280, height: 900 }); });

test('tabla editable: validación al salir, cantidades limitadas, agregar, quitar y continuar', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-grid');
  const r = page.getByRole('region', { name: 'Tabla editable (destinatarios)' });
  await expect(r.getByText('4 destinatarios sin gift cards asignadas')).toBeVisible();
  const mail3 = r.getByRole('textbox', { name: 'Correo de la fila 3' });
  await mail3.focus();
  await mail3.blur();
  await expect(mail3).toHaveAttribute('aria-invalid', 'true');
  await expect(r.getByText('Correo no válido')).toBeVisible();
  await mail3.fill('psalazar@empresa.com');
  await expect(mail3).not.toHaveAttribute('aria-invalid', 'true');

  await r.getByRole('button', { name: 'Asignar 1 a todos' }).click();
  await expect(r.getByText('4 destinatarios sin gift cards asignadas')).toBeHidden();
  const qty = r.getByRole('spinbutton', { name: 'Cantidad de la fila 1' });
  await qty.fill('99');
  await qty.blur();
  await expect(qty).toHaveValue('47');

  await r.getByRole('button', { name: 'Añadir fila' }).click();
  await expect(r.getByRole('textbox', { name: 'Nombre de la fila 5' })).toBeFocused();
  await r.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText('Revisa la tabla')).toBeVisible();
  await expect(r.getByRole('textbox', { name: 'Nombre de la fila 5' })).toBeFocused();
  await r.getByRole('button', { name: 'Eliminar fila 5' }).click();
  await r.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Destinatarios listos' })).toBeVisible();
});

test('tabla editable en móvil: una tarjeta por destinatario', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/catalogo/organismos#o-grid');
  const r = page.getByRole('region', { name: 'Tabla editable (destinatarios)' });
  await expect(r.getByRole('listitem', { name: 'Destinatario 1' })).toBeVisible();
  await expect(r.getByRole('table')).toHaveCount(0);
});

test('constructor de reglas: la frase sigue a los cambios, agregar grupo y probar', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-rules');
  const r = page.getByRole('region', { name: 'Constructor de reglas y segmentos' });
  await expect(r.getByText(/monto de la compra es mayor que S\/\s1,000\.00 y país es Perú y \(canal es API o compras del día es mayor que 5\)/)).toBeVisible();
  await r.getByRole('radio', { name: 'Alguna (O)' }).first().click();
  await expect(r.getByText(/S\/\s1,000\.00 o país es Perú o \(/)).toBeVisible();
  await r.getByRole('textbox', { name: 'Valor' }).first().fill('25a00');
  await expect(r.getByRole('textbox', { name: 'Valor' }).first()).toHaveValue('2500');
  await expect(r.getByRole('group', { name: 'Grupo de condiciones' })).toHaveCount(2);
  await r.getByRole('button', { name: 'Grupo', exact: true }).click();
  await expect(r.getByRole('group', { name: 'Grupo de condiciones' })).toHaveCount(3);
  await r.getByRole('button', { name: 'Quitar grupo' }).last().click();
  await expect(r.getByRole('group', { name: 'Grupo de condiciones' })).toHaveCount(2);
  await r.getByRole('button', { name: 'Probar regla' }).click();
  await expect(r.getByText(/habría retenido 37 de 12,480 compras/)).toBeVisible();
});

test('checkout: pasos con validación, resumen y editar, carrito con cupón y pago', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-checkout');
  const r = page.getByRole('region', { name: 'Checkout por pasos, opciones y métodos de pago' });
  await r.getByText('Combo Whopper Doble').click();
  await expect(r.getByRole('radio', { name: /Combo Whopper Doble/ })).toBeChecked();
  await r.getByRole('button', { name: 'Guardar y continuar' }).click();
  await expect(r.getByText('Para mí · Combo Whopper Doble')).toBeVisible();

  await r.getByRole('button', { name: 'Guardar y continuar' }).click();
  await expect(r.getByText('Escribe el nombre del destinatario.')).toBeVisible();
  await expect(r.getByRole('textbox', { name: /a quién quieres sorprender/ })).toBeFocused();
  await r.getByRole('textbox', { name: /a quién quieres sorprender/ }).fill('Dani');
  await r.getByRole('button', { name: 'Guardar y continuar' }).click();
  await expect(r.getByText('El celular debe tener 9 dígitos.')).toBeVisible();
  await r.getByRole('checkbox', { name: 'Por WhatsApp' }).click();
  await r.getByRole('checkbox', { name: 'Por correo electrónico' }).click();
  await r.getByRole('textbox', { name: 'Correo del destinatario' }).fill('dani@gmail.com');
  await r.getByRole('button', { name: 'Guardar y continuar' }).click();
  await expect(r.getByText('Dani · correo · inmediato')).toBeVisible();

  await r.getByRole('textbox', { name: /Tu correo/ }).fill('yo@correo.com');
  await r.getByRole('button', { name: 'Continuar al pago' }).click();
  await r.getByRole('button', { name: 'Editar Destinatario' }).click();
  await expect(r.getByRole('textbox', { name: /a quién quieres sorprender/ })).toHaveValue('Dani');
  await r.getByRole('button', { name: 'Guardar y continuar' }).click();
  await r.getByRole('button', { name: 'Continuar al pago' }).click();

  const cart = r.locator('zc-cart');
  await expect(cart.getByText('S/ 374.00')).toBeVisible();
  await cart.getByRole('textbox', { name: /Cupones/ }).fill('NAVIDAD20');
  await cart.getByRole('button', { name: 'Aplicar' }).click();
  await expect(cart.getByText('S/ 354.00')).toBeVisible();

  await r.getByText('Billetera QR').click();
  await expect(r.getByText(/Escanea el QR desde tu app/)).toBeVisible();
  await r.getByRole('button', { name: 'Pagar S/ 354.00' }).click();
  await expect(page.getByRole('status').filter({ hasText: '¡Compra realizada!' })).toBeVisible();
});

test('comercio: anuncio y guía se cierran, favoritos y límite alcanzado', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-commerce');
  const r = page.getByRole('region', { name: /Producto, ayuda, llamada a la acción/ });
  await r.getByRole('button', { name: 'Cerrar Anuncio' }).click();
  await expect(r.getByRole('region', { name: 'Anuncio' })).toHaveCount(0);
  await r.getByRole('button', { name: 'Ocultar guía de inicio' }).click();
  await expect(r.getByText('Optimiza compras, envío y control sin procesos manuales')).toHaveCount(0);
  await expect(r.getByRole('meter', { name: 'Uso del límite' })).toHaveCount(2);
  await expect(r.getByText('Límite alcanzado')).toBeVisible();
  await r.getByRole('button', { name: 'Agregar Tarjeta Repsol a favoritos' }).click();
  await expect(r.getByRole('button', { name: 'Quitar Tarjeta Repsol de favoritos' })).toBeVisible();
});
