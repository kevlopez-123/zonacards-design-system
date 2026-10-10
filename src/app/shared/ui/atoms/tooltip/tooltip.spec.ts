import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { TooltipDirective } from './tooltip.directive';

@Component({
  imports: [TooltipDirective],
  template: `<button type="button" zcTooltip="Descargar (Excel, CSV, PDF)" aria-label="Descargar">D</button>`,
})
class Host {}

const tick = () => new Promise((r) => setTimeout(r, 20));

describe('[zcTooltip]', () => {
  it('aparece con foco, se enlaza con aria-describedby y Escape lo oculta', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const btn = f.nativeElement.querySelector('button') as HTMLButtonElement;
    btn.dispatchEvent(new FocusEvent('focus'));
    await tick();
    await f.whenStable();
    const tip = document.querySelector('[role="tooltip"]') as HTMLElement;
    expect(tip?.textContent).toContain('Descargar (Excel, CSV, PDF)');
    expect(btn.getAttribute('aria-describedby')).toBe(tip.id);
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await tick();
    await f.whenStable();
    expect(btn.hasAttribute('aria-describedby')).toBe(false);
  });
});
