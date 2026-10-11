import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';
import { PhoneValue } from '../../core/forms/validators';
import { DateFieldComponent } from '../../date-field/date-field.component';
import { FieldComponent } from '../../field/field.component';
import { MoneyFieldComponent } from '../../money-field/money-field.component';
import { NumberFieldComponent } from '../../number-field/number-field.component';
import { PhoneFieldComponent } from '../../phone-field/phone-field.component';
import { TagsFieldComponent } from '../../tags-field/tags-field.component';
import { TaxIdFieldComponent } from '../../tax-id-field/tax-id-field.component';
import { TimeFieldComponent } from '../../time-field/time-field.component';

@Component({
  imports: [ReactiveFormsModule, FieldComponent, PhoneFieldComponent, NumberFieldComponent, MoneyFieldComponent, TagsFieldComponent, TaxIdFieldComponent, DateFieldComponent, TimeFieldComponent],
  template: `
    <zc-field label="WhatsApp"><zc-phone-field [formControl]="phone" /></zc-field>
    <zc-field label="Cantidad"><zc-number-field [min]="1" [max]="1000" [formControl]="qty" /></zc-field>
    <zc-field label="Monto"><zc-money-field [country]="country" [formControl]="amount" /></zc-field>
    <zc-field label="Correos"><zc-tags-field [max]="3" [formControl]="mails" /></zc-field>
    <zc-field label="RUT"><zc-tax-id-field country="cl" [formControl]="rut" /></zc-field>
    <zc-field label="Vence"><zc-date-field [formControl]="date" /></zc-field>
    <zc-field label="Hora"><zc-time-field [formControl]="time" /></zc-field>`,
})
class Host {
  country: 'pe' | 'cl' = 'pe';
  phone = new FormControl<PhoneValue>({ country: 'pe', number: '' }, { nonNullable: true });
  qty = new FormControl<number | null>(5);
  amount = new FormControl<number | null>(null);
  mails = new FormControl<string[]>([], { nonNullable: true });
  rut = new FormControl('', { nonNullable: true });
  date = new FormControl<string | null>(null);
  time = new FormControl<string | null>(null);
}

function type(input: HTMLInputElement, text: string) {
  input.value = text;
  input.dispatchEvent(new Event('input'));
}
const key = (el: Element, k: string, o: KeyboardEventInit = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...o }));

describe('campos especiales', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [TranslocoTestingModule.forRoot({ langs: { es: {} }, translocoConfig: { availableLangs: ['es'], defaultLang: 'es' }, preloadLangs: true })],
  }));

  async function setup() {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    const input = (sel: string) => el.querySelector(sel + ' input') as HTMLInputElement;
    return { f, host: f.componentInstance, el, input };
  }

  it('teléfono: solo dígitos, largo del país y grupos de 3', async () => {
    const { f, host, input } = await setup();
    type(input('zc-phone-field'), '987-654-3219');
    await f.whenStable();
    expect(host.phone.value).toEqual({ country: 'pe', number: '987654321' });
    expect(input('zc-phone-field').value).toBe('987 654 321');
  });

  it('teléfono: el número toma el id del campo; el prefijo tiene su propio nombre', async () => {
    const { el, input } = await setup();
    const field = el.querySelector('zc-field')!;
    expect(field.querySelector('label')!.getAttribute('for')).toBe(input('zc-phone-field').id);
    expect(el.querySelector('zc-phone-field zc-select button')!.getAttribute('aria-label')).toBeTruthy();
  });

  it('número: flechas, Shift ×100 y ajuste al rango al salir', async () => {
    const { f, host, input } = await setup();
    const q = input('zc-number-field');
    key(q, 'ArrowUp');
    expect(host.qty.value).toBe(6);
    key(q, 'ArrowUp', { shiftKey: true });
    expect(host.qty.value).toBe(106);
    type(q, '5000');
    q.dispatchEvent(new Event('blur'));
    await f.whenStable();
    expect(host.qty.value).toBe(1000);
    expect(q.getAttribute('aria-valuenow')).toBe('1000');
  });

  it('monto: decimales de la moneda y formato del país al salir', async () => {
    const { f, host, input } = await setup();
    const a = input('zc-money-field');
    a.dispatchEvent(new Event('focus'));
    type(a, '1250,555');
    expect(host.amount.value).toBe(1250.55);
    a.dispatchEvent(new Event('blur'));
    await f.whenStable();
    expect(a.value).toBe('1,250.55');
  });

  it('etiquetas: separa con coma, no repite y respeta el máximo', async () => {
    const { f, host, input } = await setup();
    const t = input('zc-tags-field');
    t.value = 'ana@bcp.pe'; key(t, ',');
    t.value = 'ANA@bcp.pe'; key(t, 'Enter');
    t.value = 'mal@correo'; key(t, 'Enter');
    await f.whenStable();
    expect(host.mails.value).toEqual(['ana@bcp.pe', 'mal@correo']);
    key(t, 'Backspace');
    expect(host.mails.value).toEqual(['ana@bcp.pe']);
  });

  it('documento: RUT de Chile en mayúsculas y con guion al salir', async () => {
    const { f, host, input } = await setup();
    const r = input('zc-tax-id-field');
    type(r, '12345678k');
    expect(host.rut.value).toBe('12345678K');
    r.dispatchEvent(new Event('blur'));
    await f.whenStable();
    expect(host.rut.value).toBe('12345678-K');
  });

  it('fecha: máscara dd/mm/aaaa; válida → ISO, inexistente → texto', async () => {
    const { f, host, input } = await setup();
    const d = input('zc-date-field');
    type(d, '01032026');
    expect(d.value).toBe('01/03/2026');
    expect(host.date.value).toBe('2026-03-01');
    type(d, '31022026');
    expect(host.date.value).toBe('31/02/2026');
    host.date.setValue('2026-12-24');
    await f.whenStable();
    expect(d.value).toBe('24/12/2026');
  });

  it('hora: máscara hh:mm', async () => {
    const { host, input } = await setup();
    type(input('zc-time-field'), '1430');
    expect(host.time.value).toBe('14:30');
  });
});
