import { ChangeDetectionStrategy, Component, DestroyRef, Directive, ElementRef, afterNextRender, afterRenderEffect, computed, inject, input, viewChild } from '@angular/core';
import { BrnTabs, BrnTabsContent, BrnTabsList, BrnTabsTrigger } from '@spartan-ng/brain/tabs';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { placeIndicator, ScrollAreaDirective } from '@zonacards/ui/core';

export interface ZcTab {
  value: string;
  label: string;
  icon?: IconName;
  /** Contador junto a la etiqueta (pestañas de línea): "Pendientes 12". */
  count?: number;
  disabled?: boolean;
}

/**
 * <zc-tabs> · sobre spartan brain tabs (flechas izquierda/derecha, Inicio/Fin, una seleccionada).
 * - line (por defecto): subrayado, con ícono y contador; para secciones de una ficha o estados de una lista.
 * - segmented: pastilla con fondo; para alternar vistas o periodos con 2 a 4 opciones.
 * Si no caben, se desplazan en horizontal con degradado en el borde (nunca saltan de línea).
 * El subrayado o la pastilla se desliza a la pestaña nueva (no salta).
 * Valor activo con [(value)] (lo maneja brain tabs). Paneles: <div zcTabPanel="valor">…</div> dentro del componente.
 */
@Component({
  selector: 'zc-tabs',
  imports: [BrnTabsList, BrnTabsTrigger, IconComponent, ScrollAreaDirective],
  hostDirectives: [{ directive: BrnTabs, inputs: ['brnTabs: value', 'activationMode'], outputs: ['brnTabsChange: valueChange'] }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4' },
  template: `
    <div zcScrollArea class="min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" [class]="variant() === 'line' ? 'border-b border-border' : ''">
      <div #list brnTabsList [attr.aria-label]="label() || null" [class]="listClass()">
        <span #ind aria-hidden="true" [class]="indicatorClass()"></span>
        @for (t of tabs(); track t.value) {
          <button type="button" [brnTabsTrigger]="t.value" [disabled]="t.disabled" [class]="triggerClass()">
            @if (t.icon) { <zc-icon [name]="t.icon" [size]="16" /> }
            <span>{{ t.label }}</span>
            @if (t.count !== undefined) {
              <span class="num inline-grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold text-on-primary">{{ t.count }}</span>
            }
          </button>
        }
      </div>
    </div>
    <ng-content />`,
})
export class TabsComponent {
  readonly tabs = input.required<readonly ZcTab[]>();
  readonly variant = input<'line' | 'segmented'>('line');
  /** Nombre accesible del grupo de pestañas. */
  readonly label = input('');
  private readonly brn = inject(BrnTabs);
  private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');
  private readonly ind = viewChild.required<ElementRef<HTMLElement>>('ind');
  private readonly destroy = inject(DestroyRef);
  private placed = false;

  constructor() {
    afterRenderEffect(() => { this.brn.$activeTab(); this.tabs(); this.variant(); this.place(); });
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      // Un cambio de tamaño (la opción en negrita, la fuente que carga) recoloca sin cortar el deslizamiento en curso.
      const ro = new ResizeObserver(() => this.place());
      ro.observe(this.list().nativeElement);
      this.destroy.onDestroy(() => ro.disconnect());
    });
  }
  private place() {
    const active = this.list().nativeElement.querySelector<HTMLElement>('[data-state="active"]');
    placeIndicator(this.ind().nativeElement, active, this.placed);
    this.placed = !!active;
  }

  readonly listClass = computed(() => this.variant() === 'line'
    ? 'relative flex w-max min-w-full gap-5'
    : 'relative inline-flex w-max gap-1 rounded-full bg-surface-2 p-1');
  readonly indicatorClass = computed(() => 'pointer-events-none absolute left-0 opacity-0 ' + (this.variant() === 'line'
    ? 'bottom-0 h-0.5 rounded-full bg-fg'
    : 'top-1 bottom-1 rounded-full bg-surface shadow-1'));

  readonly triggerClass = computed(() => {
    const base = 'relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap text-body leading-none text-muted transition-colors duration-(--dur-base) ease-standard hover:enabled:text-fg disabled:cursor-not-allowed disabled:opacity-45 data-[state=active]:font-medium data-[state=active]:text-fg ';
    return base + (this.variant() === 'line'
      // El subrayado y la pastilla son el indicador deslizante de la lista (dentro del área con desplazamiento: no se recorta).
      ? 'h-target px-0.5 focus-visible:outline-offset-[-2px]'
      : 'h-[calc(var(--target)-8px)] rounded-full px-4');
  });
}

/** Panel de una pestaña: <div zcTabPanel="datos">…</div>. Solo se muestra el activo. */
@Directive({
  selector: '[zcTabPanel]',
  hostDirectives: [{ directive: BrnTabsContent, inputs: ['brnTabsContent: zcTabPanel'] }],
  host: { class: 'min-w-0 outline-none' },
})
export class TabPanelDirective {}
