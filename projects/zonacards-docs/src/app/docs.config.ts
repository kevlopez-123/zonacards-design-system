import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, inject, isDevMode, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { ZcTranslocoLoader } from '@zonacards/ui/core';
import { firstValueFrom } from 'rxjs';
import { DOCS_ROUTES } from './docs.routes';

const savedLang = () => { try { return localStorage.getItem('zc-lang') === 'en' ? 'en' : 'es'; } catch { return 'es'; } };

export const docsConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(DOCS_ROUTES, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })),
    provideHttpClient(withFetch()),
    provideTransloco({
      config: { availableLangs: ['es', 'en'], defaultLang: 'es', fallbackLang: 'es', reRenderOnLangChange: true, prodMode: !isDevMode() },
      loader: ZcTranslocoLoader,
    }),
    provideAppInitializer(() => {
      const i18n = inject(TranslocoService); const lang = savedLang();
      i18n.setActiveLang(lang);
      return firstValueFrom(i18n.load(lang)).catch(() => undefined);
    }),
  ],
};
