import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { AlertComponent } from '@zonacards/ui/alert';
import { ButtonDirective } from '@zonacards/ui/button';
import { formatDate, injectLang, injectTranslate } from '@zonacards/ui/core';
import { FieldComponent, InputDirective } from '@zonacards/ui/field';
import { IconComponent } from '@zonacards/ui/icon';
import { OtpComponent } from '@zonacards/ui/otp';

/** Solicitud de eliminación ya registrada: abierta (en trámite) o rechazada. */
export interface DeletionRequest {
  status: 'open' | 'rejected';
  /** Estado para mostrar ("Pendiente", "En revisión"). */
  statusLabel: string;
  /** Fecha y hora ISO de la solicitud. */
  requestedAt: string;
  /** Motivo del rechazo, si lo hubo. */
  rejectReason?: string;
}

/** Lo que la persona manda al solicitar: el código de 6 dígitos y un motivo opcional. */
export interface DeletionSubmit { code: string; reason: string | null }

/**
 * <zc-delete-account [request] [maskedEmail] [sending] [submitting] [error] (sendCode) (submit) (back)> · eliminar mi cuenta (las tiendas
 * de apps lo exigen). Explica qué pasa, pide un código que llega al correo y un motivo opcional, y registra una solicitud que la
 * atiende el equipo: la cuenta sigue activa hasta entonces. Sin estado propio de red: la app envía el código, valida y registra.
 * - Sin solicitud: consecuencias → "Enviar código" → (con `maskedEmail`) código de 6 dígitos, motivo y "Solicitar eliminación".
 * - Con solicitud abierta: su estado y fecha, y Volver. Rechazada: aviso con el motivo y se puede volver a pedir.
 */
@Component({
  selector: 'zc-delete-account',
  imports: [AlertComponent, ButtonDirective, FieldComponent, IconComponent, InputDirective, OtpComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 max-w-2xl grid-cols-[minmax(0,1fr)] gap-5 rounded-card border border-border bg-surface p-5 md:p-6' },
  template: `
    @if (request(); as r) {
      @if (r.status === 'open') {
        <h2 class="m-0 text-heading font-semibold">{{ 'mol.eliminarCuenta.estado' | transloco: { estado: r.statusLabel } }}</h2>
        <p class="m-0 text-muted">{{ 'mol.eliminarCuenta.registrada' | transloco: { fecha: date() } }}</p>
        <button zcButton type="button" class="w-full" (click)="back.emit()">{{ 'mol.eliminarCuenta.volver' | transloco }}</button>
      }
    }
    @if (!open()) {
      @if (request()?.status === 'rejected') {
        <zc-alert tone="danger" [title]="'mol.eliminarCuenta.rechazada' | transloco">{{ request()!.rejectReason ?? '' }}</zc-alert>
      }
      <h2 class="m-0 text-heading font-semibold">{{ 'mol.eliminarCuenta.queSucede' | transloco }}</h2>
      <ol class="m-0 grid list-none gap-3 p-0">
        @for (c of items(); track $index) {
          <li class="flex gap-2"><strong class="num">{{ $index + 1 }}.</strong><span>{{ c }}</span></li>
        }
      </ol>
      @if (!maskedEmail()) {
        <button zcButton type="button" variant="outline" class="w-full" [loading]="sending()" [disabled]="sending()" (click)="sendCode.emit()">
          <zc-icon name="s:letter" [size]="20" />{{ 'mol.eliminarCuenta.enviarCodigo' | transloco }}
        </button>
      } @else {
        <div class="flex items-center gap-3 rounded-card border border-border bg-surface-2 p-4">
          <span class="grid size-11 shrink-0 place-items-center rounded-full bg-surface"><zc-icon name="s:letter" [size]="20" /></span>
          <p class="m-0 text-muted">{{ 'mol.eliminarCuenta.enviadoA' | transloco: { correo: maskedEmail() } }}</p>
        </div>
        <zc-field [label]="'mol.eliminarCuenta.codigo' | transloco" [required]="true" [error]="shownError()">
          <zc-otp [(value)]="code" [state]="shownError() ? 'invalid' : null" (complete)="touched.set(true)" />
        </zc-field>
        <zc-field [label]="'mol.eliminarCuenta.motivo' | transloco" [optional]="true">
          <textarea zcInput rows="3" maxlength="500" [value]="reason()" (input)="reason.set($any($event.target).value)"></textarea>
        </zc-field>
        <button zcButton type="button" variant="danger" class="w-full" [loading]="submitting()" [disabled]="submitting()" (click)="submitNow()">
          {{ 'mol.eliminarCuenta.solicitar' | transloco }}
        </button>
      }
    }`,
})
export class DeleteAccountComponent {
  readonly request = input<DeletionRequest | null>(null);
  /** Correo enmascarado ("a•••@empresa.com") una vez enviado el código; null antes. */
  readonly maskedEmail = input<string | null>(null);
  readonly sending = input(false);
  readonly submitting = input(false);
  /** Error de la app (código inválido, sin red); se muestra en el campo del código. */
  readonly error = input<string | null>(null);
  /** Consecuencias a mostrar; por defecto, las genéricas de la librería. */
  readonly consequences = input<readonly string[] | null>(null);
  readonly sendCode = output<void>();
  readonly submit = output<DeletionSubmit>();
  readonly back = output<void>();

  private readonly t = injectTranslate();
  private readonly lang = injectLang();
  readonly code = signal('');
  readonly reason = signal('');
  readonly touched = signal(false);
  readonly incomplete = signal(false);

  readonly open = computed(() => this.request()?.status === 'open');
  readonly items = computed(() => this.consequences() ?? [1, 2, 3].map(i => this.t(`mol.eliminarCuenta.consecuencia${i}`)));
  readonly date = computed(() => { const r = this.request(); return r ? formatDate(new Date(r.requestedAt), 'medium', { lang: this.lang() }) : ''; });
  readonly shownError = computed(() => this.error() ?? (this.incomplete() && this.code().length < 6 ? this.t('mol.eliminarCuenta.codigoIncompleto') : null));

  submitNow() {
    if (this.code().length !== 6) { this.incomplete.set(true); return; }
    this.incomplete.set(false);
    this.submit.emit({ code: this.code(), reason: this.reason().trim() || null });
  }
}
