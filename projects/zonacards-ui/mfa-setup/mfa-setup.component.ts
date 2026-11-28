import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { AlertComponent } from '@zonacards/ui/alert';
import { ButtonDirective } from '@zonacards/ui/button';
import { CheckboxComponent } from '@zonacards/ui/checkbox';
import { downloadBlob, injectTranslate } from '@zonacards/ui/core';
import { FieldComponent } from '@zonacards/ui/field';
import { IconComponent } from '@zonacards/ui/icon';
import { OtpComponent } from '@zonacards/ui/otp';
import { SpinnerComponent } from '@zonacards/ui/spinner';

type Step = 'scan' | 'verify' | 'codes' | 'done';

/**
 * <zc-mfa-setup [qrImage] [secret] [verify] [recoveryCodes] (finished)> · enrolamiento del segundo factor (TOTP).
 * 1. Escanear el QR con una app de autenticación, o escribir la clave a mano (agrupada de a 4, con copiar).
 * 2. Escribir el código de 6 dígitos; la app lo valida con [verify].
 * 3. Si hay [recoveryCodes]: mostrarlos con copiar y descargar, y confirmar que se guardaron antes de terminar.
 * El QR lo genera el servidor (en Keycloak, totp.totpSecretQrCode como data URI): el componente no crea secretos.
 * Sirve para el tema de Keycloak (login-config-totp) y para la configuración de seguridad de la cuenta.
 */
