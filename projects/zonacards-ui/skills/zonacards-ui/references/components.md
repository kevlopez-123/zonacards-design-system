# Catálogo de componentes @zonacards/ui

Generado desde el código del paquete. Importa siempre desde la subruta indicada. Para inputs y outputs exactos, abre `node_modules/@zonacards/ui/<entrada>/index.d.ts`.

`@zonacards/ui/helm` (primitivas de spartan) es interno: no lo uses en pantallas.

### `@zonacards/ui/accordion`

- **Para:** Secciones plegables (FAQ, detalle secundario)
- **No para:** Navegar entre vistas: usa zc-tabs
- **Selectores:** `zc-accordion-item`, `zc-accordion`
- **Exporta:** `AccordionItemComponent`, `AccordionComponent`

### `@zonacards/ui/alert`

- **Para:** Mensaje persistente en la página o formulario (error, aviso, info)
- **No para:** Confirmación de una acción puntual: usa toast
- **Selectores:** `zc-alert`, `[zcAlertAction]`
- **Exporta:** `AlertComponent`, `AlertActionDirective`

### `@zonacards/ui/announcement`

- **Para:** Novedades del producto (zc-announcement) y primeros pasos (zc-onboarding)
- **No para:** Errores
- **Selectores:** `zc-announcement`, `zc-onboarding`
- **Exporta:** `AnnouncementComponent`, `OnboardingComponent`

### `@zonacards/ui/art`

- **Para:** Ilustración de reemplazo por categoría cuando falta imagen
- **No para:** Íconos de UI
- **Selectores:** `zc-art`
- **Exporta:** `ArtComponent`

### `@zonacards/ui/auth`

- **Para:** Pantallas de acceso: login, recuperación, MFA
- **No para:** Formularios generales
- **Selectores:** `zc-auth`
- **Exporta:** `AuthComponent`

### `@zonacards/ui/autocomplete`

- **Para:** Texto libre con sugerencias (búsqueda remota)
- **No para:** Lista cerrada: usa zc-select/zc-combobox
- **Selectores:** `zc-autocomplete`
- **Exporta:** `RecentSearches`, `AutocompleteComponent`

### `@zonacards/ui/avatar`

- **Para:** Persona o empresa; zc-avatar-group para varios
- **Selectores:** `zc-avatar-group`, `zc-avatar`
- **Exporta:** `AvatarGroupComponent`, `AvatarComponent`

### `@zonacards/ui/badge`

- **Para:** Estado o etiqueta corta con tono e ícono
- **No para:** Acciones (no es clickeable): usa zc-chip o botón
- **Selectores:** `zc-badge`
- **Exporta:** `BadgeComponent`

### `@zonacards/ui/brand-logo`

- **Para:** Logo de la marca activa (Zonacards, Giftealo, Enjoy, Motiva)
- **No para:** Logos de terceros: zc-logo
- **Selectores:** `zc-brand-logo`
- **Exporta:** `BrandLogoComponent`

### `@zonacards/ui/breadcrumbs`

- **Para:** Ruta jerárquica (normalmente vía [crumbs] de zc-page-header)
- **Selectores:** `zc-breadcrumbs`
- **Exporta:** `BreadcrumbsComponent`

### `@zonacards/ui/bulk-import`

- **Para:** Importación masiva desde Excel o CSV: plantilla descargable con ejemplo e instrucciones, validación fila por fila en el navegador, tabla de errores con descarga y entrega de las filas válidas ya convertidas. El núcleo puro está en `core`: `readXlsx`, `parseCsv`, `processMatrix`, `bulkTemplate`, `toXlsxSheets`
- **No para:** Subir un archivo sin validar (zc-file-upload) o importar sin revisión del servidor
- **Selectores:** `zc-bulk-import`
- **Exporta:** `BulkImportComponent`

### `@zonacards/ui/bullet`

- **Para:** Avance contra meta o stock
- **No para:** Series en el tiempo: zc-sparkline
- **Selectores:** `zc-bullet`
- **Exporta:** `BulletComponent`

### `@zonacards/ui/button`

