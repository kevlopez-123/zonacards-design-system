import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { IconComponent } from '../../shared/ui/atoms/icon/icon.component';
import { IconName } from '../../shared/ui/atoms/icon/icon-registry.generated';
import { injectTranslate } from '../../shared/ui/lang';
import { MenuComponent, ZcMenuItem } from '../../shared/ui/molecules/menu/menu.component';
import { SORTABLE, SortableDirective } from '../../shared/ui/molecules/sortable/sortable';
import { DsSectionComponent } from './ds/ds-layout';

interface Cat { id: string; name: string; n: number }
interface Tile { id: string; name: string; icon: IconName; from: string; to: string }

/** Catálogo · Flujos (index.html): reordenar (o-sortable). */
@Component({
  selector: 'zc-catalogo-flows',
  imports: [IconComponent, MenuComponent, SORTABLE, DsSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-12' },
  template: `
    @if (show('o-sortable')) {
      <zc-ds-section dsId="o-sortable" title="Reordenar con drag & drop"
        description="Arrastrar desde el asa o con teclado: Espacio para tomar, flechas para mover, Espacio para soltar y Escape para cancelar. Cada movimiento se anuncia a lectores de pantalla. También hay botones Subir y Bajar en el menú, para quien no puede arrastrar.">
        <div class="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-2">
          <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2.5">
            <h4 id="so-l" class="text-xs font-semibold uppercase tracking-[.04em] text-muted">Orden de categorías en el e-commerce</h4>
            <ol class="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-2 p-0" aria-labelledby="so-l" [(zcSortable)]="cats" [zcSortableLabel]="catLabel" #so="zcSortable">
              @for (c of cats(); track c.id; let i = $index) {
                <li [zcSortableItem]="c" class="flex min-h-target min-w-0 items-center gap-3 rounded-md border border-border bg-surface p-2 transition-shadow duration-(--dur)">
                  <button type="button" zcSortableHandle [item]="c" [label]="t('mol.orden.reordenar', { label: c.name })" aria-describedby="so-help"
                    class="grid size-9 shrink-0 place-items-center rounded-sm text-muted hover:bg-surface-2 hover:text-fg"><zc-icon name="l:grip-vertical" [size]="16" /></button>
                  <span class="w-6 shrink-0 text-center text-[13px] text-subtle num" aria-hidden="true">{{ i + 1 }}</span>
                  <span class="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)]">
                    <span class="break-words font-medium">{{ c.name }}</span>
                    <small class="text-[13px] text-muted num">{{ c.n }} gift cards</small>
                  </span>
                  <zc-menu [label]="t('mol.orden.mas', { label: c.name })" [items]="moveItems(i)" [dense]="true" (select)="onMove(so, c, i, $event)" />
                </li>
              }
            </ol>
            <p id="so-help" class="text-[13px] text-muted">{{ t('mol.orden.ayuda') }}</p>
          </div>
          <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2.5">
            <h4 id="st-l" class="text-xs font-semibold uppercase tracking-[.04em] text-muted">Marcas destacadas (cuadrícula)</h4>
            <ul class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 p-0" aria-labelledby="st-l" [(zcSortable)]="tiles" [zcSortableGrid]="true" [zcSortableLabel]="tileLabel">
              @for (x of tiles(); track x.id; let i = $index) {
                <li [zcSortableItem]="x" class="group relative min-w-0 overflow-hidden rounded-md border border-border bg-surface transition-[border-color,box-shadow] duration-(--dur) hover:border-border-strong hover:shadow-1">
                  <button type="button" zcSortableHandle [item]="x" [label]="t('mol.orden.reordenar', { label: x.name })"
                    class="absolute top-1.5 left-1.5 z-[1] grid size-8 place-items-center rounded-sm bg-surface text-fg opacity-0 shadow-1 group-hover:opacity-100 group-focus-within:opacity-100 aria-pressed:opacity-100 max-md:opacity-100"><zc-icon name="l:grip-vertical" [size]="16" /></button>
                  <div class="grid aspect-[4/3] place-items-center text-(--on-secondary)" [style.background]="'linear-gradient(135deg, var(' + x.from + '), var(' + x.to + '))'" aria-hidden="true"><zc-icon [name]="x.icon" [size]="32" /></div>
                  <div class="flex items-center gap-1 px-2 py-1.5 text-[13px]"><span class="text-muted num" aria-hidden="true">{{ i + 1 }}</span>{{ x.name }}</div>
                </li>
              }
            </ul>
          </div>
        </div>
      </zc-ds-section>
    }`,
})
export class FlowsSection {
  readonly parts = input<string[]>([]);
  readonly show = (id: string) => this.parts().includes(id);
  readonly t = injectTranslate();

  readonly cats = signal<Cat[]>([['Gastronomía', 84], ['Experiencias', 41], ['Moda y accesorios', 37], ['Tecnología', 22], ['Hogar, deco y electro', 19], ['Cuidado personal', 12]]
    .map(([name, n], i) => ({ id: 'c' + i, name: name as string, n: n as number })));
  readonly catLabel = (c: Cat) => c.name;
  readonly tiles = signal<Tile[]>([
    { id: 't0', name: 'Gastronomía', icon: 's:gift', from: '--chart-5', to: '--chart-2' },
    { id: 't1', name: 'Experiencias', icon: 's:flag', from: '--chart-1', to: '--chart-4' },
    { id: 't2', name: 'Tecnología', icon: 's:smartphone', from: '--chart-1', to: '--chart-6' },
    { id: 't3', name: 'Moda', icon: 's:tag', from: '--chart-4', to: '--chart-5' },
    { id: 't4', name: 'Viajes', icon: 's:map-point', from: '--chart-3', to: '--chart-1' },
    { id: 't5', name: 'Hogar', icon: 's:home-2', from: '--chart-2', to: '--chart-5' },
  ]);
  readonly tileLabel = (x: Tile) => x.name;

  moveItems(i: number): ZcMenuItem[] {
    const last = this.cats().length - 1;
    return [
      { id: 'up', label: this.t('mol.orden.subir'), icon: 'l:arrow-up', disabled: i === 0 },
      { id: 'down', label: this.t('mol.orden.bajar'), icon: 'l:arrow-down', disabled: i === last },
      { id: 'first', label: this.t('mol.orden.inicio'), disabled: i === 0 },
      { id: 'last', label: this.t('mol.orden.final'), disabled: i === last },
    ];
  }
  onMove(s: SortableDirective<Cat>, c: Cat, i: number, it: ZcMenuItem) {
    const to = { up: i - 1, down: i + 1, first: 0, last: this.cats().length - 1 }[it.id] ?? i;
    s.move(c, to);
    s.refocus(c);
  }
}
