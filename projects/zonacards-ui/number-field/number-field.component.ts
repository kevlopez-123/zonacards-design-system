import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, input, linkedSignal, model } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { IconComponent } from '@zonacards/ui/icon';
import { BARE_INPUT, CONTROL_BOX } from '@zonacards/ui/core';
import { FieldComponent } from '@zonacards/ui/field';
import { rejectsInput } from '@zonacards/ui/core';

/**
 * <zc-number-field [min]="1" [max]="10000"> · cantidades enteras; con [decimals]="2" y suffix="%", tasas y porcentajes.
 * −/+ y flechas arriba/abajo cambian de a `step`; con Shift, de a 100 × step. Rechaza lo que no es número (con decimales acepta
 * coma o punto y muestra el separador del idioma), ajusta al rango y redondea al salir, y deshabilita −/+ en los límites.
 * Se anuncia como spinbutton con su valor.
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
      <input [class]="input" type="text" role="spinbutton" [attr.inputmode]="decimals() ? 'decimal' : 'numeric'" autocomplete="off" [id]="field?.controlId"
        [attr.aria-label]="ariaLabel() || null" [attr.aria-describedby]="field?.messageId" [attr.aria-invalid]="invalidState() || null" [attr.aria-required]="field?.required() || null"
        [attr.aria-valuemin]="min()" [attr.aria-valuemax]="max()" [attr.aria-valuenow]="value()" [attr.aria-valuetext]="value() !== null && suffix() ? text() + ' ' + suffix() : null" [disabled]="isDisabled()" [value]="text()"
        (beforeinput)="onBeforeInput($event)" (input)="onInput($event)" (keydown)="onKey($event)" (blur)="onBlur()" />
      @if (suffix()) { <span class="shrink-0 pr-2 text-muted" aria-hidden="true">{{ suffix() }}</span> }
      <button type="button" [class]="stepBtn + ' rounded-r-sm border-l'" [attr.aria-label]="'ui.aumentar' | transloco" [disabled]="isDisabled() || atMax()"
        (click)="bump(1, $event)" tabindex="-1"><zc-icon name="l:plus" [size]="16" /></button>
    </div>`,
})
export class NumberFieldComponent implements ControlValueAccessor {
  readonly min = input(0);
  readonly max = input(Number.MAX_SAFE_INTEGER);
  readonly step = input(1);
  /** Decimales permitidos (0 = enteros). */
  readonly decimals = input(0);
  /** Unidad después del número ("%", "días"); se anuncia con el valor. */
  readonly suffix = input('');
  readonly disabled = input(false);
  readonly invalid = input(false);
  /** Nombre sin zc-field (celda de una tabla editable: "Cantidad de la fila 2"). */
  readonly ariaLabel = input('');
  readonly value = model<number | null>(null);

  readonly field = inject(FieldComponent, { optional: true });
  private readonly i18n = inject(TranslocoService);
  readonly box = CONTROL_BOX + ' overflow-hidden';
  readonly input = BARE_INPUT + ' num px-2 text-center';
  readonly stepBtn = 'grid h-full w-target shrink-0 cursor-pointer place-items-center border-border text-fg transition hover:enabled:bg-surface-2 disabled:cursor-not-allowed disabled:text-subtle';
  readonly isDisabled = linkedSignal(this.disabled);
  readonly invalidState = computed(() => this.invalid() || !!this.field?.invalid());
  /** Separador decimal del idioma (es: coma, en: punto). */
  private readonly sep = computed(() => (this.i18n.getActiveLang() === 'en' ? '.' : ','));
  /** Texto del campo: lo que se escribe mientras se edita; al salir, el valor con sus decimales. */
  readonly text = linkedSignal(() => this.format(this.value()));
  readonly atMin = computed(() => (this.value() ?? this.min()) <= this.min());
  readonly atMax = computed(() => (this.value() ?? this.min()) >= this.max());

  private onChange: (v: number | null) => void = () => {};
  private onTouchedFn: () => void = () => {};

  private clamp(n: number) { return Math.max(this.min(), Math.min(this.max(), n)); }
  private round(n: number) { const k = 10 ** this.decimals(); return Math.round(n * k) / k; }
  private format(v: number | null) { return v === null ? '' : this.decimals() ? v.toFixed(this.decimals()).replace('.', this.sep()) : String(v); }

  bump(dir: 1 | -1, e?: { shiftKey: boolean }) {
    const delta = this.step() * (e?.shiftKey ? 100 : 1) * dir;
    this.set(this.round(this.clamp((this.value() ?? this.min()) + delta)));
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); this.bump(e.key === 'ArrowUp' ? 1 : -1, e); }
    else if (e.key === 'Home') { e.preventDefault(); this.set(this.min()); }
    else if (e.key === 'End' && this.max() < Number.MAX_SAFE_INTEGER) { e.preventDefault(); this.set(this.max()); }
  }

  onBeforeInput(e: InputEvent) {
    if (rejectsInput(e, this.decimals() ? /[\d.,]/ : /\d/)) this.field?.flash(this.i18n.translate(this.decimals() ? 'ui.soloNumeros' : 'ui.soloEnteros'));
  }

  onInput(e: Event) {
    const el = e.target as HTMLInputElement;
    let d = el.value.replace(/\D/g, '');
    if (this.decimals()) {
      // Un solo separador (coma o punto) y como máximo los decimales permitidos.
      const [int, ...rest] = el.value.replace(/[^\d.,]/g, '').replace('.', ',').split(',');
      d = rest.length ? int + this.sep() + rest.join('').replace(/\D/g, '').slice(0, this.decimals()) : int;
    }
    if (el.value !== d) el.value = d;
    const n = d.replace(',', '.').replace(/\.$/, '');
    this.value.set(n && n !== '.' ? +n : null);
    // Después del valor: text es un linkedSignal del valor y se reescribiría con el formato ("1," → "1,00") mientras se escribe.
    this.text.set(d);
    this.onChange(this.value());
  }

  /** Al salir se ajusta al rango: nunca queda un valor imposible. */
  onBlur() {
    const v = this.value();
    if (v !== null && this.round(this.clamp(v)) !== v) this.set(this.round(this.clamp(v)));
    this.text.set(this.format(this.value()));
    this.onTouchedFn();
  }

  private set(v: number | null) { this.value.set(v); this.text.set(this.format(v)); this.onChange(v); }

  writeValue(v: number | null) { this.value.set(v ?? null); this.text.set(this.format(v ?? null)); }
  registerOnChange(fn: (v: number | null) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouchedFn = fn; }
  setDisabledState(d: boolean) { this.isDisabled.set(d); }
}
