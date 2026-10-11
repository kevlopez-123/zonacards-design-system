import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * <zc-sparkline [values]="[3, 5, 4, 8]" tone="success" /> Â· tendencia mÃ­nima para KPI (Cards de index.html).
 * Decorativo: el dato y la variaciÃ³n ya estÃ¡n en texto al lado.
 */
@Component({
  selector: 'zc-sparkline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block shrink-0', 'aria-hidden': 'true' },
  template: `
    <svg [attr.viewBox]="'0 0 ' + w() + ' ' + h()" [attr.width]="w()" [attr.height]="h()" class="block overflow-visible" [style.color]="color()">
      <path [attr.d]="area()" fill="currentColor" opacity=".12" />
      <path [attr.d]="line()" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round" />
    </svg>`,
})
export class SparklineComponent {
  readonly values = input.required<readonly number[]>();
  readonly tone = input<'success' | 'danger' | 'neutral'>('success');
  readonly w = input(88);
  readonly h = input(28);
  readonly color = computed(() => ({ success: 'var(--success-fg)', danger: 'var(--danger-fg)', neutral: 'var(--text-muted)' })[this.tone()]);
  private readonly pts = computed(() => {
    const v = this.values(); if (v.length < 2) return [] as [number, number][];
    const min = Math.min(...v), max = Math.max(...v), span = max - min || 1, pad = 2;
    return v.map((y, i) => [(i / (v.length - 1)) * this.w(), pad + (1 - (y - min) / span) * (this.h() - pad * 2)] as [number, number]);
  });
  readonly line = computed(() => this.pts().map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' '));
  readonly area = computed(() => (this.pts().length ? `${this.line()} L${this.w()} ${this.h()} L0 ${this.h()} Z` : ''));
}
