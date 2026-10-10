import { expect, test } from '@playwright/test';

test('Lotes muestra datos simulados, vacío y error', async ({ page }) => {
  await page.goto('/lotes');
  await expect(page.getByRole('heading', { name: 'Lotes' })).toBeVisible();
  await expect(page.locator('main li')).toHaveCount(6);
  await page.goto('/lotes?scenario=vacio');
  await expect(page.getByText('Aún no hay lotes')).toBeVisible();
  await page.goto('/lotes?scenario=error');
  await expect(page.getByText('No se pudieron cargar los lotes')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
});

test('el menú móvil se cierra con Escape y devuelve el foco', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/catalogo');
  const menu = page.getByRole('button', { name: 'Abrir menú' });
  await menu.click();
  await expect(page.getByRole('dialog', { name: 'Navegación principal' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
});
