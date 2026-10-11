import { Directionality } from '@angular/cdk/bidi';
import { Directive, computed, inject } from '@angular/core';
import { BrnProgressIndicator, injectBrnProgress } from '@spartan-ng/brain/progress';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
  selector: '[hlmProgressIndicator],hlm-progress-indicator',
  hostDirectives: [BrnProgressIndicator],
  host: {
    'data-slot': 'progress-indicator',
    '[class.animate-indeterminate]': '_indeterminate()',
    '[style.transform]': '_transform()',
  },
})
export class HlmProgressIndicator {
  private readonly _progress = injectBrnProgress();
  private readonly _dir = inject(Directionality);
  // Offset the indicator by the unfilled remainder. In RTL the bar fills from the inline-start
  // (visually the right), so translate the opposite way to keep the fill on the correct side.
  protected readonly _transform = computed(() => {
    // En porcentaje del máximo: con max distinto de 100 (332 de 500) el valor crudo daba un translate inválido y la barra se veía llena.
    const max = this._progress.max() || 100;
    const offset = 100 - Math.min(100, Math.max(0, ((this._progress.value() ?? max) / max) * 100));
    return `translateX(${this._dir.valueSignal() === 'rtl' ? '' : '-'}${offset}%)`;
  });
  protected readonly _indeterminate = computed(
    () => this._progress.value() === null || this._progress.value() === undefined,
  );

  constructor() {
    classes(() => 'h-full w-full flex-1 rounded-full bg-[var(--zc-bar,var(--text))] transition-transform duration-300 ease-(--ease)');
  }
}
