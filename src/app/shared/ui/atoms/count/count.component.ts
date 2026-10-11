import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * <zc-count [value]="12" /> · cantidad (Count de index.html): neutro o peligro; variant="dot" es el punto de "sin leer".
 * Badge = estado; Chip = dato; Count = cantidad. El punto necesita [label] ("Sin leer") porque no tiene texto.
 */
@Component({
  selector: 'zc-count',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()', '[attr.title]': 'null',
    '[attr.role]': "variant() === 'dot' ? 'img' : null", '[attr.aria-label]': "variant() === 'dot' ? label() : null",
  },
  template: `@if (variant() !== 'dot') { {{ value() }} }`,
})
export class CountComponent {
  readonly value = input<number | string>(0);
  readonly variant = input<'neutral' | 'danger' | 'dot'>('neutral');
  readonly label = input('');
  readonly classes = computed(() => (this.variant() === 'dot'
    ? 'inline-block size-2 shrink-0 rounded-full bg-danger'
    : 'num inline-grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs font-semibold leading-none '
      + (this.variant() === 'danger' ? 'bg-danger text-white dark:text-black' : 'bg-primary text-on-primary')));
}
