import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { ButtonDirective } from '@zonacards/ui/button';
import { CheckboxComponent } from '@zonacards/ui/checkbox';
import { IconComponent } from '@zonacards/ui/icon';
import { SpinnerComponent } from '@zonacards/ui/spinner';
import { injectTranslate } from '@zonacards/ui/core';
import { AlertComponent } from '@zonacards/ui/alert';
import { FieldComponent, InputDirective } from '@zonacards/ui/field';
import { InputGroupComponent } from '@zonacards/ui/input-group';
import { OtpComponent } from '@zonacards/ui/otp';
import { SsoButtonComponent, SsoProvider } from '@zonacards/ui/sso-button';
import { ProgressComponent } from '@zonacards/ui/progress';

export type AuthVariant = 'admin' | 'shop';
export type AuthView = 'login' | 'otp' | 'recovery' | 'setup' | 'forgot' | 'sent' | 'signup' | 'done';
/** otp: pedir el código; setup: la cuenta debe configurar el segundo factor antes de entrar. */
export type LoginResult = 'otp' | 'setup' | 'ok' | 'bad';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60e3;
const RESEND_S = 30;

/**
 * Organismo de autenticación (o-auth de index.html).
 * - admin: Microsoft Entra ID (vía Keycloak) primero y correo para usuarios externos.
 * - shop: Google y Apple, y correo; con registro.
 * Recuperar contraseña, segundo factor (OTP), intentos fallidos con bloqueo temporal de 15 min tras 5, aviso de Bloq Mayús
 * y mensajes que no revelan si una cuenta existe. login y verifyOtp los resuelve la app (en el catálogo, una demostración).
 * - CAPTCHA del ingreso: <zc-captcha zcAuthCaptcha> se proyecta antes de "Ingresar"; [submitBlocked] mientras no tenga token.
 * - "Usar otro método" en el OTP: código de recuperación validado con [verifyRecoveryCode].
 * - login() → 'setup': la cuenta debe configurar el segundo factor; se muestra <zc-mfa-setup zcAuthMfaSetup> y, al terminar, setupDone().
 */
