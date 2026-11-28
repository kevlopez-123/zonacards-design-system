# Revisión contra HeroUI (web y nativo)

Comparación del sistema de diseño Zonacards con la lista de componentes de HeroUI React v3.2.8 (https://heroui.com/en/docs/react/components, leída el 27 nov 2026: 73 componentes gratis y 69 de pago, en total 142). No es un benchmark de calidad: dice **qué cubrimos, qué no y si la falta importa** para las apps de Zonacards (administrador web, portal y apps móviles de gift cards, lealtad y comercio).

Cómo se hizo: nombres de HeroUI tomados de su página (sin visitar la de cada componente); lo nuestro, de los selectores de `projects/zonacards-ui`, de `references/compose-api.md` y de `references/swift-api.md`. No se probó el comportamiento de los componentes de HeroUI; se compara existencia y alcance, no calidad.

Leyenda: **sí** existe · **parcial** existe pero cubre menos · **no** no existe · **n/a** no aplica en esa plataforma (táctil, o decisión de diseño).

## Componentes gratis de HeroUI

| HeroUI | Web | Android | iOS | Nota |
| --- | --- | --- | --- | --- |
| Button | sí | sí | sí | Variantes primaria, secundaria, contorno, fantasma, peligro, enlace |
| ButtonGroup | sí (`zcButtonGroup`) | no | no | Poca falta: `Segmented` cubre el caso de elegir |
| CloseButton | sí | sí (`ZcIconButton`) | sí (`ZCIconButton`) | |
| ToggleButton | parcial | parcial | parcial | Un botón que se enciende y apaga se arma con `Chip` o `Switch`; no hay pieza propia |
| ToggleButtonGroup | sí (`zc-segmented`) | sí | sí | |
| Checkbox | sí | sí | sí | Estado mixto con anuncio a lector de pantalla en las tres |
| CheckboxGroup | sí (`zc-checkbox-group`) | sí (`ZcCheckboxGroup`) | sí (`ZCCheckboxGroup`) | Hecho el 27 nov 2026: una etiqueta para el grupo, "Seleccionar todo" a medias, ayuda y error |
| Description, Label, ErrorMessage, FieldError | sí (`zc-field`) | sí (`ZcField`) | sí (`ZCField`) | |
| Fieldset | sí (`zc-fieldset`) | sí (`ZcFieldset`) | sí (`ZCFieldset`) | Hecho el 27 nov 2026: leyenda que el lector de pantalla anuncia, descripción y borde opcional |
| Form | parcial | parcial | parcial | Plantillas de formulario y resumen de errores; sin un contenedor `Form` con validación común |
| Input, TextField, TextArea | sí | sí | sí | |
| InputGroup | sí | parcial | parcial | Nativo: campos con ícono, prefijo o sufijo propios (monto, teléfono) |
| InputOTP | sí | sí | sí | Más `PinPad` en nativo |
| NumberField | sí | sí | sí | |
| RadioGroup | sí | sí | sí | Variante de tarjetas en web |
| SearchField | sí | sí | sí | |
| Calendar | sí | sí | sí (`ZCCalendar`) | Hecho en iOS el 27 nov 2026 |
| DateField, DatePicker | sí | sí | sí | |
| DateRangePicker, RangeCalendar | sí | sí | sí (`ZCDateRange`) | Hecho en iOS el 27 nov 2026, igual que Android (periodos, comparar, Desde y Hasta escribibles) |
| TimeField | sí | sí | sí | |
| Accordion, Disclosure, DisclosureGroup | sí | sí | sí | |
| Breadcrumbs | sí | n/a | n/a | En móvil se navega con Volver |
| Link | sí | sí (botón enlace) | sí | |
| Pagination | sí | n/a | n/a | En móvil, "Cargar más" |
| Tabs | sí | sí | sí | |
| AlertDialog, Modal, Sheet, Drawer | sí | sí | sí | Móvil: hoja inferior; nunca una hoja sobre otra |
| Popover | sí | parcial | n/a | En móvil un popover pasa a hoja |
| Toast | sí | sí | sí | |
| Tooltip | sí | sí | n/a | iOS táctil no tiene |
| Dropdown | sí (`zc-menu`) | sí | sí | |
| ListBox | sí | parcial | parcial | Dentro de `Select` |
| TagGroup | sí | sí | sí | `TagsField` |
| Slider | sí | sí | sí | Más rango |
| Switch | sí | sí | sí | |
| Alert | sí | sí | sí | |
| Meter, ProgressBar, ProgressCircle | sí | sí | sí | `Progress` con variantes barra, circular y medidor |
| Skeleton, Spinner | sí | sí | sí | |
| Card | sí | sí | sí | |
| Separator | sí | sí | sí | |
| Surface | n/a | n/a | n/a | Se resuelve con tokens (`bg-surface`) |
| Toolbar | parcial | no | no | Barra de filtros y acciones de página |
| Avatar, AvatarGroup | sí | sí | sí | |
| Autocomplete, ComboBox | sí | sí (`ZcAutocomplete`) | sí (`ZCAutocomplete`) | El `Select` nativo ya filtraba (búsqueda desde 9 opciones, con coincidencia resaltada); lo que faltaba era la búsqueda en el servidor, con espera, mínimo de letras, "Buscando…" y "Crear" |
| Select | sí | sí | sí | |
| Kbd | sí (`kbd[zcKbd]`) | n/a | n/a | Corregido: la primera versión de esta revisión decía que no existía |
| Typography | sí (tokens) | sí (`ZcText`) | sí (`ZCText`) | |
| ColorField, ColorPicker | sí | no | no | |
| ColorArea, ColorSlider, ColorSwatch, ColorSwatchPicker | no | no | no | Poco uso en las apps actuales |
| ScrollShadow | sí (`zcScrollArea`) | n/a | n/a | |
| Badge, Chip | sí | sí | sí | |
| Table | sí (`zc-data-table`) | n/a | n/a | Decisión: en móvil, tarjetas |

## Componentes de pago de HeroUI que importan

| HeroUI (pago) | Web | Android | iOS | Nota |
| --- | --- | --- | --- | --- |
| DataGrid, ListView | sí | n/a | n/a | |
| Kanban | sí | no | no | |
| KPI, KPIGroup, TrendChip, NumberValue | sí | sí | sí | |
| Timeline | sí | sí | sí | |
| Carousel | sí | sí | sí (`ZCCarousel`) | Hecho en iOS el 27 nov 2026 |
| Map | sí | sí | sí | |
| Charts (Area, Bar, Line, Pie, Radar, Radial, Composed) | sí | sí | sí | Los nuestros: línea, barras, apiladas, dona, embudo, cascada, mapa de calor, treemap, calendario, sankey, medidor; no hay radar |
| EmptyState | sí | sí | sí | `State` |
| Sidebar, Navbar, AppLayout | sí | sí | sí | Móvil: `AppScaffold` / `ZCAdaptiveScaffold` |
| Stepper | sí | sí | sí | |
| Command | sí (`zc-command-palette`) | no | no | |
| ContextMenu | sí | no | no | |
| DropZone | sí (`zc-file-upload`) | parcial | parcial | Nativo: solo dentro de la importación masiva |
| RichTextEditor | sí | no | no | |
| FileTree | sí (`zc-tree`) | no | no | |
| Resizable | sí (`zc-split`) | n/a | n/a | |
| Rating | no | no | no | |
| HoverCard, EmojiPicker, Agenda, Cell*, ActionBar, NativeSelect | no | no | no | Poco o ningún uso en nuestras apps |
| CodeBlock, Markdown, Chat* (componentes de IA) | parcial (`zc-code-block`, `zc-chat`) | no | no | Sin los 18 de IA de HeroUI |

## Lo que tenemos y HeroUI no

Es donde el sistema es más fuerte para el negocio: montos, teléfonos, RUC/NIT/RUT/RFC y ubigeo con validación por país; códigos OTP y PIN, biometría y escáner; pases de wallet y gift cards; checkout, carrito y cupones; acceso con proveedor, segundo factor, sesión por expirar y eliminar cuenta; máquinas de estado con insignias, maker-checker y permisos; importar y exportar (Excel, CSV, PDF en web); hojas legales y de soporte; banner sin conexión y arrastrar para actualizar; constructor de reglas, recurrencia, correo y galería de imágenes; tour de introducción; cinco marcas con forma y campo propios por marca.

## Conclusiones

1. **Cobertura**: de los 73 gratis, la web cubre unos 60, Android unos 50 y iOS unos 47, contando "parcial" y dejando fuera lo que no aplica en móvil.
2. **Brechas que sí duelen en nativo**: las de esta lista ya están cerradas el 27 nov 2026 (`Autocomplete` con búsqueda remota, rango de fechas en iOS, `Carousel` en iOS, `Fieldset` y grupo de casillas). Quedan `Command` y `ContextMenu` (solo si hay tablet con teclado) y las de la segunda pasada, más abajo.
3. **Brechas de web que no son de HeroUI pero se notan**: sin `Toolbar` propio ni componentes para sitios públicos (portada, pie de página, secciones de marketing).
4. **HeroUI tiene y no conviene copiar** (salvo que una app lo pida): los 18 componentes de IA y, de momento, los selectores de color por área y canal.
5. **Segunda pasada**: más abajo, función por función, con lo que conviene hacer primero.

## Segunda pasada: página por página (27 nov 2026)

La primera versión solo comparó nombres. Aquí se leyó la página de cada componente que faltaba o estaba parcial: 13 + 13 + 18 gratis y 30 de pago. Todas se pudieron leer; las de pago son documentación pública de la API, y su código fuente no lo es. Se comparan **funciones**, no solo existencia. Las funciones nuestras se buscaron en el código; donde dice "no encontré", la búsqueda no dio resultado y conviene confirmarlo antes de dar la brecha por cierta.

### Funciones que HeroUI documenta y no encontré en nuestro sistema

| Componente de HeroUI | Qué documenta | Lo nuestro | Importa |
| --- | --- | --- | --- |
| Form | Errores del servidor por campo (`validationErrors`) que se borran al editar; enfoca el primer campo inválido; validación nativa o en vivo | **Hecho el 27 nov 2026** en las tres plataformas: `applyServerErrors` y `focusFirstInvalid` (web), `ZcServerErrors` (Android), `ZCServerErrors` (iOS). Falta la validación en vivo sin bloquear el envío, que ya hacen los validadores por campo | Cerrado |
| DatePicker y DateField (`granularity`) | Fecha con hora (hora, minuto, segundo) y ciclo de 12 o 24 horas | **Hecho el 27 nov 2026** en las tres plataformas: `zc-datetime-field` (web), `ZcDateTimeField` (Android), `ZCDateTimeField` (iOS). Un solo valor `aaaa-mm-ddThh:mm` que queda incompleto hasta tener las dos partes. Falta segundos y ciclo de 12 horas | Cerrado |
| Calendar y RangeCalendar | Fechas no disponibles, mínimo y máximo, varios meses visibles, selección múltiple, selector de año; en rango, `isDateUnavailable(fecha, ancla)` para limitar la estancia máxima | **Hecho el 27 nov 2026** en las tres plataformas: `unavailable` en el calendario y en el rango, `maxDays` (tope de días) y validación al escribir; el rango no puede cruzar una fecha no disponible. Falta selección múltiple y selector de año | Cerrado |
| ItemCard, CellSwitch, CellSelect (pago) | Fila de ajustes: ícono, título, descripción y un control al final (interruptor, selector, flecha) | **Hecho el 27 nov 2026** en Android e iOS: `ZcSettingsRow/Group` y `ZCSettingsRow/Group` (interruptor, abrir con valor, informativa, destructiva, encabezado y pie). En web ya existían filas con `zc-switch` y `zc-description-list` | Cerrado |
| Toast | `toast.promise` (cargando, luego éxito o error en el mismo aviso), posición configurable, pausa con el cursor, atajo para llegar a la región | **Hecho el 28 nov 2026** en las tres plataformas: `ToastService.promise` y `loading` (web), `ZcToastState.promise` (Android), `ZCToastState.promise` (iOS); el aviso de cargando no se cierra solo, pasa en su lugar a éxito o error, se puede cerrar y el resultado igual aparece. Falta la posición configurable | Cerrado |
| Sheet | Puntos de anclaje (media altura, altura completa), hoja anidada, asa que arrastra, separada del borde | **Hecho el 27 nov 2026** en nativo: `ZcBottomSheet(detents)` (Android) y `zcSheet(anchors:)` (iOS); abre en el primer punto, se arrastra al siguiente y cierra si baja del primero. En web la hoja es el `zc-drawer` | Cerrado |
| Select y Autocomplete | Botón de limpiar (con Retroceso o Supr), carga de más resultados al llegar al final, selección múltiple, virtualización | Limpiar en el `Select` web; el nativo no; no encontré carga progresiva | Media |
| DataGrid (pago) | Columnas fijas, celdas editables, reordenar filas, carga infinita, pie de paginación | **Columnas fijas hechas el 28 nov 2026** en web: `ZcColumn.pin` (`'start'` o `'end'`), con las fijas agrupadas en su borde y las posiciones medidas del DOM. Orden, selección, redimensionar, filas en árbol, virtualización y la edición en celda (`o-grid`) ya existían; falta reordenar filas dentro de la tabla y carga infinita | Parcial (tablas solo en web) |
| ActionBar (pago) | Barra flotante para acciones sobre una selección múltiple; en pantallas pequeñas deja solo íconos | **Hecho el 28 nov 2026** en las tres plataformas: `zc-action-bar` (web), `ZcActionBar` (Android), `ZCActionBar` (iOS). Conteo anunciado por voz, acciones con ícono (solo ícono en angosto y en teléfono), acción deshabilitada con motivo, peligro y X para quitar la selección. `zc-data-table` y `zc-data-view` conservan su barra propia | Cerrado |
| Dropdown | Submenús, ítems seleccionables con marca o punto, abrir con pulsación larga | Menú con atajo, descripción y peligro; no encontré submenús | Baja-media |
| ToggleButton y ToggleButtonGroup | Botón que se enciende y apaga; grupo de selección única o múltiple que puede no quedar vacío, vertical o separado | `Segmented` (selección única); no encontré selección múltiple ni botón suelto | Baja-media |
| Toolbar | Contenedor con navegación por flechas entre sus controles | No encontré | Baja |
| NumberStepper (pago) | Campo numérico con botones − y + | `NumberField` con mínimo, máximo y paso; no encontré botones | Baja-media |
| Carousel (pago) | Puntos, miniaturas, bucle, reproducción automática, varios por vista | Carrusel básico; no encontré bucle, reproducción automática ni miniaturas | Baja |
| Rating (pago) | Estrellas con valores fraccionarios de solo lectura, ícono propio | **Hecho el 28 nov 2026** en las tres plataformas: `zc-rating` (web), `ZcRating` (Android), `ZCRating` (iOS). Interactiva (toque o arrastre, medias estrellas, deslizador accesible, teclado) y de solo lectura con fracciones, nota y número de opiniones. Falta el ícono propio | Cerrado |
| Agenda (pago) | Calendario de día, semana y mes con arrastrar para crear y mover eventos | No encontré | Baja (solo si se agenda en pantalla) |
| Navbar (pago) | Barra superior pública (fija, flotante, se oculta al bajar) | No encontré (la barra de la app es otra cosa) | Solo para sitios públicos |
| ColorArea, ColorSlider, ColorSwatch y ColorSwatchPicker | Selector de color por área y por canal, muestras elegibles | Solo `ColorField` y `ColorPicker` | Baja (herramientas de marca) |

### Lo que HeroUI documenta y ya cubrimos igual o mejor

- **Casillas**: `CheckboxGroup` con "Seleccionar todo" a medias, descripción por casilla, error y deshabilitado (hecho en web y Android esta semana).
- **Estado vacío, KPI, línea de tiempo, paso a paso, barra lateral con atajo de teclado, mapa y división redimensionable**: equivalentes; el nuestro suma banderas, montos y estados con ícono y texto.
- **`NumberValue`**: nuestro `formatMoney` y `<zc-money>` formatean moneda, abreviado y signo por país; son más completos.
- **`Meter` y `ProgressCircle`**: `Progress` ya tiene variante circular y de medidor con umbrales.
- **`Typography` y `Surface`**: se resuelven con tokens y con `ZcText`/`ZCText`.
- **Diálogos**: HeroUI invierte los valores por defecto del `AlertDialog` (no se cierra con clic fuera ni con Escape); los nuestros se comportan igual.
- **Tamaños**: HeroUI no documenta tamaños para Select, Autocomplete, ComboBox, Dropdown ni Tooltip; no hay nada que copiar ahí.

### Qué haría primero

1. ~~**Form con errores del servidor**~~ (hecho el 27 nov 2026).
2. ~~**Fecha con hora** y **calendario con fechas no disponibles y tope de rango**~~ (hecho el 27 nov 2026).
3. ~~**Fila de ajustes** (`SettingsRow`) y **hoja con puntos de anclaje** en nativo~~ (hecho el 27 nov 2026).
4. ~~**`toast.promise`**~~ (hecho el 28 nov 2026).
5. Por demanda (en curso desde el 28 nov 2026): ~~ActionBar~~ y ~~columnas fijas en la tabla~~ y ~~Rating~~ (hechos el 28 nov 2026), Agenda (solo si se agenda en pantalla).