- **Para:** Toda acción. Variantes primary, secondary, outline, ghost, danger, danger-soft, link; tamaños md, sm, icon, icon-sm
- **No para:** Navegar a otra página dentro de texto: a[zcLink]
- **Selectores:** `button[zcButton], a[zcButton]`
- **Exporta:** `ButtonDirective`

### `@zonacards/ui/calendar`

- **Para:** Calendario inline (agenda, disponibilidad)
- **No para:** Campo de fecha: zc-date-field
- **Selectores:** `zc-calendar`
- **Exporta:** `CalendarComponent`

### `@zonacards/ui/captcha`

- **Para:** Verificación anti-bot en formularios públicos (Turnstile, hCaptcha o reCAPTCHA); el token se valida en el servidor
- **No para:** Formularios con sesión iniciada
- **Selectores:** `zc-captcha`
- **Exporta:** `CaptchaComponent`

### `@zonacards/ui/card`

- **Para:** Tarjeta de registro en listados; [link] hace clickeable toda la tarjeta
- **No para:** Contenedores genéricos de layout
- **Selectores:** `[zcCardMedia]`, `[zcCardLead]`, `[zcCardAside]`, `[zcCardFooter]`, `zc-card`
- **Exporta:** `CardMediaDirective`, `CardLeadDirective`, `CardAsideDirective`, `CardFooterDirective`, `CardComponent`

### `@zonacards/ui/carousel`

- **Para:** Carrusel de imágenes o tarjetas
- **No para:** Contenido crítico (queda oculto)
- **Selectores:** `ng-template[zcSlide]`, `zc-carousel`
- **Exporta:** `SlideDirective`, `CarouselComponent`

### `@zonacards/ui/charts`

- **Para:** zc-chart (line, bar, area, pie, funnel, waterfall, heatmap, treemap, calendar, sankey, gauge) y zc-map (LatAm). Siempre en @defer (on viewport)
- **No para:** Números sueltos: zc-kpi
- **Selectores:** `zc-chart`, `zc-map`
- **Exporta:** `ChartComponent`, `MapComponent`

### `@zonacards/ui/chat`

- **Para:** Conversación / soporte
- **Selectores:** `zc-chat`
- **Exporta:** `ChatComponent`

### `@zonacards/ui/checkbox`

- **Para:** Selección múltiple o aceptación que se confirma al guardar
- **No para:** Efecto inmediato: zc-switch
- **Selectores:** `zc-checkbox`
- **Exporta:** `CheckboxComponent`

### `@zonacards/ui/checkout`

- **Para:** Flujo de compra: zc-checkout-steps (ng-template zcCheckoutStep) y zc-cart
- **Selectores:** `zc-cart`, `ng-template[zcCheckoutStep]`, `zc-checkout-steps`
- **Exporta:** `CartComponent`, `CheckoutStepDirective`, `CheckoutStepsComponent`

### `@zonacards/ui/chip`

- **Para:** Filtros activos, selección removible
- **No para:** Estados: zc-badge
- **Selectores:** `zc-chip`
- **Exporta:** `ChipComponent`

### `@zonacards/ui/code-block`

- **Para:** Código y JSON de solo lectura con resaltado, números de línea y copiar
- **No para:** Edición de código
- **Selectores:** `zc-code-block`
- **Exporta:** `CodeBlockComponent`

### `@zonacards/ui/color`

- **Para:** Elegir color (zc-color-field, zc-color-picker) con contraste
- **Selectores:** `zc-color-field`, `zc-color-picker`
- **Exporta:** `ColorFieldComponent`, `ColorPickerComponent`

### `@zonacards/ui/command-palette`

- **Para:** Búsqueda global Ctrl + K
- **Selectores:** `zc-command-palette`
- **Exporta:** `CommandPaletteComponent`

### `@zonacards/ui/commerce`

- **Para:** zc-product-card, zc-cta-card, zc-help-card, zc-amount-picker, zc-coupon-field, zc-password-field, zc-password-rules
- **Selectores:** `zc-cta-card`, `zc-help-card`, `zc-amount-picker`, `zc-coupon-field`, `zc-password-field`, `zc-password-rules`, `zc-product-card`
- **Exporta:** `CtaCardComponent`, `HelpCardComponent`, `AmountPickerComponent`, `CouponFieldComponent`, `PasswordFieldComponent`, `PasswordRulesComponent`, `ProductCardComponent`

