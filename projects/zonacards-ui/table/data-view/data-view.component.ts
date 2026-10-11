import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Directive, TemplateRef, computed, contentChild, inject, model } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '@zonacards/ui/icon';
import { TooltipDirective } from '@zonacards/ui/tooltip';
import { WIDE_QUERY, injectMedia } from '@zonacards/ui/core';

export type DataViewMode = 'cards' | 'table';

@Directive({ selector: 'ng-template[zcCardsView]' })
export class CardsViewDirective { readonly tpl = inject(TemplateRef); }

@Directive({ selector: 'ng-template[zcTableView]' })
export class TableViewDirective { readonly tpl = inject(TemplateRef); }

/**
 * <zc-data-view [(view)]="vista"> · listado en tarjetas por defecto; tabla como alternativa desde 1024 px.
 * Por debajo de 1024 px no existe el selector y siempre se ven tarjetas.
 * [zcDataViewBar]: conteo y orden a la izquierda del selector. Plantillas: ng-template zcCardsView y zcTableView.
 */
@Component({
  selector: 'zc-data-view',
  imports: [NgTemplateOutlet, TranslocoPipe, IconComponent, TooltipDirective],
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
    @if (effective() === 'table' && tableTpl(); as t) {
      <ng-container *ngTemplateOutlet="t.tpl" />
    } @else if (cardsTpl(); as c) {
      <ng-container *ngTemplateOutlet="c.tpl" />
    }`,
})
export class DataViewComponent {
  readonly view = model<DataViewMode>('cards');
  readonly wide = injectMedia(WIDE_QUERY);
  readonly cardsTpl = contentChild(CardsViewDirective);
  readonly tableTpl = contentChild(TableViewDirective);
  readonly effective = computed<DataViewMode>(() => (this.wide() ? this.view() : 'cards'));
  readonly options = [
    { v: 'cards' as const, key: 'org.tarjetas', icon: 'l:layout-grid' as const },
    { v: 'table' as const, key: 'org.tabla', icon: 'l:table-2' as const },
  ];

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
