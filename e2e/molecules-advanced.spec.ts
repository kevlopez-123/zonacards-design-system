import { expect, test } from '@playwright/test';

/** Moléculas avanzadas del catálogo (m-slider, m-color, m-rte, m-recur, m-sign, m-commerce, m-social de index.html). */
test.beforeEach(async ({ page }) => {
  await page.goto('/catalogo/moleculas');
  await expect(page.getByRole('heading', { name: 'Slider, RangeSlider, InputOTP y ColorField con contraste' })).toBeVisible();
});
const region = (page: import('@playwright/test').Page, name: string | RegExp) => page.getByRole('region', { name });

test('slider y rango: teclado, texto anunciado y pulgares que no se cruzan', async ({ page }) => {
  const r = region(page, /Slider, RangeSlider/);
  const com = r.getByRole('slider', { name: 'Comisión del cliente' });
  await com.focus();
  await page.keyboard.press('ArrowRight');
  await expect(com).toHaveAttribute('aria-valuetext', '5 %');
  await expect(r.getByText('5 %', { exact: true })).toBeVisible();
  const min = r.getByRole('slider', { name: 'Monto mínimo' });
  await min.fill('900');
  await expect(min).toHaveValue('490');
  await expect(r.getByText('S/ 490 a S/ 500')).toBeVisible();
});

