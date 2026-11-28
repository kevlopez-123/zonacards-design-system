import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';
import { FieldComponent } from '@zonacards/ui/field';
import { DateTimeFieldComponent } from './datetime-field.component';

@Component({
  imports: [DateTimeFieldComponent, FieldComponent, ReactiveFormsModule],
  template: `<zc-field label="Envío programado"><zc-datetime-field [formControl]="ctrl" /></zc-field>`,
})
class Host {
  ctrl = new FormControl<string | null>(null, Validators.required);
}

describe('zc-datetime-field', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [TranslocoTestingModule.forRoot({ langs: { es: { ui: { fecha: 'Fecha', hora: 'Hora', fechaYHora: 'Fecha y hora' } } }, translocoConfig: { availableLangs: ['es'], defaultLang: 'es' }, preloadLangs: true })],
  }));

  async function setup() {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const [date, time] = Array.from((f.nativeElement as HTMLElement).querySelectorAll('input[inputmode="numeric"]')) as HTMLInputElement[];
    const type = async (el: HTMLInputElement, v: string) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); await f.whenStable(); };
    return { f, ctrl: f.componentInstance.ctrl, date, time, type };
  }

  it('el valor es null hasta tener fecha y hora, y entonces "aaaa-mm-ddThh:mm"', async () => {
    const { ctrl, date, time, type } = await setup();
    await type(date, '24/12/2026');
    expect(ctrl.value).toBeNull();
    expect(ctrl.valid).toBe(false);
    await type(time, '09:30');
    expect(ctrl.value).toBe('2026-12-24T09:30');
    expect(ctrl.valid).toBe(true);
  });

  it('si se borra una parte, el valor vuelve a null pero la otra parte se conserva en pantalla', async () => {
    const { ctrl, date, time, type } = await setup();
    await type(date, '24/12/2026');
    await type(time, '09:30');
    await type(time, '');
    expect(ctrl.value).toBeNull();
    expect(date.value).toBe('24/12/2026');
  });

  it('muestra un valor que llega del formulario en sus dos partes', async () => {
    const { f, ctrl, date, time } = await setup();
    ctrl.setValue('2026-01-05T18:00');
    await f.whenStable();
    expect(date.value).toBe('05/01/2026');
    expect(time.value).toBe('18:00');
    ctrl.reset();
    await f.whenStable();
    expect(date.value).toBe('');
    expect(time.value).toBe('');
  });

  it('cada parte tiene su propio nombre y el grupo toma el de la etiqueta del campo', async () => {
    const { f, date, time } = await setup();
    expect(date.getAttribute('aria-label')).toBe('Fecha');
    expect(time.getAttribute('aria-label')).toBe('Hora');
    const group = (f.nativeElement as HTMLElement).querySelector('[role="group"]') as HTMLElement;
    expect((f.nativeElement as HTMLElement).querySelector('#' + group.getAttribute('aria-labelledby'))?.textContent).toContain('Envío programado');
    // Los dos campos de adentro no deben repetir el id del zc-field.
    expect(date.id === time.id && date.id !== '').toBe(false);
  });
});
