import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, model, output } from '@angular/core';
import { FlagComponent } from '@zonacards/ui/flag';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { ScrollAreaDirective } from '@zonacards/ui/core';

/** Opción de select, combobox y autocomplete. */
export interface ZcOption<T = unknown> {
  value: T;
  label: string;
  description?: string;
  icon?: IconName;
  /** Código de bandera (flag-icons). */
  flag?: string;
  /** Dato a la derecha: prefijo telefónico, moneda, conteo. */
  meta?: string;
  group?: string;
  disabled?: boolean;
  /** Línea divisoria antes de la opción (los 6 países del alcance, luego el resto). */
  separatorBefore?: boolean;
  /** Texto extra que encuentra la búsqueda sin mostrarse. */
  keywords?: string;
}

/** Sin tildes ni mayúsculas, para buscar "Bogota" y encontrar "Bogotá". */
export const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function filterOptions<T>(options: readonly ZcOption<T>[], query: string): ZcOption<T>[] {
  const q = normalize(query.trim());
  if (!q) return [...options];
  return options.filter(o => normalize([o.label, o.description, o.meta, o.group, o.keywords].filter(Boolean).join(' ')).includes(q));
}

/** Siguiente opción habilitada que empieza con lo tecleado, desde la activa (con vuelta). -1 si no hay. */
export function typeaheadIndex(options: readonly ZcOption[], active: number, typed: string): number {
  const q = normalize(typed); const n = options.length;
  const start = typed.length === 1 ? active + 1 : active;
  for (let k = 0; k < n; k++) {
    const j = (start + k) % n;
    if (!options[j].disabled && normalize(options[j].label).startsWith(q)) return j;
  }
  return -1;
}

/** Partes de un texto para resaltar la coincidencia con <mark>. */
export function highlight(text: string, query: string): { pre: string; hit: string; post: string } {
  const q = query.trim(); const i = q ? normalize(text).indexOf(normalize(q)) : -1;
  return i < 0 ? { pre: text, hit: '', post: '' } : { pre: text.slice(0, i), hit: text.slice(i, i + q.length), post: text.slice(i + q.length) };
}

/**
 * Lista de opciones (role="listbox") con foco virtual: el foco real queda en el buscador o en la lista
 * y la opción activa se anuncia con aria-activedescendant. Flechas, Inicio/Fin, Enter, Espacio y escribir para saltar.
 * Uso interno de las moléculas de selección.
 */