@Component({
  selector: 'zc-mfa-setup',
  imports: [AlertComponent, ButtonDirective, CheckboxComponent, FieldComponent, IconComponent, OtpComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6' },
  template: `
    <ol class="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-caption text-muted" [attr.aria-label]="t('mol.mfa.pasos')">
      @for (s of steps(); track s; let i = $index) {
        <li class="flex items-center gap-1.5" [attr.aria-current]="s === step() ? 'step' : null" [class.text-fg]="s === step()" [class.font-semibold]="s === step()">
          <span class="grid size-5 place-items-center rounded-full text-caption" [class]="stepIndex() > i ? 'bg-success-bg text-success' : s === step() ? 'bg-primary text-on-primary' : 'bg-surface-2'">
            @if (stepIndex() > i) { <zc-icon name="l:check" [size]="16" /> } @else { {{ i + 1 }} }
          </span>
          {{ t('mol.mfa.paso.' + s) }}
        </li>
      }
    </ol>

    @switch (step()) {
      @case ('scan') {
        <div class="grid grid-cols-[minmax(0,1fr)] gap-2">
          <div #heading role="heading" [attr.aria-level]="headingLevel()" tabindex="-1" class="text-title font-semibold leading-7 outline-none">{{ t('mol.mfa.escanear.titulo') }}</div>
          <p class="m-0 text-body text-muted">{{ t('mol.mfa.escanear.texto') }}</p>
        </div>
        <div class="grid grid-cols-[minmax(0,1fr)] justify-items-center gap-4 rounded-md border border-border bg-surface p-5">
          <!-- El QR va siempre sobre fondo claro (--qr-bg): las apps no leen un QR invertido. -->
          <img [src]="qrImage()" [alt]="t('mol.mfa.escanear.qrAlt')" class="size-48 rounded-sm bg-(--qr-bg) p-2 [image-rendering:pixelated]" />
          @if (account()) { <p class="m-0 text-center text-body-sm text-muted">{{ account() }}</p> }
        </div>
        <details class="group rounded-md border border-border bg-surface">
          <summary class="flex min-h-target cursor-pointer list-none items-center justify-between gap-3 px-4 text-body font-medium [&::-webkit-details-marker]:hidden">
            {{ t('mol.mfa.escanear.manual') }}<zc-icon name="s:alt-arrow-down" [size]="20" class="transition-transform group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <div class="grid grid-cols-[minmax(0,1fr)] gap-3 border-t border-border p-4">
            <p class="m-0 text-body-sm text-muted">{{ t('mol.mfa.escanear.manualTexto') }}</p>
            <div class="flex min-w-0 flex-wrap items-center gap-2">
              <code class="min-w-0 flex-1 break-all rounded-sm bg-surface-2 px-3 py-2 font-mono text-body tracking-wider num" [attr.aria-label]="t('mol.mfa.escanear.clave')">{{ secretGroups() }}</code>
              <button zcButton type="button" variant="outline" size="sm" (click)="copy(secret(), 'clave')">
                <zc-icon [name]="copied() === 'clave' ? 'l:check' : 's:copy'" [size]="16" />{{ copied() === 'clave' ? t('mol.mfa.copiado') : t('mol.mfa.copiar') }}
              </button>
            </div>
          </div>
        </details>
        <div class="flex flex-wrap justify-end gap-2">
          <ng-content select="[zcMfaCancel]" />
          <button zcButton type="button" (click)="go('verify')">{{ t('mol.mfa.continuar') }}</button>
        </div>
      }
      @case ('verify') {
        <div class="grid grid-cols-[minmax(0,1fr)] gap-2">
          <div #heading role="heading" [attr.aria-level]="headingLevel()" tabindex="-1" class="text-title font-semibold leading-7 outline-none">{{ t('mol.mfa.verificar.titulo') }}</div>
          <p class="m-0 text-body text-muted">{{ t('mol.mfa.verificar.texto') }}</p>
        </div>
        <zc-field [reserve]="false" [label]="t('mol.mfa.verificar.codigo')" [error]="codeError() ? t('mol.mfa.verificar.error') : null">
          <zc-otp [value]="code()" (valueChange)="code.set($event); codeError.set(false)" [state]="codeError() ? 'invalid' : null" [disabled]="busy()" (complete)="check($event)" />
        </zc-field>
        @if (failed()) { <zc-alert tone="danger" [title]="t('mol.mfa.verificar.fallo')">{{ t('mol.mfa.verificar.falloTexto') }}</zc-alert> }
        <div class="flex flex-wrap justify-between gap-2">
          <button zcButton type="button" variant="ghost" (click)="go('scan')"><zc-icon name="s:alt-arrow-left" [size]="16" />{{ t('ui.volver') }}</button>
          <button zcButton type="button" [disabled]="code().length < 6 || busy()" [loading]="busy()" (click)="check(code())">
            @if (busy()) { <zc-spinner [size]="16" /> }{{ t('mol.mfa.verificar.boton') }}
          </button>
        </div>
      }
      @case ('codes') {
        <div class="grid grid-cols-[minmax(0,1fr)] gap-2">
          <div #heading role="heading" [attr.aria-level]="headingLevel()" tabindex="-1" class="text-title font-semibold leading-7 outline-none">{{ t('mol.mfa.codigos.titulo') }}</div>
          <p class="m-0 text-body text-muted">{{ t('mol.mfa.codigos.texto') }}</p>
        </div>
        <zc-alert tone="warning" [title]="t('mol.mfa.codigos.aviso')">{{ t('mol.mfa.codigos.avisoTexto') }}</zc-alert>
        <ul class="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(128px,1fr))] gap-2 rounded-md border border-border bg-surface p-4" [attr.aria-label]="t('mol.mfa.codigos.titulo')">
          @for (c of recoveryCodes(); track c) { <li class="rounded-sm bg-surface-2 px-3 py-2 text-center font-mono text-body tracking-wider num">{{ c }}</li> }
        </ul>
        <div class="flex flex-wrap gap-2">
          <button zcButton type="button" variant="outline" size="sm" (click)="copy(recoveryCodes().join('\\n'), 'codigos')">
            <zc-icon [name]="copied() === 'codigos' ? 'l:check' : 's:copy'" [size]="16" />{{ copied() === 'codigos' ? t('mol.mfa.copiado') : t('mol.mfa.copiar') }}
          </button>
          <button zcButton type="button" variant="outline" size="sm" (click)="download()"><zc-icon name="s:download-minimalistic" [size]="16" />{{ t('mol.mfa.codigos.descargar') }}</button>
        </div>
        <zc-checkbox [(checked)]="saved">{{ t('mol.mfa.codigos.guarde') }}</zc-checkbox>
        <div class="flex justify-end">
          <button zcButton type="button" [disabled]="!saved()" (click)="finish()">{{ t('mol.mfa.terminar') }}</button>
        </div>
      }
      @case ('done') {
        <div class="grid justify-items-center gap-2 text-center" role="status">
          <span class="grid size-14 place-items-center rounded-ms bg-success-bg text-success"><zc-icon name="s:shield-check" [size]="24" /></span>
          <div #heading role="heading" [attr.aria-level]="headingLevel()" tabindex="-1" class="text-title font-semibold leading-7 outline-none">{{ t('mol.mfa.listo.titulo') }}</div>
          <p class="m-0 text-body text-muted">{{ t('mol.mfa.listo.texto') }}</p>
        </div>
      }
    }`,
})
export class MfaSetupComponent {
  readonly t = injectTranslate();
  private readonly live = inject(LiveAnnouncer);

  /** QR del servidor como data URI o URL (otpauth://… ya dibujado). */
  readonly qrImage = input.required<string>();
  /** Clave en Base32 para escribirla a mano. */
  readonly secret = input.required<string>();
  /** Cuenta que se enrola ("Zonacards · ana@empresa.com"). */
  readonly account = input('');
  /** Valida el código: true si es correcto. Una promesa rechazada muestra el aviso de error de conexión. */
  readonly verify = input.required<(code: string) => Promise<boolean>>();
  /** Códigos de recuperación (opcional): con ellos se agrega el paso 3. */
  readonly recoveryCodes = input<readonly string[]>([]);
  /** Nombre del archivo de códigos (sin extensión). */
  readonly fileName = input('codigos-recuperacion');
  readonly headingLevel = input<1 | 2 | 3 | 4>(2);
  /** Código verificado (y códigos guardados si los hay). */
  readonly finished = output<void>();

  readonly step = signal<Step>('scan');
  readonly code = signal('');
  readonly codeError = signal(false);
  readonly failed = signal(false);
  readonly busy = signal(false);
  readonly saved = signal(false);
  readonly copied = signal<'clave' | 'codigos' | null>(null);
  private copiedTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');

  readonly steps = computed<Step[]>(() => (this.recoveryCodes().length ? ['scan', 'verify', 'codes'] : ['scan', 'verify']));
  readonly stepIndex = computed(() => (this.step() === 'done' ? this.steps().length : this.steps().indexOf(this.step())));
  readonly secretGroups = computed(() => this.secret().replace(/\s+/g, '').replace(/(.{4})(?=.)/g, '$1 '));

  /** Cambia de paso y lleva el foco al título (se anuncia la pantalla nueva). */
  go(s: Step) {
    this.step.set(s);
    if (s === 'verify') { this.code.set(''); this.codeError.set(false); this.failed.set(false); }
    setTimeout(() => this.heading()?.nativeElement.focus());
  }

  async check(code: string) {
    if (code.length < 6 || this.busy()) return;
    this.busy.set(true); this.failed.set(false);
    try {
      if (await this.verify()(code)) { if (this.recoveryCodes().length) this.go('codes'); else this.finish(); }
      else { this.codeError.set(true); this.code.set(''); }
    } catch { this.failed.set(true); }
    finally { this.busy.set(false); }
  }

  async copy(text: string, what: 'clave' | 'codigos') {
    try { await navigator.clipboard.writeText(text); } catch { return; }
    this.copied.set(what);
    this.live.announce(this.t('mol.mfa.copiado'));
    clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => this.copied.set(null), 2000);
  }

  download() { downloadBlob(this.recoveryCodes().join('\r\n') + '\r\n', 'text/plain;charset=utf-8', this.fileName() + '.txt'); }

  finish() { this.go('done'); this.finished.emit(); }
}
