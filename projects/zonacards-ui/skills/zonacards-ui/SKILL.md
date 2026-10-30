---
name: zonacards-ui
description: Construye interfaces Angular 21 con el sistema de diseño Zonacards (@zonacards/ui). Úsala al crear o modificar pantallas, formularios, listados, tablas, dashboards, overlays o flujos móviles en un proyecto Angular que usa o va a usar @zonacards/ui, al instalar o configurar el paquete, o cuando el usuario mencione Zonacards, Giftealo, Enjoy o Motiva, "zc-*" o el sistema de diseño.
---

# Zonacards UI para Angular

`@zonacards/ui` es un sistema de diseño para Angular 21 (standalone, signals, zoneless, OnPush) con Tailwind v4, Transloco y primitivas de spartan/CDK. Cada componente es un punto de entrada propio, como Angular Material.

Tu trabajo con esta skill: **componer pantallas con componentes `zc-*` existentes y tokens del sistema**, no inventar UI. Si dudas entre crear algo y usar un componente, busca primero en [references/components.md](references/components.md).

## Flujo de trabajo

1. **¿Está instalado?** Revisa `package.json`. Si falta, sigue [references/setup.md](references/setup.md) (instalación, estilos, assets, traducciones).
2. **Elige la plantilla de página** (sección "Pantallas"). Casi toda pantalla nueva es un listado, una ficha, un formulario o un dashboard.
3. **Elige componentes** con la tabla de decisión de abajo y el catálogo de [references/components.md](references/components.md).
4. **Cubre todos los estados**: cargando, vacío, sin resultados, error, y la vista móvil.
5. **Textos en i18n** del proyecto, montos y fechas con los helpers de `@zonacards/ui/core`.
6. **Verifica** con la lista de [references/checklist.md](references/checklist.md) antes de dar la tarea por terminada.

## Reglas que no se rompen

- **Imports por subruta**: `import { ButtonDirective } from '@zonacards/ui/button'`. Nunca `from '@zonacards/ui'` (el barril mete todo al bundle inicial) ni `@zonacards/ui/helm` (interno).
- **Solo tokens**: utilidades de Tailwind sobre tokens (`bg-surface`, `bg-surface-2`, `text-muted`, `border-border`, `text-primary`, `h-target`, `rounded-md`). Nunca hexadecimales, `px` sueltos de color, radios o alturas fijas, ni colores de Tailwind por defecto (`bg-blue-500`). Colores de marca: redefine `--brand-*` en CSS.
- **Nada nativo cuando hay componente**: no `<select>`, no `title=""` para ayudas, no `confirm()`/`alert()`, no `<dialog>` propio, no toasts propios, no emojis como íconos.
- **Íconos**: `<zc-icon name="s:nombre">` (Solar Linear; sufijo `-bold` para estado activo; `l:` Lucide solo si Solar no lo tiene). Banderas con `<zc-flag>`, logos de pago con `<zc-logo>`/`<zc-pay-badge>`.
- **Textos**: todo texto visible desde Transloco. En `computed()` usa `injectTranslate()` de `@zonacards/ui/core`, no `TranslocoService.translate()`. No guardes textos traducidos en datos dentro de un handler: guarda la causa y traduce al dibujar.
- **Formato**: montos con `formatMoney()` o `<zc-money>` (por defecto `display: 'auto'`: "CLP 12.345" donde el símbolo sería "$"; no lo cambies a `'symbol'` en vistas con varios países), fechas con `formatDate()`, relativas con `formatRelative()`, teléfonos con `formatPhone()`. Nunca a mano ni con `DatePipe`/`CurrencyPipe`. Fechas de calendario como ISO `aaaa-mm-dd` (`todayIso()`, `addDays()`).
- **Angular moderno**: standalone, `ChangeDetectionStrategy.OnPush`, signals, `input()`/`output()`/`model()`, `inject()`, `@if`/`@for`/`@defer`, `httpResource` (consulta `hasValue()` antes de `value()`).
- **Accesibilidad**: todo operable con teclado, foco visible, botones de solo ícono con `aria-label`, targets de 48 px (56 en táctil, ya resuelto con `h-target`), estado siempre con ícono + texto (nunca solo color).

## Qué componente usar

