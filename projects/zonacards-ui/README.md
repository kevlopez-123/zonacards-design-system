# @zonacards/ui

Sistema de diseño Zonacards para **Angular 21 y 22** (standalone, signals, zoneless, OnPush). Incluye componentes (átomos, moléculas, organismos y plantillas de página), tokens de tema claro/oscuro y marcas, estilos para **Tailwind v4**, textos en español e inglés y helpers de dominio (montos, fechas, países, validaciones).

Responsable: Kevin López (Regional Product Design Lead). Catálogo vivo: `/catalogo` en `zonacards-admin`.

## Instalación

```bash
npm install @zonacards/ui @angular/cdk @jsverse/transloco @spartan-ng/brain tailwindcss tw-animate-css flag-icons
# Solo si usas gráficos o mapas (@zonacards/ui/charts):
npm install echarts
# Solo si usas el mapa de calles (@zonacards/ui/geo-map); además importa @zonacards/ui/styles/geo-map.css:
npm install leaflet
# Fuente por defecto (Zonacards). Giftealo usa Lato, Enjoy Outfit, Motiva Geist:
npm install @fontsource-variable/figtree
```

## 1. Estilos (`src/styles.css`)

```css
@import "@fontsource-variable/figtree";
@import "tailwindcss";
@import "@zonacards/ui/styles/zonacards.css";
```

`zonacards.css` trae los tokens (`--surface`, `--primary`, `--target`…), el puente a utilidades (`bg-surface`, `text-muted`, `h-target`, `rounded-md`), las variantes de estado, las animaciones y la base. Ya incluye `@source` para las clases de los componentes del paquete.

- **Tema oscuro:** clase `dark` en `<html>`.
- **Marca:** `data-brand="giftealo" | "enjoy" | "motiva"` en `<html>` (sin atributo = Zonacards).
- **Colores propios:** redefine los tokens `--brand-*` en tu CSS, nunca uses colores fijos en los componentes.

## 2. Assets (`angular.json` → `build.options.assets`)

```json
{ "glob": "*.json", "input": "node_modules/@zonacards/ui/i18n", "output": "i18n/zc-ui" },
{ "glob": "**/*", "input": "node_modules/@zonacards/ui/assets" },
{ "glob": "*.svg", "input": "node_modules/flag-icons/flags/4x3", "output": "flags" }
```

- `i18n/zc-ui/<idioma>.json`: textos de los componentes (`ui.*`, `mol.*`, `org.*`, `top.*`, `auth.*`, `validacion.*`…).
- `geo/latam.json`: límites de países para `zc-map` (Natural Earth, dominio público).
- `geo/ubigeo-pe.json`: ubigeo del Perú (INEI 2025: 25 departamentos, 196 provincias, 1 891 distritos con coordenadas) para `zc-ubigeo-select` (`@zonacards/ui/ubigeo`). Licencia MIT en `geo/LICENSE-ubigeos_peru.txt`: debe acompañar a los datos. Valida contra la publicación vigente del INEI antes de producción.
- `flags/*.svg`: banderas de `zc-flag`.

## 3. Traducciones (`app.config.ts`)

```ts
import { provideTransloco } from '@jsverse/transloco';
import { ZcTranslocoLoader } from '@zonacards/ui/core';

provideTransloco({
  config: { availableLangs: ['es', 'en'], defaultLang: 'es', reRenderOnLangChange: true, prodMode: !isDevMode() },
  loader: ZcTranslocoLoader,
}),
```

El cargador combina `i18n/zc-ui/<idioma>.json` (paquete) con `i18n/<idioma>.json` (tu proyecto). Tus claves ganan, así puedes ajustar cualquier texto. Otras carpetas: provee `ZC_I18N_PATHS`.

## Marcas: forma y estilo

Una marca no solo cambia el color y la fuente: también la forma y el estilo. Los componentes usan nombres semánticos (`rounded-control`, `rounded-card`, `rounded-sheet`, `rounded-button`, `h-field`, `bg-field-bg`, `border-field-bd`) que apuntan a las variables `--shape-*` y `--field-*` de `styles/tokens.css`. Los valores por defecto reproducen el aspecto de siempre; una marca los sobrescribe en su bloque:

```css
:root[data-brand="miMarca"] { --shape-control: 24px; --shape-card: 28px; --shape-sheet: 28px; --shape-field-h: 56px; }
:root[data-brand="miMarca"]:not(.dark) { --field-bg: var(--neutral-100); --field-bd: var(--neutral-300); }
```

Las mismas variables viajan a Android e iOS (`npm run native`) y se leen con `ZonacardsTheme.shape` (Compose) y `theme.shape` (SwiftUI). `enjoy` ya las usa como ejemplo.

## 4. Uso

