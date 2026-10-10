import { Directive } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

/** Indicador de presencia: punto de éxito con borde del color de la superficie. */
@Directive({
  selector: '[hlmAvatarBadge],hlm-avatar-badge',
  host: {
    'data-slot': 'avatar-badge',
  },
})
export class HlmAvatarBadge {
  constructor() {
    classes(() => [
      'absolute right-0 bottom-0 z-10 size-3 rounded-full border-2 border-surface bg-success select-none',
      'group-data-[size=sm]/avatar:size-2.5 group-data-[size=lg]/avatar:size-3.5',
    ]);
  }
}
