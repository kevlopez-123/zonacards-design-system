import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';

/**
 * <zc-help-card title="¿Necesitas ayuda?" text="Te asesoramos gratis…"><button zcButton variant="secondary" size="sm">Escríbenos</button></zc-help-card>
 * Ayuda en el checkout y en flujos largos (o-checkout): fondo informativo e ícono a la derecha.
 */
@Component({
  selector: 'zc-help-card',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.title]': 'null', class: 'grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-(--space-card) rounded-card border border-info-bd bg-info-bg p-(--space-card-inset)' },
  template: `
    <div class="grid min-w-0 gap-1.5">
      <strong>{{ title() }}</strong>
      <span class="text-body-sm">{{ text() }}</span>
      <div class="justify-self-start"><ng-content /></div>
    </div>
    <span class="grid size-16 place-items-center rounded-full bg-surface text-info" aria-hidden="true"><zc-icon [name]="icon()" [size]="32" /></span>`,
})
export class HelpCardComponent {
  readonly title = input.required<string>();
  readonly text = input.required<string>();
  readonly icon = input<IconName>('s:headphones-round');
}
