import { computed, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { asapScheduler, merge, observeOn } from 'rxjs';

/**
 * Mensaje de error de un control para <zc-field [error]>, en el idioma activo.
 * Solo aparece después de salir del campo (touched) o al intentar enviar (markAllAsTouched).
 * Cada clave de error se traduce desde "validacion.<clave>" con sus datos; `overrides` permite un texto propio.
 * Llamar en un contexto de inyección (inicializador de campo de un componente).
 */
export function fieldError(control: AbstractControl, overrides: Record<string, string> = {}): Signal<string | null> {
  const t = inject(TranslocoService);
  // Los eventos de Transloco llegan en una microtarea: translate() puede emitirlos durante el render (NG0600).
  const tick = toSignal(merge(control.events, t.events$.pipe(observeOn(asapScheduler))), { initialValue: null });
  return computed(() => {
    tick();
    if (!control.touched || !control.errors) return null;
    const [key, params] = Object.entries(control.errors)[0];
    return overrides[key] ?? t.translate('validacion.' + key, typeof params === 'object' ? params : {});
  });
}
