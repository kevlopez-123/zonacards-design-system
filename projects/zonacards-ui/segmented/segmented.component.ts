import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, afterRenderEffect, computed, inject, input, model, viewChild } from '@angular/core';
import { placeIndicator } from '@zonacards/ui/core';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { TooltipDirective } from '@zonacards/ui/tooltip';

export interface ZcSegment<T = string> {
  value: T;
  label: string;
  icon?: IconName;
  /** Solo ícono: el label queda como nombre accesible y tooltip. */
  iconOnly?: boolean;
  disabled?: boolean;
}

/**
 * <zc-segmented label="Estilo de logo" [options]="…" [(value)]="x" /> · ToggleButtonGroup (".seg-group" de index.html):
 * 2 a 5 opciones excluyentes siempre visibles (vista, densidad, periodo, escala). Grupo de radio: Tab entra a la opción
 * marcada, las flechas cambian y mueven el foco (con vuelta, saltando las deshabilitadas).
 * size="sm" para barras de herramientas (gráficos, tablas). Si no cabe, se desplaza en horizontal.
 * La pastilla de la opción marcada se desliza a la nueva (no salta).
 */
@Component({
  selector: 'zc-segmented',
  imports: [IconComponent, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'radiogroup', '[attr.aria-label]': 'label()', '[attr.title]': 'null',
    class: 'relative inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-surface-2 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
    '(keydown)': 'onKey($event)',
  },
  template: `
    <span #pill class="pointer-events-none absolute top-1 bottom-1 left-0 rounded-full bg-surface opacity-0 shadow-[0_1px_2px_rgb(0_0_0/.1)]" aria-hidden="true"></span>
    @for (o of options(); track o.value) {
      <button type="button" role="radio" [attr.aria-checked]="o.value === value()" [attr.tabindex]="o.value === value() ? 0 : -1"
        [attr.aria-label]="o.iconOnly ? o.label : null" [zcTooltip]="o.iconOnly ? o.label : ''" [zcTooltipDisabled]="!o.iconOnly"
        [disabled]="o.disabled" [class]="itemClass()" [class.px-0]="o.iconOnly" [class.aspect-square]="o.iconOnly" [class.justify-center]="o.iconOnly"
        (click)="choose(o)">
        @if (o.icon) { <zc-icon [name]="o.icon" [size]="16" /> }
        @if (!o.iconOnly) { {{ o.label }} }
      </button>
    }`,
})
export class SegmentedComponent<T = string> {
  readonly options = input.required<readonly ZcSegment<T>[]>();
  readonly value = model<T | null>(null);
  readonly label = input.required<string>();
  readonly size = input<'md' | 'sm'>('md');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly pill = viewChild.required<ElementRef<HTMLElement>>('pill');
  private placed = false;

  constructor() {
    // La pastilla sigue a la opción marcada; la primera vez se coloca sin animar.
    afterRenderEffect(() => { this.value(); this.options(); this.size(); this.place(); });
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      // Un cambio de tamaño (la opción en negrita, la fuente que carga) recoloca sin cortar el deslizamiento en curso.
      const ro = new ResizeObserver(() => this.place());
      ro.observe(this.host.nativeElement);
      this.destroy.onDestroy(() => ro.disconnect());
    });
  }
  private readonly destroy = inject(DestroyRef);
  private place() {
    const active = this.host.nativeElement.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]');
    placeIndicator(this.pill().nativeElement, active, this.placed);
    this.placed = !!active;
  }

  readonly itemClass = computed(() =>
    'relative inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full leading-none text-muted transition-colors duration-(--dur-base) ease-standard '
    + 'hover:enabled:text-fg aria-checked:font-medium aria-checked:text-fg disabled:cursor-not-allowed disabled:opacity-45 '
    + (this.size() === 'sm' ? 'h-[calc(var(--target-sm)-8px)] px-3 text-[13.5px]' : 'h-[calc(var(--target)-8px)] px-4 text-[15px]'));

  choose(o: ZcSegment<T>) { if (!o.disabled) this.value.set(o.value); }

  onKey(e: KeyboardEvent): void {
    const dir = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[e.key];
    const opts = this.options();
    if (!dir) {
      if (e.key !== 'Home' && e.key !== 'End') return;
    }
    e.preventDefault();
    const enabled = opts.map((o, i) => ({ o, i })).filter(x => !x.o.disabled);
    if (!enabled.length) return;
    const cur = enabled.findIndex(x => x.o.value === this.value());
    const next = e.key === 'Home' ? enabled[0] : e.key === 'End' ? enabled[enabled.length - 1] : enabled[(cur + dir + enabled.length) % enabled.length];
    this.value.set(next.o.value);
    this.host.nativeElement.querySelectorAll<HTMLElement>('[role="radio"]')[next.i]?.focus();
  }
}
