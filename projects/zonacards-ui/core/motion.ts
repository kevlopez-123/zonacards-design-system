/**
 * Salidas de overlays e indicadores deslizantes. La entrada va con clases (tw-animate-css); la salida necesita animar antes de quitar
 * el nodo, así que usa la Web Animations API y avisa al terminar. Con "reducir movimiento" (o sin la API, en pruebas) termina al instante.
 * Mismos valores que los tokens de styles/tokens.css (--motion-ease-*, --dur-*).
 */
export const EASE_ENTER = 'cubic-bezier(0.32, 0.72, 0, 1)';
export const EASE_EXIT = 'cubic-bezier(0.3, 0, 0.8, 0.15)';
export const EASE_STANDARD = 'cubic-bezier(0.2, 0, 0, 1)';
/** @deprecated Usa EASE_ENTER. */
export const SHEET_EASE = EASE_ENTER;

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function animateOut(el: Element | null | undefined, frames: Keyframe[], duration: number, done: () => void): void {
  if (!el || reduced() || typeof (el as HTMLElement).animate !== 'function') { done(); return; }
  const a = (el as HTMLElement).animate(frames, { duration, easing: EASE_EXIT, fill: 'forwards' });
  let finished = false;
  const end = () => { if (!finished) { finished = true; done(); } };
  a.onfinish = end; a.oncancel = end;
  // Respaldo por si la pestaña está en segundo plano y la animación no avanza.
  setTimeout(end, duration + 100);
}

const fade = (backdrop: Element | null | undefined, ms: number) => {
  if (!reduced()) backdrop?.animate?.([{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: EASE_EXIT, fill: 'forwards' });
};

/** Bottom sheet: baja hasta salir por el borde inferior; el scrim se desvanece a la vez. */
export function sheetOut(sheet: Element | null | undefined, backdrop: Element | null | undefined, done: () => void): void {
  fade(backdrop, 200);
  animateOut(sheet, [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }], 200, done);
}

/** Drawer lateral: sale por la derecha. */
export function drawerOut(drawer: Element | null | undefined, backdrop: Element | null | undefined, done: () => void): void {
  fade(backdrop, 180);
  animateOut(drawer, [{ transform: 'translateX(0)' }, { transform: 'translateX(100%)' }], 180, done);
}

/** Modal: se desvanece y se achica apenas (inverso de su entrada). */
export function modalOut(modal: Element | null | undefined, backdrop: Element | null | undefined, done: () => void): void {
  fade(backdrop, 140);
  animateOut(modal, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.96)' }], 140, done);
}

/** Popover y menú: se desvanecen hacia su ancla. */
export function popoverOut(panel: Element | null | undefined, done: () => void): void {
  animateOut(panel, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.97)' }], 100, done);
}

/**
 * Indicador deslizante (pestañas, control segmentado): lo lleva bajo el elemento activo con transform y ancho.
 * La primera vez se coloca sin animar; después se desliza con la curva estándar.
 */
export function placeIndicator(indicator: HTMLElement | null | undefined, active: HTMLElement | null | undefined, animate: boolean): void {
  if (!indicator) return;
  if (!active || !active.offsetWidth) { indicator.style.opacity = '0'; return; }
  indicator.style.transition = animate && !reduced()
    ? `transform var(--dur-base) ${EASE_STANDARD}, width var(--dur-base) ${EASE_STANDARD}, opacity var(--dur-fast) linear`
    : 'none';
  indicator.style.width = `${active.offsetWidth}px`;
  indicator.style.transform = `translateX(${active.offsetLeft}px)`;
  indicator.style.opacity = '1';
}
