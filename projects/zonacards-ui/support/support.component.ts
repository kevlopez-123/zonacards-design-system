import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonDirective } from '@zonacards/ui/button';
import { DIAL_COUNTRIES, formatPhone } from '@zonacards/ui/core';
import { IconComponent } from '@zonacards/ui/icon';
import { LogoComponent } from '@zonacards/ui/logo';
import { OverlayComponent } from '@zonacards/ui/overlay';

/** Canales de contacto de una marca o campaña; los que faltan no se muestran. Teléfonos en formato internacional (+51900000099). */
export interface SupportInfo {
  /** "Lunes a viernes de 9:00 a 18:00". */
  hours?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  /** Centro de ayuda (preguntas frecuentes y guías). */
  url?: string;
}

/** "+51900000099" → "+51 900 000 099": el código de país conocido y el resto en grupos de tres. Lo que no reconoce, igual. */
export function prettyPhone(e164: string): string {
  const raw = e164.trim();
  const digits = raw.replace(/\D/g, '');
  const dial = [...DIAL_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length).find(c => digits.startsWith(c.dial.replace(/\D/g, '')));
  if (!dial) return raw;
  const rest = digits.slice(dial.dial.replace(/\D/g, '').length);
  // Fijo de 8 dígitos con prefijo de una cifra (Lima: 1 700 8000); el resto, en grupos de tres.
  return `${dial.dial} ${rest.length === 8 ? `${rest[0]} ${rest.slice(1, 4)} ${rest.slice(4)}` : formatPhone(rest)}`;
}

/**
 * <zc-support-sheet [(open)] [info]> · "Ayuda y soporte": horario y una fila por canal disponible (llamar, WhatsApp, correo, centro de
 * ayuda). Cada fila es un solo enlace con el canal y el dato (`tel:`, `wa.me`, `mailto:` o la dirección web), de 56 px. Hoja en móvil.
 */
@Component({
  selector: 'zc-support-sheet',
  imports: [ButtonDirective, IconComponent, LogoComponent, OverlayComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <zc-modal [title]="'mol.soporte.titulo' | transloco" [subtitle]="'mol.soporte.texto' | transloco" [(open)]="open">
      <div class="grid gap-4">
        @if (info().hours; as h) {
          <div class="flex items-center gap-3 rounded-card bg-surface-2 p-4">
            <zc-icon name="s:clock-circle" [size]="20" />
            <div class="grid"><strong class="text-sm font-semibold">{{ 'mol.soporte.horario' | transloco }}</strong><span class="text-muted">{{ h }}</span></div>
          </div>
        }
        <ul class="m-0 grid list-none gap-3 p-0">
          @if (info().phone; as p) {
            <li><a [class]="row" [href]="'tel:' + p" [attr.aria-label]="'mol.soporte.fila' | transloco: { canal: ('mol.soporte.llamar' | transloco), dato: pretty(p) }">
              <span [class]="dot"><zc-icon name="s:phone" [size]="20" /></span>
              <span class="grid min-w-0 flex-1"><strong class="text-sm font-semibold">{{ 'mol.soporte.llamar' | transloco }}</strong><span class="text-muted num">{{ pretty(p) }}</span></span>
              <zc-icon name="s:alt-arrow-right" [size]="16" class="text-muted" />
            </a></li>
          }
          @if (info().whatsapp; as w) {
            <li><a [class]="row" [href]="waLink(w)" target="_blank" rel="noopener" [attr.aria-label]="'mol.soporte.fila' | transloco: { canal: 'WhatsApp', dato: pretty(w) }">
              <span [class]="dot"><zc-logo name="whatsapp" [size]="22" /></span>
              <span class="grid min-w-0 flex-1"><strong class="text-sm font-semibold">WhatsApp</strong><span class="text-muted num">{{ pretty(w) }}</span></span>
              <zc-icon name="s:alt-arrow-right" [size]="16" class="text-muted" />
            </a></li>
          }
          @if (info().email; as e) {
            <li><a [class]="row" [href]="'mailto:' + e" [attr.aria-label]="'mol.soporte.fila' | transloco: { canal: ('mol.soporte.correo' | transloco), dato: e }">
              <span [class]="dot"><zc-icon name="s:letter" [size]="20" /></span>
              <span class="grid min-w-0 flex-1"><strong class="text-sm font-semibold">{{ 'mol.soporte.correo' | transloco }}</strong><span class="truncate text-muted">{{ e }}</span></span>
              <zc-icon name="s:alt-arrow-right" [size]="16" class="text-muted" />
            </a></li>
          }
          @if (info().url; as u) {
            <li><a [class]="row" [href]="u" target="_blank" rel="noopener" [attr.aria-label]="'mol.soporte.fila' | transloco: { canal: ('mol.soporte.centro' | transloco), dato: ('mol.soporte.centroTexto' | transloco) }">
              <span [class]="dot"><zc-icon name="l:external-link" [size]="20" /></span>
              <span class="grid min-w-0 flex-1"><strong class="text-sm font-semibold">{{ 'mol.soporte.centro' | transloco }}</strong><span class="text-muted">{{ 'mol.soporte.centroTexto' | transloco }}</span></span>
              <zc-icon name="s:alt-arrow-right" [size]="16" class="text-muted" />
            </a></li>
          }
        </ul>
      </div>
      <div zcOverlayFooter><button zcButton variant="outline" class="w-full" (click)="open.set(false)">{{ 'ui.cerrar' | transloco }}</button></div>
    </zc-modal>`,
})
export class SupportSheetComponent {
  readonly open = model(false);
  readonly info = input.required<SupportInfo>();
  readonly pretty = prettyPhone;
  readonly row = 'flex min-h-14 items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 text-fg no-underline transition hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-focus';
  readonly dot = 'grid size-11 shrink-0 place-items-center rounded-full bg-surface-2';
  /** WhatsApp abre el chat con solo los dígitos del número. */
  waLink(n: string) { return 'https://wa.me/' + n.replace(/\D/g, ''); }
  readonly hasAny = computed(() => !!(this.info().phone || this.info().whatsapp || this.info().email || this.info().url));
}
