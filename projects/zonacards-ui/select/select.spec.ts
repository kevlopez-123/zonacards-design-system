import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';
import { FieldComponent } from '@zonacards/ui/field';
import { ZcOption } from '@zonacards/ui/listbox';
import { SelectComponent } from './select.component';

const DOCS: ZcOption<string>[] = [{ value: 'dni', label: 'DNI' }, { value: 'ce', label: 'Carné de extranjería' }, { value: 'pas', label: 'Pasaporte' }, { value: 'ruc', label: 'RUC', disabled: true }];
const MANY: ZcOption<string>[] = 'Lima Arequipa Trujillo Quito Guayaquil Cuenca Bogotá Medellín Cali'.split(' ').map(l => ({ value: l, label: l }));

@Component({
  imports: [SelectComponent, FieldComponent, ReactiveFormsModule],
  template: `
    <zc-field label="Tipo de documento" hint="Ayuda"><zc-select [options]="docs" [(value)]="doc" /></zc-field>
    <zc-field label="Ciudades"><zc-combobox [options]="many" [multiple]="true" [formControl]="cities" /></zc-field>`,
})
class Host { docs = DOCS; many = MANY; doc = signal<unknown>(null); cities = new FormControl<string[]>(['Lima'], { nonNullable: true }); }

const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

describe('zc-select / zc-combobox', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [TranslocoTestingModule.forRoot({ langs: { es: { ui: { nSeleccionados: '{{n}} seleccionados', limpiar: 'Limpiar', listo: 'Listo', sinResultados: 'Sin resultados' } } }, translocoConfig: { availableLangs: ['es'], defaultLang: 'es' } })],
  }));

  async function setup() {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const triggers = f.nativeElement.querySelectorAll('zc-select > button, zc-combobox > button') as NodeListOf<HTMLButtonElement>;
    return { f, host: f.componentInstance, triggers };
  }
  const options = () => Array.from(document.querySelectorAll('.cdk-overlay-container [role="option"]')) as HTMLElement[];

  it('se nombra con la etiqueta del campo y su valor, y se describe con el mensaje', async () => {
    const { f, triggers } = await setup();
    const field = f.nativeElement.querySelector('zc-field');
    const [labelId] = triggers[0].getAttribute('aria-labelledby')!.split(' ');
    expect(field.querySelector('#' + labelId).textContent).toContain('Tipo de documento');
    expect(triggers[0].getAttribute('aria-describedby')).toBe(field.querySelector('p').id);
    expect(triggers[0].getAttribute('aria-haspopup')).toBe('listbox');
  });

  it('flecha abajo abre, salta la opción deshabilitada y Enter elige y cierra', async () => {
    const { f, host, triggers } = await setup();
    key(triggers[0], 'ArrowDown');
    await f.whenStable();
    expect(triggers[0].getAttribute('aria-expanded')).toBe('true');
    const list = document.querySelector('.cdk-overlay-container [role="listbox"]') as HTMLElement;
    key(list, 'End'); // la última habilitada es Pasaporte (RUC está deshabilitado)
    await f.whenStable();
    expect(list.getAttribute('aria-activedescendant')).toBe(options()[2].id);
    key(list, 'Enter');
    await f.whenStable();
    expect(host.doc()).toBe('pas');
    expect(triggers[0].getAttribute('aria-expanded')).toBe('false');
    expect(triggers[0].textContent).toContain('Pasaporte');
  });

  it('escribir con la lista cerrada salta a la opción que empieza así', async () => {
    const { f, triggers } = await setup();
    key(triggers[0], 'c');
    await f.whenStable();
    const list = document.querySelector('.cdk-overlay-container [role="listbox"]') as HTMLElement;
    expect(list.getAttribute('aria-activedescendant')).toBe(options()[1].id);
  });

  it('con más de 8 opciones muestra búsqueda y multiselección con Limpiar', async () => {
    const { f, host, triggers } = await setup();
    triggers[1].click();
    await f.whenStable();
    const search = document.querySelector('.cdk-overlay-container input[role="combobox"]') as HTMLInputElement;
    expect(search).toBeTruthy();
    search.value = 'bog'; search.dispatchEvent(new Event('input'));
    await f.whenStable();
    expect(options().map(o => o.textContent!.trim())).toEqual(['Bogotá']);
    options()[0].click();
    await f.whenStable();
    expect(host.cities.value).toEqual(['Lima', 'Bogotá']);
    expect(triggers[1].textContent).toContain('Lima, Bogotá');
    (Array.from(document.querySelectorAll('.cdk-overlay-container button')) as HTMLButtonElement[]).find(b => b.textContent!.includes('Limpiar'))!.click();
    await f.whenStable();
    expect(host.cities.value).toEqual([]);
  });

  it('Escape cierra y devuelve el foco al disparador', async () => {
    const { f, triggers } = await setup();
    triggers[0].click();
    await f.whenStable();
    const list = document.querySelector('.cdk-overlay-container [role="listbox"]') as HTMLElement;
    key(list, 'Escape');
    await f.whenStable();
    expect(document.querySelector('.cdk-overlay-container [role="listbox"]')).toBeNull();
    expect(document.activeElement).toBe(triggers[0]);
  });
});
