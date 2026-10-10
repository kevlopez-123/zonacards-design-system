import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Injectable, TemplateRef, computed, forwardRef, inject, input, linkedSignal, model, output, signal, viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ButtonDirective } from '../../atoms/button/button.directive';
import { IconComponent } from '../../atoms/icon/icon.component';
import { SpinnerComponent } from '../../atoms/spinner/spinner.component';
import { injectTranslate } from '../../lang';
import { BARE_INPUT, CONTROL_BOX, INLINE_BTN } from '../../viewport';
import { FieldComponent } from '../field/field.component';
import { ListboxComponent, ZcOption, filterOptions, normalize } from '../listbox/listbox.component';
import { Panel } from '../panel/panel';

/** Búsquedas recientes por clave, solo en memoria (sin datos en el almacenamiento del navegador). */
@Injectable({ providedIn: 'root' })
export class RecentSearches {
  private readonly map = signal<Record<string, string[]>>({});
  get(key: string) { return this.map()[key] ?? []; }
  add(key: string, text: string) { this.map.update(m => ({ ...m, [key]: [text, ...(m[key] ?? []).filter(x => x !== text)].slice(0, 5) })); }
  clear(key: string) { this.map.update(m => ({ ...m, [key]: [] })); }
}

export type AutocompletePick<T = unknown> =
  | { kind: 'option'; text: string; option: ZcOption<T> }
  | { kind: 'recent' | 'create' | 'all'; text: string };

type Item<T> = ZcOption<AutocompletePick<T>>;
let seq = 0;

/**
 * <zc-autocomplete> · texto libre con sugerencias (a diferencia del combobox, no obliga a elegir de una lista).
 * Sugerencias desde 2 letras con 250 ms de espera, coincidencia resaltada, grupos, búsquedas recientes al enfocar vacío,
 * "Buscando…", sin resultados con alternativa, "Crear" y "Buscar en todo". La lista va bajo el campo también en móvil.
 * Escape cierra la lista; con la lista cerrada, borra el texto.
 */
