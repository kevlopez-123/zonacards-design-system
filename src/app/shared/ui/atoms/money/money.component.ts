import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, computed, inject, input, signal } from '@angular/core';
import { CountryCode } from '../../../domain/countries';
import { formatMoney, formatMoneyCompact } from '../../../domain/money';

/**
 * Monto completo si cabe; si no, abreviado (K, M, MM) con la cifra completa en tooltip y para lectores de pantalla.
 * No usar en tablas, exportaciones ni documentos financieros: ahí siempre va la cifra completa.
 */
@Component({
  selector: 'zc-money',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0 max-w-full overflow-hidden whitespace-nowrap num', '[attr.title]': 'compact() ? full() : null', '[attr.tabindex]': 'compact() ? 0 : null', '[class.zc-money-compact]': 'compact()' },
  template: `<span class="sr-only">{{ full() }}</span><span #v aria-hidden="true" class="inline-block">{{ compact() ? short() : full() }}</span>`,
  styles: `.zc-money-compact { text-decoration: underline dotted color-mix(in srgb, currentColor 35%, transparent); text-underline-offset: 4px; cursor: help; }`,
})
export class MoneyComponent {
  readonly amount = input.required<number>();
  readonly country = input.required<CountryCode>();
  readonly full = computed(() => formatMoney(this.amount(), this.country()));
  readonly short = computed(() => formatMoneyCompact(this.amount(), this.country()));
  readonly compact = signal(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    const ro = new ResizeObserver(() => this.measure());
    afterRenderEffect(() => { this.full(); ro.observe(this.host.nativeElement); this.measure(); });
  }
  private measure() {
    const el = this.host.nativeElement; const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:inherit'; probe.textContent = this.full();
    el.appendChild(probe); const fits = probe.offsetWidth <= el.clientWidth + 0.5; probe.remove();
    if (this.compact() === fits) this.compact.set(!fits);
  }
}
