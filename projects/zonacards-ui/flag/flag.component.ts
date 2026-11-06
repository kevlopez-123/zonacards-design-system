import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CountryCode } from '@zonacards/ui/core';

/**
 * Bandera SVG de flag-icons (MIT), servida desde /flags/<código>.svg y cargada solo cuando se usa.
 * Decorativa: siempre va junto al nombre o código del país. Nunca emojis.
 */
@Component({
  selector: 'zc-flag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block shrink-0 overflow-hidden rounded-[3px] shadow-hairline leading-none' },
  template: `<img [src]="'flags/' + code() + '.svg'" alt="" [width]="size() * 4 / 3" [height]="size()" loading="lazy" decoding="async" class="block" />`,
})
export class FlagComponent {
  readonly code = input.required<CountryCode | string>();
  readonly size = input(18);
}
