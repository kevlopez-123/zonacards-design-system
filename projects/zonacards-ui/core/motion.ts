/**
 * Salidas de overlays. La entrada va con clases (tw-animate-css); la salida necesita animar antes de quitar el nodo, así que usa la
 * Web Animations API y avisa al terminar. Con "reducir movimiento" (o sin la API, en pruebas) termina al instante.
 */
export const SHEET_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

export function animateOut(el: Element | null | undefined, frames: Keyframe[], duration: number, done: () => void): void {
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!el || reduce || typeof (el as HTMLElement).animate !== 'function') { done(); return; }
  const a = (el as HTMLElement).animate(frames, { duration, easing: SHEET_EASE, fill: 'forwards' });
  let finished = false;
  const end = () => { if (!finished) { finished = true; done(); } };
  a.onfinish = end; a.oncancel = end;
  // Respaldo por si la pestaña está en segundo plano y la animación no avanza.
  setTimeout(end, duration + 100);
}

/** El bottom sheet baja hasta salir por el borde inferior; el scrim se desvanece a la vez. */
export function sheetOut(sheet: Element | null | undefined, backdrop: Element | null | undefined, done: () => void): void {
  backdrop?.animate?.([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
  animateOut(sheet, [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }], 220, done);
}
