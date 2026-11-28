import { NgTemplateOutlet } from '@angular/common';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, Directive, ElementRef, Injector, TemplateRef, afterNextRender, computed, contentChild, inject, input, model, output, signal } from '@angular/core';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { injectTranslate } from '@zonacards/ui/core';
import { MenuComponent, ZcMenuItem } from '@zonacards/ui/menu';
import { SORTABLE } from '@zonacards/ui/sortable';
import { ToastService } from '@zonacards/ui/toast';
import { TooltipDirective } from '@zonacards/ui/tooltip';
import { injectMedia, NARROW_QUERY, WIDE_QUERY } from '@zonacards/ui/core';

export type ZcWidgetWidth = 1 | 2 | 4;
export interface ZcWidgetDef { id: string; title: string; icon: IconName; width: ZcWidgetWidth }
export interface ZcWidget { id: string; width: ZcWidgetWidth }

/** Cuerpo de los widgets: <ng-template zcWidgetBody let-id let-width="width">…</ng-template>. */
@Directive({ selector: 'ng-template[zcWidgetBody]' })
export class WidgetBodyDirective { readonly tpl = inject(TemplateRef); }

/** Acción en la fila del título, fuera de la edición ("Ver detalle"): <ng-template zcWidgetAction let-id>…</ng-template>. */
@Directive({ selector: 'ng-template[zcWidgetAction]' })
export class WidgetActionDirective { readonly tpl = inject(TemplateRef); }

/**
 * <zc-dashboard-grid [catalog]="widgets" [(layout)]="miDashboard" [defaults]="delRol" (saved)="…"> <ng-template zcWidgetBody let-id>…</ng-template> </zc-dashboard-grid>
 * Dashboard configurable (o-dash de index.html). En modo edición: reordenar arrastrando el asa (o con teclado), cambiar el ancho
 * (1, 2 o 4 columnas) desde la esquina o con el menú del widget, agregar desde el catálogo, quitar y restablecer el del rol.
 * 4 columnas en desktop, 2 en tablet y 1 en móvil (en móvil solo se reordena).
 * Fuera de la edición, el widget no tiene menú de diseño; [viewActions] le pone uno propio de la app ("Ver detalle") y avisa por (widgetAction).
 * [zcWidgetAction]: acción junto al título fuera de la edición (en la edición, ese lugar es del menú de diseño).
 * Las filas quedan llenas: cada widget conserva su proporción (1, 2 o 4 de 4 columnas) y crece para repartirse el espacio libre.
 * "Agregar" lista solo los widgets del catálogo que faltan; si no falta ninguno, queda deshabilitado con "Ya están todos".
 */
