import { ChangeDetectionStrategy, Component, forwardRef, input, linkedSignal, model } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HlmSwitch } from '@zonacards/ui/helm';

let seq = 0;

/**
 * <zc-switch [(checked)]="x" description="…">Alertas de stock</zc-switch> · sobre spartan switch.
 * Activa algo de inmediato (sin botón Guardar). Toda la fila es clicable; Espacio alterna. sm para filas densas.
 */
@Component({
  selector: 'zc-switch',
  imports: [HlmSwitch],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SwitchComponent), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0' },
  template: `
    <label class="flex min-w-0 flex-1 cursor-pointer items-center leading-5" [class]="size() === 'sm' ? 'min-h-target-sm gap-2 text-sm' : 'min-h-target gap-3'"
      [class.opacity-50]="isDisabled()" [class.cursor-not-allowed]="isDisabled()" (focusout)="onTouched()">
      <hlm-switch [inputId]="inputId" [checked]="checked()" [disabled]="isDisabled()" [size]="size() === 'sm' ? 'sm' : 'default'" (checkedChange)="toggle($event)" />
      <span class="grid min-w-0 gap-0.5">
        <span class="break-words"><ng-content /></span>
        @if (description()) { <span class="text-[13px] text-muted">{{ description() }}</span> }
      </span>
    </label>`,
})
export class SwitchComponent implements ControlValueAccessor {
  readonly checked = model(false);
  readonly description = input('');
  readonly disabled = input(false);
  readonly size = input<'md' | 'sm'>('md');
  readonly isDisabled = linkedSignal(this.disabled);
  /** Sin id propio, spartan nombra todas las etiquetas "null-label" y cada switch toma el nombre del primero. */
  readonly inputId = `zc-sw-${++seq}`;

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
