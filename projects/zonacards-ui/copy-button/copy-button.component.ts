import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { ButtonDirective } from '@zonacards/ui/button';
import { injectTranslate } from '@zonacards/ui/core';
import { IconComponent } from '@zonacards/ui/icon';
import { TooltipDirective } from '@zonacards/ui/tooltip';

/**
 * <zc-copy-button [value]="apiKey" label="Copiar la clave de API" /> · copia un texto al portapapeles.
 * - Solo ícono por defecto (con tooltip y aria-label); [showText]="true" muestra "Copiar".
 * - Al copiar: ícono de check y "Copiado" durante 2 s, anunciado a lectores de pantalla.
 * - Sin permiso de portapapeles (navegador antiguo o sin HTTPS) emite (failed) y avisa: "No se pudo copiar".
 * Para números, códigos, URLs, IDs de transacción y claves. Una clave secreta va en zc-secret-field (enmascarada).
 */
@Component({
  selector: 'zc-copy-button',
  imports: [ButtonDirective, IconComponent, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `
    <button zcButton type="button" [variant]="variant()" [size]="showText() ? 'sm' : 'icon-sm'"
      [attr.aria-label]="showText() ? null : ariaText()" [zcTooltip]="showText() ? '' : tip()" [zcTooltipDisabled]="showText()" (click)="copy()">
      <zc-icon [name]="state() === 'done' ? 'l:check' : state() === 'error' ? 's:danger-circle' : 's:copy'" [size]="16" />
      @if (showText()) { {{ tip() }} }
    </button>`,
})
export class CopyButtonComponent {
  readonly t = injectTranslate();
  private readonly live = inject(LiveAnnouncer);
  /** Texto que se copia. */
  readonly value = input.required<string>();
  /** Nombre accesible ("Copiar el número de pedido"); por defecto "Copiar". */
  readonly label = input('');
  readonly showText = input(false);
  readonly variant = input<'ghost' | 'outline'>('ghost');
  readonly copied = output<string>();
  readonly failed = output<void>();

  readonly state = signal<'idle' | 'done' | 'error'>('idle');
  readonly tip = computed(() => this.t(this.state() === 'done' ? 'ui.copiado' : this.state() === 'error' ? 'ui.noSeCopio' : 'ui.copiar'));
  readonly ariaText = computed(() => (this.state() === 'idle' ? this.label() || this.t('ui.copiar') : this.tip()));
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() { inject(DestroyRef).onDestroy(() => clearTimeout(this.timer)); }

  async copy() {
    try {
      await navigator.clipboard.writeText(this.value());
      this.state.set('done'); this.copied.emit(this.value());
    } catch {
      this.state.set('error'); this.failed.emit();
    }
    this.live.announce(this.tip());
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.state.set('idle'), 2000);
  }
}
