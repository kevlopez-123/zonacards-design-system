import { ChangeDetectionStrategy, Component } from '@angular/core';
import { classes } from '../../../utils/src/index';

/** Tokens Zonacards (docs/design-system · Radio): 22 px, punto de 10 px en color primario al marcar. */
@Component({
  selector: 'hlm-radio-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'radio-group-indicator',
  },
  template: `
    <div class="size-2.5 rounded-full bg-transparent group-data-[checked=true]:bg-primary group-data-[disabled=true]:group-data-[checked=true]:bg-muted"></div>
  `,
})
export class HlmRadioIndicator {
  constructor() {
    classes(
      () =>
        'relative grid size-5.5 shrink-0 place-items-center rounded-full border-[1.5px] border-border-strong bg-surface transition-[border-color] duration-(--dur) group-data-[checked=true]:border-primary group-data-[disabled=true]:border-dashed group-data-[disabled=true]:bg-surface-2 group-data-[disabled=true]:group-data-[checked=true]:border-border-strong group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-focus group-data-[invalid=true]:border-danger',
    );
  }
}
