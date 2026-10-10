import { Directive } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
  selector: '[hlmInputGroupText],hlm-input-group-text',
})
export class HlmInputGroupText {
  constructor() {
    classes(
      () =>
        "text-muted-foreground gap-2 text-sm [&_zc-icon:not([class*='text-'])]:text-[length:--spacing(4)] flex items-center [&_zc-icon]:pointer-events-none",
    );
  }
}
