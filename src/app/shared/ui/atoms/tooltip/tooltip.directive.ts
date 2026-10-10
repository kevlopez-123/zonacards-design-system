import { Directive } from '@angular/core';
import { BrnTooltip, BrnTooltipPosition, provideBrnTooltipDefaultOptions } from '@spartan-ng/brain/tooltip';
import { DEFAULT_TOOLTIP_CONTENT_CLASSES, DEFAULT_TOOLTIP_SVG_CLASS, tooltipPositionVariants } from '@spartan-ng/helm/tooltip';
import { hlm } from '@spartan-ng/helm/utils';

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
})
export class TooltipDirective {}
