import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, model, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { addDays, addMonths, formatDate, IsoDate, isoToDate, monthGrid, sameMonth, startOfMonth } from '@zonacards/ui/core';
import { IconComponent } from '@zonacards/ui/icon';
import { injectLang } from '@zonacards/ui/core';

let seq = 0;

/**
 * <zc-calendar> · un mes, de lunes a domingo (rejilla ARIA con foco itinerante).
 * Flechas: día y semana · RePág/AvPág: mes · Inicio/Fin: semana · Enter o Espacio: elegir.
 * Muestra hoy, la fecha elegida o un rango, y deshabilita lo que queda fuera de [min, max].
 * Uso interno de zc-date-field y zc-date-range.
 */
@Component({
  selector: 'zc-calendar',
  imports: [IconComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-[18rem] max-w-full' },
  template: `
    <div class="mb-2 flex h-10 items-center justify-between">
      @if (showPrev()) {
        <button type="button" [class]="navBtn" [attr.aria-label]="'ui.mesAnterior' | transloco" (click)="go(-1)"><zc-icon name="s:alt-arrow-left" [size]="16" /></button>
      } @else { <span class="size-10" aria-hidden="true"></span> }
      <strong [id]="titleId" class="text-body font-semibold" aria-live="polite">{{ title() }}</strong>
      @if (showNext()) {
        <button type="button" [class]="navBtn" [attr.aria-label]="'ui.mesSiguiente' | transloco" (click)="go(1)"><zc-icon name="s:alt-arrow-right" [size]="16" /></button>
      } @else { <span class="size-10" aria-hidden="true"></span> }
    </div>
    <div role="grid" [attr.aria-labelledby]="titleId" class="grid grid-cols-[repeat(7,minmax(0,2.5rem))] justify-center" (keydown)="onKey($event)">
      <div role="row" class="contents">
        @for (d of weekdays(); track $index) { <span role="columnheader" [attr.aria-label]="d.long" class="grid h-8 place-items-center text-xs text-muted">{{ d.short }}</span> }
      </div>
      @for (week of weeks(); track $index) {
        <div role="row" class="contents">
          @for (day of week; track day) {
            @let out = !sameMonth(day, month());
            <span role="gridcell" class="grid place-items-center" [attr.aria-selected]="isSel(day)">
              @if (out && hideOutside()) { <span class="size-10" aria-hidden="true"></span> }
              @else {
                <button type="button" [attr.data-day]="day" [class]="dayClass(day, out)" [disabled]="isOff(day)"
                  [attr.tabindex]="day === focusDay() ? 0 : -1" [attr.data-autofocus]="day === focusDay() ? '' : null" [attr.aria-label]="label(day)" [attr.aria-current]="day === today() ? 'date' : null"
                  (click)="choose(day)" (mouseenter)="hover.emit(day)">{{ +day.slice(8) }}</button>
              }
            </span>
          }
        </div>
      }
    </div>`,
})
export class CalendarComponent {
  /** Primer día del mes visible. */
  readonly month = model.required<IsoDate>();
  readonly selected = input<IsoDate | null>(null);
  readonly rangeStart = input<IsoDate | null>(null);
  readonly rangeEnd = input<IsoDate | null>(null);
  readonly min = input<IsoDate | null>(null);
  readonly max = input<IsoDate | null>(null);
  readonly today = input.required<IsoDate>();
  /** Día con foco itinerante; puede cambiar de mes con el teclado. */
  readonly focusDay = model.required<IsoDate>();
  readonly hideOutside = input(false);
  readonly showPrev = input(true);
  readonly showNext = input(true);
  /** Tomar el foco al cambiar focusDay (solo cuando el usuario navega en esta rejilla). */
  readonly autoFocus = input(true);
  readonly pick = output<IsoDate>();
  readonly hover = output<IsoDate>();

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly titleId = `zc-cal-${++seq}`;
  readonly sameMonth = sameMonth;
  readonly navBtn = 'grid size-10 cursor-pointer place-items-center rounded-full text-fg transition hover:bg-surface-2';
  private keyboard = false;

  private readonly lang = injectLang();
  readonly title = computed(() => formatDate(isoToDate(this.month()), 'month', { lang: this.lang(), timeZone: 'UTC' }));
  readonly weeks = computed(() => { const g = monthGrid(this.month()); return Array.from({ length: 6 }, (_, i) => g.slice(i * 7, i * 7 + 7)); });
  readonly weekdays = computed(() => {
    const loc = this.lang() === 'en' ? 'en-US' : 'es-PE';
    return this.weeks()[0].map(d => {
      const date = isoToDate(d);
      return {
        short: new Intl.DateTimeFormat(loc, { weekday: 'narrow', timeZone: 'UTC' }).format(date).toUpperCase(),
        long: new Intl.DateTimeFormat(loc, { weekday: 'long', timeZone: 'UTC' }).format(date),
      };
    });
  });

  constructor() {
    // Foco itinerante: tras navegar con el teclado, el día activo recibe el foco.
    afterRenderEffect(() => {
      const d = this.focusDay();
      if (!this.keyboard || !this.autoFocus()) return;
      this.el.nativeElement.querySelector<HTMLElement>(`[data-day="${d}"]`)?.focus({ preventScroll: true });
    });
  }

  label(d: IsoDate) { return formatDate(isoToDate(d), 'full', { lang: this.lang(), timeZone: 'UTC' }); }
  isOff(d: IsoDate) { return (!!this.min() && d < this.min()!) || (!!this.max() && d > this.max()!); }
  isSel(d: IsoDate) { return d === this.selected() || d === this.rangeStart() || d === this.rangeEnd(); }
  private inRange(d: IsoDate) { const a = this.rangeStart(), b = this.rangeEnd(); return !!a && !!b && d > a && d < b; }

  dayClass(d: IsoDate, out: boolean) {
    const base = 'relative grid size-10 cursor-pointer place-items-center rounded-sm text-sm num transition-colors disabled:cursor-not-allowed disabled:text-subtle disabled:opacity-50 ';
    if (this.isSel(d)) return base + 'bg-primary font-semibold text-on-primary';
    const today = d === this.today() ? "after:absolute after:bottom-[5px] after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-current after:content-[''] " : '';
    return base + today + (this.inRange(d) ? 'rounded-none bg-surface-2 ' : 'hover:enabled:bg-surface-2 ') + (out ? 'text-subtle' : 'text-fg');
  }

  go(n: number) { this.keyboard = false; this.month.set(addMonths(this.month(), n)); this.focusDay.set(this.clampToMonth(this.focusDay(), this.month())); }

  private clampToMonth(d: IsoDate, month: IsoDate): IsoDate {
    if (sameMonth(d, month)) return d;
    const day = Math.min(+d.slice(8), 28);
    return startOfMonth(month).slice(0, 8) + String(day).padStart(2, '0');
  }

  choose(d: IsoDate) { if (!this.isOff(d)) { this.focusDay.set(d); this.pick.emit(d); } }

  onKey(e: KeyboardEvent) {
    const cur = this.focusDay();
    const dow = (isoToDate(cur).getUTCDay() + 6) % 7;
    const moves: Record<string, () => IsoDate> = {
      ArrowLeft: () => addDays(cur, -1), ArrowRight: () => addDays(cur, 1), ArrowUp: () => addDays(cur, -7), ArrowDown: () => addDays(cur, 7),
      Home: () => addDays(cur, -dow), End: () => addDays(cur, 6 - dow),
      PageUp: () => this.clampToMonth(cur, addMonths(cur, -1)), PageDown: () => this.clampToMonth(cur, addMonths(cur, 1)),
    };
    if (moves[e.key]) {
      e.preventDefault();
      let next = moves[e.key]();
      if (this.min() && next < this.min()!) next = this.min()!;
      if (this.max() && next > this.max()!) next = this.max()!;
      this.keyboard = true;
      this.focusDay.set(next);
      if (!sameMonth(next, this.month())) this.month.set(startOfMonth(next));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); this.choose(cur);
    }
  }
}
