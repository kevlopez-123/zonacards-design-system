import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

/** Con useMocks, MSW intercepta las llamadas HTTP antes de arrancar la app. El código de la app no cambia. */
async function prepare(): Promise<void> {
  if (!environment.useMocks) return;
  const { worker } = await import('./app/mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
}

prepare().then(() => bootstrapApplication(App, appConfig)).catch(err => console.error(err));
