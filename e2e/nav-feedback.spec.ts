import { expect, test } from '@playwright/test';

/** Moléculas de navegación y feedback de la etapa 3: teclado, foco, anuncios y móvil (sección 15 de las reglas). */
test.beforeEach(async ({ page }) => {
  await page.goto('/catalogo');
  await expect(page.getByRole('heading', { name: 'Tabs y migas' })).toBeVisible();
});

test('tabs: flechas recorren, saltan las deshabilitadas y muestran su panel', async ({ page }) => {
  const list = page.getByRole('tablist', { name: 'Secciones del cliente' });
  await list.getByRole('tab', { name: /General/ }).click();
  await page.keyboard.press('ArrowRight');
  const canjes = list.getByRole('tab', { name: /Canjes/ });
  await expect(canjes).toBeFocused();
  await expect(canjes).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: /Canjes/ })).toContainText('290 canjes');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  // Desde General, con vuelta: la última habilitada (Auditoría está deshabilitada).
  await expect(list.getByRole('tab', { name: /Zona de peligro/ })).toBeFocused();
});

test('paginación compacta: siguiente, ir a página y última', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Paginación' }).first();
  await expect(nav).toContainText('1–25 de 1.240');
  await nav.getByRole('button', { name: 'Página siguiente' }).click();
  await expect(nav).toContainText('26–50 de 1.240');
  const jump = nav.getByRole('textbox', { name: 'Ir a la página' });
  await jump.fill('12');
  await jump.press('Enter');
  await expect(nav).toContainText('276–300 de 1.240');
  await expect(jump).toBeFocused();
  // Al llegar a la última página el botón se deshabilita y el foco pasa al campo "Página".
  await nav.getByRole('button', { name: 'Última página' }).click();
  await expect(nav).toContainText('1.226–1.240 de 1.240');
  await expect(nav.getByRole('button', { name: 'Última página' })).toBeDisabled();
  await expect(jump).toBeFocused();
});

test('paginación: numérica marca la actual y "Cargar más" agrega hasta el final', async ({ page }) => {
  await page.getByRole('button', { name: 'Página 4' }).click();
  await page.getByRole('button', { name: 'Página 5' }).click();
  await expect(page.getByRole('button', { name: 'Página 5' })).toHaveAttribute('aria-current', 'page');
  const more = page.getByRole('button', { name: /Cargar 12 más/ });
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /Cargar 12 más/ }).click();
  await expect(page.getByText('Mostrando 48 de 48 lotes')).toBeVisible();
  await expect(page.getByRole('button', { name: 'No hay más lotes' })).toBeDisabled();
  await expect(more).toHaveCount(0);
});

test('acordeón: uno abierto a la vez, flechas entre encabezados y Expandir todo', async ({ page }) => {
  const q1 = page.getByRole('button', { name: '¿Cuándo se activa un código?' });
  const q2 = page.getByRole('button', { name: '¿Se puede extender la vigencia?' });
  await expect(q1).toHaveAttribute('aria-expanded', 'true');
  await q1.focus();
  await page.keyboard.press('ArrowDown');
  await expect(q2).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(q2).toHaveAttribute('aria-expanded', 'true');
  await expect(q1).toHaveAttribute('aria-expanded', 'false');

  const group = page.getByRole('group', { name: 'Varios abiertos, con ícono, subtítulo y estado' });
  await page.getByRole('button', { name: 'Expandir todo' }).last().click();
  await expect(group.getByRole('button', { name: /Contactos/ })).toHaveAttribute('aria-expanded', 'true');
  await expect(group.getByRole('button', { name: /Integración NetSuite/ })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('button', { name: 'Contraer todo' })).toBeVisible();
});

