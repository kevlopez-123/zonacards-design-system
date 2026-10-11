import { expect, test } from '@playwright/test';

/** Organismos de estructura de la Tanda 3: autenticación, chat de ayuda y tour guiado (index.html: o-auth, o-chat, o-tour). */
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/catalogo/organismos');
  await expect(page.getByRole('heading', { name: 'Organismo de autenticación' })).toBeVisible();
});

test('autenticación: validación, intentos fallidos, segundo factor y sesión iniciada', async ({ page }) => {
  const r = page.getByRole('region', { name: 'Organismo de autenticación' });
  await r.getByRole('button', { name: 'Ingresar' }).click();
  await expect(r.getByText('Ingresa tu correo.')).toBeVisible();
  await expect(r.getByRole('textbox', { name: /Correo/ })).toBeFocused();
  await r.getByRole('textbox', { name: /Correo/ }).fill('ana@promotick.com');
  await r.getByLabel(/Contraseña/).fill('mala');
  await r.getByRole('button', { name: 'Ingresar' }).click();
  await expect(r.getByText('Correo o contraseña incorrectos')).toBeVisible();
  await expect(r.getByLabel(/Contraseña/)).toHaveValue('');
  await r.getByLabel(/Contraseña/).fill('Demo#2026');
  await r.getByRole('button', { name: 'Ingresar' }).click();
  await expect(r.getByRole('heading', { name: 'Verifica que eres tú' })).toBeFocused();
  await expect(r.getByRole('button', { name: /Reenviar código en \d+ s/ })).toBeDisabled();
  await r.getByRole('textbox', { name: 'Dígito 1 de 6' }).click();
  await page.keyboard.type('123456');
  await expect(r.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Sesión iniciada' })).toBeVisible();
});

test('autenticación: 5 intentos bloquean 15 minutos; recuperar contraseña no revela si la cuenta existe', async ({ page }) => {
  const r = page.getByRole('region', { name: 'Organismo de autenticación' });
  await r.getByRole('textbox', { name: /Correo/ }).fill('otra@empresa.com');
  for (let i = 0; i < 5; i++) {
    await r.getByLabel(/Contraseña/).fill('x');
    await r.getByRole('button', { name: 'Ingresar' }).click();
    await expect(r.getByRole('button', { name: 'Ingresar' })).not.toHaveAttribute('aria-busy', 'true');
  }
  await expect(r.getByText('Cuenta bloqueada temporalmente')).toBeVisible();
  await expect(r.getByRole('button', { name: 'Ingresar' })).toBeDisabled();
  await r.getByRole('button', { name: '¿Olvidaste tu contraseña?' }).click();
  await r.getByRole('textbox', { name: /Correo/ }).fill('nadie@x.com');
  await r.getByRole('button', { name: 'Enviar enlace' }).click();
  await expect(r.getByText(/Si nadie@x\.com tiene una cuenta/)).toBeVisible();
  // Portal / e-commerce: Google y Apple primero
  await r.getByRole('radio', { name: 'Portal / e-commerce' }).click();
  await r.getByRole('button', { name: 'Reiniciar demostración' }).click();
  await expect(r.getByRole('button', { name: 'Continuar con Google' })).toBeVisible();
  await expect(r.getByRole('button', { name: 'Continuar con Apple' })).toBeVisible();
});

test('chat: Enter envía, estado leído, indicador de escritura y respuesta; respuestas rápidas', async ({ page }) => {
  const r = page.getByRole('region', { name: 'Centro de ayuda y chat' });
  const box = r.getByRole('textbox', { name: 'Escribe tu mensaje' });
  await expect(r.getByRole('button', { name: 'Enviar', exact: true })).toBeDisabled();
  await box.fill('Hola');
  await page.keyboard.press('Shift+Enter');
  await page.keyboard.type('¿cómo reenviar un código?');
  await page.keyboard.press('Enter');
  await expect(box).toHaveValue('');
  await expect(r.getByRole('status', { name: 'El asistente está escribiendo' })).toBeVisible();
  await expect(r.getByText(/Para reenviar, abre la ficha del código/)).toBeVisible();
  await r.getByRole('button', { name: 'Estado de un pedido' }).click();
  await expect(r.getByText(/Escribe el número del pedido/)).toBeVisible();
});

test('tour: resalta elementos reales, Siguiente/Atrás, el foco queda en la tarjeta y Escape vuelve al botón', async ({ page }) => {
  const start = page.getByRole('button', { name: 'Iniciar recorrido' });
  await start.click();
  const card = page.getByRole('dialog', { name: 'Elige el tema' });
  await expect(card).toContainText('Paso 1 de 4');
  await expect(card.getByRole('button', { name: 'Siguiente' })).toBeFocused();
  await card.getByRole('button', { name: 'Siguiente' }).click();
  const c2 = page.getByRole('dialog', { name: 'País de operación' });
  await expect(c2.getByRole('button', { name: 'Atrás' })).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(c2.locator(':focus')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(c2).toHaveCount(0);
  await expect(start).toBeFocused();
});
