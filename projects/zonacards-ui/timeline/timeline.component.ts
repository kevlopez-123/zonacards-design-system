import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';

export interface ZcTimelineItem { icon: IconName; title: string; /** Fecha, autor, detalle: una línea en gris. */ meta?: string }

/** <zc-timeline [items]="historial" label="Historial de la giftcard" /> · historial vertical (o-domain de index.html). */
@Component({
  selector: 'zc-timeline',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  template: `
    <ol class="m-0 grid list-none grid-cols-[minmax(0,1fr)] p-0" [attr.aria-label]="label() || null">
      @for (it of items(); track $index; let last = $last) {
        <li class="relative grid grid-cols-[36px_minmax(0,1fr)] gap-3 pb-4">
          @if (!last) { <span class="absolute top-10 bottom-1 left-[17px] w-0.5 bg-border" aria-hidden="true"></span> }
          <span class="grid size-9 place-items-center rounded-full bg-surface-2" aria-hidden="true"><zc-icon [name]="it.icon" [size]="16" /></span>
          <div class="grid min-w-0 gap-0.5 pt-1.5">
            <span class="break-words font-medium">{{ it.title }}</span>
            @if (it.meta) { <span class="break-words text-[13px] leading-[18px] text-muted">{{ it.meta }}</span> }
          </div>
        </li>
      }
    </ol>`,
})
export class TimelineComponent {
  readonly items = input.required<readonly ZcTimelineItem[]>();
  readonly label = input('');
}