| Necesitas | Usa | No uses |
| --- | --- | --- |
| Botón / acción | `button[zcButton]` variant `primary·secondary·outline·ghost·danger·danger-soft·link`, size `md·sm·icon·icon-sm`, `[loading]` | `<button>` con clases propias |
| Campo de texto | `<zc-field label hint error>` + `input[zcInput]` | inputs sueltos sin etiqueta |
| Campos especiales | `zc-money-field`, `zc-phone-field`, `zc-tax-id-field`, `zc-date-field`, `zc-date-range`, `zc-time-field`, `zc-number-field`, `zc-otp`, `zc-tags-field`, `zc-secret-field`, `commerce`→`zc-password-field` | `type="number"`/`type="date"` nativos, máscaras propias |
| Elegir de una lista | `zc-select` (≤ ~15 opciones, `[searchable]` si hay más), `zc-combobox`/`zc-autocomplete` (búsqueda remota), `zc-radio-group` (2–5 visibles, `variant="card"` para elegir con tarjetas), `zc-segmented` (2–4 vistas o periodos) | `<select>`, menús de spartan |
| Sí/No | `zc-switch` (efecto inmediato), `zc-checkbox` (se confirma al guardar) | |
| Acciones de una fila/objeto | `<zc-menu [items]>` (kebab) | dropdowns armados a mano |
| Confirmar / formulario corto | `<zc-modal>`; destructivo: `<zc-alert-dialog>` (con `confirmWord` si es irreversible) | `confirm()` |
| Detalle lateral, filtros | `<zc-drawer>` (bottom sheet en móvil) con `<div zcOverlayFooter>` | sheet sobre sheet |
| Ayuda contextual | `[zcTooltip]` (breve), `<zc-info-popover>` (con contenido) | `title` |
| Aviso tras una acción | `ToastService` (`@zonacards/ui/toast`) | otro toaster |
| Error de página/formulario | `<zc-alert tone="danger">` | toasts para errores que bloquean |
| Vacío / error de bloque | `<zc-state kind="empty·error" [reference]>` | texto suelto |
| Error de ruta (404/500) | `<zc-error-page>` | |
| Cargando | `<zc-skeleton>` con la forma del contenido; `<zc-spinner>` solo en botones/acciones | spinner de página completa |
| Listado de registros | `<zc-data-view>` (tarjetas en móvil, tabla ≥1024 px) + `<zc-filter-bar>` | `<table>` HTML |
| Tabla simple de detalle | `<zc-data-table [toolbar]="false" density="compact">` | |
| Tarjeta de registro | `<zc-card [link]>` con slots `zcCardMedia/Lead/Aside/Footer` | `<article>` a mano |
| Métrica | `<zc-kpi [trend] [delta]>`, `zc-sparkline`, `zc-bullet` (stock/meta) | |
| Gráfico / mapa por país | `<zc-chart kind>` / `<zc-map>` dentro de `@defer (on viewport)` | Chart.js, teselas para datos por país |
| Mapa de calles, ubicación de un local | `<zc-geo-map [points] [editable] (picked)>` (`@zonacards/ui/geo-map`, requiere `leaflet` y `styles/geo-map.css`) + campos de latitud/longitud | Leaflet directo en la app |
| Anti-bot en formulario público | `<zc-captcha provider="turnstile" [siteKey] [(token)]>`; validar el token en el servidor y `reset()` tras cada envío | campos "escribe el resultado" caseros |
| Activar 2FA (TOTP) | `<zc-mfa-setup [qrImage] [secret] [verify] [recoveryCodes]>` | QR generado en el navegador |
| Vista previa de giftcard en Wallet | `<zc-giftcard-pass os="google·apple" [pass]>` (`@zonacards/ui/wallet`; lealtad: `zc-wallet-pass`) | maquetas propias del pase |
| Acciones masivas en tarjetas | `<zc-data-view [selectable] [(selection)] [ids]>` + `ng-template zcBulkActions` | una barra propia |
| Tasa o porcentaje | `<zc-number-field [decimals]="2" suffix="%">` | input de texto |
| Gráfico dentro de un widget | `<zc-chart [frame]="false" height="160px">` | doble borde |
| Confirmación irreversible que no destruye | `<zc-alert-dialog confirmVariant="primary">` | botón rojo para aprobar o enviar |
| Estado de un registro | `<zc-badge [tone] [icon]>` con el look de `core` (`GIFTCARD_LOOK`, `APPROVAL_LOOK`) | badges de color sin ícono |
| Navegación | `zc-sidebar`, `zc-breadcrumbs`, `zc-tabs` (+ `TabPanelDirective`), `zc-subnav` (configuración), `zc-pagination` | |
| Flujo en pasos | `zc-stepper` + `zc-form-summary`; compra: `zc-checkout-steps` + `zc-cart` | |
| Reordenar | `zcSortable`/`zcSortableItem`/`zcSortableHandle` + "Subir/Bajar" en `zc-menu` | drag sin teclado |

