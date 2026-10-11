import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, isDevMode, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { TranslocoService, provideTransloco } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { correlationInterceptor, demoUserInterceptor, errorInterceptor } from './core/http/interceptors';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';
import { routes } from './app.routes';

/** Idioma guardado por el usuario (LocaleService), o español. */
const savedLang = () => { try { return localStorage.getItem('zc-lang') === 'en' ? 'en' : 'es'; } catch { return 'es'; } };

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })),
    provideHttpClient(withInterceptors([correlationInterceptor, demoUserInterceptor, errorInterceptor])),
    provideTransloco({
      config: { availableLangs: ['es', 'en'], defaultLang: 'es', fallbackLang: 'es', reRenderOnLangChange: true, prodMode: !isDevMode() },
      loader: TranslocoHttpLoader,
    }),
    // Las traducciones se cargan antes del primer render: nunca se ven claves ("nav.inicio") mientras llegan.
    provideAppInitializer(() => {
      const i18n = inject(TranslocoService); const lang = savedLang();
      i18n.setActiveLang(lang);
      return firstValueFrom(i18n.load(lang)).catch(() => undefined);
    }),
  ],
};
