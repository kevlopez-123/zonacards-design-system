import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';

/** Slots de <zc-card>: imagen arriba a sangre, inicio del encabezado (avatar), extremo del encabezado (menú o estado) y pie. */
@Directive({ selector: '[zcCardMedia]', host: { class: '-mx-5 -mt-5 block aspect-video overflow-hidden rounded-t-md max-md:-mx-4 max-md:-mt-4' } })
export class CardMediaDirective {}
@Directive({ selector: '[zcCardLead]' })
export class CardLeadDirective {}
@Directive({ selector: '[zcCardAside]', host: { class: 'relative z-[1] shrink-0' } })
export class CardAsideDirective {}
@Directive({ selector: '[zcCardFooter]', host: { class: 'flex min-h-11 min-w-0 flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3 text-[13px] text-muted' } })
export class CardFooterDirective {}

/**
 * <zc-card title="Navidad 2026" subtitle="#02829 · Interbank" icon="s:box" link="/lotes/02829"> · tarjeta de listado (Cards de index.html).
 * - Con [link], el título es el enlace y su área cubre toda la tarjeta (toda la tarjeta abre el detalle); menú y botones quedan encima.
 * - Encabezado: ícono en recuadro ([icon]) o lo que vaya en zcCardLead (avatar); a la derecha, zcCardAside (menú ⋮ o badge).
 * - Cuerpo libre (badges, zc-description-list, zc-progress…) y pie con zcCardFooter. Imagen con zcCardMedia.
 * Para elegir una opción con tarjetas, usa <zc-radio-group variant="card"> con [icon] en cada zc-radio.
 */
@Component({
  selector: 'zc-card',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClass()', '[attr.title]': 'null' },
  template: `
    <ng-content select="[zcCardMedia]" />
    <div class="flex min-w-0 items-start gap-3">
      @if (icon()) { <span class="grid size-10 shrink-0 place-items-center rounded-ms bg-surface-2 text-fg max-md:size-9"><zc-icon [name]="icon()!" /></span> }
      <ng-content select="[zcCardLead]" />
      <div class="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)]">
        @if (link(); as l) {
          <a [routerLink]="l" class="break-words text-base font-semibold leading-[22px] text-fg no-underline after:absolute after:inset-0 after:rounded-md after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-focus">{{ title() }}</a>
        } @else {
          <span class="break-words text-base font-semibold leading-[22px]">{{ title() }}</span>
        }
        @if (subtitle()) { <span class="break-words text-[13px] leading-[18px] text-muted num">{{ subtitle() }}</span> }
      </div>
      <ng-content select="[zcCardAside]" />
    </div>
    <ng-content />
    <ng-content select="[zcCardFooter]" />`,
})
export class CardComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly icon = input<IconName | null>(null);
  readonly link = input<string | unknown[] | null>(null);
  hostClass() {
    return 'relative grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4 rounded-md border border-border bg-surface p-5 max-md:p-4 '
      + (this.link() ? 'transition-[border-color,box-shadow] duration-(--dur) hover:border-border-strong hover:shadow-1 focus-within:border-border-strong' : '');
  }
}

export const CARD = [CardComponent, CardMediaDirective, CardLeadDirective, CardAsideDirective, CardFooterDirective] as const;