### `@zonacards/ui/copy-button`

- **Para:** Copiar un ID, código o URL con confirmación
- **No para:** Claves secretas: zc-secret-field
- **Selectores:** `zc-copy-button`
- **Exporta:** `CopyButtonComponent`

### `@zonacards/ui/core`

- **Para:** Helpers sin UI: formatMoney, formatDate, formatRelative, formatPhone, zcValidators, fieldError, injectTranslate, injectMedia, COUNTRIES, toCsv/toXlsx/toPdf, máquinas de estado (canTransition, *_LOOK), validadores de RUC/NIT/RUT/RFC, zcScrollArea, ZcTranslocoLoader
- **Selectores:** `[zcScrollArea]`
- **Exporta:** `ZcTranslocoLoader`, `ScrollAreaDirective`, `Viewport`

### `@zonacards/ui/count`

- **Para:** Contador numérico pequeño (notificaciones, pestañas)
- **Selectores:** `zc-count`
- **Exporta:** `CountComponent`

### `@zonacards/ui/country-switcher`

- **Para:** Cambiar país de operación
- **No para:** Campo de país en formulario: zc-select
- **Selectores:** `zc-country-switcher`
- **Exporta:** `CountrySwitcherComponent`

### `@zonacards/ui/dashboard`

- **Para:** Grilla de widgets reordenable (ng-template zcWidgetBody)
- **No para:** Dashboard fijo simple: zc-dashboard-page
- **Selectores:** `ng-template[zcWidgetBody]`, `ng-template[zcWidgetAction]`, `zc-dashboard-grid`
- **Exporta:** `WidgetBodyDirective`, `WidgetActionDirective`, `DashboardGridComponent`

### `@zonacards/ui/date-field`

- **Para:** Una fecha (ISO aaaa-mm-dd)
- **No para:** Rango: zc-date-range
- **Selectores:** `zc-date-field`
- **Exporta:** `DateFieldComponent`

### `@zonacards/ui/date-range`

- **Para:** Rango de fechas con atajos
- **Selectores:** `zc-date-range`
- **Exporta:** `DateRangeComponent`

### `@zonacards/ui/delete-account`

- **Para:** Eliminar mi cuenta (lo exigen las tiendas de apps): consecuencias, código de 6 dígitos al correo, motivo opcional y solicitud abierta o rechazada. La app envía el código y registra
- **No para:** Cerrar sesión o desactivar una cuenta de otro usuario (eso es una acción de administración)
- **Selectores:** `zc-delete-account`
- **Exporta:** `DeleteAccountComponent`

### `@zonacards/ui/description-list`

- **Para:** Pares etiqueta/valor en fichas de detalle
- **No para:** Datos tabulares: zc-data-table
- **Selectores:** `zc-description-list`
- **Exporta:** `DescriptionListComponent`

### `@zonacards/ui/email-editor`

- **Para:** Editor de correos por bloques
- **Selectores:** `zc-email-editor`
- **Exporta:** `EmailEditorComponent`

### `@zonacards/ui/error-page`

- **Para:** 404, 403, 500 y errores de página completa
- **No para:** Error de un bloque: zc-state
- **Selectores:** `zc-error-page`
- **Exporta:** `ErrorPageComponent`

### `@zonacards/ui/facets`

- **Para:** Filtros con conteos (facetas) en paneles
- **Selectores:** `zc-facets`, `zc-facet-group`, `zc-facet-options`
- **Exporta:** `FacetsComponent`, `FacetGroupComponent`, `FacetOptionsComponent`

### `@zonacards/ui/field`

- **Para:** Envoltura de todo campo: label, hint, error, optional, counter. Con input[zcInput] o textarea[zcInput]
- **No para:** Inputs sin etiqueta visible
- **Selectores:** `zc-field`, `input[zcInput], textarea[zcInput]`
- **Exporta:** `FieldComponent`, `InputDirective`

