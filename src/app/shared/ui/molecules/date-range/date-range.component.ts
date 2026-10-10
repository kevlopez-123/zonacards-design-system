import {
  ChangeDetectionStrategy, Component, ElementRef, TemplateRef, computed, forwardRef, inject, input, linkedSignal, model, signal, viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  addDays, addMonths, daysInRange, endOfMonth, formatDmy, IsoDate, maskDmy, parseDmy, startOfMonth, startOfWeek, todayIso,
} from '../../../domain/dates';
import { DateRangeValue } from '../../../forms/validators';
import { ButtonDirective } from '../../atoms/button/button.directive';
import { CheckboxComponent } from '../../atoms/checkbox/checkbox.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { cn } from '../../cn';
import { injectTranslate } from '../../lang';
import { Viewport } from '../../viewport';
import { CalendarComponent } from '../calendar/calendar.component';
import { FieldComponent, InputDirective } from '../field/field.component';
import { Panel } from '../panel/panel';

export type RangePreset = 'hoy' | 'ayer' | 'ult7' | 'ult30' | 'semana' | 'mes' | 'mesAnterior' | 'trimestre' | 'anio' | 'personalizado';
let seq = 0;
const PRESETS: RangePreset[] =['hoy', 'ayer', 'ult7', 'ult30', 'semana', 'mes', 'mesAnterior', 'trimestre', 'anio', 'personalizado'];

/** Fechas de un periodo predefinido respecto de hoy. */
export function presetRange(p: RangePreset, today: IsoDate): [IsoDate, IsoDate] | null {
  const y = today.slice(0, 4), m = +today.slice(5, 7);
  switch (p) {
    case 'hoy': return [today, today];
    case 'ayer': return [addDays(today, -1), addDays(today, -1)];
    case 'ult7': return [addDays(today, -6), today];
    case 'ult30': return [addDays(today, -29), today];
    case 'semana': return [startOfWeek(today), today];
    case 'mes': return [startOfMonth(today), today];
    case 'mesAnterior': { const prev = addMonths(today, -1); return [prev, endOfMonth(prev)]; }
    case 'trimestre': return [`${y}-${String(Math.floor((m - 1) / 3) * 3 + 1).padStart(2, '0')}-01`, today];
    case 'anio': return [`${y}-01-01`, today];
    default: return null;
  }
}

/** Periodo anterior de la misma duración, para comparar. */
export function previousRange(from: IsoDate, to: IsoDate): [IsoDate, IsoDate] {
  const n = daysInRange(from, to);
  return [addDays(from, -n), addDays(from, -1)];
}

/**
 * <zc-date-range> · periodo de reportes y filtros.
 * Periodos predefinidos, personalizado con dos meses (uno en móvil), campos Desde/Hasta escribibles
 * y "Comparar con el periodo anterior". Un solo ícono de calendario en el disparador; Aplicar confirma, Cancelar descarta.
 * Valor: { from, to, preset, compare } con fechas ISO.
 */
