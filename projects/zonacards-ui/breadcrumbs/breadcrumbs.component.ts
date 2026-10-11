import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '@zonacards/ui/icon';
import { TooltipDirective } from '@zonacards/ui/tooltip';

export interface Crumb {
  label: string;
  /** Ruta del enlace (routerLink). El último elemento es la página actual y no lleva enlace. */
  link?: string | readonly unknown[];
}

/**
 * <zc-breadcrumbs [items]="…" /> · migas de pan, solo desde el tercer nivel.
 * Desktop: ruta completa. Móvil (menos de 768 px): Inicio, "…", padre y actual; "…" muestra la ruta completa.
 * El primer elemento lleva el ícono de inicio; el actual tiene aria-current="page".
 */
@Component({
  selector: 'zc-breadcrumbs',
  imports: [RouterLink, IconComponent, TooltipDirective, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  template: `
    <nav [attr.aria-label]="'ui.migas' | transloco">
      <ol class="m-0 flex list-none flex-wrap items-center gap-1.5 p-0 text-sm text-muted">
        @for (c of items(); track $index; let i = $index; let first = $first; let last = $last) {
          @if (i === 1 && collapsible()) {
            <li class="inline-flex items-center gap-1.5 md:hidden">
              <zc-icon name="s:alt-arrow-right" [size]="16" class="text-subtle" />
              <button type="button" class="inline-flex min-h-8 cursor-pointer items-center rounded-xs px-1 text-muted hover:text-fg"
                [attr.aria-label]="'ui.mostrarRuta' | transloco" [zcTooltip]="hiddenPath()" (click)="expanded.set(true)">…</button>
            </li>
          }
          <li [class]="isHiddenOnMobile(i) ? 'inline-flex min-w-0 items-center gap-1.5 max-md:hidden' : 'inline-flex min-w-0 items-center gap-1.5'">
            @if (!first) { <zc-icon name="s:alt-arrow-right" [size]="16" class="text-subtle" /> }
            @if (last) {
              <span aria-current="page" class="min-w-0 break-words font-medium text-fg">{{ c.label }}</span>
            } @else {
              <a [routerLink]="c.link ?? null" class="inline-flex min-h-8 min-w-0 items-center gap-1.5 break-words text-inherit no-underline hover:text-fg hover:underline">
                @if (first) { <zc-icon name="s:home-2" [size]="16" /> }{{ c.label }}
              </a>
            }
          </li>
        }
      </ol>
    </nav>`,
})
export class BreadcrumbsComponent {
  readonly items = input.required<readonly Crumb[]>();
  readonly expanded = signal(false);
  /** En móvil se acorta si hay más de 3 niveles (inicio, padre y actual siempre visibles). */
  readonly collapsible = computed(() => this.items().length > 3 && !this.expanded());
  readonly hiddenPath = computed(() => this.items().slice(1, -2).map(c => c.label).join(' / '));
  isHiddenOnMobile(i: number) { return this.collapsible() && i > 0 && i < this.items().length - 2; }
}
