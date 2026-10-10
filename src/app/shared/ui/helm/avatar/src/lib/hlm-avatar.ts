import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BrnAvatar } from '@spartan-ng/brain/avatar';
import { classes } from '@spartan-ng/helm/utils';

/** Tokens Zonacards (docs/design-system · Avatar): sm 32, md 40, lg 56; redondo o cuadrado (empresa). */
@Component({
  selector: 'hlm-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'avatar',
    '[attr.data-size]': 'size()',
    '[attr.data-shape]': 'shape()',
  },
  template: `
    @if (_image()?.canShow()) {
      <ng-content select="[hlmAvatarImage],[brnAvatarImage]" />
    } @else {
      <ng-content select="[hlmAvatarFallback],[brnAvatarFallback]" />
    }
    <ng-content />
  `,
})
export class HlmAvatar extends BrnAvatar {
  public readonly size = input<'default' | 'sm' | 'lg'>('default');
  public readonly shape = input<'circle' | 'square'>('circle');

  constructor() {
    super();
    classes(
      () =>
        'group/avatar relative flex size-10 shrink-0 select-none rounded-full data-[shape=square]:rounded-ms data-[size=lg]:size-14 data-[size=sm]:size-8',
    );
  }
}
