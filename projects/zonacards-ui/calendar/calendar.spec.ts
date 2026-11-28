import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarComponent } from './calendar.component';

@Component({
  imports: [CalendarComponent],
  template: `<zc-calendar [(month)]="month" [(focusDay)]="focus" today="2026-11-23" min="2026-11-05" max="2026-11-25" [unavailable]="off()" />`,
})
class Host {
  month = signal('2026-11-01');
  focus = signal('2026-11-23');
  off = signal<((d: string) => boolean) | null>(d => d === '2026-11-12' || (d >= '2026-11-20' && d <= '2026-11-21'));
}

describe('zc-calendar', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [TranslocoTestingModule.forRoot({ langs: { es: { ui: { mesAnterior: 'Mes anterior', mesSiguiente: 'Mes siguiente' } } }, translocoConfig: { availableLangs: ['es'], defaultLang: 'es' }, preloadLangs: true })],
  }));

  const day = (root: HTMLElement, iso: string) => root.querySelector(`[data-day="${iso}"]`) as HTMLButtonElement;

  it('deshabilita lo que queda fuera de mínimo y máximo y las fechas no disponibles', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const root = f.nativeElement as HTMLElement;
    for (const d of ['2026-11-04', '2026-11-26', '2026-11-12', '2026-11-20', '2026-11-21']) expect(day(root, d).disabled, d).toBe(true);
    for (const d of ['2026-11-05', '2026-11-11', '2026-11-13', '2026-11-19', '2026-11-22', '2026-11-25']) expect(day(root, d).disabled, d).toBe(false);
  });

  it('una fecha no disponible no se puede elegir', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const root = f.nativeElement as HTMLElement;
    day(root, '2026-11-12').click();
    await f.whenStable();
    expect(f.componentInstance.focus()).toBe('2026-11-23');
    day(root, '2026-11-13').click();
    await f.whenStable();
    expect(f.componentInstance.focus()).toBe('2026-11-13');
  });

  it('cuando la regla cambia, el calendario la aplica de inmediato', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const root = f.nativeElement as HTMLElement;
    f.componentInstance.off.set(d => d === '2026-11-13');
    await f.whenStable();
    expect(day(root, '2026-11-12').disabled).toBe(false);
    expect(day(root, '2026-11-13').disabled).toBe(true);
  });
});
