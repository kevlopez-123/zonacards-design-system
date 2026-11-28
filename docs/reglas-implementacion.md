# Reglas de implementación para Claude Code

Esta pestaña es el contrato de calidad del frontend: lo que Claude Code debe cumplir en cada pantalla y componente. Exportarla como `docs/reglas-implementacion.md` y referenciarla desde `CLAUDE.md`. Ante conflicto con la pestaña principal, prevalece esta.

## 1. Prioridad y criterios de decisión

No se sacrifica funcionalidad por producir muchas pantallas rápido. El orden de trabajo es fijo:

1. Arquitectura
2. Navegación
3. Datos mock
4. Componentes reutilizables
5. Flujos funcionales
6. Estados
7. Responsive
8. Accesibilidad
9. Refinamiento visual

Cuando algo no esté especificado, elegir la solución que sea más simple, escalable, de bajo acoplamiento, con buena UX, consistente con Angular 21 y sin dependencias innecesarias. Antes de un patrón complejo, usar lo nativo de Angular (signals, control flow, CDK, formularios reactivos).

Dependencias aprobadas; cualquier otra requiere justificarla en el PR:

| Necesidad | Librería |
| --- | --- |
| Estilos | Tailwind CSS v4 |
| Componentes base | spartan/ui (brain + helm) |
| Íconos | Solar (principal), Lucide (respaldo) vía Iconify |
| Banderas | flag-icons (SVG, licencia MIT) |
| Mapas | Leaflet con teselas de OpenStreetMap |
| Gráficos | ECharts |
| Tablas | TanStack Table (solo en vista tabla) |
| i18n | Transloco |
| Fechas | API Intl nativa; date-fns solo si hace falta aritmética de fechas |
| Mock APIs y pruebas | MSW, Faker, Vitest, Playwright |

## 2. Principios de UX

| Principio | Cómo se aplica |
| --- | --- |
| Tarjetas por defecto | Todo listado abre en vista de tarjetas. En desktop se ofrece alternar a tabla; en móvil solo tarjetas |
| Una acción principal por pantalla | Un solo botón primario visible; el resto secundario o en menú ⋮ |
| Divulgación progresiva | Primero lo esencial; detalles en la ficha, filtros avanzados en "Más filtros" |
| Formularios con progresión | Más de 6 campos se dividen en pasos o secciones con indicador de avance |
| Feedback siempre | Toda acción muestra estado: cargando, éxito (toast con enlace al registro) o error con causa y salida |
| Texto mínimo y verbos claros | Títulos de 1 línea, ayudas de 1 frase. Botones con verbo + objeto: "Crear lote", "Aprobar liquidación", nunca "Aceptar" u "OK" |
| Prevenir antes que corregir | Validar al salir del campo, deshabilitar lo imposible explicando por qué, confirmar lo irreversible |
| Consistencia | El mismo patrón resuelve el mismo problema en todo el sistema |

### Qué evitar

| Evitar | Alternativa obligatoria |
| --- | --- |
| Interfaces sobrecargadas | Máximo 6 KPI por fila, máximo 3 filtros visibles, resto en "Más filtros" |
| Formularios largos sin progresión | Stepper o secciones plegables con índice de avance |
| Modales innecesarios | Modal solo para confirmar o para formularios de 1 a 3 campos. Formularios largos van en página; detalles, en drawer (desktop) o bottom sheet (móvil) |
| Texto excesivo | Una frase de ayuda por campo como máximo; documentación fuera de la pantalla |
| Tablas complejas en móvil | Tarjetas verticales con los 3–4 datos clave |
| Botones ambiguos | Etiqueta con verbo + objeto; ícono solo nunca sin `aria-label` y tooltip |
| Estados sin feedback | Cada acción asíncrona tiene loading, success y error |
| Pantallas vacías sin explicación | Empty state con qué es, por qué está vacío y la acción para salir |

## 3. Journeys por rol

Cada journey es una prueba de extremo a extremo con Playwright y una ruta del prototipo. La columna "Momento crítico" marca dónde la UX suele fallar y qué debe resolverse.

| Rol | Journey | Pasos | Momento crítico | Resolución |
| --- | --- | --- | --- | --- |
| Comercial | Lanzar una campaña | Cliente → Programa → Nueva campaña → Credenciales API → Avisar al cliente | Copiar credenciales sin exponerlas | Mostrar enmascaradas, botón Copiar con confirmación |
| Operaciones | Emitir y enviar giftcards | Nuevo lote → Aprobación → Destino envío masivo → Cargar contactos → Aprobación → Seguimiento | Archivo con filas inválidas | Previsualización con errores por fila y descarga de errores |
| Operaciones | Reponer stock de terceros | Alerta de punto de pedido → Ficha de stock → Cargar lote del proveedor | Alerta perdida entre otras | Alerta en barra superior y en el dashboard del rol |
| ATC | Resolver un reclamo | Ctrl+K con últimos 4 dígitos → Ficha de giftcard → Historial → Reenviar o reverso | Encontrar la giftcard rápido | Búsqueda global y línea de tiempo filtrable |
| Finanzas | Cerrar el ciclo de pago | Generar liquidación → Aprobación → Cobranza firmada → Nuevo pago → Archivo bancario → Cerrar | Archivo bancario rechazado | Errores listados por franquicia con enlace a corregir |
| Supervisor de Finanzas | Aprobar en lote | Bandeja → Filtrar por tipo → Revisar → Aprobar selección | Aprobar sin revisar | Resumen de montos y cantidad antes de confirmar |
| Administrador | Crear un rol | Roles → Duplicar plantilla → Ajustar permisos y alcance → Fijar dashboard → Guardar | Dar permisos de más | Contador por módulo y resumen final de permisos |
| Comercio (externo) | Consultar consumos | Ingreso → Consumos → Filtrar por local y fechas → Exportar | Pensar que faltan datos | Indicar rango y hora de actualización |
| Contacto corporativo | Descargar vales | Correo → Enlace del visor → Descargar ZIP o XLSX | Enlace vencido | Página clara de enlace vencido con a quién pedir uno nuevo |

## 4. Mapeo de flujos y estados

Los flujos de pantallas están en la sección 9 de la pestaña principal. Aquí van las máquinas de estado que la UI debe respetar: un botón solo aparece si la transición es válida desde el estado actual.

&#91;embedded content: máquinas de estado · giftcard, liquidación y doble aprobación\]

En el código cada máquina es un objeto de transiciones permitidas por estado (`shared/domain/states.ts`); los badges, los menús de acciones y los mocks leen de ahí.

## 5. Accesibilidad

Mínimo obligatorio: WCAG 2.2 nivel AA. Una pantalla que no cumple no se da por terminada.

| Criterio | Regla verificable |
| --- | --- |
| Contraste | 4.5:1 en texto normal, 3:1 en texto grande, íconos y bordes de controles, en tema claro y oscuro |
| Foco visible | Anillo de 2 px con separación de 2 px en todo control; nunca `outline: none` sin reemplazo |
| Teclado | Todo se opera con teclado; orden de tabulación igual al visual; Escape cierra overlays y devuelve el foco al disparador |
| Etiquetas | Todo campo tiene `<label>` visible; el placeholder nunca reemplaza la etiqueta |
| Errores | Mensaje bajo el campo enlazado con `aria-describedby`, `aria-invalid="true"`; resumen de errores al tope que recibe el foco al fallar el envío |
| `aria-label` | En botones de solo ícono, paginación, cerrar, menús ⋮ y selector de país |
| Deshabilitado | Se distingue por opacidad 50%, cursor `not-allowed` y patrón de texto; se explica el motivo con tooltip cuando no es obvio |
| No solo color | Todo estado lleva texto y además ícono (Activado ✓, Vencido reloj, Anulado X) |
| Targets táctiles | 48 px con mouse y 56 px en táctil (pointer: coarse o menos de 768 px) en inputs, botones, selectores y controles principales; 36/44 px solo en acciones secundarias de barras densas; 8 px entre targets |
| Movimiento | Respetar `prefers-reduced-motion`; nada parpadea más de 3 veces por segundo |
| Anuncios | Toasts y cambios de estado en regiones `aria-live="polite"`; errores críticos con `role="alert"` |
| Idioma | `lang` del documento según el idioma activo |

## 6. Responsive mobile-first

Se diseña y maqueta primero para móvil. Los layouts se adaptan, no se escalan: cada patrón cambia de forma según el breakpoint.

