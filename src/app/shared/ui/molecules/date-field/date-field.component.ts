import { ChangeDetectionStrategy, Component, ElementRef, TemplateRef, computed, forwardRef, inject, input, linkedSignal, model, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { addDays, formatDmy, isIsoDate, IsoDate, maskDmy, parseDmy, startOfMonth, todayIso } from '../../../domain/dates';
import { ButtonDirective } from '../../atoms/button/button.directive';
import { IconComponent } from '../../atoms/icon/icon.component';
import { BARE_INPUT, CONTROL_BOX, INLINE_BTN } from '../../viewport';
import { CalendarComponent } from '../calendar/calendar.component';
import { FieldComponent } from '../field/field.component';
import { rejectsInput } from '../input-filter';
import { Panel } from '../panel/panel';

export interface DateShortcut { label: string; days: number; }
/** Etiquetas como claves de i18n. */
const DEFAULT_SHORTCUTS: DateShortcut[] = [{ label: 'ui.hoy', days: 0 }, { label: 'ui.masDias', days: 30 }, { label: 'ui.masDias', days: 90 }];
/** Campo hacia el pasado (máximo hoy o antes): atajos hacia atrás. */
const PAST_SHORTCUTS: DateShortcut[] = [{ label: 'ui.hoy', days: 0 }, { label: 'ui.haceDias', days: -7 }, { label: 'ui.haceDias', days: -30 }];

/**
 * <zc-date-field [min]="hoy" [max]="…"> · se escribe dd/mm/aaaa (barras automáticas) o se elige en el calendario.
 * Un solo ícono, a la derecha, abre el calendario (también Alt+↓). Atajos al pie: Hoy, +30 y +90 días; si el máximo es hoy o antes, Hoy, hace 7 y hace 30 días.
 * Valor: fecha ISO "aaaa-mm-dd"; si lo escrito no es una fecha válida, el texto tal cual (zcValidators.date() lo marca).
 */
@Component({
  selector: 'zc-date-field',
  imports: [ButtonDirective, CalendarComponent, IconComponent, TranslocoPipe],
  providers: [Panel, { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateFieldComponent), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0' },
  template: `
    <div #box [class]="boxClass" [attr.data-invalid]="invalidState()" [attr.data-disabled]="isDisabled()">
      <input #inp [class]="inputClass" type="text" inputmode="numeric" autocomplete="off" maxlength="10" [placeholder]="'ui.formatoFecha' | transloco"
        [id]="field?.controlId" [attr.aria-describedby]="field?.messageId" [attr.aria-invalid]="invalidState() || null" [attr.aria-required]="field?.required() || null"
        [disabled]="isDisabled()" [value]="text()" (beforeinput)="onBeforeInput($event)" (input)="onInput($event)" (keydown)="onKey($event)" (blur)="!panel.isOpen() && onTouched()" />
      <button #btn type="button" [class]="btnClass" aria-haspopup="dialog" [attr.aria-expanded]="panel.isOpen()" [attr.aria-label]="'ui.abrirCalendario' | transloco"
        [disabled]="isDisabled()" (click)="toggle()"><zc-icon name="s:calendar" /></button>
    </div>
    <ng-template #tpl>
      <zc-calendar class="mx-auto" [(month)]="month" [(focusDay)]="focusDay" [selected]="iso()" [min]="min()" [max]="max()" [today]="today()" (pick)="pick($event)" />
      <div class="mt-2 flex flex-wrap justify-end gap-1 border-t border-border pt-2">
        @for (s of shortcutList(); track s.days) {
          <button zcButton variant="ghost" size="sm" [disabled]="isOff(shortcutDate(s.days))" (click)="pick(shortcutDate(s.days))">
            {{ shortcuts() ? s.label : (s.label | transloco: { n: abs(s.days) }) }}
          </button>
        }
      </div>
    </ng-template>`,
})
export class DateFieldComponent implements ControlValueAccessor {
  readonly min = input<IsoDate | null>(null);
  readonly max = input<IsoDate | null>(null);
  /** Zona horaria del país de la operación (define qué día es "hoy"). */
  readonly timeZone = input('America/Lima');
  /** Atajos al pie del calendario; vacío para ocultarlos. */
  readonly shortcuts = input<DateShortcut[] | null>(null);
  readonly abs = Math.abs;
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly value = model<IsoDate | string | null>(null);

  readonly panel = inject(Panel);
  readonly field = inject(FieldComponent, { optional: true });
  private readonly i18n = inject(TranslocoService);
  private readonly boxRef = viewChild.required<ElementRef<HTMLElement>>('box');
  private readonly btnRef = viewChild.required<ElementRef<HTMLButtonElement>>('btn');
  private readonly inpRef = viewChild.required<ElementRef<HTMLInputElement>>('inp');
  private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');

  readonly boxClass = CONTROL_BOX;
  readonly inputClass = BARE_INPUT + ' num';
  readonly btnClass = INLINE_BTN;
  readonly isDisabled = linkedSignal(this.disabled);
  readonly invalidState = computed(() => this.invalid() || !!this.field?.invalid());
  readonly today = computed(() => todayIso(this.timeZone()));
  readonly iso = computed(() => { const v = this.value(); return isIsoDate(v) ? v : null; });
  /** Texto del input: la fecha en dd/mm/aaaa o lo que se está escribiendo. */
  readonly text = linkedSignal(() => { const v = this.value(); return isIsoDate(v) ? formatDmy(v) : (v ?? ''); });
  readonly month = signal<IsoDate>('2000-01-01');
  readonly focusDay = signal<IsoDate>('2000-01-01');
  readonly shortcutList = computed(() => this.shortcuts() ?? (this.max() && this.max()! <= this.today() ? PAST_SHORTCUTS : DEFAULT_SHORTCUTS));

  private onChange: (v: IsoDate | string | null) => void = () => {};
  onTouched: () => void = () => {};

  shortcutDate(days: number) { return addDays(this.today(), days); }
  isOff(d: IsoDate) { return (!!this.min() && d < this.min()!) || (!!this.max() && d > this.max()!); }

  toggle() { this.panel.isOpen() ? this.panel.close() : this.open(); }

  open() {
    if (this.isDisabled()) return;
    const t = this.today();
    const start = this.iso() ?? (this.min() && this.min()! > t ? this.min()! : t);
    this.focusDay.set(start);
    this.month.set(startOfMonth(start));
    this.panel.open(this.tpl(), {
      title: this.field?.label() ?? this.i18n.translate('ui.elegirFecha'), origin: this.boxRef().nativeElement, returnFocus: this.btnRef().nativeElement,
      role: 'dialog', ariaLabel: this.i18n.translate('ui.elegirFecha'), width: 312, align: 'end', trap: true, onClose: () => this.onTouched(),
    });
  }

  pick(d: IsoDate) {
    this.set(d);
    this.panel.close(false);
    this.inpRef().nativeElement.focus({ preventScroll: true });
  }

  onBeforeInput(e: InputEvent) { rejectsInput(e, /[\d/]/); }

  onInput(e: Event) {
    const el = e.target as HTMLInputElement;
    const masked = maskDmy(el.value);
    if (el.value !== masked) el.value = masked;
    this.text.set(masked);
    this.set(masked.length === 10 ? (parseDmy(masked) ?? masked) : masked || null);
  }

  onKey(e: KeyboardEvent) { if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); this.open(); } }

  private set(v: IsoDate | string | null) { this.value.set(v); this.onChange(v); }

  writeValue(v: IsoDate | string | null) { this.value.set(v ?? null); }
  registerOnChange(fn: (v: IsoDate | string | null) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(d: boolean) { this.isDisabled.set(d); }
}
