import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '../../../../atoms/icon/icon.component';
import { BrnSelectScrollUp } from '@spartan-ng/brain/select';
import { classes } from '@spartan-ng/helm/utils';

@Component({
  selector: 'hlm-select-scroll-up',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [BrnSelectScrollUp],
  template: ` <zc-icon [size]="16" name="l:chevron-up" /> `,
})
export class HlmSelectScrollUp {
  constructor() {
    classes(
      () =>
        "bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_zc-icon:not([class*='text-'])]:text-[length:--spacing(4)] sticky top-0 w-full data-hidden:hidden",
    );
  }
}
