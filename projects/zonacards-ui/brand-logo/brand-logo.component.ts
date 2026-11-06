import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * <zc-brand-logo name="Repsol" [src]="logoUrl" /> · logo circular de la marca sobre la imagen del producto (centrado).
 * Sin [src] muestra el nombre en mayúsculas (máx. 8 letras). Decorativo: el nombre ya está en el título de la tarjeta.
 */
@Component({
  selector: 'zc-brand-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    class: 'absolute top-1/2 left-1/2 z-(--z-raised) grid size-16 -translate-1/2 place-items-center overflow-hidden rounded-full bg-(--media-control-bg) px-1.5 text-center text-2xs font-extrabold tracking-[-.01em] text-(--media-control-fg) shadow-2',
  },
  template: `@if (src()) { <img class="size-full object-contain" [src]="src()" alt="" /> } @else { {{ short() }} }`,
})
export class BrandLogoComponent {
  readonly name = input.required<string>();
  readonly src = input<string | null>(null);
  readonly short = computed(() => this.name().toUpperCase().slice(0, 8));
}