### `@zonacards/ui/file-upload`

- **Para:** Subir archivos con arrastre, progreso y validación
- **No para:** Galería de imágenes: zc-image-gallery
- **Selectores:** `zc-file-upload`
- **Exporta:** `FileUploadComponent`

### `@zonacards/ui/flag`

- **Para:** Bandera de país
- **No para:** Emojis de bandera
- **Selectores:** `zc-flag`
- **Exporta:** `FlagComponent`

### `@zonacards/ui/geo-map`

- **Para:** Mapa de calles con Leaflet: lugares, burbujas con cantidad y pin arrastrable (editable). Requiere leaflet y styles/geo-map.css
- **No para:** Datos por país sin teselas: zc-map de charts
- **Selectores:** `zc-geo-map`
- **Exporta:** `GeoMapComponent`

### `@zonacards/ui/icon`

- **Para:** Íconos: name="s:…" (Solar), "s:…-bold" (activo), "l:…" (Lucide de respaldo)
- **No para:** @ng-icons, SVG sueltos, emojis
- **Selectores:** `zc-icon`
- **Exporta:** `IconComponent`

### `@zonacards/ui/image-gallery`

- **Para:** Galería con subida, orden y validación
- **Selectores:** `zc-image-gallery`
- **Exporta:** `ImageGalleryComponent`

### `@zonacards/ui/input-group`

- **Para:** Input con prefijo/sufijo/botón
- **No para:** Campos con su propio componente (money, phone…)
- **Selectores:** `zc-input-group`
- **Exporta:** `InputGroupComponent`

### `@zonacards/ui/intro`

- **Para:** Introducción a pantalla completa de la primera vez (diapositivas con Saltar, Continuar y Empezar) y puntos de avance reutilizables
- **No para:** Una lista de tareas de inicio: zc-onboarding
- **Selectores:** `zc-intro-slides`, `zc-step-dots`
- **Exporta:** `IntroSlidesComponent`, `StepDotsComponent`

### `@zonacards/ui/kanban`

- **Para:** Tablero por columnas (ng-template zcKanbanCard)
- **Selectores:** `ng-template[zcKanbanCard]`, `zc-kanban`
- **Exporta:** `KanbanCardDirective`, `KanbanComponent`

### `@zonacards/ui/kpi`

- **Para:** Métrica con delta y [trend]; [filter] la vuelve filtro clickeable
- **Selectores:** `zc-kpi`
- **Exporta:** `KpiComponent`

### `@zonacards/ui/legal`

- **Para:** Términos o privacidad en una hoja (versión, esqueleto, error con Reintentar) y la caja de consentimiento con casilla, enlaces y chip "Términos aceptados"
- **No para:** Un modal cualquiera: zc-modal
- **Selectores:** `zc-legal-sheet`, `zc-legal-consent`
- **Exporta:** `LegalSheetComponent`, `LegalConsentComponent`

### `@zonacards/ui/listbox`

- **Para:** Lista seleccionable siempre visible
- **No para:** Desplegable: zc-select
- **Selectores:** `zc-listbox`
- **Exporta:** `ListboxComponent`

### `@zonacards/ui/location-picker`

- **Para:** Punto exacto en el mapa (dirección de entrega, local): pin que se arrastra o se coloca con un clic, latitud y longitud escritas y "Usar mi ubicación". `[center]` lo centra mientras no hay punto
- **No para:** Mostrar lugares o datos por país: zc-geo-map o zc-map
- **Selectores:** `zc-location-picker`
- **Exporta:** `LocationPickerComponent`, `isValidLatLng`, `parseCoord`, `formatLatLng`

### `@zonacards/ui/logo`

- **Para:** Logos de terceros y medios de pago
- **Selectores:** `zc-logo`
- **Exporta:** `LogoComponent`

### `@zonacards/ui/menu`

- **Para:** Menú de acciones (kebab) u orden: [items]; popover en desktop, sheet en móvil. Menú contextual: trigger="none" + [zcContextMenu]
- **No para:** Navegación principal: zc-sidebar
- **Selectores:** `[zcContextMenu]`, `zc-menu`
- **Exporta:** `ContextMenuDirective`, `MenuComponent`