| Breakpoint | Rango | Tailwind | Layout |
| --- | --- | --- | --- |
| Mobile | 0–767 px | base | Una columna, barra superior compacta, menú en drawer, acciones al pie |
| Tablet | 768–1279 px | `md:` | Dos columnas de tarjetas, sidebar colapsado a íconos |
| Desktop | 1280 px o más | `xl:` | Sidebar abierto, grilla de 3–4 tarjetas, layout de dos columnas en fichas |

| Patrón | Mobile | Tablet | Desktop |
| --- | --- | --- | --- |
| Navegación | Barra superior + menú en drawer | Sidebar de íconos con tooltips | Sidebar con grupos rotulados |
| Listados | Tarjetas verticales, "Cargar más" | Grilla de 2 tarjetas, paginación compacta | Grilla de 3–4 tarjetas, alternar a tabla, paginación compacta (rango, anterior/siguiente, ir a página, filas por página) |
| Filtros | Bottom sheet | Drawer lateral | Barra de filtros + drawer de "Más filtros" |
| Detalle rápido | Bottom sheet o página | Drawer | Drawer |
| Confirmaciones | Bottom sheet | Modal | Modal |
| Formularios | Un paso por pantalla, botón principal fijo al pie | Stepper horizontal | Stepper con índice lateral y vista previa a la derecha cuando aplica |
| Fichas | Cabecera apilada, pestañas deslizables | Dos columnas | Dos columnas (datos + actividad) |
| KPI | Grilla de 2 columnas | 3 columnas | Hasta 6 en fila |
| Mapas | Altura 240 px, pantalla completa al tocar | 360 px | Ancho completo de la columna, 480 px |
| Gráficos | Uno por fila, leyenda abajo | Dos por fila | Según grilla del dashboard |

Cada pantalla se valida en 375, 768, 1024 y 1440 px sin desplazamiento horizontal de página.

## 7. Inventario de componentes (Atomic Design)

El sistema sigue Atomic Design. Las reglas de cada nivel son las que evitan duplicados y acoplamiento:

| Nivel | Regla | Carpeta |
| --- | --- | --- |
| Tokens | Solo variables CSS; ningún componente usa valores fijos | `src/styles/tokens.css` |
| Átomos | No importan otros componentes `zc-*`; sin lógica de negocio ni llamadas HTTP | `shared/ui/atoms/` |
| Moléculas | Combinan átomos; estado solo de interfaz (abierto, valor, error) | `shared/ui/molecules/` |
| Organismos | Combinan moléculas; reciben datos por `input()` y emiten eventos; nunca llaman servicios | `shared/ui/organisms/` |
| Plantillas | Solo layout y slots (`ng-content`); sin datos | `shared/ui/templates/` |
| Páginas | Componentes de ruta en `features/`: cargan datos, manejan estado y componen plantillas | `features/<dominio>/pages/` |

Una variante nueva es un `input()` del componente existente, no un componente nuevo. Antes de crear uno, se busca en este inventario.

### Átomos

| Componente | Base | Variantes y casos |
| --- | --- | --- |
| `zc-icon` | Iconify (Solar, Lucide) | sm 16, md 20, lg 24, xl 32; decorativo o con etiqueta |
| `zc-flag` | flag-icons | 4:3 y 1:1 |
| `zc-button` | spartan button | primary, secondary, outline, ghost, danger, danger-soft, link · md, sm, icon · loading · disabled con motivo |
| `zc-button-group` | propio | exportar en formatos, acciones relacionadas |
| `zc-close-button` | propio | cierre de overlays y toasts |
| `zc-link` | propio | interno, externo con ícono |
| `zc-label` | spartan label | obligatorio, opcional, con ayuda (?) |
| `zc-field-message` | propio | ayuda, error, éxito, contador |
| `zc-input` | spartan input | text, email, password, search, con prefijo y sufijo |
| `zc-textarea` | spartan textarea | con contador |
| `zc-checkbox` | spartan checkbox | simple, indeterminado, con descripción |
| `zc-radio` | spartan radio-group | lista, tarjeta seleccionable |
| `zc-switch` | spartan switch | con descripción |
| `zc-badge` | spartan badge | estados de giftcard, lote, liquidación, pago y stock; siempre ícono + texto |
| `zc-chip` | propio | estático, removible, seleccionable, inválido |
| `zc-count` | propio | neutro, peligro, punto sin leer |
| `zc-avatar` | spartan avatar | iniciales, imagen, cuadrado (empresa), presencia; grupo |
| `zc-kbd` | propio | atajos |
| `zc-separator` | spartan separator | horizontal, vertical |
| `zc-spinner` | propio | sm, lg |
| `zc-progress` | spartan progress | barra, circular, meter (cupo) con color por umbral |
| `zc-skeleton` | spartan skeleton | línea, bloque, tarjeta, fila de tabla |
| `zc-tooltip` | spartan tooltip | con mouse y con foco; en botones deshabilitados explica el motivo |

### Moléculas

