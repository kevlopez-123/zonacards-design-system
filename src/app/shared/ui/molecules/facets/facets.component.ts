import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { CheckboxComponent } from '../../atoms/checkbox/checkbox.component';
import { CountComponent } from '../../atoms/count/count.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { injectTranslate } from '../../lang';
import { InputDirective } from '../field/field.component';
import { InputGroupComponent } from '../input-group/input-group.component';

/** Normaliza para buscar sin tildes ni mayúsculas. */
const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

let seq = 0;

/**
 * Filtros por facetas (o-facets de index.html). Columna lateral en desktop:
 *   <zc-facets>
 *     <zc-facet-group title="Por categoría" [count]="cats().length"><zc-facet-options [options]="…" [(value)]="cats" [searchable]="true" /></zc-facet-group>
 *     <zc-facet-group title="Valor máximo"><zc-slider … /></zc-facet-group>
 *   </zc-facets>
 * En móvil la página muestra un botón "Filtrar" que abre un drawer (bottom sheet) con zc-select múltiples y "Mostrar N resultados".
 */
@Component({
  selector: 'zc-facets',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 content-start rounded-md border border-border bg-surface [&>*+*]:border-t [&>*+*]:border-border' },
  template: `<ng-content />`,
})
export class FacetsComponent {}

/** Grupo plegable con título y cuántas opciones hay marcadas. */
@Component({
  selector: 'zc-facet-group',
  imports: [CountComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0', '[attr.title]': 'null' },
  template: `
    <button type="button" class="flex min-h-target w-full cursor-pointer items-center gap-2 px-4 text-left text-[15px] font-semibold"
      [attr.aria-expanded]="open()" [attr.aria-controls]="bodyId" (click)="open.set(!open())">
      <span class="min-w-0 flex-1 break-words">{{ title() }}</span>
      @if (count()) { <zc-count [value]="count()" /> }
      <zc-icon name="s:alt-arrow-down" [size]="16" class="transition-transform duration-(--dur)" [class.rotate-180]="open()" />
    </button>
    <div [id]="bodyId" role="group" [attr.aria-label]="title()" class="grid grid-cols-[minmax(0,1fr)] gap-0.5 px-4 pb-3" [hidden]="!open()"><ng-content /></div>`,
})
export class FacetGroupComponent {
  readonly title = input.required<string>();
  readonly count = input(0);
  readonly open = model(true);
  readonly bodyId = `zc-facet-${++seq}`;
}

export interface ZcFacetOption { value: string; label: string; count: number }

/** Casillas con conteo; con [searchable] busca dentro del grupo; más de [visible] opciones → "Mostrar N más". */
@Component({
  selector: 'zc-facet-options',
  imports: [CheckboxComponent, InputDirective, InputGroupComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-0.5' },
  template: `
    @if (searchable()) {
      <zc-input-group class="mb-1.5" prefixIcon="s:magnifer">
        <input zcInput type="search" [value]="query()" (input)="query.set($any($event.target).value)" [placeholder]="searchLabel()" [attr.aria-label]="searchLabel()" />
      </zc-input-group>
    }
    @for (o of shown(); track o.value) {
      <zc-checkbox [checked]="value().includes(o.value)" (checkedChange)="toggle(o.value, $event)">
        <span class="flex min-w-0 items-center gap-2"><span class="min-w-0 flex-1 break-words">{{ o.label }}</span><span class="text-[13px] text-subtle num">{{ o.count }}</span></span>
      </zc-checkbox>
    }
    @if (hidden() > 0) {
      <button type="button" class="mt-1 min-h-8 cursor-pointer justify-self-start text-sm text-fg underline underline-offset-2" (click)="all.set(true)">{{ t('mol.facetas.mostrarMas', { n: hidden() }) }}</button>
    }`,
})
export class FacetOptionsComponent {
  readonly t = injectTranslate();
  readonly options = input.required<readonly ZcFacetOption[]>();
  readonly value = model<string[]>([]);
  readonly searchable = input(false);
  readonly searchLabel = input('');
  readonly visible = input(5);
  readonly query = signal('');
  readonly all = signal(false);
  private readonly matching = computed(() => { const q = norm(this.query()); return this.options().filter(o => norm(o.label).includes(q)); });
  readonly shown = computed(() => (this.all() ? this.matching() : this.matching().slice(0, this.visible())));
  readonly hidden = computed(() => this.matching().length - this.shown().length);
  toggle(v: string, on: boolean) { this.value.update(a => (on ? [...a, v] : a.filter(x => x !== v))); }
}

export const FACETS = [FacetsComponent, FacetGroupComponent, FacetOptionsComponent] as const;
