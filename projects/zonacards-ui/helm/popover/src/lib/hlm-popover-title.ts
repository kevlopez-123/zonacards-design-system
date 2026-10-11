import { Directive } from '@angular/core';
import { classes } from '../../../utils/src/index';

@Directive({
  selector: '[hlmPopoverTitle]',
  host: { 'data-slot': 'popover-title' },
})
export class HlmPopoverTitle {
  constructor() {
    classes(() => 'font-medium');
  }
}
