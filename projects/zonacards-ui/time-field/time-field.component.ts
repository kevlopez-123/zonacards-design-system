import { ChangeDetectionStrategy, Component, ElementRef, TemplateRef, computed, forwardRef, inject, input, linkedSignal, model, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { maskHm, timeSlots } from '@zonacards/ui/core';
import { IconComponent } from '@zonacards/ui/icon';
import { BARE_INPUT, CONTROL_BOX, INLINE_BTN } from '@zonacards/ui/core';
import { FieldComponent } from '@zonacards/ui/field';
import { rejectsInput } from '@zonacards/ui/core';
import { ListboxComponent, ZcOption } from '@zonacards/ui/listbox';
import { Panel } from '@zonacards/ui/panel';

let seq = 0;

/**
 * <zc-time-field from="06:00" to="22:00"> · se escribe hh:mm (24 h, dos puntos automáticos) o se elige cada 30 min.
 * Un solo ícono, a la derecha, abre la lista (también Alt+↓). Valor: "hh:mm" o el texto escrito si no es válido.
 * Para un rango desde–hasta, usar zcValidators.timeRange() en el grupo.
 */
@Component({
  selector: 'zc-time-field',
  imports: [IconComponent, ListboxComponent, TranslocoPipe],
  providers: [Panel, { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TimeFieldComponent), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0' },
  template: `
    <div #box [class]="boxClass" [attr.data-invalid]="invalidState()" [attr.data-disabled]="isDisabled()">
      <input #inp [class]="inputClass" type="text" inputmode="numeric" autocomplete="off" maxlength="5" [placeholder]="'ui.formatoHora' | transloco"
        [id]="inputId()" [attr.aria-label]="ariaLabel() || null" [attr.aria-describedby]="field?.messageId" [attr.aria-invalid]="invalidState() || null"
        [attr.aria-required]="field?.required() || null" [disabled]="isDisabled()" [value]="value() ?? ''"
        (beforeinput)="onBeforeInput($event)" (input)="onInput($event)" (keydown)="onKey($event)" (blur)="!panel.isOpen() && onTouched()" />
      <button #btn type="button" [class]="btnClass" aria-haspopup="listbox" [attr.aria-expanded]="panel.isOpen()" [attr.aria-controls]="panel.isOpen() ? listId : null"
        [attr.aria-label]="'ui.elegirHora' | transloco" [disabled]="isDisabled()" (click)="toggle()"><zc-icon name="s:clock-circle" /></button>
    </div>
    <ng-template #tpl>
      <zc-listbox [listId]="listId" [options]="options()" [isSelected]="isSelectedFn" [focusable]="true" [fill]="panel.mode() !== 'popover'"
        [label]="'ui.horas' | transloco" [(active)]="active" (pick)="pick($any($event.value))" />
    </ng-template>`,
})
export class TimeFieldComponent implements ControlValueAccessor {
  readonly from = input('00:00');
  readonly to = input('23:30');
  readonly step = input(30);
  /** Nombre accesible si comparte la etiqueta con otro campo (rango desde–hasta). */
  readonly ariaLabel = input('');
  /** false: no toma el id del zc-field (segundo campo de un rango). */
  readonly fieldLink = input(true);
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly value = model<string | null>(null);

  readonly panel = inject(Panel);
  readonly field = inject(FieldComponent, { optional: true });
  private readonly i18n = inject(TranslocoService);
  private readonly boxRef = viewChild.required<ElementRef<HTMLElement>>('box');
  private readonly btnRef = viewChild.required<ElementRef<HTMLButtonElement>>('btn');
  private readonly inpRef = viewChild.required<ElementRef<HTMLInputElement>>('inp');
  private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');

  readonly listId = `zc-time-${++seq}`;
  readonly inputId = computed(() => (this.fieldLink() ? this.field?.controlId : null) ?? `${this.listId}-in`);
  readonly boxClass = CONTROL_BOX;
  readonly inputClass = BARE_INPUT + ' num';
  readonly btnClass = INLINE_BTN;
  readonly isDisabled = linkedSignal(this.disabled);
  readonly invalidState = computed(() => this.invalid() || !!this.field?.invalid());
  readonly options = computed<ZcOption<string>[]>(() => timeSlots(this.from(), this.to(), this.step()).map(t => ({ value: t, label: t })));
  readonly active = signal(0);
  readonly isSelectedFn = (o: ZcOption<string>) => o.value === this.value();

  private onChange: (v: string | null) => void = () => {};
  onTouched: () => void = () => {};

  toggle() { this.panel.isOpen() ? this.panel.close() : this.open(); }

  open() {
    if (this.isDisabled()) return;
    const list = this.options(); const v = this.value() ?? '';
    // Sin valor exacto, la hora más cercana hacia adelante.
    const i = list.findIndex(o => o.value >= v);
    this.active.set(i >= 0 ? i : 0);
    this.panel.open(this.tpl(), {
      title: this.ariaLabel() || this.field?.label() || this.i18n.translate('ui.elegirHora'), origin: this.boxRef().nativeElement,
      returnFocus: this.btnRef().nativeElement, closeOnTab: true, onClose: () => this.onTouched(),
    });
  }

  pick(t: string) {
    this.set(t);
    this.panel.close(false);
    this.inpRef().nativeElement.focus({ preventScroll: true });
  }

  onBeforeInput(e: InputEvent) { rejectsInput(e, /[\d:]/); }

  onInput(e: Event) {
    const el = e.target as HTMLInputElement;
    const masked = maskHm(el.value);
    if (el.value !== masked) el.value = masked;
    this.set(masked || null);
  }

  onKey(e: KeyboardEvent) { if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); this.open(); } }

  private set(v: string | null) { this.value.set(v); this.onChange(v); }

  writeValue(v: string | null) { this.value.set(v ?? null); }
  registerOnChange(fn: (v: string | null) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(d: boolean) { this.isDisabled.set(d); }
}
