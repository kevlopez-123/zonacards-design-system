import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { injectTranslate } from '@zonacards/ui/core';
import { FieldComponent } from '@zonacards/ui/field';

/** Pulgar y pista de los input range nativos (pseudoelementos: no hay utilidades de Tailwind para ellos). */
const RANGE_STYLES = `
  input[type=range] { position:absolute; inset-inline:0; width:100%; height:var(--target); margin:0; background:transparent; appearance:none; -webkit-appearance:none; pointer-events:none; }
  input[type=range]:focus { outline:none; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; pointer-events:auto; width:24px; height:24px; border-radius:50%; background:var(--surface); border:2px solid var(--primary); box-shadow:0 1px 3px rgb(0 0 0 / .2); cursor:grab; }
  input[type=range]::-moz-range-thumb { pointer-events:auto; width:22px; height:22px; border-radius:50%; background:var(--surface); border:2px solid var(--primary); cursor:grab; }
  input[type=range]:focus-visible::-webkit-slider-thumb { outline:2px solid var(--focus); outline-offset:2px; }
  input[type=range]:focus-visible::-moz-range-thumb { outline:2px solid var(--focus); outline-offset:2px; }
  input[type=range]:disabled::-webkit-slider-thumb { cursor:not-allowed; border-color:var(--border-strong); }
`;

const pct = (v: number, min: number, max: number) => ((v - min) / (max - min || 1)) * 100;

/**
 * <zc-field label="Comisión del cliente" hint="0 %" [counter]="texto"><zc-slider [(value)]="x" [min]="0" [max]="15" [step]="0.5" [format]="fmt" /></zc-field>
 * Slider de un valor sobre input range nativo (flechas, Inicio/Fin, Re Pág/Av Pág). format da el texto que se anuncia y se muestra.
 */
@Component({
  selector: 'zc-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative flex h-target min-w-0 items-center', '[class.opacity-45]': 'disabled()' },
  styles: RANGE_STYLES,
  template: `
    <span class="absolute inset-x-0 h-1.5 rounded-full bg-surface-3" aria-hidden="true"></span>
    <span class="absolute h-1.5 rounded-full bg-primary" [style.left.%]="0" [style.width.%]="fill()" aria-hidden="true"></span>
    <input type="range" [id]="field?.controlId" [attr.aria-describedby]="field?.messageId" [attr.aria-label]="ariaLabel() || null"
      [min]="min()" [max]="max()" [step]="step()" [value]="value()" [disabled]="disabled()" [attr.aria-valuetext]="text()"
      (input)="value.set(+$any($event.target).value)" />`,
})
export class SliderComponent {
  readonly field = inject(FieldComponent, { optional: true });
  readonly value = model(0);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly disabled = input(false);
  readonly ariaLabel = input('');
  /** Texto del valor ("4,5 %"); por defecto, el número. */
  readonly format = input<(v: number) => string>(v => String(v));
  readonly fill = computed(() => pct(this.value(), this.min(), this.max()));
  readonly text = computed(() => this.format()(this.value()));
}

/**
 * <zc-field label="Rango de monto" [counter]="…"><zc-range-slider [(value)]="[50, 500]" [min]="0" [max]="1000" [step]="10" [minGap]="10" /></zc-field>
 * Dos pulgares que no se cruzan (minGap de separación mínima). Cada uno se anuncia como "Monto mínimo" y "Monto máximo".
 */
@Component({
  selector: 'zc-range-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative flex h-target min-w-0 items-center', role: 'group', '[attr.aria-labelledby]': 'field?.labelId', '[class.opacity-45]': 'disabled()' },
  styles: RANGE_STYLES,
  template: `
    <span class="absolute inset-x-0 h-1.5 rounded-full bg-surface-3" aria-hidden="true"></span>
    <span class="absolute h-1.5 rounded-full bg-primary" [style.left.%]="from()" [style.width.%]="to() - from()" aria-hidden="true"></span>
    <input type="range" [id]="field?.controlId" [attr.aria-describedby]="field?.messageId" [attr.aria-label]="minLabel() || t('mol.slider.minimo')"
      [min]="min()" [max]="max()" [step]="step()" [value]="value()[0]" [disabled]="disabled()" [attr.aria-valuetext]="format()(value()[0])"
      (input)="set(0, $event)" />
    <input type="range" [attr.aria-describedby]="field?.messageId" [attr.aria-label]="maxLabel() || t('mol.slider.maximo')"
      [min]="min()" [max]="max()" [step]="step()" [value]="value()[1]" [disabled]="disabled()" [attr.aria-valuetext]="format()(value()[1])"
      (input)="set(1, $event)" />`,
})
export class RangeSliderComponent {
  readonly field = inject(FieldComponent, { optional: true });
  readonly t = injectTranslate();
  readonly value = model<[number, number]>([0, 100]);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  /** Separación mínima entre los dos valores. */
  readonly minGap = input(0);
  readonly disabled = input(false);
  readonly minLabel = input('');
  readonly maxLabel = input('');
  readonly format = input<(v: number) => string>(v => String(v));
  readonly from = computed(() => pct(this.value()[0], this.min(), this.max()));
  readonly to = computed(() => pct(this.value()[1], this.min(), this.max()));

  set(i: 0 | 1, e: Event) {
    const el = e.target as HTMLInputElement;
    let [a, b] = this.value(); const v = +el.value; const gap = this.minGap();
    if (i === 0) a = Math.min(v, b - gap); else b = Math.max(v, a + gap);
    el.value = String(i === 0 ? a : b); // el pulgar no pasa al otro
    this.value.set([a, b]);
  }
}
