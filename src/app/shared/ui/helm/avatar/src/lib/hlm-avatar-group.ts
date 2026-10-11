import { Directive } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

/** Grupo de avatares superpuestos (el único solapamiento permitido, sección 16 de las reglas). */
@Directive({
  selector: '[hlmAvatarGroup],hlm-avatar-group',
  host: {
    'data-slot': 'avatar-group',
  },
})
export class HlmAvatarGroup {
  constructor() {
    classes(
      () =>
        'group/avatar-group flex -space-x-1.5 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-surface *:data-[slot=avatar-group-count]:ring-2 *:data-[slot=avatar-group-count]:ring-surface',
    );
  }
}
