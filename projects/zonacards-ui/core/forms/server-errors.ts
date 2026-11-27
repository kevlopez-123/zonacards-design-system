import { AbstractControl } from '@angular/forms';

/** Clave del error que pone `applyServerErrors` en un control: su valor es el mensaje del servidor, que `fieldError()` muestra tal cual. */
export const SERVER_ERROR = 'server';

/** Errores de validación que devuelve el servidor, por campo: `{ email: 'Ya existe una cuenta con este correo.' }`. Una lista muestra el primero. */
export type ServerErrors = Record<string, string | readonly string[] | null | undefined>;

/**
 * Pone los errores del servidor en sus controles (equivale a `validationErrors` del formulario de HeroUI): cada mensaje queda como error `server`
 * del control (los campos anidados se nombran con punto, `direccion.calle`) y el control se marca como tocado para que se vea. El error se borra
 * solo cuando la persona cambia el campo, porque Angular vuelve a validar el control y reemplaza los errores. No se pierden los demás errores del
 * control, pero el del servidor va primero.
 *
 * Devuelve las claves que no corresponden a ningún campo del formulario (por ejemplo, un error general): muéstralas en un `<zc-alert>` o en el
 * resumen de errores. Después de aplicarlos, llama a `focusFirstInvalid(contenedor)` para llevar el foco al primer campo con error.
 */
export function applyServerErrors(form: AbstractControl, errors: ServerErrors): string[] {
  const unmatched: string[] = [];
  for (const [path, raw] of Object.entries(errors)) {
    const message = typeof raw === 'string' ? raw : raw?.[0];
    if (!message) continue;
    const control = form.get(path);
    if (!control) { unmatched.push(path); continue; }
    control.setErrors({ [SERVER_ERROR]: message, ...control.errors });
    control.markAsTouched();
  }
  return unmatched;
}

/**
 * Lleva el foco al primer campo con error dentro de `root` (en el orden de la pantalla) y lo muestra si estaba fuera de vista. El error y
 * `aria-invalid` aparecen un instante después de la validación (los mensajes se arman en una microtarea), así que busca durante unos cuadros de
 * dibujo (hasta ~130 ms) antes de rendirse. Devuelve el elemento al que se llevó el foco (o `null` si nunca apareció un campo con error).
 */
export function focusFirstInvalid(root: ParentNode, frames = 8): Promise<HTMLElement | null> {
  return new Promise(resolve => {
    const look = (left: number) => requestAnimationFrame(() => {
      const el = root.querySelector<HTMLElement>('[aria-invalid="true"]:not([disabled])');
      if (el) { el.focus(); resolve(el); } else if (left > 1) look(left - 1); else resolve(null);
    });
    look(frames);
  });
}
