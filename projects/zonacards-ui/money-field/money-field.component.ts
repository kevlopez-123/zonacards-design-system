import { ChangeDetectionStrategy, Component, computed, effect, forwardRef, inject, input, linkedSignal, model, signal, untracked } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { countryByCode, CountryCode, currencySymbol, MoneyDisplay } from '@zonacards/ui/core';
import { BARE_INPUT, CONTROL_BOX } from '@zonacards/ui/core';
import { FieldComponent } from '@zonacards/ui/field';
import { rejectsInput } from '@zonacards/ui/core';


/**
 * <zc-money-field [country]="'pe'"> · símbolo a la izquierda y código de moneda a la derecha.
 * Acepta dígitos y un separador decimal (punto o coma) con los decimales de la moneda (0 en CLP y COP);
 * al salir muestra la cifra con separadores del país. Valor: número o null.
 * Validar con zcValidators.amount({ country, min, max }).
 */
@Component({
  selector: 'zc-money-field',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MoneyFieldComponent), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0' },
  template: `
    <div [class]="box" [attr.data-invalid]="invalidState()" [attr.data-disabled]="isDisabled()">
      <span class="shrink-0 pl-4 text-muted num" aria-hidden="true">{{ symbol() }}</span>
      <input [class]="input" type="text" inputmode="decimal" autocomplete="off" [id]="field?.controlId"
        [attr.aria-describedby]="field?.messageId" [attr.aria-invalid]="invalidState() || null" [attr.aria-required]="field?.required() || null"
        [placeholder]="placeholder()" [disabled]="isDisabled()" [value]="text()"
        (beforeinput)="onBeforeInput($event)" (input)="onInput($event)" (focus)="onFocus()" (blur)="onBlur()" />
      <span class="shrink-0 pr-4 text-[13px] font-medium text-muted num">{{ currency() }}</span>
    </div>`,
})
export class MoneyFieldComponent implements ControlValueAccessor {
  readonly country = input.required<CountryCode>();
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly value = model<number | null>(null);

  readonly field = inject(FieldComponent, { optional: true });
  private readonly i18n = inject(TranslocoService);
  readonly box = CONTROL_BOX + ' overflow-hidden';
  readonly input = BARE_INPUT + ' num px-2';
  /** Prefijo de la moneda: 'auto' escribe el código cuando el símbolo sería "$" ("CLP"); "S/" y "Bs" quedan igual. */
  readonly display = input<MoneyDisplay>('auto');
  readonly symbol = computed(() => currencySymbol(this.country(), { display: this.display() }));
  readonly currency = computed(() => countryByCode(this.country()).currency);
  readonly decimals = computed(() => countryByCode(this.country()).decimals);
  readonly placeholder = computed(() => (this.decimals() ? '0.' + '0'.repeat(this.decimals()) : '0'));
  readonly isDisabled = linkedSignal(this.disabled);
  readonly invalidState = computed(() => this.invalid() || !!this.field?.invalid());
  /** Texto mientras se edita (sin separadores de miles); null fuera de edición. */
  private readonly draft = signal<string | null>(null);
  /** Texto visible: crudo mientras se edita, con formato del país al salir. */
  readonly text = computed(() => { const d = this.draft(); const v = this.value(); return d ?? (v === null ? '' : this.format(v)); });

  private onChange: (v: number | null) => void = () => {};
  private onTouchedFn: () => void = () => {};

  constructor() {
    let first = true;
    // Otra moneda: el monto anterior no aplica (decimales y escala distintos).
    effect(() => { this.country(); if (first) { first = false; return; } untracked(() => { if (this.draft() !== null) this.draft.set(''); if (this.value() !== null) this.set(null); }); });
  }

  private format(n: number) {
    return new Intl.NumberFormat(countryByCode(this.country()).locale, { minimumFractionDigits: this.decimals(), maximumFractionDigits: this.decimals() }).format(n);
  }

  onBeforeInput(e: InputEvent) {
    if (rejectsInput(e, /[\d.,]/)) this.field?.flash(this.i18n.translate('ui.soloMonto'));
  }

  onInput(e: Event) {
    const el = e.target as HTMLInputElement;
    let v = el.value.replace(/,/g, '.').replace(/[^\d.]/g, '');
    const [int, ...rest] = v.split('.');
    const dec = this.decimals();
    v = dec === 0 ? int : rest.length ? `${int}.${rest.join('').slice(0, dec)}` : int;
    if (el.value !== v) el.value = v;
    this.draft.set(v);
    this.set(v && v !== '.' ? Number(v) : null);
  }

  onFocus() { const v = this.value(); this.draft.set(v === null ? '' : String(v)); }

  onBlur() { this.draft.set(null); this.onTouchedFn(); }

  private set(v: number | null) { this.value.set(v); this.onChange(v); }

  writeValue(v: number | null) { this.value.set(v ?? null); }
  registerOnChange(fn: (v: number | null) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouchedFn = fn; }
  setDisabledState(d: boolean) { this.isDisabled.set(d); }
}
