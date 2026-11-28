import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { TOAST_DURATION, ToastService } from './toast.service';

/** Una promesa que se resuelve o rechaza cuando el test lo decide. */
function deferred<T>() {
  let resolve!: (v: T) => void, reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

describe('ToastService · promise y update', () => {
  let toast: ToastService;
  beforeEach(() => { toast = TestBed.inject(ToastService); });

  it('"cargando" no se cierra solo; éxito sí, y error con acción no', () => {
    const a = toast.loading('Guardando…');
    expect(toast.visible().find(t => t.id === a)?.duration).toBeNull();
    const b = toast.success('Listo');
    expect(toast.visible().find(t => t.id === b)?.duration).toBe(TOAST_DURATION);
    const c = toast.error('Falló', { action: { label: 'Reintentar', run: () => {} } });
    expect(toast.visible().find(t => t.id === c)?.duration).toBeNull();
  });

  it('update cambia el aviso en su lugar y recalcula cuánto dura', () => {
    const id = toast.loading('Guardando…');
    expect(toast.update(id, { kind: 'success', title: 'Guardado', text: 'Ya está activo.' })).toBe(true);
    const t = toast.visible()[0];
    expect([t.id, t.kind, t.title, t.text, t.duration]).toEqual([id, 'success', 'Guardado', 'Ya está activo.', TOAST_DURATION]);
    expect(toast.update(999, { title: 'x' })).toBe(false);
  });

  it('promise: un solo aviso que pasa de cargando a éxito, y devuelve el valor', async () => {
    const d = deferred<number>();
    const done = toast.promise(d.promise, { loading: 'Guardando…', success: n => `Se guardaron ${n} filas`, error: 'No se pudo guardar' });
    expect(toast.visible().map(t => [t.kind, t.title])).toEqual([['loading', 'Guardando…']]);
    const id = toast.visible()[0].id;
    d.resolve(7);
    expect(await done).toBe(7);
    expect(toast.visible().map(t => [t.id, t.kind, t.title])).toEqual([[id, 'success', 'Se guardaron 7 filas']]);
  });

  it('promise: si falla, pasa a error en su lugar y deja pasar el error', async () => {
    const d = deferred<void>();
    const done = toast.promise(d.promise, { loading: 'Guardando…', success: 'Guardado', error: e => ({ title: 'No se pudo guardar', text: String(e) }) });
    const id = toast.visible()[0].id;
    d.reject('sin conexión');
    await expect(done).rejects.toBe('sin conexión');
    const t = toast.visible()[0];
    expect([t.id, t.kind, t.title, t.text]).toEqual([id, 'error', 'No se pudo guardar', 'sin conexión']);
  });

  it('si la persona cerró el aviso antes, el resultado igual se muestra en uno nuevo', async () => {
    const d = deferred<void>();
    const done = toast.promise(d.promise, { loading: 'Guardando…', success: 'Guardado', error: 'No se pudo guardar' });
    toast.dismiss(toast.visible()[0].id);
    expect(toast.visible()).toEqual([]);
    d.resolve();
    await done;
    expect(toast.visible().map(t => [t.kind, t.title])).toEqual([['success', 'Guardado']]);
  });

  it('acepta avisos completos (con acción) para éxito y error', async () => {
    const run = () => {};
    await toast.promise(Promise.resolve(1), { loading: 'x', success: { title: 'Lote creado', action: { label: 'Ver lote', run } }, error: 'no' });
    expect(toast.visible()[0].action?.label).toBe('Ver lote');
  });
});
