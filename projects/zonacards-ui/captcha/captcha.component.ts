import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, input, model, output, signal, viewChild } from '@angular/core';
import { AlertComponent } from '@zonacards/ui/alert';
import { ButtonDirective } from '@zonacards/ui/button';
import { injectLang, injectTranslate } from '@zonacards/ui/core';
import { SkeletonComponent } from '@zonacards/ui/skeleton';

/** Proveedor anti-bot. Turnstile (Cloudflare) es el recomendado: casi siempre pasa sin desafío y no rastrea al usuario. */
export type ZcCaptchaProvider = 'turnstile' | 'hcaptcha' | 'recaptcha';

/** API común de los tres proveedores (render explícito). */
interface CaptchaApi {
  render(el: HTMLElement, opts: Record<string, unknown>): string | number;
  reset(id?: string | number): void;
  remove?(id: string | number): void;
}

const SCRIPTS: Record<ZcCaptchaProvider, { url: string; global: string }> = {
  turnstile: { url: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', global: 'turnstile' },
  hcaptcha: { url: 'https://js.hcaptcha.com/1/api.js?render=explicit', global: 'hcaptcha' },
  recaptcha: { url: 'https://www.google.com/recaptcha/api.js?render=explicit', global: 'grecaptcha' },
};
const loading = new Map<ZcCaptchaProvider, Promise<CaptchaApi>>();

/** Carga el script del proveedor una sola vez por página y espera a que su API esté lista. */
function loadApi(doc: Document, p: ZcCaptchaProvider): Promise<CaptchaApi> {
  const win = doc.defaultView as unknown as Record<string, CaptchaApi | undefined>;
  const cached = loading.get(p);
  if (cached) return cached;
  const { url, global } = SCRIPTS[p];
  const promise = new Promise<CaptchaApi>((resolve, reject) => {
    const ready = () => {
      const api = win[global];
      if (!api?.render) return false;
      // reCAPTCHA expone grecaptcha antes de estar lista: se espera a ready().
      const r = (api as unknown as { ready?: (cb: () => void) => void }).ready;
      if (p === 'recaptcha' && r) r(() => resolve(api)); else resolve(api);
      return true;
    };
    if (ready()) return;
    const s = doc.createElement('script');
    s.src = url; s.async = true; s.defer = true;
    s.onload = () => { if (!ready()) { const t = setInterval(() => { if (ready()) clearInterval(t); }, 50); setTimeout(() => { clearInterval(t); reject(new Error('captcha')); }, 10000); } };
    s.onerror = () => { loading.delete(p); s.remove(); reject(new Error('captcha')); };
    doc.head.append(s);
  });
  loading.set(p, promise);
  return promise;
}

/**
 * <zc-captcha provider="turnstile" siteKey="…" [(token)]="token" /> · verificación anti-bot para formularios públicos
 * (consulta de saldo, registro, recuperar contraseña).
 * - El script del proveedor se carga recién al dibujarse (no entra en el bundle ni en otras páginas).
 * - token queda vacío hasta que se resuelve; vence a los pocos minutos y vuelve a vacío (expired). Deshabilita el envío mientras esté vacío.
 * - El token se valida SIEMPRE en el servidor con la clave secreta del proveedor: sin eso no protege nada.
 * - Tema claro/oscuro según la clase dark de <html> e idioma de la app. Si el proveedor no carga, aviso con Reintentar.
 * - reset() pide un desafío nuevo (después de un envío fallido el token ya se usó).
 */
@Component({
  selector: 'zc-captcha',
  imports: [AlertComponent, ButtonDirective, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 gap-2' },
  template: `
    <div class="relative min-h-[65px] min-w-0">
      <div #box class="min-w-0 [&_iframe]:max-w-full"></div>
      @if (state() === 'loading') { <zc-skeleton variant="block" class="absolute inset-0 h-[65px] max-w-[300px]" [attr.aria-label]="t('mol.captcha.cargando')" /> }
    </div>
    @if (state() === 'failed') {
      <zc-alert tone="warning" [title]="t('mol.captcha.error.titulo')">
        {{ t('mol.captcha.error.texto') }}
        <button zcButton type="button" variant="outline" size="sm" class="mt-2" (click)="retry()">{{ t('mol.captcha.error.reintentar') }}</button>
      </zc-alert>
    }`,
})
export class CaptchaComponent {
  readonly t = injectTranslate();
  private readonly lang = injectLang();
  private readonly doc = inject(DOCUMENT);

  readonly provider = input<ZcCaptchaProvider>('turnstile');
  /** Clave pública del sitio (la secreta vive solo en el servidor). */
  readonly siteKey = input.required<string>();
  /** Acción para los reportes del proveedor (Turnstile): "consulta-saldo". */
  readonly action = input('');
  /** Token resuelto; vacío mientras no se verifica o cuando vence. */
  readonly token = model('');
  readonly expired = output<void>();

  readonly state = signal<'loading' | 'ready' | 'failed'>('loading');
  private readonly box = viewChild.required<ElementRef<HTMLElement>>('box');
  private api: CaptchaApi | null = null;
  private widget: string | number | null = null;

  constructor() {
    afterNextRender(() => void this.mount());
    inject(DestroyRef).onDestroy(() => { if (this.api && this.widget !== null) this.api.remove?.(this.widget); });
  }

  /** Nuevo desafío: después de un envío (el token es de un solo uso) o si el servidor lo rechazó. */
  reset() { this.token.set(''); if (this.api && this.widget !== null) this.api.reset(this.widget); }

  retry() { this.state.set('loading'); void this.mount(); }

  private async mount() {
    try {
      this.api = await loadApi(this.doc, this.provider());
      const dark = this.doc.documentElement.classList.contains('dark');
      const opts: Record<string, unknown> = {
        sitekey: this.siteKey(),
        theme: dark ? 'dark' : 'light',
        callback: (tok: string) => this.token.set(tok),
        'expired-callback': () => { this.token.set(''); this.expired.emit(); },
        'error-callback': () => { this.token.set(''); this.state.set('failed'); },
      };
      if (this.provider() === 'turnstile') { opts['language'] = this.lang(); if (this.action()) opts['action'] = this.action(); }
      else if (this.provider() === 'hcaptcha') opts['hl'] = this.lang();
      this.box().nativeElement.replaceChildren();
      this.widget = this.api.render(this.box().nativeElement, opts);
      this.state.set('ready');
    } catch {
      this.state.set('failed');
    }
  }
}
