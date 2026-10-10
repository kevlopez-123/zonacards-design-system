import { Directive } from '@angular/core';
import { BrnSelectPlaceholder } from '@spartan-ng/brain/select';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
  selector: '[hlmSelectPlaceholder],hlm-select-placeholder',
  hostDirectives: [BrnSelectPlaceholder],
  host: { 'data-slot': 'select-placeholder' },
})
export class HlmSelectPlaceholder {
  constructor() {
    classes(
      () =>
        "gap-2 [&_zc-icon:not([class*='text-'])]:text-[length:--spacing(4)] flex items-center data-hidden:hidden [&_zc-icon]:pointer-events-none [&_zc-icon]:shrink-0",
    );
  }
}
