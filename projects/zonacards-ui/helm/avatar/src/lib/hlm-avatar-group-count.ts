import { Directive } from '@angular/core';
import { classes } from '../../../utils/src/index';

/** "+N" al final de un grupo de avatares; toma el tamaño de los avatares del grupo. */
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
        'relative flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-3 text-sm font-semibold text-fg group-has-data-[size=lg]/avatar-group:size-14 group-has-data-[size=lg]/avatar-group:text-lg group-has-data-[size=sm]/avatar-group:size-8 group-has-data-[size=sm]/avatar-group:text-xs',
    );
  }
}
