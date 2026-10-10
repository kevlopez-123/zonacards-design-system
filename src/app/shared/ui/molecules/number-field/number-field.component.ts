import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, input, linkedSignal, model } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { IconComponent } from '../../atoms/icon/icon.component';
import { BARE_INPUT, CONTROL_BOX } from '../../viewport';
import { FieldComponent } from '../field/field.component';
import { rejectsInput } from '../input-filter';

/**
 * <zc-number-field [min]="1" [max]="10000"> · cantidades enteras.
 * −/+ y flechas arriba/abajo cambian de a `step`; con Shift, de a 100 × step. Rechaza lo que no es dígito,
 * ajusta al rango al salir y deshabilita −/+ en los límites. Se anuncia como spinbutton con su valor.
 */
@Component({
  selector: 'zc-number-field',
  imports: [IconComponent, TranslocoPipe],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NumberFieldComponent), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0' },
  template: `
    <div [class]="box" [attr.data-invalid]="invalidState()" [attr.data-disabled]="isDisabled()">
      <button type="button" [class]="stepBtn + ' rounded-l-sm border-r'" [attr.aria-label]="'ui.disminuir' | transloco" [disabled]="isDisabled() || atMin()"
        (click)="bump(-1, $event)" tabindex="-1"><zc-icon name="l:minus" [size]="16" /></button>
      <input [class]="input" type="text" role="spinbutton" inputmode="numeric" autocomplete="off" [id]="field?.controlId"
        [attr.aria-describedby]="field?.messageId" [attr.aria-invalid]="invalidState() || null" [attr.aria-required]="field?.required() || null"
        [attr.aria-valuemin]="min()" [attr.aria-valuemax]="max()" [attr.aria-valuenow]="value()" [disabled]="isDisabled()" [value]="value() ?? ''"
        (beforeinput)="onBeforeInput($event)" (input)="onInput($event)" (keydown)="onKey($event)" (blur)="onBlur()" />
      <button type="button" [class]="stepBtn + ' rounded-r-sm border-l'" [attr.aria-label]="'ui.aumentar' | transloco" [disabled]="isDisabled() || atMax()"
        (click)="bump(1, $event)" tabindex="-1"><zc-icon name="l:plus" [size]="16" /></button>
    </div>`,
})
export class NumberFieldComponent implements ControlValueAccessor {
  readonly min = input(0);
  readonly max = input(Number.MAX_SAFE_INTEGER);
  readonly step = input(1);
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly value = model<number | null>(null);

  readonly field = inject(FieldComponent, { optional: true });
  private readonly i18n = inject(TranslocoService);
  readonly box = CONTROL_BOX + ' overflow-hidden';
  readonly input = BARE_INPUT + ' num px-2 text-center';
  readonly stepBtn = 'grid h-full w-target shrink-0 cursor-pointer place-items-center border-border text-fg transition hover:enabled:bg-surface-2 disabled:cursor-not-allowed disabled:text-subtle';
  readonly isDisabled = linkedSignal(this.disabled);
  readonly invalidState = computed(() => this.invalid() || !!this.field?.invalid());
  readonly atMin = computed(() => (this.value() ?? this.min()) <= this.min());
  readonly atMax = computed(() => (this.value() ?? this.min()) >= this.max());

  private onChange: (v: number | null) => void = () => {};
  private onTouchedFn: () => void = () => {};

  private clamp(n: number) { return Math.max(this.min(), Math.min(this.max(), n)); }

  bump(dir: 1 | -1, e?: { shiftKey: boolean }) {
    const delta = this.step() * (e?.shiftKey ? 100 : 1) * dir;
    this.set(this.clamp((this.value() ?? this.min()) + delta));
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); this.bump(e.key === 'ArrowUp' ? 1 : -1, e); }
    else if (e.key === 'Home') { e.preventDefault(); this.set(this.min()); }
    else if (e.key === 'End' && this.max() < Number.MAX_SAFE_INTEGER) { e.preventDefault(); this.set(this.max()); }
  }

  onBeforeInput(e: InputEvent) {
    if (rejectsInput(e, /\d/)) this.field?.flash(this.i18n.translate('ui.soloEnteros'));
  }

  onInput(e: Event) {
    const el = e.target as HTMLInputElement;
    const d = el.value.replace(/\D/g, '');
    if (el.value !== d) el.value = d;
    this.set(d ? +d : null);
  }

  /** Al salir se ajusta al rango: nunca queda un valor imposible. */
  onBlur() {
    const v = this.value();
    if (v !== null && this.clamp(v) !== v) this.set(this.clamp(v));
    this.onTouchedFn();
  }

  private set(v: number | null) { this.value.set(v); this.onChange(v); }

  writeValue(v: number | null) { this.value.set(v ?? null); }
  registerOnChange(fn: (v: number | null) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouchedFn = fn; }
  setDisabledState(d: boolean) { this.isDisabled.set(d); }
}
