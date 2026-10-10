import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { correlationInterceptor, errorInterceptor } from './core/http/interceptors';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })),
    provideHttpClient(withInterceptors([correlationInterceptor, errorInterceptor])),
    provideTransloco({
      config: { availableLangs: ['es', 'en'], defaultLang: 'es', fallbackLang: 'es', reRenderOnLangChange: true, prodMode: !isDevMode() },
      loader: TranslocoHttpLoader,
    }),
  ],
};
