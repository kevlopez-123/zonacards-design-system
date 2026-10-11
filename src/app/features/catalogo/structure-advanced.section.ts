import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { AppLang, LANGS, LocaleService } from '../../core/l10n/locale.service';
import { COUNTRIES, CountryCode, countryByCode } from '@zonacards/ui/core';
import { formatDate, formatDmy, isoToDate } from '@zonacards/ui/core';
import { formatMoney } from '@zonacards/ui/core';
import { BadgeComponent } from '@zonacards/ui/badge';
import { ButtonDirective } from '@zonacards/ui/button';
import { FlagComponent } from '@zonacards/ui/flag';
import { IconComponent } from '@zonacards/ui/icon';
import { FieldComponent } from '@zonacards/ui/field';
import { ZcOption } from '@zonacards/ui/listbox';
import { SegmentedComponent, ZcSegment } from '@zonacards/ui/segmented';
import { SelectComponent } from '@zonacards/ui/select';
import { LinkComponent } from '@zonacards/ui/misc';
import { DescriptionListComponent, ZcDescription } from '@zonacards/ui/description-list';
import { ToastService } from '@zonacards/ui/toast';
import { AuthComponent, LoginResult } from '@zonacards/ui/auth';
import { ChatComponent, ChatMessage } from '@zonacards/ui/chat';
import { TourComponent, TourStep } from '@zonacards/ui/tour';
import { SsoProvider } from '@zonacards/ui/sso-button';
import { DsSectionComponent } from './ds/ds-layout';

const CURRENCIES: [string, string][] = [['PEN', 'Sol peruano'], ['USD', 'Dólar estadounidense'], ['BOB', 'Boliviano'], ['COP', 'Peso colombiano'], ['CLP', 'Peso chileno'], ['MXN', 'Peso mexicano']];
interface PreviewText { title: string; issued: string; expires: string; amount: string; codes: string; btn: string; status: string; }
const PREVIEW: Record<AppLang, PreviewText> = {
  es: { title: 'Resumen del lote', issued: 'Emitido', expires: 'Vence', amount: 'Valor total', codes: 'códigos', btn: 'Enviar códigos', status: 'Activado' },
  en: { title: 'Batch summary', issued: 'Issued', expires: 'Expires', amount: 'Total value', codes: 'codes', btn: 'Send codes', status: 'Active' },
};

