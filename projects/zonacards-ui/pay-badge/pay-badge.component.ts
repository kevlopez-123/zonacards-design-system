import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type PayBadge = 'yape' | 'plin' | 'pagoefectivo' | 'puntos';
const TEXT: Record<PayBadge, string> = { yape: 'YAPE', plin: 'PLIN', pagoefectivo: 'PE', puntos: 'PTS' };

/**
 * <zc-pay-badge name="yape" /> · insignia de texto para medios de pago sin logo vectorial en zc-logo (billeteras, puntos).
 * Color de marca desde tokens (--pay-*). Decorativa: el nombre del medio va en el texto de la opción.
 */
@Component({
  selector: 'zc-pay-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    class: 'inline-grid h-[22px] min-w-[34px] place-items-center rounded-[4px] px-1 text-[10px] font-bold tracking-[.02em]',
    '[style.background]': "'var(--pay-' + name() + ')'",
    '[style.color]': "'var(--on-pay-' + name() + ')'",
  },
  template: `{{ text() }}`,
})
export class PayBadgeComponent {
  readonly name = input.required<PayBadge>();
  readonly text = computed(() => TEXT[this.name()]);
}
