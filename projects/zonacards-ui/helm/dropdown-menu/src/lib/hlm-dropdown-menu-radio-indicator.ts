import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '@zonacards/ui/icon';
import { classes } from '../../../utils/src/index';

@Component({
  selector: 'hlm-dropdown-menu-radio-indicator',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-slot': 'dropdown-menu-radio-item-indicator' },
  template: ` <zc-icon [size]="16" name="l:check" /> `,
})
export class HlmDropdownMenuRadioIndicator {
  constructor() {
    classes(
      () =>
        'absolute end-2 flex items-center justify-center [&_zc-icon]:text-[length:--spacing(4)] pointer-events-none opacity-0 group-data-checked/dropdown-menu-radio:opacity-100',
    );
  }
}
