import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';

const LINE_WIDTHS = ['w-[90%]', 'w-3/4', 'w-5/6', 'w-2/3'];
const CELL_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-1/3', 'w-3/5'];

/**
 * Estado de carga con la forma del contenido final (nunca un spinner a pantalla completa). Sobre spartan skeleton.
 * - line: párrafo de [lines] líneas (la última más corta).
 * - block: área (gráfico, imagen); su alto lo da la clase del host (ej. class="h-40").
 * - card: tarjeta de listado (título, dos líneas, pie con dos datos).
 * - table-row: fila de [columns] celdas para tablas.
 * Lo anuncia una sola vez el contenedor con aria-busy; el texto "Cargando" es solo para lectores de pantalla.
 */
@Component({
  selector: 'zc-skeleton',
  imports: [HlmSkeleton, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0', 'aria-busy': 'true' },
  template: `
    <span class="sr-only" role="status">{{ 'ui.cargando' | transloco }}</span>
    @switch (variant()) {
      @case ('line') {
        <div class="grid gap-2" aria-hidden="true">
          @for (w of lineWidths(); track $index) { <span hlmSkeleton [class]="w"></span> }
        </div>
      }
      @case ('block') { <span hlmSkeleton class="h-full min-h-24 w-full rounded-md" aria-hidden="true"></span> }
      @case ('card') {
        <div class="grid gap-3 rounded-md border border-border bg-surface p-5" aria-hidden="true">
          <span hlmSkeleton class="h-4 w-3/5"></span>
          <span hlmSkeleton class="h-3 w-11/12"></span>
          <span hlmSkeleton class="h-3 w-3/4"></span>
          <div class="flex gap-3 pt-1"><span hlmSkeleton class="h-7 w-20 rounded-full"></span><span hlmSkeleton class="h-7 w-24 rounded-full"></span></div>
        </div>
      }
      @case ('table-row') {
        <div class="grid items-center gap-4 border-b border-border py-3" [style.grid-template-columns]="'repeat(' + columns() + ', minmax(0, 1fr))'" aria-hidden="true">
          @for (w of cellWidths(); track $index) { <span hlmSkeleton class="h-3" [class]="w"></span> }
        </div>
      }
    }`,
})
export class SkeletonComponent {
  readonly variant = input<'line' | 'block' | 'card' | 'table-row'>('line');
  readonly lines = input(3);
  readonly columns = input(4);
  /** Como index.html: primera línea de título (16 px, 60 %) y luego texto de 12 px al 90 % y 75 %. */
  readonly lineWidths = computed(() => Array.from({ length: this.lines() }, (_, i) => (i === 0 ? 'h-4 w-3/5' : 'h-3 ' + LINE_WIDTHS[(i - 1) % LINE_WIDTHS.length])));
  readonly cellWidths = computed(() => Array.from({ length: this.columns() }, (_, i) => CELL_WIDTHS[i % CELL_WIDTHS.length]));
}
