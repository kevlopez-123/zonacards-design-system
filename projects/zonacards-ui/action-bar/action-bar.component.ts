import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent, IconName } from '@zonacards/ui/icon';
import { TooltipDirective } from '@zonacards/ui/tooltip';

export interface ActionBarAction {
  id: string;
  label: string;
  /** Nombre de `zc-icon` (`s:…`). Sin ícono, la acción se queda con su texto aunque la barra sea angosta. */
  icon?: IconName;
  /** Destructiva: se dibuja con el color de peligro. */
  danger?: boolean;
  disabled?: boolean;
  /** Por qué no se puede: se muestra como tooltip (con mouse y teclado) sobre la acción deshabilitada. */
  disabledReason?: string;
}

/**
 * <zc-action-bar [count]="selection().length" [actions]="actions" (action)="run($event)" (cleared)="selection.set([])" />
 * Barra de acciones sobre una selección múltiple: "N seleccionados", las acciones y una X para quitar la selección. Aparece solo con
 * `count` > 0 (y lo anuncia por voz). Por defecto flota abajo y al centro, sobre el contenido y respetando el área segura del
 * dispositivo; con `[floating]="false"` queda en el flujo de la página (sticky lo decide quien la usa). Si es angosta (menos de 30 rem),
 * las acciones con ícono dejan solo el ícono y su texto pasa a ser el nombre accesible. Para acciones propias, proyecta botones dentro.
 */
@Component({
  selector: 'zc-action-bar',
  imports: [ButtonDirective, IconComponent, TooltipDirective, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <span class="sr-only" aria-live="polite">{{ count() > 0 ? ('ui.nSeleccionados' | transloco: { n: count() }) : '' }}</span>
    @if (count() > 0) {
      <div [class]="wrapClass()">
        <div role="region" [attr.aria-label]="'ui.accionesSeleccion' | transloco"
          class="pointer-events-auto flex min-h-target min-w-0 max-w-full flex-wrap items-center gap-1 rounded-card bg-primary py-1.5 pr-2 pl-4 text-on-primary shadow-2 zc-on-primary animate-in fade-in-0 slide-in-from-bottom-3 duration-180 ease-out motion-reduce:animate-none">
          <span class="num mr-2 text-body font-medium">{{ 'ui.nSeleccionados' | transloco: { n: count() } }}</span>
          <span class="flex-1"></span>
          @for (a of actions(); track a.id) {
            @if (a.disabled && a.disabledReason) {
              <span tabindex="0" class="inline-flex rounded-button [&>button]:pointer-events-none" [zcTooltip]="a.disabledReason">
                <button zcButton [variant]="a.danger ? 'danger-soft' : 'ghost'" size="sm" disabled (click)="action.emit(a.id)">
                  @if (a.icon) { <zc-icon [name]="a.icon" [size]="16" /> }
                  <span [class]="a.icon ? '@max-[30rem]:sr-only' : ''">{{ a.label }}</span>
                </button>
              </span>
            } @else {
              <button zcButton [variant]="a.danger ? 'danger-soft' : 'ghost'" size="sm" [disabled]="a.disabled" (click)="action.emit(a.id)">
                @if (a.icon) { <zc-icon [name]="a.icon" [size]="16" /> }
                <span [class]="a.icon ? '@max-[30rem]:sr-only' : ''">{{ a.label }}</span>
              </button>
            }
          }
          <ng-content />
          <button zcButton variant="ghost" size="icon-sm" [attr.aria-label]="'ui.quitarSeleccion' | transloco" (click)="cleared.emit()"><zc-icon name="l:x" [size]="16" /></button>
        </div>
      </div>
    }`,
})
export class ActionBarComponent {
  /** Cuántos elementos están seleccionados; con 0 la barra no se dibuja. */
  readonly count = input.required<number>();
  readonly actions = input<ActionBarAction[]>([]);
  readonly floating = input(true);
  /** Id de la acción pulsada. */
  readonly action = output<string>();
  /** Se pulsó la X: quien la usa vacía su selección. */
  readonly cleared = output<void>();

  readonly wrapClass = computed(() => this.floating()
    ? '@container pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-(--z-floating) flex justify-center px-4'
    : '@container block min-w-0');
}
