import { expect, test } from '@playwright/test';

/**
 * Bottom sheets en el celular: cada panel (select, menú, fecha, popover de ayuda, notificaciones, país) abierto a 375 px no repite su
 * título dentro del sheet, no se desplaza en horizontal y tiene una sola barra vertical (no una lista con alto propio dentro del sheet).
 * Contenido pensado para el popover de escritorio (márgenes negativos, título propio, max-h) se sale o duplica en el sheet.
 */
const PAGES = ['/catalogo/moleculas', '/catalogo/organismos', '/catalogo/plantillas'];

const scanSheet = () => {
  const p = document.querySelector<HTMLElement>('.cdk-overlay-pane zc-panel, .cdk-overlay-pane [role=dialog]');
  if (!p) return null;
  const all = [p, ...p.querySelectorAll<HTMLElement>('*')];
  const scrollsX = all.filter(e => /auto|scroll/.test(getComputedStyle(e).overflowX) && e.scrollWidth > e.clientWidth + 1
    && !e.matches('[role=tablist], [role=radiogroup], zc-segmented'));
  const scrollsY = all.filter(e => /auto|scroll/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 1);
  const titleEl = p.querySelector('[id^=zc-panel]');
  const title = titleEl?.textContent?.trim();
  const dupTitle = !!title && [...p.querySelectorAll('span, strong, div, p')].some(e =>
    e !== titleEl && e.children.length === 0 && e.textContent?.trim() === title && !e.classList.contains('sr-only'));
  return { scrollsX: scrollsX.length, scrollsY: scrollsY.length, dupTitle: dupTitle ? title : null };
};

for (const path of PAGES) {
  test(`sheets de ${path} · 375px`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const triggers = page.locator('main [aria-haspopup]:visible, main [role="combobox"]:visible');
    const n = await triggers.count();
    const problems: string[] = [];
    for (let i = 0; i < n; i++) {
      const t = triggers.nth(i);
      if (await t.isDisabled()) continue;
      const name = (await t.getAttribute('aria-label')) ?? (await t.innerText()).slice(0, 40);
      await t.scrollIntoViewIfNeeded();
      await t.click();
      await page.waitForTimeout(400);
      const r = await page.evaluate(scanSheet);
      if (r && (r.scrollsX || r.scrollsY > 1 || r.dupTitle)) problems.push(`${name}: ${JSON.stringify(r)}`);
      await page.keyboard.press('Escape');
      await page.locator('.cdk-overlay-backdrop').click({ force: true, timeout: 500 }).catch(() => {});
      await page.waitForTimeout(300);
    }
    expect(problems).toEqual([]);
  });
}
