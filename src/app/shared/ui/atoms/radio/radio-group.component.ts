import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BrnRadioGroup } from '@spartan-ng/brain/radio-group';

let seq = 0;

/**
 * <zc-radio-group label="Canal de envío" [(value)]="canal"> <zc-radio value="mail">Correo</zc-radio> … </zc-radio-group>
 * Sobre spartan radio-group: flechas recorren y marcan, Tab sale del grupo. Funciona con formularios reactivos.
 * variant="card" para tarjetas seleccionables (opciones con descripción, precio o imagen).
 */
@Component({
  selector: 'zc-radio-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: BrnRadioGroup, inputs: ['name', 'value', 'disabled', 'required'], outputs: ['valueChange'] }],
  // Como .fieldset de index.html: 16 px entre la etiqueta y cada fila de 48 px.
  host: { class: 'grid min-w-0 content-start gap-4','[attr.aria-labelledby]': "label() ? labelId : null" },
  template: `
    @if (label()) { <span [id]="labelId" class="text-sm font-medium leading-5">{{ label() }}</span> }
    <div [class]="layout()"><ng-content /></div>`,
})
export class RadioGroupComponent {
  readonly label = input('');
  readonly variant = input<'list' | 'card'>('list');
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');
  readonly labelId = `zc-rg-${++seq}`;
  readonly layout = computed(() =>
    this.variant() === 'card' ? 'grid min-w-0 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]'
    : this.orientation() === 'horizontal' ? 'flex min-w-0 flex-wrap gap-x-6' : 'grid min-w-0 content-start gap-4',
  );
}