Tonos (`Tone`): `success · warning · danger · info · accent · neutral`. Usa el tono por significado, no por gusto.

Estados de dominio: máquinas `*_TRANSITIONS` con `canTransition()` y apariencias `*_LOOK` (tono, ícono, texto) en `@zonacards/ui/core` para gift card, liquidación (con `observada` y `SETTLEMENT_OBSERVABLE`), aprobación, lote, envío y traslado. Un botón de acción aparece solo si la transición es válida; no definas estas máquinas en la app.

## Pantallas

Construye cada pantalla sobre una plantilla de `@zonacards/ui/templates` y sus slots:

- `zc-list-page`: `zcPageHeader`, `zcPageKpis`, `zcPageFilters`, contenido (`zc-data-view`), `zcPageFooter`.
- `zc-detail-page`: `zcPageHeader`, `zcPageTabs`, contenido, `zcPageAside` (resumen, acciones).
- `zc-form-page`: `zcPageHeader`, `zcPageSteps`, secciones de campos, `zcPageActions` (Cancelar + Guardar).
- `zc-dashboard-page`: `zcPageHeader`, `zcPageKpis`, gráficos en `@defer`.

Encabezado siempre con `<zc-page-header title subtitle [crumbs]>`. Un `<zc-toaster />` una sola vez en el layout raíz.

Ejemplo mínimo de listado:

```ts
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { TranslocoPipe } from '@jsverse/transloco';
import { ListPageComponent, PageHeaderSlot, PageFiltersSlot } from '@zonacards/ui/templates';
import { PageHeaderComponent } from '@zonacards/ui/page-header';
import { DataViewComponent, DataTableComponent, FilterBarComponent, CardsViewDirective, TableViewDirective, CellDefDirective, FilterMainDirective, FilterMoreDirective, ZcColumn } from '@zonacards/ui/table';
import { StateComponent } from '@zonacards/ui/state';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';

@Component({
  selector: 'app-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoPipe, ListPageComponent, PageHeaderSlot, PageFiltersSlot, PageHeaderComponent,
    DataViewComponent, DataTableComponent, FilterBarComponent, CardsViewDirective, TableViewDirective,
    CellDefDirective, FilterMainDirective, FilterMoreDirective, StateComponent, ButtonDirective, IconComponent,
  ],
  templateUrl: './orders.html',
})
export class Orders {
  readonly query = signal('');
  readonly view = signal<'cards' | 'table'>('cards');
  readonly orders = httpResource<Order[]>(() => `/api/orders?q=${encodeURIComponent(this.query())}`);
  readonly items = computed(() => (this.orders.hasValue() ? this.orders.value() : []));
  readonly columns: ZcColumn<Order>[] = [/* … */];
}
```

```html
<zc-list-page>
  <zc-page-header zcPageHeader [title]="'pedidos.titulo' | transloco">
    <button zcButton><zc-icon name="s:add-circle" [size]="16" />{{ 'pedidos.crear' | transloco }}</button>
  </zc-page-header>
  <zc-filter-bar zcPageFilters [searchLabel]="'pedidos.buscar' | transloco" [(query)]="query">
    <ng-template zcFilterMain><!-- zc-field + zc-select principales --></ng-template>
    <ng-template zcFilterMore><!-- filtros secundarios (van al drawer) --></ng-template>
  </zc-filter-bar>
  @if (orders.error()) {
    <zc-state kind="error" [reference]="ref()" />
  } @else {
    <zc-data-view [(view)]="view">
      <ng-template zcCardsView><!-- @for de <zc-card [link]> --></ng-template>
      <ng-template zcTableView>
        <zc-data-table [caption]="'pedidos.titulo' | transloco" [data]="items()" [columns]="columns" [loading]="orders.isLoading()">
          <ng-template zcCell="status" [zcCellOf]="items()" let-o><zc-badge [tone]="look(o).tone">…</zc-badge></ng-template>
        </zc-data-table>
      </ng-template>
    </zc-data-view>
  }
</zc-list-page>
```

Los slots `zcPage*` son directivas exportadas por `@zonacards/ui/templates` (`PageHeaderSlot`, `PageKpisSlot`, `PageFiltersSlot`, `PageFooterSlot`, `PageTabsSlot`, `PageAsideSlot`, `PageStepsSlot`, `PageActionsSlot`): impórtalas junto con la plantilla. Celdas personalizadas con `CellDefDirective` (`zcCell`), vistas con `CardsViewDirective`/`TableViewDirective`, filtros con `FilterMainDirective`/`FilterMoreDirective` (todas en `@zonacards/ui/table`). Los nombres exactos de clases exportadas pueden variar: confirma en `node_modules/@zonacards/ui/<entrada>/index.d.ts` antes de importar.

