import { Directive } from '@angular/core';
import { BrnAvatarFallback } from '@spartan-ng/brain/avatar';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
  selector: '[hlmAvatarFallback]',
  exportAs: 'hlmAvatarFallback',
  hostDirectives: [BrnAvatarFallback],
  host: {
    'data-slot': 'avatar-fallback',
  },
})
export class HlmAvatarFallback {
  constructor() {
    classes(
      () =>
        'flex size-full items-center justify-center rounded-[inherit] bg-surface-3 text-sm font-semibold text-fg group-data-[size=sm]/avatar:text-xs group-data-[size=lg]/avatar:text-lg',
    );
  }
}