@Component({
  selector: 'zc-listbox',
  imports: [FlagComponent, IconComponent, ScrollAreaDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  template: `
    <ul role="listbox" zcScrollArea [zcScrollAreaFocusable]="false" [id]="listId()" [attr.aria-multiselectable]="multiple() || null" [attr.aria-label]="label() || null"
      [attr.tabindex]="focusable() ? 0 : null" [attr.data-autofocus]="focusable() ? '' : null" [attr.aria-activedescendant]="focusable() ? activeId() : null"
      (keydown)="onListKey($event)"
      [class]="'zc-bare m-0 grid list-none content-start gap-0.5 overflow-y-auto p-0 ' + (fill() ? 'max-h-none' : 'max-h-[300px]')">
      @for (o of options(); track $index; let i = $index) {
        @if (o.group && o.group !== options()[i - 1]?.group) {
          <li role="presentation" aria-hidden="true" class="px-3 pt-2 pb-0.5 text-xs text-muted">{{ o.group }}</li>
        }
        @if (o.separatorBefore && i > 0) { <li role="presentation" aria-hidden="true" class="mx-1 my-1 h-px bg-border"></li> }
        <li role="option" [id]="listId() + '-o' + i" [attr.aria-selected]="isSelected()(o)" [attr.aria-disabled]="o.disabled || null"
          class="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-3 py-1.5 text-[15px] leading-5 max-md:min-h-12 pointer-coarse:min-h-12 aria-disabled:cursor-not-allowed aria-disabled:opacity-45"
          [class]="i === active() ? 'bg-surface-2' : ''" (mousedown)="$event.preventDefault()" (mousemove)="active.set(i)" (click)="choose(i)">
          @if (multiple()) {
            <span class="grid size-5 shrink-0 place-items-center rounded-xs border-[1.5px] text-on-primary" [class]="isSelected()(o) ? 'border-primary bg-primary' : 'border-border-strong'" aria-hidden="true">
              @if (isSelected()(o)) { <zc-icon name="l:check" [size]="16" /> }
            </span>
          }
          @if (o.flag) { <zc-flag [code]="o.flag" [size]="15" /> }
          @if (o.icon) { <zc-icon [name]="o.icon" [size]="16" class="text-muted" /> }
          <span class="grid grid-cols-[minmax(0,1fr)] min-w-0 flex-1">
            @let h = parts(o.label);
            <span class="break-words">{{ h.pre }}@if (h.hit) {<mark class="zc-mark">{{ h.hit }}</mark>}{{ h.post }}</span>
            @if (o.description) { <span class="text-[13px] text-muted">{{ o.description }}</span> }
          </span>
          @if (o.meta) { <span class="ml-auto shrink-0 text-[13px] text-muted num">{{ o.meta }}</span> }
          @if (!multiple()) { <zc-icon name="l:check" [size]="16" class="shrink-0" [class.invisible]="!isSelected()(o)" /> }
        </li>
      }
      @if (!options().length) { <li role="presentation" class="p-3 text-sm text-muted">{{ emptyText() }}</li> }
    </ul>`,
})
export class ListboxComponent<T = unknown> {
  readonly options = input.required<readonly ZcOption<T>[]>();
  readonly listId = input.required<string>();
  readonly isSelected = input<(o: ZcOption<T>) => boolean>(() => false);
  readonly multiple = input(false);
  /** Texto buscado, para resaltar la coincidencia. */
  readonly query = input('');
  readonly emptyText = input('');
  readonly label = input('');
  /** Sin buscador, la lista recibe el foco y maneja el teclado. */
  readonly focusable = input(false);
  /** Ocupa el alto disponible (sheet y subpantalla). */
  readonly fill = input(false);
  readonly active = model(0);
  readonly pick = output<ZcOption<T>>();

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly activeId = computed(() => (this.options()[this.active()] ? `${this.listId()}-o${this.active()}` : null));
  private typed = ''; private typedAt = 0;

  constructor() {
    afterRenderEffect(() => {
      const id = this.activeId();
      if (id) this.el.nativeElement.querySelector(`#${CSS.escape(id)}`)?.scrollIntoView({ block: 'nearest' });
    });
  }

  parts(label: string) { return highlight(label, this.query()); }

  choose(i: number) {
    const o = this.options()[i];
    if (!o || o.disabled) return;
    this.active.set(i);
    this.pick.emit(o);
  }

  /** Primera opción habilitada desde i en la dirección dada (con vuelta). */
  private step(from: number, dir: 1 | -1): number {
    const list = this.options(); const n = list.length;
    for (let k = 1; k <= n; k++) { const j = (from + dir * k + n * k) % n; if (!list[j].disabled) return j; }
    return from;
  }

  /** Escribir para saltar: busca la siguiente opción que empieza con lo tecleado. */
  typeahead(char: string) {
    const now = Date.now();
    this.typed = now - this.typedAt > 600 ? char : this.typed + char;
    this.typedAt = now;
    const i = typeaheadIndex(this.options(), this.active(), this.typed);
    if (i >= 0) this.active.set(i);
  }

  // Sin valor de retorno: en un listener de template, devolver false hace preventDefault (y Escape no cerraría el panel).
  onListKey(e: KeyboardEvent): void { if (this.focusable()) this.handleKey(e); }

  /** Teclado compartido por la lista y por el buscador. Devuelve true si lo manejó (no usar directo en un listener de template). */
  handleKey(e: KeyboardEvent, opts: { space?: boolean; typeahead?: boolean } = { space: true, typeahead: true }): boolean {
    if (!this.options().length) return false;
    const last = this.options().length - 1;
    switch (e.key) {
      case 'ArrowDown': this.active.set(this.step(this.active(), 1)); break;
      case 'ArrowUp': this.active.set(this.step(this.active(), -1)); break;
      case 'Home': this.active.set(this.step(last, 1)); break;
      case 'End': this.active.set(this.step(0, -1)); break;
      case 'Enter': this.choose(this.active()); break;
      case ' ': if (!opts.space) return false; this.choose(this.active()); break;
      default:
        if (opts.typeahead && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { this.typeahead(e.key); break; }
        return false;
    }
    e.preventDefault();
    return true;
  }
}
