import { expect, test } from '@playwright/test';

/** Espaciado semántico (--space-*, --margin-*, --content-*): los tokens valen lo documentado y el layout los usa. */
const token = (page: import('@playwright/test').Page, name: string) => page.evaluate(n => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

test('los tokens semánticos valen lo documentado en móvil y en escritorio', async ({ page }) => {
  await page.goto('/lotes');
  await page.setViewportSize({ width: 390, height: 800 });
  const mobile = Object.fromEntries(await Promise.all(['--space-inline', '--space-group', '--space-field', '--space-field-x', '--space-block', '--space-page-block', '--space-card', '--space-card-inset', '--space-section', '--margin-page', '--margin-page-y', '--content-max', '--content-narrow'].map(async n => [n, await token(page, n)])));
  expect(mobile).toEqual({
    '--space-inline': '8px', '--space-group': '12px', '--space-field': '16px', '--space-field-x': '20px', '--space-block': '16px',
    '--space-page-block': '16px', '--space-card': '16px', '--space-card-inset': '16px', '--space-section': '40px',
    '--margin-page': '16px', '--margin-page-y': '24px', '--content-max': '1200px', '--content-narrow': '880px',
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  expect(await token(page, '--margin-page')).toBe('32px');
  expect(await token(page, '--space-page-block')).toBe('24px');
  expect(await token(page, '--space-card-inset')).toBe('20px');
});

test('el contenido de la página usa el margen y el ancho máximo de los tokens', async ({ page }) => {
  await page.goto('/lotes');
  const main = page.locator('main#contenido');
  await page.setViewportSize({ width: 390, height: 800 });
  expect(await main.evaluate(el => { const c = getComputedStyle(el); return [c.paddingLeft, c.paddingRight, c.paddingTop, c.paddingBottom]; })).toEqual(['16px', '16px', '24px', '24px']);
  await page.setViewportSize({ width: 1440, height: 900 });
  expect(await main.evaluate(el => { const c = getComputedStyle(el); return [c.paddingLeft, c.paddingTop, c.maxWidth]; })).toEqual(['32px', '24px', '1200px']);
});

test('las tarjetas toman su borde interno del token (16 px en móvil, 20 px desde 768)', async ({ page }) => {
  await page.goto('/catalogo/organismos#o-cards');
  const card = page.locator('zc-card').first();
  await card.waitFor();
  await page.setViewportSize({ width: 390, height: 800 });
  expect(await card.evaluate(el => getComputedStyle(el).paddingLeft)).toBe('16px');
  await page.setViewportSize({ width: 1280, height: 800 });
  expect(await card.evaluate(el => getComputedStyle(el).paddingLeft)).toBe('20px');
});
