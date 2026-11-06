# Cambios de @zonacards/ui

Versionado semántico: la mayor cambia la API (hay que tocar la app), la menor agrega sin romper y el parche corrige.
Cada entrada dice qué ajuste de la app se puede borrar al actualizar.

## 1.6.0

**Componentes nuevos**
- `zc-tree` (`@zonacards/ui/tree`): jerarquías con el patrón ARIA tree, teclado completo, selección simple o con casillas (padres en estado mixto).
- `zc-split` (`@zonacards/ui/split`): dos paneles con separador accesible (arrastre y flechas), tamaño recordado y apilado en pantallas angostas.
- `[zcContextMenu]` (en `@zonacards/ui/menu`): menú contextual con clic derecho, tecla Menú, Mayús+F10 o presión larga; usa `zc-menu` con `trigger="none"` y `openAt()`. `Panel` acepta `point` para abrirse en un punto.
- `zc-code-block` (`@zonacards/ui/code-block`): código y JSON de solo lectura con resaltado (tokens `--code-*`, claro y oscuro), números de línea, salto de línea, alto máximo y copiar.
- `zc-copy-button` (`@zonacards/ui/copy-button`): copiar al portapapeles con confirmación anunciada.

**Tabla**
- `zc-data-table [virtual]`: solo dibuja las filas visibles (miles de filas), con `aria-rowcount` y `aria-rowindex`.
- `zc-data-table [resizable]` y `[(widths)]`: asa en cada encabezado para cambiar el ancho (arrastre, flechas ±16 px, Enter o doble clic restablece).

**Catálogo**: sección "Herramientas de trabajo" en Organismos con los seis.

## 1.5.0

**Base del sistema**
- Escala tipográfica como tokens: `text-2xs`, `text-tiny`, `text-caption`, `text-body-sm`, `text-body`, `text-title-sm`, `text-title`, `text-heading`, `text-display-sm`, `text-display`, `text-display-lg` (tamaño e interlineado, `--fs-*` y `--lh-*`). Los componentes ya no usan tamaños fijos (179 reemplazos). 12,5 y 13,5 px pasan a 13 px y 11,5 a 11 px.
- Capas como tokens (`--z-raised`, `--z-sticky`, `--z-floating`, `--z-drawer`, `--z-tour`, `--z-toast`…) y elevación mínima (`shadow-xs`, `shadow-hairline`, `--scrim-strong`).
- SSR: los componentes se pueden renderizar en el servidor (probado con prerender en Angular 22). `zc-icon` dibuja el SVG completo como HTML; chart, map, signature, rich-text, money, auth y sidebar ya no tocan el DOM al crearse; `zc-chart` y `zc-progress` ya no enlazan variables CSS con `[style.--x]`.
- Skill: `references/api.md` con la API de cada componente (inputs con tipo y valor por defecto, models, outputs, métodos) y un ejemplo real del catálogo (`npm run docs:api`).

**Correcciones**
- Botones sobre color primario (barra de acciones masivas): contexto `zc-on-primary` que los invierte (primary blanco con texto de marca; outline, secondary, ghost y link con texto claro). Los botones exponen `data-variant`. *App: si armó una barra propia con colores corregidos, basta con la clase `zc-on-primary`.*
- `cn()` y `hlm()` conocen la escala tipográfica y las sombras propias (antes `text-body` borraba el color de texto de algunos botones).
- `zc-page-header`: las acciones que la página pone dentro de un `@if` con varios elementos vuelven a mostrarse (regresión de 1.3.0).
- Notificaciones, ayuda (`zc-info-popover`) y país en el celular: sin título repetido dentro del sheet, sin desplazamiento horizontal ni una lista con barra propia dentro del sheet.
- `zcScrollArea`: el degradado de borde solo aparece donde se puede desplazar en horizontal.

## 1.4.0

- Tokens de movimiento (`--dur-fast`, `--dur-base`, `--dur-slow`, `--dur-exit`, curvas `ease-standard`, `ease-enter`, `ease-exit`); con "reducir movimiento" valen 1 ms.
- Salidas animadas en todos los overlays; menús y popovers crecen desde su ancla; drawer desde el borde.
- `zc-tabs` y `zc-segmented`: indicador que se desliza. Botones que se hunden al presionar.
- Los elementos animados entran como un solo bloque (antes el sheet "se armaba": fondo, esquinas y relleno se animaban por separado).

## 1.3.0

- Compatible con Angular 21 y 22.
- `zc-chart` decide su barra por el ancho del bloque; `zc-pipeline` y `zc-description-list` también. *App: borrar los ajustes de la barra del gráfico, de `zc-pipeline` y de `zc-description-list`.*
- `zc-dashboard-grid`: acción junto al título (`zcWidgetAction`) y filas llenas. *App: borrar los anchos flexibles y el enlace posicionado.*
- `zc-detail-page` sin columna lateral vacía; `zc-page-header` con `[zcHeaderLead]` y `[zcHeaderMeta]`. *App: borrar el ajuste de `zc-detail-page`.*
- Bottom sheet desde el borde con salida; popovers desde su ancla; `zc-tour` siempre dentro de la ventana. *App: borrar los ajustes de `zc-overlay`/`zc-panel` y `tour-ajuste.ts`.*
- Barra de acciones masivas con los colores de cada botón; avisos arriba en móvil; pie de formulario alineado; `zc-sidebar tablet="drawer"`; `[zcAuthLogo]`. *App: borrar los ajustes de avisos, pie de formulario, menú en tablet y la "Z".*
- "Cargar más" centrado; conteo solo en el botón del panel de filtros.

## 1.2.0

- Montos sin ambigüedad: `display: 'auto' | 'symbol' | 'code'` en `formatMoney` y compañía ("CLP 12.345"). *App: borrar `shared/moneda.ts`.*
- Foco de vuelta al disparador del menú al cerrar un overlay. *App: borrar `foco-tras-menu.ts`.*
- `zc-menu` a la medida del contenido y con alto máximo; tooltip que no queda pegado tras el clic.
- `zc-number-field` con decimales y sufijo; tokens de ancho de tarjeta (`--card-w*`). *App: borrar `--ancho-tarjeta*`.*
- Tabla con `width`, `minWidth` y `grow` por columna; acciones masivas en tarjetas (`zc-data-view`); `zc-chart [frame]="false"` y `[height]`; dashboard con menú de diseño solo en edición.
- `zc-giftcard-pass`: giftcard en Google y Apple Wallet.

## 1.1.0

- Nuevos: `zc-geo-map` (Leaflet, pin arrastrable), `zc-mfa-setup` (2FA), `zc-captcha`.
- `zc-auth`: recuperación, segundo factor, código de recuperación, CAPTCHA, h1.
- `zc-rule-builder` con ≥, ≤ y decimales; `zc-recipients-editor` con WhatsApp; `zc-alert-dialog confirmVariant`; `zc-country-switcher [allowed]`.
- Máquinas de estado de lote, envío, traslado y liquidación observada en `core`.
- Barras de desplazamiento visibles cuando una lista desborda.

## 1.0.1

- Skill para asistentes de código incluida en el paquete.

## 1.0.0

- Primera versión pública: 97 puntos de entrada, estilos, textos (es/en) y assets.
