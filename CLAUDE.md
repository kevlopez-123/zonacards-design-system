# Zonacards 2.0 · Administrador (Angular 21)

Responsable del design system: Kevin López (Regional Product Design Lead).

## Antes de cada tarea
- Lee `docs/reglas-implementacion.md` (prevalece ante conflicto) y la sección de `docs/spec-ux-ui.md` que corresponda.
- Para el aspecto y el comportamiento de un componente, abre `docs/design-system/index.html` en la sección del mismo nombre. Es referencia: no copies su código.
- Trabaja una pantalla o un grupo de componentes por tarea. Propón un plan corto antes de escribir código en tareas grandes.

## Reglas permanentes
- Angular 21 (no actualizar de versión sin aprobación): componentes standalone, signals, `@if`/`@for`, `ChangeDetectionStrategy.OnPush`, zoneless. `inject()` en lugar de constructores con parámetros.
- Estilos solo con utilidades de Tailwind v4 y tokens de `src/styles/tokens.css` (ej. `bg-surface`, `text-muted`, `h-target`). Nunca colores, tamaños ni radios fijos. Si falta un token, agrégalo a tokens.css y a `@theme` en styles.css.
- Atomic Design en `src/app/shared/ui/{atoms,molecules,organisms}`: átomos sin dependencias de otros zc-*, organismos sin llamadas HTTP, páginas en `src/app/features/<dominio>`. Un dominio no importa de otro.
- Componentes nuevos: primero en `/catalogo` con todas sus variantes y estados; recién después se usan en pantallas.
- Primitivas complejas (select, combobox, dialog, popover, menu, tooltip) sobre `@spartan-ng/brain` o Angular CDK, con estilos propios. Nada de `<select>` nativo.
- spartan/ui helm vive en `src/app/shared/ui/helm` (`@spartan-ng/helm/*`, código nuestro). No se importa su preset ni sus tokens shadcn (`muted` y `accent` chocan con los nuestros). Antes de envolver un `hlm-*`, pasa sus clases a nuestros tokens. Íconos con `zc-icon`, nunca `@ng-icons`. Las pantallas usan los átomos `zc-*`, no `hlm-*` directo.
- A `hlm-checkbox` y `hlm-switch` pásales siempre un `inputId` único: sin él, spartan crea etiquetas con id `null-label` y todos los controles toman el nombre del primero.
- Todo `grid` de layout lleva `grid-cols-[minmax(0,1fr)]` (o columnas con `minmax(0,…)`): una columna implícita `auto` toma el ancho del texto más largo aunque esté truncado y provoca desplazamiento horizontal.
- Tooltip en un botón deshabilitado: el `zcTooltip` va en un contenedor con `tabindex="0"` y `[&>button]:pointer-events-none` (el botón deshabilitado no recibe mouse ni foco).
- Íconos: `<zc-icon name="s:…">` (Solar Linear; `-bold` para activos; `l:` Lucide solo si Solar no lo tiene). Agrega el nombre a `icons.json`; `npm run icons` regenera el registro. Banderas: `<zc-flag>`. Nunca emojis.
- Targets de 48 px con mouse y 56 px en táctil (`h-target`). Un solo ícono por campo, a la derecha, que abre sus opciones.
- Textos visibles en `public/i18n/es.json` y `en.json`. Montos con `formatMoney`/`<zc-money>`, fechas con `formatDate` (`src/app/shared/domain`). Nunca formatear a mano.
- Estados y acciones salen de las máquinas de `shared/domain/states.ts`. Estado siempre con ícono + texto.
- Toda vista tiene: cargando (skeleton), vacío, sin resultados, error (con referencia y reintento). Recursos HTTP con `httpResource`; consultar `hasValue()` antes de `value()`.
- Móvil: listados solo en tarjetas, filtros en un bottom sheet, nunca un sheet sobre otro (subpantalla con Volver), paginador solo si hay más de una página, textos con salto de línea antes que truncados.
- Accesibilidad: foco visible, todo operable con teclado, botones de solo ícono con `aria-label`, errores enlazados con `aria-describedby`.
- Datos simulados con MSW en `src/app/mocks` (activo con `environment.useMocks`). Escenarios con `?scenario=vacio|error|lento`.
- Un listener de template nunca devuelve `false` (`(keydown)="a() && b()"` o un método que retorna boolean): Angular hace `preventDefault()` y, por ejemplo, Escape deja de cerrar el panel. Usa un método `void`.
- Controles propios dentro de `zc-field`: inyecta `FieldComponent` y usa `controlId`, `labelId` y `messageId`; avisos al rechazar caracteres con `field.flash()` y `rejectsInput()`. Un disparador tipo select lleva `role="combobox"` (`aria-required` y `aria-invalid` no se permiten en `<button>`).
- Listas, calendarios y paneles flotantes con `Panel` (`shared/ui/molecules/panel`): popover en desktop, bottom sheet en móvil y subpantalla con Volver dentro de un contenedor que provee `SUBSCREEN_HOST` (todo sheet, drawer o modal nuevo debe proveerlo).
- Traducciones dentro de `computed()` con `injectTranslate()` (`shared/ui/lang.ts`), no con `TranslocoService.translate()` directo: si no, queda la clave o el idioma anterior.
- Feedback de acciones con `ToastService` (`shared/ui/molecules/toast`; el `<zc-toaster>` ya vive en el shell): nunca otro contenedor de toasts. Errores de página o de formulario con `<zc-alert>`.
- Áreas con desplazamiento horizontal (pestañas, tablas, carruseles) llevan la directiva `zcScrollArea` (`shared/ui/scroll-area.ts`): degradado en el borde y barra visible solo al desplazar.
- Menús de acciones y de orden con `<zc-menu>` (kebab Bold, popover en desktop, bottom sheet en móvil); no armes menús con `hlm-dropdown-menu`.
- Overlays con `<zc-modal>`, `<zc-drawer>` y `<zc-alert-dialog>` (`shared/ui/organisms/overlay`; en móvil son bottom sheet y proveen `SUBSCREEN_HOST`). Acciones del pie en un contenedor `<div zcOverlayFooter>`. Una plantilla que se dibuja dentro de un overlay (`ngTemplateOutlet`) pasa `injector: overlay.childInjector`; si no, sus selectores abren un sheet sobre otro.
- Un input de componente con el mismo nombre que un atributo HTML (`title`, `role`) también queda como atributo en el host si se escribe estático: anúlalo con `'[attr.title]': 'null'` en el host o usa otro nombre (`dialogRole`).
- Tabla con `<zc-data-table>` (TanStack `createTable` del núcleo, estado controlado por signals; no uses `createAngularTable`: entra en un bucle de notificaciones). Listados con `<zc-data-view>` (tabla solo desde 1024 px) y `<zc-filter-bar>`; navegación con `<zc-sidebar>`; encabezados con `<zc-page-header>`; gráficos con `<zc-chart>` dentro de `@defer (on viewport)`; exportar con `shared/domain/export` (CSV y XLSX sin librerías).
- Listados (plantilla de Lotes, `features/lotes`): filtros, orden, página y vista viven en la URL (parse/serialize puros como `lotes-query.ts`, valores inválidos se ignoran); paginación, orden y conteos de KPI en servidor (mock con una función pura tipo `queryLotes`); móvil acumula páginas con "Cargar más". Acciones compartidas entre listado y ficha en un servicio provisto por página (`LotesActions`). Acciones de alto riesgo: motivo + resumen + "pendiente de aprobación" mostrando quién solicitó y quién aprueba.
- Maker-checker: toda operación de alto riesgo crea una solicitud en la bandeja (`features/aprobaciones`, mocks en `mocks/fixtures/aprobaciones.ts`) con su "antes y después"; el servidor calcula `allowed` y nunca deja aprobar lo propio. Usuarios de prueba por rol en `mocks/users.ts` (el avatar los cambia sin recargar; el usuario viaja a MSW en `X-Demo-User`). En e2e, para otro usuario: `addInitScript` con `sessionStorage['zc-demo-user']`; para no perder los datos simulados en memoria, navega dentro de la app (sin `page.goto`).
- Con `<zc-tabs>`, importa también `TabPanelDirective`: sin ella los paneles no tienen `role`/`id` y el `aria-controls` de la pestaña queda roto (falla axe).
- No guardes textos traducidos en datos al momento de un evento (`t()` en un handler): si las traducciones aún no cargaron queda la clave. Guarda la causa (`rejected: 'type'`) y traduce al dibujar.
- En pruebas e2e, nombres con `exact: true` o acotados a su sección (`getByRole('region', { name })`): el catálogo repite etiquetas ("Volver", "Limpiar", "Acciones del lote #02829").
- Fechas de calendario como texto ISO `aaaa-mm-dd` con los helpers de `shared/domain/dates` (hoy según la zona horaria del país). Validación con `zcValidators` (`shared/forms`) y mensaje con `fieldError()`.

## Definición de terminado
1. `npm run build` y `npm test` sin errores.
2. `npm run e2e` (accesibilidad sin violaciones serias y sin desplazamiento horizontal en 360, 390, 768, 1024, 1280 y 1440 px).
3. Revisado en tema claro y oscuro, español e inglés, y con al menos dos países (una moneda con decimales y otra sin decimales).
4. Si una corrección aplica a todo el proyecto, agrégala a este archivo.
