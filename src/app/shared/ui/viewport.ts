import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/** Mismo criterio que --target en tokens.css: "móvil" = pantalla táctil o menos de 768 px. */
export const MOBILE_QUERY = '(pointer: coarse), (max-width: 767px)';

/** Estado del viewport como signal, para decidir patrones (popover en desktop, bottom sheet en móvil). */
@Injectable({ providedIn: 'root' })
export class Viewport {
  private readonly mql = inject(DOCUMENT).defaultView?.matchMedia?.(MOBILE_QUERY);
  readonly mobile = signal(this.mql?.matches ?? false);

  constructor() {
    const onChange = (e: MediaQueryListEvent) => this.mobile.set(e.matches);
    this.mql?.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => this.mql?.removeEventListener('change', onChange));
  }
}

/** Clases de control compartidas por las moléculas de formulario (misma altura --target que zcInput). */
export const CONTROL_BOX =
  'flex h-target w-full min-w-0 items-center rounded-sm border border-border-strong bg-surface text-base transition hover:border-muted ' +
  'focus-within:border-focus focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--focus)_22%,transparent)] ' +
  'data-[invalid=true]:border-danger data-[disabled=true]:cursor-not-allowed data-[disabled=true]:border-dashed data-[disabled=true]:bg-surface-2 data-[disabled=true]:hover:border-border-strong';
/** Input sin borde dentro de CONTROL_BOX: el anillo de foco lo pone el contenedor. */
export const BARE_INPUT = 'zc-bare h-full w-full min-w-0 bg-transparent px-4 placeholder:text-subtle disabled:cursor-not-allowed';
/** Botón de ícono dentro de un campo (calendario, reloj, borrar). */
export const INLINE_BTN = 'mr-1 grid size-icon-btn shrink-0 cursor-pointer place-items-center rounded-sm text-muted transition hover:bg-surface-2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-50';
