import { Page, expect, test } from '@playwright/test';

/** Bandeja de aprobaciones (etapa 6, sección 8.10): segregación de funciones, aprobar en lote con resumen, rechazo con comentario. */
const asUser = (page: Page, id: string) => page.addInitScript(u => sessionStorage.setItem('zc-demo-user', u), id);

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Ana no ve Aprobar en sus solicitudes: las ve en "Mis solicitudes" y puede retirarlas', async ({ page }) => {
    await page.goto('/aprobaciones');
    await expect(page.getByRole('heading', { name: 'Aprobaciones', level: 1 })).toBeVisible();
    const badge = page.getByRole('link', { name: /Aprobaciones, \d+ por aprobar/ });
    await expect(badge).toBeVisible();
    await expect(page.locator('main zc-card').filter({ hasText: 'Ana Torres' })).toHaveCount(0);
    await page.getByRole('tab', { name: /Mis solicitudes/ }).click();
    await expect(page).toHaveURL(/bandeja=mis-solicitudes/);
    const mine = page.locator('main zc-card').first();
    await expect(mine).toContainText('Ana Torres');
    await expect(mine.getByRole('button', { name: 'Aprobar' })).toHaveCount(0);
    await expect(page.locator('main zc-card').getByRole('button', { name: 'Retirar solicitud' }).first()).toBeVisible();
  });

  test('Supervisora de Finanzas: filtra por tipo, selecciona todo y aprueba con resumen previo', async ({ page }) => {
    await asUser(page, 'u-lucia');
    await page.goto('/aprobaciones?tipo=liquidacion');
    await expect(page.getByRole('group', { name: 'Filtros activos' })).toContainText('Tipo: Liquidación');
    await page.getByRole('checkbox', { name: 'Seleccionar todos' }).click();
    const bulk = page.getByRole('region', { name: 'Acciones masivas' });
    await expect(bulk).toContainText(/\d+ seleccionadas/);
    await bulk.getByRole('button', { name: 'Aprobar' }).click();
    const dlg = page.getByRole('dialog', { name: /¿Aprobar \d+ solicitudes\?/ });
    await expect(dlg).toContainText('× Liquidación');
    await expect(dlg).toContainText('Montos por moneda');
    await dlg.getByRole('button', { name: /^Aprobar \d+$/ }).click();
    await expect(page.getByText(/solicitudes aprobadas/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sin resultados' })).toBeVisible();
  });

  test('rechazar exige comentario y la solicitud queda rechazada con él', async ({ page }) => {
    await asUser(page, 'u-lucia');
    await page.goto('/aprobaciones?tipo=archivo_pago');
    await page.locator('main zc-card a').first().click();
    await expect(page).toHaveURL(/\/aprobaciones\/AP-\d+$/);
    await page.getByRole('button', { name: 'Rechazar' }).click();
    const dlg = page.getByRole('alertdialog');
    const confirm = dlg.getByRole('button', { name: 'Rechazar 1' });
    await expect(confirm).toBeDisabled();
    await dlg.getByRole('textbox', { name: /Motivo del rechazo/ }).fill('Falta la firma del documento de cobranza');
    await confirm.click();
    await expect(page.getByText('Solicitud rechazada')).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: 'Rechazada' })).toContainText('Falta la firma del documento de cobranza');
    await expect(page.getByRole('button', { name: 'Aprobar' })).toHaveCount(0);
  });

  test('maker-checker de punta a punta: Ana pide anular un lote y Carlos lo aprueba', async ({ page }) => {
    await page.goto('/lotes/02829');
    await page.getByRole('button', { name: 'Anular lote' }).click();
    const dlg = page.getByRole('alertdialog');
    await dlg.getByRole('textbox', { name: /Motivo/ }).fill('Pedido duplicado del cliente');
    await dlg.getByRole('textbox', { name: 'Escribe ANULAR para confirmar' }).fill('ANULAR');
    await dlg.getByRole('button', { name: 'Solicitar anulación' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Anulación pendiente de aprobación' })).toContainText('Debe aprobar: Operaciones o Administrador');

    // Cambio de usuario sin recargar: los datos simulados se conservan.
    await page.getByRole('button', { name: /^AT · Usuario: Ana Torres/ }).click();
    await page.getByRole('menuitemradio', { name: /Carlos Ríos/ }).click();
    await expect(page).toHaveURL(/\/inicio$/);
    // Navegación dentro de la app (page.goto recargaría y perdería los datos simulados en memoria).
    await page.getByRole('link', { name: /Aprobaciones, \d+ por aprobar/ }).click();
    await page.getByRole('searchbox', { name: 'Buscar solicitudes' }).fill('02829');
    const card = page.locator('main zc-card').filter({ hasText: 'Lote #02829' });
    await expect(card).toContainText('Pedido duplicado del cliente');
    await card.getByRole('button', { name: 'Aprobar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Aprobar 1' }).click();
    await expect(page.getByText('Solicitud aprobada')).toBeVisible();

    await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Lotes' }).click();
    await page.getByRole('searchbox', { name: 'Buscar lotes' }).fill('02829');
    await expect(page.locator('main zc-card')).toHaveCount(1);
    await page.locator('main zc-card a').first().click();
    await expect(page.getByText('Anulado', { exact: true }).first()).toBeVisible();
    await page.getByRole('tab', { name: /Historial/ }).click();
    await expect(page.getByText(/aprobada y ejecutada/)).toBeVisible();
  });

  test('un rol sin aprobaciones no ve el módulo ni puede entrar', async ({ page }) => {
    await asUser(page, 'u-rosa');
    await page.goto('/aprobaciones');
    await expect(page).toHaveURL(/sin-acceso/);
    await expect(page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Aprobaciones' })).toHaveCount(0);
  });
});

test.describe('móvil', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('consulta sin selección masiva: se aprueba una a una', async ({ page }) => {
    await page.goto('/aprobaciones');
    await expect(page.locator('main zc-card').first()).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Seleccionar todos' })).toHaveCount(0);
    await expect(page.locator('main zc-card').first().getByRole('button', { name: 'Aprobar' })).toBeVisible();
  });
});
