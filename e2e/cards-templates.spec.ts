import { expect, test } from '@playwright/test';

/** Tanda 3 (cierre): Cards, menú secundario, sesión por expirar, acciones en sheet, plantillas y layouts. */
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
});

test('cards: KPI con tendencia filtra de a uno, tarjeta de entidad abre el detalle y la selección con tarjetas', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-cards');
  const r = page.getByRole('region', { name: 'Cards', exact: true });
  const emitidas = r.getByRole('button', { name: /^Emitidas/ });
  await expect(r.getByRole('button', { name: /Por vencer \(30 d\).*−12.5 %/ })).toBeVisible();
  await emitidas.click();
  await expect(emitidas).toHaveAttribute('aria-pressed', 'true');
  await r.getByRole('button', { name: /^Redención/ }).click();
  await expect(emitidas).toHaveAttribute('aria-pressed', 'false');
  await expect(r.getByRole('link', { name: 'Navidad 2026' })).toHaveAttribute('href', '/lotes');
  await expect(r.getByRole('img', { name: 'Stock 38, mínimo 50, máximo 160, punto de pedido 66' })).toBeVisible();
  await r.getByRole('button', { name: 'Acciones del lote #02829' }).click();
  await expect(page.getByRole('menuitem', { name: 'Reenviar códigos' })).toBeVisible();
  await page.keyboard.press('Escape');
  const terceros = r.getByRole('radio', { name: /Códigos de terceros/ });
  await r.getByText('Plantilla XLSX del proveedor').click();
  await expect(terceros).toBeChecked();
  await expect(r.getByRole('radio', { name: /Códigos propios/ })).not.toBeChecked();
});

test('sidebar: estado riel y menú secundario de configuración', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-sidebar');
  const r = page.getByRole('region', { name: 'Sidebar', exact: true });
  await r.getByRole('switch', { name: 'Menú secundario (configuración)' }).click();
  const nav = r.getByRole('navigation', { name: 'Configuración' });
  await expect(nav.getByRole('button', { name: 'Empresa' })).toHaveAttribute('aria-current', 'page');
  await nav.getByRole('button', { name: 'Seguridad' }).click();
  await expect(nav.getByRole('button', { name: 'Seguridad' })).toHaveAttribute('aria-current', 'page');
  await r.getByRole('radio', { name: 'Riel' }).click();
  await expect(r.getByRole('radio', { name: 'Riel' })).toBeChecked();
});

test('overlays: acciones del lote y aviso de sesión por expirar', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-filter');
  const r = page.getByRole('region', { name: 'Drawer, modal y alert dialog' });
  await r.getByRole('button', { name: 'Acciones del lote #02829' }).click();
  await page.getByRole('menuitem', { name: 'Anular lote' }).click();
  const alert = page.getByRole('alertdialog', { name: '¿Anular 500 códigos?' });
  await expect(alert).toBeVisible();
  await alert.getByRole('button', { name: 'Cancelar' }).click();

  await r.getByRole('button', { name: 'Sesión por expirar' }).click();
  const dlg = page.getByRole('alertdialog', { name: 'Tu sesión está por expirar' });
  await expect(dlg).toContainText(/Se cerrará en \d+ segundos/);
  await dlg.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(dlg).toBeHidden();
  await expect(page.getByRole('status').filter({ hasText: 'Sesión cerrada' })).toBeVisible();
  // Escape cuenta como actividad: extiende la sesión.
  await r.getByRole('button', { name: 'Sesión por expirar' }).click();
  await expect(dlg).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dlg).toBeHidden();
  await expect(page.getByRole('status').filter({ hasText: 'Sesión extendida' })).toBeVisible();
});

test('página de ejemplo Lotes: migas, KPI que filtran, chips y vista', async ({ page }) => {
  await page.goto('/catalogo/plantillas#p-lotes');
  const r = page.getByRole('region', { name: 'Página de ejemplo: Lotes' });
  await expect(r.getByRole('navigation', { name: /Migas|Ruta/ }).getByText('Inicio')).toBeVisible();
  const kpi = r.getByRole('button', { name: /^Anulados/ });
  await kpi.click();
  await expect(kpi).toHaveAttribute('aria-pressed', 'true');
  await expect(r.getByRole('button', { name: /Quitar Estado: Anulado/ })).toBeVisible();
  await kpi.click();
  await expect(r.getByRole('button', { name: /Quitar Estado/ })).toHaveCount(0);
  await expect(r.getByRole('link', { name: 'Abrir la pantalla real de Lotes' })).toHaveAttribute('href', '/lotes');
});

test('plantillas y layouts: 4 plantillas y 8 layouts', async ({ page }) => {
  await page.goto('/catalogo/plantillas#t-templates');
  await expect(page.getByRole('region', { name: 'Plantillas', exact: true }).locator('article')).toHaveCount(4);
  await expect(page.getByRole('region', { name: 'Layouts', exact: true }).locator('figure')).toHaveCount(8);
  await expect(page.getByText('<zc-dashboard-page>')).toBeVisible();
});
