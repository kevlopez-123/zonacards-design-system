import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { COUNTRIES, CountryCode, countryByCode } from '../../shared/domain/countries';

export type AppLang = 'es' | 'en';
/** Idiomas de la interfaz; pt queda visible como "próximamente" (o-l10n de index.html). */
export const LANGS: { code: AppLang | 'pt'; name: string; soon?: boolean }[] = [
  { code: 'es', name: 'Español' }, { code: 'en', name: 'English' }, { code: 'pt', name: 'Português', soon: true },
];

const read = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* almacenamiento no disponible */ } };

/**
 * Idioma de la interfaz y país de operación del usuario (barra superior y preferencias). Son independientes:
 * se puede operar Chile con la interfaz en inglés. El país define moneda, identificador tributario y zona horaria;
 * los montos nunca se convierten. Se recuerdan por usuario (aquí, en el navegador).
 */
@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly i18n = inject(TranslocoService);
  private readonly doc = inject(DOCUMENT);
  readonly lang = signal<AppLang>(read('zc-lang') === 'en' ? 'en' : 'es');
  readonly country = signal<CountryCode>(COUNTRIES.some(c => c.code === read('zc-country')) ? (read('zc-country') as CountryCode) : 'pe');
  readonly countryInfo = computed(() => countryByCode(this.country()));

  constructor() {
    effect(() => {
      const l = this.lang();
      this.i18n.setActiveLang(l);
      this.doc.documentElement.lang = l;
      write('zc-lang', l);
    });
    effect(() => write('zc-country', this.country()));
  }
}
