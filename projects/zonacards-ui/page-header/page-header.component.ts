import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BreadcrumbsComponent, Crumb } from '@zonacards/ui/breadcrumbs';

/**
 * <zc-page-header title="Lotes" subtitle="144 de 1.240 lotes" [crumbs]="…"> acciones </zc-page-header>
 * Migas (desde el tercer nivel) · título de una línea · subtítulo o conteo (se anuncia al cambiar) · acciones.
 * - Desktop: una sola acción principal a la derecha del título; secundarias en outline; descargar como ícono.
 * - Móvil: la acción principal pasa a todo el ancho bajo el título. Las secundarias van en un zc-menu "Más acciones"
 *   (márcalas con class="max-md:hidden" y agrega el menú con class="md:hidden").
 */
@Component({
  selector: 'zc-page-header',
  imports: [BreadcrumbsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.title]': 'null', class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3' },
  template: `
    @if (crumbs().length) { <zc-breadcrumbs [items]="crumbs()" /> }
    <div class="flex min-w-0 flex-wrap items-center gap-3">
      <div class="grid min-w-0 flex-[1_1_200px] gap-0.5">
        @if (level() === 1) {
          <h1 class="break-words text-2xl font-semibold leading-8">{{ title() }}</h1>
        } @else {
          <h2 class="break-words text-2xl font-semibold leading-8">{{ title() }}</h2>
        }
        @if (subtitle()) { <p class="text-sm leading-5 text-muted num" [attr.aria-live]="live() ? 'polite' : null">{{ subtitle() }}</p> }
      </div>
      <div class="flex min-w-0 items-center gap-2 empty:hidden max-md:w-full max-md:[&>a]:flex-1 max-md:[&>button]:flex-1"><ng-content /></div>
    </div>`,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  /** Conteo o descripción breve: "144 de 1.240 lotes". */
  readonly subtitle = input('');
  readonly crumbs = input<readonly Crumb[]>([]);
  /** h1 en páginas; h2 solo para demostrarlo dentro del catálogo. */
  readonly level = input<1 | 2>(1);
  /** Anuncia el subtítulo al cambiar (conteos que dependen de filtros). */
  readonly live = input(true);
}
