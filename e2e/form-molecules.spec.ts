import { expect, test } from '@playwright/test';

/** Moléculas de formulario de la etapa 2: teclado, móvil y validación por país (sección 15 de las reglas). */
test.beforeEach(async ({ page }) => {
  await page.goto('/catalogo/moleculas');
  await expect(page.getByRole('heading', { name: 'Select y Combobox' })).toBeVisible();
});

test('select: flechas, escribir para saltar, Enter elige y Escape devuelve el foco', async ({ page }) => {
  const trigger = page.getByRole('combobox', { name: /Tipo de documento/ });
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  const list = page.getByRole('listbox');
  await expect(list).toBeVisible();
  await page.keyboard.type('p');
  await expect(list).toHaveAttribute('aria-activedescendant', await list.getByRole('option', { name: 'Pasaporte' }).getAttribute('id') ?? '');
  await page.keyboard.press('Enter');
  await expect(list).toHaveCount(0);
  await expect(trigger).toContainText('Pasaporte');
  await expect(trigger).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('combobox: búsqueda sin tildes y multiselección con Limpiar/Listo', async ({ page }) => {
  await page.getByRole('combobox', { name: /Ciudad/ }).first().click();
  await page.getByRole('combobox', { name: 'Buscar opción' }).fill('bogota');
  await expect(page.getByRole('option')).toHaveText(['Bogotá']);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('combobox', { name: /Ciudad/ }).first()).toContainText('Bogotá');

  const cats = page.getByRole('combobox', { name: /Categorías/ });
  await cats.click();
  await page.getByRole('option', { name: 'Moda' }).click();
  await expect(cats).toContainText('3 seleccionados');
  await page.getByRole('button', { name: 'Limpiar', exact: true }).click();
  await page.getByRole('button', { name: 'Listo' }).click();
  await expect(cats).toContainText('Todas las categorías');
  await expect(cats).toBeFocused();
});

test.describe('móvil', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('el combobox se abre como bottom sheet y, dentro de otro sheet, como subpantalla con Volver', async ({ page }) => {
    await page.getByRole('combobox', { name: /Ciudad/ }).first().click();
    const sheet = page.getByRole('dialog', { name: 'Ciudad' });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Cerrar' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);

    await page.getByRole('button', { name: 'Abrir filtros' }).click();
    const filtros = page.getByRole('dialog', { name: 'Filtros' });
    await filtros.getByRole('combobox', { name: /Ciudad/ }).click();
    // Nunca un sheet sobre otro: un solo panel de CDK abierto.
    await expect(page.locator('.cdk-overlay-pane')).toHaveCount(1);
    const sub = page.getByRole('dialog', { name: 'Ciudad' });
    await sub.getByRole('combobox').fill('quito');
    await page.keyboard.press('Enter');
    await expect(sub).toHaveCount(0);
    await expect(filtros.getByRole('combobox', { name: /Ciudad/ })).toContainText('Quito');
    await expect(filtros.getByRole('combobox', { name: /Ciudad/ })).toBeFocused();

    await filtros.getByRole('combobox', { name: /Estado/ }).click();
    await page.getByRole('button', { name: 'Volver', exact: true }).click();
    await expect(filtros.getByRole('combobox', { name: /Estado/ })).toBeFocused();
  });

  test('los campos de una línea miden 56 px en táctil', async ({ page }) => {
    const box = await page.getByRole('combobox', { name: /Tipo de documento/ }).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(56);
  });
});

test('teléfono, documento y monto validan según el país', async ({ page }) => {
  const phone = page.getByRole('textbox', { name: /WhatsApp del destinatario/ });
  await phone.fill('987-654');
  await phone.blur();
  await expect(page.getByText('En Perú el número tiene 9 dígitos (llevas 6).')).toBeVisible();
  await phone.fill('987654321');
  await expect(phone).toHaveValue('987 654 321');

  const special = page.getByRole('region', { name: /Teléfono, documento/ });
  const ruc = special.getByRole('textbox', { name: /Identificador tributario/ });
  const rucField = special.locator('zc-field', { has: page.getByRole('textbox', { name: /Identificador tributario/ }) });
  await ruc.fill('20100047219');
  await ruc.blur();
  await expect(rucField.getByText('Ingresa un RUC de 11 dígitos.')).toBeVisible();
  await expect(ruc).toHaveAttribute('aria-invalid', 'true');
  await ruc.fill('20100047218');
  await expect(rucField.getByText('Ingresa un RUC de 11 dígitos.')).toHaveCount(0);

  // Chile: otro documento (RUT) y moneda sin decimales.
  await page.getByRole('combobox', { name: /País de operación/ }).click();
  await page.getByRole('option', { name: /Chile/ }).click();
  await expect(ruc).toHaveValue('');
  const amount = page.getByRole('textbox', { name: /Monto por giftcard/ });
  await amount.pressSequentially('1500.75');
  await expect(amount).toHaveValue('150075'); // CLP no tiene decimales: el separador no entra
  await amount.fill('1500');
  await amount.blur();
  await expect(amount).toHaveValue('1.500');
});

test('fecha: se escribe con máscara o se elige con el teclado en el calendario', async ({ page }) => {
  const date = page.getByRole('textbox', { name: /Fecha de vencimiento/ });
  await date.pressSequentially('31022026');
  await expect(date).toHaveValue('31/02/2026');
  await date.blur();
  await expect(page.getByText('Usa el formato dd/mm/aaaa con una fecha que exista.')).toBeVisible();

  await page.getByRole('button', { name: 'Abrir calendario' }).first().click();
  const grid = page.getByRole('grid');
  await expect(grid).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(grid).toHaveCount(0);
  await expect(date).toHaveValue(/^\d{2}\/\d{2}\/\d{4}$/);
  await expect(date).toBeFocused();
});

test('periodo: predefinido, comparar y aplicar', async ({ page }) => {
  const trigger = page.getByRole('combobox', { name: /Periodo del reporte/ });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Elegir periodo' });
  await dialog.getByRole('radio', { name: 'Últimos 7 días' }).click();
  await expect(dialog.getByText('7 días', { exact: true })).toBeVisible();
  await dialog.getByText('Comparar con el periodo anterior').click();
  await dialog.getByRole('button', { name: 'Aplicar' }).click();
  await expect(trigger).toContainText('Últimos 7 días · vs. anterior');
});

test('autocomplete: sugerencias desde 2 letras, resaltado y búsqueda reciente', async ({ page }) => {
  const input = page.getByRole('combobox', { name: 'Búsqueda global' });
  await input.fill('r');
  await expect(page.getByText('Escribe al menos 2 letras para buscar.')).toBeVisible();
  await input.fill('rep');
  await expect(page.getByRole('option', { name: 'Repsol' })).toBeVisible();
  await expect(page.locator('mark.zc-mark').first()).toHaveText(/rep/i);
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('Repsol');
  await input.fill('');
  await input.blur();
  await input.focus();
  await expect(page.getByRole('option', { name: 'Repsol' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
});
