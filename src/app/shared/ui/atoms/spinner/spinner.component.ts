import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'zc-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status', '[attr.aria-label]': 'label()', class: 'inline-block shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent', '[style.width.px]': 'size()', '[style.height.px]': 'size()' },
  template: '',
})
export class SpinnerComponent { readonly size = input(18); readonly label = input('Cargando'); }
