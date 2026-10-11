import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { IconComponent } from '../../atoms/icon/icon.component';
import { IconName } from '../../atoms/icon/icon-registry.generated';
import { SparklineComponent } from '../../atoms/sparkline/sparkline.component';

/**
 * <zc-kpi label="Activados" value="132" icon="s:check-circle" [filter]="true" [(pressed)]="x" /> · tarjeta KPI.
 * - Con [filter]: es un botón con aria-pressed que filtra el listado (KPI que filtran, plantilla Listado).
 * - Sin [filter]: solo informa. Variación opcional (+8,2 %) con ícono y texto, nunca solo color.
 * Grilla fluida (la define la página): grid-cols-[repeat(auto-fit,minmax(128px,1fr))]; ancho mínimo de 128 px por tarjeta.
 */
@Component({
  selector: 'zc-kpi',
  imports: [NgTemplateOutlet, IconComponent, SparklineComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0 @container', '[attr.title]': 'null' },
  template: `
    @if (filter()) {
      <button type="button" [class]="boxClass()" [attr.aria-pressed]="pressed()" (click)="pressed.set(!pressed())"><ng-container *ngTemplateOutlet="body" /></button>
    } @else {
      <div [class]="boxClass()"><ng-container *ngTemplateOutlet="body" /></div>
    }
    <ng-template #body>
      <span class="flex min-w-0 items-start justify-between gap-2 text-sm leading-5 text-muted">
        <span class="min-w-0 break-words">{{ label() }}</span>
        @if (icon()) { <span class="grid size-8 shrink-0 place-items-center rounded-sm bg-surface-2 text-fg @max-[150px]:hidden"><zc-icon [name]="icon()!" [size]="16" /></span> }
      </span>
      <span class="break-words text-2xl font-semibold leading-8 num">{{ value() }}</span>
      @if (trend(); as tr) {
        <span class="flex min-w-0 flex-wrap items-end justify-between gap-2">
          @if (delta() !== null) {
            <span class="inline-flex flex-wrap items-center gap-1.5 text-[13px]">
              <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium num" [class]="good() ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'">
                <zc-icon [name]="delta()! >= 0 ? 'l:trending-up' : 'l:trending-down'" [size]="16" />{{ deltaText() }}</span>
              @if (deltaLabel()) { <span class="text-muted">{{ deltaLabel() }}</span> }
            </span>
          }
          <zc-sparkline class="ml-auto" [values]="tr" [tone]="good() ? 'success' : 'danger'" />
        </span>
      } @else if (delta() !== null) {
        <span class="inline-flex items-center gap-1 text-[13px] num" [class.text-success]="good()" [class.text-danger]="!good()">
          <zc-icon [name]="delta()! >= 0 ? 'l:trending-up' : 'l:trending-down'" [size]="16" />{{ deltaText() }}
          @if (deltaLabel()) { <span class="text-muted">{{ deltaLabel() }}</span> }
        </span>
      }
    </ng-template>`,
})
export class KpiComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input<IconName | null>(null);
  /** Variación porcentual (8.2 = +8,2 %). */
  readonly delta = input<number | null>(null);
  readonly deltaLabel = input('');
  /** Serie del sparkline (KPI con tendencia de Cards): la variación pasa a píldora y la línea va a la derecha. */
  readonly trend = input<readonly number[] | null>(null);
  /** Si subir es malo (por vencer, errores), el color se invierte. */
  readonly invert = input(false);
  readonly filter = input(false);
  readonly pressed = model(false);
  readonly good = computed(() => ((this.delta() ?? 0) >= 0) !== this.invert());
  readonly deltaText = computed(() => { const d = this.delta() ?? 0; return (d >= 0 ? '+' : '−') + Math.abs(d).toLocaleString('es-PE', { maximumFractionDigits: 1 }) + ' %'; });
  readonly boxClass = computed(() => 'grid h-full w-full min-w-0 content-start gap-2 rounded-md border bg-surface p-4 text-left transition-colors duration-(--dur) '
    + (this.filter() ? 'cursor-pointer border-border hover:border-border-strong aria-pressed:border-primary aria-pressed:shadow-[inset_0_0_0_1px_var(--primary)]' : 'border-border'));
}
