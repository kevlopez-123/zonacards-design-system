import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { IconComponent } from '../../atoms/icon/icon.component';
import { injectTranslate } from '../../lang';
import { INLINE_BTN } from '../../viewport';
import { FieldComponent } from '../field/field.component';
import { ToastService } from '../toast/toast.service';

/**
 * <zc-field label="API Key de la campaña" hint="Se muestra completa solo a roles autorizados y queda auditado.">
 *   <zc-secret-field [value]="key" [canReveal]="puedeVer" (revealed)="auditar()" />
 * </zc-field>
 * Snippet de credenciales: enmascarado con los últimos 4 visibles, mostrar (evento para auditoría) y copiar con confirmación.
 */
@Component({
  selector: 'zc-secret-field',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  template: `
    <div class="flex h-target w-full min-w-0 items-center rounded-sm border border-border-strong bg-surface-2">
      <input readonly class="zc-bare h-full min-w-0 flex-1 bg-transparent px-4 font-mono text-sm tracking-[.02em] text-fg outline-none"
        [id]="field?.controlId" [attr.aria-describedby]="field?.messageId" [value]="shown() ? value() : masked()" />
      @if (canReveal()) {
        <button type="button" [class]="btn" [attr.aria-label]="t(shown() ? 'mol.secreto.ocultar' : 'mol.secreto.mostrar', { label: name() })" [attr.aria-pressed]="shown()" (click)="toggle()">
          <zc-icon [name]="shown() ? 's:eye-closed' : 's:eye'" />
        </button>
      }
      <button type="button" [class]="btn" [attr.aria-label]="t(copied() ? 'mol.secreto.copiada' : 'mol.secreto.copiar', { label: name() })" (click)="copy()">
        <zc-icon [name]="copied() ? 'l:check' : 's:copy'" />
      </button>
    </div>`,
})
export class SecretFieldComponent {
  readonly field = inject(FieldComponent, { optional: true });
  private readonly toast = inject(ToastService);
  readonly t = injectTranslate();
  readonly value = input.required<string>();
  /** Solo los roles autorizados ven el valor completo; copiar siempre copia el valor real. */
  readonly canReveal = input(true);
  /** Prefijo que se deja visible ("zc_live_"). */
  readonly keepPrefix = input('');
  /** Se mostró el valor completo (para registrarlo en la auditoría). */
  readonly revealed = output<void>();
  readonly btn = INLINE_BTN;
  readonly shown = signal(false);
  readonly copied = signal(false);
  readonly name = computed(() => this.field?.label() ?? '');
  readonly masked = computed(() => { const v = this.value(); const p = this.keepPrefix(); return p + '•'.repeat(16) + v.slice(-4); });
  private timer?: ReturnType<typeof setTimeout>;
  constructor() { inject(DestroyRef).onDestroy(() => clearTimeout(this.timer)); }

  toggle() {
    this.shown.update(s => !s);
    if (this.shown()) { this.revealed.emit(); this.toast.info(this.t('mol.secreto.visible', { label: this.name() }), { text: this.t('mol.secreto.auditado') }); }
  }
  async copy() {
    try { await navigator.clipboard.writeText(this.value()); } catch { /* sin portapapeles: igual se confirma la intención */ }
    this.copied.set(true); this.toast.success(this.t('mol.secreto.copiadaToast', { label: this.name() }));
    clearTimeout(this.timer); this.timer = setTimeout(() => this.copied.set(false), 1600);
  }
}