test('menú kebab: abre y cierra con el mismo botón, flechas, deshabilitado con motivo y Escape', async ({ page }) => {
  const kebab = page.getByRole('region', { name: 'Menú de acciones' }).getByRole('button', { name: 'Acciones del lote #02829' });
  await kebab.click();
  const menu = page.getByRole('menu', { name: 'Acciones del lote #02829' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Ver ficha' })).toBeFocused();
  await expect(menu.getByRole('menuitem', { name: /Reenviar no activados/ })).toHaveAttribute('aria-disabled', 'true');
  await expect(menu.getByText('Sin códigos pendientes')).toBeVisible();
  await kebab.click();
  await expect(menu).toHaveCount(0);

  await kebab.focus();
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('menuitem', { name: 'Ver ficha' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Elegiste: Enviar códigos')).toBeVisible();
  await expect(kebab).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(kebab).toBeFocused();
});

test('toast: se anuncia, la acción lo cierra y la cola muestra 3 a la vez', async ({ page }) => {
  await page.getByRole('button', { name: 'Toast con acción' }).click();
  const status = page.getByRole('status').filter({ hasText: 'Exportación en curso' });
  await expect(status).toHaveAttribute('aria-live', 'polite');
  await page.getByRole('button', { name: 'Ver exportaciones' }).click();
  await expect(page.getByText('Exportación en curso')).toHaveCount(0);

  await page.getByRole('button', { name: 'Error con acción (no se cierra solo)' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'No se pudo conectar con NetSuite' }).locator('zc-toast')).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar notificación' }).click();

  await page.getByRole('button', { name: 'Cola de 5 toasts' }).click();
  await expect(page.locator('zc-toast')).toHaveCount(3);
  await page.getByRole('button', { name: 'Cerrar notificación' }).first().click();
  await expect(page.locator('zc-toast')).toHaveCount(3);
  await expect(page.getByText('Envío 4 de 5 programado')).toBeVisible();
});

test('carga de archivos: valida tipo y peso antes de subir y detalla errores por fila', async ({ page }) => {
  const input = page.locator('zc-file-upload input[type=file]');
  await input.setInputFiles([
    { name: 'contactos-navidad.xlsx', mimeType: 'application/octet-stream', buffer: Buffer.alloc(86_000) },
    { name: 'contactos-bienvenida.xlsx', mimeType: 'application/octet-stream', buffer: Buffer.alloc(120_000) },
  ]);
  await input.setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: Buffer.alloc(10) });
  await expect(page.getByText('Tipo de archivo no permitido. Usa .xlsx.')).toBeVisible();
  await expect(page.getByText('480 filas válidas')).toBeVisible();
  await expect(page.getByText('3 filas con errores')).toBeVisible();
  const errors = page.getByRole('region', { name: 'Errores en contactos-bienvenida.xlsx' });
  await expect(errors.getByRole('row')).toHaveCount(4);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar errores' }).click();
  expect((await download).suggestedFilename()).toBe('contactos-bienvenida-errores.csv');
  await page.getByRole('button', { name: 'Quitar foto.png' }).click();
  await expect(page.getByText('foto.png')).toHaveCount(0);
});

test.describe('móvil', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('migas acortadas, menú en bottom sheet y carga solo con "Elegir archivo"', async ({ page }) => {
    const crumbs = page.getByRole('navigation', { name: 'Migas de pan' }).first();
    await expect(crumbs.getByRole('link', { name: 'Clientes' })).toBeHidden();
    await expect(crumbs.getByRole('link', { name: 'Navidad 2026' })).toBeVisible();
    await crumbs.getByRole('button', { name: 'Mostrar ruta completa' }).click();
    await expect(crumbs.getByRole('link', { name: 'Clientes' })).toBeVisible();

    await page.getByRole('region', { name: 'Menú de acciones' }).getByRole('button', { name: 'Acciones del lote #02829' }).click();
    const sheet = page.getByRole('dialog', { name: 'Acciones del lote #02829' });
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: 'Cerrar' }).click();
    await expect(sheet).toHaveCount(0);

    await expect(page.getByText('Arrastra el XLSX aquí')).toBeHidden();
    const choose = page.getByRole('button', { name: 'Elegir archivo' });
    await expect(choose).toBeVisible();
    expect((await choose.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });
});
