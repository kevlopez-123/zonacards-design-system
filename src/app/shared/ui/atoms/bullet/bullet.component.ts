import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * <zc-bullet [value]="38" [min]="50" [reorder]="66" [max]="160" label="Stock…" /> · medidor de stock (tarjeta de stock de Cards).
 * Franjas: bajo el mínimo (peligro), rango sano (éxito) y sobre el máximo (aviso); barra = valor, marca = punto de pedido.
 * Los textos (cabecera y leyenda) los pone quien lo usa con [head] y [legend]; el medidor es role="img" con [label].
 */
@Component({
  selector: 'zc-bullet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 gap-1.5', '[attr.title]': 'null' },
  template: `
    <ng-content select="[zcBulletHead]" />
    <div class="relative h-3.5 rounded-xs border border-border" role="img" [attr.aria-label]="label()"
      [style.background]="'linear-gradient(90deg, var(--danger-bg) 0 ' + p(min()) + '%, var(--success-bg) ' + p(min()) + '% ' + p(max()) + '%, var(--warning-bg) ' + p(max()) + '% 100%)'">
      <span class="absolute inset-y-[3px] left-0 rounded-[2px] bg-fg" [style.width.%]="p(value())"></span>
      @if (reorder() !== null) { <span class="absolute -inset-y-1 w-0.5 bg-fg" [style.left.%]="p(reorder()!)"></span> }
    </div>
    <ng-content />`,
})
export class BulletComponent {
  readonly value = input.required<number>();
  readonly min = input.required<number>();
  readonly max = input.required<number>();
  readonly reorder = input<number | null>(null);
  /** Fin de la escala; por defecto 1,25 × máximo. */
  readonly scale = input<number | null>(null);
  readonly label = input.required<string>();
  private readonly end = computed(() => this.scale() ?? this.max() * 1.25);
  p(v: number) { return Math.max(0, Math.min(100, (v / this.end()) * 100)); }
}
