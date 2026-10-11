import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FlagComponent } from '../../atoms/flag/flag.component';

export interface ZcDescription { term: string; value: string; /** Bandera antes del valor (código de país). */ flag?: string; }

/**
 * <zc-description-list [items]="[{ term: 'Cliente', value: 'Interbank' }]" /> · pares dato–valor de una ficha (DescriptionList de index.html).
 * layout="grid": dos columnas · layout="rows": una por fila con el valor a la derecha (resúmenes, drawers).
 * Valores con cifras tabulares; los montos ya vienen formateados por la página (formatMoney).
 */
@Component({
  selector: 'zc-description-list',
  imports: [FlagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  template: `
    <dl class="m-0 grid min-w-0" [class]="layout() === 'rows' ? 'grid-cols-[minmax(0,1fr)]' : 'grid-cols-2 gap-x-5 gap-y-3'">
      @for (it of items(); track it.term; let last = $last) {
        <div class="min-w-0" [class]="layout() === 'rows' ? 'flex justify-between gap-4 py-2' + (last ? '' : ' border-b border-border') : ''">
          <dt class="text-[13px] leading-5 text-muted">{{ it.term }}</dt>
          <dd class="m-0 flex min-w-0 items-center gap-2 leading-6 font-medium num">
            @if (it.flag) { <zc-flag [code]="it.flag" [size]="16" /> }<span class="min-w-0 break-words">{{ it.value }}</span>
          </dd>
        </div>
      }
    </dl>`,
})
export class DescriptionListComponent {
  readonly items = input.required<ZcDescription[]>();
  readonly layout = input<'grid' | 'rows'>('grid');
}