| Componente | Base | Variantes y casos |
| --- | --- | --- |
| `zc-field` | propio | etiqueta + control + una línea de mensaje reservada (la ayuda y el error comparten espacio) |
| `zc-select` | spartan select | simple, con descripción, con ícono, con bandera |
| `zc-combobox` | spartan command + popover | búsqueda, multiselección con checkboxes y Limpiar/Listo, agrupado, vacío |
| `zc-phone-field` | propio | bandera + prefijo + número; solo dígitos, largo por país, formato en grupos de 3 |
| `zc-money-field` | propio | símbolo y código de moneda, decimales por moneda, rango mínimo y máximo |
| `zc-number-field` | spartan input + botones | −/+, teclas de flecha, Shift ×100, mínimo y máximo |
| `zc-tax-id-field` | propio | RUC, NIT, RUT, RFC con filtro de caracteres y dígito verificador |
| `zc-tags-field` | propio | correos múltiples con validación por etiqueta y máximo |
| `zc-secret-field` | propio | API Key enmascarada, mostrar (auditado) y copiar |
| `zc-color-field` | propio | campo hexadecimal que abre \`zc-color-picker\` en popover (bottom sheet en móvil), con Cancelar/Aplicar y contraste AA en vivo |
| `zc-date-field` | propio + spartan calendar | se escribe dd/mm/aaaa con máscara o se elige; mínimo, máximo, atajos |
| `zc-date-range` | propio | periodos predefinidos, personalizado con dos meses (uno en móvil), campos escribibles, comparar con periodo anterior |
| `zc-time-field` | propio | se escribe hh:mm (24 h) o se elige cada 30 min; rango desde–hasta con validación |
| `zc-slider` | propio | valor único, rango con dos manijas |
| `zc-otp` | spartan input-otp | 6 dígitos, pegar completo, error con intentos restantes |
| `zc-search-field` | propio | inline, con atajo Ctrl+K |
| `zc-segmented` | spartan toggle-group | pestañas de vista, densidad, periodo |
| `zc-tabs` | spartan tabs | segmentadas, de línea con contador |
| `zc-breadcrumbs` | propio | completo en desktop; en móvil inicio, …, padre y actual |
| `zc-pagination` | propio | compacta (recomendada), numérica (máximo 5 visibles), cargar más |
| `zc-alert` | spartan alert | info, éxito, advertencia, peligro; con acción |
| `zc-toast` | spartan sonner | éxito, error, info; con acción |
| `zc-accordion` | spartan accordion | uno o varios abiertos |
| `zc-dropdown-menu` | spartan dropdown-menu | grupos, íconos, atajos, deshabilitado con motivo, destructivo |
| `zc-popover` | spartan popover | información, formulario corto |
| `zc-file-upload` | propio | arrastrar o elegir, progreso, éxito, error con detalle por fila |
| `zc-description-list` | propio | dos columnas, filas |

### Organismos

| Componente | Variantes y casos |
| --- | --- |
| `zc-topbar` | marca, búsqueda, notificaciones, tema, usuario; compacta en móvil |
| `zc-sidenav` | grupos rotulados, activo en Bold, colapsado a íconos en tablet, drawer en móvil |
| `zc-page-header` | migas, título, subtítulo, acciones |
| `zc-card` | entidad, KPI con sparkline y variación, medio con imagen, stock con bullet, usuario, seleccionable |
| `zc-data-view` | tarjetas por defecto; tabla como alternativa en desktop |
| `zc-data-table` | selección y acciones masivas, orden, columnas visibles, densidad, fila expandible, columnas fijas, estados cargando/vacío/sin resultados/error, tarjetas en móvil |
| `zc-chart` | línea con comparación, barras horizontales, barras apiladas, dona con total; "Ver datos" como tabla |
| `zc-filter-bar` | 3 filtros visibles + Más filtros (drawer o bottom sheet), chips removibles, conteo |
| `zc-modal` | formulario corto, imagen |
| `zc-alert-dialog` | destructivo con motivo y confirmación escrita |
| `zc-drawer` | detalle, filtros, navegación; encabezado con título, subtítulo, metadatos y cierre |
| `zc-bottom-sheet` | acciones, filtros, selectores en móvil |
| `zc-session-dialog` | aviso de expiración con cuenta regresiva |
| `zc-command-palette` | búsqueda global agrupada |
| `zc-notification-center` | pestañas por tipo, sin leer, marcar todo como leído |
| `zc-stepper` | horizontal en desktop, compacto en móvil, pasos con validación |
| `zc-form-summary` | resumen de errores con enlaces a cada campo |
| `zc-pipeline`, `zc-timeline`, `zc-permission-matrix`, `zc-alert-bar` | componentes de dominio |
| `zc-empty-state`, `zc-error-state` | sin datos, sin resultados, sin acceso, enlace vencido, sin notificaciones, error con referencia |
| `zc-map` | Leaflet con límites de países incrustados + teselas OSM; marcadores por cantidad |
| `zc-gallery`, `zc-carousel` | imágenes de categoría, plantillas |

### Plantillas

| Plantilla | Estructura |
| --- | --- |
| Listado | migas · encabezado · KPI que filtran · barra de filtros · tarjetas/tabla · paginación |
| Ficha | encabezado de entidad · pestañas · dos columnas (datos + actividad) |
| Formulario | stepper · secciones · pie con acción principal |
| Dashboard | periodo · KPI · gráficos · alertas |

### Reglas de anatomía y alineación

- Todo campo tiene tres filas fijas: etiqueta (20 px, una línea), control y mensaje (mínimo 20 px). La ayuda y el error usan la misma fila, así nada salta al validar.
- Todos los controles de una línea (input, select, fecha, hora, teléfono, monto) tienen la misma altura: `--target`.
- Ícono junto a texto: siempre en un contenedor `inline-flex` con `align-items: center`; en textos de varias líneas, el ícono se alinea con la primera línea.
- Los menús y popovers se renderizan sobre cualquier overlay (capa superior) y funcionan dentro de drawers, modales y bottom sheets.

### Scroll

- Barras finas (`scrollbar-width: thin`) e invisibles en reposo. Se muestran mientras hay desplazamiento (clase `is-scrolling` que se quita 0,9 s después), al pasar el mouse sobre el área o con foco de teclado dentro.
- Las áreas con desplazamiento horizontal (tablas, pestañas, stepper, carrusel) muestran un degradado en el borde cuando hay más contenido.
- Preferencia de accesibilidad "Mostrar siempre las barras" en el perfil del usuario; en modo de alto contraste del sistema se usan las barras nativas.
- Implementación en Angular: una directiva `zcScrollArea` con un listener pasivo y `NgZone` fuera de la detección de cambios (o zoneless), sin librerías.

### Montos

- `zc-money` muestra la cifra completa si cabe en su contenedor; si no, la abrevia: K (miles), M (millones), MM (miles de millones), con un decimal y el separador del país (S/ 10.9K en Perú, $10,9K en Chile). Menos de 1.000 solo pierde los decimales.
- La decisión es por espacio real, medida con `ResizeObserver`, no por breakpoint: el mismo monto se ve completo en una tarjeta ancha y abreviado en una angosta.
- Abreviado: subrayado punteado, tooltip con la cifra completa al pasar el cursor o con foco de teclado, y la cifra completa siempre disponible para lectores de pantalla.
- Nunca se abrevia en tablas, exportaciones, documentos de cobranza, liquidaciones ni formularios.

### Menú de acciones

- Ícono kebab vertical (Solar `menu-dots-vertical`), nunca los tres puntos horizontales.
- El botón abre y cierra el menú, no abre la ficha; flecha abajo también lo abre; Escape lo cierra y devuelve el foco al botón; en móvil se muestra como bottom sheet.

### Selector de color

- `zc-color-picker` (molécula): área de saturación y brillo, tono, campos HEX y RGB, paleta de marca, recientes (últimos 8, por usuario) y cuentagotas con la API EyeDropper donde el navegador la soporta.
- Muestra el contraste del color con texto blanco y negro (AA, solo texto grande o no cumple) y recomienda cuál usar.
- Teclado: flechas en el área (Shift = saltos de 10 %), flechas en el tono y en RGB (Shift = 10), flechas para recorrer la paleta; Escape cancela y restaura el color anterior.
- Variantes: en popover dentro de `zc-color-field` (con Cancelar/Aplicar) y en línea para paneles de configuración de plantillas.
- Se usa en el módulo de Plantillas con vista previa en vivo del correo.

### Componentes agregados en la versión 0.3

| Componente | Nivel | Variantes y casos |
| --- | --- | --- |
| `zc-autocomplete` | Molécula | Texto libre con sugerencias agrupadas, coincidencia resaltada, búsquedas recientes, cargando, sin resultados, "Buscar en todo" y "Crear" |
| `zc-amount-picker` | Molécula | Montos predefinidos, agotado, "Otro" con rango |
| `zc-coupon-field` | Molécula | Multicupón: hasta 3 cupones o gift cards, cada uno con descripción, monto y Quitar. Errores: no existe, vencido, repetido, no combinable, máximo alcanzado |
| `zc-password-field` | Molécula | Medidor de seguridad y requisitos en vivo |
| `zc-label` con `info` | Átomo | Ícono (?) junto a la etiqueta con tooltip accesible por mouse y teclado, para explicar términos (comisión, breakage, punto de pedido) |
| `zc-sortable` | Organismo | Lista y cuadrícula; mouse, táctil y teclado (Espacio, flechas, Escape); menú Subir/Bajar; anuncios para lectores de pantalla |
| `zc-image-uploader` | Organismo | Varias imágenes, vista previa, tipo, peso y dimensiones, progreso, portada, texto alternativo obligatorio, reordenar |
| `zc-editable-grid` | Organismo | Edición en línea con validación por celda, cantidades, agregar, limpiar y quitar filas, acciones masivas, resumen en vivo |
| `zc-facet-filters` | Organismo | Grupos plegables con conteo, búsqueda interna, mostrar más; columna en desktop y pantalla completa en móvil |
| `zc-checkout` | Organismo | Pasos en acordeón progresivo con resumen y Editar, opciones con imagen, carrito, cupón, resumen con cargos explicados, métodos de pago |
| `zc-sidebar` | Organismo | Expandido, riel con etiqueta corta, drawer en móvil, submenús, menú secundario, Ctrl+B, preferencia guardada |
| `zc-product-card` | Organismo | Cinta "Nueva", favorito, logo, precio "Desde"; variante inventario con lote, stock, vencimiento y acciones |
| `zc-help-card`, `zc-cta-card`, `zc-announcement-bar`, `zc-onboarding-hero`, `zc-limit-card` | Organismo | Ayuda con WhatsApp, llamada a la acción con ícono en esquina, anuncio descartable, guía de inicio descartable, límite de gasto con medidor |

Layouts: app shell, lista y detalle, riel con menú secundario, ficha, dashboard, sitio con navegación superior, flujo enfocado y checkout.

### Temas por producto

Un solo design system con cuatro temas que solo cambian tokens de marca y tipografía: Zonacards (Outfit, primario negro), Giftealo (Lato, azul), Enjoy (Outfit, acento ámbar) y Motiva (Geist, acento turquesa). Se activa con `data-brand` en `<html>`.

Alerta de accesibilidad para Giftealo: el azul de marca #009EDE con texto blanco da 3,0:1 y no cumple AA. El tema usa #0077A8 (5,0:1) para botones y deja #009EDE para acentos, ilustraciones y texto grande. Validar con el equipo de marca.

### Cobertura por producto

| Producto | Cobertura | Qué es propio del producto y se construye con el sistema |
| --- | --- | --- |
| Admin Zonacards | Completa | Pantallas de dominio (liquidaciones, lotes, ATC) armadas con organismos existentes |
| Admin Enjoy | Completa | Mismos patrones; tema Enjoy |
| Panel Wallet Motiva | Completa | Vista previa del pase Wallet (Apple/Google) como organismo propio; tema Motiva |
| Portal de empresas Giftealo | Completa | Inventario, envío con tabla editable, saldos y créditos, límites, equipo, API keys |
| E-commerce Giftealo | Completa en componentes | Secciones de marketing (hero, "Tenemos más para ti", FAQ, pie de página) se componen con cards, acordeón y layout 6; la tipografía Gotham Black de títulos requiere licencia |

### Ajustes de la versión 0.4

- **Gráficos:** encabezado con título y menú Descargar (PNG, Excel .xlsx, CSV con los filtros aplicados). Debajo, barra con vista Gráfico/Datos y filtros propios de cada gráfico (periodo, país, métrica, escala, comparar con periodo anterior). En móvil: menos etiquetas en ejes, leyenda abajo, barras más delgadas y filtros apilados.
- **Drawers y overlays:** 16 px entre campos; el mensaje vacío no reserva espacio dentro de un overlay.
- **Reordenar en cuadrícula:** el asa aparece al pasar el mouse o con foco sobre la tarjeta (patrón Canva) y siempre visible en táctil; el elemento que se arrastra queda como hueco punteado y la copia flotante con sombra suave.
- **Menú de acciones:** kebab vertical en variante Bold de Solar.
- **Acordeón:** uno abierto a la vez, varios abiertos con ícono, subtítulo y estado, sin bordes, ítem deshabilitado, Expandir/Contraer todo y flechas para recorrer encabezados.
- **Localización:** selector de idioma (por nombre, sin banderas) y de país de operación (bandera, moneda, documento y zona horaria) en la barra superior; en configuración también moneda de visualización, zona horaria y formato de fecha.
- **Logos:** Simple Icons (CC0) para medios de pago, redes y marcas, en color de marca o monocromo. LinkedIn, Amazon, Microsoft, Yape, Plin y bancos locales requieren el kit oficial de cada marca.
- Se descarta la etiqueta flotante: en todos los productos la etiqueta va arriba del campo.

## 8. Selectores custom y selector de país

No se usa el `<select>` nativo como experiencia visual. Cada selector mantiene estilo consistente, animación sutil (150–200 ms), teclado (flechas, Enter, Escape, escribir para saltar), foco visible y checkboxes cuando es multiselección. No todo es combobox: se usa el patrón que corresponde.

| Caso | Patrón | Búsqueda |
| --- | --- | --- |
| Tipo de documento (DNI, CE, RUC…) | `zc-select` | No (menos de 8 opciones) |
| Código de país / teléfono | `zc-phone-input` (combobox) | Sí, por nombre o prefijo |
| Categorías, marcas, clientes, campañas | `zc-combobox` | Sí; multiselección con checkboxes en filtros |
| Ciudades y niveles geográficos | `zc-combobox` encadenado (departamento → provincia → distrito) | Sí |
| Estados en filtros | `zc-combobox` multiselección | Solo si hay más de 8 |
| Ordenamiento | `zc-dropdown-menu` con opción marcada | No |
| Fechas y rangos | `zc-date-picker` | No aplica |
| Horarios | `zc-time-picker` | No aplica |
| 2 a 4 opciones excluyentes visibles | `zc-radio-group` o pestañas segmentadas | No |

Selector de código de país:

- Banderas de **flag-icons** (SVG, MIT), nunca emojis ni imágenes sueltas.
- El disparador muestra bandera SVG + código ("+51"); la lista muestra bandera, nombre del país y código.
- Los 6 países del alcance aparecen primero; el resto debajo, separados.
- `aria-label="Código de país, Perú +51"` en el disparador; opciones con `role="option"`.
- En móvil la lista se abre como bottom sheet con buscador fijo arriba.

## 9. Formularios

Todo formulario es reactivo y tipado, y maneja estos estados:

| Estado | Comportamiento |
| --- | --- |
| untouched | Sin errores visibles aunque el campo sea inválido |
| touched | Errores visibles al salir del campo |
| disabled | Campos y botón deshabilitados con motivo |
| loading | Botón principal con spinner y texto "Guardando…"; formulario bloqueado contra doble envío |
| success | Toast con enlace al registro y redirección o limpieza según el caso |
| error | Errores de campo bajo cada campo; error de servidor en `zc-alert` al tope con el ID de correlación |

Validaciones mínimas:

- **Requeridos:** marcados con asterisco y el texto "Obligatorio" accesible; la leyenda "\* Campo obligatorio" al inicio del formulario.
- **Email:** formato válido.
- **Documento:** obligatorio y con formato del país (RUC, NIT, RUT, RFC, DNI) y dígito verificador cuando aplica.
- **Código:** obligatorio; en giftcards, 16 dígitos con verificación Luhn.
- **Teléfono:** válido para el país elegido (largo y prefijo); obligatorio para envíos por WhatsApp.
- **Montos:** mayores a cero, con los decimales de la moneda.
- **Fechas:** fin posterior a inicio; vencimiento no anterior a hoy.

Mensajes en lenguaje claro, con qué falta y cómo corregirlo: "Ingresa un RUC de 11 dígitos", no "Campo inválido".

## 10. Iconografía, banderas e imágenes

### Íconos

- **Solar** es el set principal; si no existe el ícono, **Lucide**. Nunca mezclar dos íconos de sets distintos en un mismo grupo (por ejemplo, un menú).
- Estilo Solar **Linear** por defecto; **Bold** solo para el estado activo del menú y estados seleccionados.
- Se empaquetan en build desde `@iconify-json/solar` y `@iconify-json/lucide` a través de un único `zc-icon`: sin llamadas a internet en ejecución y solo con los íconos usados.
- Tamaños 16, 20 (por defecto) y 24 px; color heredado (`currentColor`).
- Ícono decorativo: `aria-hidden="true"`. Ícono que es el único contenido de un botón: `aria-label` en el botón.
- Sin emojis en ningún lugar de la interfaz.

Mapa base de íconos (Solar Linear salvo indicación):

| Concepto | Ícono |
| --- | --- |
| Dashboard | `widget-5` |
| Clientes | `buildings-2` |
| Campañas | `flag` |
| Giftcards | `gift` |
| Lotes | `box` |
| Envíos | `plain` |
| Stock | `layers` |
| ATC | `headphones-round` |
| Liquidaciones | `bill-list` |
| Pagos | `wallet-money` |
| Reportes | `chart-2` |
| Aprobaciones | `checklist-minimalistic` |
| Antifraude | `shield-warning` |
| Auditoría | `history` |
| Configuración | `settings` |
| Filtros | `filter` |
| Exportar | `download-minimalistic` |
| Estado activo / éxito | `check-circle` |
| Vencido | `clock-circle` |
| Anulado / error | `close-circle` |
| Advertencia | `danger-triangle` |

### Banderas

Librería **flag-icons** (SVG, MIT), a través de `zc-country-flag`. Proporción 4:3 en selectores y 1:1 en avatares. Siempre acompañadas del código o nombre del país.

### Imágenes

- Fuentes: Pexels, Unsplash o Pixabay (licencias libres). Se descargan al repositorio en `src/assets/images/<categoría>/` con un `CREDITS.md` de autor y enlace.
- Deben representar la categoría: gastronomía, experiencias, tecnología, moda, viajes, entretenimiento, hogar, salud y belleza. Nada aleatorio.
- Logos de marcas en los mocks: marcas ficticias con monograma generado; no usar logos reales de terceros.
- Formato WebP o AVIF, máximo 200 KB, al tamaño de uso (portada 1200 px de ancho, tarjeta 600 px, miniatura 160 px).
- `NgOptimizedImage` con `width`, `height`, carga diferida y `priority` solo en la imagen principal visible al cargar.

## 11. Datos simulados y seguridad simulada

Volumen mínimo de datos mock, repartido entre los 6 países, con nombres y marcas ficticios:

| Entidad | Cantidad |
| --- | --- |
| Clientes corporativos | 40 |
| Programas | 80 |
| Campañas (activas, por vencer, finalizadas) | 150 |
| Marcas (propias y de terceros) | 60 |
| Franquicias | 60 |
| Locales con coordenadas reales de cada ciudad | 300 |
| Giftcards (nominales y experiencias) | 120 |
| Lotes | 200 |
| Códigos de giftcard (paginados en servidor) | 10 000 |
| Transacciones | 20 000 |
| Liquidaciones en todas las etapas | 120 |
| Solicitudes de aprobación pendientes | 25 |
| Usuarios con los 7 roles plantilla y 2 roles personalizados | 30 |

Seguridad simulada:

- Sin credenciales reales: login simulado con usuarios de prueba por rol definidos en `src/mocks/users.ts`.
- La sesión vive en memoria con un token falso; solo se guarda en `sessionStorage` el rol y el idioma, nunca datos personales ni códigos.
- Rutas protegidas con guards por rol; una ruta sin permiso lleva a `zc-error-state` "Sin acceso", no a una pantalla en blanco.
- Sesión expirada: aviso al minuto 14 de inactividad y cierre al 15; una respuesta 401 del mock abre un modal para volver a ingresar sin perder la pantalla.
- Los mocks nunca generan CVV y devuelven los códigos ya enmascarados salvo el endpoint que el rol autorizado usa para el vale.
- Nada sensible en la URL, en `console.log` ni en mensajes de error.

## 12. Performance y escalabilidad

| Práctica | Regla |
| --- | --- |
| Carga diferida | Cada dominio con `loadChildren`; gráficos y mapas dentro de `@defer (on viewport)` |
| Componentes | Standalone, `ChangeDetectionStrategy.OnPush`, zoneless |
| Listas | `@for` con `track item.id`, nunca `track $index` en listas que cambian |
| Estado | Datos del servidor en servicios por dominio; estado de UI (abierto, seleccionado, pestaña) en signals del componente; derivados con `computed()` |
| Llamadas | `httpResource` o servicio con caché por clave; nunca la misma petición dos veces por pantalla; cancelar al salir |
| Imágenes | `NgOptimizedImage`, tamaños reservados (CLS menor a 0.1) |
| Presupuestos | Bundle inicial menor a 500 KB comprimido; cada dominio menor a 250 KB; falla el build si se excede |
| Métricas objetivo | Lighthouse en desktop: Performance 90 o más, Accesibilidad 95 o más; LCP menor a 2.5 s en 4G simulada |

Criterios de escalabilidad verificables:

- Agregar un país = agregar datos de configuración; cero cambios de código en `features/`.
- Agregar un idioma = agregar un JSON de traducción; cero textos fijos en templates (lint que lo detecta).
- Agregar un reporte = configurar filtros y columnas sobre la plantilla P4, sin componente nuevo.
- Ningún `features/<dominio>` importa de otro dominio (regla de lint de límites).
- Cambiar la marca = cambiar el bloque `--brand-*` y la variable de tipografía.

## 13. QA visual y definición de terminado

QA visual automatizado con Playwright:

- Captura de cada componente del design system en 4 combinaciones: claro y oscuro, 375 y 1440 px. Diferencia máxima tolerada 0.1% contra la línea base aprobada.
- Captura de cada pantalla en sus 5 estados (con datos, cargando, vacío, sin resultados, error).
- Revisión automática de accesibilidad con axe-core en cada captura; cero violaciones serias o críticas.
- Prueba de cada journey de la sección 3 en móvil y desktop.
- La línea base se actualiza solo cuando el diseño cambia a propósito y lo aprueba diseño.

Una pantalla está terminada cuando:

- [ ] Usa solo componentes del inventario y tokens; sin colores, tamaños ni textos fijos
- [ ] Vista por defecto en tarjetas; tabla solo como alternativa en desktop
- [ ] Funciona con datos mock de al menos 2 países y en español e inglés
- [ ] Tiene estados cargando, vacío, sin resultados, error y sin permiso
- [ ] Pasa en 375, 768, 1024 y 1440 px sin desplazamiento horizontal
- [ ] Pasa en tema claro y oscuro con contraste AA
- [ ] Se opera completa con teclado y tiene foco visible
- [ ] Targets de 48 px con mouse y 56 px en táctil
- [ ] Cumple los presupuestos de performance
- [ ] Capturas visuales y prueba del journey en verde

## 14. Design system verificable

Antes de diseñar o maquetar pantallas, el design system se construye y aprueba como página única: [Zonacards · Design system](https://claude.ai/artifact/NxPTJYiuVmsfawYE6FnpKd). Muestra los componentes del inventario con variantes y estados, en tema claro, oscuro y automático, y se adapta de 375 a 1440 px.

Lo que se puede verificar en esa página:

- Contraste real de cada par de colores en el tema activo, calculado en vivo.
- Selectores custom con teclado (flechas, Enter, Escape, escribir para saltar), búsqueda y multiselección con checkboxes.
- Teléfono con bandera SVG y código de país, que valida el largo según el país.
- Formulario con untouched, touched, loading, success y error, con resumen de errores que recibe el foco.
- Filtros en drawer (desktop) y bottom sheet (móvil), modal crítico con motivo, toasts anunciados por lector de pantalla.
- Tarjetas por defecto con alternativa de tabla solo en desktop; montos formateados por país.

En Angular, este mismo contenido se convierte en la ruta interna `/catalogo` de la etapa 3, y sus capturas son la línea base del QA visual. Los íconos de la página ya son Solar y Lucide reales y las banderas son de flag-icons; el mapa no muestra teselas porque la vista previa bloquea recursos externos, y las imágenes son ilustraciones de marcador de posición hasta elegir las fotos.

## 15. Comportamiento esperado por componente

Cada componente se acepta solo si cumple su fila. "Móvil" significa menos de 768 px o pantalla táctil.

| Componente | Interacción y teclado | Estados obligatorios | Móvil |
| --- | --- | --- | --- |
| Button | Enter y Espacio; foco visible; solo ícono exige `aria-label` y tooltip | default, hover, focus, active, disabled con motivo, loading (sin doble envío) | 56 px; acción principal de pantalla a todo el ancho al pie |
| Input / Textarea | Etiqueta arriba, siempre visible; filtra caracteres no permitidos mientras se escribe | untouched, touched, error, éxito, disabled, readonly | Teclado adecuado (`inputmode`) |
| Field | Etiqueta (20 px) · control · una línea de mensaje que comparten ayuda y error; el ícono (?) explica términos | Mensaje de ayuda, error, éxito | Igual; dentro de overlays el mensaje vacío no ocupa espacio |
| Select / ComboBox | Flechas, Enter, Escape, escribir para saltar; búsqueda si hay más de 8 opciones; multiselección con Limpiar/Listo | vacío, con valor, sin resultados, disabled | Bottom sheet; dentro de un sheet o drawer se abre como subpantalla con Volver |
| Autocomplete | Sugerencias tras 2 letras con espera de 250 ms; recientes al enfocar; Escape borra | cargando, sin resultados, crear o buscar en todo | Lista bajo el campo, sin sheet |
| DateField / RangePicker | Se escribe con máscara o se elige; flechas en calendario; atajos y periodos predefinidos | fecha inválida, fuera de rango, rango incompleto | Un solo mes; subpantalla si está dentro de un sheet |
| Número, monto, teléfono, documento | Rechazan caracteres inválidos; −/+ y flechas en número; formato al salir | fuera de rango, largo incorrecto | Teclado numérico |
| Checkbox / Radio / Switch | Toda la fila es clicable; Espacio | checked, indeterminado, disabled | 56 px de alto |
| Tabs / segmentado | Flechas izquierda/derecha; uno seleccionado | — | Desplazamiento horizontal con degradado si no caben |
| Accordion | Enter/Espacio abre; flechas recorren encabezados; "Expandir todo" si hay varios | abierto, cerrado, deshabilitado | Igual |
| Menú kebab | Abre y cierra con el mismo botón; flechas; Escape devuelve el foco | ítem deshabilitado con motivo, destructivo | Bottom sheet |
| Tooltip | Aparece con mouse y con foco; Escape lo oculta; nunca contiene acciones | — | Se reemplaza por texto visible o (?) que abre popover |
| Modal | Atrapa el foco; Escape cierra; el foco vuelve al disparador | — | Bottom sheet |
| AlertDialog | Acción destructiva con motivo y, si es masiva, confirmación escrita | botón deshabilitado hasta completar | Bottom sheet |
| Drawer | Encabezado con título, subtítulo, metadatos y cerrar; pie fijo con acciones | — | Pantalla completa o bottom sheet |
| Toast | Se anuncia (`aria-live`); se cierra solo a los 6 s, salvo errores con acción | éxito, error, info, con acción | Ancho completo al pie |
| Tarjeta | Toda la tarjeta abre el detalle; las acciones van en botones propios | hover, foco, seleccionada | Una columna; KPI en dos |
| Data view | Tarjetas por defecto; tabla como alternativa | — | Solo tarjetas, sin selector de vista |
| Data table | Orden con `aria-sort`; selección con barra de acciones masivas; columnas fijas con sombra | cargando, vacía, sin resultados, error | Se convierte en tarjetas; columnas y densidad se ocultan |
| Paginación | Compacta; Enter en "Ir a página" | — | "Cargar más" |
| Gráfico | Título con la conclusión; descargar solo con ícono (PNG, Excel, CSV); vista Gráfico/Datos; filtros propios | sin datos, error de carga | Menos etiquetas, leyenda abajo, filtros apilados |
| Reordenar | Asa visible al pasar el mouse; Espacio, flechas, Espacio; menú Subir/Bajar | arrastrando, soltado, cancelado | Asa siempre visible |
| Carga de archivos | Arrastrar o elegir; valida antes de subir | subiendo, listo, error con detalle por fila | Solo botón "Elegir archivo" |
| Cupones | Hasta 3; Enter aplica; cada uno se quita aparte | validando, aplicado, no existe, vencido, repetido, no combinable, máximo | Igual |

## 16. Reglas de composición, responsive y overlays

### Paginación y conteos

- Sin paginador si los resultados caben en una página; el conteo ("8 lotes") va siempre en el encabezado de la lista.
- Con filtros activos, el conteo dice "4 de 8 lotes" y aparecen los chips de filtros con "Limpiar todo".
- Paginación compacta en desktop; "Cargar más" en móvil y en vistas de tarjetas largas.

### Barra de acciones de una lista

| Elemento | Desktop | Móvil |
| --- | --- | --- |
| Acción principal ("Nuevo lote") | Botón a la derecha del título | Botón a todo el ancho bajo el título |
| Acciones secundarias (carga masiva) | Botón outline | Dentro de un menú "Más acciones" |
| Descargar | Ícono con tooltip y menú (Excel, CSV, PDF) | Dentro de "Más acciones" |
| Filtros | Buscador + 3 filtros visibles + "Más filtros" (drawer) | Buscador + un botón "Filtros (n)" que abre un bottom sheet |
| Orden | Selector junto al conteo | Igual, compacto |
| Vista tarjetas/tabla | Desde 1024 px | No existe |

### Overlays: uno solo a la vez en móvil

- En móvil nunca se abre un bottom sheet sobre otro. Un selector, calendario o menú dentro de un sheet o drawer se abre como subpantalla del mismo contenedor, con título y botón Volver, como en una app nativa.
- En desktop los menús y popovers pueden abrirse sobre un drawer o modal, siempre por encima (capa superior) y con el foco dentro.
- Un modal solo puede abrirse sobre un drawer para confirmar una acción de ese drawer.
- Escape o Volver cierran solo la capa superior y el foco vuelve a su disparador.

### Espacios y alineación

| Contexto | Separación | Token |
| --- | --- | --- |
| Ícono y texto, botones de una fila, chips | 8 px | `--space-inline` |
| Elementos de un mismo grupo (accesos con terceros, opciones bajo un campo) | 12 px | `--space-group` |
| Entre campos de un formulario | 16 px vertical, 20 px horizontal | `--space-field`, `--space-field-x` |
| Entre campos dentro de drawers, modales y sheets | 16 px; el mensaje vacío no reserva espacio | `--space-field` |
| Entre bloques de un panel o de una lista (tarjetas, KPI, filtros) | 16 px | `--space-block` |
| Entre los bloques de una página (encabezado, KPI, filtros, resultados) | 16 px en móvil, 24 px desde 768 px | `--space-page-block` |
| Entre secciones de una página | 32 a 48 px (40 px) | `--space-section` |
| Entre los elementos de una tarjeta | 16 px | `--space-card` |
| Borde interno de una tarjeta | 16 px en móvil, 20 px desde 768 px | `--space-card-inset` |
| Margen lateral de la página | 16 px en móvil, 32 px desde 768 px | `--margin-page` |
| Margen superior e inferior de la página | 24 px | `--margin-page-y` |
| Ancho máximo del contenido | 1200 px (880 px en un formulario o flujo de un paso) | `--content-max`, `--content-narrow` |

Los tokens están en `tokens.css` (con los valores de móvil en Android e iOS: `ZcSpacing` y `ZCSpacing`). En Tailwind se escriben con la sintaxis directa (`gap-(--space-field)`, `p-(--space-card-inset)`, `px-(--margin-page)`, `max-w-(--content-max)`): se usan los nombres semánticos en vez de la escala suelta (`gap-5`) para estas relaciones.

- Todo ícono junto a texto va centrado con `inline-flex`; en varias líneas se alinea a la primera.
- Los grid y flex usan `minmax(0, 1fr)` y `min-width: 0`: ningún contenido largo (correos, montos, nombres) empuja el layout fuera de la pantalla. Se trunca con puntos suspensivos y el texto completo va en tooltip o `title`.
- Ningún elemento se solapa con otro salvo los diseñados para eso (grupos de avatares, columnas fijas de tabla con sombra).
- Ninguna pantalla tiene desplazamiento horizontal en 360, 390, 768, 1024, 1280 y 1440 px. Solo las tablas, pestañas y carruseles se desplazan dentro de su contenedor.

### Verificación automática

El QA visual (sección 13) incluye una auditoría que en esos 6 anchos detecta: desplazamiento horizontal, elementos fuera de su contenedor, solapamientos entre hermanos y espacios verticales mayores a 40 px dentro de tarjetas, paneles y campos. Una pantalla no se aprueba con hallazgos sin justificar.

## 17. Fundamentos agregados en la versión 0.6

### Tipografía

Zonacards usa **Figtree** por defecto (Enjoy mantiene Outfit, Giftealo Lato y Motiva Geist). Se cambia con `--zc-font-sans`. Figtree tiene mayor altura de minúscula y letras más abiertas que Outfit, por lo que se lee mejor en tablas densas y tamaños de 12 a 14 px; Outfit es más geométrica y tiene más personalidad en títulos. Antes de cerrar la decisión, verificar que la versión que se use incluya cifras tabulares (`tnum`) para alinear montos.

### Paleta extendida

Escalas de 11 pasos (50 a 950) para navy y celeste Giftealo, ámbar, neutro, verde, rojo, azul, violeta y turquesa, más tres paletas de datos: categórica de 8 colores apta para daltonismo, secuencial y divergente. Los componentes solo usan tokens semánticos; las escalas definen esos tokens y alimentan gráficos e ilustraciones.

### Fechas y horas

| Formato | Ejemplo (es) | Uso |
| --- | --- | --- |
| short | 1/3/26 | Tablas densas y celdas estrechas |
| medium | 1 Mar, 2026 | Por defecto en tarjetas, listas y detalle |
| long | 1 de marzo de 2026 | Documentos, correos, textos legales |
| full | Domingo, 1 de marzo de 2026 | Agenda, programación de envíos, confirmaciones |
| Hora | 2:30 p. m. | Junto a una fecha. En tablas, con dos dígitos: 02:30 p. m. |
| Fecha y hora | 1 Mar, 2026 · 2:30 p. m. | Auditoría, historial, transacciones |
| Relativa | hace 3 horas · dentro de 3 días | Notificaciones y actividad, con la fecha completa en tooltip |
| Rango | 1–15 mar 2026 | Periodos, vigencias, filtros |
| Mes | Marzo de 2026 | Reportes y liquidaciones mensuales |
| ISO 8601 | 2026-03-01 | Exportaciones, API y nombres de archivo |

Todas se generan con Intl en el idioma y la zona horaria del país; el día de la semana siempre se calcula.

### Acceso con terceros y autenticación

- Botones de Google, Apple y Microsoft según sus guías oficiales, con logos del repositorio gilbarbara/logos (CC0); en producción, descargar los recursos oficiales de cada marca.
- Organismo `zc-auth`: variante administrador (Microsoft Entra ID vía Keycloak + correo para externos) y variante portal/e-commerce (Google, Apple y correo); recuperar contraseña, registro, segundo factor con reenvío temporizado y códigos de recuperación, aviso de 3 intentos restantes, bloqueo de 15 minutos tras 5 fallos, aviso de Bloq Mayús y mensajes que no revelan si una cuenta existe.

### Editor de texto enriquecido

`zc-rich-text`: negrita, cursiva, subrayado, tachado, título, cita, listas, enlace, quitar formato, deshacer y rehacer; atajos de teclado; barra navegable con flechas; pegado como texto plano; salida HTML sanitizada (solo etiquetas permitidas y enlaces http, https o mailto). En Angular se recomienda TipTap (ngx-tiptap) con la misma barra y las mismas reglas de sanitización.

### Gestión de errores

| Situación | Patrón |
| --- | --- |
| Página no encontrada, sin acceso, error del servidor, mantenimiento, sin conexión, sesión expirada | Página de error con explicación, acción principal y referencia cuando aplica |
| Un bloque del dashboard falla | Error solo en ese bloque, con reintento automático (2, 4 s) y botón "Reintentar ahora"; el resto sigue funcionando |
| Acción masiva con fallos parciales | "Enviamos 47 de 50"; lista de fallidos con motivo, reintentar solo esos y descargar detalle |
| El servidor rechaza un dato (409, 422) | Error en el campo afectado + alerta arriba; el resto del formulario se conserva |
| Sin conexión | Aviso persistente y cola de cambios que se sincroniza al reconectar |
| Demasiadas solicitudes (429) | Aviso con cuenta regresiva y botón deshabilitado hasta poder reintentar |
| Soporte necesita el detalle | "Ver detalles técnicos" (referencia, código, servicio, fecha) y "Copiar detalles" |

Regla de redacción: qué pasó, qué se conservó, qué hacer (un botón) y referencia solo si se necesita soporte. Nunca un código solo ni un stack trace.

### Gráficos de operación

Además de línea, barras, barras apiladas y dona: embudo (emisión a consumo), cascada (liquidación bruta a neta), mapa de calor día × hora (canjes), mapa de árbol (categoría y marca), calendario de vencimientos, Sankey (canal a estado) y medidor de meta.

## 18. Ecosistema Promotick: alcance del design system

Zonacards es una de varias plataformas de Promotick (programas de puntos, clubes de beneficios, gift cards, regalos y experiencias, pago de incentivos, trade marketing) que operan en 10 países. El design system se organiza en un núcleo común y paquetes por dominio para que todas se construyan igual.

### Arquitectura de paquetes

| Paquete | Contenido | Lo usan |
| --- | --- | --- |
| `@promotick/tokens` | Color, tipografía, espacio, radios, sombras, movimiento; temas por marca y modo oscuro | Todas, web y móvil |
| `@promotick/ui` | Átomos, moléculas y organismos genéricos de este sistema | Todas las web |
| `@promotick/ui-data` | Tablas, gráficos, filtros, exportación, reportes | Paneles y reportería |
| `@promotick/ui-commerce` | Catálogo, producto, carrito, checkout, cupones, pagos | E-commerce, portales, canje |
| `@promotick/ui-loyalty` | Saldo de puntos, niveles, pase Wallet, canje de beneficios | Clubes, programas de puntos, Motiva |
| `@promotick/ui-ops` | Logística, almacén, órdenes, conciliación | Operaciones, fulfillment |
| Plantillas de correo y PDF | Vales, comprobantes, notificaciones | Todas |

### Organismos que faltan mapear (por prioridad)

| Prioridad | Dominio | Organismos |
| --- | --- | --- |
| 1 | Transversal | Onboarding y tour guiado, centro de ayuda y chat, perfil y preferencias, gestión de sesiones y dispositivos, API keys y webhooks, programador de tareas (envíos y reportes programados), visor de archivos (PDF, imagen) |
| 1 | Reportes | Constructor de reportes (campos, filtros, agrupación), tabla dinámica, dashboards configurables con widgets arrastrables, exportaciones programadas |
| 1 | Reglas | Constructor de reglas (si / entonces) para antifraude, promociones, límites y segmentación |
| 2 | Canje (usuario final y comercio) | Escáner de QR y código de barras con cámara, ingreso de PIN, validación de canje con resultado grande (válido / ya canjeado / vencido), historial de canjes, modo sin conexión |
| 2 | Fidelización | Saldo y movimientos de puntos, niveles y progreso, catálogo de premios con puntos, diseñador de pase Wallet (Apple y Google) |
| 2 | Logística y almacén | Seguimiento de envío (línea de tiempo y mapa), guía y etiqueta, recepción y conteo de inventario, kardex, picking con escáner, tablero kanban de pedidos |
| 2 | Órdenes y NetSuite | Orden de compra y de venta (cabecera, líneas, totales, impuestos), estado de sincronización con NetSuite y reintento, conciliación |
| 3 | CRM y marketing | Ficha 360 de contacto, actividad, segmentador de audiencias, constructor de campañas, editor de correo por bloques, resultados de campaña |
| 3 | Finanzas y contabilidad | Factura y nota de crédito, conciliación bancaria, asientos contables, cierre de periodo, aprobaciones por montos |
| 3 | Trade marketing | Formulario de auditoría en punto de venta con fotos y geolocalización, checklist, ruta de visitas |

### Componentes para estandarizar en todas las plataformas

Avatar de entidad (persona, empresa, marca), selector de entidad con búsqueda, campo de dirección por país, campo de documento de identidad (DNI, CE, pasaporte, RUC, NIT, RUT, RFC, CUIT), cantidad con unidad (puntos, unidades, moneda), estado de sincronización, indicador de entorno (QA, producción), selector de programa o cliente activo, escáner de códigos, firma en pantalla, mapa con selección de punto, línea de tiempo de estados, comentarios con menciones, adjuntos, árbol jerárquico (categorías, regiones), lista transferible (asignar elementos de una lista a otra) y calendario de agenda.

### Qué falta para un design system completo

| Área | Pendiente |
| --- | --- |
| Gobierno | Responsable definido (Kevin López); falta el proceso para proponer componentes, versionado semántico y registro de cambios |
| Documentación | Storybook (o similar) con cada componente, sus propiedades, estados y ejemplos de código; este HTML es la base de contenido |
| Tokens multiplataforma | Exportar los tokens con Style Dictionary a CSS, Tailwind, Flutter, Swift y Kotlin para las apps de canje y validación |
| Contenido | Guía de voz y tono, glosario (giftcard, lote, canje, liquidación), reglas de mayúsculas, números y monedas |
| Movimiento | Duraciones y curvas por tipo de transición, y su versión reducida |
| Ilustración e imagen | Estilo de ilustraciones para estados vacíos y onboarding; criterios de fotografía por categoría |
| Accesibilidad | Pruebas con lector de pantalla (NVDA, VoiceOver) por componente y auditoría externa anual |
| Calidad | Pruebas visuales y de accesibilidad por componente en el pipeline, presupuesto de rendimiento por paquete |
| Plantillas de salida | Correos transaccionales, PDF de vales y comprobantes, pases Wallet, con los mismos tokens |

## 19. Gobierno y organización del sistema

**Responsable:** Kevin López, Regional Product Design Lead. Aprueba componentes nuevos, cambios de tokens y excepciones a estas reglas.

### Grupos por nivel

El design system se navega por nivel atómico y, dentro de cada uno, por grupo funcional (21 grupos):

| Nivel | Grupos |
| --- | --- |
| Fundamentos | Marca y color · Tipografía y formatos · Espacio e interacción · Iconografía y logos |
| Átomos | Acciones · Entrada de datos · Datos y estado |
| Moléculas | Formularios · Acceso · Navegación · Feedback y contenido |
| Organismos | Estructura y acceso · Datos y análisis · Búsqueda y filtros · Flujos · Dominio y comercio · Móvil y canje · Estados y errores · Medios |
| Plantillas y páginas | Plantillas · Páginas |

En el código, la misma agrupación se refleja en carpetas: `shared/ui/<nivel>/<grupo>/<componente>`.

### Espaciado de autenticación (y de cualquier tarjeta de formulario)

| Relación | Espacio |
| --- | --- |
| Entre bloques (encabezado, accesos con terceros, separador, error, formulario, aviso legal) | 24 px |
| Dentro de un grupo (botones de acceso, opciones bajo el código) | 12 px |
| Código OTP y su mensaje | 8 px |
| Entre campos del formulario | 16 px |
| Título y subtítulo | 8 px |

### ¿Se pueden construir los organismos pendientes con lo que ya existe?

La mayoría sí. Solo hacen falta 9 piezas nuevas, marcadas en la última columna.

| Organismo | Se arma con | Falta crear |
| --- | --- | --- |
| Onboarding y tour guiado | Popover, stepper, botones, guía de inicio descartable | Resaltado del elemento señalado (spotlight) |
| Centro de ayuda y chat | Autocomplete, acordeón, drawer, textarea, timeline | Burbujas de conversación |
| API keys y webhooks | Secret field, tabla, alert dialog, badge | — |
| Tareas programadas | Date y time field, select, tabla, badge | Selector de recurrencia (diario, semanal, mensual) |
| Constructor de reportes | Combobox multiselección, reordenar, filtros, tabla, gráficos, exportar | — |
| Dashboard configurable | Cards, gráficos, reordenar en cuadrícula, drawer de catálogo | Redimensionar widgets |
| Constructor de reglas | Select, número, monto, chips, botones | Bloque de condición anidado (Y / O) |
| Validación de canjes | Escáner QR, PIN, bottom sheet, resultado, historial con deslizar | — (incluido en esta versión) |
| Puntos y niveles | KPI, progreso, meter, timeline, cards | — |
| Diseñador de pase Wallet | Color picker, carga de imágenes, campos, vista previa | Vista previa Apple/Google del pase |
| Seguimiento logístico | Timeline, mapa, badge, descripción | — |
| Almacén y kardex | Tabla editable, número, escáner, filtros | — |
| Kanban de pedidos | Cards, reordenar | Columnas con arrastre entre listas |
| Órdenes de compra y venta (NetSuite) | Tabla editable, monto, descripción, badge de sincronización, errores con reintento | — |
| CRM: ficha 360 | Entity header, pestañas, timeline, cards | — |
| Segmentador de audiencias | Mismo bloque de condición del constructor de reglas | (ver constructor de reglas) |
| Editor de correo por bloques | Texto enriquecido, reordenar, carga de imágenes, color picker | Bloques de contenido arrastrables con vista previa de correo |
| Facturas y conciliación | Tabla, monto, upload, descripción, aprobaciones | — |
| Auditoría en punto de venta | Formulario por pasos, carga de imágenes, mapa, checklist | Firma en pantalla |

### Componentes para app móvil y responsive

Ya incluidos: escáner QR y de código de barras, teclado PIN con biometría, barra superior con volver, navegación inferior, deslizar para actualizar, acciones al deslizar, botón principal fijo, resultado de pantalla completa, avisos del sistema (sin conexión, actualización), bottom sheet con subpantallas y áreas seguras.

Pendientes para las apps nativas: pedir permisos (cámara, notificaciones, ubicación) con pantalla previa que explica el motivo, notificaciones push, modo kiosco para caja, impresión de comprobante por Bluetooth y lectura de NFC.

## 20. Ajustes de la versión 0.8

### Formato de hora

- Por defecto, 12 horas con "a. m." y "p. m." en minúscula, con punto y espacio ("2:30 p. m."): es el estándar de los países de Latinoamérica en CLDR (la base de datos de formatos regionales que usan los navegadores) y la grafía que recomienda la RAE. "AM/PM" en mayúscula es la forma del inglés.
- En tablas y registros se usa la hora con dos dígitos ("02:30 p. m.") para que las columnas queden alineadas.
- España usa 24 horas por defecto. Cada usuario puede elegir 12 h o 24 h en su perfil.

### Sidebar

El sidebar es un área propia: fondo de superficie (blanco en tema claro), borde de 1 px a la derecha y contenido sobre el fondo gris neutro. En tema oscuro, sidebar en neutro 900 sobre fondo 950. Hay dos variantes aprobadas: tinte de marca suave sin borde y marca oscura (navy) para productos que quieran más presencia de marca. El elemento activo usa un fondo de superficie 2 y el ícono en Bold.

### Piezas nuevas

| Componente | Nivel | Qué resuelve |
| --- | --- | --- |
| `zc-recurrence` | Molécula | Frecuencia, intervalo, días, día del mes o enésimo día, hora y fin; frase resumen y próximas fechas |
| `zc-signature` | Molécula | Dibujar o escribir el nombre (alternativa accesible), deshacer, limpiar, validación y sello de fecha y hora |
| `zc-chat` | Organismo | Burbujas con estado de envío y lectura, escribiendo, respuestas rápidas, artículos de ayuda y paso a asesor |
| `zc-tour` | Organismo | Resaltado del elemento real, máximo 5 pasos, Atrás, Siguiente, Saltar, Escape y foco atrapado; en móvil, tarjeta abajo |
| `zc-dashboard-grid` | Organismo | Modo edición, reordenar, ancho de 1, 2 o 4 columnas por arrastre o menú, catálogo de widgets y restablecer del rol |
| `zc-rule-builder` | Organismo | Condiciones con Y / O y un nivel de grupos, frase resumen y prueba sobre datos reales |
| `zc-email-builder` | Organismo | Bloques reordenables, panel de propiedades con control de contraste y vista previa escritorio/celular |
| `zc-kanban` | Organismo | Columnas con límite de trabajo en curso, arrastre entre columnas, teclado y menú "Mover a"; en móvil, una columna con pestañas |
| `zc-wallet-pass` | Organismo | Vista previa en Apple y Google Wallet, frente y reverso, colores con contraste, campos y código QR |
| `zc-permission-prompt` y `zc-push-preview` | Organismo | Pantalla previa antes del permiso, permiso negado con camino a Ajustes y notificaciones push sin datos sensibles |

Con estas piezas, los 19 organismos mapeados en la sección 19 ya pueden construirse con componentes del sistema. Siguen pendientes, por ser capacidades nativas y no componentes visuales: modo kiosco, impresión por Bluetooth y lectura NFC.

## 21. Ajustes de la versión 0.9

### Bottom sheets

| Elemento | Regla |
| --- | --- |
| Asa (grabber) | Siempre arriba al centro; indica que se puede deslizar para cerrar |
| Título y X | Siempre. La X es el cierre explícito y accesible; deslizar y tocar el scrim son atajos, no el único camino |
| Scrim | Negro con opacidad (45 % en claro, 60 % en oscuro), sin difuminado: el blur cuesta rendimiento en teléfonos de gama media y hace perder contexto. Tocar el scrim cierra |
| Volver | Solo en subpantallas (un selector dentro del sheet): flecha a la izquierda del título; la X cierra todo el sheet |
| Pie | Dos botones del mismo ancho y alto (56 px): secundario en outline (Limpiar, Cancelar) y primario con el resultado ("Ver 12 lotes") |
| Apilado | Nunca un sheet sobre otro |

### Campos con ícono

Cada campo tiene un solo ícono, a la derecha, que abre sus opciones: calendario en fecha y periodo (popover en desktop, bottom sheet en móvil) y reloj en hora (`HH:MM` + reloj). Los selectores mantienen su flecha. El texto del periodo se acorta al nombre del preset ("Últimos 30 días") y las fechas completas van en el nombre accesible y el tooltip.

### Textos largos

- Se prefieren saltos de línea al truncado en títulos, subtítulos, KPI, nombres de archivo y líneas de carrito.
- Truncar solo en celdas de tabla de una línea y en el valor de un selector, siempre con el texto completo en tooltip o en el nombre accesible.
- Descripciones largas en opciones usan "Leer más".
- Elementos decorativos (íconos de tarjetas de ayuda, imágenes de opciones, íconos de KPI) se reducen o se ocultan por debajo de 600 o 400 px antes que apretar el texto.

### Formularios de filtros unificados

Todas las pantallas usan el mismo bottom sheet de filtros en móvil: campos (selectores multiselección que abren subpantallas, periodo, rango) y pie Limpiar / Ver N. El acordeón de facetas con checkboxes queda solo para la columna lateral de desktop.

### Tabla editable y carrito

- La tabla editable se convierte en tarjetas por destinatario en móvil, con etiquetas visibles, errores por campo y cantidad con −/+.
- La línea de carrito usa dos filas: imagen + nombre y detalle (con saltos de línea) arriba; cantidad, eliminar y precio abajo. Si no cabe, el precio pasa a su propia línea alineado a la derecha.
- Checkout en desktop a dos columnas: pasos a la izquierda y carrito fijo a la derecha; en móvil, carrito arriba y pasos debajo.

### Sidebar en móvil

Se abre como drawer desde la izquierda y se cierra con la X del encabezado, tocando el scrim, con Escape o al elegir una opción; al cerrar, el foco vuelve al botón de menú. Mientras está abierto, el foco queda dentro. En móvil siempre se muestra expandido (sin riel) y sin el botón "Contraer menú"; el ancho es 288 px o el 88 % de la pantalla, lo que sea menor.