### `@zonacards/ui/mfa-setup`

- **Para:** Enrolamiento del segundo factor: QR del servidor, clave manual, verificación del código y códigos de recuperación
- **No para:** Pedir el código al iniciar sesión: zc-auth
- **Selectores:** `zc-mfa-setup`
- **Exporta:** `MfaSetupComponent`

### `@zonacards/ui/misc`

- **Para:** kbd[zcKbd], zc-separator, [zcButtonGroup], zc-close-button, a[zcLink]
- **Selectores:** `kbd[zcKbd]`, `zc-separator`, `[zcButtonGroup]`, `zc-close-button`, `a[zcLink], button[zcLink]`
- **Exporta:** `KbdDirective`, `SeparatorComponent`, `ButtonGroupDirective`, `CloseButtonComponent`, `LinkComponent`

### `@zonacards/ui/mobile`

- **Para:** App móvil: zc-mobile-bar, zc-bottom-nav, zc-system-banner, zc-pull-refresh, zc-swipe-item, zc-pin-pad, zc-permission-prompt, zc-push-preview
- **Selectores:** `zc-mobile-bar`, `zc-bottom-nav`, `zc-system-banner`, `zc-pull-refresh`, `zc-swipe-item`, `zc-pin-pad`, `zc-permission-prompt`, `zc-push-preview`
- **Exporta:** `MobileBarComponent`, `BottomNavComponent`, `SystemBannerComponent`, `PullRefreshComponent`, `SwipeItemComponent`, `PinPadComponent`, `PermissionPromptComponent`, `PushPreviewComponent`

### `@zonacards/ui/money`

- **Para:** Mostrar montos (abreviados con tooltip)
- **No para:** Dentro de un botón: usa formatMoney()
- **Selectores:** `zc-money`
- **Exporta:** `MoneyComponent`

### `@zonacards/ui/money-field`

- **Para:** Ingresar montos con moneda del país
- **No para:** type="number"
- **Selectores:** `zc-money-field`
- **Exporta:** `MoneyFieldComponent`

### `@zonacards/ui/notifications`

- **Para:** Centro de notificaciones
- **Selectores:** `zc-notifications`
- **Exporta:** `NotificationsComponent`

### `@zonacards/ui/number-field`

- **Para:** Cantidades con stepper
- **No para:** Montos: zc-money-field
- **Selectores:** `zc-number-field`
- **Exporta:** `NumberFieldComponent`

### `@zonacards/ui/offline-banner`

- **Para:** Aviso sin conexión
- **Selectores:** `zc-offline-banner`
- **Exporta:** `OfflineBannerComponent`

### `@zonacards/ui/otp`

- **Para:** Código de verificación por dígitos
- **Selectores:** `zc-otp`
- **Exporta:** `OtpComponent`

### `@zonacards/ui/overlay`

- **Para:** zc-modal (formulario corto, confirmación), zc-drawer (detalle lateral, filtros; sheet en móvil), zc-alert-dialog (destructivo, con confirmWord). Pie en <div zcOverlayFooter>
- **No para:** Sheet sobre sheet, <dialog> propio
- **Selectores:** `zc-alert-dialog`, `zc-modal, zc-drawer`
- **Exporta:** `AlertDialogComponent`, `OverlayComponent`

### `@zonacards/ui/page-header`

- **Para:** Encabezado de página: title, subtitle, [crumbs], acciones proyectadas
- **Selectores:** `zc-page-header`
- **Exporta:** `PageHeaderComponent`

### `@zonacards/ui/pagination`

- **Para:** Paginador (solo si hay más de una página)
- **No para:** Listas cortas
- **Selectores:** `zc-pagination`
- **Exporta:** `PaginationComponent`

### `@zonacards/ui/panel`

- **Para:** Base de paneles flotantes propios (popover desktop / sheet móvil / subpantalla)
- **No para:** Filtros: zc-drawer
- **Selectores:** `zc-panel`
- **Exporta:** `Panel`, `PanelComponent`

### `@zonacards/ui/pay-badge`

