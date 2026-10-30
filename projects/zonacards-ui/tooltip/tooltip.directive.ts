import { Directive, inject } from '@angular/core';
import { BrnTooltip, BrnTooltipPosition, provideBrnTooltipDefaultOptions } from '@spartan-ng/brain/tooltip';
import { DEFAULT_TOOLTIP_CONTENT_CLASSES, DEFAULT_TOOLTIP_SVG_CLASS, tooltipPositionVariants } from '@zonacards/ui/helm';
import { hlm } from '@zonacards/ui/helm';

/**
 * [zcTooltip]="texto" · sobre spartan tooltip. Aparece con mouse y con foco de teclado, Escape lo oculta,
 * se enlaza con aria-describedby y nunca contiene acciones. En táctil no aparece: usa texto visible o (?) con popover.
 *
 * Botón deshabilitado con motivo: un botón disabled no recibe foco ni mouse, así que el tooltip va en un contenedor enfocable:
 *   <span zcTooltip="Completa los campos obligatorios" tabindex="0" class="inline-flex rounded-full [&>button]:pointer-events-none">
 *     <button zcButton disabled>Guardar campaña</button>
 *   </span>
 */
@Directive({
  selector: '[zcTooltip]',
  providers: [
    provideBrnTooltipDefaultOptions({
      svgClasses: DEFAULT_TOOLTIP_SVG_CLASS,
      tooltipContentClasses: DEFAULT_TOOLTIP_CONTENT_CLASSES,
      arrowClasses: (position: BrnTooltipPosition) => hlm(tooltipPositionVariants({ position })),
    }),
  ],
  hostDirectives: [
    { directive: BrnTooltip, inputs: ['brnTooltip: zcTooltip', 'position: zcTooltipPosition', 'tooltipDisabled: zcTooltipDisabled'] },
  ],
  host: { '(pointerdown)': 'onPress()', '(pointerleave)': 'release()', '(keydown)': 'release()' },
})
export class TooltipDirective {
  private readonly brn = inject(BrnTooltip);

  /**
   * Al hacer clic el tooltip se oculta y no vuelve mientras el puntero siga encima, aunque el foco regrese al botón (un menú o un
   * selector que se cierra): si no, queda pegado sobre lo que se acaba de elegir. Con teclado vuelve a funcionar normal.
   */
  onPress() {
    this.brn.mutableTooltipDisabled.set(true);
    // delay() es público en el JS de spartan pero privado en sus tipos: es la única forma de ocultarlo ya (sin esperar hideDelay).
    (this.brn as unknown as { delay(show: boolean, ms: number): void }).delay(false, 0);
  }
  release() { this.brn.mutableTooltipDisabled.set(this.brn.tooltipDisabled()); }
}
