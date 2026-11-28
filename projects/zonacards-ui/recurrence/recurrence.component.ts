import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { IsoDate, formatDate, isoToDate, todayIso } from '@zonacards/ui/core';
import { RECUR_MAX_COUNT, RECUR_MAX_INTERVAL, RecurEnd, RecurFreq, RecurRule, nthOfMonth, occurrences, recurInvalid, sortWeekdays } from '@zonacards/ui/core';
import { IconComponent } from '@zonacards/ui/icon';
import { RadioGroupComponent } from '@zonacards/ui/radio';
import { RadioComponent } from '@zonacards/ui/radio';
import { injectLang, injectTranslate } from '@zonacards/ui/core';
import { DateFieldComponent } from '@zonacards/ui/date-field';
import { FieldComponent } from '@zonacards/ui/field';
import { NumberFieldComponent } from '@zonacards/ui/number-field';
import { ZcOption } from '@zonacards/ui/listbox';
import { SelectComponent } from '@zonacards/ui/select';
import { TimeFieldComponent } from '@zonacards/ui/time-field';

let seq = 0;

export const DEFAULT_RECUR: RecurRule = { freq: 'weekly', interval: 1, days: [1, 4], monthMode: 'day', end: 'until', until: null, count: 10, time: '09:00' };

/**
 * <zc-recurrence [(value)]="regla" timeZone="America/Lima" timeZoneLabel="Hora de Lima (UTC−5)" />
 * Frecuencia, intervalo, días (semanal), modo mensual, hora, fin (nunca, fecha, N veces), una frase que resume la regla
 * y las próximas fechas. Semanal sin días muestra el error y no da fechas.
 */