@Component({
  selector: 'zc-auth',
  imports: [ButtonDirective, CheckboxComponent, IconComponent, SpinnerComponent, AlertComponent, FieldComponent, InputDirective, InputGroupComponent, OtpComponent, SsoButtonComponent, ProgressComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] overflow-hidden rounded-lg border border-border bg-bg min-[900px]:min-h-[620px] min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]' },
  template: `
    <aside class="hidden flex-col gap-4 bg-secondary p-8 text-on-secondary min-[900px]:flex" aria-hidden="true">
      <span class="grid size-11 place-items-center rounded-[10px] bg-surface text-lg font-bold text-secondary">Z</span>
      <strong class="max-w-[18ch] text-[26px] leading-[34px]">{{ t('auth.lado.' + variant() + '.titulo') }}</strong>
      <p class="max-w-[36ch] opacity-85">{{ t('auth.lado.' + variant() + '.texto') }}</p>
      <div class="mt-auto grid aspect-[16/10] place-items-center rounded-md bg-[linear-gradient(135deg,color-mix(in_srgb,var(--info-fg)_55%,var(--secondary)),var(--info-fg))] text-on-secondary"><zc-icon name="s:flag" [size]="32" /></div>
    </aside>
    <div class="grid content-center justify-items-center gap-6 px-5 py-8">
      <div class="grid w-full max-w-[400px] grid-cols-[minmax(0,1fr)] gap-6">
        @switch (view()) {
          @case ('login') {
            <div class="grid grid-cols-[minmax(0,1fr)] gap-2">
              <div #heading role="heading" [attr.aria-level]="headingLevel()" tabindex="-1" class="text-2xl font-semibold leading-8 outline-none">{{ t('auth.login.titulo.' + variant()) }}</div>
              @if (variant() === 'admin') { <p class="text-[15px] text-muted">{{ t('auth.login.sub') }}</p> }
              @else { <p class="text-[15px] text-muted">{{ t('auth.login.sinCuenta') }} <button type="button" class="cursor-pointer text-fg underline underline-offset-[3px]" (click)="go('signup')">{{ t('auth.login.registrate') }}</button></p> }
            </div>
            <div class="grid grid-cols-[minmax(0,1fr)] gap-3">
              @for (p of providers(); track p.provider) {
                <button zcSso [provider]="p.provider" [theme]="p.theme" [text]="variant() === 'admin' ? 'signin' : 'continue'" [block]="true" [loading]="sso() === p.provider" (click)="ssoGo(p.provider)"></button>
              }
            </div>
            <div class="flex items-center gap-3 text-[13px] text-muted before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">{{ t('auth.login.divisor.' + variant()) }}</div>
            @if (locked()) {
              <zc-alert tone="danger" [title]="t('auth.bloqueo.titulo')">{{ t('auth.bloqueo.texto', { tiempo: lockText() }) }}</zc-alert>
            } @else if (fails()) {
              <zc-alert tone="danger" [title]="t('auth.error.titulo')">{{ fails() >= 3 ? t('auth.error.quedan', { n: maxFails - fails() }) + ' ' : '' }}{{ t('auth.error.texto') }}</zc-alert>
            }
            <form class="grid grid-cols-[minmax(0,1fr)] gap-4" novalidate (submit)="submit($event)">
              <zc-field [reserve]="false" [label]="t('auth.correo')" [required]="true" [error]="emailError()">
                <input #email zcInput type="email" autocomplete="username" inputmode="email" [disabled]="locked()" [value]="emailV()" (input)="emailV.set($any($event.target).value); emailError.set(null)" />
              </zc-field>
              <zc-field [reserve]="false" [label]="t('auth.clave')" [required]="true" [error]="pwError()">
                <zc-input-group [revealable]="true"><input #pw zcInput type="password" autocomplete="current-password" [disabled]="locked()" [value]="pwV()"
                  (input)="pwV.set($any($event.target).value); pwError.set(null)" (keyup)="caps($event)" (keydown)="caps($event)" /></zc-input-group>
              </zc-field>
              <div class="flex min-h-10 flex-wrap items-center justify-between gap-3">
                <zc-checkbox>{{ t('auth.recordarme') }}</zc-checkbox>
                <button type="button" class="cursor-pointer text-sm text-fg underline underline-offset-[3px]" (click)="go('forgot')">{{ t('auth.olvido') }}</button>
              </div>
              <ng-content select="[zcAuthCaptcha]" />
              <button zcButton type="submit" [block]="true" [disabled]="locked() || busy() || submitBlocked()" [loading]="busy()">
                @if (busy()) { <zc-spinner [size]="16" />{{ t('auth.ingresando') }} } @else { {{ t('auth.ingresar') }} }
              </button>
            </form>
          }
          @case ('otp') {
            <button type="button" class="-mb-3 inline-flex cursor-pointer items-center gap-1 justify-self-start text-sm text-fg" (click)="go('login')"><zc-icon name="s:alt-arrow-left" [size]="16" />{{ t('ui.volver') }}</button>
            <div class="grid grid-cols-[minmax(0,1fr)] gap-2">
              <span class="grid size-11 place-items-center rounded-ms bg-surface-2"><zc-icon name="s:shield-keyhole" /></span>
              <div #heading role="heading" [attr.aria-level]="headingLevel()" tabindex="-1" class="text-2xl font-semibold leading-8 outline-none">{{ t('auth.otp.titulo') }}</div>
              <p class="text-[15px] text-muted">{{ t('auth.otp.texto') }}</p>
            </div>
            <zc-field [reserve]="false" [label]="t('auth.otp.codigo')" [error]="otpError()" [success]="otpOk() ? t('auth.otp.correcto') : null">
              <zc-otp [value]="otpV()" (valueChange)="otpV.set($event); otpError.set(null)" [state]="otpError() ? 'invalid' : otpOk() ? 'valid' : null" (complete)="checkOtp($event)" />
            </zc-field>
            <div class="grid grid-cols-[minmax(0,1fr)] gap-2">
              <zc-checkbox>{{ t('auth.otp.confiar') }}</zc-checkbox>
              <div class="flex min-h-10 flex-wrap items-center justify-between gap-3 text-sm">
                <button type="button" class="cursor-pointer text-fg underline underline-offset-[3px] disabled:cursor-not-allowed disabled:text-subtle disabled:no-underline" [disabled]="resendIn() > 0" (click)="resend()">
                  {{ resendIn() > 0 ? t('auth.otp.reenviarEn', { s: resendIn() }) : t('auth.otp.reenviar') }}
                </button>
                @if (verifyRecoveryCode()) { <button type="button" class="cursor-pointer text-fg underline underline-offset-[3px]" (click)="go('recovery')">{{ t('auth.otp.recuperacion') }}</button> }
              </div>
            </div>
          }
          @case ('forgot') {
            <button type="button" class="-mb-3 inline-flex cursor-pointer items-center gap-1 justify-self-start text-sm text-fg" (click)="go('login')"><zc-icon name="s:alt-arrow-left" [size]="16" />{{ t('ui.volver') }}</button>
            <div class="grid grid-cols-[minmax(0,1fr)] gap-2">
              <div #heading role="heading" [attr.aria-level]="headingLevel()" tabindex="-1" class="text-2xl font-semibold leading-8 outline-none">{{ t('auth.olvidoTitulo') }}</div>
              <p class="text-[15px] text-muted">{{ t('auth.olvidoTexto') }}</p>
            </div>
            <form class="grid grid-cols-[minmax(0,1fr)] gap-4" novalidate (submit)="sendLink($event)">
              <zc-field [reserve]="false" [label]="t('auth.correo')" [required]="true" [error]="emailError()">
                <input #email zcInput type="email" autocomplete="email" [value]="emailV()" (input)="emailV.set($any($event.target).value); emailError.set(null)" />
              </zc-field>
              @if (forgotFailed()) { <zc-alert tone="danger" [title]="t('auth.olvidoError')">{{ t('auth.olvidoErrorTexto') }}</zc-alert> }
              <button zcButton type="submit" [block]="true" [disabled]="busy()" [loading]="busy()">
                @if (busy()) { <zc-spinner [size]="16" /> }{{ t('auth.enviarEnlace') }}
              </button>
            </form>
          }
          @case ('sent') {
            <div class="grid justify-items-center gap-2 text-center">
              <span class="grid size-14 place-items-center rounded-ms bg-surface-2"><zc-icon name="s:inbox" [size]="24" /></span>
              <div #heading role="heading" [attr.aria-level]="headingLevel()" tabindex="-1" class="text-2xl font-semibold leading-8 outline-none">{{ t('auth.revisaCorreo') }}</div>
              <p class="text-[15px] text-muted">{{ t('auth.revisaTexto', { correo: emailV() }) }}</p>
            </div>
            <button zcButton variant="outline" [block]="true" (click)="go('login')">{{ t('auth.volverIngresar') }}</button>
          }
          @case ('signup') {
            <button type="button" class="-mb-3 inline-flex cursor-pointer items-center gap-1 justify-self-start text-sm text-fg" (click)="go('login')"><zc-icon name="s:alt-arrow-left" [size]="16" />{{ t('ui.volver') }}</button>
            <div class="grid grid-cols-[minmax(0,1fr)] gap-2">
              <div #heading role="heading" [attr.aria-level]="headingLevel()" tabindex="-1" class="text-2xl font-semibold leading-8 outline-none">{{ t('auth.crear.titulo') }}</div>
              <p class="text-[15px] text-muted">{{ t('auth.crear.yaTienes') }} <button type="button" class="cursor-pointer text-fg underline underline-offset-[3px]" (click)="go('login')">{{ t('auth.crear.ingresa') }}</button></p>
            </div>
            <div class="grid grid-cols-[minmax(0,1fr)] gap-3">
              <button zcSso provider="google" theme="light" text="signup" [block]="true" (click)="ssoGo('google')"></button>
              <button zcSso provider="apple" theme="black" text="signup" [block]="true" (click)="ssoGo('apple')"></button>
            </div>
            <div class="flex items-center gap-3 text-[13px] text-muted before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">{{ t('auth.login.divisor.shop') }}</div>
            <form class="grid grid-cols-[minmax(0,1fr)] gap-4" novalidate (submit)="signup($event)">
              <zc-field [reserve]="false" [label]="t('auth.correo')" [required]="true" [error]="emailError()"><input zcInput type="email" autocomplete="email" [value]="emailV()" (input)="emailV.set($any($event.target).value); emailError.set(null)" /></zc-field>
              <zc-field [reserve]="false" [label]="t('auth.clave')" [required]="true"><zc-input-group [revealable]="true"><input zcInput type="password" autocomplete="new-password" /></zc-input-group></zc-field>
              <button zcButton type="submit" [block]="true">{{ t('auth.crear.boton') }}</button>
            </form>
          }
          @case ('recovery') {
            <button type="button" class="-mb-3 inline-flex cursor-pointer items-center gap-1 justify-self-start text-sm text-fg" (click)="go('otp')"><zc-icon name="s:alt-arrow-left" [size]="16" />{{ t('ui.volver') }}</button>
            <div class="grid grid-cols-[minmax(0,1fr)] gap-2">
              <span class="grid size-11 place-items-center rounded-ms bg-surface-2"><zc-icon name="s:shield-keyhole" /></span>
              <div #heading role="heading" [attr.aria-level]="headingLevel()" tabindex="-1" class="text-2xl font-semibold leading-8 outline-none">{{ t('auth.recuperacion.titulo') }}</div>
              <p class="text-[15px] text-muted">{{ t('auth.recuperacion.texto') }}</p>
            </div>
            <form class="grid grid-cols-[minmax(0,1fr)] gap-4" novalidate (submit)="checkRecovery($event)">
              <zc-field [reserve]="false" [label]="t('auth.recuperacion.codigo')" [required]="true" [error]="recoveryError()">
                <input #recovery zcInput autocomplete="one-time-code" spellcheck="false" autocapitalize="characters" placeholder="XXXX-XXXX" class="font-mono"
                  [value]="recoveryV()" (input)="recoveryV.set($any($event.target).value); recoveryError.set(null)" />
              </zc-field>
              <button zcButton type="submit" [block]="true" [disabled]="busy()" [loading]="busy()">
                @if (busy()) { <zc-spinner [size]="16" /> }{{ t('auth.recuperacion.boton') }}
              </button>
            </form>
          }
          @case ('setup') {
            <div class="grid grid-cols-[minmax(0,1fr)] gap-2">
              <div #heading role="heading" [attr.aria-level]="headingLevel()" tabindex="-1" class="text-2xl font-semibold leading-8 outline-none">{{ t('auth.configurar.titulo') }}</div>
              <p class="text-[15px] text-muted">{{ t('auth.configurar.texto') }}</p>
            </div>
            <ng-content select="[zcAuthMfaSetup]" />
          }
          @case ('done') {
            <div class="grid justify-items-center gap-2 text-center">
              <span class="grid size-14 place-items-center rounded-ms bg-success-bg text-success"><zc-icon name="s:check-circle" [size]="24" /></span>
              <div #heading role="heading" [attr.aria-level]="headingLevel()" tabindex="-1" class="text-2xl font-semibold leading-8 outline-none">{{ t('auth.hola', { nombre: userName() }) }}</div>
              <p class="text-[15px] text-muted">{{ t('auth.listo') }}</p>
            </div>
            <zc-progress [label]="t('auth.listo')" [value]="100" tone="success" [showLabel]="false" />
          }
        }
      </div>
      @if (termsUrl() && privacyUrl()) {
        <p class="max-w-[400px] text-center text-[12.5px] text-muted">{{ t('auth.legal.antes') }} <a class="text-fg underline" [href]="termsUrl()" target="_blank" rel="noopener">{{ t('auth.legal.terminos') }}</a> {{ t('auth.legal.y') }} <a class="text-fg underline" [href]="privacyUrl()" target="_blank" rel="noopener">{{ t('auth.legal.privacidad') }}</a>.</p>
      }
    </div>`,
})
export class AuthComponent {
  readonly t = injectTranslate();
  readonly variant = input<AuthVariant>('admin');
  /** Valida correo y contraseña (en la app, el servicio de identidad). */
  readonly login = input.required<(email: string, password: string) => Promise<LoginResult>>();
  readonly verifyOtp = input.required<(code: string) => Promise<boolean>>();
  readonly userName = input('');
  /** Envía el enlace de recuperación (en la app, POST /auth/recuperar). Siempre se muestra "Revisa tu correo", exista o no la cuenta;
   *  solo un error de red o del servidor (promesa rechazada) muestra el aviso. Sin función, el enlace no se envía a ningún lado. */
  readonly forgot = input<((email: string) => Promise<void>) | null>(null);
  /** Pide un nuevo código OTP. */
  readonly resendOtp = input<(() => Promise<void>) | null>(null);
  /** Nivel del título de cada vista (1 por defecto: la pantalla de acceso es la página). */
  readonly headingLevel = input<1 | 2 | 3 | 4>(1);
  /** Enlaces del pie legal; sin ambos no se muestra. */
  readonly termsUrl = input('');
  readonly privacyUrl = input('');
  /** Valida un código de recuperación ("Usar otro método" en el paso OTP; sin función, la opción no aparece). */
  readonly verifyRecoveryCode = input<((code: string) => Promise<boolean>) | null>(null);
  /** Bloquea "Ingresar" mientras falte algo de la app, como el CAPTCHA de [zcAuthCaptcha] sin resolver. */
  readonly submitBlocked = input(false);
  readonly recoveryV = signal('');
  readonly recoveryError = signal<string | null>(null);
  private readonly recoveryEl = viewChild<ElementRef<HTMLInputElement>>('recovery');
  readonly forgotFailed = signal(false);
  readonly signedIn = output<void>();
  readonly ssoStart = output<SsoProvider>();
  readonly maxFails = MAX_FAILS;

