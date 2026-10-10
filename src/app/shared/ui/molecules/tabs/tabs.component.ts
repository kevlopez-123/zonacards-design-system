import { ChangeDetectionStrategy, Component, Directive, computed, input } from '@angular/core';
import { BrnTabs, BrnTabsContent, BrnTabsList, BrnTabsTrigger } from '@spartan-ng/brain/tabs';
import { IconComponent } from '../../atoms/icon/icon.component';
import { IconName } from '../../atoms/icon/icon-registry.generated';
import { ScrollAreaDirective } from '../../scroll-area';

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
      <div brnTabsList [attr.aria-label]="label() || null" [class]="listClass()">
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

  readonly listClass = computed(() => this.variant() === 'line'
    ? 'flex w-max min-w-full gap-5'
    : 'inline-flex w-max gap-1 rounded-full bg-surface-2 p-1');

  readonly triggerClass = computed(() => {
    const base = 'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap text-[15px] leading-none text-muted transition-[background,color,box-shadow] duration-(--dur) hover:enabled:text-fg disabled:cursor-not-allowed disabled:opacity-45 data-[state=active]:font-medium data-[state=active]:text-fg ';
    return base + (this.variant() === 'line'
      // Subrayado de 2 px dentro del botón: no se recorta en el contenedor con desplazamiento.
      ? 'h-target px-0.5 shadow-[inset_0_-2px_0_transparent] data-[state=active]:shadow-[inset_0_-2px_0_var(--text)] focus-visible:outline-offset-[-2px]'
      : 'h-[calc(var(--target)-8px)] rounded-full px-4 data-[state=active]:bg-surface data-[state=active]:shadow-1');
  });
}

/** Panel de una pestaña: <div zcTabPanel="datos">…</div>. Solo se muestra el activo. */
@Directive({
  selector: '[zcTabPanel]',
  hostDirectives: [{ directive: BrnTabsContent, inputs: ['brnTabsContent: zcTabPanel'] }],
  host: { class: 'min-w-0 outline-none' },
})
export class TabPanelDirective {}
