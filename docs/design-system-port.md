# Port del design system a Angular

Fuente de verdad: `docs/design-system/index.html` (62 secciones). Un componente está **hecho** cuando:

1. Se ve igual que en `index.html` (comparado lado a lado en 375 y 1440 px, claro y oscuro).
2. Se comporta igual: teclado, foco, móvil (bottom sheet / subpantalla), estados y textos de ayuda.
3. Está en `/catalogo` en la misma sección y grupo que en `index.html`, con todas sus variantes.
4. Tiene prueba e2e de su comportamiento y pasa la auditoría (axe + layout en 6 anchos).

Estados: ✅ hecho · 🟡 portado parcialmente (falta fidelidad o variantes) · ⬜ falta.

## Fundamentos

| Sección | Contenido | Estado | Falta |
| --- | --- | --- | --- |
| color | Semánticos con contraste real | ✅ | — (12 pares, ratio calculado en vivo por tema y marca) |
| f-palette | Escalas 50–950 y paletas de datos | ✅ | — (clic copia el hexadecimal) |
| tipo | Escala tipográfica | ✅ | — (selector Figtree/Outfit sobre `--zc-font-sans`) |
| f-dates | Formatos de fecha y hora | ✅ | — (formato 12 h / 24 h) |
| espacio | Espacio, radios, targets | ✅ | — |
| scroll | Barras sutiles, degradado | ✅ | — (preferencia "Mostrar siempre" en `ThemeService`) |
| iconos | Íconos y banderas | ✅ | — |
| f-logos | Medios de pago, redes, marcas (Simple Icons) | ✅ | — (`zc-logo`, 32 logos, color o monocromo) |

## Átomos

| Sección | Contenido | Estado | Falta |
| --- | --- | --- | --- |
| a-button | Button, ButtonGroup, CloseButton, Link | ✅ | — |
| a-input | Input, Textarea, Label, mensajes | ✅ | — (`zc-input-group`: prefijo, mostrar clave, válido; contador) |
| a-choice | Checkbox, CheckboxGroup, Radio, Switch | ✅ | — (filas de 48 px separadas 16 px como `.fieldset`) |
| a-badge | Badge, Chip/Tag, Count | ✅ | — (`zc-count`) |
| a-money | Montos abreviados | ✅ | — (tarjetas de 130 px, caja redimensionable y tabla de reglas) |
| a-avatar | Avatar, AvatarGroup, Kbd, Separator | ✅ | — (avatar de empresa con `initials` y `tone="brand"`) |
| a-progress | Spinner, Progress, Meter, Skeleton, Tooltip | ✅ | — (corregida la barra con máximo distinto de 100) |

## Moléculas

| Sección | Contenido | Estado | Falta |
| --- | --- | --- | --- |
| m-select | Select, ComboBox, ListBox | ✅ | — (títulos, textos, orden y valores de index.html; variantes extra debajo) |
| m-auto | Autocomplete | ✅ | — |
| m-special | Teléfono, monto, número, etiquetas, secreto | ✅ | — (el secreto es `zc-secret-field`, en m-upload como en index.html) |
| m-dates | Fecha, periodo, hora | ✅ | — (periodo inicial "Últimos 30 días") |
| m-slider | Slider, RangeSlider, OTP, ColorField | ✅ | — (`zc-slider`, `zc-range-slider`, `zc-otp`, `zc-color-field`) |
| m-color | ColorPicker y ColorField | ✅ | — (`zc-color-picker`: área, tono, HEX/RGB, paleta, recientes, cuentagotas, contraste) |
| m-rte | Editor de texto enriquecido | ✅ | — (`zc-rich-text`, HTML saneado con `sanitizeRichText`) |
| m-recur | Selector de recurrencia | ✅ | — (`zc-recurrence`; regla pura en `shared/domain/recurrence.ts`) |
| m-sign | Firma en pantalla | ✅ | — (`zc-signature`: dibujar o escribir) |
| m-commerce | Selector de monto, cupón, contraseña | ✅ | — (`zc-amount-picker`, `zc-coupon-field`, `zc-password-field` + `zc-password-rules`) |
| m-social | Acceso con Google, Apple, Microsoft | ✅ | — (`button[zcSso]`, colores de marca en tokens `--sso-*`) |
| m-nav | Tabs, ToggleButtonGroup, Breadcrumbs | ✅ | — (densidad con `zc-segmented`) |
| m-pager | Pagination | ✅ | — |
| m-feedback | Alert, Toast, Popover, Dropdown | ✅ | — (`zc-info-popover`; el menú de acciones queda como sección propia debajo) |
| m-accordion | Accordion | ✅ | — |
| m-upload | FileUpload, Snippet, DescriptionList | ✅ | — (`zc-secret-field`, `zc-description-list`) |

## Organismos

