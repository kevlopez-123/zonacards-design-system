import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { Tone } from '@zonacards/ui/core';
import { CountryCode } from '@zonacards/ui/core';
import { formatMoney } from '@zonacards/ui/core';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';

export interface ZcPipelineStage { id: string; label: string; count: number; amount: number; tone: Tone; icon: IconName }

const TONE: Record<Tone, string> = {
  success: 'bg-success-bg border-success-bd text-success', warning: 'bg-warning-bg border-warning-bd text-warning',
  danger: 'bg-danger-bg border-danger-bd text-danger', info: 'bg-info-bg border-info-bd text-info',
  accent: 'bg-accent-bg border-accent-bd text-accent', neutral: 'bg-surface-2 border-border text-muted',
};

/**
 * <zc-pipeline [stages]="etapas" country="pe" [(selected)]="etapa" /> · etapas con conteo y monto (o-domain, liquidaciones).
 * Cada etapa es un botón que filtra (aria-pressed); el color va con ícono y texto. 2 columnas en móvil, 3 en tablet, 6 en desktop.
 */
@Component({
  selector: 'zc-pipeline',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Las etapas se reparten el ancho del bloque (no de la ventana): en columna si es angosto, en una fila si caben.
  host: { class: 'grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))] gap-3', role: 'group', '[attr.aria-label]': 'label()' },
  template: `
    @for (s of stages(); track s.id) {
      <button type="button" [class]="cls(s)" [attr.aria-pressed]="selected() === s.id" (click)="toggle(s.id)"
        [attr.aria-label]="s.label + ': ' + s.count + ' ' + unit() + ', ' + money(s.amount)">
        <span class="flex min-w-0 items-start gap-1.5 text-[13px] leading-[18px]">
          <zc-icon class="mt-px" [name]="s.icon" [size]="16" /><span class="min-w-0 break-words">{{ s.label }}</span><span class="ml-auto font-semibold num">{{ s.count }}</span>
        </span>
        <!-- Texto plano: zc-money puede traer un tooltip enfocable y aquí ya está dentro de un botón. -->
        <span class="min-w-0 break-words text-[17px] font-semibold text-fg num">{{ money(s.amount) }}</span>
      </button>
    }`,
})
export class PipelineComponent {
  readonly stages = input.required<readonly ZcPipelineStage[]>();
  readonly country = input.required<CountryCode>();
  readonly label = input.required<string>();
  /** Qué se cuenta ("liquidaciones"), para el nombre accesible. */
  readonly unit = input('');
  readonly selected = model<string | null>(null);
  cls(s: ZcPipelineStage) {
    return 'grid min-w-0 cursor-pointer gap-2 rounded-md border p-4 text-left transition-shadow duration-(--dur) hover:shadow-1 aria-pressed:shadow-[inset_0_0_0_2px_currentColor] ' + TONE[s.tone];
  }
  toggle(id: string) { this.selected.set(this.selected() === id ? null : id); }
  money(n: number) { return formatMoney(n, this.country()); }
}
