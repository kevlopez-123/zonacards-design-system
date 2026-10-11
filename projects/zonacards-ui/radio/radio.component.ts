import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { HlmRadio, HlmRadioIndicator } from '@zonacards/ui/helm';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { RadioGroupComponent } from './radio-group.component';

/**
 * <zc-radio value="mail" description="…">Correo electrónico</zc-radio> · siempre dentro de <zc-radio-group>.
 * Toda la fila (o la tarjeta) es clicable. Contenido extra a la derecha de la tarjeta con el atributo zcRadioAside.
 * Tarjeta con ícono (Cards de index.html, "Códigos propios"): [icon] + [subtitle]; el radio va a la derecha y la descripción abajo.
 */
@Component({
  selector: 'zc-radio',
  imports: [NgTemplateOutlet, HlmRadio, HlmRadioIndicator, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0' },
  template: `
    <label [class]="classes()">
      @if (card() && icon()) {
        <span class="flex min-w-0 items-start gap-3">
          <span class="grid size-10 shrink-0 place-items-center rounded-ms bg-surface-2 text-fg"><zc-icon [name]="icon()!" [size]="16" /></span>
          <span class="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)] gap-0.5">
            <span class="break-words font-medium"><ng-container *ngTemplateOutlet="text" /></span>
            @if (subtitle()) { <span class="text-[13px] text-muted">{{ subtitle() }}</span> }
          </span>
          <hlm-radio [value]="value()" [disabled]="disabled()" class="pt-2.5"><hlm-radio-indicator indicator /></hlm-radio>
        </span>
        @if (description()) { <span class="text-[12.5px] leading-[18px] text-muted">{{ description() }}</span> }
      } @else {
        <hlm-radio [value]="value()" [disabled]="disabled()" [class]="card() ? 'pt-px' : ''"><hlm-radio-indicator indicator /></hlm-radio>
        <span class="grid grid-cols-[minmax(0,1fr)] min-w-0 flex-1 gap-0.5">
          <span class="break-words" [class.font-medium]="card()"><ng-container *ngTemplateOutlet="text" /></span>
          @if (description()) { <span class="text-[13px] text-muted">{{ description() }}</span> }
        </span>
        <ng-content select="[zcRadioAside]" />
      }
    </label>
    <!-- Un solo ng-content: dentro de @if/@else Angular solo proyecta en uno. -->
    <ng-template #text><ng-content /></ng-template>`,
})
export class RadioComponent {
  readonly value = input.required<unknown>();
  readonly description = input('');
  readonly disabled = input(false);
  /** Solo en tarjeta: ícono en un recuadro a la izquierda. */
  readonly icon = input<IconName | null>(null);
  readonly subtitle = input('');
  private readonly group = inject(RadioGroupComponent, { optional: true });
  readonly card = computed(() => this.group?.variant() === 'card');
  readonly classes = computed(() =>
    'flex min-w-0 flex-1 cursor-pointer leading-5 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 ' +
    (this.card()
      ? (this.icon() ? 'flex-col gap-3 ' : 'gap-3 ') + 'items-stretch rounded-md border border-border bg-surface p-4 transition-[border-color,box-shadow] duration-(--dur) hover:border-border-strong has-[:checked]:border-primary has-[:checked]:bg-[color-mix(in_srgb,var(--primary)_5%,var(--surface))] has-[:checked]:shadow-[inset_0_0_0_1px_var(--primary)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus'
      : 'gap-3 min-h-target items-center'),
  );
}
