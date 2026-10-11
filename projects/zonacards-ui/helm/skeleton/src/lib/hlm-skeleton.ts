import { Directive } from '@angular/core';
import { classes } from '../../../utils/src/index';

/** Tokens Zonacards (docs/design-system · Skeleton): brillo que recorre surface-2; sin animación si se reduce el movimiento. */
@Directive({
  selector: '[hlmSkeleton],hlm-skeleton',
  host: {
    'data-slot': 'skeleton',
  },
})
export class HlmSkeleton {
  constructor() {
    classes(
      () =>
        'block rounded-sm bg-surface-2 bg-[linear-gradient(90deg,var(--surface-2)_0%,color-mix(in_srgb,var(--surface-2)_50%,var(--surface))_50%,var(--surface-2)_100%)] bg-size-[200%_100%] motion-safe:animate-shimmer',
    );
  }
}
