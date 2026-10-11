import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { TooltipDirective } from '@zonacards/ui/tooltip';

/**
 * Chip = dato removible o seleccionable (el estado va en zc-badge).
 * - estático: <zc-chip label="Gastronomía" />
 * - removible: <zc-chip label="País: Perú" removable (remove)="…" />
 * - seleccionable: <zc-chip label="Propias" selectable [(selected)]="x" /> (botón con aria-pressed; seleccionado = relleno primario)
 * - inválido: <zc-chip label="correo@mal" removable invalid /> (tono de peligro; el motivo se dice en el mensaje del campo)
 */
@Component({
  selector: 'zc-chip',
  imports: [IconComponent, TooltipDirective, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex min-w-0 max-w-full' },
  template: `
    @if (selectable()) {
      <button type="button" [class]="classes()" [attr.aria-pressed]="selected()" [disabled]="disabled()" [zcTooltip]="long() ? label() : '' " [zcTooltipDisabled]="!long()" (click)="selected.set(!selected())">
<span class="min-w-0 truncate">{{ label() }}</span>
      </button>
    } @else {
      <span [class]="classes()" [zcTooltip]="long() ? label() : ''" [zcTooltipDisabled]="!long()" [attr.tabindex]="long() && !removable() ? 0 : null">
        @if (icon() && !invalid()) { <zc-icon [name]="icon()!" [size]="16" class="shrink-0" /> }
        @if (invalid()) { <span class="sr-only">{{ 'ui.invalido' | transloco }}:</span> }
        <span class="min-w-0 truncate">{{ label() }}</span>
        @if (removable()) {
          <button type="button" class="-my-1 grid size-6 shrink-0 cursor-pointer place-items-center rounded-full text-current opacity-70 hover:bg-surface-3 hover:opacity-100 disabled:cursor-not-allowed"
            [disabled]="disabled()" [attr.aria-label]="'ui.quitar' | transloco: { label: label() }" (click)="remove.emit()">
            <zc-icon name="l:x" [size]="16" />
          </button>
        }
      </span>
    }`,
})
export class ChipComponent {
  readonly label = input.required<string>();
  /** Ícono decorativo antes del texto (chips de contexto: "Actualizado hace 3 horas"). */
  readonly icon = input<IconName | null>(null);
  readonly removable = input(false);
  readonly selectable = input(false);
  readonly selected = model(false);
  readonly invalid = input(false);
  readonly disabled = input(false);
  readonly remove = output<void>();
  /** Texto que puede truncarse: el completo va en el tooltip. */
  readonly long = computed(() => this.label().length > 28);

  readonly classes = computed(() => {
    const base = 'inline-flex h-8 min-w-0 max-w-full items-center gap-1.5 whitespace-nowrap rounded-full border text-[13px] leading-none transition-[background,border-color,color] duration-(--dur) disabled:cursor-not-allowed disabled:opacity-45 ';
    const pad = this.removable() && !this.selectable() ? 'pl-3 pr-1 ' : 'px-3 ';
    if (this.invalid()) return base + pad + 'border-danger-bd bg-danger-bg text-danger';
    if (this.selectable()) return base + pad + 'cursor-pointer ' + (this.selected() ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface-2 text-fg hover:enabled:border-border-strong');
    return base + pad + 'border-border bg-surface-2 text-fg';
  });
}
