import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { formatDate } from '@zonacards/ui/core';
import { RecurRule } from '@zonacards/ui/core';
import { bestTextOn, contrastRatio } from '@zonacards/ui/core';
import { formatMoneyWhole } from '@zonacards/ui/core';
import { IconComponent } from '@zonacards/ui/icon';
import { LinkComponent } from '@zonacards/ui/misc';
import { ScrollAreaDirective } from '@zonacards/ui/core';
import { ColorFieldComponent } from '@zonacards/ui/color';
import { ColorPickerComponent } from '@zonacards/ui/color';
import { AmountPickerComponent } from '@zonacards/ui/commerce';
import { Coupon, CouponCheck, CouponFieldComponent } from '@zonacards/ui/commerce';
import { PasswordFieldComponent, PasswordRulesComponent } from '@zonacards/ui/commerce';
import { FieldComponent } from '@zonacards/ui/field';
import { OtpComponent } from '@zonacards/ui/otp';
import { DEFAULT_RECUR, RecurrenceComponent } from '@zonacards/ui/recurrence';
import { RichTextComponent } from '@zonacards/ui/rich-text';
import { SegmentedComponent, ZcSegment } from '@zonacards/ui/segmented';
import { SignatureComponent, SignatureResult } from '@zonacards/ui/signature';
import { RangeSliderComponent, SliderComponent } from '@zonacards/ui/slider';
import { SsoButtonComponent, SsoText } from '@zonacards/ui/sso-button';
import { ToastService } from '@zonacards/ui/toast';
import { DsSectionComponent } from './ds/ds-layout';

// Datos de prueba de index.html (m-commerce): BIENVENIDA10, NAVIDAD20, GC-4821-7730, FLASH50 y VERANO2025 (vencido).
const COUPONS: Record<string, CouponCheck> = {
  BIENVENIDA10: { code: 'BIENVENIDA10', kind: 'pct', value: 0.1, description: '10 % de descuento' },
  NAVIDAD20: { code: 'NAVIDAD20', kind: 'fix', value: 20, description: 'S/ 20 de descuento' },
  'GC-4821-7730': { code: 'GC-4821-7730', kind: 'gc', value: 15, description: 'Gift card con saldo S/ 15.00' },
  FLASH50: { code: 'FLASH50', kind: 'pct', value: 0.5, description: '50 % de descuento', solo: true },
  VERANO2025: { error: 'expired', date: '31/03/2026' },
};
const EXAMPLE = '<h2>¡Feliz Navidad, María!</h2><p>Gracias por un año <b>increíble</b>. Esta gift card es para ti:</p><ul><li>Úsala en más de 200 marcas</li><li>Vence el <i>31 de diciembre de 2026</i></li></ul><p>Más información en <a href="https://giftealo.com">giftealo.com</a>.</p>';

/** Catálogo · moléculas de formulario avanzadas (m-slider, m-color, m-rte, m-recur, m-sign, m-commerce, m-social de index.html). */
@Component({
  selector: 'zc-catalogo-form-advanced',
  imports: [
    IconComponent, LinkComponent, ScrollAreaDirective, ColorFieldComponent, ColorPickerComponent, AmountPickerComponent, CouponFieldComponent,
    PasswordFieldComponent, PasswordRulesComponent, FieldComponent, OtpComponent, RecurrenceComponent, RichTextComponent, SegmentedComponent, SignatureComponent,
    RangeSliderComponent, SliderComponent, SsoButtonComponent, DsSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-12' },
  templateUrl: './form-advanced.section.html',
})
export class FormAdvancedSection {
  /** Secciones a dibujar (m-slider, m-color…); null = todas. */
  readonly parts = input<string[] | null>(null);
  show(id: string) { const p = this.parts(); return !p || p.includes(id); }
  private readonly toast = inject(ToastService);

  // Slider, OTP, color
  readonly comision = signal(4.5);
  readonly pct = (v: number) => String(v).replace('.', ',') + ' %';
  readonly rango = signal<[number, number]>([50, 500]);
  readonly soles = (v: number) => formatMoneyWhole(v, 'pe');
  readonly rangoTxt = computed(() => `${this.soles(this.rango()[0])} a ${this.soles(this.rango()[1])}`);
  readonly otp = signal('');
  readonly otpState = computed<'valid' | 'invalid' | null>(() => (this.otp().length < 6 ? null : this.otp() === '123456' ? 'valid' : 'invalid'));
  readonly colorPlantilla = signal('#E4572E');

  // Color picker
  readonly btnHex = signal('#172948');
  readonly bgHex = signal('#FFF7E8');
  readonly inlineHex = signal('#0F766E');
  readonly btnText = computed(() => bestTextOn(this.btnHex()));
  readonly bgText = computed(() => (contrastRatio(this.bgHex(), '#000000') >= contrastRatio(this.bgHex(), '#FFFFFF') ? 'var(--neutral-900)' : 'var(--neutral-50)'));

  // Texto enriquecido
  readonly html = signal('');
  loadExample() { this.html.set(EXAMPLE); }

  // Recurrencia
  readonly regla = signal<RecurRule>(DEFAULT_RECUR);

  // Firma
  readonly firma = signal<(SignatureResult & { when: string }) | null>(null);
  signed(r: SignatureResult) {
    const when = formatDate(r.at, 'dt-medium');
    this.firma.set({ ...r, when });
    this.toast.success('Firma registrada', { text: when });
  }

  // Compra
  readonly monto = signal<number | null>(50);
  readonly cupones = signal<Coupon[]>([]);
  readonly validar = (code: string) => new Promise<CouponCheck>(res => setTimeout(() => res(COUPONS[code] ?? { error: 'notFound' }), 600));
  readonly clave = signal('');

  // Acceso
  readonly ssoText = signal<SsoText | null>('continue');
  readonly ssoTexts: ZcSegment<SsoText>[] = [{ value: 'continue', label: 'Continuar' }, { value: 'signin', label: 'Iniciar sesión' }, { value: 'signup', label: 'Registrarse' }];
  readonly ssoBusy = signal<string | null>(null);
  sso(id: string, label: string) {
    this.ssoBusy.set(id);
    setTimeout(() => { this.ssoBusy.set(null); this.toast.info(label, { text: 'En la app redirige al proveedor (OAuth 2.0 / OpenID Connect).' }); }, 900);
  }
}
