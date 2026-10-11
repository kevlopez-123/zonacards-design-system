import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '@zonacards/ui/icon';
import { BrnSelectScrollDown } from '@spartan-ng/brain/select';
import { classes } from '../../../utils/src/index';

@Component({
  selector: 'hlm-select-scroll-down',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [BrnSelectScrollDown],
  template: ` <zc-icon [size]="16" name="l:chevron-down" /> `,
})
export class HlmSelectScrollDown {
  constructor() {
    classes(
      () =>
        "bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_zc-icon:not([class*='text-'])]:text-[length:--spacing(4)] sticky bottom-0 w-full data-hidden:hidden",
    );
  }
}
