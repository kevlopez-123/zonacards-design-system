import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { IconComponent } from '../../atoms/icon/icon.component';
import { IconName } from '../../atoms/icon/icon-registry.generated';
import { injectTranslate } from '../../lang';

/**
 * Anuncio y guía de inicio (o-commerce de index.html), con fondo de marca y cierre. Al cerrar se anuncia y no vuelve
 * (la app guarda el cierre por usuario). Contenido libre: el texto destacado con <strong>.
 *
 * <zc-announcement label="Anuncio" [(open)]="promo">Aprovecha … <strong>20 % de descuento</strong> …</zc-announcement>
 * <zc-onboarding title="Optimiza compras…" [steps]="pasos" [(open)]="guia" />
 */
@Component({
  selector: 'zc-announcement',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.title]': 'null', class: 'contents' },
  template: `
    @if (open()) {
      <div role="region" [attr.aria-label]="label()" class="flex min-w-0 items-center gap-3 rounded-md bg-secondary py-2.5 pr-2 pl-4 text-on-secondary [&_strong]:font-bold">
        <zc-icon [name]="icon()" [size]="20" class="shrink-0" />
        <span class="min-w-0 flex-1 break-words"><ng-content /></span>
        <button type="button" class="grid size-target-sm shrink-0 cursor-pointer place-items-center rounded-sm hover:bg-[color-mix(in_srgb,var(--on-secondary)_14%,transparent)]"
          [attr.aria-label]="t('mol.anuncio.cerrar', { label: label() })" (click)="open.set(false)"><zc-icon name="l:x" [size]="16" /></button>
      </div>
    }`,
})
export class AnnouncementComponent {
  readonly t = injectTranslate();
  readonly label = input.required<string>();
  readonly icon = input<IconName>('l:sparkles');
  readonly open = model(true);
}

@Component({
  selector: 'zc-onboarding',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.title]': 'null', class: 'contents' },
  template: `
    @if (open()) {
      <section class="relative grid min-w-0 gap-3 rounded-lg bg-secondary p-6 pr-14 text-on-secondary max-md:p-4 max-md:pr-12" [attr.aria-label]="title()">
        <button type="button" class="absolute top-3 right-3 grid size-target-sm cursor-pointer place-items-center rounded-sm hover:bg-[color-mix(in_srgb,var(--on-secondary)_14%,transparent)]"
          [attr.aria-label]="t('mol.anuncio.ocultarGuia')" (click)="open.set(false)"><zc-icon name="l:x" [size]="16" /></button>
        <strong class="max-w-[30ch] text-xl leading-7">{{ title() }}</strong>
        <ol class="m-0 grid list-none gap-2 p-0">
          @for (s of steps(); track $index; let i = $index) {
            <li class="flex items-start gap-2 leading-[22px]">
              <span class="grid size-[22px] shrink-0 place-items-center rounded-full bg-(--brand-accent) text-xs font-bold text-(--on-brand-accent)" aria-hidden="true">{{ i + 1 }}</span>{{ s }}
            </li>
          }
        </ol>
      </section>
    }`,
})
export class OnboardingComponent {
  readonly t = injectTranslate();
  readonly title = input.required<string>();
  readonly steps = input.required<readonly string[]>();
  readonly open = model(true);
}
