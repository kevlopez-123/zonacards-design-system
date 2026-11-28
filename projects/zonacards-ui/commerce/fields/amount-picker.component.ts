import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, model, signal, viewChild, viewChildren } from '@angular/core';
import { CountryCode } from '@zonacards/ui/core';
import { currencySymbol, formatMoney, formatMoneyWhole, formatNumber } from '@zonacards/ui/core';
import { TooltipDirective } from '@zonacards/ui/tooltip';
import { injectTranslate } from '@zonacards/ui/core';
import { CONTROL_BOX, BARE_INPUT } from '@zonacards/ui/core';
import { FieldComponent } from '@zonacards/ui/field';

/**
 * <zc-field label="¿De cuánto será el valor?" [required]="true" [hint]="a.message()" [error]="a.error()">
 *   <zc-amount-picker #a [amounts]="[50, 100, 150, 200]" [soldOut]="[500]" country="pe" [(value)]="monto" />
 * </zc-field>
 * Montos como radiogroup (flechas recorren y eligen), "Otro" abre un monto libre entre min y max, agotados tachados.
 */
@Component({
  selector: 'zc-amount-picker',
  imports: [TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 gap-2' },
  template: `
    <div class="flex flex-wrap gap-2" role="radiogroup" [attr.aria-labelledby]="field?.labelId" [attr.aria-describedby]="field?.messageId" (keydown)="onKey($event)">
      @for (a of amounts(); track a) {
        <button #opt type="button" role="radio" [class]="chip" [class.zc-on]="!other() && value() === a" [attr.aria-checked]="!other() && value() === a"
          [tabIndex]="!other() && value() === a || (focusFirst() && $first) ? 0 : -1" (click)="pick(a)">{{ fmt(a) }}</button>
      }
      @if (allowOther()) {
        <button #opt type="button" role="radio" [class]="chip" [class.zc-on]="other()" [attr.aria-checked]="other()" [tabIndex]="other() ? 0 : -1" (click)="pickOther()">{{ t('mol.monto.otro') }}</button>
      }
      @for (s of soldOut(); track s) {
        <span tabindex="0" class="inline-flex rounded-sm [&>button]:pointer-events-none" [zcTooltip]="t('mol.monto.agotadoCorto')"><button type="button" [class]="chip" disabled [attr.aria-label]="t('mol.monto.agotado', { monto: fmt(s) })">{{ fmt(s) }}</button></span>
      }
    </div>
    @if (other()) {
      <div [class]="box" [attr.data-invalid]="!!otherError()">
        <span class="flex h-full shrink-0 items-center pl-4 text-muted num" aria-hidden="true">{{ symbol() }}</span>
        <input #otherIn [class]="input + ' pl-2'" inputmode="numeric" autocomplete="off" [attr.aria-label]="t('mol.monto.otroMonto')" [attr.aria-describedby]="field?.messageId"
          [attr.aria-invalid]="!!otherError() || null" [placeholder]="t('mol.monto.entre', { min: fmtShort(min()), max: fmtShort(max()) })"
          [value]="otherRaw()" (beforeinput)="digits($event)" (input)="onOther($event)" (blur)="touched.set(true)" />
      </div>
    }`,
  styles: `.zc-on { border-color: var(--primary); box-shadow: inset 0 0 0 1px var(--primary); background: color-mix(in srgb, var(--primary) 8%, var(--surface)); font-weight: 600; }`,
})
export class AmountPickerComponent {
  readonly field = inject(FieldComponent, { optional: true });
  readonly t = injectTranslate();
  readonly amounts = input.required<number[]>();
  readonly soldOut = input<number[]>([]);
  readonly allowOther = input(true);
  readonly min = input(10);
  readonly max = input(1000);
  readonly country = input<CountryCode>('pe');
  /** Monto elegido; null si "Otro" está vacío. */
  readonly value = model<number | null>(null);
  readonly chip = 'h-field min-w-[76px] cursor-pointer rounded-control border border-field-bd bg-field-bg px-4 text-body text-fg num transition hover:enabled:bg-(--state-hover-bg) disabled:cursor-not-allowed disabled:line-through disabled:opacity-(--opacity-disabled)';
  readonly box = CONTROL_BOX;
  readonly input = BARE_INPUT + ' num';
  private readonly chips = viewChildren<ElementRef<HTMLButtonElement>>('opt');
  private readonly otherIn = viewChild<ElementRef<HTMLInputElement>>('otherIn');
  readonly other = signal(false);
  readonly otherRaw = signal('');
  readonly touched = signal(false);
  readonly focusFirst = computed(() => !this.other() && !this.amounts().includes(this.value() ?? NaN));
  readonly symbol = computed(() => currencySymbol(this.country()));

  fmt = (v: number) => formatMoneyWhole(v, this.country());
  fmtShort = (v: number) => formatNumber(v, this.country());
  readonly otherError = computed(() => {
    if (!this.other() || !this.touched()) return null;
    const v = this.value();
    if (v === null) return this.t('mol.monto.ingresa');
    return v < this.min() || v > this.max() ? this.t('mol.monto.rango', { min: this.fmt(this.min()), max: this.fmt(this.max()) }) : null;
  });
  /** Para el zc-field: mensaje de error y "Total: S/ 50.00". */
  readonly error = this.otherError;
  readonly message = computed(() => this.t('mol.monto.total', { total: this.value() ? formatMoney(this.value()!, this.country()) : '—' }));

  pick(a: number) { this.other.set(false); this.touched.set(false); this.value.set(a); }
  pickOther() {
    this.other.set(true); this.value.set(this.otherRaw() ? +this.otherRaw() : null);
    setTimeout(() => this.otherIn()?.nativeElement.focus());
  }
  digits(e: Event) { const d = (e as InputEvent).data; if (d && /\D/.test(d)) { e.preventDefault(); this.field?.flash(this.t('ui.soloEnteros')); } }
  onOther(e: Event) {
    const el = e.target as HTMLInputElement; const d = el.value.replace(/\D/g, ''); el.value = d;
    this.otherRaw.set(d); this.value.set(d ? +d : null);
  }
  onKey(e: KeyboardEvent) {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    const list = this.chips().map(c => c.nativeElement); const i = list.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    const n = list[(i + d + list.length) % list.length]; n.focus(); n.click();
  }
}
