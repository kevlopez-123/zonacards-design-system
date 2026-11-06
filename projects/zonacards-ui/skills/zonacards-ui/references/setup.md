# Instalar @zonacards/ui en un proyecto Angular 21 o 22

Requisitos: Angular 21.2+ o 22 (probado con 22.2), Tailwind v4 (`@tailwindcss/postcss`), proyecto standalone y zoneless.

## 1. Paquetes

```bash
npm install @zonacards/ui @angular/cdk @jsverse/transloco @spartan-ng/brain tailwindcss tw-animate-css flag-icons @fontsource-variable/figtree
npm install echarts   # solo si usarás @zonacards/ui/charts
```

Si el proyecto no tiene Tailwind v4: `npm install -D @tailwindcss/postcss postcss` y crea `.postcssrc.json` con `{ "plugins": { "@tailwindcss/postcss": {} } }`.

## 2. Estilos (`src/styles.css`)

```css
@import "@fontsource-variable/figtree";
@import "tailwindcss";
@import "@zonacards/ui/styles/zonacards.css";
```

Si usas `zc-geo-map` (mapa de calles): `npm install leaflet` y agrega `@import "@zonacards/ui/styles/geo-map.css";` después de `zonacards.css`.

No importes presets de spartan/shadcn: sus tokens (`muted`, `accent`) chocan con los del sistema.

## 3. Assets (`angular.json` → `projects.<app>.architect.build.options.assets`)

```json
{ "glob": "*.json", "input": "node_modules/@zonacards/ui/i18n", "output": "i18n/zc-ui" },
{ "glob": "**/*", "input": "node_modules/@zonacards/ui/assets" },
{ "glob": "*.svg", "input": "node_modules/flag-icons/flags/4x3", "output": "flags" }
```

Y los textos propios del proyecto en `public/i18n/es.json` y `public/i18n/en.json`.

## 4. `app.config.ts`

```ts
import { ApplicationConfig, isDevMode, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { ZcTranslocoLoader } from '@zonacards/ui/core';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    provideRouter(routes, withComponentInputBinding()),
    provideTransloco({
      config: { availableLangs: ['es', 'en'], defaultLang: 'es', reRenderOnLangChange: true, prodMode: !isDevMode() },
      loader: ZcTranslocoLoader,
    }),
  ],
};
```

`ZcTranslocoLoader` combina los textos del paquete (`i18n/zc-ui`) con los del proyecto (`i18n`); las claves del proyecto ganan. Otras rutas: provee `ZC_I18N_PATHS`.

## 5. Layout raíz

```html
<!-- app.html -->
<router-outlet />
<zc-toaster />
```

Importa `ToasterComponent` de `@zonacards/ui/toast`; en las pantallas usa `inject(ToastService)`. Para navegación, `zc-sidebar` en un layout con `<router-outlet>`.

## 6. Tema y marca

```html
<html lang="es" class="" data-brand="">   <!-- class="dark" para oscuro; data-brand="giftealo|enjoy|motiva" -->
```

Fuentes por marca: Zonacards Figtree, Giftealo Lato, Enjoy Outfit, Motiva Geist (instala la fuente correspondiente).

## 7. Comprobar

- `ng build` sin errores; el bundle inicial no debe crecer por importar el barril (`'@zonacards/ui'`).
- Un `<button zcButton>` debe verse con el color primario y 48 px de alto.
- Cambia `class="dark"` en `<html>`: los componentes deben cambiar de tema sin tocar código.
