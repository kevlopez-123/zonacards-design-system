import { expect, test } from '@playwright/test';

/** Catálogo del design system: índice, fundamentos y átomos (mismas secciones que docs/design-system/index.html). */
test.describe('átomos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/catalogo/atomos');
    await expect(page.getByRole('heading', { name: 'Checkbox, CheckboxGroup, Radio, Switch' })).toBeVisible();
  });

  test('checkbox y switch se alternan con Espacio; "Seleccionar todo" parte parcial', async ({ page }) => {
    const incluir = page.getByRole('checkbox', { name: 'Incluir en liquidaciones' });
    await incluir.focus();
    await page.keyboard.press('Space');
    await expect(incluir).toHaveAttribute('aria-checked', 'false');

    const todo = page.getByRole('checkbox', { name: 'Seleccionar todo (parcial)' });
    await expect(todo).toHaveAttribute('aria-checked', 'mixed');
    await todo.click();
    await expect(todo).toHaveAttribute('aria-checked', 'true');

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

  test('toda la fila es clicable, mide 48 px (56 px en táctil) y las filas se separan 16 px', async ({ page }) => {
    await page.getByText('Recordatorio de vencimiento').click();
    await expect(page.getByRole('switch', { name: /Recordatorio de vencimiento/ })).toHaveAttribute('aria-checked', 'true');
    const rows = page.getByRole('region', { name: 'Checkbox, CheckboxGroup, Radio, Switch' }).locator('zc-checkbox');
    const a = await rows.nth(0).boundingBox(); const b = await rows.nth(1).boundingBox();
    expect(a!.height).toBeGreaterThanOrEqual(48);
    expect(Math.round(b!.y - a!.y - a!.height)).toBe(16);
  });

  test('button: clic pasa por "Guardando…" a "Guardado" con toast y vuelve al inicio', async ({ page }) => {
    const region = page.getByRole('region', { name: 'Button, ButtonGroup, CloseButton, Link' });
    const btn = region.getByRole('button', { name: 'Guardar campaña' }).last();
    await btn.click();
    await expect(region.getByRole('button', { name: 'Guardando…' })).toHaveAttribute('aria-busy', 'true');
    await expect(region.getByRole('button', { name: 'Guardado' })).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'Campaña guardada' })).toBeVisible();
    await expect(region.getByRole('button', { name: 'Guardar campaña' })).toHaveCount(4, { timeout: 4000 });
  });

  test('botón deshabilitado: el contenedor enfocable explica el motivo', async ({ page }) => {
    const region = page.getByRole('region', { name: 'Button, ButtonGroup, CloseButton, Link' });
    const wrapper = region.locator('span[tabindex="0"]', { has: page.getByRole('button', { name: 'Guardar campaña', disabled: true }) });
    await wrapper.focus();
    await expect(page.getByRole('tooltip')).toHaveText('Completa los campos obligatorios');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('tooltip')).toHaveCount(0);
  });

  test('input: mostrar contraseña, contador del textarea y mensajes enlazados', async ({ page }) => {
    const region = page.getByRole('region', { name: 'Input, Textarea, Label y mensajes' });
    const pass = region.getByLabel('Contraseña temporal');
    await expect(pass).toHaveAttribute('type', 'password');
    await region.getByRole('button', { name: 'Mostrar contraseña' }).click();
    await expect(pass).toHaveAttribute('type', 'text');
    await region.getByLabel(/Motivo de la anulación/).fill('Cliente desistió');
    await expect(region.getByText('16/280')).toBeVisible();
    await expect(region.getByLabel(/RUC/)).toHaveAttribute('aria-invalid', 'true');
    await expect(region.getByLabel(/RUC/)).toHaveAccessibleDescription('Ingresa un RUC de 11 dígitos.');
  });

  test('chips: removible, seleccionable y restaurar', async ({ page }) => {
    const region = page.getByRole('region', { name: 'Badge, Chip/Tag y Count' });
    await region.getByRole('button', { name: 'Quitar País: Perú' }).click();
    await expect(region.getByRole('button', { name: 'Quitar País: Perú' })).toHaveCount(0);
    const terceros = region.getByRole('button', { name: 'Terceros' });
    await terceros.click();
    await expect(terceros).toHaveAttribute('aria-pressed', 'true');
    await region.getByRole('button', { name: 'Restaurar chips' }).click();
    await expect(region.getByRole('button', { name: 'Quitar País: Perú' })).toBeVisible();
  });

  test('montos: se abrevian en 130 px con la cifra completa para lectores y en tooltip', async ({ page }) => {
    const region = page.getByRole('region', { name: 'Montos (zc-money)' });
    const compact = region.locator('zc-money.zc-money-compact [tabindex="0"]').first();
    await expect(compact).toHaveAttribute('data-full', /S\/\s10,900\.00/);
    // La cifra completa aparece en el tooltip del sistema con el foco de teclado.
    await compact.focus();
    await expect(page.getByRole('tooltip')).toHaveText(/S\/\s10,900\.00/);
    await expect(region.getByRole('cell', { name: 'MM', exact: true })).toBeVisible();
  });

  test('progreso: la barra se llena según el máximo (332 de 500)', async ({ page }) => {
    const bar = page.getByRole('progressbar', { name: 'Envío en curso' });
    const fill = bar.locator('[data-slot="progress-indicator"]');
    const [track, inner] = [await bar.boundingBox(), await fill.evaluate(e => e.getBoundingClientRect().right)];
    expect((inner - track!.x) / track!.width).toBeCloseTo(0.664, 1);
  });
});