- **Para:** Medio de pago con su color de marca
- **Selectores:** `zc-pay-badge`
- **Exporta:** `PayBadgeComponent`

### `@zonacards/ui/permission-group`

- **Para:** Matriz de permisos por rol
- **Selectores:** `zc-permission-group`
- **Exporta:** `PermissionGroupComponent`

### `@zonacards/ui/phone-field`

- **Para:** Teléfono con país y formato
- **Selectores:** `zc-phone-field`
- **Exporta:** `PhoneFieldComponent`

### `@zonacards/ui/pipeline`

- **Para:** Etapas de un proceso con conteos
- **Selectores:** `zc-pipeline`
- **Exporta:** `PipelineComponent`

### `@zonacards/ui/popover`

- **Para:** zc-info-popover: ayuda con contenido rico
- **No para:** Ayuda de una línea: zcTooltip
- **Selectores:** `zc-info-popover`
- **Exporta:** `InfoPopoverComponent`

### `@zonacards/ui/progress`

- **Para:** Progreso determinado o indeterminado
- **No para:** Cargas de página: zc-skeleton
- **Selectores:** `zc-progress`
- **Exporta:** `ProgressComponent`

### `@zonacards/ui/qr`

- **Para:** Código QR
- **Selectores:** `zc-qr`
- **Exporta:** `QrComponent`

### `@zonacards/ui/radio`

- **Para:** Opción única visible (2–5); variant="card" con [icon] para elegir con tarjetas
- **No para:** Muchas opciones: zc-select
- **Selectores:** `zc-radio-group`, `zc-radio`
- **Exporta:** `RadioGroupComponent`, `RadioComponent`

### `@zonacards/ui/recipients-editor`

- **Para:** Lista de destinatarios (correo/teléfono) con validación
- **Selectores:** `zc-recipients-editor`
- **Exporta:** `RecipientsEditorComponent`

### `@zonacards/ui/recurrence`

- **Para:** Regla de repetición (diaria, semanal, mensual)
- **Selectores:** `zc-recurrence`
- **Exporta:** `RecurrenceComponent`

### `@zonacards/ui/rich-text`

- **Para:** Texto con formato
- **No para:** Texto plano: textarea[zcInput]
- **Selectores:** `zc-rich-text`
- **Exporta:** `RichTextComponent`

### `@zonacards/ui/rule-builder`

- **Para:** Constructor de condiciones (si … entonces …)
- **Selectores:** `zc-rule-builder`
- **Exporta:** `RuleBuilderComponent`

### `@zonacards/ui/scanner`

- **Para:** Escanear QR/código con cámara
- **Selectores:** `zc-scanner`
- **Exporta:** `ScannerComponent`

### `@zonacards/ui/secret-field`

- **Para:** Mostrar/copiar claves y tokens enmascarados
- **No para:** Contraseñas de login: zc-password-field
- **Selectores:** `zc-secret-field`
- **Exporta:** `SecretFieldComponent`

### `@zonacards/ui/segmented`

- **Para:** 2–4 vistas, periodos o métricas
- **No para:** Más opciones: zc-select o zc-tabs
- **Selectores:** `zc-segmented`
- **Exporta:** `SegmentedComponent`

### `@zonacards/ui/select`

- **Para:** zc-select (lista cerrada, multiple, searchable) y zc-combobox (con escritura)
- **No para:** <select> nativo
- **Selectores:** `zc-select, zc-combobox`
- **Exporta:** `SelectComponent`

### `@zonacards/ui/session-timeout`

- **Para:** Aviso de cierre por inactividad
- **Selectores:** `zc-session-timeout`
- **Exporta:** `SessionTimeoutComponent`

### `@zonacards/ui/sidebar`

- **Para:** Navegación principal de la app
- **Selectores:** `zc-sidebar`
- **Exporta:** `SidebarComponent`

### `@zonacards/ui/signature`

- **Para:** Firma manuscrita
- **Selectores:** `zc-signature`
- **Exporta:** `SignatureComponent`

### `@zonacards/ui/skeleton`

- **Para:** Estado de carga con la forma del contenido
- **Selectores:** `zc-skeleton`
- **Exporta:** `SkeletonComponent`

