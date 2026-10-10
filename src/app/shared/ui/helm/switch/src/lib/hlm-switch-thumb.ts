import { Directive } from '@angular/core';
import { BrnSwitchThumb } from '@spartan-ng/brain/switch';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
  selector: '[hlmSwitchThumb],hlm-switch-thumb',
  hostDirectives: [BrnSwitchThumb],
  host: { 'data-slot': 'switch-thumb' },
})
export class HlmSwitchThumb {
  constructor() {
    classes(
      () =>
        'pointer-events-none block rounded-full bg-thumb shadow-[0_1px_2px_rgb(0_0_0/.3)] transition-transform duration-(--dur) ease-(--ease) group-data-[size=default]/switch:size-5.5 group-data-[size=sm]/switch:size-4 data-unchecked:translate-x-0 group-data-[size=default]/switch:data-checked:translate-x-5 group-data-[size=sm]/switch:data-checked:translate-x-3.5 rtl:data-checked:-translate-x-5',
    );
  }
}