test.describe('fundamentos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/catalogo/fundamentos');
    await expect(page.getByRole('heading', { name: 'Paleta extendida' })).toBeVisible();
  });

  test('paleta: clic copia el hexadecimal y lo confirma con un toast', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => undefined);
    await page.getByRole('button', { name: /^Navy Giftealo \(marca\) 900, #172948/ }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Copiado #172948' })).toBeVisible();
  });

  test('fechas: el formato de hora cambia toda la tabla', async ({ page }) => {
    const region = page.getByRole('region', { name: 'Formatos de fecha y hora' });
    await expect(region.getByRole('cell', { name: '2:30 PM', exact: true })).toBeVisible();
    await region.getByRole('radio', { name: '24 h · 14:30' }).click();
    await expect(region.getByRole('cell', { name: '14:30', exact: true }).first()).toBeVisible();
  });

  test('tipografía: el selector cambia --zc-font-sans y se restaura al salir', async ({ page }) => {
    await page.getByRole('radio', { name: 'Outfit' }).click();
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain('Outfit');
    // Navegación interna (sin recargar) por el índice, que bajo 1536 px está en el drawer.
    await page.getByRole('button', { name: 'Índice' }).click();
    await page.getByRole('dialog', { name: 'Índice del design system' }).getByRole('link', { name: 'Átomos', exact: true }).click();
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain('Figtree');
  });

  test('scroll: la preferencia "Mostrar siempre" se aplica y se recuerda', async ({ page }) => {
    await page.getByRole('switch', { name: 'Mostrar siempre las barras de desplazamiento' }).click();
    await expect(page.locator('html')).toHaveClass(/sb-always/);
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/sb-always/);
  });
});

test('índice: búsqueda sin tildes y enlace a la sección', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/catalogo');
  await expect(page).toHaveURL(/\/catalogo\/fundamentos$/);
  const index = page.getByRole('complementary', { name: 'Índice del design system' });
  await index.getByLabel('Buscar sección').fill('logos');
  await expect(index.getByRole('link', { name: /Logos de marcas/ })).toBeVisible();
  await expect(index.getByRole('link', { name: /Paleta extendida/ })).toHaveCount(0);
  await index.getByLabel('Buscar sección').fill('tabla');
  await index.getByRole('link', { name: /^Tabla de datos/ }).click();
  await expect(page).toHaveURL(/\/catalogo\/organismos#o-table$/);
});

test('índice en móvil: botón "Índice" abre el drawer y navegar lo cierra', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/catalogo/atomos');
  await page.getByRole('button', { name: 'Índice' }).click();
  const drawer = page.getByRole('dialog', { name: 'Índice del design system' });
  await drawer.getByRole('link', { name: /^Montos/ }).click();
  await expect(drawer).toHaveCount(0);
  await expect(page).toHaveURL(/#a-money$/);
});
