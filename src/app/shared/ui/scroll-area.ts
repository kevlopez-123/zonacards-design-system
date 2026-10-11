import { DestroyRef, Directive, ElementRef, afterNextRender, inject } from '@angular/core';

/**
 * [zcScrollArea] · área con desplazamiento horizontal (pestañas, tablas, carruseles).
 * - Degradado en el borde cuando hay más contenido (data-fade="start|end|both", estilos en styles.css).
 * - Barra fina visible solo mientras se desplaza (clase is-scrolling, se quita 0,9 s después), con el mouse encima o con foco.
 * Listener pasivo y ResizeObserver, sin librerías.
 */
@Directive({ selector: '[zcScrollArea]', host: { class: 'sb-hover' } })
export class ScrollAreaDirective {
  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      // scrollLeft es negativo en RTL: se usa el valor absoluto.
      const x = Math.abs(el.scrollLeft);
      const start = x > 1; const end = max - x > 1;
      const fade = start && end ? 'both' : start ? 'start' : end ? 'end' : null;
      if (fade) el.setAttribute('data-fade', fade); else el.removeAttribute('data-fade');
      // Un área que desborda debe poder desplazarse con teclado (axe: scrollable-region-focusable).
      const overflows = max > 1 || el.scrollHeight - el.clientHeight > 1;
      if (overflows && !el.hasAttribute('tabindex')) { el.setAttribute('tabindex', '0'); el.dataset['zcTab'] = ''; }
      else if (!overflows && 'zcTab' in el.dataset) { el.removeAttribute('tabindex'); delete el.dataset['zcTab']; }
    };
    const onScroll = () => {
      update();
      el.classList.add('is-scrolling');
      clearTimeout(timer);
      timer = setTimeout(() => el.classList.remove('is-scrolling'), 900);
    };
    // Sin ResizeObserver (entornos de prueba) solo se actualiza al desplazar.
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    afterNextRender(() => {
      el.addEventListener('scroll', onScroll, { passive: true });
      ro?.observe(el);
      if (el.firstElementChild) ro?.observe(el.firstElementChild);
      update();
    });
    inject(DestroyRef).onDestroy(() => { el.removeEventListener('scroll', onScroll); ro?.disconnect(); clearTimeout(timer); });
  }
}
