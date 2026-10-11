import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { CheckboxComponent } from './checkbox.component';

@Component({
  imports: [CheckboxComponent, ReactiveFormsModule],
  template: `
    <zc-checkbox [(checked)]="on" [(indeterminate)]="partial" [disabled]="off()" description="Aplica IGV/IVA">Afecto a impuesto</zc-checkbox>
    <zc-checkbox [formControl]="ctrl">Con formulario</zc-checkbox>`,
})
class Host {
  on = signal(false);
  partial = signal(false);
  off = signal(false);
  ctrl = new FormControl(true, { nonNullable: true });
}

async function setup() {
  const f = TestBed.createComponent(Host);
  await f.whenStable();
  const boxes = f.nativeElement.querySelectorAll('[role="checkbox"]') as NodeListOf<HTMLButtonElement>;
  const labels = f.nativeElement.querySelectorAll('label') as NodeListOf<HTMLLabelElement>;
  return { f, host: f.componentInstance, boxes, labels };
}

describe('zc-checkbox', () => {
  it('toda la fila es clicable: el clic en el texto alterna', async () => {
    const { f, host, boxes, labels } = await setup();
    labels[0].querySelector('span')!.click();
    await f.whenStable();
    expect(host.on()).toBe(true);
    expect(boxes[0].getAttribute('aria-checked')).toBe('true');
  });

  it('cada checkbox se nombra con su propia etiqueta (ids únicos)', async () => {
    const { f, boxes } = await setup();
    const ids = Array.from(boxes).map((b) => b.getAttribute('aria-labelledby'));
    expect(new Set(ids).size).toBe(2);
    expect(f.nativeElement.querySelector('#' + ids[1])?.textContent).toContain('Con formulario');
  });

  it('muestra la descripción dentro de la fila', async () => {
    const { labels } = await setup();
    expect(labels[0].textContent).toContain('Aplica IGV/IVA');
  });

  it('indeterminado se anuncia como mixed y al marcar pasa a checked', async () => {
    const { f, host, boxes } = await setup();
    host.partial.set(true);
    await f.whenStable();
    expect(boxes[0].getAttribute('aria-checked')).toBe('mixed');
    boxes[0].click();
    await f.whenStable();
    expect(host.partial()).toBe(false);
    expect(host.on()).toBe(true);
  });

  it('deshabilitado no cambia', async () => {
    const { f, host, boxes } = await setup();
    host.off.set(true);
    await f.whenStable();
    expect(boxes[0].disabled).toBe(true);
    boxes[0].click();
    await f.whenStable();
    expect(host.on()).toBe(false);
  });

  it('funciona con formularios reactivos', async () => {
    const { f, host, boxes } = await setup();
    expect(boxes[1].getAttribute('aria-checked')).toBe('true');
    boxes[1].click();
    await f.whenStable();
    expect(host.ctrl.value).toBe(false);
    host.ctrl.disable();
    await f.whenStable();
    expect(boxes[1].disabled).toBe(true);
  });
});
