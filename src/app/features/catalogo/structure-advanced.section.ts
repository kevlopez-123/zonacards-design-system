import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { AppLang, LANGS, LocaleService } from '../../core/l10n/locale.service';
import { COUNTRIES, CountryCode, countryByCode } from '../../shared/domain/countries';
import { formatDate, formatDmy, isoToDate } from '../../shared/domain/dates';
import { formatMoney } from '../../shared/domain/money';
import { BadgeComponent } from '../../shared/ui/atoms/badge/badge.component';
import { ButtonDirective } from '../../shared/ui/atoms/button/button.directive';
import { FlagComponent } from '../../shared/ui/atoms/flag/flag.component';
import { IconComponent } from '../../shared/ui/atoms/icon/icon.component';
import { FieldComponent } from '../../shared/ui/molecules/field/field.component';
import { ZcOption } from '../../shared/ui/molecules/listbox/listbox.component';
import { SegmentedComponent, ZcSegment } from '../../shared/ui/molecules/segmented/segmented.component';
import { SelectComponent } from '../../shared/ui/molecules/select/select.component';
import { DsSectionComponent } from './ds/ds-layout';

const CURRENCIES: [string, string][] = [['PEN', 'Sol peruano'], ['USD', 'Dólar estadounidense'], ['BOB', 'Boliviano'], ['COP', 'Peso colombiano'], ['CLP', 'Peso chileno'], ['MXN', 'Peso mexicano']];
interface PreviewText { title: string; issued: string; expires: string; amount: string; codes: string; btn: string; status: string; }
const PREVIEW: Record<AppLang, PreviewText> = {
  es: { title: 'Resumen del lote', issued: 'Emitido', expires: 'Vence', amount: 'Valor total', codes: 'códigos', btn: 'Enviar códigos', status: 'Activado' },
  en: { title: 'Batch summary', issued: 'Issued', expires: 'Expires', amount: 'Total value', codes: 'codes', btn: 'Send codes', status: 'Active' },
};

/** Catálogo · organismos de estructura nuevos (o-l10n de index.html; Tanda 3). */
@Component({
  selector: 'zc-catalogo-structure-advanced',
  imports: [BadgeComponent, ButtonDirective, FlagComponent, IconComponent, FieldComponent, SegmentedComponent, SelectComponent, DsSectionComponent],
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
    }`,
})
export class StructureAdvancedSection {
  readonly parts = input<string[] | null>(null);
  show(id: string) { const p = this.parts(); return !p || p.includes(id); }
  readonly locale = inject(LocaleService);
  readonly langs: ZcOption<string>[] = LANGS.map(l => ({ value: l.code, label: l.name, description: l.soon ? 'Portugués (próximamente)' : l.code === 'es' ? 'Español' : 'Inglés', disabled: !!l.soon }));
  readonly countries: ZcOption<CountryCode>[] = COUNTRIES.map(c => ({ value: c.code, label: c.name, flag: c.code, meta: c.currency }));
  readonly currencies: ZcOption<string>[] = CURRENCIES.map(([c, n]) => ({ value: c, label: `${c} · ${n}` }));
  readonly zones: ZcOption<string>[] = COUNTRIES.map(c => ({ value: c.timeZone, label: c.timeZone.split('/')[1].replace(/_/g, ' ') }));
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
  setLang(v: unknown) { if (v === 'es' || v === 'en') this.locale.lang.set(v); }
  setCountry(v: unknown) {
    if (!v) return;
    this.locale.country.set(v as CountryCode);
    this.currency.set(this.info().currency); this.zone.set(this.info().timeZone);
  }
}
