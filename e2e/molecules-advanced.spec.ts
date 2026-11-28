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
  await expect(r.getByRole('button', { name: 'Negrita (Ctrl+B)' }).first()).toHaveAttribute('aria-pressed', 'true');
  await expect(r.getByRole('region', { name: 'HTML generado' })).toContainText('<b>Hola</b>');
  await expect(r.getByText('4/1,000')).toBeVisible();
  await page.keyboard.press('Control+k');
  const dlg = page.getByRole('dialog', { name: 'Enlace (Ctrl+K)' });
  await dlg.getByLabel('Dirección del enlace').fill('giftealo');
  await dlg.getByRole('button', { name: 'Insertar' }).click();
  await expect(dlg.getByText('Usa una dirección completa, ej. https://giftealo.com')).toBeVisible();
  await page.keyboard.press('Escape');
  // la barra es un toolbar: flechas recorren
  await r.getByRole('button', { name: 'Negrita (Ctrl+B)' }).first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(r.getByRole('button', { name: 'Cursiva (Ctrl+I)' }).first()).toBeFocused();
  await r.getByRole('button', { name: 'Cargar ejemplo' }).first().click();
  await expect(r.getByRole('region', { name: 'HTML generado' })).toContainText('rel="noopener noreferrer"');
});

// Pega un HTML como lo haría el portapapeles (Word, Google Docs, una web) y devuelve el HTML que quedó en el editor.
const pasteHtml = (page: import('@playwright/test').Page, editor: import('@playwright/test').Locator, html: string) =>
  editor.evaluate((el, h) => {
    (el as HTMLElement).focus();
    const dt = new DataTransfer(); dt.setData('text/html', h); dt.setData('text/plain', 'texto plano');
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    return el.innerHTML;
  }, html);

const GOOGLE_DOCS = '<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-1"><h1 dir="ltr" style="color:#000"><span style="font-weight:700;font-size:20pt">Términos</span></h1>' +
  '<p dir="ltr"><span style="font-weight:700">Al usar</span><span> el servicio aceptas.</span></p>' +
  '<ul><li dir="ltr"><p dir="ltr"><span>Primero</span></p></li><ul><li dir="ltr"><p dir="ltr"><span>Sub</span></p></li></ul></ul></b>';
const WORD = '<html xmlns:o="urn:schemas-microsoft-com:office:office"><body><!--StartFragment-->' +
  "<p class=MsoListParagraphCxSpFirst style='mso-list:l0 level1 lfo1'><![if !supportLists]><span style='mso-list:Ignore'>1.<span>&nbsp;</span></span><![endif]>Datos<o:p></o:p></p>" +
  "<p class=MsoListParagraphCxSpLast style='mso-list:l0 level2 lfo1'><![if !supportLists]><span style='mso-list:Ignore'>a.<span>&nbsp;</span></span><![endif]>Nombre<o:p></o:p></p><!--EndFragment--></body></html>";

test('texto enriquecido: pegar de Google Docs conserva títulos, negrita y sublistas, y quita estilos', async ({ page }) => {
  const r = region(page, 'Editor de texto enriquecido básico');
  const ed = r.getByRole('textbox', { name: 'Términos y condiciones' });
  const out = await pasteHtml(page, ed, GOOGLE_DOCS);
  expect(out).toContain('<h2>Términos</h2>');
  expect(out).toContain('<strong>Al usar</strong>');
  expect(out).toContain('<ul><li>Primero<ul><li>Sub</li></ul></li></ul>');
  expect(out).not.toMatch(/style=|font-weight|<b>/);
  await expect(page.getByText('Pegado con su estructura')).toBeVisible();
});

test('texto enriquecido: pegar de Word reconstruye la lista numerada con su nivel', async ({ page }) => {
  const r = region(page, 'Editor de texto enriquecido básico');
  const out = await pasteHtml(page, r.getByRole('textbox', { name: 'Términos y condiciones' }), WORD);
  expect(out).toContain('<ol><li>Datos<ol><li>Nombre</li></ol></li></ol>');
});

test('texto enriquecido: Tab anida y Mayús+Tab sube un nivel dentro de una lista; fuera de ella Tab sigue moviendo el foco', async ({ page }) => {
  const r = region(page, 'Editor de texto enriquecido básico');
  const ed = r.getByRole('textbox', { name: 'Términos y condiciones' });
  // El valor guardado se lee de la vista previa (es el HTML ya saneado).
  await r.getByRole('button', { name: 'Vista previa' }).click();
  const html = () => r.getByRole('region', { name: 'Vista previa' }).evaluate(el => el.innerHTML);
  await ed.click();
  await page.keyboard.type('Uno');
  await r.getByRole('button', { name: 'Lista con viñetas' }).nth(1).click();
  await page.keyboard.press('End');   // al convertir en lista el cursor queda al inicio de la línea
  await page.keyboard.press('Enter');
  await page.keyboard.type('Dos');
  await page.keyboard.press('Tab');
  await expect.poll(html).toContain('<ul><li>Uno<ul><li>Dos</li></ul></li></ul>');
  await page.keyboard.press('Shift+Tab');
  await expect.poll(html).toMatch(/<ul><li>Uno<\/li><li>Dos<\/li><\/ul>/);
  // Tab en el primer elemento (no se puede anidar) deja salir el foco del editor.
  await page.keyboard.press('ArrowUp'); await page.keyboard.press('Home');
  await page.keyboard.press('Tab');
  await expect(ed).not.toBeFocused();
});

test('texto enriquecido: la vista previa muestra el contenido como lo verá el lector, al costado en ancho y debajo en angosto', async ({ page }) => {
  const r = region(page, 'Editor de texto enriquecido básico');
  await r.getByRole('button', { name: 'Cargar ejemplo' }).nth(1).click();
  const toggle = r.getByRole('button', { name: 'Vista previa' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  const preview = r.getByRole('region', { name: 'Vista previa' });
  await expect(preview.getByRole('heading', { name: '1. Objeto' })).toBeVisible();
  await expect(preview.getByRole('table')).toBeVisible();
  await expect(preview.getByRole('link', { name: 'giftealo.com' })).toHaveAttribute('target', '_blank');
  // Ancho: editor y vista previa lado a lado (misma fila).
  const ed = r.getByRole('textbox', { name: 'Términos y condiciones' });
  const e = (await ed.boundingBox())!, p = (await preview.boundingBox())!;
  expect(Math.abs(p.y - e.y)).toBeLessThan(60);
  expect(p.x).toBeGreaterThan(e.x + e.width - 4);
  // Angosto: la vista previa pasa debajo.
  await page.setViewportSize({ width: 390, height: 900 });
  await expect.poll(async () => { const a = (await ed.boundingBox())!, b = (await preview.boundingBox())!; return b.y > a.y + a.height - 4; }).toBe(true);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(preview).toHaveCount(0);
});

test('texto enriquecido: la vista previa vacía explica qué verá quien escribe', async ({ page }) => {
  const r = region(page, 'Editor de texto enriquecido básico');
  await r.getByRole('button', { name: 'Vista previa' }).click();
  await expect(r.getByText('Aquí verás cómo se verá lo que escribas.')).toBeVisible();
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
