import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BrnProgress } from '@spartan-ng/brain/progress';
import { HlmProgress, HlmProgressIndicator } from '@zonacards/ui/helm';

export type ProgressTone = 'neutral' | 'success' | 'warning' | 'danger';
const COLOR: Record<ProgressTone, string> = { neutral: 'var(--text)', success: 'var(--success-fg)', warning: 'var(--warning-fg)', danger: 'var(--danger-fg)' };

/**
 * <zc-progress label="Envío en curso" [value]="332" [max]="500" valueText="332/500" /> · sobre spartan progress.
 * - bar: avance de una tarea (value null = indeterminado).
 * - circular: porcentaje compacto en tarjetas y KPI.
 * - meter: consumo de un cupo (role="meter"); el color cambia solo con warnAt y dangerAt (en % del máximo).
 */
@Component({
  selector: 'zc-progress',
  imports: [BrnProgress, HlmProgress, HlmProgressIndicator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0', '[attr.style]': "color() ? '--zc-bar: ' + color() : null" },
  template: `
    @if (variant() === 'circular') {
      <brn-progress [value]="value()" [max]="max()" [getValueLabel]="valueLabel" [attr.aria-label]="label()"
        class="grid size-14 shrink-0 place-items-center rounded-full" [class.motion-safe:animate-spin]="value() === null"
        [style.background]="'conic-gradient(' + color() + ' ' + (value() === null ? 25 : percent()) + '%, var(--surface-2) 0)'">
        <span class="num grid size-11 place-items-center rounded-full bg-surface text-caption font-semibold" aria-hidden="true">{{ value() === null ? '' : percent() + '%' }}</span>
      </brn-progress>
    } @else {
      <div class="grid min-w-0 gap-1.5">
        @if (showLabel()) {
          <div class="flex min-w-0 items-baseline justify-between gap-3 text-body-sm leading-5" aria-hidden="true">
            <span class="min-w-0 break-words">{{ label() }}</span><span class="num shrink-0">{{ text() }}</span>
          </div>
        }
        <hlm-progress [value]="value()" [max]="max()" [getValueLabel]="valueLabel" [attr.aria-label]="label()" [attr.role]="variant() === 'meter' ? 'meter' : 'progressbar'">
          <hlm-progress-indicator />
        </hlm-progress>
      </div>
    }`,
})
export class ProgressComponent {
  readonly label = input.required<string>();
  readonly value = input<number | null>(0);
  readonly max = input(100);
  readonly variant = input<'bar' | 'circular' | 'meter'>('bar');
  /** Texto visible a la derecha (ej. "332/500"); por defecto, el porcentaje. */
  readonly valueText = input('');
  readonly showLabel = input(true);
  /** Fuerza un color; si no, neutral en bar/circular y por umbral en meter. */
  readonly tone = input<ProgressTone | null>(null);
  readonly warnAt = input(75);
  readonly dangerAt = input(90);

  readonly percent = computed(() => Math.round(((this.value() ?? 0) / (this.max() || 1)) * 100));
  readonly text = computed(() => this.valueText() || (this.value() === null ? '' : `${this.percent()}%`));
  readonly resolvedTone = computed<ProgressTone>(() => {
    const t = this.tone();
    if (t) return t;
    if (this.variant() !== 'meter') return 'neutral';
    const p = this.percent();
    return p >= this.dangerAt() ? 'danger' : p >= this.warnAt() ? 'warning' : 'success';
  });
  readonly color = computed(() => COLOR[this.resolvedTone()]);
  readonly valueLabel = (value: number, max: number) => this.valueText() || `${Math.round((value / (max || 1)) * 100)}%`;
}
