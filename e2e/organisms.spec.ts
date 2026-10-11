import { expect, test } from '@playwright/test';

/** Organismos base de la etapa 4: teclado, foco, overlays, tabla, gráficos y móvil (secciones 15, 16 y 21 de las reglas). */
test.use({ viewport: { width: 1440, height: 900 } });

test.beforeEach(async ({ page }) => {
  await page.goto('/catalogo');
  await expect(page.getByRole('heading', { name: 'Sidebar', exact: true })).toBeVisible();
});

test('sidebar: Ctrl+B alterna a riel, se recuerda al recargar y el riel tiene nombres completos', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await expect(nav.getByRole('button', { name: 'Contraer menú' })).toBeVisible();
  await page.keyboard.press('Control+b');
  await expect(nav.getByRole('button', { name: 'Expandir menú' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Catálogo de componentes' })).toHaveAttribute('aria-current', 'page');
  await page.reload();
  await expect(nav.getByRole('button', { name: 'Expandir menú' })).toBeVisible();
  await nav.getByRole('button', { name: 'Expandir menú' }).click();
  await expect(nav.getByRole('button', { name: 'Contraer menú' })).toBeVisible();
});

test('sidebar de demostración: submenú y elemento actual', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Navegación del portal (demostración)' });
  await expect(nav.getByRole('button', { name: 'Disponibles' })).toHaveAttribute('aria-current', 'page');
  await nav.getByRole('button', { name: 'Finanzas' }).click();
  await nav.getByRole('button', { name: 'Saldos' }).click();
  await expect(nav.getByRole('button', { name: 'Saldos' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByText('Saldos', { exact: true }).last()).toBeVisible();
});

test('drawer: el select abre encima, Escape cierra solo la capa superior y el foco vuelve al botón', async ({ page }) => {
  const opener = page.getByRole('button', { name: 'Detalle del lote (drawer)' });
  await opener.click();
  const drawer = page.getByRole('dialog', { name: 'Lote #02829' });
  await expect(drawer).toBeVisible();
  await drawer.getByRole('combobox', { name: 'Reasignar campaña' }).click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(drawer).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test('modal: valida al enviar y conserva lo escrito; Cancelar cierra', async ({ page }) => {
  await page.getByRole('button', { name: 'Extender vigencia (modal)' }).click();
  const modal = page.getByRole('dialog', { name: 'Extender vigencia' });
  await modal.getByRole('button', { name: 'Solicitar extensión' }).click();
  await expect(modal.getByText('Elige la nueva fecha.')).toBeVisible();
  await expect(modal.getByText('Escribe el motivo; queda en la auditoría.')).toBeVisible();
  await modal.getByRole('button', { name: 'Cancelar' }).click();
  await expect(modal).toHaveCount(0);
});

test('alert dialog: confirmar exige motivo y la palabra exacta; el scrim no cierra', async ({ page }) => {
  await page.getByRole('button', { name: 'Anular lote (alert dialog)' }).click();
  const dlg = page.getByRole('alertdialog', { name: '¿Anular 500 códigos?' });
  const ok = dlg.getByRole('button', { name: 'Solicitar anulación' });
  await expect(dlg.getByRole('textbox', { name: /Motivo/ })).toBeFocused();
  await expect(ok).toBeDisabled();
  await page.mouse.click(10, 10);
  await expect(dlg).toBeVisible();
  await dlg.getByRole('textbox', { name: /Motivo/ }).fill('Error en la orden de compra');
  await dlg.getByRole('textbox', { name: 'Escribe ANULAR para confirmar' }).fill('anular');
  await expect(ok).toBeDisabled();
  await dlg.getByRole('textbox', { name: 'Escribe ANULAR para confirmar' }).fill('ANULAR');
  await ok.click();
  await expect(page.getByText('Anulación solicitada')).toBeVisible();
  await expect(dlg).toHaveCount(0);
});

test('stepper: el resumen de errores recibe el foco y enlaza con el campo', async ({ page }) => {
  await page.getByRole('button', { name: 'Continuar' }).click();
  const summary = page.getByRole('alert').filter({ hasText: 'Revisa 3 campos para continuar' });
  await expect(summary).toBeFocused();
  await summary.getByRole('link', { name: 'Ingresa la razón social.' }).click();
  await expect(page.getByRole('textbox', { name: 'Razón social (obligatorio)' })).toBeFocused();
  await page.getByRole('textbox', { name: 'Razón social (obligatorio)' }).fill('Interbank S.A.A.');
  await expect(page.locator('[aria-current="step"]')).toContainText('Empresa');
});

test('filtros: quitar un chip mueve el foco y "Más filtros" abre el drawer con el conteo', async ({ page }) => {
  const chipX = page.getByRole('group', { name: 'Filtros activos' }).getByRole('button', { name: 'Quitar País: Perú' });
  await chipX.click();
  await expect(chipX).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Más filtros' })).toBeFocused();
  await page.getByRole('button', { name: 'Más filtros' }).click();
  const drawer = page.getByRole('dialog', { name: 'Más filtros' });
  await expect(drawer).toContainText('30 lotes coinciden');
  await drawer.getByRole('button', { name: 'Ver 30 lotes' }).click();
  await expect(drawer).toHaveCount(0);
});

test('tabla: alternar vista, ordenar con aria-sort, selección masiva, columnas y fila expandible', async ({ page }) => {
  await page.getByRole('radio', { name: 'Tabla' }).click();
  const table = page.getByRole('table', { name: /Lotes/ });
  await expect(table).toBeVisible();
  const client = table.getByRole('columnheader', { name: 'Cliente' });
  await client.getByRole('button').click();
  await expect(client).toHaveAttribute('aria-sort', 'ascending');
  await client.getByRole('button').click();
  await expect(client).toHaveAttribute('aria-sort', 'descending');

  await table.getByRole('checkbox', { name: 'Seleccionar todos' }).click();
  const bulk = page.getByRole('region', { name: 'Acciones masivas' });
  await expect(bulk).toContainText('7 seleccionados');
  await bulk.getByRole('button', { name: 'Quitar selección' }).click();
  await expect(bulk).toHaveCount(0);

  await page.getByRole('button', { name: 'Columnas', exact: true }).click();
  await page.getByRole('dialog', { name: 'Columnas visibles' }).getByRole('checkbox', { name: 'Cliente' }).click();
  await page.keyboard.press('Escape');
  await expect(table.getByRole('columnheader', { name: 'Cliente' })).toHaveCount(0);

  const expand = table.getByRole('button', { name: /Ver detalle de lote/ }).first();
  await expand.click();
  await expect(expand).toHaveAttribute('aria-expanded', 'true');
  await expect(table.getByText('Categoría')).toBeVisible();
});

test('gráficos: vista Datos y descarga CSV con nombre del título', async ({ page }) => {
  const chart = page.getByRole('figure', { name: 'Gastronomía lidera las redenciones' });
  await page.getByRole('heading', { name: 'Gráficos', exact: true }).scrollIntoViewIfNeeded();
  await chart.scrollIntoViewIfNeeded();
  await chart.getByRole('tab', { name: 'Datos' }).click();
  await expect(chart.getByRole('table')).toContainText('Gastronomía');
  await chart.getByRole('button', { name: 'Descargar gráfico' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: /CSV/ }).click();
  expect((await download).suggestedFilename()).toMatch(/^gastronomia-lidera-las-redenciones-\d{4}-\d{2}-\d{2}\.csv$/);
});

test.describe('tablet', () => {
  test.use({ viewport: { width: 1000, height: 900 } });

  test('riel con tooltips, filtros en un solo botón y sin selector de tabla', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    await expect(nav.getByRole('link', { name: 'Lotes' })).toBeVisible();
    await expect(nav.getByRole('button', { name: /Contraer|Expandir/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Filtros \d/ })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Tabla' })).toHaveCount(0);
  });
});

test.describe('móvil', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('menú en drawer: Escape cierra y el foco vuelve al botón de menú', async ({ page }) => {
    const menu = page.getByRole('button', { name: 'Abrir menú', exact: true });
    await menu.click();
    const drawer = page.getByRole('dialog', { name: 'Navegación principal' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Contraer menú' })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
    await expect(menu).toBeFocused();
  });

  test('drawer como bottom sheet; un select dentro abre subpantalla con Volver', async ({ page }) => {
    await page.getByRole('button', { name: 'Detalle del lote (drawer)' }).click();
    const sheet = page.getByRole('dialog', { name: 'Lote #02829' });
    await sheet.getByRole('combobox', { name: 'Reasignar campaña' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(2);
    await page.getByRole('button', { name: 'Volver', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(1);
    const box = await sheet.boundingBox();
    expect(box!.y + box!.height).toBeGreaterThan(800);
    await sheet.getByRole('button', { name: 'Cerrar', exact: true }).first().click();
    await expect(sheet).toHaveCount(0);
  });
});
