import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '../icon/icon.component';

/**
 * Chip = dato removible o seleccionable (el estado va en zc-badge).
 * - estático: <zc-chip label="Gastronomía" />
 * - removible: <zc-chip label="País: Perú" removable (remove)="…" />
 * - seleccionable: <zc-chip label="Propias" selectable [(selected)]="x" /> (botón con aria-pressed)
 * - inválido: <zc-chip label="correo@mal" removable invalid /> (color + ícono, nunca solo color)
 */
@Component({
  selector: 'zc-chip',
  imports: [IconComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex min-w-0 max-w-full' },
  template: `
    @if (selectable()) {
      <button type="button" [class]="classes()" [attr.aria-pressed]="selected()" [disabled]="disabled()" [title]="label()" (click)="selected.set(!selected())">
        @if (selected()) { <zc-icon name="l:check" [size]="16" /> }<span class="min-w-0 truncate">{{ label() }}</span>
      </button>
    } @else {
      <span [class]="classes()" [title]="label()">
        @if (invalid()) { <zc-icon name="s:danger-circle" [size]="16" /><span class="sr-only">{{ 'ui.invalido' | transloco }}:</span> }
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
  readonly removable = input(false);
  readonly selectable = input(false);
  readonly selected = model(false);
  readonly invalid = input(false);
  readonly disabled = input(false);
  readonly remove = output<void>();

  readonly classes = computed(() => {
    const base = 'inline-flex h-8 min-w-0 max-w-full items-center gap-1.5 whitespace-nowrap rounded-full border text-[13px] leading-none transition-[background,border-color,color] duration-(--dur) disabled:cursor-not-allowed disabled:opacity-45 ';
    const pad = this.removable() && !this.selectable() ? 'pl-3 pr-1 ' : 'px-3 ';
    if (this.invalid()) return base + pad + 'border-danger-bd bg-danger-bg text-danger';
    if (this.selectable()) return base + pad + 'cursor-pointer ' + (this.selected() ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface-2 text-fg hover:enabled:border-border-strong');
    return base + pad + 'border-border bg-surface-2 text-fg';
  });
}
