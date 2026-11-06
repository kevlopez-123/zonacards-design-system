import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { Toast, ToastKind, ToastService } from './toast.service';

const ICON: Record<ToastKind, { icon: IconName; cls: string }> = {
  success: { icon: 's:check-circle', cls: 'text-success' },
  error: { icon: 's:danger-circle', cls: 'text-danger' },
  info: { icon: 's:info-circle', cls: 'text-info' },
};

/** Un toast. Su temporizador se pausa con el mouse encima o con foco dentro (WCAG 2.2.1). */
@Component({
  selector: 'zc-toast',
  imports: [IconComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pointer-events-auto flex min-w-0 items-start gap-3 rounded-md border border-border bg-surface p-4 text-fg shadow-2 animate-in fade-in-0 slide-in-from-top-1 md:slide-in-from-bottom-1 duration-180 ease-out motion-reduce:animate-none',
    '(mouseenter)': 'pause()', '(mouseleave)': 'resume()', '(focusin)': 'pause()', '(focusout)': 'resume()',
  },
  template: `
    <zc-icon [name]="look().icon" [class]="'mt-0.5 ' + look().cls" />
    <div class="grid grid-cols-[minmax(0,1fr)] min-w-0 flex-1">
      <span class="font-semibold leading-6 break-words">{{ toast().title }}</span>
      @if (toast().text) { <span class="text-sm leading-5 text-muted break-words">{{ toast().text }}</span> }
      @if (toast().action; as a) {
        <button type="button" class="mt-1 min-h-8 cursor-pointer justify-self-start text-sm font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-current"
          (click)="act()">{{ a.label }}</button>
      }
    </div>
    <button type="button" class="-mt-2 -mr-2 grid size-icon-btn shrink-0 cursor-pointer place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg"
      [attr.aria-label]="'ui.cerrarNotificacion' | transloco" (click)="close()"><zc-icon name="l:x" [size]="16" /></button>`,
})
export class ToastComponent {
  readonly toast = input.required<Toast>();
  private readonly service = inject(ToastService);
  readonly look = computed(() => ICON[this.toast().kind]);
  private timer?: ReturnType<typeof setTimeout>;
  private remaining = 0;
  private startedAt = 0;
  private paused = 0;

  constructor() {
    effect(() => { this.remaining = this.toast().duration ?? 0; this.start(); });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  private start() {
    clearTimeout(this.timer);
    if (!this.toast().duration || this.paused) return;
    this.startedAt = Date.now();
    this.timer = setTimeout(() => this.close(), this.remaining);
  }
  pause() {
    if (this.paused++ || !this.toast().duration) return;
    clearTimeout(this.timer);
    this.remaining -= Date.now() - this.startedAt;
  }
  resume() { if (this.paused && !--this.paused) this.start(); }

  act() { this.toast().action?.run(); this.close(); }
  close() { this.service.dismiss(this.toast().id); }
}

/**
 * <zc-toaster /> · región de toasts (una sola, en el shell). Desktop: abajo a la derecha, 400 px.
 * Móvil: ancho completo al pie, sobre el área segura. Las regiones existen siempre, así los lectores de pantalla anuncian lo que entra:
 * errores en role="alert"; éxito e información en aria-live="polite".
 */
@Component({
  selector: 'zc-toaster',
  imports: [ToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Móvil: arriba, bajo la barra superior (al pie tapaba el pie fijo de acciones de los formularios). Tablet y desktop: abajo a la derecha.
  host: { class: 'pointer-events-none fixed inset-x-4 top-[calc(var(--topbar-h)+8px)] z-[1100] grid gap-2 md:top-auto md:bottom-[calc(16px+env(safe-area-inset-bottom,0px))] md:left-auto md:w-[400px]' },
  template: `
    <div class="grid gap-2" role="alert">
      @for (t of errors(); track t.id) { <zc-toast [toast]="t" /> }
    </div>
    <div class="grid gap-2" role="status" aria-live="polite">
      @for (t of others(); track t.id) { <zc-toast [toast]="t" /> }
    </div>`,
})
export class ToasterComponent {
  private readonly service = inject(ToastService);
  readonly errors = computed(() => this.service.visible().filter(t => t.kind === 'error'));
  readonly others = computed(() => this.service.visible().filter(t => t.kind !== 'error'));
}