@Component({
  selector: 'zc-recurrence',
  imports: [IconComponent, RadioGroupComponent, RadioComponent, DateFieldComponent, FieldComponent, NumberFieldComponent, SelectComponent, TimeFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-2 md:gap-5' },
  template: `
    <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
      <div class="grid grid-cols-[minmax(0,1fr)] gap-x-5 gap-y-4 sm:grid-cols-2">
        <zc-field [label]="t('mol.recur.frecuencia')"><zc-select [options]="freqs()" [value]="value().freq" (valueChange)="patch({ freq: $any($event) })" /></zc-field>
        @if (value().freq !== 'none') {
          <zc-field [label]="t('mol.recur.cada')" [hint]="unit()">
            <zc-number-field [min]="1" [max]="maxInterval" [value]="value().interval" (valueChange)="patch({ interval: clampInterval($event) })" />
          </zc-field>
        }
      </div>
      @if (value().freq === 'weekly') {
        <zc-field [label]="t('mol.recur.losDias')" [error]="daysError()">
          <div class="flex flex-wrap gap-1.5" role="group" [attr.aria-label]="t('mol.recur.losDias')">
            @for (d of week(); track d.n) {
              <button type="button" class="size-target cursor-pointer rounded-full border text-sm font-semibold transition"
                [class]="value().days.includes(d.n) ? 'border-primary bg-primary text-on-primary' : 'border-border-strong bg-surface text-fg hover:bg-(--state-hover-bg)'"
                [attr.aria-pressed]="value().days.includes(d.n)" [attr.aria-label]="d.long" (click)="toggleDay(d.n)">{{ d.short }}</button>
            }
          </div>
        </zc-field>
      }
      @if (value().freq === 'monthly') {
        <zc-radio-group [label]="t('mol.recur.cadaMes')" [value]="value().monthMode" (valueChange)="patch({ monthMode: $any($event) })">
          <zc-radio value="day">{{ t('mol.recur.elDia', { d: startDay() }) }}</zc-radio>
          <zc-radio value="nth">{{ t('mol.recur.elNth', { o: ordinal(), d: weekdayLong(start()) }) }}</zc-radio>
        </zc-radio-group>
      }
      <div class="grid grid-cols-[minmax(0,1fr)] gap-x-5 gap-y-4 sm:grid-cols-2">
        <zc-field [label]="t('mol.recur.hora')" [hint]="timeZoneLabel()"><zc-time-field [value]="value().time" (valueChange)="patch({ time: $event ?? '09:00' })" /></zc-field>
        @if (value().freq !== 'none') {
          <zc-field [label]="t('mol.recur.termina')"><zc-select [options]="ends()" [value]="value().end" (valueChange)="patch({ end: $any($event) })" /></zc-field>
        }
      </div>
      @if (value().freq !== 'none') {
        @if (value().end === 'until') {
          <zc-field [label]="t('mol.recur.fechaFin')"><zc-date-field [min]="start()" [timeZone]="timeZone()" [value]="until()" (valueChange)="patch({ until: $any($event) })" /></zc-field>
        } @else if (value().end === 'count') {
          <zc-field [label]="t('mol.recur.veces')" [hint]="t('mol.recur.maximo', { n: maxCount })">
            <zc-number-field [min]="1" [max]="maxCount" [value]="value().count" (valueChange)="patch({ count: clampCount($event) })" />
          </zc-field>
        }
      }
    </div>

    <div class="grid content-start gap-3">
      <div class="flex items-start gap-3 rounded-md bg-info-bg p-4 leading-5.5 text-info" aria-live="polite">
        <zc-icon name="s:calendar" class="mt-px shrink-0" /><strong class="font-semibold text-fg">{{ summary() }}</strong>
      </div>
      <span class="text-caption font-semibold text-muted" [id]="uid">{{ t('mol.recur.proximos') }}</span>
      <ul class="m-0 grid list-none gap-1.5 p-0 text-sm" [attr.aria-labelledby]="uid">
        @for (o of next(); track o) {
          <li class="flex items-center gap-2"><zc-icon name="s:clock-circle" [size]="16" class="shrink-0 text-muted" /><span class="num">{{ o }}</span></li>
        } @empty {
          <li class="text-muted">{{ t('mol.recur.sinFechas') }}</li>
        }
      </ul>
    </div>`,
})
export class RecurrenceComponent {
  readonly t = injectTranslate();
  private readonly lang = injectLang();
  readonly value = model<RecurRule>(DEFAULT_RECUR);
  readonly timeZone = input('America/Lima');
  readonly timeZoneLabel = input('');
  /** Primer día posible (por defecto, hoy en la zona horaria). */
  readonly from = input<IsoDate | null>(null);
  /** Cuántas próximas fechas mostrar. */
  readonly preview = input(4);
  readonly maxInterval = RECUR_MAX_INTERVAL;
  readonly maxCount = RECUR_MAX_COUNT;
  readonly uid = `zc-rec-${++seq}`;

  readonly start = computed(() => this.from() ?? todayIso(this.timeZone()));
  /** Sin fecha de fin elegida: 31 de diciembre del año en curso. */
  readonly until = computed(() => this.value().until ?? `${this.start().slice(0, 4)}-12-31`);
  readonly startDay = computed(() => +this.start().slice(8));
  private readonly locale = computed(() => (this.lang() === 'en' ? 'en-US' : 'es-PE'));

  readonly freqs = computed<ZcOption<RecurFreq>[]>(() => (['none', 'daily', 'weekly', 'monthly', 'yearly'] as const).map(v => ({ value: v, label: this.t('mol.recur.freq.' + v) })));
  readonly ends = computed<ZcOption<RecurEnd>[]>(() => (['never', 'until', 'count'] as const).map(v => ({ value: v, label: this.t('mol.recur.fin.' + v) })));
  /** Lunes a domingo, con inicial y nombre completo del idioma activo. */
  readonly week = computed(() => [1, 2, 3, 4, 5, 6, 0].map(n => {
    const d = new Date(Date.UTC(2026, 1, 1 + n)); // 1 de febrero de 2026 es domingo
    const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(this.locale(), { ...o, timeZone: 'UTC' }).format(d);
    return { n, short: this.lang() === 'en' ? f({ weekday: 'narrow' }) : ['D', 'L', 'M', 'X', 'J', 'V', 'S'][n], long: f({ weekday: 'long' }) };
  }));
  weekdayLong(iso: IsoDate) { return new Intl.DateTimeFormat(this.locale(), { weekday: 'long', timeZone: 'UTC' }).format(isoToDate(iso)); }
  readonly ordinal = computed(() => this.t('mol.recur.ordinal.' + nthOfMonth(this.start())));
  readonly unit = computed(() => {
    const f = this.value().freq; if (f === 'none') return '';
    return this.t(`mol.recur.unidad.${f}.${this.value().interval === 1 ? 'one' : 'other'}`);
  });
  readonly daysError = computed(() => (recurInvalid(this.value()) ? this.t('mol.recur.eligeDia') : null));

  private time(hhmm: string) {
    const [h, m] = hhmm.split(':').map(Number);
    return formatDate(new Date(Date.UTC(2026, 0, 1, h, m)), 'time', { lang: this.lang(), timeZone: 'UTC' });
  }
  readonly summary = computed(() => {
    const r = this.value(); const lang = this.lang(); const time = this.time(r.time);
    if (r.freq === 'none') return this.t('mol.recur.frase.unaVez', { time });
    let s = r.interval === 1 ? this.t('mol.recur.frase.cada1.' + r.freq) : this.t('mol.recur.frase.cadaN', { n: r.interval, u: this.t(`mol.recur.unidad.${r.freq}.other`) });
    if (r.freq === 'weekly' && r.days.length) {
      const names = sortWeekdays(r.days).map(d => this.week().find(w => w.n === d)!.long);
      s += this.t('mol.recur.frase.dias', { lista: new Intl.ListFormat(this.locale(), { type: 'conjunction' }).format(names) });
    }
    if (r.freq === 'monthly') s += r.monthMode === 'day' ? this.t('mol.recur.frase.diaMes', { d: this.startDay() }) : this.t('mol.recur.frase.nthMes', { o: this.ordinal(), d: this.weekdayLong(this.start()) });
    s += this.t('mol.recur.frase.hora', { time });
    if (r.end === 'until') s += this.t('mol.recur.frase.hasta', { fecha: formatDate(isoToDate(this.until()), 'medium', { lang, timeZone: 'UTC' }) });
    else if (r.end === 'count') s += this.t('mol.recur.frase.veces', { n: r.count });
    else s += this.t('mol.recur.frase.sinFin');
    return s;
  });
  readonly next = computed(() => {
    const r = { ...this.value(), until: this.until() }; const lang = this.lang(); const time = this.time(r.time);
    return occurrences(r, this.start(), this.preview()).map(iso => `${formatDate(isoToDate(iso), 'full', { lang, timeZone: 'UTC' })} · ${time}`);
  });

  patch(p: Partial<RecurRule>) { this.value.update(v => ({ ...v, ...p })); }
  toggleDay(n: number) { const d = this.value().days; this.patch({ days: d.includes(n) ? d.filter(x => x !== n) : [...d, n] }); }
  clampInterval(v: number | null) { return Math.max(1, Math.min(RECUR_MAX_INTERVAL, v ?? 1)); }
  clampCount(v: number | null) { return Math.max(1, Math.min(RECUR_MAX_COUNT, v ?? 1)); }
}
