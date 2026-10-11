import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../../atoms/icon/icon.component';
import { IconName } from '../../atoms/icon/icon-registry.generated';

/**
 * Permisos y push (o-perm de index.html).
 * <zc-permission-prompt icon="s:qr-code" title="Usa la cámara…" text="…"> botones </zc-permission-prompt>
 *   Pantalla previa: se muestra justo antes de usar la función (nunca al abrir la app), explica el beneficio y qué no se hace;
 *   "Ahora no" siempre disponible. tone="warning" para el permiso negado con camino a Ajustes.
 * <zc-push-preview app="Zonacards" time="ahora" title="Anulación aprobada" text="…" />
 *   Vista previa de notificación: título de una línea con el hecho y cuerpo con el detalle; sin datos sensibles.
 */
@Component({
  selector: 'zc-permission-prompt',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.title]': 'null', class: 'grid content-center justify-items-center gap-3 text-center' },
  template: `
    <span class="grid size-22 place-items-center rounded-[28px]" [class]="tone() === 'warning' ? 'bg-warning-bg text-warning' : 'bg-info-bg text-info'" aria-hidden="true"><zc-icon [name]="icon()" [size]="32" /></span>
    <strong class="text-[17px]">{{ title() }}</strong>
    <p class="text-sm leading-5 text-muted">{{ text() }}</p>
    <div class="mt-2 grid w-full gap-2"><ng-content /></div>`,
})
export class PermissionPromptComponent {
  readonly icon = input.required<IconName>();
  readonly title = input.required<string>();
  readonly text = input.required<string>();
  readonly tone = input<'info' | 'warning'>('info');
}

@Component({
  selector: 'zc-push-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'img', '[attr.aria-label]': "app() + ': ' + title() + '. ' + text()", '[attr.title]': 'null',
    class: 'flex gap-2 rounded-[18px] bg-(--push-bg) px-3 py-2.5 text-(--push-fg) backdrop-blur-md' },
  template: `
    <span class="grid size-[34px] shrink-0 place-items-center rounded-sm bg-primary text-[13px] font-bold text-on-primary" aria-hidden="true">{{ app().charAt(0) }}</span>
    <div class="grid min-w-0 gap-px text-[13px] leading-[18px]" aria-hidden="true">
      <div class="flex justify-between gap-1.5 text-xs"><strong>{{ app() }}</strong><small class="text-(--push-muted)">{{ time() }}</small></div>
      <b>{{ title() }}</b><span class="break-words">{{ text() }}</span>
    </div>`,
})
export class PushPreviewComponent {
  readonly app = input.required<string>();
  readonly time = input.required<string>();
  readonly title = input.required<string>();
  readonly text = input.required<string>();
}
