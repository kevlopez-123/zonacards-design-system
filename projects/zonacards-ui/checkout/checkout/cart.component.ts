import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, computed, inject, input, model, output } from '@angular/core';
import { CountryCode } from '@zonacards/ui/core';
import { formatMoney } from '@zonacards/ui/core';
import { ArtComponent } from '@zonacards/ui/art';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { TooltipDirective } from '@zonacards/ui/tooltip';
import { injectTranslate } from '@zonacards/ui/core';
import { NumberFieldComponent } from '@zonacards/ui/number-field';
import { ToastService } from '@zonacards/ui/toast';
import { StateComponent } from '@zonacards/ui/state';

export interface ZcCartLine { id: string; name: string; brand: string; category: string; price: number; qty: number; /** "Para mí", "Para regalar". */ note?: string }
export interface ZcCartFee { label: string; amount: number; /** Explicación del cargo (tooltip del ícono ?). */ info?: string }

/**
 * <zc-cart [(lines)]="carrito" country="pe" [discount]="cupones" [fees]="cargos"> <zc-coupon-field zcCartCoupon … /> </zc-cart>
 * Carrito con cantidades (1 a 10), quitar, cupón (contenido con zcCartCoupon), resumen con cargos explicados y total.
 * Vacío: estado con [zcCartEmpty]. Lo usa el checkout (o-checkout de index.html) en la columna de resumen.
 */
@Component({
  selector: 'zc-cart',
  imports: [ArtComponent, ButtonDirective, IconComponent, TooltipDirective, NumberFieldComponent, StateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-(--space-card) rounded-card border border-border bg-surface p-(--space-card-inset)' },
  template: `
    <strong class="text-title-sm">{{ t('mol.carrito.titulo') }} @if (items()) { <span class="font-normal text-muted num">({{ items() }})</span> }</strong>
    @if (lines().length) {
      <ul class="m-0 grid list-none grid-cols-[minmax(0,1fr)] p-0" [attr.aria-label]="t('mol.carrito.productos')">
        @for (l of lines(); track l.id) {
          <li class="grid grid-cols-[56px_minmax(0,1fr)] gap-x-3 gap-y-2 border-b border-border py-3 last:border-b-0 max-[479px]:grid-cols-[44px_minmax(0,1fr)]">
            <span class="row-span-2 size-14 overflow-hidden rounded-[10px] max-[479px]:size-11"><zc-art [category]="l.category" [size]="20" /></span>
            <span class="grid min-w-0 gap-0.5">
              <strong class="break-words text-body leading-5.25">{{ l.name }}</strong>
              <small class="text-caption leading-4.5 text-muted">{{ l.brand }}@if (l.note) { · {{ l.note }} } · {{ t('mol.carrito.cu', { precio: money(l.price) }) }}</small>
            </span>
            <span class="flex min-w-0 flex-wrap items-center gap-2">
              <zc-number-field class="w-[152px]" [min]="1" [max]="10" [value]="l.qty" (valueChange)="setQty(l, $event)" [ariaLabel]="t('mol.carrito.cantidadDe', { name: l.name })" />
              <button zcButton variant="ghost" size="icon-sm" [attr.data-rm]="l.id" [attr.aria-label]="t('mol.carrito.eliminar', { name: l.name })" [zcTooltip]="t('mol.carrito.eliminarCorto')" (click)="remove(l)"><zc-icon name="s:trash-bin-trash" [size]="16" /></button>
              <strong class="ml-auto text-body num">{{ money(l.price * l.qty) }}</strong>
            </span>
          </li>
        }
      </ul>
      <ng-content select="[zcCartCoupon]" />
      <div class="grid gap-1.5 text-body-sm">
        <div class="flex items-center justify-between gap-3 leading-6"><span class="text-muted">{{ t('mol.carrito.subtotal') }}</span><span class="num">{{ money(subtotal()) }}</span></div>
        @if (discountApplied()) {
          <div class="flex items-center justify-between gap-3 leading-6 text-success"><span>{{ t('mol.carrito.descuento') }}</span><span class="num">−{{ money(discountApplied()) }}</span></div>
        }
        @for (f of fees(); track f.label) {
          <div class="flex items-center justify-between gap-3 leading-6">
            <span class="inline-flex items-center gap-1 text-muted">{{ f.label }}
              @if (f.info) { <button type="button" class="grid size-6 cursor-help place-items-center rounded-full" [attr.aria-label]="f.info" [zcTooltip]="f.info"><zc-icon name="s:question-circle" [size]="16" /></button> }
            </span>
            <span class="num">{{ money(f.amount) }}</span>
          </div>
        }
        <div class="mt-1 flex items-center justify-between gap-3 border-t border-border pt-2 text-title-sm font-bold"><span>{{ t('mol.carrito.total') }}</span><span class="num">{{ money(total()) }}</span></div>
      </div>
      <p class="flex items-center justify-center gap-1.5 text-caption text-success"><zc-icon name="s:shield-check" [size]="16" />{{ t('mol.carrito.seguro') }}</p>
    } @else {
      <zc-state icon="s:cart-large-2" [title]="t('mol.carrito.vacio')" [text]="t('mol.carrito.vacioTexto')"><ng-content select="[zcCartEmpty]" /></zc-state>
    }`,
})
export class CartComponent {
  readonly t = injectTranslate();
  private readonly toast = inject(ToastService);
  private readonly live = inject(LiveAnnouncer);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  readonly lines = model.required<ZcCartLine[]>();
  readonly country = input.required<CountryCode>();
  /** Descuento de cupones (se limita al subtotal). */
  readonly discount = input(0);
  readonly fees = input<readonly ZcCartFee[]>([]);
  readonly removed = output<ZcCartLine>();

  readonly items = computed(() => this.lines().reduce((s, l) => s + l.qty, 0));
  readonly subtotal = computed(() => this.lines().reduce((s, l) => s + l.price * l.qty, 0));
  readonly discountApplied = computed(() => Math.min(this.discount(), this.subtotal()));
  readonly total = computed(() => Math.max(0, this.subtotal() - this.discountApplied() + this.fees().reduce((s, f) => s + f.amount, 0)));

  money(n: number) { return formatMoney(n, this.country()); }
  setQty(l: ZcCartLine, q: number | null) { this.lines.update(a => a.map(x => (x.id === l.id ? { ...x, qty: Math.max(1, Math.min(10, q ?? 1)) } : x))); }
  remove(l: ZcCartLine) {
    const i = this.lines().indexOf(l);
    this.lines.update(a => a.filter(x => x.id !== l.id));
    this.toast.info(this.t('mol.carrito.eliminado'), { text: l.name });
    this.removed.emit(l);
    afterNextRender(() => {
      const btns = this.host.querySelectorAll<HTMLElement>('[data-rm]');
      (btns[Math.min(i, btns.length - 1)] ?? this.host.querySelector<HTMLElement>('button'))?.focus();
    }, { injector: this.injector });
  }
}
