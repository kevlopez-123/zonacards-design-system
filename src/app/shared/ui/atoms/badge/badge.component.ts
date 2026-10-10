import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Tone } from '../../../domain/states';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/icon-registry.generated';

const TONES: Record<Tone, string> = {
  success: 'bg-success-bg text-success border-success-bd', warning: 'bg-warning-bg text-warning border-warning-bd',
  danger: 'bg-danger-bg text-danger border-danger-bd', info: 'bg-info-bg text-info border-info-bd',
  accent: 'bg-accent-bg text-accent border-accent-bd', neutral: 'bg-neutral-bg text-neutral border-neutral-bd',
};

/** Estado: siempre ícono + texto, nunca solo color. */
@Component({
  selector: 'zc-badge',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
  template: `@if (icon(); as i) { <zc-icon [name]="i" [size]="16" /> }<ng-content />`,
})
export class BadgeComponent {
  readonly tone = input<Tone>('neutral');
  readonly icon = input<IconName | null>(null);
  readonly classes = computed(() => 'inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border pr-2.5 text-[13px] font-medium leading-none ' + (this.icon() ? 'pl-2 ' : 'pl-2.5 ') + TONES[this.tone()]);
}
