import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '@zonacards/ui/icon';
import { injectLang, injectTranslate } from '@zonacards/ui/core';

const SIZE = { sm: 16, md: 20, lg: 32 } as const;

/**
 * <zc-rating label="Calificación del producto" [(value)]="stars" /> · Estrellas para dar o mostrar una calificación.
 * - Solo lectura (`readonly`): una imagen con su texto ("Calificación del producto: 4,5 de 5, 128 opiniones"); acepta fracciones (4,3 llena
 *   el 30 % de la quinta estrella). Con `count` muestra el número de opiniones al lado y con `showValue`, la nota.
 * - Interactiva: un solo control (`role="slider"`, una parada de Tab). Clic o toque eligen la estrella (con `allowHalf`, la mitad izquierda
 *   vale 0,5); flechas ±1 (±0,5 con medias), Re Pág/Av Pág ±1, Inicio quita la calificación y Fin pone el máximo. Al pasar el puntero se
 *   previsualiza. 0 es "sin calificar".
 * `label` es obligatorio: sin él, el control no tiene nombre. El color es el de advertencia del sistema (nunca solo color: la nota va en el
 * texto accesible y, con `showValue`, a la vista).
 */
@Component({
  selector: 'zc-rating',
  imports: [IconComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex min-w-0 items-center gap-2' },
  template: `
    <span [attr.role]="readonly() ? 'img' : 'slider'" [attr.aria-label]="readonly() ? text() : label()"
      [attr.tabindex]="!readonly() && !disabled() ? 0 : null" [attr.aria-valuemin]="readonly() ? null : 0" [attr.aria-valuemax]="readonly() ? null : max()"
      [attr.aria-valuenow]="readonly() ? null : current()" [attr.aria-valuetext]="readonly() ? null : text()" [attr.aria-disabled]="disabled() || null"
      class="relative inline-flex touch-none select-none rounded-sm outline-offset-4 focus-visible:outline-(length:--focus-ring-width) focus-visible:outline-focus"
      [class]="readonly() || disabled() ? 'cursor-default' : 'cursor-pointer'" [style.opacity]="disabled() ? 'var(--opacity-disabled)' : null"
      (click)="pick($event)" (pointermove)="hoverAt($event)" (pointerleave)="hover.set(null)" (keydown)="onKey($event)">
      @for (i of stars(); track i) {
        <span class="relative inline-grid place-items-center" [style.width.px]="px()" [style.height.px]="px()" aria-hidden="true">
          <zc-icon name="s:star" [size]="px()" class="text-subtle" />
          <span class="absolute top-0 left-0 flex overflow-hidden" [style.width.%]="fill(i)" [style.height.px]="px()">
            <span class="inline-grid shrink-0 place-items-center text-warning" [style.width.px]="px()" [style.height.px]="px()">
              <zc-icon name="s:star-bold" [size]="px()" class="col-start-1 row-start-1" />
              <zc-icon name="s:star" [size]="px()" class="col-start-1 row-start-1" />
            </span>
          </span>
        </span>
      }
    </span>
    @if (showValue()) { <span class="num text-body-sm font-medium" aria-hidden="true">{{ valueText() }}</span> }
    @if (count() !== null) { <span class="text-caption text-muted" aria-hidden="true">({{ count() }})</span> }`,
})
export class RatingComponent {
  /** Nombre del control o de lo que se califica ("Calificación del producto"). */
  readonly label = input.required<string>();
  /** De 0 a `max`; 0 o vacío es "sin calificar". Con `readonly` puede tener decimales. */
  readonly value = model<number | null>(0);
  readonly max = input(5);
  readonly readonly = input(false);
  readonly disabled = input(false);
  /** Medias estrellas con el puntero y con el teclado. */
  readonly allowHalf = input(false);
  readonly size = input<keyof typeof SIZE>('md');
  /** Número de opiniones, al lado de las estrellas y en el texto accesible. */
  readonly count = input<number | null>(null);
  readonly showValue = input(false);

  private readonly lang = injectLang();
  private readonly t = injectTranslate();
  protected readonly hover = signal<number | null>(null);
  protected readonly px = computed(() => SIZE[this.size()]);
  protected readonly stars = computed(() => Array.from({ length: Math.max(1, Math.floor(this.max())) }, (_, i) => i));
  /** Lo que se pinta: la vista previa del puntero o el valor, acotado a [0, max]. */
  private readonly shown = computed(() => this.clamp(this.hover() ?? this.value() ?? 0));
  protected readonly current = computed(() => this.clamp(this.value() ?? 0));
  protected readonly valueText = computed(() => this.current().toLocaleString(this.lang(), { maximumFractionDigits: 1 }));
  protected readonly text = computed(() => {
    const v = this.current();
    const base = v > 0 ? this.t('ui.calificacion', { label: this.label(), value: this.valueText(), max: this.max() }) : this.t('ui.sinCalificar', { label: this.label() });
    const n = this.count();
    return n === null ? base : `${base}, ${this.t('ui.nOpiniones', { n })}`;
  });

  protected fill(i: number) { return Math.max(0, Math.min(1, this.shown() - i)) * 100; }
  private clamp(v: number) { return Math.max(0, Math.min(this.max(), v)); }
  private step() { return this.allowHalf() ? 0.5 : 1; }
  private interactive() { return !this.readonly() && !this.disabled(); }

  /** Valor bajo el puntero: la estrella sobre la que está y, con medias, si es su mitad izquierda. */
  private at(e: MouseEvent) {
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const slot = box.width / this.stars().length;
    const x = Math.max(0, Math.min(box.width, e.clientX - box.left));
    const idx = Math.min(this.stars().length - 1, Math.floor(x / slot));
    const inside = (x - idx * slot) / slot;
    return idx + (this.allowHalf() && inside <= 0.5 ? 0.5 : 1);
  }
  hoverAt(e: PointerEvent) { if (this.interactive() && e.pointerType === 'mouse') this.hover.set(this.at(e)); }
  pick(e: MouseEvent) { if (this.interactive()) { this.value.set(this.at(e)); this.hover.set(null); } }

  onKey(e: KeyboardEvent): void {
    if (!this.interactive()) return;
    const v = this.current();
    const next = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? v + this.step()
      : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? v - this.step()
      : e.key === 'PageUp' ? v + 1 : e.key === 'PageDown' ? v - 1
      : e.key === 'Home' ? 0 : e.key === 'End' ? this.max() : null;
    if (next === null) return;
    e.preventDefault();
    this.value.set(this.clamp(next));
  }
}
