/**
 * Devolver el foco al cerrar un panel u overlay. Si el elemento que lo abrió ya no está en el documento (un ítem de zc-menu, cuyo
 * panel se cerró), el foco vuelve al disparador del último menú usado, en vez de caer al <body>.
 */
let lastMenuTrigger: WeakRef<HTMLElement> | null = null;

/** zc-menu lo llama al elegir un ítem: su disparador es el destino de reserva del overlay que abra esa acción. */
export function rememberMenuTrigger(el: HTMLElement) { lastMenuTrigger = new WeakRef(el); }

/** Enfoca target si sigue en el documento; si no, el disparador del último menú. Devuelve si pudo enfocar algo. */
export function restoreFocus(target: HTMLElement | null | undefined): boolean {
  const el = target?.isConnected ? target : lastMenuTrigger?.deref();
  if (!el?.isConnected) return false;
  el.focus({ preventScroll: true });
  return true;
}
