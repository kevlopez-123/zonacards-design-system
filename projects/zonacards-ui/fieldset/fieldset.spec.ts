import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { FieldsetComponent } from './fieldset.component';

@Component({
  imports: [FieldsetComponent],
  template: `
    <zc-fieldset legend="Datos de contacto" description="Para avisarte del envío." [disabled]="off()" [bordered]="true">
      <input aria-label="Correo" />
    </zc-fieldset>`,
})
class Host {
  off = signal(false);
}

describe('zc-fieldset', () => {
  it('usa fieldset y legend para que el grupo tenga nombre', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const fs = f.nativeElement.querySelector('fieldset') as HTMLFieldSetElement;
    expect(fs.querySelector('legend')?.textContent).toContain('Datos de contacto');
    expect(f.nativeElement.querySelector('#' + fs.getAttribute('aria-describedby'))?.textContent).toContain('Para avisarte del envío.');
  });

  it('deshabilitado, deshabilita los controles de adentro', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const input = f.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.matches(':disabled')).toBe(false);
    f.componentInstance.off.set(true);
    await f.whenStable();
    expect(input.matches(':disabled')).toBe(true);
  });

  it('dibujado con borde lleva la clase de tarjeta', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    expect(f.nativeElement.querySelector('fieldset').className).toContain('rounded-card');
  });
});
