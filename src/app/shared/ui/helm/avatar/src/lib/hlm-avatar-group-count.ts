import { Directive } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
  selector: '[hlmAvatarGroupCount],hlm-avatar-group-count',
  host: {
    'data-slot': 'avatar-group-count',
  },
})
export class HlmAvatarGroupCount {
  constructor() {
    classes(
      () =>
        'bg-muted text-muted-foreground ring-background relative flex size-8 shrink-0 items-center justify-center rounded-full text-sm ring-2 group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>zc-icon]:text-base group-has-data-[size=lg]/avatar-group:[&>zc-icon]:text-xl group-has-data-[size=sm]/avatar-group:[&>zc-icon]:text-xs',
    );
  }
}
