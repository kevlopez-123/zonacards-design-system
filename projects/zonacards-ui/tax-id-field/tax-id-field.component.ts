import { ChangeDetectionStrategy, Component, computed, effect, forwardRef, inject, input, linkedSignal, model, untracked } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { countryByCode, CountryCode } from '@zonacards/ui/core';
import { TAX_ID_RULES } from '@zonacards/ui/core';
import { BARE_INPUT, CONTROL_BOX } from '@zonacards/ui/core';
import { FieldComponent } from '@zonacards/ui/field';
import { rejectsInput } from '@zonacards/ui/core';

/** Qué acepta cada documento, para el aviso al rechazar un carácter. */
const REJECT: Partial<Record<CountryCode, string>> = { co: 'ui.soloNumerosGuion', cl: 'ui.soloNumerosKGuion', mx: 'ui.soloLetrasNumeros' };

/**
 * <zc-tax-id-field [country]="'pe'"> · RUC, NIT, RUT o RFC según el país.
 * Rechaza los caracteres que el país no usa mientras se escribe y da formato al salir (guion del verificador, mayúsculas).
 * Al cambiar de país se vacía. Validar con zcValidators.taxId(país): incluye el dígito verificador.
 */
@Component({
  selector: 'zc-tax-id-field',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TaxIdFieldComponent), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0' },
  template: `
    <div [class]="box" [attr.data-invalid]="invalidState()" [attr.data-disabled]="isDisabled()">
      <span class="grid h-full shrink-0 place-items-center border-r border-border px-3 text-body-sm font-medium text-muted" aria-hidden="true">{{ type() }}</span>
      <input [class]="input" type="text" autocomplete="off" spellcheck="false" [id]="field?.controlId"
        [attr.aria-describedby]="field?.messageId" [attr.aria-invalid]="invalidState() || null" [attr.aria-required]="field?.required() || null"
        [attr.inputmode]="rule().inputMode" [attr.maxlength]="rule().maxLength" [disabled]="isDisabled()" [value]="value()"
        (beforeinput)="onBeforeInput($event)" (input)="onInput($event)" (blur)="onBlur($event)" />
    </div>`,
})
export class TaxIdFieldComponent implements ControlValueAccessor {
  readonly country = input.required<CountryCode>();
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly value = model('');

  readonly field = inject(FieldComponent, { optional: true });
  private readonly i18n = inject(TranslocoService);
  readonly box = CONTROL_BOX + ' overflow-hidden';
  readonly input = BARE_INPUT + ' num uppercase';
  readonly rule = computed(() => TAX_ID_RULES[this.country()]);
  readonly type = computed(() => countryByCode(this.country()).taxId);
  readonly isDisabled = linkedSignal(this.disabled);
  readonly invalidState = computed(() => this.invalid() || !!this.field?.invalid());

  private onChange: (v: string) => void = () => {};
  private onTouchedFn: () => void = () => {};

  constructor() {
    // Otro país, otro documento: el valor anterior ya no aplica.
    let first = true;
    effect(() => { this.country(); if (first) { first = false; return; } untracked(() => { if (this.value()) this.set(''); }); });
  }

  onBeforeInput(e: InputEvent) {
    if (rejectsInput(e, this.rule().allowed)) this.field?.flash(this.i18n.translate(REJECT[this.country()] ?? 'ui.soloNumeros'));
  }

  onInput(e: Event) {
    const el = e.target as HTMLInputElement;
    const clean = [...el.value].filter(ch => this.rule().allowed.test(ch)).join('').slice(0, this.rule().maxLength);
    const v = this.country() === 'mx' || this.country() === 'cl' ? clean.toUpperCase() : clean;
    if (el.value !== v) el.value = v;
    this.set(v);
  }

  onBlur(e: Event) {
    const v = this.value();
    const n = v ? this.rule().normalize(v) : v;
    if (n !== v) { (e.target as HTMLInputElement).value = n; this.set(n); }
    this.onTouchedFn();
  }

  private set(v: string) { this.value.set(v); this.onChange(v); }

  writeValue(v: string | null) { this.value.set(v ?? ''); }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouchedFn = fn; }
  setDisabledState(d: boolean) { this.isDisabled.set(d); }
}