```ts
import { ButtonDirective } from '@zonacards/ui/button';
import { FieldComponent, InputDirective } from '@zonacards/ui/field';
import { ToastService } from '@zonacards/ui/toast';
import { formatMoney } from '@zonacards/ui/core';
import { DataTableComponent } from '@zonacards/ui/table';
import { ChartComponent } from '@zonacards/ui/charts';
```

Cada componente es un **punto de entrada** propio, como en Angular Material. Importa siempre desde la subruta. Así el proyecto solo empaqueta lo que usa y en el chunk de la pantalla donde lo usa, y ECharts se carga recién al dibujar el primer gráfico.

`@zonacards/ui` (sin subruta) re-exporta todo y sirve para prototipos. En una app real mete todos los componentes en el bundle inicial.

Punto exacto en el mapa: `<zc-location-picker [(value)] label [center]>` (`@zonacards/ui/location-picker`) sobre `zc-geo-map`, con latitud y longitud escritas y "Usar mi ubicación". Requiere `leaflet`; los estilos van en `styles/geo-map.css` (en este repo, solo en el chunk del catálogo; el presupuesto `anyComponentStyle` subió a 14/20 kB por Leaflet).

Coloca `<zc-toaster />` una vez en el layout principal y usa `ToastService` para los avisos.

Cambios sin guardar: coloca también `<zc-confirm-host />` en el layout; la página del formulario implementa `hasUnsavedChanges()` y su ruta lleva `canDeactivate: [unsavedChangesGuard]` (`@zonacards/ui/unsaved`). Para otras confirmaciones por código: `await inject(ConfirmService).ask({ title, confirmLabel, cancelLabel })`.

| Grupo | Puntos de entrada |
| --- | --- |
| Base | `core` (dominio, formularios, idioma, viewport, i18n), `icon`, `button`, `badge`, `tooltip`… |
| Formularios | `field`, `select`, `date-field`, `date-range`, `money-field`, `phone-field`, `tax-id-field`, `otp`, `rich-text`, `commerce`… |
| Estructura | `sidebar`, `page-header`, `overlay` (modal, drawer, alert dialog), `templates` (listado, ficha, formulario, dashboard)… |
| Datos | `table` (tabla, vista de datos, filtros), `charts` (gráficos y mapa por país), `geo-map` (mapa de calles), `kpi`, `card`, `pipeline`, `facets`… |
| Flujos | `kanban`, `dashboard`, `email-editor`, `image-gallery`, `rule-builder`, `recipients-editor`, `checkout`, `stepper` |
| Móvil | `mobile`, `scanner`, `wallet`, `carousel` |
| Acceso y ayuda | `auth`, `mfa-setup`, `captcha`, `chat`, `tour`, `session-timeout`, `notifications`, `command-palette` |

## Skill para asistentes de código (Claude Code y otros)

El paquete incluye una skill que enseña a un LLM a usar el sistema: componentes, cuándo usar cada uno, reglas y revisión final. Cópiala a tu proyecto:

```bash
mkdir -p .claude/skills && cp -r node_modules/@zonacards/ui/skills/zonacards-ui .claude/skills/
```

## Tokens en JSON (Figma y otras plataformas)

`node_modules/@zonacards/ui/tokens/` trae los tokens en formato W3C Design Tokens: `primitives.json`, `semantic.light.json`, `semantic.dark.json`, `brand.<marca>.<claro|oscuro>.json` y `$themes.json`. En Figma, el plugin Tokens Studio los importa con sus temas (Zonacards, Giftealo, Enjoy y Motiva en claro y oscuro). La fuente sigue siendo `styles/tokens.css`: el JSON se genera desde ahí.

## Reglas que conviene seguir

- Pantallas con los componentes `zc-*`; `@zonacards/ui/helm` es interno.
- Estilos solo con utilidades y tokens; nunca colores, tamaños ni radios fijos.
- Textos visibles en tus `i18n/<idioma>.json`; montos con `formatMoney`/`<zc-money>`, fechas con `formatDate`.
- Overlays con `<zc-modal>`, `<zc-drawer>` y `<zc-alert-dialog>` (bottom sheet en móvil).
- Gráficos dentro de `@defer (on viewport)`.

## Desarrollo de la librería (repo zonacards-admin)

```bash
npm run public-api   # regenera index.ts de cada punto de entrada y src/public-api.ts
npm run build:ui     # compila dist/zonacards-ui y lo enlaza en node_modules (lo usa el build de producción de la app)
npm run icons        # regenera el registro de íconos (agrega nombres en icon/icons.json)
npm run tokens       # genera tokens/*.json (DTCG) desde styles/tokens.css
npm run docs:api     # genera la referencia de API de la skill (references/api.md)
npm run docs         # sitio de documentación en http://localhost:4400 (npm run build:docs para publicarlo)
npm run test:visual  # regresión visual del catálogo (claro y oscuro)
```

Publicación (npm público): sube `version` en `projects/zonacards-ui/package.json` (semver), luego `npm run build:ui && cd dist/zonacards-ui && npm publish`.

## Licencia

MIT
