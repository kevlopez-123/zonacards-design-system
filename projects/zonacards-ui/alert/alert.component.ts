import { ChangeDetectionStrategy, Component, Directive, computed, input } from '@angular/core';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const LOOK: Record<AlertTone, { icon: IconName; cls: string }> = {
  info: { icon: 's:info-circle', cls: 'border-info-bd bg-info-bg text-info' },
  success: { icon: 's:check-circle', cls: 'border-success-bd bg-success-bg text-success' },
  warning: { icon: 's:danger-triangle', cls: 'border-warning-bd bg-warning-bg text-warning' },
  danger: { icon: 's:close-circle', cls: 'border-danger-bd bg-danger-bg text-danger' },
};

/**
 * <zc-alert tone="warning" title="Stock bajo mínimo">Quedan 38 códigos…<button zcAlertAction …>Cargar lote</button></zc-alert>
 * Aviso dentro de la página (no se cierra solo). Siempre ícono + título: nunca solo color.
 * danger usa role="alert" (se anuncia de inmediato); el resto, role="status".
 * Error de servidor de un formulario: tone="danger" al tope, con la referencia de correlación en el texto.
 */
@Component({
  selector: 'zc-alert',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.role]': "tone() === 'danger' ? 'alert' : 'status'", '[class]': 'hostClass()' },
  template: `
    <zc-icon [name]="look().icon" class="mt-0.5" />
    <div class="grid grid-cols-[minmax(0,1fr)] min-w-0 flex-1 gap-0.5">
      <span class="font-semibold leading-6">{{ title() }}</span>
      <span class="text-body-sm leading-5 break-words"><ng-content /></span>
      <div class="mt-3 flex flex-wrap gap-2 empty:hidden [&_button]:text-fg"><ng-content select="[zcAlertAction]" /></div>
    </div>`,
})
export class AlertComponent {
  readonly tone = input<AlertTone>('info');
  readonly title = input.required<string>();
  readonly look = computed(() => LOOK[this.tone()]);
  readonly hostClass = computed(() => 'flex min-w-0 items-start gap-3 rounded-md border p-4 ' + this.look().cls);
}

/** Marca los botones de acción de un zc-alert (outline, sm). */
@Directive({ selector: '[zcAlertAction]' })
export class AlertActionDirective {}
