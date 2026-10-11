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
| o-sidebar | Sidebar colapsable | 🟡 | Menú secundario (subnavegación de configuración) |
| o-auth | Autenticación | ⬜ | Todo |
| o-l10n | Idioma, país, moneda, zona horaria | ✅ | — (`LocaleService`; país e idioma también en la barra superior) |
| o-chat | Ayuda y chat | ⬜ | Todo |
| o-tour | Tour guiado | ⬜ | Todo |
| o-cards | Cards | 🟡 | Entidad, KPI con sparkline, medio, stock con bullet, usuario, seleccionable |
| o-charts | Gráficos | 🟡 | Revisión de fidelidad lado a lado |
| o-charts2 | Gráficos de operación | ⬜ | Embudo, cascada, mapa de calor, árbol, calendario, Sankey, meta |
| o-table | Data table | 🟡 | Revisión de fidelidad lado a lado |
| o-grid | Tabla editable | ⬜ | Todo |
| o-dash | Dashboard configurable | ⬜ | Todo |
| o-filter | Filter bar, Drawer, Sheet, Modal, AlertDialog | 🟡 | Aviso de sesión por expirar, sheet de acciones |
| o-facets | Filtros por facetas | ⬜ | Todo |
| o-wizard | Stepper y formulario | 🟡 | Revisión de fidelidad lado a lado |
| o-rules | Constructor de reglas | ⬜ | Todo |
| o-email | Editor de correo por bloques | ⬜ | Todo |
| o-checkout | Checkout | ⬜ | Todo |
| o-sortable | Reordenar | ⬜ | Todo |
| o-images | Galería con carga de imágenes | ⬜ | Todo |
| o-domain | Pipeline, Timeline, Permisos, Notificaciones | ⬜ | Todo (hay timelines sueltos en fichas) |
| o-commerce | Producto, ayuda, CTA, límite, anuncio | ⬜ | Todo |
| o-kanban | Kanban | ⬜ | Todo |
| o-wallet | Pase Wallet | ⬜ | Todo |
| o-scanner | Escáner QR | ⬜ | Todo |
| o-mobile | Patrones de app móvil | ⬜ | Todo |
| o-perm | Permisos y push | ⬜ | Todo |
| o-errors | Gestión de errores | 🟡 | Páginas de error, reintento creciente, resultado parcial, sin conexión, 429 |
| o-states | Empty y Error state | 🟡 | Revisión de fidelidad lado a lado |
| o-media | Mapa, galería, carrusel | ⬜ | Todo |

## Plantillas y páginas

| Sección | Contenido | Estado | Falta |
| --- | --- | --- | --- |
| t-templates | 4 plantillas | ⬜ | Componentes de plantilla (listado, ficha, formulario, dashboard) |
| t-layouts | 8 layouts | ⬜ | Todo |
| p-lotes | Página de ejemplo | 🟡 | Enlace a la pantalla real de Lotes; falta la ficha de ejemplo dentro del catálogo |
| — | Barra superior (búsqueda Ctrl+K, notificaciones, idioma, país) | ✅ | — (`zc-command-palette`, `zc-notifications`, `zc-country-switcher`, idioma con `zc-menu`) |

## Orden de trabajo

1. **Base y fidelidad:** el catálogo con la misma navegación que `index.html` (por nivel y grupo, con índice y buscador), y una revisión lado a lado de lo ya portado.
2. **Fundamentos y átomos faltantes.**
3. **Moléculas faltantes.**
4. **Organismos de estructura:** barra superior, paleta de comandos, notificaciones, localización, autenticación, sesión, cards, plantillas y layouts.
5. **Organismos de datos:** gráficos de operación, tabla editable, dashboard, facetas, reglas, reordenar, kanban, dominio, errores.
6. **Organismos de comercio, medios y móvil.**

Mientras dure el port no se construyen pantallas nuevas.
