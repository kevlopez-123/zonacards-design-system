import { expect, test } from '@playwright/test';

/** Pantalla Lotes (etapa 5, sección 8.4): KPI y filtros en la URL, orden, tabla, descargas, ficha y anulación con doble aprobación. */
test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('KPI que filtra: queda en la URL, muestra el chip y Atrás lo deshace', async ({ page }) => {
    await page.goto('/lotes');
    await expect(page.getByRole('heading', { name: 'Lotes', level: 1 })).toBeVisible();
    await expect(page.getByText('200 lotes', { exact: true })).toBeVisible();
    const anulados = page.getByRole('button', { name: /^Anulado/ });
    await anulados.click();
    await expect(page).toHaveURL(/estado=voided/);
    await expect(anulados).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('group', { name: 'Filtros activos' })).toContainText('Estado: Anulado');
    await expect(page.getByText(/de 200 lotes/)).toBeVisible();
    await page.goBack();
    await expect(page).not.toHaveURL(/estado=/);
    await expect(anulados).toHaveAttribute('aria-pressed', 'false');
  });

  test('un enlace con filtros se abre igual; la búsqueda llega a la URL y "Limpiar todo" vuelve a empezar', async ({ page }) => {
    await page.goto('/lotes?pais=cl&estado=activated');
    const chips = page.getByRole('group', { name: 'Filtros activos' });
    await expect(chips).toContainText('País: Chile');
    await expect(chips).toContainText('Estado: Activado');
    await page.getByRole('searchbox', { name: 'Buscar lotes' }).fill('entel');
    await expect(page).toHaveURL(/q=entel/);
    await chips.getByRole('button', { name: 'Limpiar todo' }).click();
    await expect(page).toHaveURL(/\/lotes$/);
    await expect(page.getByText('200 lotes', { exact: true })).toBeVisible();
  });

  test('sin resultados ofrece limpiar filtros', async ({ page }) => {
    await page.goto('/lotes?q=zzzz');
    await expect(page.getByRole('heading', { name: 'Sin resultados' })).toBeVisible();
    await page.getByRole('button', { name: 'Limpiar filtros' }).click();
    await expect(page.getByText('200 lotes', { exact: true })).toBeVisible();
  });

  test('orden y vista tabla en la URL; los encabezados ordenan en el servidor', async ({ page }) => {
    await page.goto('/lotes');
    await page.getByRole('button', { name: /Ordenar por/ }).click();
    await page.getByRole('menuitemradio', { name: 'Mayor valor' }).click();
    await expect(page).toHaveURL(/orden=-amount/);
    await page.getByRole('radio', { name: 'Tabla' }).click();
    await expect(page).toHaveURL(/vista=tabla/);
    const table = page.getByRole('table', { name: /Lotes/ });
    await expect(table.getByRole('columnheader', { name: 'Valor del lote' })).toHaveAttribute('aria-sort', 'descending');
    await table.getByRole('columnheader', { name: 'Cliente' }).getByRole('button').click();
    await expect(page).toHaveURL(/orden=client/);
    await expect(table.getByRole('columnheader', { name: 'Cliente' })).toHaveAttribute('aria-sort', 'ascending');
    await page.reload();
    await expect(page.getByRole('table', { name: /Lotes/ })).toBeVisible();
  });

  test('descargas con los filtros aplicados: Excel, CSV y PDF', async ({ page }) => {
    await page.goto('/lotes?pais=pe');
    for (const [name, ext] of [[/Excel/, 'xlsx'], [/CSV/, 'csv'], [/PDF/, 'pdf']] as const) {
      await page.getByRole('button', { name: 'Descargar lotes' }).click();
      const download = page.waitForEvent('download');
      await page.getByRole('menuitem', { name }).click();
      expect((await download).suggestedFilename()).toMatch(new RegExp(`^lotes-\\d{4}-\\d{2}-\\d{2}\\.${ext}$`));
    }
  });

  test('ficha: pestañas, anulación con motivo y confirmación escrita, pendiente de aprobación y retirar', async ({ page }) => {
    await page.goto('/lotes/02829');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('table', { name: 'Códigos del lote #02829' })).toBeVisible();
    await page.getByRole('tab', { name: /Historial/ }).click();
    await expect(page.getByText(/Lote creado con/)).toBeVisible();

    await page.getByRole('button', { name: 'Anular lote' }).click();
    const dlg = page.getByRole('alertdialog', { name: /¿Anular \d+ códigos del lote #02829\?/ });
    await dlg.getByRole('textbox', { name: /Motivo/ }).fill('Error en la orden de compra');
    await dlg.getByRole('textbox', { name: 'Escribe ANULAR para confirmar' }).fill('ANULAR');
    await dlg.getByRole('button', { name: 'Solicitar anulación' }).click();
    await expect(page.getByText('Anulación solicitada')).toBeVisible();
    const pending = page.getByRole('status').filter({ hasText: 'Anulación pendiente de aprobación' });
    await expect(pending).toContainText('Ana Torres solicitó anular');
    await expect(pending).toContainText('Debe aprobar: Supervisor de Operaciones');
    await expect(page.getByRole('button', { name: 'Anular lote' })).toHaveCount(0);
    await pending.getByRole('button', { name: 'Retirar solicitud' }).click();
    await expect(page.getByText('Solicitud retirada')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Anular lote' })).toBeVisible();
  });

  test('la tarjeta abre la ficha y su menú ⋮ anula sin salir del listado', async ({ page }) => {
    await page.goto('/lotes?q=02829');
    await page.getByRole('button', { name: 'Acciones del lote #02829' }).click();
    await page.getByRole('menuitem', { name: 'Anular lote' }).click();
    const dlg = page.getByRole('alertdialog');
    await dlg.getByRole('textbox', { name: /Motivo/ }).fill('Pedido duplicado');
    await dlg.getByRole('textbox', { name: 'Escribe ANULAR para confirmar' }).fill('ANULAR');
    await dlg.getByRole('button', { name: 'Solicitar anulación' }).click();
    await expect(page.getByText('Anulación pendiente', { exact: true })).toBeVisible();
    await page.locator('main article a').first().click();
    await expect(page).toHaveURL(/\/lotes\/02829$/);
  });

  test('estados: vacío, error con referencia y lote que no existe', async ({ page }) => {
    await page.goto('/lotes?scenario=vacio');
    await expect(page.getByText('Aún no hay lotes')).toBeVisible();
    await page.goto('/lotes?scenario=error');
    await expect(page.getByText('No se pudieron cargar los lotes')).toBeVisible();
    await expect(page.getByText(/Ref\. ZC-/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
    await page.goto('/lotes/99999');
    await expect(page.getByText('No encontramos el lote')).toBeVisible();
  });
});

test.describe('móvil', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('tarjetas sin selector de tabla, filtros en bottom sheet y "Cargar más"', async ({ page }) => {
    await page.goto('/lotes');
    await expect(page.getByRole('radio', { name: 'Tabla' })).toHaveCount(0);
    const nuevo = page.getByRole('link', { name: 'Nuevo lote' });
    // La acción principal ocupa el ancho que deja el menú "Más acciones" (flex-1).
    expect((await nuevo.boundingBox())!.width).toBeGreaterThan(250);
    await page.getByRole('button', { name: /^Filtros/ }).click();
    const sheet = page.getByRole('dialog', { name: 'Filtros' });
    await expect(sheet.getByRole('combobox', { name: 'País' })).toBeVisible();
    await sheet.getByRole('button', { name: 'Cerrar', exact: true }).click();
    await expect(page.locator('main article')).toHaveCount(25);
    await page.getByRole('button', { name: /Cargar 25 más/ }).click();
    await expect(page.locator('main article')).toHaveCount(50);
  });

  test('el menú móvil se cierra con Escape y devuelve el foco', async ({ page }) => {
    await page.goto('/lotes');
    const menu = page.getByRole('button', { name: 'Abrir menú', exact: true });
    await menu.click();
    await expect(page.getByRole('dialog', { name: 'Navegación principal' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeFocused();
  });
});