test('OTP: escribir avanza, pegar llena todo y valida el código', async ({ page }) => {
  const r = region(page, /Slider, RangeSlider/);
  const d1 = r.getByRole('textbox', { name: 'Dígito 1 de 6' });
  await d1.click();
  await page.keyboard.type('12a');
  await expect(r.getByRole('textbox', { name: 'Dígito 3 de 6' })).toBeFocused();
  await expect(r.getByText('Solo se aceptan números.')).toBeVisible();
  await page.keyboard.type('0000');
  await expect(r.getByText('El código no coincide. Te quedan 2 intentos.')).toBeVisible();
  await d1.focus();
  await page.evaluate(() => {
    const dt = new DataTransfer(); dt.setData('text', '123 456');
    document.activeElement!.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  await expect(r.getByText('Código verificado.')).toBeVisible();
});

test('campo de color: contraste, formato y selector que se cancela con Escape', async ({ page }) => {
  const r = region(page, 'ColorPicker y ColorField');
  const btn = r.getByRole('textbox', { name: 'Color del botón' });
  await expect(r.getByText('Contraste 14.5:1: cumple AA.')).toBeVisible();
  await btn.fill('#12');
  await btn.blur();
  await expect(r.getByText('Usa formato hexadecimal, ej. #E4572E.')).toBeVisible();
  await btn.fill('f8ae23');
  await expect(btn).toHaveValue('#F8AE23');
  await expect(r.getByText(/no cumple AA/).first()).toBeVisible();

  await r.getByRole('button', { name: 'Abrir selector de color' }).first().click();
  const dlg = page.getByRole('dialog', { name: 'Selector de color' });
  await expect(dlg.getByRole('slider', { name: 'Saturación y brillo' })).toBeFocused();
  await dlg.getByRole('option', { name: /Giftealo azul/ }).click();
  await expect(btn).toHaveValue('#172948');
  await page.keyboard.press('Escape');
  await expect(dlg).toHaveCount(0);
  await expect(btn).toHaveValue('#F8AE23');
});

test('selector en línea: flechas en el área, RGB y contraste recomendado', async ({ page }) => {
  const r = region(page, 'ColorPicker y ColorField');
  const hex = r.getByRole('textbox', { name: 'Color hexadecimal' });
  await expect(hex).toHaveValue('#0F766E');
  await r.getByRole('slider', { name: 'Saturación y brillo' }).focus();
  await page.keyboard.press('Shift+ArrowDown');
  await expect(hex).not.toHaveValue('#0F766E');
  await r.getByRole('textbox', { name: 'Rojo de 0 a 255' }).fill('255');
  await expect(r.getByText(/Recomendado: texto/)).toBeVisible();
});

test('texto enriquecido: Ctrl+B, enlace validado y HTML sanitizado', async ({ page }) => {
  const r = region(page, 'Editor de texto enriquecido básico');
  const ed = r.getByRole('textbox', { name: /Mensaje para el destinatario/ });
  await ed.click();
  await page.keyboard.press('Control+b');
  await page.keyboard.type('Hola');
  await expect(r.getByRole('button', { name: 'Negrita (Ctrl+B)' })).toHaveAttribute('aria-pressed', 'true');
  await expect(r.getByRole('region', { name: 'HTML generado' })).toContainText('<b>Hola</b>');
  await expect(r.getByText('4/1,000')).toBeVisible();
  await page.keyboard.press('Control+k');
  const dlg = page.getByRole('dialog', { name: 'Enlace (Ctrl+K)' });
  await dlg.getByLabel('Dirección del enlace').fill('giftealo');
  await dlg.getByRole('button', { name: 'Insertar' }).click();
  await expect(dlg.getByText('Usa una dirección completa, ej. https://giftealo.com')).toBeVisible();
  await page.keyboard.press('Escape');
  // la barra es un toolbar: flechas recorren
  await r.getByRole('button', { name: 'Negrita (Ctrl+B)' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(r.getByRole('button', { name: 'Cursiva (Ctrl+I)' })).toBeFocused();
  await r.getByRole('button', { name: 'Cargar ejemplo' }).click();
  await expect(r.getByRole('region', { name: 'HTML generado' })).toContainText('rel="noopener noreferrer"');
});

test('recurrencia: frase, próximas fechas y semanal sin días', async ({ page }) => {
  const r = region(page, 'Selector de recurrencia');
  await expect(r.getByText(/^Cada semana los lunes y jueves a las 9:00/)).toBeVisible();
  await expect(r.locator('li')).toHaveCount(4);
  await r.getByRole('button', { name: 'lunes' }).click();
  await r.getByRole('button', { name: 'jueves' }).click();
  await expect(r.getByText('Elige al menos un día.')).toBeVisible();
  await expect(r.getByText('Sin fechas con esta configuración.')).toBeVisible();
  await r.getByRole('combobox', { name: 'Frecuencia' }).click();
  await page.getByRole('option', { name: 'Diario' }).click();
  await expect(r.getByText(/^Todos los días a las 9:00/)).toBeVisible();
});

test('firma: vacía da error; dibujada se registra con sello', async ({ page }) => {
  const r = region(page, 'Firma en pantalla');
  await r.getByRole('button', { name: 'Confirmar firma' }).click();
  await expect(r.getByText('Dibuja tu firma para continuar.')).toBeVisible();
  const box = (await r.getByRole('img', { name: 'Área para dibujar la firma' }).boundingBox())!;
  await page.mouse.move(box.x + 30, box.y + 100);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) await page.mouse.move(box.x + 30 + i * 20, box.y + 100 + (i % 2 ? 20 : -20));
  await page.mouse.up();
  await r.getByRole('button', { name: 'Confirmar firma' }).click();
  await expect(r.getByText('Firma registrada.')).toBeVisible();
  await expect(r.getByRole('img', { name: 'Firma dibujada' })).toBeVisible();
  await r.getByRole('radio', { name: 'Escribir' }).click();
  await r.getByPlaceholder('Escribe tu nombre completo').fill('Ana');
  await r.getByRole('button', { name: 'Confirmar firma' }).click();
  await expect(r.getByText('Escribe tu nombre y apellido.')).toBeVisible();
});

test('compra: monto con flechas y "Otro", cupones con reglas y contraseña', async ({ page }) => {
  const r = region(page, /Selector de monto, cupón/);
  const s50 = r.getByRole('radio', { name: 'S/ 50' });
  await s50.focus();
  await page.keyboard.press('ArrowRight');
  await expect(r.getByRole('radio', { name: 'S/ 100' })).toHaveAttribute('aria-checked', 'true');
  await expect(r.getByText('Total: S/ 100.00')).toBeVisible();
  await r.getByRole('radio', { name: 'Otro' }).click();
  const otro = r.getByRole('textbox', { name: 'Otro monto' });
  await expect(otro).toBeFocused();
  await otro.fill('5');
  await otro.blur();
  await expect(r.getByText('El monto debe estar entre S/ 10 y S/ 1,000.')).toBeVisible();

  const cup = r.getByRole('textbox', { name: /Cupones y gift cards/ });
  await cup.fill('bienvenida10');
  await expect(cup).toHaveValue('BIENVENIDA10');
  await cup.press('Enter');
  await expect(r.getByText('BIENVENIDA10 aplicado. Puedes agregar 2 más.')).toBeVisible();
  await expect(r.getByText('−S/ 20.00')).toBeVisible();
  await cup.fill('FLASH50');
  await r.getByRole('button', { name: 'Aplicar', exact: true }).click();
  await expect(r.getByText(/FLASH50 no se puede combinar/)).toBeVisible();
  await cup.fill('VERANO2025');
  await cup.press('Enter');
  await expect(r.getByText('El código VERANO2025 venció el 31/03/2026.')).toBeVisible();
  await r.getByRole('button', { name: 'Quitar BIENVENIDA10' }).click();
  await expect(r.getByText('BIENVENIDA10 quitado.')).toBeVisible();

  await r.getByLabel(/Crea una contraseña/).fill('Demo#2026');
  await expect(r.getByText('Seguridad: alta')).toBeVisible();
  await expect(r.getByRole('list', { name: 'Requisitos de la contraseña' }).locator('li.text-success')).toHaveCount(4);
});

test('acceso: texto aprobado por marca y botones de solo logo con nombre', async ({ page }) => {
  const r = region(page, /Botones de acceso con Google/);
  await expect(r.getByRole('button', { name: 'Continuar con Google' })).toHaveCount(4);
  await r.getByRole('radio', { name: 'Iniciar sesión' }).click();
  await expect(r.getByRole('button', { name: 'Iniciar sesión con Apple' })).toHaveCount(6);
  await expect(r.getByRole('button', { name: 'Iniciar sesión con Microsoft' })).toHaveCount(3);
  await r.getByRole('button', { name: 'Iniciar sesión con Google' }).first().click();
  await expect(r.getByRole('button', { name: 'Redirigiendo…' })).toBeDisabled();
  await expect(page.getByRole('status').filter({ hasText: 'OAuth 2.0' })).toBeVisible();
});
