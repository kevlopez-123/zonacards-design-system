import { expect, Page, test } from '@playwright/test';

/** Tanda 4: reordenar, dominio, errores, estados y facetas. */
test.beforeEach(async ({ page }) => { await page.setViewportSize({ width: 1280, height: 900 }); });

const list = (page: Page) => page.getByRole('list', { name: 'Orden de categorías en el e-commerce' });
const names = async (page: Page) =>
  (await list(page).getByRole('button', { name: /^Reordenar / }).evaluateAll(bs => bs.map(b => b.getAttribute('aria-label')!))).map(l => l.replace('Reordenar ', ''));

test('reordenar: teclado (tomar, mover, soltar, cancelar), menú Subir/Bajar y arrastre', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-sortable');
  const handle = list(page).getByRole('button', { name: 'Reordenar Experiencias' });
  await handle.focus();
  await page.keyboard.press('Space');
  await expect(handle).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(handle).toBeFocused();
  await expect(handle).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(handle).toBeFocused();
  await page.keyboard.press('Space');
  await expect(handle).toHaveAttribute('aria-pressed', 'false');
  expect((await names(page)).slice(0, 4)).toEqual(['Gastronomía', 'Moda y accesorios', 'Tecnología', 'Experiencias']);

  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowUp');
  await expect(handle).toBeFocused();
  expect((await names(page))[2]).toBe('Experiencias');
  await page.keyboard.press('Escape');
  await expect(handle).toHaveAttribute('aria-pressed', 'false');
  expect((await names(page))[3]).toBe('Experiencias');

  await page.getByRole('button', { name: 'Más opciones de Cuidado personal' }).click();
  await page.getByRole('menuitem', { name: 'Mover al inicio' }).click();
  expect((await names(page))[0]).toBe('Cuidado personal');

  const from = await list(page).getByRole('button', { name: 'Reordenar Gastronomía' }).boundingBox();
  const to = await list(page).getByRole('button', { name: 'Reordenar Hogar, deco y electro' }).boundingBox();
  await page.mouse.move(from!.x + 10, from!.y + 10);
  await page.mouse.down();
  await page.mouse.move(to!.x + 10, to!.y + 30, { steps: 12 });
  await page.mouse.up();
  expect((await names(page)).at(-1)).toBe('Gastronomía');
});

test('dominio: pipeline filtra por etapa y el módulo apagado deshabilita sus permisos', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-domain');
  const r = page.getByRole('region', { name: /Pipeline, Timeline/ });
  const pagadas = r.getByRole('button', { name: /^Pagadas: 12 liquidaciones/ });
  await pagadas.click();
  await expect(pagadas).toHaveAttribute('aria-pressed', 'true');
  await expect(r.getByText('Filtrando por Pagadas.')).toBeVisible();
  await expect(r.getByRole('list', { name: 'Historial de la giftcard' }).getByRole('listitem')).toHaveCount(5);
  await expect(r.getByText('3/6 permisos')).toBeVisible();
  await r.getByRole('checkbox', { name: 'Anular' }).click();
  await expect(r.getByRole('checkbox', { name: 'Anular' })).toBeChecked();
  await expect(r.getByText('4/6 permisos')).toBeVisible();
  await r.getByRole('switch', { name: 'Activar módulo Lotes' }).click();
  await expect(r.getByText('0/6 permisos')).toBeVisible();
  await expect(r.getByRole('checkbox', { name: 'Ver' })).toBeDisabled();
});

