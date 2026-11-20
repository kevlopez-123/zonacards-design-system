import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, Directive, ElementRef, Injector, TemplateRef, afterNextRender, computed, contentChild, inject, input, model, output, viewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonDirective } from '@zonacards/ui/button';
import { ChipComponent } from '@zonacards/ui/chip';
import { IconComponent } from '@zonacards/ui/icon';
import { FIELD_INLINE } from '@zonacards/ui/field';
import { WIDE_QUERY, injectMedia } from '@zonacards/ui/core';
import { OverlayComponent } from '@zonacards/ui/overlay';

export interface ZcFilterChip { id: string; label: string; }

/** Hasta 3 filtros principales: en línea desde 1024 px; dentro del panel de filtros por debajo. */
@Directive({ selector: 'ng-template[zcFilterMain]' })
export class FilterMainDirective { readonly tpl = inject(TemplateRef); }

/** Filtros avanzados: siempre dentro del panel ("Más filtros"). */
@Directive({ selector: 'ng-template[zcFilterMore]' })
export class FilterMoreDirective { readonly tpl = inject(TemplateRef); }

/**
 * <zc-filter-bar> · buscador + 3 filtros visibles + "Más filtros" (drawer) + chips removibles con "Limpiar todo".
 * - Desde 1024 px: los filtros principales van en la barra (etiqueta solo para lectores de pantalla).
 * - Tablet: buscador + "Filtros (n)" que abre un drawer con todos los filtros.
 * - Móvil: el mismo panel como bottom sheet; los selectores dentro se abren como subpantalla con Volver.
 * - Pie del panel: Limpiar / "Ver 144 lotes". Los filtros se aplican al cambiar; el conteo se actualiza en vivo.
 * Organismo sin datos propios: los filtros son plantillas de la página y los chips llegan por input.
 */
@Component({
  selector: 'zc-filter-bar',
  imports: [NgTemplateOutlet, TranslocoPipe, ButtonDirective, ChipComponent, IconComponent, OverlayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // @container: la fila deja de envolverse según el ancho disponible, no el de la ventana (en un panel angosto no desborda).
  host: { class: '@container grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3' },
  template: `
    <div class="flex min-w-0 flex-wrap items-start gap-3 @min-[960px]:flex-nowrap">
      <label class="relative block min-w-0 flex-[1_1_220px] @min-[960px]:flex-[1.4_1_220px]">
        <span class="sr-only">{{ searchLabel() }}</span>
        <zc-icon name="s:magnifier" [size]="16" class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
        <input type="search" [placeholder]="searchPlaceholder()" [value]="query()" (input)="query.set($any($event.target).value)"
          class="h-field w-full rounded-control border border-field-bd bg-field-bg pr-4 pl-10 text-base outline-none transition placeholder:text-subtle hover:border-muted focus:border-focus focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--focus)_22%,transparent)]" />
      </label>
      @if (wide() && main(); as m) {
        <div class="contents [&>*]:min-w-[170px] [&>*]:flex-[1_1_170px]"><ng-container *ngTemplateOutlet="m.tpl; injector: inlineInjector" /></div>
      }
      @if (more() || (!wide() && main())) {
        <button #trigger zcButton variant="outline" class="shrink-0" aria-haspopup="dialog" [attr.aria-expanded]="panelOpen()" (click)="panelOpen.set(true)">
          <zc-icon name="s:tuning-2" [size]="16" />{{ (wide() ? 'org.masFiltros' : 'org.filtros') | transloco }}
          @if (badge()) { <span class="num inline-grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold text-on-primary">{{ badge() }}</span> }
        </button>
      }
    </div>
    @if (chips().length) {
      <div #chipRow class="flex min-w-0 flex-wrap items-center gap-2" role="group" [attr.aria-label]="'org.filtrosActivos' | transloco">
        @for (c of chips(); track c.id; let i = $index) { <zc-chip [label]="c.label" [removable]="true" (remove)="remove(c, i)" /> }
        <button zcButton variant="link" size="sm" class="h-8 text-sm" (click)="clear()">{{ 'org.limpiarTodo' | transloco }}</button>
      </div>
    }
    <zc-drawer #panel [title]="(wide() ? 'org.masFiltros' : 'org.filtros') | transloco" subtitle="" [(open)]="panelOpen">
      @if (!wide() && main(); as m) { <ng-container *ngTemplateOutlet="m.tpl; injector: panel.childInjector" /> }
      @if (more(); as x) { <ng-container *ngTemplateOutlet="x.tpl; injector: panel.childInjector" /> }
      <div zcOverlayFooter>
        <button zcButton variant="outline" (click)="clearAll.emit()">{{ 'ui.limpiar' | transloco }}</button>
        <button zcButton (click)="panelOpen.set(false)">{{ resultText() ? ('org.verX' | transloco: { x: resultText() }) : ('org.verResultados' | transloco) }}</button>
      </div>
    </zc-drawer>`,
})
export class FilterBarComponent {
  readonly query = model('');
  readonly searchLabel = input.required<string>();
  readonly searchPlaceholder = input('');
  readonly chips = input<readonly ZcFilterChip[]>([]);
  /** Resultado con la unidad: "144 lotes" (subtítulo y botón del panel). */
  readonly resultText = input('');
  readonly panelOpen = model(false);
  /** Desde 1024 px la insignia de "Más filtros" cuenta solo los filtros del panel; sin valor, cuenta todos los chips. */
  readonly moreCount = input<number | null>(null);
  readonly badge = computed(() => (this.wide() && this.moreCount() !== null ? this.moreCount()! : this.chips().length));
  readonly removeChip = output<ZcFilterChip>();
  readonly clearAll = output<void>();

  readonly main = contentChild(FilterMainDirective);
  readonly more = contentChild(FilterMoreDirective);
  readonly wide = injectMedia(WIDE_QUERY);
  private readonly injector = inject(Injector);
  readonly inlineInjector = Injector.create({ providers: [{ provide: FIELD_INLINE, useValue: true }], parent: this.injector });
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly chipRow = viewChild<ElementRef<HTMLElement>>('chipRow');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Al quitar un chip el foco pasa al siguiente (o al botón de filtros): nunca se pierde en la página. */
  remove(c: ZcFilterChip, i: number) {
    this.removeChip.emit(c);
    this.refocus(i);
  }

  clear() {
    this.clearAll.emit();
    this.refocus(-1);
  }

  private refocus(i: number) {
    afterNextRender({
      write: () => {
        const btns = Array.from(this.chipRow()?.nativeElement.querySelectorAll<HTMLElement>('zc-chip button') ?? []);
        const target = i >= 0 ? (btns[Math.min(i, btns.length - 1)] ?? null) : null;
        (target ?? this.trigger()?.nativeElement ?? this.host.nativeElement.querySelector<HTMLElement>('input'))?.focus();
      },
    }, { injector: this.injector });
  }
}