### `@zonacards/ui/slider`

- **Para:** zc-slider y zc-range-slider
- **No para:** Valores exactos: zc-number-field
- **Selectores:** `zc-slider`, `zc-range-slider`
- **Exporta:** `SliderComponent`, `RangeSliderComponent`

### `@zonacards/ui/sortable`

- **Para:** Reordenar con puntero y teclado (zcSortable, zcSortableItem, zcSortableHandle)
- **Selectores:** `[zcSortable]`, `[zcSortableItem]`, `[zcSortableHandle]`
- **Exporta:** `SortableDirective`, `SortableItemDirective`, `SortableHandleDirective`

### `@zonacards/ui/sparkline`

- **Para:** Mini tendencia sin ejes
- **No para:** Análisis: zc-chart
- **Selectores:** `zc-sparkline`
- **Exporta:** `SparklineComponent`

### `@zonacards/ui/spinner`

- **Para:** Espera breve dentro de botones o acciones
- **No para:** Cargas de página
- **Selectores:** `zc-spinner`
- **Exporta:** `SpinnerComponent`

### `@zonacards/ui/split`

- **Para:** Dos paneles redimensionables (lista y detalle); se apilan en móvil
- **No para:** Layout de página fijo
- **Selectores:** `zc-split`
- **Exporta:** `SplitComponent`

### `@zonacards/ui/sso-button`

- **Para:** Botones de acceso con Google, Microsoft, Apple
- **Selectores:** `button[zcSso]`
- **Exporta:** `SsoButtonComponent`

### `@zonacards/ui/state`

- **Para:** Vacío o error de un bloque: kind, title, text, [reference], acción proyectada
- **Selectores:** `zc-state`
- **Exporta:** `StateComponent`

### `@zonacards/ui/stepper`

- **Para:** zc-stepper (pasos) y zc-form-summary (revisión antes de enviar)
- **Selectores:** `zc-stepper`, `zc-form-summary`
- **Exporta:** `StepperComponent`, `FormSummaryComponent`

### `@zonacards/ui/subnav`

- **Para:** Menú secundario de configuración
- **Selectores:** `zc-subnav`
- **Exporta:** `SubnavComponent`

### `@zonacards/ui/support`

- **Para:** Ayuda y soporte: horario y una fila-enlace por canal (llamar, WhatsApp, correo, centro de ayuda) en una hoja
- **No para:** Preguntas frecuentes largas o un chat: zc-chat
- **Selectores:** `zc-support-sheet`
- **Exporta:** `SupportSheetComponent`, `prettyPhone`

### `@zonacards/ui/switch`

- **Para:** Activar/desactivar con efecto inmediato
- **No para:** Aceptar términos: zc-checkbox
- **Selectores:** `zc-switch`
- **Exporta:** `SwitchComponent`

### `@zonacards/ui/table`

- **Para:** zc-data-view (tarjetas/tabla), zc-data-table (TanStack, orden, selección, densidad) y zc-filter-bar (búsqueda, chips, filtros en drawer)
- **No para:** <table> HTML
- **Selectores:** `ng-template[zcCell]`, `ng-template[zcRowDetail]`, `ng-template[zcRowActions]`, `ng-template[zcRowCard]`, `ng-template[zcBulkActions]`, `zc-data-table`, `ng-template[zcCardsView]`, `ng-template[zcTableView]`, `zc-data-view`, `ng-template[zcFilterMain]`, `ng-template[zcFilterMore]`, `zc-filter-bar`
- **Exporta:** `CellDefDirective`, `RowDetailDirective`, `RowActionsDirective`, `RowCardDirective`, `BulkActionsDirective`, `DataTableComponent`, `CardsViewDirective`, `TableViewDirective`, `DataViewComponent`, `FilterMainDirective`, `FilterMoreDirective`, `FilterBarComponent`

### `@zonacards/ui/tabs`

- **Para:** Pestañas (importa también TabPanelDirective)
- **No para:** Pasos secuenciales: zc-stepper
- **Selectores:** `zc-tabs`, `[zcTabPanel]`
- **Exporta:** `TabsComponent`, `TabPanelDirective`