@Component({
  selector: 'zc-date-range',
  imports: [ButtonDirective, CalendarComponent, CheckboxComponent, FieldComponent, IconComponent, InputDirective, TranslocoPipe],
  providers: [Panel, { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateRangeComponent), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0' },
  template: `
    <button #trigger type="button" role="combobox" [id]="field?.controlId" [class]="triggerClass()" [disabled]="isDisabled()" aria-haspopup="dialog"
      [attr.aria-expanded]="panel.isOpen()" [attr.aria-labelledby]="field?.labelId" [attr.aria-describedby]="field?.messageId"
      [attr.aria-invalid]="invalidState() || null" [attr.data-invalid]="invalidState()" [title]="fullText()" (click)="toggle()" (blur)="!panel.isOpen() && onTouched()">
      <span [id]="valueId" class="min-w-0 flex-1 truncate">
        @if (value(); as v) { {{ shortText() }}<span class="sr-only">, {{ fullText() }}</span> }
        @else { <span class="text-subtle">{{ placeholder() || ('ui.elegirPeriodo' | transloco) }}</span> }
      </span>
      <zc-icon name="s:calendar" class="text-muted" />
    </button>

    <ng-template #tpl>
      <div class="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[11rem_minmax(0,1fr)]">
        <div role="radiogroup" [attr.aria-label]="'ui.periodos' | transloco" class="flex flex-wrap content-start gap-2 md:grid md:gap-0.5" (keydown)="onPresetKey($event)">
          @for (p of presets; track p) {
            <button type="button" role="radio" [attr.aria-checked]="dPreset() === p" [attr.tabindex]="dPreset() === p ? 0 : -1" [attr.data-autofocus]="dPreset() === p ? '' : null"
              [attr.data-preset]="p" [class]="presetClass(p)" (click)="choosePreset(p)">
              <span class="truncate">{{ 'ui.preset.' + p | transloco }}</span>
              <zc-icon name="l:check" [size]="16" class="shrink-0 max-md:hidden" [class.invisible]="dPreset() !== p" />
            </button>
          }
        </div>
        <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
          <div class="grid grid-cols-2 gap-x-3">
            <zc-field [label]="'ui.desde' | transloco" [error]="fromError()">
              <input zcInput inputmode="numeric" maxlength="10" autocomplete="off" class="num" [placeholder]="'ui.formatoFecha' | transloco" [value]="fromText()" (input)="typeDate($event, 0)" />
            </zc-field>
            <zc-field [label]="'ui.hasta' | transloco" [error]="toError()">
              <input zcInput inputmode="numeric" maxlength="10" autocomplete="off" class="num" [placeholder]="'ui.formatoFecha' | transloco" [value]="toText()" (input)="typeDate($event, 1)" />
            </zc-field>
          </div>
          <div class="flex flex-wrap justify-center gap-6" (mouseleave)="hover.set(null)">
            <zc-calendar [(month)]="view" [(focusDay)]="focus1" [rangeStart]="dFrom()" [rangeEnd]="shownEnd()" [max]="maxDate()" [today]="today()"
              [hideOutside]="true" [showNext]="!twoMonths()" (pick)="pickDay($event)" (hover)="hover.set($event)" />
            @if (twoMonths()) {
              <zc-calendar [month]="view2()" (monthChange)="view.set(addMonths($event, -1))" [(focusDay)]="focus2" [rangeStart]="dFrom()" [rangeEnd]="shownEnd()"
                [max]="maxDate()" [today]="today()" [hideOutside]="true" [showPrev]="false" (pick)="pickDay($event)" (hover)="hover.set($event)" />
            }
          </div>
          <zc-checkbox [(checked)]="dCompare" [description]="compareText()">{{ 'ui.compararAnterior' | transloco }}</zc-checkbox>
          <div class="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <span class="text-[13px] text-muted num" aria-live="polite">{{ dTo() ? ('ui.nDias' | transloco: { n: draftDays() }) : ('ui.eligeFin' | transloco) }}</span>
            <span class="flex gap-2">
              <button zcButton variant="ghost" size="sm" (click)="panel.close()">{{ 'ui.cancelar' | transloco }}</button>
              <button zcButton size="sm" [disabled]="!dFrom() || !dTo()" (click)="apply()">{{ 'ui.aplicar' | transloco }}</button>
            </span>
          </div>
        </div>
      </div>
    </ng-template>`,
})
export class DateRangeComponent implements ControlValueAccessor {
  readonly placeholder = input('');
  readonly timeZone = input('America/Lima');
  /** Por defecto no se eligen fechas futuras (reportes). */
  readonly allowFuture = input(false);
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly value = model<DateRangeValue | null>(null);

  readonly panel = inject(Panel);
  readonly field = inject(FieldComponent, { optional: true });
  private readonly i18n = inject(TranslocoService);
  private readonly viewport = inject(Viewport);
  private readonly triggerRef = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');

  readonly presets = PRESETS;
  readonly addMonths = addMonths;
  readonly valueId = `zc-rng-${++seq}`;
  readonly isDisabled = linkedSignal(this.disabled);
  readonly invalidState = computed(() => this.invalid() || !!this.field?.invalid());
  readonly today = computed(() => todayIso(this.timeZone()));
  readonly maxDate = computed(() => (this.allowFuture() ? null : this.today()));
  readonly twoMonths = computed(() => !this.viewport.mobile());

  // Borrador dentro del panel: solo se aplica con Aplicar.
  readonly dFrom = signal<IsoDate | null>(null);
  readonly dTo = signal<IsoDate | null>(null);
  readonly dPreset = signal<RangePreset>('ult30');
  readonly dCompare = signal(false);
  readonly hover = signal<IsoDate | null>(null);
  readonly view = signal<IsoDate>('2000-01-01');
  readonly view2 = computed(() => addMonths(this.view(), 1));
  readonly focus1 = signal<IsoDate>('2000-01-01');
  readonly focus2 = linkedSignal(() => this.view2());
  readonly fromText = linkedSignal(() => (this.dFrom() ? formatDmy(this.dFrom()!) : ''));
  readonly toText = linkedSignal(() => (this.dTo() ? formatDmy(this.dTo()!) : ''));
  readonly fromError = signal<string | null>(null);
  readonly toError = signal<string | null>(null);
  readonly shownEnd = computed(() => this.dTo() ?? (this.dFrom() && this.hover() && this.hover()! >= this.dFrom()! ? this.hover() : null));
  readonly draftDays = computed(() => (this.dFrom() && this.dTo() ? daysInRange(this.dFrom()!, this.dTo()!) : 0));
  readonly compareText = computed(() => {
    const f = this.dFrom(), t = this.dTo();
    if (!f || !t) return '';
    const [a, b] = previousRange(f, t);
    return `${formatDmy(a)} – ${formatDmy(b)}`;
  });

  private readonly t = injectTranslate();
  readonly shortText = computed(() => {
    const v = this.value(); if (!v) return '';
    const base = v.preset && v.preset !== 'personalizado' ? this.t('ui.preset.' + v.preset) : `${formatDmy(v.from).slice(0, 5)} – ${formatDmy(v.to)}`;
    return v.compare ? `${base} · ${this.t('ui.vsAnterior')}` : base;
  });
  readonly fullText = computed(() => {
    const v = this.value(); if (!v) return '';
    const pre = v.preset && v.preset !== 'personalizado' ? this.t('ui.preset.' + v.preset) + ': ' : '';
    return `${pre}${formatDmy(v.from)} – ${formatDmy(v.to)}${v.compare ? ', ' + this.t('ui.comparadoAnterior') : ''}`;
  });

  readonly triggerClass = computed(() => cn(
    'flex h-target w-full min-w-0 cursor-pointer items-center gap-2 rounded-sm border border-border-strong bg-surface pr-3 pl-4 text-left text-base transition',
    'hover:enabled:border-muted aria-expanded:border-focus aria-expanded:shadow-[0_0_0_3px_color-mix(in_srgb,var(--focus)_22%,transparent)] data-[invalid=true]:border-danger',
    'disabled:cursor-not-allowed disabled:border-dashed disabled:bg-surface-2 disabled:text-muted',
  ));

  presetClass(p: RangePreset) {
    const on = this.dPreset() === p;
    return cn(
      'inline-flex cursor-pointer items-center gap-2 text-left transition',
      // Móvil: chips. Desde md: filas de lista.
      'h-8 rounded-full border px-3 text-[13px] md:h-auto md:min-h-10 md:justify-between md:rounded-sm md:border-0 md:px-3 md:text-[15px]',
      on ? 'border-primary bg-primary text-on-primary md:bg-surface-2 md:font-semibold md:text-fg' : 'border-border bg-surface-2 text-fg md:bg-transparent md:hover:bg-surface-2',
    );
  }

  private onChange: (v: DateRangeValue | null) => void = () => {};
  onTouched: () => void = () => {};

  toggle() { this.panel.isOpen() ? this.panel.close() : this.open(); }

  open() {
    if (this.isDisabled()) return;
    const v = this.value();
    const [f, t] = v ? [v.from, v.to] : (presetRange('ult30', this.today()) as [IsoDate, IsoDate]);
    this.dFrom.set(f); this.dTo.set(t); this.dPreset.set((v?.preset as RangePreset) ?? (v ? 'personalizado' : 'ult30'));
    this.dCompare.set(!!v?.compare); this.hover.set(null); this.fromError.set(null); this.toError.set(null);
    this.showMonths(t);
    this.panel.open(this.tpl(), {
      title: this.field?.label() ?? this.i18n.translate('ui.elegirPeriodo'), origin: this.triggerRef().nativeElement, role: 'dialog',
      ariaLabel: this.i18n.translate('ui.elegirPeriodo'), width: this.twoMonths() ? 860 : 400, trap: true, onClose: () => this.onTouched(),
    });
  }

  /** El mes del fin queda visible: a la derecha con dos meses, solo en móvil. */
  private showMonths(end: IsoDate) {
    this.view.set(startOfMonth(this.twoMonths() ? addMonths(end, -1) : end));
    this.focus1.set(this.dFrom() ?? end);
  }

  choosePreset(p: RangePreset) {
    this.dPreset.set(p);
    const r = presetRange(p, this.today());
    if (r) { this.dFrom.set(r[0]); this.dTo.set(r[1]); this.showMonths(r[1]); this.fromError.set(null); this.toError.set(null); }
  }

  onPresetKey(e: KeyboardEvent) {
    const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const group = e.currentTarget as HTMLElement;
    const i = (PRESETS.indexOf(this.dPreset()) + d + PRESETS.length) % PRESETS.length;
    this.choosePreset(PRESETS[i]);
    group.querySelector<HTMLElement>(`[data-preset="${PRESETS[i]}"]`)?.focus();
  }

  pickDay(d: IsoDate) {
    const f = this.dFrom(), t = this.dTo();
    if (!f || t) { this.dFrom.set(d); this.dTo.set(null); }
    else if (d < f) { this.dFrom.set(d); this.dTo.set(f); }
    else this.dTo.set(d);
    this.dPreset.set('personalizado'); this.fromError.set(null); this.toError.set(null);
  }

  typeDate(e: Event, which: 0 | 1) {
    const el = e.target as HTMLInputElement;
    const masked = maskDmy(el.value);
    if (el.value !== masked) el.value = masked;
    (which ? this.toText : this.fromText).set(masked);
    const err = which ? this.toError : this.fromError;
    if (masked.length < 10) { err.set(null); return; }
    const d = parseDmy(masked);
    if (!d) { err.set(this.i18n.translate('validacion.dateFormat')); return; }
    if (this.maxDate() && d > this.maxDate()!) { err.set(this.i18n.translate('ui.noFutura')); return; }
    if (which && this.dFrom() && d < this.dFrom()!) { err.set(this.i18n.translate('validacion.rangeOrder')); return; }
    err.set(null);
    (which ? this.dTo : this.dFrom).set(d);
    if (!which && this.dTo() && d > this.dTo()!) this.dTo.set(null);
    this.dPreset.set('personalizado');
    this.showMonths(this.dTo() ?? d);
  }

  apply() {
    const v: DateRangeValue = { from: this.dFrom()!, to: this.dTo()!, preset: this.dPreset(), compare: this.dCompare() };
    this.value.set(v); this.onChange(v);
    this.panel.close();
  }

  writeValue(v: DateRangeValue | null) { this.value.set(v ?? null); }
  registerOnChange(fn: (v: DateRangeValue | null) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(d: boolean) { this.isDisabled.set(d); }
}