@Component({
  selector: 'zc-autocomplete',
  imports: [ButtonDirective, IconComponent, ListboxComponent, SpinnerComponent, TranslocoPipe],
  providers: [Panel, { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AutocompleteComponent), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0' },
  template: `
    <div #box [class]="boxClass" [attr.data-invalid]="invalidState()" [attr.data-disabled]="isDisabled()">
      <zc-icon name="s:magnifier" [size]="16" class="ml-4 text-muted" />
      <input #inp [class]="inputClass" type="text" role="combobox" autocomplete="off" aria-autocomplete="list"
        [attr.aria-expanded]="panel.isOpen()" [attr.aria-controls]="panel.isOpen() ? listId : null" [attr.aria-activedescendant]="panel.isOpen() ? activeId() : null"
        [id]="field?.controlId" [attr.aria-describedby]="field?.messageId" [attr.aria-invalid]="invalidState() || null"
        [placeholder]="placeholder()" [disabled]="isDisabled()" [value]="value()"
        (input)="onInput($event)" (focus)="onFocus()" (keydown)="onKey($event)" (blur)="onBlur()" />
      @if (value()) {
        <button type="button" [class]="btnClass" [attr.aria-label]="'ui.borrar' | transloco" (click)="clearText()"><zc-icon name="l:x" [size]="16" /></button>
      }
    </div>
    <span class="sr-only" aria-live="polite">{{ status() }}</span>
    <ng-template #tpl>
      @if (loading()) {
        <p class="m-0 flex items-center gap-2 p-3 text-sm text-muted"><zc-spinner [size]="16" />{{ 'ui.buscando' | transloco }}</p>
      } @else if (!items().length && query().length < minChars()) {
        <p class="m-0 p-3 text-sm text-muted">{{ 'ui.escribeMinimo' | transloco: { n: minChars() } }}</p>
      } @else {
        <zc-listbox [listId]="listId" [options]="items()" [query]="mode() === 'results' ? query() : ''" [(active)]="active"
          [emptyText]="'ui.sinResultadosAyuda' | transloco: { q: query() }" (pick)="choose($any($event.value))" />
        @if (mode() === 'recent') {
          <div class="mt-1 flex justify-end border-t border-border pt-1">
            <button zcButton variant="ghost" size="sm" tabindex="-1" (mousedown)="$event.preventDefault()" (click)="clearRecents()">{{ 'ui.borrarRecientes' | transloco }}</button>
          </div>
        }
      }
    </ng-template>`,
})
export class AutocompleteComponent<T = unknown> implements ControlValueAccessor {
  /** Opciones locales (se filtran aquí) o una búsqueda propia con `search`. */
  readonly options = input<readonly ZcOption<T>[]>([]);
  readonly search = input<((q: string) => Promise<ZcOption<T>[]> | ZcOption<T>[]) | null>(null);
  /** Clave de las búsquedas recientes (una lista por campo). */
  readonly recentKey = input('');
  readonly placeholder = input('');
  readonly minChars = input(2);
  readonly debounce = input(250);
  readonly maxResults = input(8);
  readonly allowCreate = input(false);
  readonly searchAll = input(false);
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly value = model('');
  readonly picked = output<AutocompletePick<T>>();

  readonly panel = inject(Panel);
  readonly field = inject(FieldComponent, { optional: true });
  private readonly i18n = inject(TranslocoService);
  private readonly recents = inject(RecentSearches);
  private readonly boxRef = viewChild.required<ElementRef<HTMLElement>>('box');
  private readonly inpRef = viewChild.required<ElementRef<HTMLInputElement>>('inp');
  private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');

  readonly listId = `zc-ac-${++seq}`;
  readonly boxClass = CONTROL_BOX;
  readonly inputClass = BARE_INPUT + ' pl-3';
  readonly btnClass = INLINE_BTN;
  readonly isDisabled = linkedSignal(this.disabled);
  readonly invalidState = computed(() => this.invalid() || !!this.field?.invalid());
  readonly query = computed(() => this.value().trim());
  readonly loading = signal(false);
  readonly results = signal<ZcOption<T>[]>([]);
  readonly active = signal(-1);
  private readonly recentList = signal<string[]>([]);
  readonly mode = computed<'recent' | 'results'>(() => (this.query().length < this.minChars() ? 'recent' : 'results'));

  private readonly t = injectTranslate();
  readonly items = computed<Item<T>[]>(() => {
    if (this.mode() === 'recent') {
      return this.recentList().map(text => ({ value: { kind: 'recent', text }, label: text, icon: 's:history', group: this.t('ui.recientes') }));
    }
    const q = this.query();
    const list: Item<T>[] = this.results().map(o => ({ ...o, value: { kind: 'option', text: o.label, option: o } }));
    if (this.allowCreate() && !this.results().some(o => normalize(o.label) === normalize(q))) {
      list.push({ value: { kind: 'create', text: q }, label: this.t('ui.crearTexto', { q }), icon: 's:add-circle', separatorBefore: true });
    }
    if (this.searchAll()) list.push({ value: { kind: 'all', text: q }, label: this.t('ui.buscarEnTodo', { q }), icon: 's:magnifier', separatorBefore: !this.allowCreate() });
    return list;
  });
  readonly activeId = computed(() => (this.items()[this.active()] ? `${this.listId}-o${this.active()}` : null));
  readonly status = computed(() => {
    if (!this.panel.isOpen() || this.mode() === 'recent' || this.loading()) return '';
    return this.t('ui.nResultados', { n: this.results().length });
  });

  private timer?: ReturnType<typeof setTimeout>;
  private req = 0;
  private onChange: (v: string) => void = () => {};
  private onTouchedFn: () => void = () => {};

  constructor() { inject(DestroyRef).onDestroy(() => clearTimeout(this.timer)); }

  private openPanel() {
    if (this.panel.isOpen() || this.isDisabled()) return;
    this.panel.open(this.tpl(), {
      title: this.field?.label() ?? '', origin: this.boxRef().nativeElement, returnFocus: this.inpRef().nativeElement,
      mobile: 'popover', keepFocus: true, minWidth: 280,
    });
  }

  onFocus() {
    if (this.query().length < this.minChars()) {
      this.recentList.set(this.recents.get(this.recentKey()));
      this.active.set(-1);
      if (this.recentList().length) this.openPanel();
    }
  }

  onInput(e: Event) {
    this.set((e.target as HTMLInputElement).value);
    this.runSearch();
  }

  private runSearch() {
    clearTimeout(this.timer);
    const q = this.query(); const my = ++this.req;
    this.active.set(-1);
    if (q.length < this.minChars()) {
      this.loading.set(false); this.results.set([]);
      this.recentList.set(this.recents.get(this.recentKey()));
      this.openPanel();
      return;
    }
    this.loading.set(true);
    this.openPanel();
    this.timer = setTimeout(async () => {
      const fn = this.search();
      const found = fn ? await fn(q) : filterOptions(this.options(), q);
      if (my !== this.req) return; // llegó tarde: ya se escribió otra cosa
      this.results.set(found.slice(0, this.maxResults()));
      this.loading.set(false);
      this.active.set(this.items().length ? 0 : -1);
    }, this.debounce());
  }

  onKey(e: KeyboardEvent) {
    const n = this.items().length;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!this.panel.isOpen()) { this.runSearch(); return; }
        if (n) this.active.set((this.active() + 1) % n);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (n) this.active.set((this.active() - 1 + n) % n);
        break;
      case 'Enter':
        if (this.panel.isOpen() && this.active() >= 0 && !this.loading()) { e.preventDefault(); this.choose(this.items()[this.active()].value); }
        break;
      case 'Escape':
        e.preventDefault(); e.stopPropagation();
        if (this.panel.isOpen()) this.panel.close(false); else this.clearText();
        break;
      case 'Tab':
        this.panel.close(false);
        break;
    }
  }

  onBlur() {
    // El clic en una opción no quita el foco (mousedown cancelado); si se va a otro lado, se cierra.
    this.panel.close(false);
    this.onTouchedFn();
  }

  choose(p: AutocompletePick<T>) {
    this.set(p.text);
    if (this.recentKey() && p.kind !== 'create') this.recents.add(this.recentKey(), p.text);
    this.panel.close(false);
    this.picked.emit(p);
  }

  clearText() {
    this.set(''); this.results.set([]);
    this.inpRef().nativeElement.focus();
    this.onFocus();
  }

  clearRecents() { this.recents.clear(this.recentKey()); this.recentList.set([]); this.panel.close(false); }

  private set(v: string) { this.value.set(v); this.onChange(v); }

  writeValue(v: string | null) { this.value.set(v ?? ''); }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouchedFn = fn; }
  setDisabledState(d: boolean) { this.isDisabled.set(d); }
}
