import {
  ChangeDetectionStrategy, Component, ElementRef, TemplateRef, computed, forwardRef, inject, input, linkedSignal, model, signal, viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonDirective } from '@zonacards/ui/button';
import { FlagComponent } from '@zonacards/ui/flag';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { cn } from '@zonacards/ui/core';
import { injectTranslate } from '@zonacards/ui/core';
import { FieldComponent } from '@zonacards/ui/field';
import { ListboxComponent, ZcOption, filterOptions, typeaheadIndex } from '@zonacards/ui/listbox';
import { Panel } from '@zonacards/ui/panel';

let seq = 0;

/**
 * <zc-select> y <zc-combobox> · un solo componente: sin <select> nativo.
 * - Select: pocas opciones, sin búsqueda (tipo de documento, moneda).
 * - Combobox: búsqueda automática con más de 8 opciones, multiselección con checkboxes y Limpiar/Listo, grupos, vacío.
 * Teclado: flechas, Inicio/Fin, Enter, Escape y escribir para saltar. En móvil se abre como bottom sheet;
 * dentro de otro sheet o drawer, como subpantalla con Volver.
 * Dentro de <zc-field> toma su etiqueta, mensaje y estado de error. Funciona con [(value)] o formularios reactivos.
 */
@Component({
  selector: 'zc-select, zc-combobox',
  imports: [ButtonDirective, FlagComponent, IconComponent, ListboxComponent, TranslocoPipe],
  providers: [Panel, { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectComponent), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0' },
  template: `
    <button #trigger type="button" role="combobox" [id]="triggerId()" [class]="triggerClass()" [disabled]="isDisabled()"
      aria-haspopup="listbox" [attr.aria-expanded]="panel.isOpen()" [attr.aria-controls]="panel.isOpen() ? listId : null"
      [attr.aria-labelledby]="labelledBy()" [attr.aria-label]="labelledBy() ? null : ariaLabel()" [attr.aria-describedby]="linkedField()?.messageId ?? null"
      [attr.aria-invalid]="invalidState() || null" [attr.aria-required]="linkedField()?.required() || null" [attr.data-invalid]="invalidState()"
      [title]="appearance() === 'inline' ? '' : (display()?.text ?? '')" (click)="toggle()" (keydown)="onTriggerKey($event)" (blur)="!panel.isOpen() && onTouched()">
      @if (icon()) { <zc-icon [name]="icon()!" [size]="16" class="text-muted" /> }
      <span [id]="valueId" class="flex min-w-0 flex-1 items-center gap-2 overflow-hidden whitespace-nowrap">
        @if (display(); as d) {
          @if (d.flag) { <zc-flag [code]="d.flag" [size]="15" /> }
          @if (d.icon) { <zc-icon [name]="d.icon" [size]="16" class="text-muted" /> }
          <span class="truncate" [class.num]="compact()">{{ d.text }}</span>
        } @else { <span class="truncate text-subtle">{{ placeholder() || ('ui.selecciona' | transloco) }}</span> }
      </span>
      <zc-icon name="s:alt-arrow-down" [size]="16" class="text-muted transition-transform duration-(--dur)" [class.rotate-180]="panel.isOpen()" />
    </button>

    <ng-template #panelTpl>
      @if (searchOn()) {
        <div class="mb-2 flex h-field shrink-0 items-center rounded-control border border-field-bd bg-field-bg focus-within:border-focus focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--focus)_22%,transparent)]">
          <zc-icon name="s:magnifier" [size]="16" class="ml-3 text-muted" />
          <input data-autofocus class="zc-bare h-full min-w-0 flex-1 bg-transparent px-3 text-base placeholder:text-subtle" type="text" role="combobox" autocomplete="off"
            aria-expanded="true" aria-autocomplete="list" [attr.aria-controls]="listId" [attr.aria-activedescendant]="lb.activeId()"
            [attr.aria-label]="'ui.buscarOpcion' | transloco" [placeholder]="searchPlaceholder() || ('ui.buscar' | transloco)"
            [value]="query()" (input)="onQuery($event)" (keydown)="onSearchKey($event, lb)" />
        </div>
      }
      <zc-listbox #lb [listId]="listId" [options]="visible()" [isSelected]="isSelectedFn" [multiple]="multiple()" [query]="query()"
        [focusable]="!searchOn()" [fill]="panel.mode() !== 'popover'" [label]="title()" [(active)]="active"
        [emptyText]="'ui.sinResultados' | transloco: { q: query() }" (pick)="choose($event)" />
      @if (multiple()) {
        <!-- Como .pop-foot de index.html: solo las dos acciones, a la derecha (el conteo ya está en el campo). -->
        <div class="mt-2 flex shrink-0 justify-end gap-2 border-t border-border pt-2">
          <button zcButton variant="ghost" size="sm" [disabled]="!selectedValues().length" (click)="clear()">{{ 'ui.limpiar' | transloco }}</button>
          <button zcButton size="sm" (click)="panel.close()">{{ 'ui.listo' | transloco }}</button>
        </div>
      }
    </ng-template>`,
})
export class SelectComponent<T = unknown> implements ControlValueAccessor {
  readonly options = input.required<readonly ZcOption<T>[]>();
  readonly multiple = input(false);
  /** 'auto': búsqueda solo si hay más de 8 opciones. */
  readonly searchable = input<boolean | 'auto'>('auto');
  readonly placeholder = input('');
  readonly searchPlaceholder = input('');
  readonly disabled = input(false);
  readonly invalid = input(false);
  /** Ícono decorativo al inicio del disparador. */
  readonly icon = input<IconName | null>(null);
  /** El disparador muestra el dato corto (meta) en vez del nombre: "+51" en el teléfono. */
  readonly compact = input(false);
  /** 'inline': sin borde, dentro de otro control (prefijo del teléfono). */
  readonly appearance = input<'default' | 'inline'>('default');
  /** 'sm': altura --target-sm, para barras densas (filas por página del paginador). */
  readonly size = input<'md' | 'sm'>('md');
  /** Nombre accesible cuando no está dentro de un zc-field, y título del sheet. */
  readonly ariaLabel = input('');
  /** false: no toma el id ni la etiqueta del zc-field que lo contiene (es parte de otro control). */
  readonly fieldLink = input(true);
  readonly value = model<T | T[] | null>(null);

  readonly panel = inject(Panel);
  private readonly field = inject(FieldComponent, { optional: true });
  private readonly t = injectTranslate();
  private readonly triggerRef = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panelTpl = viewChild.required<TemplateRef<unknown>>('panelTpl');

  private readonly id = `zc-sel-${++seq}`;
  readonly listId = `${this.id}-lb`;
  readonly valueId = `${this.id}-v`;
  readonly linkedField = computed(() => (this.fieldLink() ? this.field : null));
  readonly triggerId = computed(() => this.linkedField()?.controlId ?? this.id);
  /** Patrón APG "select-only combobox": el nombre es la etiqueta; el valor se lee del contenido del disparador. */
  readonly labelledBy = computed(() => this.linkedField()?.labelId ?? null);
  readonly title = computed(() => this.ariaLabel() || this.linkedField()?.label() || '');
  readonly isDisabled = linkedSignal(this.disabled);
  readonly invalidState = computed(() => this.invalid() || !!this.linkedField()?.invalid());
  readonly query = signal('');
  readonly active = signal(0);
  readonly searchOn = computed(() => (this.searchable() === 'auto' ? this.options().length > 8 : this.searchable() as boolean));
  readonly visible = computed(() => filterOptions(this.options(), this.query()));
  readonly selectedValues = computed<T[]>(() => { const v = this.value(); return Array.isArray(v) ? v : v === null || v === undefined ? [] : [v]; });
  readonly isSelectedFn = (o: ZcOption<T>) => this.selectedValues().includes(o.value);

  readonly display = computed(() => {
    const sel = this.options().filter(o => this.selectedValues().includes(o.value));
    if (!sel.length) return null;
    if (this.multiple()) {
      return { text: sel.length <= 2 ? sel.map(o => o.label).join(', ') : this.t('ui.nSeleccionados', { n: sel.length }), flag: undefined, icon: undefined };
    }
    const o = sel[0];
    return { text: this.compact() ? (o.meta ?? o.label) : o.label, flag: o.flag, icon: o.icon };
  });

  readonly triggerClass = computed(() => cn(
    'flex w-full min-w-0 cursor-pointer items-center gap-2 text-left text-base leading-tight transition disabled:cursor-not-allowed',
    this.appearance() === 'inline'
      ? 'h-full w-auto shrink-0 rounded-l-sm border-r border-border px-3 hover:bg-(--state-hover-bg) disabled:opacity-(--opacity-disabled)'
      : (this.size() === 'sm' ? 'h-target-sm pr-2 pl-3 text-sm ' : 'h-field pr-3 pl-4 ') + 'rounded-control border border-field-bd bg-field-bg hover:enabled:border-muted aria-expanded:border-focus aria-expanded:shadow-[0_0_0_3px_color-mix(in_srgb,var(--focus)_22%,transparent)] data-[invalid=true]:border-danger disabled:border-dashed disabled:bg-surface-2 disabled:text-muted',
  ));

  private onChange: (v: T | T[] | null) => void = () => {};
  onTouched: () => void = () => {};

  toggle() { this.panel.isOpen() ? this.panel.close() : this.open(); }

  open() {
    if (this.isDisabled()) return;
    this.query.set('');
    const trigger = this.triggerRef().nativeElement;
    const origin = this.appearance() === 'inline' ? (trigger.parentElement?.closest<HTMLElement>('[data-zc-control]') ?? trigger) : trigger;
    // La opción activa al abrir es la seleccionada (o la primera habilitada).
    const list = this.visible(); const sel = list.findIndex(o => this.isSelectedFn(o) && !o.disabled);
    this.active.set(sel >= 0 ? sel : Math.max(0, list.findIndex(o => !o.disabled)));
    this.panel.open(this.panelTpl(), {
      title: this.title(), origin, returnFocus: trigger, minWidth: this.compact() ? 300 : 220,
      trap: this.multiple(), closeOnTab: !this.multiple(), onClose: () => this.onTouched(),
    });
  }

  onTriggerKey(e: KeyboardEvent) {
    if (this.panel.isOpen()) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); this.open(); return; }
    // Escribir con la lista cerrada: abre y salta a la opción (o empieza a buscar).
    if (e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault(); this.open();
      if (this.searchOn()) { this.query.set(e.key); this.active.set(0); }
      else { const i = typeaheadIndex(this.visible(), this.active(), e.key); if (i >= 0) this.active.set(i); }
    }
  }

  onSearchKey(e: KeyboardEvent, lb: ListboxComponent<T>): void { lb.handleKey(e, { space: false, typeahead: false }); }

  onQuery(e: Event) {
    this.query.set((e.target as HTMLInputElement).value);
    this.active.set(Math.max(0, this.visible().findIndex(o => !o.disabled)));
  }

  choose(o: ZcOption<T>) {
    if (this.multiple()) {
      const cur = this.selectedValues();
      this.set(cur.includes(o.value) ? cur.filter(v => v !== o.value) : [...cur, o.value]);
    } else {
      this.set(o.value);
      this.panel.close();
    }
  }

  clear() { this.set([]); }

  private set(v: T | T[] | null) { this.value.set(v); this.onChange(v); }

  writeValue(v: T | T[] | null) { this.value.set(this.multiple() ? (v ?? []) : v); }
  registerOnChange(fn: (v: T | T[] | null) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(d: boolean) { this.isDisabled.set(d); }
}
