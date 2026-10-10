import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, computed, inject, input, linkedSignal, model, output, viewChild } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonDirective } from '../../atoms/button/button.directive';
import { IconComponent } from '../../atoms/icon/icon.component';
import { SpinnerComponent } from '../../atoms/spinner/spinner.component';
import { injectLang, injectTranslate } from '../../lang';
import { ZcOption } from '../listbox/listbox.component';
import { SelectComponent } from '../select/select.component';
import { clampPage, formatCount, numericPages, pageCount, pageRange } from './pages';

/**
 * <zc-pagination> · sección 16 de las reglas: sin paginador si todo cabe en una página (el conteo va en el encabezado de la lista).
 * - compact (recomendada, desktop): filas por página, rango "1–25 de 1.240", "Página [n] de 50" (Enter) y primera/anterior/siguiente/última.
 * - numeric: anterior, hasta 5 números con "…", siguiente.
 * - more (móvil y tarjetas largas): "Mostrando 12 de 48 lotes" y "Cargar 12 más". Emite loadMore; la página decide qué agregar.
 */
@Component({
  selector: 'zc-pagination',
  imports: [ButtonDirective, IconComponent, SelectComponent, SpinnerComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0', '[class.hidden]': 'hidden()' },
  template: `
    @switch (variant()) {
      @case ('compact') {
        <nav [attr.aria-label]="'ui.paginacion' | transloco" class="flex flex-wrap items-center gap-3 text-sm text-muted">
          <span class="inline-flex items-center gap-2">
            <span aria-hidden="true">{{ 'ui.filas' | transloco }}</span>
            <zc-select class="w-[92px]" size="sm" [options]="sizeOptions()" [value]="pageSize()" (valueChange)="setSize($event)" [ariaLabel]="'ui.filasPorPagina' | transloco" />
          </span>
          <span class="num" aria-live="polite">{{ rangeText() }}</span>
          <span class="flex-1"></span>
          <label class="inline-flex items-center gap-2">
            {{ 'ui.pagina' | transloco }}
            <input #jump type="text" inputmode="numeric" autocomplete="off" [value]="draft()" [attr.aria-label]="'ui.irAPagina' | transloco"
              class="num h-target-sm w-16 rounded-sm border border-border-strong bg-surface px-1 text-center text-sm text-fg"
              (beforeinput)="onBeforeInput($event)" (input)="draft.set(jump.value)" (keydown.enter)="go(+jump.value, null)" (blur)="draft.set(page() + '')" />
            {{ 'ui.deN' | transloco: { n: countText() } }}
          </label>
          <span class="inline-flex gap-1">
            <button zcButton variant="outline" size="icon-sm" [disabled]="page() <= 1" [attr.aria-label]="'ui.primeraPagina' | transloco" (click)="go(1, $event)"><zc-icon name="l:chevrons-left" [size]="16" /></button>
            <button zcButton variant="outline" size="icon-sm" [disabled]="page() <= 1" [attr.aria-label]="'ui.paginaAnterior' | transloco" (click)="go(page() - 1, $event)"><zc-icon name="l:chevron-left" [size]="16" /></button>
            <button zcButton variant="outline" size="icon-sm" [disabled]="page() >= count()" [attr.aria-label]="'ui.paginaSiguiente' | transloco" (click)="go(page() + 1, $event)"><zc-icon name="l:chevron-right" [size]="16" /></button>
            <button zcButton variant="outline" size="icon-sm" [disabled]="page() >= count()" [attr.aria-label]="'ui.ultimaPagina' | transloco" (click)="go(count(), $event)"><zc-icon name="l:chevrons-right" [size]="16" /></button>
          </span>
        </nav>
      }
      @case ('numeric') {
        <nav [attr.aria-label]="'ui.paginacion' | transloco" class="flex flex-wrap items-center gap-1">
          <button zcButton variant="ghost" size="sm" class="px-3 max-sm:px-0 max-sm:w-target-sm" [disabled]="page() <= 1" (click)="go(page() - 1, $event)"><zc-icon name="l:chevron-left" [size]="16" /><span class="max-sm:sr-only">{{ 'ui.anterior' | transloco }}</span></button>
          <span class="flex flex-wrap gap-0.5">
            @for (p of pages(); track $index) {
              @if (p === 'gap') {
                <span class="grid h-target-sm min-w-target-sm place-items-center text-sm text-muted" aria-hidden="true">…</span>
              } @else {
                <button type="button" [attr.aria-label]="'ui.paginaN' | transloco: { n: p }" [attr.aria-current]="p === page() ? 'page' : null" (click)="go(p, null)"
                  class="num grid h-target-sm min-w-target-sm cursor-pointer place-items-center rounded-sm px-1 text-sm transition-colors hover:bg-surface-2 aria-[current=page]:bg-primary aria-[current=page]:text-on-primary">{{ p }}</button>
              }
            }
          </span>
          <button zcButton variant="ghost" size="sm" class="px-3 max-sm:px-0 max-sm:w-target-sm" [disabled]="page() >= count()" (click)="go(page() + 1, $event)"><span class="max-sm:sr-only">{{ 'ui.siguiente' | transloco }}</span><zc-icon name="l:chevron-right" [size]="16" /></button>
        </nav>
      }
      @case ('more') {
        <div class="grid max-w-[420px] gap-2">
          <p class="m-0 text-[13px] text-muted num" aria-live="polite">{{ 'ui.mostrandoDe' | transloco: { n: loadedText(), total: totalText(), item: itemLabel() } }}</p>
          <button zcButton variant="outline" [block]="true" [disabled]="loading() || loaded() >= total()" [loading]="loading()" (click)="loadMore.emit()">
            @if (loading()) { <zc-spinner [size]="16" />{{ 'ui.cargando' | transloco }}… }
            @else if (loaded() >= total()) { {{ 'ui.noHayMas' | transloco: { item: itemLabel() } }} }
            @else { {{ 'ui.cargarMas' | transloco: { n: nextBatch() } }} }
          </button>
        </div>
      }
    }`,
})
export class PaginationComponent {
  readonly variant = input<'compact' | 'numeric' | 'more'>('compact');
  readonly total = input.required<number>();
  /** Página actual, desde 1. */
  readonly page = model(1);
  readonly pageSize = model(25);
  readonly pageSizes = input<readonly number[]>([10, 25, 50, 100]);
  /** Variante more: cuántos se muestran ya y si está cargando. */
  readonly loaded = input(0);
  readonly loading = input(false);
  /** Nombre en plural de lo que se lista ("lotes"), para "Mostrando 12 de 48 lotes". */
  readonly itemLabel = input('');
  readonly loadMore = output<void>();

  private readonly lang = injectLang();
  private readonly t = injectTranslate();
  private readonly jump = viewChild<ElementRef<HTMLInputElement>>('jump');
  private readonly injector = inject(Injector);

  readonly count = computed(() => pageCount(this.total(), this.pageSize()));
  readonly hidden = computed(() => (this.variant() === 'more' ? this.total() <= 0 : this.count() <= 1));
  readonly pages = computed(() => numericPages(this.page(), this.count()));
  readonly draft = linkedSignal(() => String(this.page()));
  readonly sizeOptions = computed<ZcOption<number>[]>(() => this.pageSizes().map(n => ({ value: n, label: String(n) })));
  readonly countText = computed(() => formatCount(this.count(), this.lang()));
  readonly totalText = computed(() => formatCount(this.total(), this.lang()));
  readonly loadedText = computed(() => formatCount(Math.min(this.loaded(), this.total()), this.lang()));
  readonly nextBatch = computed(() => Math.min(this.pageSize(), this.total() - this.loaded()));
  readonly rangeText = computed(() => {
    const r = pageRange(this.page(), this.pageSize(), this.total());
    return this.t('ui.rango', { from: formatCount(r.from, this.lang()), to: formatCount(r.to, this.lang()), total: this.totalText() });
  });

  /** Va a la página (limitada a 1..N). Si el botón usado queda deshabilitado, el foco pasa al campo "Página". */
  go(p: number, e: Event | null) {
    const next = clampPage(p, this.count());
    this.page.set(next);
    this.draft.set(String(next));
    const btn = e?.currentTarget as HTMLButtonElement | undefined;
    if (btn && (next === 1 || next === this.count())) {
      afterNextRender({ write: () => { if (btn.disabled) this.jump()?.nativeElement.focus(); } }, { injector: this.injector });
    }
  }

  setSize(v: unknown) {
    const size = Number(v);
    if (!size || size === this.pageSize()) return;
    this.pageSize.set(size);
    this.page.set(1);
  }

  /** Solo dígitos en "Página". */
  onBeforeInput(e: InputEvent) { if (e.data && /\D/.test(e.data)) e.preventDefault(); }
}
