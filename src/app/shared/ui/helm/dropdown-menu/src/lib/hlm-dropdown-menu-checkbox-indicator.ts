import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '../../../../atoms/icon/icon.component';
import { classes } from '@spartan-ng/helm/utils';

@Component({
  selector: 'hlm-dropdown-menu-checkbox-indicator',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-slot': 'dropdown-menu-checkbox-item-indicator' },
  template: ` <zc-icon [size]="16" name="l:check" /> `,
})
export class HlmDropdownMenuCheckboxIndicator {
  constructor() {
    classes(
      () =>
        'absolute end-2 flex items-center justify-center [&_zc-icon]:text-[length:--spacing(4)] pointer-events-none opacity-0 group-data-checked/dropdown-menu-checkbox:opacity-100',
    );
  }
}
