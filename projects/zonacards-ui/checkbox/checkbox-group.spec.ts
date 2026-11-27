import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { CheckboxGroupComponent, CheckboxOption } from './checkbox-group.component';

const OPTIONS: CheckboxOption[] = [
  { value: 'mail', label: 'Correo' },
  { value: 'wa', label: 'WhatsApp', description: 'Solo en Perú' },
  { value: 'sms', label: 'SMS', disabled: true },
];

@Component({
  imports: [CheckboxGroupComponent, ReactiveFormsModule],
  template: `
    <zc-checkbox-group label="Canales de aviso" [options]="options" [(value)]="chosen" [hint]="hint()" [error]="error()" [required]="true" selectAllLabel="Todos" />
    <zc-checkbox-group label="Con formulario" [options]="options" [formControl]="ctrl" />`,
})
class Host {
  options = OPTIONS;
  chosen = signal<readonly string[]>([]);
  hint = signal('Elige al menos uno.');
  error = signal('');
  ctrl = new FormControl<string[]>(['mail'], { nonNullable: true });
}

async function setup() {
  const f = TestBed.createComponent(Host);
  await f.whenStable();
  const groups = f.nativeElement.querySelectorAll('[role="group"]') as NodeListOf<HTMLElement>;
  const boxes = (g: number) => groups[g].querySelectorAll('[role="checkbox"]') as NodeListOf<HTMLButtonElement>;
  return { f, host: f.componentInstance, groups, boxes };
}

describe('zc-checkbox-group', () => {
  it('se anuncia como grupo con su etiqueta y enlaza la ayuda', async () => {
    const { f, groups } = await setup();
    const label = f.nativeElement.querySelector('#' + groups[0].getAttribute('aria-labelledby'));
    expect(label?.textContent).toContain('Canales de aviso');
    expect(groups[0].getAttribute('aria-required')).toBe('true');
    expect(f.nativeElement.querySelector('#' + groups[0].getAttribute('aria-describedby'))?.textContent).toContain('Elige al menos uno.');
  });

  it('marca y desmarca opciones y guarda los valores', async () => {
    const { f, host, boxes } = await setup();
    // 0 = "Todos", 1 = Correo, 2 = WhatsApp, 3 = SMS
    boxes(0)[2].click();
    await f.whenStable();
    expect(host.chosen()).toEqual(['wa']);
    boxes(0)[1].click();
    await f.whenStable();
    expect(host.chosen()).toEqual(['wa', 'mail']);
    boxes(0)[2].click();
    await f.whenStable();
    expect(host.chosen()).toEqual(['mail']);
  });

  it('"Todos" queda a medias con algunas marcadas, marca solo las habilitadas y desmarca al volver a tocarlo', async () => {
    const { f, host, boxes } = await setup();
    boxes(0)[1].click();
    await f.whenStable();
    expect(boxes(0)[0].getAttribute('aria-checked')).toBe('mixed');
    boxes(0)[0].click();
    await f.whenStable();
    expect(host.chosen()).toEqual(['mail', 'wa']);   // SMS está deshabilitada: "todos" no la toca
    expect(boxes(0)[0].getAttribute('aria-checked')).toBe('true');
    boxes(0)[0].click();
    await f.whenStable();
    expect(host.chosen()).toEqual([]);
  });

  it('las opciones deshabilitadas no cambian', async () => {
    const { f, host, boxes } = await setup();
    expect(boxes(0)[3].disabled).toBe(true);
    boxes(0)[3].click();
    await f.whenStable();
    expect(host.chosen()).toEqual([]);
  });

  it('el error reemplaza a la ayuda, queda enlazado y marca el grupo como inválido', async () => {
    const { f, host, groups } = await setup();
    host.error.set('Elige un canal.');
    await f.whenStable();
    expect(groups[0].getAttribute('aria-invalid')).toBe('true');
    expect(f.nativeElement.querySelector('#' + groups[0].getAttribute('aria-describedby'))?.textContent).toContain('Elige un canal.');
    expect(f.nativeElement.textContent).not.toContain('Elige al menos uno.');
  });

  it('funciona con formularios reactivos', async () => {
    const { f, host, boxes } = await setup();
    expect(boxes(1)[0].getAttribute('aria-checked')).toBe('true');
    boxes(1)[1].click();
    await f.whenStable();
    expect(host.ctrl.value).toEqual(['mail', 'wa']);
    host.ctrl.setValue([]);
    await f.whenStable();
    expect(boxes(1)[0].getAttribute('aria-checked')).toBe('false');
  });
});
