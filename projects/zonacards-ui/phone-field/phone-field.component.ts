import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, input, linkedSignal, model } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { DIAL_COUNTRIES, dialCountry, isScopeCountry } from '@zonacards/ui/core';
import { formatPhone, phoneDigits } from '@zonacards/ui/core';
import { PhoneValue } from '@zonacards/ui/core';
import { injectTranslate } from '@zonacards/ui/core';
import { BARE_INPUT, CONTROL_BOX } from '@zonacards/ui/core';
import { FieldComponent } from '@zonacards/ui/field';
import { rejectsInput } from '@zonacards/ui/core';
import { ZcOption } from '@zonacards/ui/listbox';
import { SelectComponent } from '@zonacards/ui/select';

const OPTIONS: ZcOption<string>[] = DIAL_COUNTRIES.map((c, i) => ({
  value: c.code, label: c.name, meta: c.dial, flag: c.code, keywords: c.dial.replace('+', ''),
  separatorBefore: i > 0 && !isScopeCountry(c.code) && isScopeCountry(DIAL_COUNTRIES[i - 1].code),
}));

/**
 * <zc-phone-field> · bandera + prefijo + número. Solo dígitos, largo por país y grupos de 3 ("987 654 321").
 * El prefijo es un combobox con búsqueda por país o prefijo; los 6 países del alcance van primero.
 * Valor: { country: 'pe', number: '987654321' } (solo dígitos). Validar con zcValidators.phone().
 */
@Component({
  selector: 'zc-phone-field',
  imports: [SelectComponent, TranslocoPipe],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneFieldComponent), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0' },
  template: `
    <div data-zc-control [class]="box" [attr.data-invalid]="invalidState()" [attr.data-disabled]="isDisabled()">
      <zc-select class="h-full shrink-0" appearance="inline" [compact]="true" [fieldLink]="false" [options]="options" [searchable]="true"
        [searchPlaceholder]="'ui.paisOPrefijo' | transloco" [ariaLabel]="countryLabel()" [disabled]="isDisabled()"
        [value]="value().country" (valueChange)="setCountry($any($event))" />
      <input [class]="input" type="tel" inputmode="numeric" autocomplete="tel-national" [id]="field?.controlId"
        [attr.aria-describedby]="field?.messageId" [attr.aria-invalid]="invalidState() || null" [attr.aria-required]="field?.required() || null"
        [placeholder]="placeholder()" [attr.maxlength]="maxLength()" [disabled]="isDisabled()" [value]="formatted()"
        (beforeinput)="onBeforeInput($event)" (input)="onInput($event)" (blur)="onTouched()" />
    </div>`,
})
export class PhoneFieldComponent implements ControlValueAccessor {
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly value = model<PhoneValue>({ country: 'pe', number: '' });

  readonly field = inject(FieldComponent, { optional: true });
  private readonly i18n = inject(TranslocoService);
  readonly options = OPTIONS;
  readonly box = CONTROL_BOX + ' overflow-hidden';
  readonly input = BARE_INPUT + ' num';
  readonly isDisabled = linkedSignal(this.disabled);
  readonly invalidState = computed(() => this.invalid() || !!this.field?.invalid());
  readonly country = computed(() => dialCountry(this.value().country));
  readonly formatted = computed(() => formatPhone(this.value().number));
  readonly placeholder = computed(() => formatPhone('9'.repeat(this.country().phoneDigits)));
  readonly maxLength = computed(() => { const n = this.country().phoneDigits; return n + Math.floor((n - 1) / 3); });
  private readonly t = injectTranslate();
  readonly countryLabel = computed(() => this.t('ui.codigoPais', { pais: this.country().name, dial: this.country().dial }));

  private onChange: (v: PhoneValue) => void = () => {};
  onTouched: () => void = () => {};

  setCountry(code: string) {
    this.set({ country: code, number: phoneDigits(this.value().number, code) });
  }

  onBeforeInput(e: InputEvent) {
    if (rejectsInput(e, /[\d\s]/)) this.field?.flash(this.i18n.translate('ui.soloNumeros'));
  }

  onInput(e: Event) {
    const el = e.target as HTMLInputElement;
    const digits = phoneDigits(el.value, this.value().country);
    this.set({ ...this.value(), number: digits });
    el.value = formatPhone(digits);
  }

  private set(v: PhoneValue) { this.value.set(v); this.onChange(v); }

  writeValue(v: PhoneValue | null) { this.value.set(v ?? { country: this.value().country, number: '' }); }
  registerOnChange(fn: (v: PhoneValue) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(d: boolean) { this.isDisabled.set(d); }
}
