import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';

/**
 * <zc-cta-card title="¿Eres una empresa?" text="…" icon="s:buildings-2"><a zcButton variant="secondary" size="sm">Más información</a></zc-cta-card>
 * Llamada a la acción del sitio (o-commerce): fondo con el acento de marca y esquina con el ícono.
 */
@Component({
  selector: 'zc-cta-card',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.title]': 'null',
    class: 'relative grid min-h-[190px] min-w-0 content-start gap-3 overflow-hidden rounded-md bg-[color-mix(in_srgb,var(--brand-accent)_18%,var(--surface))] p-5 pb-6 max-md:min-h-40 max-md:pb-16',
  },
  template: `
    <strong class="break-words">{{ title() }}</strong>
    <span class="max-w-[26ch] text-body-sm">{{ text() }}</span>
    <div class="justify-self-start"><ng-content /></div>
    <span class="absolute right-0 bottom-0 grid h-[76px] w-[84px] place-items-center rounded-tl-3xl bg-secondary text-on-secondary max-md:h-14 max-md:w-16 max-md:rounded-tl-[18px]" aria-hidden="true">
      <zc-icon [name]="icon()" [size]="32" />
    </span>`,
})
export class CtaCardComponent {
  readonly title = input.required<string>();
  readonly text = input.required<string>();
  readonly icon = input.required<IconName>();
}
