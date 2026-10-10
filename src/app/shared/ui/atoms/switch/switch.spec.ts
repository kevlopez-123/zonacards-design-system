import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SwitchComponent } from './switch.component';

@Component({
  imports: [SwitchComponent],
  template: `
    <zc-switch [(checked)]="on" description="7 días antes">Recordatorio</zc-switch>
    <zc-switch [disabled]="true">Recarga de saldo</zc-switch>`,
})
class Host { on = signal(false); }

describe('zc-switch', () => {
  it('es un role="switch" y alterna con clic en toda la fila', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const sw = f.nativeElement.querySelectorAll('[role="switch"]') as NodeListOf<HTMLButtonElement>;
    expect(sw[0].getAttribute('aria-checked')).toBe('false');
    (f.nativeElement.querySelector('label span') as HTMLElement).click();
    await f.whenStable();
    expect(f.componentInstance.on()).toBe(true);
    expect(sw[0].getAttribute('aria-checked')).toBe('true');
  });

  it('deshabilitado no se puede activar', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const sw = f.nativeElement.querySelectorAll('[role="switch"]')[1] as HTMLButtonElement;
    expect(sw.disabled).toBe(true);
    sw.click();
    await f.whenStable();
    expect(sw.getAttribute('aria-checked')).toBe('false');
  });
});
