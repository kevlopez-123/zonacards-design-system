import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { ButtonDirective } from '@zonacards/ui/button';
import { injectTranslate } from '@zonacards/ui/core';
import { OverlayComponent } from '@zonacards/ui/overlay';

/**
 * Aviso de sesión por expirar (o-filter de index.html): alertdialog con cuenta regresiva.
 * "Seguir conectado" emite (extend); "Cerrar sesión" o llegar a 0 emiten (logout). No se cierra con el scrim.
 * Escape (o deslizar el sheet en móvil) es actividad del usuario: cuenta como "Seguir conectado".
 * La app lo abre cuando detecta inactividad (por ejemplo, 14 de 15 minutos).
 */
@Component({
  selector: 'zc-session-timeout',
  imports: [ButtonDirective, OverlayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <zc-modal [title]="t('sesionExpira.titulo')" [subtitle]="t('sesionExpira.texto', { s: left() })"
      dialogRole="alertdialog" [dismissible]="false" [closable]="false" [(open)]="open" (closed)="extend.emit()">
      <span class="sr-only" aria-live="polite">{{ left() % 15 === 0 ? t('sesionExpira.texto', { s: left() }) : '' }}</span>
      <div zcOverlayFooter>
        <button zcButton variant="outline" (click)="doLogout()">{{ t('sesionExpira.cerrar') }}</button>
        <button zcButton (click)="doExtend()">{{ t('sesionExpira.seguir') }}</button>
      </div>
    </zc-modal>`,
})
export class SessionTimeoutComponent {
  readonly t = injectTranslate();
  readonly open = model(false);
  /** Segundos de aviso antes de cerrar la sesión. */
  readonly seconds = input(60);
  readonly extend = output<void>();
  readonly logout = output<void>();
  readonly left = signal(60);
  private timer?: ReturnType<typeof setInterval>;

  constructor() {
    effect(() => {
      const o = this.open();
      untracked(() => {
        clearInterval(this.timer);
        if (!o) return;
        this.left.set(this.seconds());
        this.timer = setInterval(() => { this.left.update(n => n - 1); if (this.left() <= 0) this.doLogout(); }, 1000);
      });
    });
    inject(DestroyRef).onDestroy(() => clearInterval(this.timer));
  }
  doExtend() { this.open.set(false); this.extend.emit(); }
  doLogout() { this.open.set(false); this.logout.emit(); }
}