@Component({
  selector: 'zc-dashboard-grid',
  imports: [NgTemplateOutlet, ButtonDirective, IconComponent, MenuComponent, SORTABLE, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3' },
  template: `
    <div class="flex flex-wrap items-center gap-2">
      @if (!editing()) {
        <button #editBtn zcButton variant="outline" size="sm" (click)="startEdit()"><zc-icon name="s:pen" [size]="16" />{{ t('mol.dash.editar') }}</button>
      } @else {
        @if (addItems().length) {
          <zc-menu [label]="t('mol.dash.agregar')" [triggerText]="t('mol.dash.agregar')" triggerVariant="outline" leadIcon="s:add" [items]="addItems()" (select)="add($event.id)" />
        } @else {
          <span class="inline-flex rounded-sm [&>button]:pointer-events-none" tabindex="0" [zcTooltip]="t('mol.dash.yaEstanTodos')">
            <button zcButton variant="outline" size="sm" disabled><zc-icon name="s:add" [size]="16" />{{ t('mol.dash.agregar') }}</button>
          </span>
        }
        <button zcButton variant="ghost" size="sm" (click)="reset()">{{ t('mol.dash.restablecer') }}</button>
        <button zcButton size="sm" (click)="done()">{{ t('mol.dash.listo') }}</button>
      }
    </div>
    <ul class="m-0 flex list-none flex-wrap gap-3 p-0"
      [attr.aria-label]="t('mol.dash.widgets')" [(zcSortable)]="layout" [zcSortableGrid]="true" [zcSortableLabel]="titleOf">
      @for (w of layout(); track w.id) {
        <li [zcSortableItem]="w" [attr.data-wid]="w.id" [style.flex]="flexOf(w)"
          class="relative grid min-h-[132px] min-w-0 content-start gap-3 rounded-card border bg-surface p-4" [class]="editing() ? 'border-dashed border-border-strong' : 'border-border'">
          <div class="flex min-w-0 items-center gap-2">
            @if (editing()) {
              <button type="button" zcSortableHandle [item]="w" [label]="t('mol.dash.mover', { w: titleOf(w) })"
                class="grid size-8 shrink-0 place-items-center rounded-sm bg-surface-2 text-muted"><zc-icon name="l:grip-vertical" [size]="16" /></button>
            }
            <span class="grid size-8 shrink-0 place-items-center rounded-sm bg-surface-2"><zc-icon [name]="def(w.id).icon" [size]="16" /></span>
            <strong class="min-w-0 flex-1 break-words text-body-sm">{{ def(w.id).title }}</strong>
            @if (editing()) {
              <zc-menu [label]="t('mol.dash.opciones', { w: titleOf(w) })" [items]="widgetMenu(w)" [dense]="true" (select)="onMenu(w, $event)" />
            } @else if (actionTpl(); as a) {
              <ng-container *ngTemplateOutlet="a.tpl; context: { $implicit: w.id, width: w.width }" />
            }
            @if (!editing() && viewActions()?.(w); as acts) {
              @if (acts.length) { <zc-menu [label]="t('mol.dash.acciones', { w: titleOf(w) })" [items]="acts" [dense]="true" (select)="widgetAction.emit({ widget: w, item: $event })" /> }
            }
          </div>
          <div class="min-w-0">
            @if (bodyTpl(); as b) { <ng-container *ngTemplateOutlet="b.tpl; context: { $implicit: w.id, width: w.width }" /> }
          </div>
          @if (editing() && cols() > 1) {
            <span class="absolute right-7 bottom-1.5 text-tiny text-subtle num" aria-hidden="true">{{ t('mol.dash.col', { n: w.width }) }}</span>
            <span class="absolute right-0.5 bottom-0.5 size-[22px] cursor-ew-resize touch-none rounded-br-[10px] border-r-[3px] border-b-[3px] border-border-strong" aria-hidden="true"
              (pointerdown)="resizeStart($event, w)"></span>
          }
        </li>
      }
    </ul>
    <p class="flex items-start gap-2 text-caption text-muted"><zc-icon name="s:info-circle" [size]="16" class="mt-px shrink-0" />{{ t('mol.dash.nota') }}</p>`,
})
export class DashboardGridComponent {
  readonly t = injectTranslate();
  private readonly toast = inject(ToastService);
  private readonly live = inject(LiveAnnouncer);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly narrow = injectMedia(NARROW_QUERY);
  private readonly wide = injectMedia(WIDE_QUERY);

  readonly catalog = input.required<readonly ZcWidgetDef[]>();
  readonly defaults = input.required<readonly string[]>();
  readonly layout = model.required<ZcWidget[]>();
  readonly saved = output<ZcWidget[]>();
  /** Menú del widget fuera de la edición (acciones de la app); null o [] = sin menú. */
  readonly viewActions = input<((w: ZcWidget) => ZcMenuItem[]) | null>(null);
  readonly widgetAction = output<{ widget: ZcWidget; item: ZcMenuItem }>();
  readonly bodyTpl = contentChild(WidgetBodyDirective);
  readonly actionTpl = contentChild(WidgetActionDirective);
  readonly editing = signal(false);
  readonly cols = computed(() => (this.narrow() ? 1 : this.wide() ? 4 : 2));

  def(id: string) { return this.catalog().find(d => d.id === id)!; }
  readonly titleOf = (w: ZcWidget) => this.def(w.id).title;
  span(w: ZcWidget) { return Math.min(w.width, this.cols()); }
  /** Base de cada widget según las columnas (gap de 12 px); flex-grow con su proporción llena la fila. */
  flexOf(w: ZcWidget) {
    const n = this.cols(), s = this.span(w);
    if (n === 1 || s === n) return `${s} 1 100%`;
    return `${s} 1 calc((100% - ${(n - 1) * 0.75}rem) / ${n} * ${s} + ${(s - 1) * 0.75}rem)`;
  }

  /** Solo los que faltan (el catálogo que pasa la app ya es el que permite el rol). */
  readonly addItems = computed<ZcMenuItem[]>(() => this.catalog().filter(d => !this.layout().some(w => w.id === d.id))
    .map((d, i) => ({ id: d.id, label: d.title, icon: d.icon, group: i === 0 ? this.t('mol.dash.catalogo') : undefined })));
  widgetMenu(w: ZcWidget): ZcMenuItem[] {
    const i = this.layout().indexOf(w), last = this.layout().length - 1;
    return [
      { id: 'w1', label: this.t('mol.dash.ancho1'), checked: w.width === 1 }, { id: 'w2', label: this.t('mol.dash.ancho2'), checked: w.width === 2 }, { id: 'w4', label: this.t('mol.dash.ancho4'), checked: w.width === 4 },
      { id: 'up', label: this.t('mol.orden.subir'), icon: 'l:arrow-up', disabled: i === 0, separatorBefore: true },
      { id: 'down', label: this.t('mol.orden.bajar'), icon: 'l:arrow-down', disabled: i === last },
      { id: 'rm', label: this.t('mol.dash.quitar'), icon: 's:trash-bin-trash', danger: true, separatorBefore: true },
    ];
  }

  startEdit() { this.editing.set(true); this.live.announce(this.t('mol.dash.modoEdicion')); }
  done() {
    this.editing.set(false);
    this.saved.emit(this.layout());
    this.toast.success(this.t('mol.dash.guardado'), { text: this.t('mol.dash.guardadoTexto') });
    afterNextRender(() => this.host.querySelector<HTMLElement>('button')?.focus(), { injector: this.injector });
  }
  reset() { this.layout.set(this.defaults().map(id => ({ id, width: this.def(id).width }))); this.toast.info(this.t('mol.dash.restablecido')); }
  add(id: string) {
    if (this.layout().some(w => w.id === id)) return;
    this.layout.update(a => [...a, { id, width: this.def(id).width }]);
    this.live.announce(this.t('mol.dash.agregado', { w: this.def(id).title }));
  }
  onMenu(w: ZcWidget, it: ZcMenuItem) {
    const a = [...this.layout()]; const i = a.indexOf(w);
    if (it.id.startsWith('w')) a[i] = { ...w, width: +it.id.slice(1) as ZcWidgetWidth };
    else if (it.id === 'up' || it.id === 'down') { const j = i + (it.id === 'up' ? -1 : 1); [a[i], a[j]] = [a[j], a[i]]; }
    else if (it.id === 'rm') a.splice(i, 1);
    this.layout.set(a);
    this.live.announce(this.t(it.id === 'rm' ? 'mol.dash.quitado' : 'mol.dash.actualizado'));
  }

  /** Esquina: arrastrar en horizontal cambia el ancho a 1, 2 o 4 columnas. */
  resizeStart(e: PointerEvent, w: ZcWidget) {
    e.preventDefault(); e.stopPropagation();
    const handle = e.currentTarget as HTMLElement;
    const grid = handle.closest('ul')!;
    const colW = (grid.clientWidth - (this.cols() - 1) * 12) / this.cols() + 12;
    const x0 = e.clientX, w0 = w.width;
    handle.setPointerCapture(e.pointerId);
    const snap = (n: number): ZcWidgetWidth => (n <= 1 ? 1 : n <= 2 ? 2 : 4);
    const move = (ev: PointerEvent) => {
      const next = snap(Math.round(w0 + (ev.clientX - x0) / colW));
      const cur = this.layout().find(x => x.id === w.id);
      if (cur && cur.width !== next) this.layout.update(a => a.map(x => (x.id === w.id ? { ...x, width: next } : x)));
    };
    const up = () => { handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); handle.removeEventListener('pointercancel', up); };
    handle.addEventListener('pointermove', move); handle.addEventListener('pointerup', up); handle.addEventListener('pointercancel', up);
  }
}

export const DASHBOARD_GRID = [DashboardGridComponent, WidgetBodyDirective, WidgetActionDirective] as const;