| Sección | Contenido | Estado | Falta |
| --- | --- | --- | --- |
| o-sidebar | Sidebar colapsable | ✅ | — (fondo, expandido/riel y `zc-subnav` para configuración) |
| o-auth | Autenticación | ✅ | — (`zc-auth`: admin y portal, 2FA, bloqueo, Bloq Mayús, recuperar) |
| o-l10n | Idioma, país, moneda, zona horaria | ✅ | — (`LocaleService`; país e idioma también en la barra superior) |
| o-chat | Ayuda y chat | ✅ | — (`zc-chat`) |
| o-tour | Tour guiado | ✅ | — (`zc-tour`) |
| o-cards | Cards | ✅ | — (`zc-card` con slots, `zc-kpi [trend]` + `zc-sparkline`, `zc-bullet`, `zc-radio` tarjeta con ícono) |
| o-charts | Gráficos | ✅ | — (revisado lado a lado: títulos, subtítulos y filtro de país en la dona) |
| o-charts2 | Gráficos de operación | ✅ | — (zc-chart con funnel, waterfall, heatmap, treemap, calendar, sankey y gauge) |
| o-table | Data table | ✅ | — (revisado lado a lado: fechas dd/mm/aaaa, miles y moneda en el pie) |
| o-grid | Tabla editable | ✅ | — (zc-recipients-editor: validación por celda, cantidades, filas y tarjetas en móvil) |
| o-dash | Dashboard configurable | ✅ | — (zc-dashboard-grid: reordenar, ancho 1/2/4, catálogo y restablecer) |
| o-filter | Filter bar, Drawer, Sheet, Modal, AlertDialog | ✅ | — (`zc-session-timeout`; acciones con `zc-menu`, bottom sheet en móvil) |
| o-facets | Filtros por facetas | ✅ | — (zc-facets, zc-facet-group, zc-facet-options y zc-product-card) |
| o-wizard | Stepper y formulario | ✅ | — (revisado lado a lado: Categoría, Teléfono, Notas, ícono de correo, sufijo % y nota de auditoría) |
| o-rules | Constructor de reglas | ✅ | — (zc-rule-builder con grupos Y/O y frase resumen) |
| o-email | Editor de correo por bloques | ✅ | — (zc-email-editor con tokens --email-*) |
| o-checkout | Checkout | ✅ | — (zc-checkout-steps, zc-cart, zc-help-card, zc-pay-badge) |
| o-sortable | Reordenar | ✅ | — (zcSortable, zcSortableItem y zcSortableHandle: puntero, teclado y menú) |
| o-images | Galería con carga de imágenes | ✅ | — (zc-image-gallery con validación, progreso, portada y texto alternativo) |
| o-domain | Pipeline, Timeline, Permisos, Notificaciones | ✅ | — (zc-pipeline, zc-timeline y zc-permission-group; notificaciones en la barra superior) |
| o-commerce | Producto, ayuda, CTA, límite, anuncio | ✅ | — (zc-announcement, zc-onboarding, zc-cta-card, zc-brand-logo, inventario y límite con zc-card) |
| o-kanban | Kanban | ✅ | — (zc-kanban con límite, teclado, Mover a y pestañas en móvil) |
| o-wallet | Pase Wallet | ✅ | — (zc-wallet-pass y zc-qr) |
| o-scanner | Escáner QR | ✅ | — (zc-scanner con cámara real y simulación) |
| o-mobile | Patrones de app móvil | ✅ | — (zc-mobile-bar, zc-bottom-nav, zc-system-banner, zc-pull-refresh, zc-swipe-item, zc-pin-pad) |
| o-perm | Permisos y push | ✅ | — (zc-permission-prompt y zc-push-preview) |
| o-errors | Gestión de errores | ✅ | — (zc-error-page, zc-offline-banner, reintento creciente, resultado parcial, error de servidor, 429) |
| o-states | Empty y Error state | ✅ | — (zc-state con detalles técnicos) |
| o-media | Mapa, galería, carrusel | ✅ | — (zc-map (ECharts + public/geo/latam.json), galería con zc-modal y zc-carousel) |

## Plantillas y páginas

| Sección | Contenido | Estado | Falta |
| --- | --- | --- | --- |
| t-templates | 4 plantillas | ✅ | — (`shared/ui/templates`: `zc-list-page`, `zc-detail-page`, `zc-form-page`, `zc-dashboard-page`) |
| t-layouts | 8 layouts | ✅ | — (esquemas con su comportamiento en móvil) |
| p-lotes | Página de ejemplo | ✅ | — (página completa en el catálogo sobre zc-list-page; enlace a la pantalla real) |
| — | Barra superior (búsqueda Ctrl+K, notificaciones, idioma, país) | ✅ | — (`zc-command-palette`, `zc-notifications`, `zc-country-switcher`, idioma con `zc-menu`) |

## Orden de trabajo

1. **Base y fidelidad:** el catálogo con la misma navegación que `index.html` (por nivel y grupo, con índice y buscador), y una revisión lado a lado de lo ya portado.
2. **Fundamentos y átomos faltantes.**
3. **Moléculas faltantes.**
4. **Organismos de estructura:** barra superior, paleta de comandos, notificaciones, localización, autenticación, sesión, cards, plantillas y layouts.
5. **Organismos de datos:** gráficos de operación, tabla editable, dashboard, facetas, reglas, reordenar, kanban, dominio, errores.
6. **Organismos de comercio, medios y móvil.**

Mientras dure el port no se construyen pantallas nuevas.

## Librería

El sistema de diseño se publica como `@zonacards/ui` (`projects/zonacards-ui`): 97 puntos de entrada (uno por componente, más `core`, `helm` y grupos como `table`, `charts`, `commerce`, `mobile`), estilos (`styles/zonacards.css`), textos (`i18n`) y assets (`geo`). Uso en otros proyectos: `projects/zonacards-ui/README.md`.
