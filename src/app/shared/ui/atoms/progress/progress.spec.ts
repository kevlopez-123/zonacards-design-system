import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ProgressComponent } from './progress.component';

@Component({
  imports: [ProgressComponent],
  template: `
    <zc-progress label="Envío en curso" [value]="332" [max]="500" valueText="332/500" />
    <zc-progress variant="meter" label="Cupo" [value]="cupo()" />
    <zc-progress variant="circular" label="66% activado" [value]="66" />
    <zc-progress label="Generando" [value]="null" />`,
})
class Host { cupo = signal(40); }

const els = (f: ReturnType<typeof TestBed.createComponent<Host>>) => f.nativeElement.querySelectorAll('zc-progress') as NodeListOf<HTMLElement>;

describe('zc-progress', () => {
  it('barra: progressbar con valor, máximo y texto visible', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const bar = els(f)[0].querySelector('[role="progressbar"]') as HTMLElement;
    expect(bar.getAttribute('aria-label')).toBe('Envío en curso');
    expect(bar.getAttribute('aria-valuenow')).toBe('332');
    expect(bar.getAttribute('aria-valuemax')).toBe('500');
    expect(bar.getAttribute('aria-valuetext')).toBe('332/500');
    expect(els(f)[0].textContent).toContain('332/500');
  });

  it('meter: role="meter" y color por umbral', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const meter = els(f)[1];
    expect(meter.querySelector('[role="meter"]')).toBeTruthy();
    expect(meter.style.getPropertyValue('--zc-bar')).toBe('var(--success-fg)');
    f.componentInstance.cupo.set(80);
    await f.whenStable();
    expect(meter.style.getPropertyValue('--zc-bar')).toBe('var(--warning-fg)');
    f.componentInstance.cupo.set(92);
    await f.whenStable();
    expect(meter.style.getPropertyValue('--zc-bar')).toBe('var(--danger-fg)');
  });

  it('circular: muestra el porcentaje y lo anuncia', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const ring = els(f)[2].querySelector('[role="progressbar"]') as HTMLElement;
    expect(ring.getAttribute('aria-valuenow')).toBe('66');
    expect(ring.textContent).toContain('66%');
  });

  it('sin valor es indeterminado', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const bar = els(f)[3].querySelector('[role="progressbar"]') as HTMLElement;
    expect(bar.hasAttribute('aria-valuenow')).toBe(false);
    expect(bar.dataset['state']).toBe('indeterminate');
  });
});
