import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonDirective } from '../../atoms/button/button.directive';
import { IconComponent } from '../../atoms/icon/icon.component';
import { IconName } from '../../atoms/icon/icon-registry.generated';
import { injectTranslate } from '../../lang';
import { ToastService } from '../../molecules/toast/toast.service';

/** Detalle para soporte: nunca un stack trace, solo lo que sirve para encontrar el caso. */
export interface TechDetails { code: string; service: string; date: string; }

let seq = 0;

/**
 * <zc-state> · estado vacío, sin resultados, sin acceso, enlace vencido o error.
 * Qué pasó (título), por qué o qué se conservó (texto) y una acción para salir (contenido). En error: referencia y,
 * si se pasa [details], "Ver detalles técnicos" con "Copiar detalles" para soporte.
 */
@Component({
  selector: 'zc-state',
  imports: [IconComponent, ButtonDirective, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.title]': 'null', class: 'grid content-center justify-items-center gap-3 rounded-md border border-dashed border-border-strong px-5 py-8 text-center max-md:px-4 max-md:py-5', '[attr.role]': 'kind() === "error" ? "alert" : null' },
  template: `
    <span class="grid size-14 place-items-center rounded-2xl max-md:size-11" [class]="kind() === 'error' ? 'bg-danger-bg text-danger' : 'bg-surface-2'"><zc-icon [name]="icon()" [size]="24" /></span>
    <h3 class="text-[17px] font-semibold leading-6">{{ title() }}</h3>
    @if (text()) { <p class="max-w-[40ch] text-[14.5px] leading-[22px] text-muted">{{ text() }}</p> }
    <div class="flex flex-wrap justify-center gap-2 empty:hidden"><ng-content /></div>
    @if (reference()) { <span class="text-xs text-muted num">{{ 'comun.referencia' | transloco }} {{ reference() }}</span> }
    @if (details(); as d) {
      <button type="button" class="inline-flex min-h-8 cursor-pointer items-center gap-1 text-sm text-muted underline underline-offset-2 hover:text-fg"
        [attr.aria-expanded]="showDetails()" [attr.aria-controls]="detailsId" (click)="showDetails.set(!showDetails())">
        {{ 'org.verDetallesTecnicos' | transloco }}<zc-icon name="s:alt-arrow-down" [size]="16" class="transition-transform duration-(--dur)" [class.rotate-180]="showDetails()" />
      </button>
      @if (showDetails()) {
        <div [id]="detailsId" class="grid w-full max-w-[420px] gap-3 rounded-sm bg-surface-2 p-3 text-left">
          <dl class="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-[13px]">
            <dt class="text-muted">{{ 'comun.referencia' | transloco }}</dt><dd class="m-0 break-words num">{{ reference() || '—' }}</dd>
            <dt class="text-muted">{{ 'org.codigo' | transloco }}</dt><dd class="m-0 break-words">{{ d.code }}</dd>
            <dt class="text-muted">{{ 'org.servicio' | transloco }}</dt><dd class="m-0 break-words">{{ d.service }}</dd>
            <dt class="text-muted">{{ 'org.fecha' | transloco }}</dt><dd class="m-0 break-words">{{ d.date }}</dd>
          </dl>
          <button zcButton variant="outline" size="sm" class="justify-self-start" (click)="copy(d)"><zc-icon name="l:clipboard-copy" [size]="16" />{{ 'org.copiarDetalles' | transloco }}</button>
        </div>
      }
    }`,
})
export class StateComponent {
  readonly kind = input<'empty' | 'error'>('empty');
  readonly icon = input<IconName>('s:box');
  readonly title = input.required<string>();
  readonly text = input('');
  readonly reference = input('');
  readonly details = input<TechDetails | null>(null);
  readonly showDetails = signal(false);
  readonly detailsId = `zc-state-${++seq}`;
  private readonly toast = inject(ToastService);
  private readonly t = injectTranslate();

  async copy(d: TechDetails) {
    const text = [[this.t('comun.referencia'), this.reference()], [this.t('org.codigo'), d.code], [this.t('org.servicio'), d.service], [this.t('org.fecha'), d.date]]
      .map(([k, v]) => `${k}: ${v}`).join('\n');
    try { await navigator.clipboard.writeText(text); } catch { /* sin permiso de portapapeles: igual se avisa */ }
    this.toast.success(this.t('org.detallesCopiados'), { text: this.t('org.pegaSoporte') });
  }
}
