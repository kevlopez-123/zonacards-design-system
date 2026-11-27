import { ChangeDetectionStrategy, Component, computed, forwardRef, input, linkedSignal, model } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CheckboxComponent } from './checkbox.component';

let seq = 0;

/** Una opción de `<zc-checkbox-group>`. */
export interface CheckboxOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

/**
 * <zc-checkbox-group label="Canales de aviso" [options]="canales" [(value)]="elegidos" hint="Elige al menos uno." />
 * Varias casillas con una sola etiqueta: el grupo se anuncia ("Canales de aviso, grupo") y la ayuda o el error quedan enlazados.
 * `value` es la lista de valores marcados. Con `selectAllLabel` agrega arriba "Seleccionar todo", que queda a medias cuando hay algunas marcadas.
 * Funciona con [(value)] o con formularios reactivos (formControl con `string[]`).
 */
@Component({
  selector: 'zc-checkbox-group',
  imports: [CheckboxComponent],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CheckboxGroupComponent), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  template: `
    <div role="group" class="grid min-w-0 content-start gap-4" [attr.aria-labelledby]="labelId" [attr.aria-describedby]="describedBy()"
      [attr.aria-invalid]="error() ? true : null" [attr.aria-required]="required() || null">
      <span [id]="labelId" class="text-sm font-medium leading-5">{{ label() }}@if (required()) {<span class="text-danger" aria-hidden="true"> *</span>}</span>
      @if (selectAllLabel()) {
        <zc-checkbox [checked]="allOn()" [indeterminate]="someOn()" [disabled]="isDisabled()" (checkedChange)="toggleAll($event)">{{ selectAllLabel() }}</zc-checkbox>
      }
      <div [class]="layout()">
        @for (o of options(); track o.value) {
          <zc-checkbox [checked]="isOn(o.value)" [description]="o.description ?? ''" [disabled]="isDisabled() || !!o.disabled" [invalid]="!!error()"
            (checkedChange)="toggle(o.value, $event)" (focusout)="onTouched()">{{ o.label }}</zc-checkbox>
        }
      </div>
      @if (error()) { <p [id]="messageId" class="m-0 text-caption leading-5 text-danger" aria-live="polite">{{ error() }}</p> }
      @else if (hint()) { <p [id]="messageId" class="m-0 text-caption leading-5 text-muted">{{ hint() }}</p> }
    </div>`,
})
export class CheckboxGroupComponent implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly options = input<readonly CheckboxOption[]>([]);
  readonly value = model<readonly string[]>([]);
  readonly hint = input('');
  readonly error = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');
  /** Texto de "Seleccionar todo" (sin él no hay casilla padre). */
  readonly selectAllLabel = input('');

  readonly isDisabled = linkedSignal(this.disabled);
  readonly labelId = `zc-cg-${++seq}`;
  readonly messageId = `${this.labelId}-m`;
  readonly describedBy = computed(() => (this.error() || this.hint() ? this.messageId : null));
  readonly layout = computed(() => (this.orientation() === 'horizontal' ? 'flex min-w-0 flex-wrap gap-x-6' : 'grid min-w-0 content-start gap-4'));

  /** Las opciones que se pueden cambiar (las deshabilitadas no cuentan para "todo"). */
  private readonly enabled = computed(() => this.options().filter(o => !o.disabled));
  readonly allOn = computed(() => this.enabled().length > 0 && this.enabled().every(o => this.value().includes(o.value)));
  readonly someOn = computed(() => !this.allOn() && this.enabled().some(o => this.value().includes(o.value)));

  private onChange: (v: string[]) => void = () => {};
  onTouched: () => void = () => {};

  isOn(v: string) { return this.value().includes(v); }

  toggle(v: string, on: boolean) {
    this.set(on ? [...this.value().filter(x => x !== v), v] : this.value().filter(x => x !== v));
  }

  toggleAll(on: boolean) {
    const enabled = this.enabled().map(o => o.value);
    // Lo que está marcado y deshabilitado se conserva: "todo" no lo puede cambiar.
    const keep = this.value().filter(v => !enabled.includes(v));
    this.set(on ? [...keep, ...enabled] : keep);
  }

  private set(v: string[]) { this.value.set(v); this.onChange(v); }

  writeValue(v: readonly string[] | null) { this.value.set(v ?? []); }
  registerOnChange(fn: (v: string[]) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(disabled: boolean) { this.isDisabled.set(disabled); }
}
