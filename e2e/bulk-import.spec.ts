import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

/** Importación masiva (plantilla, validación por fila, tabla de errores) y exportación a PDF, en el catálogo de moléculas. */
test.beforeEach(async ({ page }) => {
  await page.goto('/catalogo/moleculas');
  await expect(page.getByRole('heading', { name: 'Importar Excel y exportar PDF' })).toBeVisible();
});

const upload = (page: import('@playwright/test').Page, name: string, csv: string) =>
  page.locator('zc-bulk-import input[type=file]').setInputFiles({ name, mimeType: 'text/csv', buffer: Buffer.from(csv, 'utf8') });

test('la plantilla se descarga como un libro de Excel (ZIP)', async ({ page }) => {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Descargar plantilla' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^plantilla-destinatarios-\d{4}-\d{2}-\d{2}\.xlsx$/);
  const bytes = readFileSync((await download.path())!);
  expect(bytes.subarray(0, 2).toString('latin1')).toBe('PK');
});

test('un CSV con filas buenas y malas: resumen, errores por fila y solo se importan las válidas', async ({ page }) => {
  await upload(page, 'destinatarios.csv', [
    'Correo *,Monto,Vence,Tipo',
    'ana@empresa.com,100,2026-12-31,Regalo',
    'sin-arroba,100,,',
    'luis@empresa.com,5,,',
    'rosa@empresa.com,250,31/12/2026,Beneficio',
    'ANA@empresa.com,300,,',
  ].join('\n'));
  const box = page.locator('zc-bulk-import');
  await expect(box.getByText('2 filas válidas, 3 con errores').first()).toBeVisible();
  await expect(box.getByText('Correo no es un correo válido.')).toBeVisible();
  await expect(box.getByText('Monto no puede ser menor que 10.')).toBeVisible();
  await expect(box.getByText('Está repetida: ya aparece en la fila 2.')).toBeVisible();
  await expect(box.getByText('Se omitirán 3 filas con errores.')).toBeVisible();

  await box.getByRole('button', { name: 'Importar 2 filas' }).click();
  await expect(page.getByText('Se importaron 2 filas.')).toBeVisible();
});

test('un archivo al que le faltan columnas obligatorias se rechaza con un mensaje claro', async ({ page }) => {
  await upload(page, 'malo.csv', 'Correo\nana@empresa.com');
  await expect(page.locator('zc-bulk-import').getByText(/Faltan columnas en el archivo: Monto/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Importar \d+ filas/ })).toHaveCount(0);
});

test('exportar a PDF baja un PDF válido', async ({ page }) => {
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar a PDF' }).click()]);
  expect(download.suggestedFilename()).toMatch(/^destinatarios-\d{4}-\d{2}-\d{2}\.pdf$/);
  const text = readFileSync((await download.path())!).toString('latin1');
  expect(text.startsWith('%PDF-1.4')).toBe(true);
  expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
});
