import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { ScrollAreaDirective } from '@zonacards/ui/core';

export interface ZcSubnavItem { id: string; label: string; link?: string; icon?: IconName; }

/**
 * Menú secundario (configuración, layout 3 "Riel + menú secundario" de index.html).
 * Desktop y tablet: columna con la lista de secciones. Móvil: pestañas desplazables arriba del contenido.
 * Con link navega (routerLink); sin link emite el cambio en [(current)].
 */
@Component({
  selector: 'zc-subnav',
  imports: [RouterLink, IconComponent, ScrollAreaDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  template: `
    <nav [attr.aria-label]="label()" class="min-w-0">
      <span class="hidden px-3 pt-1 pb-2 text-xs font-semibold uppercase tracking-[.04em] text-muted md:block" aria-hidden="true">{{ label() }}</span>
      <ul zcScrollArea class="m-0 flex list-none gap-1 overflow-x-auto p-0 max-md:border-b max-md:border-border md:grid md:overflow-visible">
        @for (it of items(); track it.id) {
          <li class="shrink-0">
            @if (it.link) {
              <a [routerLink]="it.link" [attr.aria-current]="current() === it.id ? 'page' : null" [class]="itemClass" (click)="current.set(it.id)">
                @if (it.icon) { <zc-icon [name]="it.icon" [size]="16" /> }{{ it.label }}</a>
            } @else {
              <button type="button" [attr.aria-current]="current() === it.id ? 'page' : null" [class]="itemClass" (click)="current.set(it.id)">
                @if (it.icon) { <zc-icon [name]="it.icon" [size]="16" /> }{{ it.label }}</button>
            }
          </li>
        }
      </ul>
    </nav>`,
})
export class SubnavComponent {
  readonly items = input.required<ZcSubnavItem[]>();
  readonly label = input.required<string>();
  readonly current = model<string | null>(null);
  // Móvil: pestaña con borde inferior (como tabs de línea). Desktop: fila de lista con fondo al estar activa.
  readonly itemClass = 'flex min-h-11 w-full cursor-pointer items-center gap-2 whitespace-nowrap px-3 text-left text-body-sm text-muted no-underline transition-colors duration-(--dur) hover:text-fg '
    + 'max-md:-mb-px max-md:border-b-2 max-md:border-transparent max-md:aria-[current=page]:border-fg '
    + 'md:rounded-sm md:hover:bg-surface-2 aria-[current=page]:font-medium aria-[current=page]:text-fg md:aria-[current=page]:bg-surface-2';
}
