import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, Directive, ElementRef, TemplateRef, computed, contentChild, contentChildren, inject, input, linkedSignal, model, viewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  ColumnDef, RowSelectionState, SortingState, TableOptionsResolved, VisibilityState, createTable, getCoreRowModel, getSortedRowModel,
} from '@tanstack/angular-table';
import { CheckboxComponent } from '../../atoms/checkbox/checkbox.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { IconName } from '../../atoms/icon/icon-registry.generated';
import { SkeletonComponent } from '../../atoms/skeleton/skeleton.component';
import { TooltipDirective } from '../../atoms/tooltip/tooltip.directive';
import { injectLang, injectTranslate } from '../../lang';
import { Panel } from '../../molecules/panel/panel';
import { ScrollAreaDirective } from '../../scroll-area';
import { NARROW_QUERY, injectMedia } from '../../viewport';

export interface ZcColumn<T> {
  id: string;
  header: string;
  /** Valor para ordenar y para la celda por defecto (sin plantilla zcCell). */
  value?: (row: T) => string | number | null | undefined;
  align?: 'start' | 'end';
  sortable?: boolean;
  /** Se puede ocultar desde "Columnas" (la primera columna, nunca). */
  hideable?: boolean;
  /** Oculta de entrada. */
  hidden?: boolean;
}
export type ZcSort = { id: string; desc: boolean } | null;
export type ZcDensity = 'comfortable' | 'compact';

export interface CellContext<T> { $implicit: T; value: unknown; }
export interface CardContext<T> { $implicit: T; selected: boolean; toggle: (v: boolean) => void; }

@Directive({ selector: 'ng-template[zcCell]' })
export class CellDefDirective<T = unknown> {
  readonly zcCell = input.required<string>();
  /** Solo para tipar la plantilla: [zcCellOf]="filas". */
  readonly zcCellOf = input<readonly T[]>();
  readonly tpl = inject<TemplateRef<CellContext<T>>>(TemplateRef);
  static ngTemplateContextGuard<T>(_d: CellDefDirective<T>, ctx: unknown): ctx is CellContext<T> { return true; }
}
@Directive({ selector: 'ng-template[zcRowDetail]' })
export class RowDetailDirective { readonly tpl = inject(TemplateRef); }
@Directive({ selector: 'ng-template[zcRowActions]' })
export class RowActionsDirective { readonly tpl = inject(TemplateRef); }
@Directive({ selector: 'ng-template[zcRowCard]' })
export class RowCardDirective { readonly tpl = inject(TemplateRef); }
@Directive({ selector: 'ng-template[zcBulkActions]' })
export class BulkActionsDirective { readonly tpl = inject(TemplateRef); }

/** Orden natural según el idioma: números por valor, textos sin distinguir tildes ni mayúsculas, vacíos al final. */
export function compareValues(a: unknown, b: unknown, lang = 'es'): number {
  const na = a === null || a === undefined || a === '', nb = b === null || b === undefined || b === '';
  if (na || nb) return na === nb ? 0 : na ? 1 : -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), lang, { sensitivity: 'base', numeric: true });
}

/**
 * <zc-data-table> · vista tabla de un listado (sobre TanStack Table; solo en desktop, sección 1 de las reglas).
 * - Orden por columna con aria-sort; selección con barra de acciones masivas; columnas visibles; densidad;
 *   fila expandible (zcRowDetail); primera columna, selección y acciones fijas con sombra.
 * - Cargando: filas skeleton. Sin filas: muestra [zcTableEmpty] (vacía, sin resultados) en lugar de la tabla.
 * - Menos de 768 px: tarjetas (zcRowCard) y se ocultan columnas y densidad.
 * Plantillas: zcCell="id" (let-row, let-value="value"), zcRowActions, zcRowDetail, zcRowCard, zcBulkActions (let-ids).
 */
