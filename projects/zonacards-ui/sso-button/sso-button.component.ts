import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SSO_LOGOS } from '@zonacards/ui/logo';
import { injectTranslate } from '@zonacards/ui/core';

export type SsoProvider = 'google' | 'apple' | 'microsoft';
export type SsoTheme = 'light' | 'dark' | 'neutral' | 'black' | 'white' | 'outline';
export type SsoText = 'continue' | 'signin' | 'signup';

const LOGO: Record<SsoProvider, { key: keyof typeof SSO_LOGOS; size: number }> = {
  google: { key: 'google-icon', size: 18 }, apple: { key: 'apple', size: 16 }, microsoft: { key: 'microsoft-icon', size: 20 },
};
/** Colores, borde y tipografía de cada guía de marca (tokens --sso-* de tokens.css). */
const LOOK: Record<string, string> = {
  'google-light': 'border-(--sso-google-light-bd) bg-(--sso-google-light-bg) text-(--sso-google-light-fg) hover:enabled:bg-(--sso-google-light-hover) hover:enabled:shadow-[0_1px_2px_rgb(60_64_67/.3),0_1px_3px_1px_rgb(60_64_67/.15)]',
  'google-dark': 'border-(--sso-google-dark-bd) bg-(--sso-google-dark-bg) text-(--sso-google-dark-fg)',
  'google-neutral': 'border-transparent bg-(--sso-google-neutral-bg) text-(--sso-google-neutral-fg)',
  'apple-black': 'border-(--sso-apple-black) bg-(--sso-apple-black) text-(--sso-apple-white) [&_path]:fill-(--sso-apple-white)',
  'apple-white': 'border-(--sso-apple-white) bg-(--sso-apple-white) text-(--sso-apple-black) shadow-[0_0_0_1px_rgb(0_0_0/.06)]',
  'apple-outline': 'border-(--sso-apple-black) bg-(--sso-apple-white) text-(--sso-apple-black)',
  'microsoft-light': 'border-(--sso-ms-light-bd) bg-(--sso-apple-white) text-(--sso-ms-light-fg)',
  'microsoft-dark': 'border-(--sso-ms-dark-bg) bg-(--sso-ms-dark-bg) text-(--sso-apple-white)',
};
const FONT: Record<SsoProvider, string> = {
  google: "font-['Roboto',Arial,sans-serif] font-medium tracking-[.25px]",
  apple: "font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Helvetica_Neue',Arial,sans-serif] font-medium",
  microsoft: "font-['Segoe_UI',-apple-system,Arial,sans-serif] font-semibold",
};

/**
 * <button zcSso provider="google" theme="light" text="continue"></button> · acceso con Google, Apple o Microsoft (Entra ID),
 * según las guías de cada marca: logo sin modificar, texto aprobado y colores propios.
 * shape: pill (Google y Apple por defecto) o rect (Microsoft); text null = solo logo (lleva aria-label de "Iniciar sesión con …").
 * block: todo el ancho (formularios de acceso). loading: "Redirigiendo…" mientras se abre el proveedor.
 */
@Component({
  selector: 'button[zcSso]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    type: 'button', '[class]': 'classes()', '[attr.aria-label]': 'text() ? null : label("signin")', '[disabled]': 'loading()', '[attr.aria-busy]': 'loading() || null',
  },
  template: `
    <span class="grid shrink-0 place-items-center">
      <svg [attr.viewBox]="'0 0 ' + logo().w + ' ' + logo().h" [attr.width]="logoSize()" [attr.height]="logoH()" aria-hidden="true" focusable="false" class="block">
        @for (p of logo().paths; track $index) { <path [attr.d]="p.d" [attr.fill]="p.fill" /> }
      </svg>
    </span>
    @if (text(); as tx) { <span class="min-w-0 truncate">{{ loading() ? t('mol.sso.redirigiendo') : label(tx) }}</span> }`,
})
export class SsoButtonComponent {
  readonly t = injectTranslate();
  readonly provider = input.required<SsoProvider>();
  readonly theme = input<SsoTheme>('light');
  readonly text = input<SsoText | null>('continue');
  readonly shape = input<'pill' | 'rect' | null>(null);
  readonly block = input(false);
  readonly loading = input(false);
  readonly logo = computed(() => SSO_LOGOS[LOGO[this.provider()].key]);
  readonly logoSize = computed(() => LOGO[this.provider()].size);
  readonly logoH = computed(() => Math.round(this.logoSize() * this.logo().h / this.logo().w));
  label(tx: SsoText) { return this.t(`mol.sso.${tx}`, { p: this.t('mol.sso.' + this.provider()) }); }
  readonly classes = computed(() => {
    const p = this.provider(); const shape = this.shape() ?? (p === 'microsoft' ? 'rect' : 'pill');
    const size = this.text() ? (this.block() ? 'w-full px-4' : 'w-full max-w-[400px] px-4') : 'w-target px-0';
    return `inline-flex h-target cursor-pointer items-center justify-center gap-2.5 whitespace-nowrap border text-[15px] transition-[background,box-shadow] duration-(--dur) disabled:cursor-progress disabled:opacity-60 ${size} ${shape === 'pill' ? 'rounded-full' : 'rounded-[6px]'} ${FONT[p]} ${LOOK[`${p}-${this.theme()}`] ?? LOOK[`${p}-light`] ?? LOOK['apple-black']}`;
  });
}