test('errores: reintento creciente, resultado parcial, error de servidor en el campo, sin conexión y 429', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-errors');
  const r = page.getByRole('region', { name: 'Gestión de errores' });
  await expect(r.getByRole('heading', { name: 'No encontramos esta página' })).toBeVisible();
  await r.getByRole('button', { name: 'Cargar (falla 2 veces)' }).click();
  await expect(r.getByText(/Reintentando en \d s \(intento 2 de 3\)/)).toBeVisible();
  await r.getByRole('button', { name: 'Reintentar ahora' }).click();
  await expect(r.getByText('Total del mes')).toBeVisible({ timeout: 15000 });

  await r.getByRole('button', { name: 'Reintentar los 3' }).click();
  await expect(r.getByText('Se enviaron 2 de 3')).toBeVisible();

  await r.getByRole('button', { name: 'Guardar cliente' }).click();
  const ruc = r.getByRole('textbox', { name: /RUC del cliente/ });
  await expect(ruc).toBeFocused();
  await expect(ruc).toHaveAttribute('aria-invalid', 'true');
  await expect(r.getByText(/ya está registrado como "Interbank"/)).toBeVisible();

  await r.getByRole('button', { name: 'Simular sin conexión' }).click();
  await r.getByRole('button', { name: 'Guardar un cambio' }).click();
  await expect(r.getByRole('status').filter({ hasText: 'Sin conexión. 1 cambios' })).toBeVisible();
  await r.getByRole('button', { name: 'Simular reconexión' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Conexión restablecida' })).toBeVisible();

  const exp = r.getByRole('button', { name: 'Exportar', exact: true });
  for (let i = 0; i < 3; i++) await exp.click();
  await expect(r.getByText(/Podrás exportar de nuevo en \d+ s/)).toBeVisible();
  await expect(exp).toBeDisabled();
});

test('estados: vacío, sin resultados, error con detalles técnicos, sin acceso, enlace vencido y sin notificaciones', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-states');
  const r = page.getByRole('region', { name: 'Empty state y Error state' });
  for (const t of ['Aún no hay lotes', 'Sin resultados', 'No se pudieron cargar los lotes', 'No tienes acceso a Liquidaciones', 'Este enlace venció', 'Sin notificaciones']) {
    await expect(r.getByRole('heading', { name: t })).toBeVisible();
  }
  await r.getByRole('button', { name: 'Ver detalles técnicos' }).click();
  await expect(r.getByText('lots-service · GET /lots')).toBeVisible();
});

test('facetas: conteos que se cruzan, buscar en el grupo, mostrar más, chips y sin resultados', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-facets');
  const r = page.getByRole('region', { name: 'Filtros por facetas' });
  await expect(r.getByText('Mostrando 12 resultados')).toBeVisible();
  const cat = r.getByRole('group', { name: 'Por categoría' });
  await cat.getByRole('button', { name: 'Mostrar 3 más' }).click();
  await cat.getByRole('searchbox', { name: 'Buscar categoría' }).fill('moda');
  await expect(cat.getByRole('checkbox')).toHaveCount(1);
  const moda = cat.getByRole('checkbox', { name: /Moda y accesorios/ });
  await moda.click();
  await expect(moda).toBeChecked();
  await expect(r.getByText('Mostrando 2 resultados')).toBeVisible();
  const cusco = r.getByRole('group', { name: 'Por ciudad' }).getByRole('checkbox', { name: /Cusco/ });
  await cusco.click();
  await expect(cusco).toBeChecked();
  await expect(r.getByRole('heading', { name: 'Sin gift cards con esos filtros' })).toBeVisible();
  await r.getByRole('button', { name: 'Quitar Cusco' }).click();
  await expect(r.getByText('Mostrando 2 resultados')).toBeVisible();
  await r.getByRole('button', { name: 'Agregar Tarjeta Falabella a favoritos' }).click();
  await expect(r.getByRole('button', { name: 'Quitar Tarjeta Falabella de favoritos' })).toHaveAttribute('aria-pressed', 'true');
});

test('facetas en móvil: botón Filtrar abre el sheet con "Mostrar N resultados"', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/catalogo/organismos#o-facets');
  const r = page.getByRole('region', { name: 'Filtros por facetas' });
  await r.getByRole('button', { name: 'Filtrar' }).click();
  const dlg = page.getByRole('dialog', { name: 'Filtros' });
  await expect(dlg.getByRole('button', { name: 'Mostrar 12 resultados' })).toBeVisible();
  await dlg.getByRole('button', { name: 'Mostrar 12 resultados' }).click();
  await expect(dlg).toBeHidden();
});
