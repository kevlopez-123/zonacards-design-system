import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';

export type ArtCategory = 'Gastronomía' | 'Experiencias' | 'Tecnología' | 'Moda' | 'Viajes' | 'Entretenimiento' | 'Hogar' | 'Salud y belleza';

/** Ícono y degradado (tokens de gráficos) por categoría: imagen de reemplazo mientras la marca no sube la suya. */
const ART: Record<ArtCategory, [IconName, string, string]> = {
  Gastronomía: ['s:gift', '--chart-5', '--chart-2'], Experiencias: ['s:flag', '--chart-1', '--chart-4'], Tecnología: ['s:smartphone', '--chart-1', '--chart-6'],
  Moda: ['s:tag', '--chart-4', '--chart-5'], Viajes: ['s:map-point', '--chart-3', '--chart-1'], Entretenimiento: ['s:ticket', '--chart-4', '--chart-1'],
  Hogar: ['s:home-2', '--chart-2', '--chart-5'], 'Salud y belleza': ['s:star', '--chart-3', '--chart-4'],
};

/** <zc-art category="Viajes" /> · ilustración de categoría que llena su contenedor (decorativa). */
@Component({
  selector: 'zc-art',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid size-full place-items-center text-(--on-secondary)', 'aria-hidden': 'true', '[style.background]': 'bg()' },
  template: `<zc-icon [name]="art()[0]" [size]="size()" />`,
})
export class ArtComponent {
  readonly category = input.required<ArtCategory | string>();
  readonly size = input<16 | 20 | 24 | 32>(32);
  readonly art = computed(() => ART[this.category() as ArtCategory] ?? ART.Gastronomía);
  readonly bg = computed(() => `linear-gradient(135deg, var(${this.art()[1]}), var(${this.art()[2]}))`);
}
