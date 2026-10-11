import { ChangeDetectionStrategy, Component, forwardRef, input, linkedSignal, model } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';

let seq = 0;

/**
 * <zc-checkbox [(checked)]="x" description="…">Etiqueta</zc-checkbox> · sobre spartan checkbox.
 * Toda la fila es clicable (48 px, 56 px en táctil); Espacio alterna. Indeterminado para "Seleccionar todo".
 * Funciona con [(checked)] o con formularios reactivos (formControl).
 */
@Component({
  selector: 'zc-checkbox',
  imports: [HlmCheckbox],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CheckboxComponent), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0' },
  template: `
    <label class="flex min-w-0 flex-1 cursor-pointer items-center gap-3 leading-5 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50"
      [class.min-h-target]="!ariaLabel()" [class.min-h-8]="!!ariaLabel()" (focusout)="onTouched()">
      <hlm-checkbox [inputId]="inputId" [checked]="checked()" [(indeterminate)]="indeterminate" [disabled]="isDisabled()" [name]="name()" [forceInvalid]="invalid()"
        [aria-label]="ariaLabel() || null" (checkedChange)="toggle($event)" />
      <span class="grid min-w-0 gap-0.5">
        <span class="break-words"><ng-content /></span>
        @if (description()) { <span class="text-[13px] text-muted">{{ description() }}</span> }
      </span>
    </label>`,
})
export class CheckboxComponent implements ControlValueAccessor {
  readonly checked = model(false);
  readonly indeterminate = model(false);
  readonly description = input('');
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly name = input<string | null>(null);
  /** Sin texto visible (celdas de tabla): nombre accesible y fila compacta de 32 px. */
  readonly ariaLabel = input('');
  readonly isDisabled = linkedSignal(this.disabled);
  /** Sin id propio, spartan nombra todas las etiquetas "null-label" y cada checkbox toma el nombre del primero. */
  readonly inputId = `zc-cb-${++seq}`;

  private onChange: (v: boolean) => void = () => {};
  onTouched: () => void = () => {};

  toggle(value: boolean) {
    this.checked.set(value);
    this.onChange(value);
  }

  writeValue(value: boolean | null) { this.checked.set(!!value); }
  registerOnChange(fn: (v: boolean) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(disabled: boolean) { this.isDisabled.set(disabled); }
}
