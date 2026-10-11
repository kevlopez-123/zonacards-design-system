import { expect, test } from '@playwright/test';

/** Tanda 7: gráficos de operación, medios, pase Wallet, escáner, patrones móviles y permisos. */
test.beforeEach(async ({ page }) => { await page.setViewportSize({ width: 1280, height: 900 }); });

test('gráficos de operación: los 7 tipos dibujan y tienen vista Datos', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-charts2');
  const r = page.getByRole('region', { name: 'Gráficos de operación' });
  // Cada gráfico se crea con @defer (on viewport): se recorre la sección para que aparezcan todos.
  await r.scrollIntoViewIfNeeded();
  for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 450); await page.waitForTimeout(150); }
  for (const t of ['El 27 % de lo emitido no llega a canjearse', 'Los canjes se concentran viernes y sábado entre 12 y 15 h', 'La emisión del mes va al 78 % de la meta']) {
    const img = r.getByRole('img', { name: t });
    await img.scrollIntoViewIfNeeded();
    await expect(img.locator('canvas').first()).toBeVisible();
  }
  const funnel = r.locator('zc-chart').first();
  await funnel.getByRole('tab', { name: 'Datos' }).click();
  await expect(funnel.getByRole('cell', { name: '9,130' }).or(funnel.getByRole('cell', { name: '9130' }))).toBeVisible();
});

test('medios: mapa, galería que se amplía y carrusel con puntos y botones', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-media');
  const r = page.getByRole('region', { name: 'Map, Gallery y Carousel' });
  const map = r.getByRole('img', { name: 'Mapa de locales por ciudad' });
  await map.scrollIntoViewIfNeeded();
  await expect(map.locator('canvas').first()).toBeVisible();
  await r.getByRole('button', { name: 'Ampliar imagen de Viajes' }).click();
  await expect(page.getByRole('dialog', { name: 'Viajes' })).toBeVisible();
  await page.keyboard.press('Escape');
  const car = r.getByRole('region', { name: 'Plantillas' });
  await expect(car.getByRole('button', { name: 'Anterior' })).toBeDisabled();
  await car.getByRole('button', { name: 'Siguiente' }).click();
  await expect(car.getByRole('button', { name: 'Ir a la diapositiva 2' })).toHaveAttribute('aria-current', 'true');
  await car.getByRole('button', { name: 'Ir a la diapositiva 6' }).click();
  await expect(car.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
});

test('wallet: edición en vivo, plataforma y reverso', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-wallet');
  const r = page.getByRole('region', { name: 'Diseñador y vista previa de pase Wallet' });
  await r.getByRole('textbox', { name: 'Nombre del programa' }).fill('Club Enjoy');
  await r.getByRole('textbox', { name: 'Puntos de ejemplo' }).fill('5x00');
  await expect(r.getByRole('img', { name: 'Pase de Apple Wallet: Club Enjoy, 500 puntos, nivel Oro' })).toBeVisible();
  await r.getByRole('radio', { name: 'Google Wallet' }).click();
  await expect(r.getByRole('img', { name: 'Pase de Google Wallet: Club Enjoy, 500 puntos' })).toBeVisible();
  await r.getByRole('button', { name: 'Ver reverso' }).click();
  await expect(r.getByText('giftealo.com')).toBeVisible();
});

test('escáner: resultados simulados, canje parcial, código manual y sin conexión', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-scanner');
  const r = page.getByRole('region', { name: 'Escáner QR y de código de barras para canjes' });
  await r.getByRole('button', { name: 'Válido', exact: true }).click();
  const sheet = r.getByRole('dialog', { name: 'Resultado: vale válido' });
  await sheet.getByRole('textbox', { name: /Monto a canjear/ }).fill('150');
  await sheet.getByRole('button', { name: 'Confirmar canje' }).click();
  await expect(sheet.getByText('El saldo disponible es S/ 100.00.')).toBeVisible();
  await sheet.getByRole('textbox', { name: /Monto a canjear/ }).fill('40');
  await sheet.getByRole('button', { name: 'Confirmar canje' }).click();
  await expect(r.getByRole('dialog', { name: 'Canje confirmado' }).getByText('Saldo restante: S/ 60.00')).toBeVisible();
  await r.getByRole('button', { name: 'Escanear otro' }).click();

  await r.getByRole('button', { name: 'Ya canjeado' }).click();
  await expect(r.getByText('Este vale ya fue canjeado')).toBeVisible();
  await r.getByRole('dialog').getByRole('button', { name: 'Ingresar código' }).click();
  const code = r.getByRole('textbox', { name: /Número del vale/ });
  await code.pressSequentially('1234ab5678');
  await expect(code).toHaveValue('1234 5678');
  await r.getByRole('button', { name: 'Validar' }).click();
  await expect(r.getByText('El código tiene 16 dígitos (llevas 8).')).toBeVisible();
});

test('patrones móviles: navegación inferior, aviso del sistema, deslizar y PIN', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-mobile');
  const r = page.getByRole('region', { name: 'Patrones de app móvil y responsive' });
  await r.getByRole('button', { name: 'Simular sin conexión' }).click();
  await expect(r.getByRole('status').filter({ hasText: 'Sin conexión' })).toBeVisible();
  const nav = r.getByRole('navigation', { name: 'Navegación de la app' });
  await nav.getByRole('button', { name: 'Historial' }).click();
  await expect(nav.getByRole('button', { name: 'Historial' })).toHaveAttribute('aria-current', 'page');
  await r.getByRole('button', { name: 'Acciones de Canje S/ 40.00' }).click();
  await page.getByRole('menuitem', { name: 'Anular' }).click();
  await expect(r.getByText('PIN de supervisor')).toBeVisible();
  for (const k of ['1', '1', '1', '1']) await r.getByRole('button', { name: k, exact: true }).click();
  await expect(r.getByText('PIN incorrecto. Te quedan 2 intentos.')).toBeVisible();
  for (const k of ['2', '4', '6', '8']) await r.getByRole('button', { name: k, exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'PIN correcto' })).toBeVisible();
});

test('permisos: pantalla previa, negado y notificaciones push', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-perm');
  const r = page.getByRole('region', { name: 'Permisos y notificaciones push' });
  await expect(r.getByText('Usa la cámara para validar vales')).toBeVisible();
  await expect(r.getByText('La cámara está desactivada')).toBeVisible();
  await expect(r.getByRole('img', { name: /Zonacards: Anulación aprobada/ })).toBeVisible();
  await expect(r.getByRole('button', { name: 'Ahora no' })).toBeVisible();
});
