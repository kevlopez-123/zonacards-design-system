import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

/**
 * [zcScrollArea] · área con desplazamiento (pestañas, tablas, carruseles, listas, cuerpos de overlays).
 * - Horizontal: degradado en el borde cuando hay más contenido (data-fade="start|end|both", estilos en zonacards.css).
 * - Vertical: mientras el contenido desborda, la barra queda siempre visible (data-overflow-y): una lista cortada
 *   en 300 px debe mostrar que tiene más opciones.
 * - Barra fina visible mientras se desplaza (clase is-scrolling, se quita 0,9 s después), con el mouse encima o con foco.
 * - Si desborda y no tiene tabindex, recibe tabindex="0" (axe: scrollable-region-focusable). Las listas con foco virtual
 *   (listbox con buscador) pasan [zcScrollAreaFocusable]="false": el foco ya vive en el buscador o en la lista.
 * Listener pasivo y ResizeObserver, sin librerías.
 */
@Directive({ selector: '[zcScrollArea]', host: { class: 'sb-hover' } })
export class ScrollAreaDirective {
  readonly zcScrollAreaFocusable = input(true);

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      // Sin desplazamiento horizontal (overflow-x hidden o visible) no hay degradado aunque el contenido sea apenas más ancho.
      const scrollsX = /auto|scroll/.test(getComputedStyle(el).overflowX);
      const max = scrollsX ? el.scrollWidth - el.clientWidth : 0;
      // scrollLeft es negativo en RTL: se usa el valor absoluto.
      const x = Math.abs(el.scrollLeft);
      const start = x > 1; const end = max - x > 1;
      const fade = start && end ? 'both' : start ? 'start' : end ? 'end' : null;
      if (fade) el.setAttribute('data-fade', fade); else el.removeAttribute('data-fade');
      const overflowsY = el.scrollHeight - el.clientHeight > 1;
      el.toggleAttribute('data-overflow-y', overflowsY);
      // Un área que desborda debe poder desplazarse con teclado (axe: scrollable-region-focusable).
      const overflows = max > 1 || overflowsY;
      if (overflows && this.zcScrollAreaFocusable() && !el.hasAttribute('tabindex')) { el.setAttribute('tabindex', '0'); el.dataset['zcTab'] = ''; }
      else if ((!overflows || !this.zcScrollAreaFocusable()) && 'zcTab' in el.dataset) { el.removeAttribute('tabindex'); delete el.dataset['zcTab']; }
    };
    const onScroll = () => {
      update();
      el.classList.add('is-scrolling');
      clearTimeout(timer);
      timer = setTimeout(() => el.classList.remove('is-scrolling'), 900);
    };
    // Sin ResizeObserver (entornos de prueba) solo se actualiza al desplazar.
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    // Opciones que aparecen o se filtran sin cambiar el tamaño del contenedor.
    const mo = typeof MutationObserver === 'undefined' ? null : new MutationObserver(update);
    afterNextRender(() => {
      el.addEventListener('scroll', onScroll, { passive: true });
      ro?.observe(el);
      if (el.firstElementChild) ro?.observe(el.firstElementChild);
      mo?.observe(el, { childList: true });
      update();
    });
    inject(DestroyRef).onDestroy(() => { el.removeEventListener('scroll', onScroll); ro?.disconnect(); mo?.disconnect(); clearTimeout(timer); });
  }
}
