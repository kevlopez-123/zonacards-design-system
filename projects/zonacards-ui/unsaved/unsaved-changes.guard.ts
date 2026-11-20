import { inject } from '@angular/core';
import type { CanDeactivateFn } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmService } from './confirm.service';

/** Página (o componente) con formulario: dice si hay cambios sin guardar. */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/**
 * Guardia de cambios sin guardar: pide confirmación antes de salir de un formulario modificado.
 * Úsala como `canDeactivate: [unsavedChangesGuard]` en la ruta; la página implementa `hasUnsavedChanges()`.
 */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = page => {
  if (!page?.hasUnsavedChanges()) return true;
  // Se traduce al salir (no dentro de un computed): las traducciones ya están precargadas en el arranque.
  const i18n = inject(TranslocoService);
  return inject(ConfirmService).ask({
    title: i18n.translate('ui.sinGuardar.titulo'),
    text: i18n.translate('ui.sinGuardar.texto'),
    confirmLabel: i18n.translate('ui.sinGuardar.salir'),
    cancelLabel: i18n.translate('ui.sinGuardar.seguir'),
  });
};
