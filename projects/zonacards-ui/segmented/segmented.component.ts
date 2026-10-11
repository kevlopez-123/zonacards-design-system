import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, model } from '@angular/core';
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
 */
@Component({
  selector: 'zc-segmented',
  imports: [IconComponent, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'radiogroup', '[attr.aria-label]': 'label()', '[attr.title]': 'null',
    class: 'inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-surface-2 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
    '(keydown)': 'onKey($event)',
  },
  template: `
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

  readonly itemClass = computed(() =>
    'inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full leading-none text-muted transition-[background,color,box-shadow] duration-(--dur) '
    + 'hover:enabled:text-fg aria-checked:bg-surface aria-checked:font-medium aria-checked:text-fg aria-checked:shadow-[0_1px_2px_rgb(0_0_0/.1)] disabled:cursor-not-allowed disabled:opacity-45 '
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
