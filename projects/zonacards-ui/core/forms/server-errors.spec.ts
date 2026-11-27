import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';
import { fieldError } from './field-error';
import { applyServerErrors, focusFirstInvalid, SERVER_ERROR } from './server-errors';

const form = () => new FormGroup({
  email: new FormControl('ana@empresa.com', { nonNullable: true, validators: [Validators.required, Validators.email] }),
  name: new FormControl('', { nonNullable: true }),
  address: new FormGroup({ street: new FormControl('Av. Larco 123', { nonNullable: true }) }),
});

describe('errores del servidor en formularios', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [TranslocoTestingModule.forRoot({ langs: { es: { validacion: { required: 'Este campo es obligatorio.', email: 'Correo no válido.' } } }, translocoConfig: { availableLangs: ['es'], defaultLang: 'es' }, preloadLangs: true })],
  }));

  it('pone el mensaje en su campo, lo marca como tocado e invalida el formulario', () => {
    const f = form();
    const left = applyServerErrors(f, { email: 'Ya existe una cuenta con este correo.' });
    expect(left).toEqual([]);
    expect(f.controls.email.errors?.[SERVER_ERROR]).toBe('Ya existe una cuenta con este correo.');
    expect(f.controls.email.touched).toBe(true);
    expect(f.valid).toBe(false);
  });

  it('devuelve las claves que no son de ningún campo, para mostrarlas arriba', () => {
    const f = form();
    expect(applyServerErrors(f, { general: 'No pudimos guardar.', email: 'Repetido.', otro: 'x' })).toEqual(['general', 'otro']);
  });

  it('entiende campos anidados con punto y toma el primer mensaje de una lista', () => {
    const f = form();
    applyServerErrors(f, { 'address.street': ['Calle inexistente.', 'Otra.'] });
    expect(f.controls.address.controls.street.errors?.[SERVER_ERROR]).toBe('Calle inexistente.');
  });

  it('ignora los mensajes vacíos', () => {
    const f = form();
    applyServerErrors(f, { name: '', email: null, 'address.street': [] });
    expect(f.valid).toBe(true);
  });

  it('el error desaparece cuando la persona cambia el campo', () => {
    const f = form();
    applyServerErrors(f, { email: 'Repetido.' });
    f.controls.email.setValue('otra@empresa.com');
    expect(f.controls.email.errors).toBeNull();
    expect(f.valid).toBe(true);
  });

  it('conserva los otros errores del control, con el del servidor primero', () => {
    const f = form();
    f.controls.email.setValue('no-es-correo');
    applyServerErrors(f, { email: 'Repetido.' });
    expect(Object.keys(f.controls.email.errors ?? {})).toEqual([SERVER_ERROR, 'email']);
  });

  it('fieldError muestra el texto del servidor tal cual, no una traducción', () => {
    const f = form();
    const injector = TestBed.inject(Injector);
    const message = runInInjectionContext(injector, () => fieldError(f.controls.email));
    expect(message()).toBeNull();
    applyServerErrors(f, { email: 'Ya existe una cuenta con este correo.' });
    expect(message()).toBe('Ya existe una cuenta con este correo.');
  });

  it('focusFirstInvalid enfoca el primer campo con aria-invalid y avisa cuál fue', async () => {
    document.body.innerHTML = '<form><input id="a" /><input id="b" aria-invalid="true" /><input id="c" aria-invalid="true" /></form>';
    const el = await focusFirstInvalid(document.body);
    expect(el?.id).toBe('b');
    expect(document.activeElement?.id).toBe('b');
  });

  it('focusFirstInvalid no falla si no hay campos con error', async () => {
    document.body.innerHTML = '<form><input id="a" /></form>';
    expect(await focusFirstInvalid(document.body)).toBeNull();
  });
});