  readonly view = signal<AuthView>('login');
  readonly emailV = signal(''); readonly pwV = signal(''); readonly otpV = signal('');
  readonly emailError = signal<string | null>(null);
  readonly pwError = signal<string | null>(null);
  readonly otpError = signal<string | null>(null);
  readonly otpOk = signal(false);
  readonly fails = signal(0);
  readonly lockUntil = signal(0);
  readonly now = signal(Date.now());
  readonly busy = signal(false);
  readonly sso = signal<SsoProvider | null>(null);
  readonly resendAt = signal(0);
  readonly locked = computed(() => this.lockUntil() > this.now());
  readonly lockText = computed(() => { const s = Math.max(0, Math.ceil((this.lockUntil() - this.now()) / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; });
  readonly resendIn = computed(() => Math.max(0, Math.ceil((this.resendAt() - this.now()) / 1000)));
  readonly providers = computed<{ provider: SsoProvider; theme: 'light' | 'black' }[]>(() =>
    this.variant() === 'admin' ? [{ provider: 'microsoft', theme: 'light' }] : [{ provider: 'google', theme: 'light' }, { provider: 'apple', theme: 'black' }]);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly emailEl = viewChild<ElementRef<HTMLInputElement>>('email');
  private readonly pwEl = viewChild<ElementRef<HTMLInputElement>>('pw');

  constructor() {
    const tick = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(tick));
  }

  /** Cambia de vista y lleva el foco al título (se anuncia la pantalla nueva). */
  go(v: AuthView) {
    this.view.set(v); this.emailError.set(null); this.pwError.set(null); this.otpError.set(null); this.otpOk.set(false);
    if (v === 'otp') { this.otpV.set(''); this.resendAt.set(Date.now() + RESEND_S * 1000); }
    setTimeout(() => this.heading()?.nativeElement.focus());
  }
  reset() { this.fails.set(0); this.lockUntil.set(0); this.pwV.set(''); this.go('login'); }

  caps(e: KeyboardEvent) {
    const on = e.getModifierState?.('CapsLock');
    if (on) this.pwError.set(this.t('auth.bloqMayus'));
    else if (this.pwError() === this.t('auth.bloqMayus')) this.pwError.set(null);
  }

  async submit(e: Event) {
    e.preventDefault();
    const em = this.emailV().trim();
    const e1 = !em ? this.t('auth.err.correo') : !EMAIL.test(em) ? this.t('auth.err.correoValido') : null;
    const e2 = !this.pwV() ? this.t('auth.err.clave') : null;
    this.emailError.set(e1); this.pwError.set(e2);
    if (e1 || e2) { (e1 ? this.emailEl() : this.pwEl())?.nativeElement.focus(); return; }
    this.busy.set(true);
    const r = await this.login()(em, this.pwV());
    this.busy.set(false);
    if (r === 'otp') { this.fails.set(0); this.go('otp'); return; }
    if (r === 'setup') { this.fails.set(0); this.go('setup'); return; }
    if (r === 'ok') { this.finish(); return; }
    this.fails.update(n => n + 1); this.pwV.set('');
    if (this.fails() >= MAX_FAILS) this.lockUntil.set(Date.now() + LOCK_MS);
    else setTimeout(() => this.pwEl()?.nativeElement.focus());
  }
  async checkOtp(code: string) {
    if (await this.verifyOtp()(code)) { this.otpOk.set(true); setTimeout(() => this.finish(), 500); }
    else { this.otpError.set(this.t('auth.otp.error')); this.otpV.set(''); }
  }
  resend() { this.resendAt.set(Date.now() + RESEND_S * 1000); void this.resendOtp()?.(); }
  async sendLink(e: Event) {
    e.preventDefault();
    const em = this.emailV().trim();
    if (!EMAIL.test(em)) { this.emailError.set(this.t('auth.err.correoValido')); this.emailEl()?.nativeElement.focus(); return; }
    this.forgotFailed.set(false);
    this.busy.set(true);
    try { await this.forgot()?.(em); this.go('sent'); }
    catch { this.forgotFailed.set(true); }
    finally { this.busy.set(false); }
  }
  signup(e: Event) { e.preventDefault(); if (!EMAIL.test(this.emailV().trim())) { this.emailError.set(this.t('auth.err.correoValido')); return; } this.go('login'); }
  ssoGo(p: SsoProvider) { this.sso.set(p); setTimeout(() => { this.sso.set(null); this.ssoStart.emit(p); }, 900); }
  async checkRecovery(e: Event) {
    e.preventDefault();
    const code = this.recoveryV().trim();
    if (!code) { this.recoveryError.set(this.t('auth.recuperacion.requerido')); this.recoveryEl()?.nativeElement.focus(); return; }
    this.busy.set(true);
    try {
      if (await this.verifyRecoveryCode()!(code)) this.finish();
      else { this.recoveryError.set(this.t('auth.recuperacion.error')); this.recoveryEl()?.nativeElement.select(); }
    } finally { this.busy.set(false); }
  }
  /** La app lo llama cuando <zc-mfa-setup zcAuthMfaSetup> termina: completa el ingreso. */
  setupDone() { this.finish(); }
  private finish() { this.go('done'); this.signedIn.emit(); }
}
