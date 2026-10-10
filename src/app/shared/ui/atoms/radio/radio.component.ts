import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { HlmRadio, HlmRadioIndicator } from '@spartan-ng/helm/radio-group';
import { RadioGroupComponent } from './radio-group.component';

/**
 * <zc-radio value="mail" description="…">Correo electrónico</zc-radio> · siempre dentro de <zc-radio-group>.
 * Toda la fila (o la tarjeta) es clicable. Contenido extra a la derecha de la tarjeta con el atributo zcRadioAside.
 */
@Component({
  selector: 'zc-radio',
  imports: [HlmRadio, HlmRadioIndicator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0' },
  template: `
    <label [class]="classes()">
      <hlm-radio [value]="value()" [disabled]="disabled()" [class]="card() ? 'pt-px' : ''"><hlm-radio-indicator indicator /></hlm-radio>
      <span class="grid min-w-0 flex-1 gap-0.5">
        <span class="break-words" [class.font-medium]="card()"><ng-content /></span>
        @if (description()) { <span class="text-[13px] text-muted">{{ description() }}</span> }
      </span>
      <ng-content select="[zcRadioAside]" />
    </label>`,
})
export class RadioComponent {
  readonly value = input.required<unknown>();
  readonly description = input('');
  readonly disabled = input(false);
  private readonly group = inject(RadioGroupComponent, { optional: true });
  readonly card = computed(() => this.group?.variant() === 'card');
  readonly classes = computed(() =>
    'flex min-w-0 flex-1 cursor-pointer gap-3 leading-5 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 ' +
    (this.card()
      ? 'items-start rounded-md border border-border bg-surface p-4 transition-[border-color,box-shadow] duration-(--dur) hover:border-border-strong has-[:checked]:border-primary has-[:checked]:bg-[color-mix(in_srgb,var(--primary)_5%,var(--surface))] has-[:checked]:shadow-[inset_0_0_0_1px_var(--primary)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus'
      : 'min-h-target items-center'),
  );
}
