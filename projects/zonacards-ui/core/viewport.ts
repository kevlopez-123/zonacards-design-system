import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, Signal, inject, signal } from '@angular/core';
import { belowWidth, minWidth } from './breakpoints';

/** Breakpoints de layout por ancho (sección 6): tarjetas/tabla desde 1024 px, tabla en tarjetas por debajo de 768 px. */
export const WIDE_QUERY = minWidth('lg');
export const NARROW_QUERY = belowWidth('md');

/** Una media query como signal; se desuscribe al destruir el componente. */
export function injectMedia(query: string): Signal<boolean> {
  const mql = inject(DOCUMENT).defaultView?.matchMedia?.(query);
  const s = signal(mql?.matches ?? false);
  const onChange = (e: MediaQueryListEvent) => s.set(e.matches);
  mql?.addEventListener('change', onChange);
  inject(DestroyRef).onDestroy(() => mql?.removeEventListener('change', onChange));
  return s.asReadonly();
}

/** Mismo criterio que --target en tokens.css: "móvil" = pantalla táctil o menos de 768 px. */
export const MOBILE_QUERY = `(pointer: coarse), ${belowWidth('md')}`;

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
  'flex h-field w-full min-w-0 items-center rounded-control border border-field-bd bg-field-bg text-body transition hover:border-muted ' +
  'focus-within:border-focus focus-within:shadow-(--focus-halo) ' +
  'data-[invalid=true]:border-danger data-[invalid=true]:focus-within:shadow-(--focus-halo-danger) data-[disabled=true]:cursor-not-allowed data-[disabled=true]:border-dashed data-[disabled=true]:bg-surface-2 data-[disabled=true]:hover:border-border-strong';
/** Input sin borde dentro de CONTROL_BOX: el anillo de foco lo pone el contenedor. */
export const BARE_INPUT = 'zc-bare h-full w-full min-w-0 bg-transparent px-4 placeholder:text-subtle disabled:cursor-not-allowed';
/** Botón de ícono dentro de un campo (calendario, reloj, borrar). */
export const INLINE_BTN = 'mr-1 grid size-icon-btn shrink-0 cursor-pointer place-items-center rounded-sm text-muted transition hover:bg-(--state-hover-bg) hover:text-fg disabled:cursor-not-allowed disabled:opacity-(--opacity-disabled)';
