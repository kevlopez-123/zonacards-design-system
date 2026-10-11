import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '@zonacards/ui/icon';
import { classes } from '../../../utils/src/index';

@Component({
  selector: 'hlm-dropdown-menu-item-sub-indicator',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <zc-icon [size]="16" name="l:chevron-right" class="text-[length:--spacing(4)] rtl:rotate-180" />
  `,
})
export class HlmDropdownMenuItemSubIndicator {
  constructor() {
    classes(() => 'ms-auto flex items-center justify-center');
  }
}
