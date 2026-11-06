import { expect, Page, test } from '@playwright/test';

/** Tanda 6: kanban, dashboard configurable, editor de correo y galería con carga. */
test.beforeEach(async ({ page }) => { await page.setViewportSize({ width: 1280, height: 900 }); });

const col = (page: Page, name: string) => page.getByRole('list', { name, exact: true });

test('kanban: teclado entre columnas, límite, cancelar, menú "Mover a" y arrastre', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-kanban');
  const card = page.locator('[data-kid="#PE-1042"]');
  await card.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  await expect(card).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(card).toBeFocused();
  await page.keyboard.press('Space');
  await expect(col(page, 'En ruta').locator('[data-kid="#PE-1042"]')).toHaveCount(1);
  await expect(page.getByText('Sobre el límite')).toBeVisible();

  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  await expect(card).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(col(page, 'En ruta').locator('[data-kid="#PE-1042"]')).toHaveCount(1);
  await page.keyboard.press('Space');

  await page.getByRole('button', { name: 'Mover #PE-1042' }).click();
  await page.getByRole('menuitem', { name: 'Entregado' }).click();
  await expect(col(page, 'Entregado').locator('[data-kid="#PE-1042"]')).toHaveCount(1);
  await expect(page.getByText('Sobre el límite')).toHaveCount(0);

  const from = await page.locator('[data-kid="#PE-1039"]').boundingBox();
  const to = await page.locator('[data-col="pend"]').boundingBox();
  await page.mouse.move(from!.x + 20, from!.y + 20);
  await page.mouse.down();
  await page.mouse.move(to!.x + 40, to!.y + to!.height - 30, { steps: 12 });
  await page.mouse.up();
  await expect(col(page, 'Pendiente').locator('[data-kid="#PE-1039"]')).toHaveCount(1);
});

test('kanban en móvil: una columna con pestañas', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/catalogo/organismos#o-kanban');
  const r = page.getByRole('region', { name: 'Kanban de pedidos' });
  await expect(r.locator('[data-col]')).toHaveCount(1);
  await r.getByRole('radio', { name: /En ruta/ }).click();
  await expect(col(page, 'En ruta')).toBeVisible();
});

test('dashboard: editar, ancho por menú, quitar, agregar, restablecer y guardar', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-dash');
  const r = page.getByRole('region', { name: 'Dashboard configurable' });
  await r.getByRole('button', { name: 'Editar dashboard' }).click();
  await expect(r.getByRole('button', { name: 'Mover Valor emitido' })).toBeVisible();
  await r.getByRole('button', { name: 'Opciones de Valor emitido' }).click();
  await page.getByRole('menuitemradio', { name: 'Ancho completo' }).click();
  await expect(page.locator('[data-wid="val"]')).toHaveAttribute('style', /flex: 4 1 100%/);
  await r.getByRole('button', { name: 'Opciones de Redención' }).click();
  await page.getByRole('menuitem', { name: 'Quitar del dashboard' }).click();
  await expect(page.locator('[data-wid="red"]')).toHaveCount(0);
  await r.getByRole('button', { name: 'Agregar widget' }).click();
  await page.getByRole('menuitem', { name: 'Stock bajo mínimo' }).click();
  await expect(page.locator('[data-wid="stock"]')).toBeVisible();
  await r.getByRole('button', { name: 'Restablecer del rol' }).click();
  await expect(page.locator('[data-wid="red"]')).toBeVisible();
  await r.getByRole('button', { name: 'Listo' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Dashboard guardado' })).toBeVisible();
});

test('editor de correo: agregar, editar texto y color, mover y vista celular', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-email');
  const r = page.getByRole('region', { name: 'Editor de correo por bloques' });
  await r.getByRole('textbox', { name: 'Texto' }).fill('¡Feliz Navidad!');
  await expect(r.getByRole('heading', { name: '¡Feliz Navidad!' })).toBeVisible();
  await r.getByRole('button', { name: 'Botón', exact: true }).click();
  await expect(r.getByRole('button', { name: 'Editar bloque Botón' }).first()).toHaveAttribute('aria-pressed', 'true');
  await r.getByRole('button', { name: 'Quitar bloque' }).click();
  await r.getByRole('button', { name: 'Editar bloque Título' }).click();
  await r.getByRole('button', { name: 'Bajar bloque' }).click();
  await r.getByRole('radio', { name: 'Celular' }).click();
  await expect(r.getByRole('list', { name: 'Bloques del correo' })).toHaveClass(/max-w-\[340px\]/);
  await r.getByRole('button', { name: 'Enviar prueba' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Correo de prueba enviado' })).toBeVisible();
});

test('galería: rechaza formato, exige texto alternativo, sube con progreso y cambia la portada', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-images');
  const r = page.getByRole('region', { name: 'Galería con carga de imágenes' });
  await expect(r.getByText('3/8 imágenes')).toBeVisible();
  await r.getByRole('button', { name: 'Guardar galería' }).click();
  await expect(r.getByText('1 imagen sin texto alternativo.')).toBeVisible();
  const alt = r.getByRole('textbox', { name: 'Texto alternativo de viajes.jpg' });
  await expect(alt).toBeFocused();
  await alt.fill('Playa al atardecer');

  await r.locator('input[type=file]').setInputFiles({ name: 'notas.txt', mimeType: 'text/plain', buffer: Buffer.from('hola') });
  await expect(r.getByText('Formato no permitido. Usa JPG, PNG o WebP.')).toBeVisible();
  await r.getByRole('button', { name: 'Quitar', exact: true }).click();

  await r.getByRole('button', { name: 'Usar como portada' }).last().click();
  await expect(r.getByRole('list', { name: 'Imágenes de la galería' }).locator('img').first()).toHaveAttribute('alt', 'Playa al atardecer');
  await r.getByRole('button', { name: 'Guardar galería' }).click();
  await expect(r.getByText('Galería guardada.')).toBeVisible();
});
