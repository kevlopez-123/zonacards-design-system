import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LOGOS, LogoName } from './logo-registry.generated';

/**
 * <zc-logo name="visa" [size]="28" [label]="true" /> · logos de medios de pago, redes y marcas (Simple Icons, CC0).
 * Color de marca por defecto; [mono] usa currentColor (fondos oscuros, listas). Empaquetados en build (sin red).
 * Con [label] el logo es una imagen con nombre ("Visa"); sin él es decorativo y el texto va al lado.
 * Usarlos solo para identificar medios de pago, redes y comercios afiliados, sin alterarlos.
 */
@Component({
  selector: 'zc-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-grid shrink-0 place-items-center', '[attr.title]': 'null' },
  template: `
    @if (data(); as d) {
      <svg viewBox="0 0 24 24" [attr.width]="size()" [attr.height]="size()" [attr.role]="label() ? 'img' : null" [attr.aria-label]="label() ? d.t : null" [attr.aria-hidden]="label() ? null : 'true'">
        <path [attr.fill]="mono() ? 'currentColor' : fill()" [attr.d]="d.d" />
      </svg>
    } @else {
      <span class="grid place-items-center rounded-xs bg-surface-3 text-[10px] font-bold" [style.width.px]="size()" [style.height.px]="size()" aria-hidden="true">{{ name().slice(0, 2).toUpperCase() }}</span>
    }`,
})
export class LogoComponent {
  readonly name = input.required<LogoName | string>();
  readonly size = input(24);
  readonly mono = input(false);
  readonly label = input(false);
  readonly data = computed(() => LOGOS[this.name()] ?? null);
  /** Logos negros se vuelven blancos en tema oscuro (como en index.html), para que se vean sobre la superficie. */
  readonly fill = computed(() => { const h = this.data()?.h ?? '000000'; return h === '000000' ? 'var(--text)' : '#' + h; });
}
