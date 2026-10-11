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
- Catálogo (`features/catalogo`): rutas `/catalogo/{fundamentos,atomos,moleculas,organismos,plantillas}#<id>` con los mismos niveles, grupos e ids que `docs/design-system/index.html` (índice en `ds/catalog-index.ts`, estado en `docs/design-system-port.md`). Para comparar, la referencia se sirve con `node scripts/serve-docs.mjs` (http://localhost:4300/#<id>). Cada sección va en `<zc-ds-section dsId title description>`.
- Un componente con un solo `ng-content` por slot: dentro de `@if/@else` Angular proyecta en uno solo de los dos y el otro queda vacío. Cambia la clase del contenedor en lugar de duplicar el `ng-content`.
- Componentes que pueden vivir en paneles angostos (barra de filtros, tarjetas) deciden su distribución por contenedor (`@container` y `@min-[…]:`), no por la ventana (`lg:`): en un drawer o columna desbordan.
- Toda área con desplazamiento (tabla con `overflow-x-auto`, lista con alto fijo) lleva `tabindex="0"`, `role="region"` y `aria-label` (axe: scrollable-region-focusable).
- Tooltips siempre con `zcTooltip` (fondo oscuro del sistema, con mouse y foco), nunca con `title`: ayuda (?) de campos, montos abreviados, nombres truncados, chips largos. Única excepción para átomos: pueden importar `TooltipDirective`. En un botón deshabilitado, el tooltip va en un contenedor con `tabindex="0"`.
- Opción activa de listas y menús: solo `bg-surface-2` (como `.option.active` de index.html); sin bordes ni barras de color. Pie de multiselección: "Limpiar" y "Listo" a la derecha, sin conteo.
- Un control que crece (etiquetas, textarea) no usa `CONTROL_BOX` con `h-target`: cambia a `h-auto min-h-target`, o el contenido se sale sobre el mensaje.
- Gráficos (`zc-chart`): barra con Vista y luego los filtros en una fila que baja entera si no cabe; periodo, métrica y escala como `zc-segmented size="sm"`, país como select chico y "Comparar" como switch chico; leyenda HTML sobre el gráfico.
- La auditoría e2e falla si un elemento se sale de su contenedor (no solo de la ventana) y `e2e/panels.spec.ts` abre los selectores y revisa sus paneles. Tailwind no escanea `e2e/` (`@source not` en styles.css).
- Atajos globales (Ctrl + K de la búsqueda) ignoran el evento si ya tiene `defaultPrevented`: un componente con su propio atajo (Ctrl + K del editor = enlace) llama `preventDefault()` y gana.
- Idioma y país de operación viven en `LocaleService` (`core/l10n`), se recuerdan en el navegador y las traducciones se precargan antes del primer render (`provideAppInitializer` en app.config). La barra superior en móvil usa botones de 44 px y deja Aprobaciones en el menú: todo cabe desde 360 px.
- Una variable de plantilla (`#chip`, `#box`) nunca se llama igual que una propiedad del componente: dentro del template la tapa (`[class]="chip"` toma el elemento y no el string).
- Colores de terceros que no cambian con el tema (WhatsApp, botones de acceso de Google/Apple/Microsoft) van como tokens propios en tokens.css (`--brand-whatsapp`, `--sso-*`) y se usan con `bg-(--token)`; nunca hexadecimales en el componente. Logos de acceso desde `sso-registry.generated.ts` (`node scripts/build-logos.mjs`).
- Muestras que enseñan a propósito un contraste bajo (selector de color, paleta) dibujan su texto con un pseudoelemento (`::before { content: 'Aa' }`): axe revisa el texto aunque tenga `aria-hidden`.
- Textos de las moléculas en el espacio `mol.*` de i18n (un bloque por componente). Las demos del catálogo pueden usar textos fijos en español.
- `ng build` puede quedarse colgado al terminar con Node 25 en Windows: si la salida ya dice "Application bundle generation complete", cierra el proceso.
- Tarjetas de listado con `<zc-card>` (`shared/ui/organisms/card`, slots `zcCardMedia`, `zcCardLead`, `zcCardAside`, `zcCardFooter`; con `[link]` toda la tarjeta abre el detalle). No armes `<article>` a mano. KPI con tendencia: `<zc-kpi [trend]>`. Stock: `<zc-bullet>`. Elegir con tarjetas: `zc-radio-group variant="card"` con `[icon]`.
- Pantallas nuevas sobre las plantillas de `shared/ui/templates` (`zc-list-page`, `zc-detail-page`, `zc-form-page`, `zc-dashboard-page`) y sus slots `zcPage*`. Menú secundario de configuración con `<zc-subnav>`; aviso de inactividad con `<zc-session-timeout>`.
- No edites archivos con `Get-Content`/`Set-Content` de PowerShell 5.1: leen en ANSI y rompen tildes y signos (`−` queda como `â^'`). Usa la herramienta de edición o un script de node. Los JSON de i18n se editan sin reformatear (no `JSON.stringify` del archivo completo).
- Reordenar siempre con `zcSortable` / `zcSortableItem` / `zcSortableHandle` (`shared/ui/molecules/sortable`): puntero, teclado (Espacio, flechas, Escape) y anuncio de cada paso. Ofrece además Subir/Bajar en un `zc-menu` con `s.move()`. En e2e, espera el foco en el asa entre teclas (Angular mueve el nodo).
- Imágenes de reemplazo por categoría con `<zc-art>`; productos con `<zc-product-card>`; errores de página con `<zc-error-page>`; vacíos y errores de bloque con `<zc-state>`; sin conexión con `<zc-offline-banner>`.
- Tablas cortas de detalle: `<zc-data-table [toolbar]="false" density="compact">`. `zcScrollArea` pone `tabindex="0"` solo cuando el contenido desborda.
- Dentro de un botón no van componentes con tooltip enfocable (`zc-money` abreviado): usa el texto de `formatMoney`.
- Archivos JSON para scripts de i18n: escríbelos con la herramienta de archivos (UTF-8). `Set-Content -Encoding ascii` cambia las tildes por `?`.
- Un contenedor con `overflow-x-auto` lleva también `relative`: un `sr-only` (absoluto) dentro de una tabla ancha se posiciona contra un ancestro de afuera y ensancha la página.
- Montos fijos en demos con el formato de `formatMoney` del país (Perú: `S/ 1,000.00`). En e2e, el espacio de Intl después del símbolo es irrompible: usa `\s` en las expresiones.
- Radios y checkboxes de spartan son `input` ocultos de 1 px: en e2e haz clic en su texto (`getByText`) y verifica con `toBeChecked()`.
- Comercio y checkout: `zc-checkout-steps` (cuerpos con `ng-template zcCheckoutStep`), `zc-cart` (cupón con `zcCartCoupon`), `zc-recipients-editor`, `zc-rule-builder`, `zc-cta-card`, `zc-help-card`, `zc-announcement`, `zc-onboarding`. Medios de pago con `zc-logo` o `zc-pay-badge` (colores en tokens `--pay-*`).
- Fechas de calendario como texto ISO `aaaa-mm-dd` con los helpers de `shared/domain/dates` (hoy según la zona horaria del país). Validación con `zcValidators` (`shared/forms`) y mensaje con `fieldError()`.

## Definición de terminado
1. `npm run build` y `npm test` sin errores.
2. `npm run e2e` (accesibilidad sin violaciones serias y sin desplazamiento horizontal en 360, 390, 768, 1024, 1280 y 1440 px).
3. Revisado en tema claro y oscuro, español e inglés, y con al menos dos países (una moneda con decimales y otra sin decimales).
4. Si una corrección aplica a todo el proyecto, agrégala a este archivo.
