import { Directive } from '@angular/core';
import { BrnProgress } from '@spartan-ng/brain/progress';
import { classes } from '../../../utils/src/index';

@Directive({
  selector: 'hlm-progress,[hlmProgress]',
  hostDirectives: [{ directive: BrnProgress, inputs: ['value', 'max', 'getValueLabel'] }],
  host: { 'data-slot': 'progress' },
})
export class HlmProgress {
  constructor() {
    classes(() => 'relative inline-flex h-2 w-full overflow-hidden rounded-full bg-surface-2');
  }
}