### `@zonacards/ui/tags-field`

- **Para:** Lista de etiquetas libres
- **Selectores:** `zc-tags-field`
- **Exporta:** `TagsFieldComponent`

### `@zonacards/ui/tax-id-field`

- **Para:** RUC, NIT, RUT, RFC con validación por país
- **Selectores:** `zc-tax-id-field`
- **Exporta:** `TaxIdFieldComponent`

### `@zonacards/ui/templates`

- **Para:** Plantillas de página: zc-list-page, zc-detail-page, zc-form-page, zc-dashboard-page y slots zcPage*
- **Selectores:** `[zcPageHeader]`, `[zcPageKpis]`, `[zcPageFilters]`, `[zcPageFooter]`, `[zcPageTabs]`, `[zcPageAside]`, `[zcPageSteps]`, `[zcPageActions]`, `zc-list-page`, `zc-detail-page`, `zc-form-page`, `zc-dashboard-page`
- **Exporta:** `PageHeaderSlot`, `PageKpisSlot`, `PageFiltersSlot`, `PageFooterSlot`, `PageTabsSlot`, `PageAsideSlot`, `PageStepsSlot`, `PageActionsSlot`, `ListPageComponent`, `DetailPageComponent`, `FormPageComponent`, `DashboardPageComponent`

### `@zonacards/ui/time-field`

- **Para:** Hora (hh:mm) con sugerencias
- **Selectores:** `zc-time-field`
- **Exporta:** `TimeFieldComponent`

### `@zonacards/ui/timeline`

- **Para:** Historial de actividad
- **Selectores:** `zc-timeline`
- **Exporta:** `TimelineComponent`

### `@zonacards/ui/toast`

- **Para:** ToastService para avisos breves; <zc-toaster /> una vez en el layout
- **No para:** Errores que bloquean: zc-alert
- **Selectores:** `zc-toast`, `zc-toaster`
- **Exporta:** `ToastService`, `ToastComponent`, `ToasterComponent`

### `@zonacards/ui/tooltip`

- **Para:** [zcTooltip] para ayudas breves con mouse y foco
- **No para:** title=""
- **Selectores:** `[zcTooltip]`
- **Exporta:** `TooltipDirective`

### `@zonacards/ui/tour`

- **Para:** Recorrido guiado
- **Selectores:** `zc-tour`
- **Exporta:** `TourComponent`

### `@zonacards/ui/tree`

- **Para:** Jerarquías con teclado y selección simple o con casillas (estado mixto)
- **No para:** Navegación principal: zc-sidebar
- **Selectores:** `zc-tree`
- **Exporta:** `TreeComponent`

### `@zonacards/ui/ubigeo`

- **Para:** Departamento › provincia › distrito del Perú (INEI) en cascada; el valor es el código de distrito de 6 dígitos y `(located)` entrega sus coordenadas. Datos en `geo/ubigeo-pe.json` (MIT)
- **No para:** Países sin ubigeo cargado: usa zc-select con sus propias listas
- **Selectores:** `zc-ubigeo-select`
- **Exporta:** `UbigeoSelectComponent`, `Ubigeo`, `loadUbigeo`

### `@zonacards/ui/unsaved`

- **Para:** Aviso de cambios sin guardar al salir de un formulario (`unsavedChangesGuard` + `<zc-confirm-host />` en el shell) y confirmaciones por código con `ConfirmService.ask()`
- **No para:** `window.confirm()` o `zc-alert-dialog` armado a mano para una pregunta de sí o no
- **Selectores:** `zc-confirm-host`
- **Exporta:** `ConfirmHostComponent`, `ConfirmService`, `unsavedChangesGuard`

### `@zonacards/ui/wallet`

- **Para:** zc-giftcard-pass (giftcard en Google y Apple Wallet: saldo, número enmascarado, PIN, vencimiento, CODE 128, CODE 39 o QR, hero o strip) y zc-wallet-pass (lealtad: puntos y nivel)
- **Selectores:** `zc-giftcard-pass`, `zc-wallet-pass`
- **Exporta:** `GiftcardPassComponent`, `WalletPassComponent`
