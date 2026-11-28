import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, model, signal, viewChild } from '@angular/core';
import { CountryCode } from '@zonacards/ui/core';
import { formatMoney } from '@zonacards/ui/core';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { SpinnerComponent } from '@zonacards/ui/spinner';
import { injectTranslate } from '@zonacards/ui/core';
import { BARE_INPUT, CONTROL_BOX } from '@zonacards/ui/core';
import { FieldComponent } from '@zonacards/ui/field';

export interface Coupon {
  code: string;
  /** pct: porcentaje del subtotal (0,10 = 10 %) · fix: monto fijo · gc: gift card con saldo. */
  kind: 'pct' | 'fix' | 'gc';
  value: number;
  description: string;
  /** No se combina con otros códigos. */
  solo?: boolean;
}
export type CouponCheck = Coupon | { error: 'notFound' } | { error: 'expired'; date: string };

/**
 * Cupones y gift cards: hasta max códigos con reglas de combinación.
 *   <zc-field label="Cupones y gift cards" [optional]="true" [hint]="c.message()" [error]="c.error()" [success]="c.success()">
 *     <zc-coupon-field #c [validate]="validar" [subtotal]="200" country="pe" [(value)]="aplicados" />
 *   </zc-field>
 * validate consulta el código (en la app, el servicio); el campo resuelve repetidos, "no combinable" y el máximo.
 */
@Component({
  selector: 'zc-coupon-field',
  imports: [ButtonDirective, IconComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 gap-2' },
  template: `
    <div class="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
      <div [class]="box" [attr.data-invalid]="!!error()" [attr.data-disabled]="full()">
        <span class="flex h-full shrink-0 items-center pl-4 text-muted" aria-hidden="true"><zc-icon name="s:ticket-sale" [size]="16" /></span>
        <input #inp [class]="input + ' pl-3 uppercase placeholder:normal-case'" autocomplete="off" [id]="field?.controlId" [attr.aria-describedby]="field?.messageId" [attr.aria-invalid]="!!error() || null"
          [placeholder]="t(full() ? 'mol.cupon.maximoAlcanzado' : 'mol.cupon.placeholder', { n: max() })" [disabled]="full()" [value]="draft()"
          (input)="onInput($event)" (keydown.enter)="enter($event)" />
      </div>
      <button zcButton variant="outline" [disabled]="!draft() || busy()" [attr.aria-label]="busy() ? t('mol.cupon.validando') : null" (click)="apply()">
        @if (busy()) { <zc-spinner [size]="16" [label]="t('mol.cupon.validando')" /> } @else { {{ t('ui.aplicar') }} }
      </button>
    </div>
    @if (value().length) {
      <ul class="m-0 grid list-none gap-1.5 p-0" [attr.aria-label]="t('mol.cupon.aplicados')">
        @for (c of value(); track c.code) {
          <li class="flex items-center gap-3 rounded-sm border border-dashed border-success-bd bg-success-bg py-1.5 pr-1 pl-3">
            <zc-icon [name]="c.kind === 'gc' ? 's:gift' : 'l:badge-percent'" [size]="16" class="shrink-0 text-success" />
            <span class="grid grid-cols-[minmax(0,1fr)] min-w-0 flex-1 leading-4.5"><strong class="text-body-sm tracking-[.02em]">{{ c.code }}</strong><small class="text-caption text-muted">{{ c.description }}</small></span>
            <span class="text-body-sm font-semibold text-success num">−{{ money(discount(c)) }}</span>
            <button type="button" class="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-muted hover:bg-surface hover:text-fg" [attr.aria-label]="t('mol.cupon.quitar', { code: c.code })" (click)="remove(c)"><zc-icon name="l:x" [size]="16" /></button>
          </li>
        }
      </ul>
    }`,
})
export class CouponFieldComponent {
  readonly field = inject(FieldComponent, { optional: true });
  readonly t = injectTranslate();
  readonly validate = input.required<(code: string) => Promise<CouponCheck>>();
  readonly subtotal = input(0);
  readonly country = input<CountryCode>('pe');
  readonly max = input(3);
  /** Texto de ayuda cuando no hay otro mensaje (ej. códigos de prueba). */
  readonly hint = input('');
  readonly value = model<Coupon[]>([]);
  readonly box = CONTROL_BOX;
  readonly input = BARE_INPUT;
  private readonly inp = viewChild.required<ElementRef<HTMLInputElement>>('inp');
  readonly draft = signal('');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  private readonly note = signal<string | null>(null);
  readonly full = computed(() => this.value().length >= this.max());
  readonly message = computed(() => this.note() ?? this.hint());
  /** Descuento total de los códigos aplicados (nunca más que el subtotal). */
  readonly total = computed(() => Math.min(this.subtotal(), this.value().reduce((s, c) => s + this.discount(c), 0)));

  money = (v: number) => formatMoney(v, this.country());
  discount(c: Coupon) { return Math.min(this.subtotal(), c.kind === 'pct' ? this.subtotal() * c.value : c.value); }

  onInput(e: Event) {
    const el = e.target as HTMLInputElement; const v = el.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    el.value = v; this.draft.set(v); this.error.set(null);
  }
  enter(e: Event) { e.preventDefault(); this.apply(); }

  async apply() {
    const code = this.draft().trim(); if (!code || this.busy()) return;
    const fail = (key: string, p?: Record<string, unknown>) => { this.error.set(this.t(key, { code, ...p })); this.success.set(null); this.inp().nativeElement.focus(); };
    if (this.value().some(c => c.code === code)) return fail('mol.cupon.repetido');
    this.busy.set(true);
    let r: CouponCheck;
    try { r = await this.validate()(code); } catch { this.busy.set(false); return fail('mol.cupon.errorServicio'); }
    this.busy.set(false);
    if ('error' in r) return r.error === 'expired' ? fail('mol.cupon.vencido', { fecha: r.date }) : fail('mol.cupon.noExiste');
    if (r.solo && this.value().length) return fail('mol.cupon.noCombina');
    if (this.value().some(c => c.solo)) return fail('mol.cupon.tieneSolo');
    this.value.update(v => [...v, r as Coupon]);
    this.draft.set(''); this.error.set(null); this.note.set(null);
    const left = this.max() - this.value().length;
    this.success.set(this.t(left ? 'mol.cupon.aplicadoQuedan' : 'mol.cupon.aplicadoMaximo', { code, n: left }));
    setTimeout(() => this.inp().nativeElement.focus());
  }
  remove(c: Coupon) {
    this.value.update(v => v.filter(x => x.code !== c.code));
    this.success.set(null); this.error.set(null); this.note.set(this.t('mol.cupon.quitado', { code: c.code }));
    setTimeout(() => this.inp().nativeElement.focus());
  }
}