/** Catálogo · organismos de estructura nuevos (o-l10n, o-auth, o-chat y o-tour de index.html; Tanda 3). */
@Component({
  selector: 'zc-catalogo-structure-advanced',
  imports: [BadgeComponent, ButtonDirective, FlagComponent, IconComponent, FieldComponent, SegmentedComponent, SelectComponent, DsSectionComponent,
    LinkComponent, DescriptionListComponent, AuthComponent, ChatComponent, TourComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-12' },
  template: `
    @if (show('o-l10n')) {
      <zc-ds-section dsId="o-l10n" title="Selectores de idioma, país, moneda, zona horaria y formato"
        description="Idioma y país de operación también están en la barra superior. El idioma se muestra por su nombre (no con banderas); el país, con bandera y moneda. Cambiar algo actualiza la vista previa al instante.">
        <div class="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-2">
          <div class="grid grid-cols-[minmax(0,1fr)] gap-y-4">
            <zc-field label="Idioma de la interfaz"><zc-select [options]="langs" [value]="locale.lang()" (valueChange)="setLang($event)" /></zc-field>
            <zc-field label="País de operación" info="Define moneda, impuesto, identificador tributario, formato bancario y zona horaria.">
              <zc-select [options]="countries" [value]="locale.country()" (valueChange)="setCountry($event)" />
            </zc-field>
            <zc-field label="Moneda de visualización" [hint]="currencyHint()"><zc-select [options]="currencies" [(value)]="currency" /></zc-field>
            <zc-field label="Zona horaria"><zc-select [options]="zones" [(value)]="zone" /></zc-field>
            <zc-field label="Formato de fecha"><zc-segmented label="Formato de fecha" [options]="formats" [(value)]="dateFormat" class="justify-self-start" /></zc-field>
          </div>
          <div class="grid content-start gap-2">
            <span class="text-[13px] font-semibold text-muted">Vista previa con la configuración elegida</span>
            <article class="grid grid-cols-[minmax(0,1fr)] gap-3 rounded-md border border-border bg-surface p-5" aria-live="polite" [attr.lang]="locale.lang()">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div class="grid gap-0.5"><strong>{{ p().title }} #02829</strong><span class="flex items-center gap-1.5 text-[13px] text-muted"><zc-flag [code]="locale.country()" [size]="16" />{{ info().name }} · {{ info().taxId }} 20100047218</span></div>
                <zc-badge tone="success" icon="s:check-circle">{{ p().status }}</zc-badge>
              </div>
              <dl class="m-0 grid grid-cols-2 gap-x-5 gap-y-3">
                <div><dt class="text-[13px] text-muted">{{ p().amount }}</dt><dd class="m-0 font-medium num">{{ amount() }}</dd></div>
                <div><dt class="text-[13px] text-muted">{{ p().codes }}</dt><dd class="m-0 font-medium num">{{ codes() }}</dd></div>
                <div><dt class="text-[13px] text-muted">{{ p().issued }}</dt><dd class="m-0 font-medium num">{{ fmt('2026-10-02') }}</dd></div>
                <div><dt class="text-[13px] text-muted">{{ p().expires }}</dt><dd class="m-0 font-medium num">{{ fmt('2026-12-31') }}<span class="block text-[13px] font-normal text-muted">{{ time() }}</span></dd></div>
              </dl>
              <button zcButton class="justify-self-start"><zc-icon name="s:plain" [size]="16" />{{ p().btn }}</button>
            </article>
            <p class="flex items-start gap-2 text-[13.5px] leading-5 text-muted"><zc-icon name="s:info-circle" [size]="16" class="mt-0.5 shrink-0" />Idioma y país son independientes: se puede operar Chile con la interfaz en inglés. Los montos nunca se convierten; se muestran en la moneda de la operación.</p>
          </div>
        </div>
      </zc-ds-section>
    }

    @if (show('o-auth')) {
      <zc-ds-section dsId="o-auth" title="Organismo de autenticación"
        description="Dos variantes: administrador (acceso corporativo con Microsoft Entra ID vía Keycloak y correo para usuarios externos) y portal o e-commerce (Google, Apple y correo). Incluye recuperar contraseña, segundo factor, intentos fallidos, bloqueo temporal, aviso de Bloq Mayús y mensajes que no revelan si una cuenta existe. Prueba con ana@promotick.com / Demo#2026 y el código 123456.">
        <div class="flex flex-wrap items-center gap-3">
          <zc-segmented size="sm" label="Variante" [options]="authVariants" [(value)]="authVariant" />
          <button zcLink class="text-sm" (click)="auth.reset()">Reiniciar demostración</button>
        </div>
        <zc-auth #auth [variant]="$any(authVariant())" [login]="demoLogin" [verifyOtp]="demoOtp" userName="Ana" (signedIn)="toastDone()" (ssoStart)="ssoToast($event)" />
      </zc-ds-section>
    }

    @if (show('o-chat')) {
      <zc-ds-section dsId="o-chat" title="Centro de ayuda y chat"
        description="Burbujas de conversación con estado de envío y lectura, indicador de escritura, respuestas rápidas, adjuntos, enlaces a artículos y paso a un asesor. Enter envía y Shift+Enter hace un salto de línea.">
        <zc-chat title="Ayuda Zonacards" status="Asistente · un asesor responde en menos de 5 min" [messages]="chat()" [quick]="quick" [typing]="typing()"
          (send)="chatSend($event)" (human)="chatSend('Quiero hablar con un asesor')" />
      </zc-ds-section>
    }

    @if (show('o-tour')) {
      <zc-ds-section dsId="o-tour" title="Tour guiado (spotlight)"
        description="Resalta un elemento real de la pantalla y explica para qué sirve. Paso a paso con Atrás, Siguiente y Saltar; Escape lo cierra; el foco queda dentro de la tarjeta. En móvil la explicación aparece abajo.">
        <div class="flex flex-wrap items-center gap-3">
          <button #tourBtn zcButton (click)="tour.start(tourBtn)"><zc-icon name="l:sparkles" [size]="16" />Iniciar recorrido</button>
          <span class="text-[12.5px] leading-[18px] text-muted">4 pasos sobre la barra superior de esta página.</span>
        </div>
        <zc-description-list layout="rows" [items]="tourRules" />
        <zc-tour #tour [steps]="tourSteps" (finished)="tourDone($event)" />
      </zc-ds-section>
    }`,
})
export class StructureAdvancedSection {
  readonly parts = input<string[] | null>(null);
  show(id: string) { const p = this.parts(); return !p || p.includes(id); }
  readonly locale = inject(LocaleService);
  readonly langs: ZcOption<string>[] = LANGS.map(l => ({ value: l.code, label: l.name, description: l.soon ? 'Portugués (próximamente)' : l.code === 'es' ? 'Español' : 'Inglés', disabled: !!l.soon }));
  readonly countries: ZcOption<CountryCode>[] = COUNTRIES.map(c => ({ value: c.code, label: c.name, flag: c.code, meta: c.currency }));
  readonly currencies: ZcOption<string>[] = CURRENCIES.map(([c, n]) => ({ value: c, label: `${c} · ${n}` }));
  /** Zona horaria: ciudad y país, con la diferencia con UTC a la derecha ("GMT−5") y su identificador IANA como detalle. */
  readonly zones: ZcOption<string>[] = COUNTRIES.map(c => ({
    value: c.timeZone, flag: c.code, label: c.timeZone.split('/')[1].replace(/_/g, ' ') + ', ' + c.name, description: c.timeZone,
    meta: (new Intl.DateTimeFormat('en-US', { timeZone: c.timeZone, timeZoneName: 'shortOffset' }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value ?? '').replace('-', '−'),
  }));
  readonly formats: ZcSegment[] = [{ value: 'dmy', label: 'dd/mm/aaaa' }, { value: 'iso', label: 'aaaa-mm-dd' }, { value: 'long', label: 'Texto' }];
  readonly info = computed(() => countryByCode(this.locale.country()));
  readonly currency = signal<unknown>(this.info().currency);
  readonly zone = signal<unknown>(this.info().timeZone);
  readonly dateFormat = signal<string | null>('dmy');
  readonly p = computed(() => PREVIEW[this.locale.lang()]);
  readonly currencyHint = computed(() => (this.locale.country() === 'ec' ? 'Ecuador opera en USD.' : 'La moneda de la operación; los montos no se convierten.'));
  readonly amount = computed(() => formatMoney(1250350.5, this.locale.country()));
  readonly codes = computed(() => new Intl.NumberFormat(this.locale.lang() === 'en' ? 'en-US' : this.info().locale).format(12480));
  fmt(iso: string) {
    const f = this.dateFormat();
    return f === 'iso' ? iso : f === 'long' ? formatDate(isoToDate(iso), 'long', { lang: this.locale.lang(), timeZone: 'UTC' }) : formatDmy(iso);
  }
  readonly time = computed(() => {
    const tz = String(this.zone()); const d = new Date('2026-12-31T06:05:00Z');
    const name = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(d).find(x => x.type === 'timeZoneName')?.value ?? '';
    return `${formatDate(d, 'time', { lang: this.locale.lang(), timeZone: tz })} ${name}`;
  });
  private readonly toast = inject(ToastService);

  // Autenticación (demostración: ana@promotick.com / Demo#2026 y código 123456)
  readonly authVariants: ZcSegment[] = [{ value: 'admin', label: 'Administrador' }, { value: 'shop', label: 'Portal / e-commerce' }];
  readonly authVariant = signal<string | null>('admin');
  readonly demoLogin = (email: string, pw: string) => new Promise<LoginResult>(r => setTimeout(() => r(email.toLowerCase() === 'ana@promotick.com' && pw === 'Demo#2026' ? 'otp' : 'bad'), 700));
  readonly demoOtp = (code: string) => Promise.resolve(code === '123456');
  toastDone() { this.toast.success('Sesión iniciada', { text: 'En la app te lleva al dashboard según tu rol.' }); }
  ssoToast(p: SsoProvider) { this.toast.info('Proveedor externo', { text: `En la app se abre la ventana de ${p === 'google' ? 'Google' : p === 'apple' ? 'Apple' : 'Microsoft'} y vuelve con la sesión iniciada.` }); }

  // Chat
  private seqMsg = 3;
  readonly quick = ['Estado de un pedido', 'Reenviar un código', 'Hablar con un asesor'];
  readonly typing = signal(false);
  readonly chat = signal<ChatMessage[]>([
    { id: 'm1', from: 'bot', text: '¡Hola, Ana! Soy el asistente de Zonacards. ¿En qué te ayudo?', time: '09:12' },
    { id: 'm2', from: 'me', text: '¿Cómo extiendo la vigencia de un lote?', time: '09:13', status: 'read' },
    { id: 'm3', from: 'bot', text: 'Puedes extenderla una sola vez, antes del vencimiento. Ve a la ficha del lote › Acciones › Extender vigencia. La solicitud pasa a aprobación.', time: '09:13', article: { title: 'Cómo extender la vigencia', meta: 'Centro de ayuda · 2 min de lectura' } },
  ]);
  private now() { return formatDate(new Date(), 'time-pad', { lang: this.locale.lang() }); }
  chatSend(text: string) {
    const id = 'm' + ++this.seqMsg;
    this.chat.update(l => [...l, { id, from: 'me', text, time: this.now(), status: 'sent' }]);
    setTimeout(() => { this.chat.update(l => l.map(m => (m.id === id ? { ...m, status: 'read' as const } : m))); this.typing.set(true); }, 500);
    setTimeout(() => {
      const r = /asesor/i.test(text) ? 'Te estoy conectando con un asesor. Tiempo estimado: 3 minutos. Puedes seguir usando Zonacards; te avisaremos aquí.'
        : /pedido|estado/i.test(text) ? 'Escribe el número del pedido (por ejemplo, #GF-20931) y te digo en qué estado está.'
        : /código|reenviar/i.test(text) ? 'Para reenviar, abre la ficha del código y elige Reenviar. ¿Quieres que te lleve?' : 'Gracias. Te respondo enseguida con la mejor opción.';
      this.typing.set(false);
      this.chat.update(l => [...l, { id: 'm' + ++this.seqMsg, from: 'bot', text: r, time: this.now() }]);
    }, 1500);
  }

  // Tour (sobre la barra superior real)
  readonly tourSteps: TourStep[] = [
    { target: 'header [role="radiogroup"][aria-label="Tema"]', title: 'Elige el tema', text: 'Claro, oscuro o según tu sistema. Se guarda para la próxima vez.' },
    { target: 'header zc-country-switcher button', title: 'País de operación', text: 'Filtra los datos y define moneda, impuestos y documentos.' },
    { target: 'header zc-notifications button', title: 'Notificaciones', text: 'Aquí llegan las aprobaciones pendientes y las alertas de stock.' },
    { target: 'header button[aria-label^="Buscar"]:not([class*="md:hidden"])', title: 'Búsqueda rápida', text: 'Con Ctrl + K buscas cualquier pantalla o acción.' },
  ];
  readonly tourRules: ZcDescription[] = [
    { term: 'Cuándo', value: 'Primer ingreso, funciones nuevas y módulos complejos. Nunca más de 5 pasos; siempre se puede saltar y volver a ver desde Ayuda.' },
    { term: 'Contenido', value: 'Título de 3 a 5 palabras y una frase sobre el beneficio, no sobre el control.' },
    { term: 'Accesibilidad', value: 'El foco va a la tarjeta, Escape cierra, el elemento resaltado se anuncia por su nombre.' },
  ];
  tourDone(done: boolean) { if (done) this.toast.success('Recorrido terminado', { text: 'Puedes volver a verlo desde Ayuda.' }); }

  setLang(v: unknown) { if (v === 'es' || v === 'en') this.locale.lang.set(v); }
  setCountry(v: unknown) {
    if (!v) return;
    this.locale.country.set(v as CountryCode);
    this.currency.set(this.info().currency); this.zone.set(this.info().timeZone);
  }
}
