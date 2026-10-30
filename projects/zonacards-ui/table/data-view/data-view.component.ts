import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Directive, TemplateRef, computed, contentChild, inject, input, model } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '@zonacards/ui/icon';
import { TooltipDirective } from '@zonacards/ui/tooltip';
import { WIDE_QUERY, injectMedia } from '@zonacards/ui/core';
import { CheckboxComponent } from '@zonacards/ui/checkbox';
import { BulkActionsDirective } from '../data-table/data-table.component';

export type DataViewMode = 'cards' | 'table';

@Directive({ selector: 'ng-template[zcCardsView]' })
export class CardsViewDirective { readonly tpl = inject(TemplateRef); }

@Directive({ selector: 'ng-template[zcTableView]' })
export class TableViewDirective { readonly tpl = inject(TemplateRef); }

/**
 * <zc-data-view [(view)]="vista"> · listado en tarjetas por defecto; tabla como alternativa desde 1024 px.
 * Por debajo de 1024 px no existe el selector y siempre se ven tarjetas.
 * [zcDataViewBar]: conteo y orden a la izquierda del selector. Plantillas: ng-template zcCardsView y zcTableView.
 * Selección en tarjetas: [selectable] + [(selection)] (ids) + [ids] (los de la página, para "Seleccionar todas") y
 * <ng-template zcBulkActions let-ids> con las acciones. La barra de acciones masivas es la misma de zc-data-table; en la vista tabla
 * la dibuja la tabla (pásale la misma selección).
 */
@Component({
  selector: 'zc-data-view',
  imports: [NgTemplateOutlet, TranslocoPipe, IconComponent, TooltipDirective, CheckboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4' },
  template: `
    <div class="flex min-w-0 flex-wrap items-center gap-3">
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3"><ng-content select="[zcDataViewBar]" /></div>
      @if (wide() && tableTpl()) {
        <div role="radiogroup" [attr.aria-label]="'org.vista' | transloco" class="inline-flex shrink-0 gap-1 rounded-full bg-surface-2 p-1" (keydown)="onKey($event)">
          @for (o of options; track o.v) {
            <button type="button" role="radio" [attr.aria-checked]="view() === o.v" [attr.tabindex]="view() === o.v ? 0 : -1" [attr.aria-label]="o.key | transloco"
              [zcTooltip]="o.key | transloco" (click)="view.set(o.v)"
              class="grid h-[calc(var(--target)-8px)] w-12 cursor-pointer place-items-center rounded-full text-muted transition-colors aria-checked:bg-surface aria-checked:text-fg aria-checked:shadow-1">
              <zc-icon [name]="o.icon" [size]="16" />
            </button>
          }
        </div>
      }
    </div>
    @if (effective() === 'cards' && selectable()) {
      <span class="sr-only" aria-live="polite">{{ selection().length ? ('ui.nSeleccionados' | transloco: { n: selection().length }) : '' }}</span>
      @if (selection().length) {
        <div role="region" [attr.aria-label]="'org.accionesMasivas' | transloco"
          class="sticky top-[calc(var(--topbar-h)+8px)] z-10 flex min-h-target min-w-0 flex-wrap items-center gap-2 rounded-md bg-primary py-1.5 pr-2 pl-4 text-on-primary shadow-2 [&_button]:text-on-primary [&_button:hover]:bg-[color-mix(in_srgb,var(--on-primary)_14%,transparent)]">
          <span class="num text-[15px] font-medium">{{ 'ui.nSeleccionados' | transloco: { n: selection().length } }}</span>
          <span class="flex-1"></span>
          @if (bulkTpl(); as b) { <ng-container *ngTemplateOutlet="b.tpl; context: { $implicit: selection() }" /> }
          <button type="button" class="grid size-target-sm cursor-pointer place-items-center rounded-full" [attr.aria-label]="'org.quitarSeleccion' | transloco" (click)="selection.set([])"><zc-icon name="l:x" [size]="16" /></button>
        </div>
      } @else if (ids().length) {
        <zc-checkbox [checked]="false" (checkedChange)="selectAll($event)">{{ 'org.seleccionarTodos' | transloco }}</zc-checkbox>
      }
    }
    @if (effective() === 'table' && tableTpl(); as t) {
      <ng-container *ngTemplateOutlet="t.tpl" />
    } @else if (cardsTpl(); as c) {
      <ng-container *ngTemplateOutlet="c.tpl" />
    }`,
})
export class DataViewComponent {
  readonly view = model<DataViewMode>('cards');
  readonly selectable = input(false);
  /** Ids seleccionados (en tarjetas, cada zc-card con su checkbox los actualiza). */
  readonly selection = model<string[]>([]);
  /** Ids de la página visible, para "Seleccionar todas". */
  readonly ids = input<readonly string[]>([]);
  readonly bulkTpl = contentChild(BulkActionsDirective, { descendants: false });
  readonly wide = injectMedia(WIDE_QUERY);
  readonly cardsTpl = contentChild(CardsViewDirective);
  readonly tableTpl = contentChild(TableViewDirective);
  readonly effective = computed<DataViewMode>(() => (this.wide() ? this.view() : 'cards'));
  readonly options = [
    { v: 'cards' as const, key: 'org.tarjetas', icon: 'l:layout-grid' as const },
    { v: 'table' as const, key: 'org.tabla', icon: 'l:table-2' as const },
  ];

  selectAll(v: boolean) { this.selection.set(v ? [...this.ids()] : []); }
  /** Agrega o quita un id (checkbox de una tarjeta). */
  toggle(id: string, v: boolean) { this.selection.update(s => (v ? (s.includes(id) ? s : [...s, id]) : s.filter(x => x !== id))); }
  isSelected(id: string) { return this.selection().includes(id); }

  /** Grupo de radio: flechas cambian la vista y mueven el foco. */
  onKey(e: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const next = this.view() === 'cards' ? 'table' : 'cards';
    this.view.set(next);
    const btns = (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="radio"]');
    btns[next === 'cards' ? 0 : 1]?.focus();
  }
}
