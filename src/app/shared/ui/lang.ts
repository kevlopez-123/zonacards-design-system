import { inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { asapScheduler, map, observeOn } from 'rxjs';

/** Idioma activo como signal ('es' | 'en'), para formatear fechas y montos con Intl. */
export function injectLang(): Signal<'es' | 'en'> {
  const t = inject(TranslocoService);
  const pick = (l: string) => (l === 'en' ? 'en' : 'es') as 'es' | 'en';
  return toSignal(t.langChanges$.pipe(map(pick)), { initialValue: pick(t.getActiveLang()) });
}

/**
 * translate() que se puede usar dentro de computed(): se recalcula al cambiar de idioma y al terminar de cargar
 * las traducciones (sin esto, un computed evaluado antes de la carga se queda con la clave, ej. "ui.codigoPais").
 */
export function injectTranslate(): (key: string, params?: Record<string, unknown>) => string {
  const t = inject(TranslocoService);
  // translate() puede iniciar la carga del idioma y emitir el evento durante el render (NG0600): se avisa en una microtarea.
  const tick = toSignal(t.events$.pipe(observeOn(asapScheduler)), { initialValue: null });
  return (key, params) => { tick(); return t.translate(key, params); };
}
