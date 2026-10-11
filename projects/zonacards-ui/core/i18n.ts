import { HttpClient } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { catchError, forkJoin, map, of } from 'rxjs';

/**
 * Carpetas (relativas a la app) con archivos <idioma>.json, en orden: las de más adelante pisan a las anteriores.
 * Por defecto: textos del sistema de diseño (copiados del paquete a i18n/zc-ui) y luego los del proyecto (i18n).
 */
export const ZC_I18N_PATHS = new InjectionToken<readonly string[]>('ZC_I18N_PATHS', { factory: () => ['i18n/zc-ui', 'i18n'] });

/** Combina traducciones en profundidad: las claves de `over` reemplazan a las de `base`. */
export function mergeTranslations(base: Translation, over: Translation): Translation {
  const out: Translation = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const prev = out[k];
    out[k] = v && typeof v === 'object' && !Array.isArray(v) && prev && typeof prev === 'object' && !Array.isArray(prev)
      ? mergeTranslations(prev as Translation, v as Translation) : v;
  }
  return out;
}

/**
 * Cargador de Transloco para proyectos que usan @zonacards/ui: lee cada carpeta de ZC_I18N_PATHS y las combina.
 *   provideTransloco({ config: {...}, loader: ZcTranslocoLoader })
 * Si una carpeta no tiene el idioma, se ignora (no rompe la carga).
 */
@Injectable({ providedIn: 'root' })
export class ZcTranslocoLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);
  private readonly paths = inject(ZC_I18N_PATHS);
  getTranslation(lang: string) {
    return forkJoin(this.paths.map(p => this.http.get<Translation>(`${p}/${lang}.json`).pipe(catchError(() => of({} as Translation)))))
      .pipe(map(parts => parts.reduce(mergeTranslations, {} as Translation)));
  }
}
