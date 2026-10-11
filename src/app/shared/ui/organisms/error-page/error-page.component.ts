import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '../../atoms/icon/icon.component';
import { IconName } from '../../atoms/icon/icon-registry.generated';

/**
 * <zc-error-page code="404" icon="s:magnifer" title="No encontramos esta página" text="…" reference="ZC-…">
 *   <a zcButton size="sm" routerLink="/">Ir al inicio</a><button zcButton variant="ghost" size="sm">Buscar</button>
 * </zc-error-page>
 * Páginas de error (o-errors): 404, 403, 500, 503, sin conexión y sesión expirada. Qué pasó, qué se conservó y qué hacer;
 * nunca solo un código. Referencia solo cuando soporte la necesita (500, 404). En una ruta, ocupa el centro de la página.
 */
@Component({
  selector: 'zc-error-page',
  imports: [IconComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative grid min-w-0 content-center justify-items-center gap-2 rounded-md border border-border bg-bg px-4 py-6 text-center', '[attr.title]': 'null' },
  template: `
    @if (code()) { <span class="absolute top-2.5 left-3 text-xs text-subtle num">{{ code() }}</span> }
    <span class="grid size-14 place-items-center rounded-2xl bg-surface-2" aria-hidden="true"><zc-icon [name]="icon()" [size]="24" /></span>
    <h3 class="text-base leading-[22px] font-semibold">{{ title() }}</h3>
    <p class="max-w-[34ch] text-[13.5px] leading-5 text-muted">{{ text() }}</p>
    <div class="flex flex-wrap justify-center gap-2 empty:hidden"><ng-content /></div>
    @if (reference()) { <span class="text-xs text-muted num">{{ 'comun.referencia' | transloco }} {{ reference() }}</span> }`,
})
export class ErrorPageComponent {
  readonly code = input('');
  readonly icon = input.required<IconName>();
  readonly title = input.required<string>();
  readonly text = input.required<string>();
  readonly reference = input('');
}
