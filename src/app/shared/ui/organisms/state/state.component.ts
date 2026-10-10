import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../../atoms/icon/icon.component';
import { IconName } from '../../atoms/icon/icon-registry.generated';

/** Estado vacío, sin resultados, sin acceso o error: qué pasó, por qué y una acción para salir. */
@Component({
  selector: 'zc-state',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid content-center justify-items-center gap-3 rounded-md border border-dashed border-border-strong px-5 py-8 text-center', '[attr.role]': 'kind() === "error" ? "alert" : null' },
  template: `
    <span class="grid size-14 place-items-center rounded-2xl" [class]="kind() === 'error' ? 'bg-danger-bg text-danger' : 'bg-surface-2'"><zc-icon [name]="icon()" [size]="24" /></span>
    <h3 class="text-[17px] font-semibold leading-6">{{ title() }}</h3>
    <p class="max-w-[40ch] text-[14.5px] leading-[22px] text-muted">{{ text() }}</p>
    <ng-content />
    @if (reference()) { <span class="text-xs text-muted num">Ref. {{ reference() }}</span> }`,
})
export class StateComponent {
  readonly kind = input<'empty' | 'error'>('empty');
  readonly icon = input<IconName>('s:box');
  readonly title = input.required<string>();
  readonly text = input('');
  readonly reference = input('');
}