@Component({
  selector: 'zc-data-table',
  imports: [NgTemplateOutlet, TranslocoPipe, CheckboxComponent, IconComponent, SkeletonComponent, TooltipDirective, ScrollAreaDirective],
  providers: [Panel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3' },
  template: `
    <div class="flex min-w-0 flex-wrap items-center gap-2">
      <div class="flex min-w-0 flex-[1_1_220px] flex-wrap items-center gap-2"><ng-content select="[zcTableTools]" /></div>
      @if (!narrow()) {
        @if (hideable().length) {
          <button #colBtn type="button" class="inline-flex h-target-sm shrink-0 cursor-pointer items-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-sm font-medium hover:bg-surface-2"
            aria-haspopup="dialog" [attr.aria-expanded]="panel.isOpen()" (click)="openColumns()">
            <zc-icon name="l:columns-3" [size]="16" />{{ 'org.columnas' | transloco }}
          </button>
        }
        <div role="radiogroup" [attr.aria-label]="'org.densidad' | transloco" class="inline-flex shrink-0 gap-1 rounded-full bg-surface-2 p-1" (keydown)="onDensityKey($event)">
          @for (d of densities; track d.v) {
            <button type="button" role="radio" [attr.aria-checked]="density() === d.v" [attr.tabindex]="density() === d.v ? 0 : -1" [attr.aria-label]="d.key | transloco"
              [zcTooltip]="d.key | transloco" (click)="density.set(d.v)"
              class="grid h-[calc(var(--target-sm)-8px)] w-10 cursor-pointer place-items-center rounded-full text-muted aria-checked:bg-surface aria-checked:text-fg aria-checked:shadow-1">
              <zc-icon [name]="d.icon" [size]="16" />
            </button>
          }
        </div>
      }
    </div>

    <span class="sr-only" aria-live="polite">{{ selection().length ? ('ui.nSeleccionados' | transloco: { n: selection().length }) : '' }}</span>
    @if (selectable() && selection().length) {
      <div role="region" [attr.aria-label]="'org.accionesMasivas' | transloco"
        class="flex min-h-target min-w-0 flex-wrap items-center gap-2 rounded-md bg-primary py-1.5 pr-2 pl-4 text-on-primary [&_button]:text-on-primary [&_button:hover]:bg-[color-mix(in_srgb,var(--on-primary)_14%,transparent)]">
        <span class="num text-[15px] font-medium">{{ 'ui.nSeleccionados' | transloco: { n: selection().length } }}</span>
        <span class="flex-1"></span>
        @if (bulkTpl(); as b) { <ng-container *ngTemplateOutlet="b.tpl; context: { $implicit: selection() }" /> }
        <button type="button" class="grid size-target-sm cursor-pointer place-items-center rounded-full" [attr.aria-label]="'org.quitarSeleccion' | transloco" (click)="selection.set([])"><zc-icon name="l:x" [size]="16" /></button>
      </div>
    }

    @if (!loading() && !rows().length) {
      <ng-content select="[zcTableEmpty]" />
    } @else if (narrow()) {
      <ul class="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-3 p-0" [attr.aria-busy]="loading() || null" [attr.aria-label]="caption()">
        @if (loading()) {
          @for (i of skeletons; track i) { <li><zc-skeleton variant="card" /></li> }
        } @else {
          @for (row of rows(); track row.id) {
            <li class="min-w-0">
              @if (cardTpl(); as c) {
                <ng-container *ngTemplateOutlet="c.tpl; context: { $implicit: row.original, selected: selected().has(row.id), toggle: toggler(row.id) }" />
              } @else {
                <dl class="m-0 grid gap-2 rounded-md border border-border bg-surface p-4">
                  @for (cell of row.getVisibleCells(); track cell.id) {
                    <div class="flex min-w-0 justify-between gap-3"><dt class="text-[13px] text-muted">{{ header(cell.column.id) }}</dt>
                      <dd class="m-0 min-w-0 text-right"><ng-container *ngTemplateOutlet="cellTpl(cell.column.id) ?? plain; context: { $implicit: row.original, value: cell.getValue() }" /></dd></div>
                  }
                </dl>
              }
            </li>
          }
        }
      </ul>
    } @else {
      <div zcScrollArea class="relative min-w-0 overflow-auto rounded-md border border-border bg-surface" [style.max-height]="maxHeight()">
        <table class="w-full min-w-[880px] border-separate border-spacing-0 text-[14.5px]" [attr.aria-busy]="loading() || null">
          <caption class="sr-only">{{ captionText() }}</caption>
          <thead>
            <tr>
              @if (selectable()) {
                <th scope="col" [class]="thBase + ' left-0 z-[3] w-[52px] pl-4'">
                  <zc-checkbox [ariaLabel]="'org.seleccionarTodos' | transloco" [checked]="allSelected()" [indeterminate]="someSelected()" (checkedChange)="toggleAll($event)" />
                </th>
              }
              @for (h of headers(); track h.id; let i = $index) {
                <th scope="col" [attr.aria-sort]="ariaSort(h.id)" [class]="thClass(h.id, i)">
                  @if (h.column.getCanSort()) {
                    <button type="button" class="inline-flex h-8 cursor-pointer items-center gap-1 text-inherit" [class.flex-row-reverse]="align(h.id) === 'end'"
                      [class.text-fg]="sort()?.id === h.id" (click)="toggleSort(h.id)">
                      {{ header(h.id) }}<zc-icon [name]="sortIcon(h.id)" [size]="16" [class.opacity-60]="sort()?.id !== h.id" />
                    </button>
                  } @else { {{ header(h.id) }} }
                </th>
              }
              @if (actionsTpl()) { <th scope="col" [class]="thBase + ' right-0 z-[3] w-14 text-center shadow-[-1px_0_0_var(--border)]'"><span class="sr-only">{{ 'org.acciones' | transloco }}</span></th> }
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              @for (i of skeletons; track i) {
                <tr><td [attr.colspan]="colspan()" [class]="tdBase"><zc-skeleton variant="table-row" [columns]="headers().length" class="[&>div]:border-0" /></td></tr>
              }
            } @else {
              @for (row of rows(); track row.id) {
                <tr class="group" [attr.aria-selected]="selectable() ? selected().has(row.id) : null">
                  @if (selectable()) {
                    <td [class]="tdBase + ' sticky left-0 z-[1] w-[52px] pl-4'">
                      <zc-checkbox [ariaLabel]="'org.seleccionarFila' | transloco: { label: rowLabel()(row.original) }" [checked]="selected().has(row.id)" (checkedChange)="toggler(row.id)($event)" />
                    </td>
                  }
                  @for (cell of row.getVisibleCells(); track cell.id; let i = $index) {
                    <td [class]="tdClass(cell.column.id, i)">
                      @if (i === 0 && detailTpl()) {
                        <span class="inline-flex min-w-0 items-center gap-1">
                          <button type="button" class="grid size-8 shrink-0 cursor-pointer place-items-center rounded-sm text-muted hover:bg-surface-2 hover:text-fg"
                            [attr.aria-expanded]="isExpanded(row.id)" [attr.aria-label]="'org.verDetalle' | transloco: { label: rowLabel()(row.original) }" (click)="toggleExpanded(row.id)">
                            <zc-icon name="l:chevron-right" [size]="16" class="transition-transform duration-(--dur)" [class.rotate-90]="isExpanded(row.id)" />
                          </button>
                          <ng-container *ngTemplateOutlet="cellTpl(cell.column.id) ?? plain; context: { $implicit: row.original, value: cell.getValue() }" />
                        </span>
                      } @else {
                        <ng-container *ngTemplateOutlet="cellTpl(cell.column.id) ?? plain; context: { $implicit: row.original, value: cell.getValue() }" />
                      }
                    </td>
                  }
                  @if (actionsTpl(); as a) {
                    <td [class]="tdBase + ' sticky right-0 z-[1] w-14 text-center shadow-[-1px_0_0_var(--border)]'"><ng-container *ngTemplateOutlet="a.tpl; context: { $implicit: row.original }" /></td>
                  }
                </tr>
                @if (isExpanded(row.id) && detailTpl(); as d) {
                  <tr><td [attr.colspan]="colspan()" class="border-b border-border bg-surface-2 px-4 py-4 whitespace-normal"><ng-container *ngTemplateOutlet="d.tpl; context: { $implicit: row.original }" /></td></tr>
                }
              }
            }
          </tbody>
        </table>
      </div>
    }
    <ng-content select="[zcTableFooter]" />

    <ng-template #plain let-value="value">{{ value ?? '—' }}</ng-template>
    <ng-template #columnsTpl>
      <div class="grid px-1" role="group" [attr.aria-label]="'org.columnasVisibles' | transloco">
        @for (c of hideable(); track c.id) {
          <zc-checkbox [checked]="visibility()[c.id] !== false" (checkedChange)="setVisible(c.id, $event)">{{ c.header }}</zc-checkbox>
        }
      </div>
    </ng-template>`,
})
export class DataTableComponent<T> {
  readonly data = input<readonly T[]>([]);
  readonly columns = input<readonly ZcColumn<T>[]>([]);
  readonly rowId = input<(row: T) => string>(r => String((r as { id?: unknown }).id));
  /** Nombre de la fila para lectores de pantalla: "lote #02829". */
  readonly rowLabel = input<(row: T) => string>(r => this.rowId()(r));
  /** Nombre de la tabla (caption); se completa con el orden actual. */
  readonly caption = input.required<string>();
  readonly selectable = input(false);
  readonly loading = input(false);
  /** Orden en el servidor: la tabla solo emite [(sort)] y muestra las filas tal como llegan. */
  readonly manualSort = input(false);
  readonly maxHeight = input<string | null>(null);
  readonly sort = model<ZcSort>(null);
  readonly selection = model<string[]>([]);
  readonly density = model<ZcDensity>('comfortable');

  readonly panel = inject(Panel);
  private readonly t = injectTranslate();
  private readonly lang = injectLang();
  readonly narrow = injectMedia(NARROW_QUERY);
  private readonly cells = contentChildren(CellDefDirective);
  readonly detailTpl = contentChild(RowDetailDirective);
  readonly actionsTpl = contentChild(RowActionsDirective);
  readonly cardTpl = contentChild(RowCardDirective);
  readonly bulkTpl = contentChild(BulkActionsDirective);
  private readonly colBtn = viewChild<ElementRef<HTMLButtonElement>>('colBtn');
  private readonly columnsTpl = viewChild.required<TemplateRef<unknown>>('columnsTpl');

  readonly skeletons = [1, 2, 3, 4, 5];
  readonly densities = [
    { v: 'comfortable' as const, key: 'org.comoda', icon: 'l:rows-3' as IconName },
    { v: 'compact' as const, key: 'org.compacta', icon: 'l:rows-4' as IconName },
  ];

  readonly visibility = linkedSignal<VisibilityState>(() => Object.fromEntries(this.columns().filter(c => c.hidden).map(c => [c.id, false])));
  private readonly expanded = linkedSignal<Record<string, boolean>>(() => { this.data(); return {}; });
  readonly selected = computed(() => new Set(this.selection()));
  readonly hideable = computed(() => this.columns().filter((c, i) => i > 0 && c.hideable !== false));

  private readonly colDefs = computed<ColumnDef<T>[]>(() => this.columns().map((c, i) => {
    const base = { id: c.id, header: c.header, enableHiding: i > 0 && c.hideable !== false };
    if (!c.value) return { ...base, enableSorting: false };
    const get = c.value;
    return {
      ...base, accessorFn: (r: T) => get(r) ?? null, enableSorting: !!c.sortable, sortUndefined: 'last' as const,
      sortingFn: (a, b, id) => compareValues(a.getValue(id), b.getValue(id), this.lang()),
    } as ColumnDef<T>;
  }));

  /**
   * Núcleo de TanStack con estado 100 % controlado por signals: cada cambio (datos, orden, selección, columnas)
   * arma una instancia nueva, que es barata para las filas de una página y evita estado duplicado.
   */
  readonly table = computed(() => {
    const s = this.sort();
    const sorting: SortingState = s ? [{ id: s.id, desc: s.desc }] : [];
    const rowSelection: RowSelectionState = Object.fromEntries(this.selection().map(id => [id, true]));
    const options: TableOptionsResolved<T> = {
      data: this.data() as T[],
      columns: this.colDefs(),
      getRowId: r => this.rowId()(r),
      state: {},
      onStateChange: () => {},
      renderFallbackValue: null,
      enableRowSelection: this.selectable(),
      enableSortingRemoval: false,
      sortDescFirst: false,
      manualSorting: this.manualSort(),
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
    };
    const table = createTable(options);
    table.setOptions(prev => ({ ...prev, state: { ...table.initialState, sorting, rowSelection, columnVisibility: this.visibility() } }));
    return table;
  });

  readonly rows = computed(() => this.table().getRowModel().rows);
  readonly headers = computed(() => this.table().getHeaderGroups()[0]?.headers ?? []);
  readonly colspan = computed(() => this.headers().length + (this.selectable() ? 1 : 0) + (this.actionsTpl() ? 1 : 0));
  readonly allSelected = computed(() => !!this.rows().length && this.rows().every(r => this.selected().has(r.id)));
  readonly someSelected = computed(() => !this.allSelected() && this.rows().some(r => this.selected().has(r.id)));
  readonly captionText = computed(() => {
    const s = this.sort();
    const col = s && this.columns().find(c => c.id === s.id);
    return col ? `${this.caption()}, ${this.t('org.ordenadaPor', { col: col.header, dir: this.t(s.desc ? 'org.descendente' : 'org.ascendente') })}` : this.caption();
  });

  readonly thBase = 'sticky top-0 h-11 border-b border-border bg-surface-2 px-3 text-left align-middle text-[13px] font-medium whitespace-nowrap text-muted ';
  readonly tdBase = 'border-b border-border bg-surface px-3 align-middle whitespace-nowrap group-last:border-b-0 group-hover:bg-[color-mix(in_srgb,var(--surface-2)_60%,var(--surface))] group-aria-selected:bg-row-selected ';
  private readonly rowH = computed(() => (this.density() === 'compact' ? 'h-row-compact ' : 'h-row '));

  header(id: string) { return this.columns().find(c => c.id === id)?.header ?? id; }
  align(id: string) { return this.columns().find(c => c.id === id)?.align ?? 'start'; }
  cellTpl(id: string) { return this.cells().find(c => c.zcCell() === id)?.tpl ?? null; }
  isExpanded(id: string) { return !!this.expanded()[id]; }

  thClass(id: string, i: number) {
    const end = this.align(id) === 'end' ? 'text-right ' : '';
    return this.thBase + end + (i === 0 ? `z-[3] min-w-[230px] shadow-[1px_0_0_var(--border)] ${this.selectable() ? 'left-[52px]' : 'left-0'}` : 'z-[2]');
  }
  tdClass(id: string, i: number) {
    const end = this.align(id) === 'end' ? 'text-right num ' : '';
    return this.tdBase + this.rowH() + end + (i === 0 ? `sticky z-[1] min-w-[230px] shadow-[1px_0_0_var(--border)] ${this.selectable() ? 'left-[52px]' : 'left-0'}` : '');
  }
  ariaSort(id: string) {
    const col = this.columns().find(c => c.id === id);
    if (!col?.sortable) return null;
    const s = this.sort();
    return s?.id === id ? (s.desc ? 'descending' : 'ascending') : 'none';
  }
  sortIcon(id: string): IconName {
    const s = this.sort();
    return s?.id !== id ? 'l:arrow-up-down' : s.desc ? 'l:arrow-down' : 'l:arrow-up';
  }

  /** Primer clic ascendente; el siguiente alterna. */
  toggleSort(id: string) {
    const s = this.sort();
    this.sort.set(s?.id === id ? { id, desc: !s.desc } : { id, desc: false });
  }
  toggleAll(v: boolean) {
    const ids = this.rows().map(r => r.id);
    const cur = this.selection().filter(id => !ids.includes(id));
    this.selection.set(v ? [...cur, ...ids] : cur);
  }
  toggler(id: string) {
    return (v: boolean) => this.selection.update(s => (v ? (s.includes(id) ? s : [...s, id]) : s.filter(x => x !== id)));
  }
  toggleExpanded(id: string) { this.expanded.update(e => ({ ...e, [id]: !e[id] })); }
  setVisible(id: string, v: boolean) { this.visibility.update(s => ({ ...s, [id]: v })); }

  openColumns() {
    if (this.panel.isOpen()) { this.panel.close(); return; }
    const el = this.colBtn()?.nativeElement;
    if (!el) return;
    this.panel.open(this.columnsTpl(), { title: this.t('org.columnasVisibles'), origin: el, align: 'end', width: 260, trap: true, role: 'dialog', ariaLabel: this.t('org.columnasVisibles') });
  }

  onDensityKey(e: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const next: ZcDensity = this.density() === 'compact' ? 'comfortable' : 'compact';
    this.density.set(next);
    (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="radio"]')[next === 'compact' ? 1 : 0]?.focus();
  }
}