## Estados obligatorios de toda vista

| Estado | Cómo |
| --- | --- |
| Cargando | `zc-skeleton` con la forma final (o `[loading]` de `zc-data-view`/`zc-data-table`) |
| Vacío (no hay datos) | `zc-state kind="empty"` con acción principal ("Crear la primera…") |
| Sin resultados (filtros) | `zc-state kind="empty"` con "Limpiar filtros" |
| Error | `zc-state kind="error" [reference]` con "Reintentar" (`resource.reload()`) |
| Éxito de acción | toast `success`; error de acción: toast `danger` o `zc-alert` si bloquea |

## Formularios

- Reactive forms tipados. Validación con `zcValidators` y mensaje con `fieldError()` (`@zonacards/ui/core`); el error se pasa a `<zc-field [error]>`.
- Etiqueta siempre visible. `placeholder` solo como ejemplo de formato (`nombre@empresa.com`, `dd/mm/aaaa`); instrucciones van en `hint`.
- Marca lo opcional (`optional`) en vez de lo obligatorio cuando la mayoría es obligatorio.
- Botón de envío `[loading]` mientras guarda; al terminar, toast y navegar o cerrar.
- Controles propios dentro de `zc-field`: inyecta `FieldComponent` y usa `controlId`, `labelId`, `messageId`.

## Responsive y móvil

- Diseña desde 360 px. Listados en tarjetas en móvil (lo hace `zc-data-view`), filtros en `zc-drawer` con pie "Limpiar" + "Ver resultados".
- Nunca un sheet sobre otro: los selectores dentro de un overlay abren una subpantalla con Volver (ya lo resuelven `Panel` y los overlays).
- Grids de layout con `grid-cols-[minmax(0,1fr)]` o `minmax(0,…)`; KPIs con `grid-cols-[repeat(auto-fit,minmax(128px,1fr))]`; grillas de tarjetas con `grid-cols-[repeat(auto-fill,minmax(var(--card-w),1fr))]` (`--card-w-sm`, `--card-w`, `--card-w-lg`).
- Tablas: `ZcColumn` con `width`, `minWidth` y `grow`; por defecto una sola columna (la primera) se lleva el sobrante y las demás se ajustan al contenido.
- Componentes que viven en paneles angostos deciden por contenedor (`@container`, `@min-[…]:`), no por ventana.
- Áreas con scroll horizontal llevan `zcScrollArea`. Prefiere saltos de línea a truncar.
- App móvil: `zc-mobile-bar`, `zc-bottom-nav`, `zc-pull-refresh`, `zc-swipe-item` (con las mismas acciones en ⋮), `zc-pin-pad`, `zc-scanner`.

## Temas y marcas

- Oscuro: clase `dark` en `<html>`. Marca: `data-brand="giftealo|enjoy|motiva"` en `<html>` (sin atributo = Zonacards).
- Si falta un color o tamaño, crea un token en el CSS del proyecto (`--mi-token`) y úsalo con `bg-(--mi-token)`; nunca un valor fijo en el componente.

## Errores comunes (y la corrección)

- Un listener de plantilla que devuelve `false` hace `preventDefault()` (Escape deja de cerrar): usa métodos `void`.
- `zc-tabs` sin `TabPanelDirective` rompe `aria-controls`.
- Tooltip en botón deshabilitado: envuélvelo en un contenedor `tabindex="0"` con `[&>button]:pointer-events-none`.
- Clases con corchetes (`shadow-[…]`) no van en `[class.x]`: arma el string en un método y usa `[class]`.
- Plantilla dibujada dentro de un overlay con `ngTemplateOutlet`: pasa `injector: overlay.childInjector`.
- Modales sin ícono junto al título; lo destructivo se marca con el botón `danger`.
- Un componente de ancho fijo usa `w-full max-w-[…]`, nunca `w-[…]`.
- Variables de plantilla (`#box`) con nombre distinto a las propiedades del componente.

## Referencias

- [references/components.md](references/components.md): catálogo completo por punto de entrada, con selectores y cuándo usar cada uno.
- [references/setup.md](references/setup.md): instalación y configuración en un proyecto nuevo.
- [references/checklist.md](references/checklist.md): revisión antes de terminar.
- README del paquete: `node_modules/@zonacards/ui/README.md`. Tipos y API exactos: `node_modules/@zonacards/ui/<entrada>/index.d.ts`.
