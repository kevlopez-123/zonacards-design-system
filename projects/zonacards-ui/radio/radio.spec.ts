import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { RadioGroupComponent } from './radio-group.component';
import { RadioComponent } from './radio.component';

@Component({
  imports: [RadioGroupComponent, RadioComponent],
  template: `
    <zc-radio-group label="Canal de envío" [(value)]="canal" [variant]="variant()">
      <zc-radio value="mail">Correo</zc-radio>
      <zc-radio value="whatsapp" description="Mensaje con enlace">WhatsApp</zc-radio>
      <zc-radio value="sms" [disabled]="true">SMS</zc-radio>
    </zc-radio-group>`,
})
class Host {
  canal = signal<unknown>('mail');
  variant = signal<'list' | 'card'>('list');
}

async function setup() {
  const f = TestBed.createComponent(Host);
  await f.whenStable();
  const inputs = f.nativeElement.querySelectorAll('input[type="radio"]') as NodeListOf<HTMLInputElement>;
  const labels = f.nativeElement.querySelectorAll('zc-radio label') as NodeListOf<HTMLLabelElement>;
  return { f, inputs, labels };
}

describe('zc-radio-group', () => {
  it('es un radiogroup con nombre accesible', async () => {
    const { f } = await setup();
    const group = f.nativeElement.querySelector('zc-radio-group') as HTMLElement;
    expect(group.getAttribute('role')).toBe('radiogroup');
    const name = f.nativeElement.querySelector('#' + group.getAttribute('aria-labelledby'))?.textContent;
    expect(name).toBe('Canal de envío');
  });

  it('marca el valor inicial y cambia con clic en toda la fila', async () => {
    const { f, inputs, labels } = await setup();
    expect(inputs[0].checked).toBe(true);
    (labels[1].querySelector('.break-words') as HTMLElement).click();
    await f.whenStable();
    expect(f.componentInstance.canal()).toBe('whatsapp');
    expect(inputs[1].checked).toBe(true);
  });

  it('una opción deshabilitada no se puede elegir', async () => {
    const { f, inputs, labels } = await setup();
    expect(inputs[2].disabled).toBe(true);
    labels[2].click();
    await f.whenStable();
    expect(f.componentInstance.canal()).toBe('mail');
  });

  it('variant="card" pinta tarjetas', async () => {
    const { f, labels } = await setup();
    f.componentInstance.variant.set('card');
    await f.whenStable();
    expect(labels[0].className).toContain('rounded-card');
    expect(labels[0].className).toContain('border');
  });
});
