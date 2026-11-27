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
| CheckboxGroup | parcial | parcial | parcial | Lista de casillas con padre mixto (`zc-tree`, permisos); falta un grupo genérico con una sola etiqueta |
| Description, Label, ErrorMessage, FieldError | sí (`zc-field`) | sí (`ZcField`) | sí (`ZCField`) | |
| Fieldset | no | no | no | Solo regla de documentación; falta agrupar campos con leyenda |
| Form | parcial | parcial | parcial | Plantillas de formulario y resumen de errores; sin un contenedor `Form` con validación común |
| Input, TextField, TextArea | sí | sí | sí | |
| InputGroup | sí | parcial | parcial | Nativo: campos con ícono, prefijo o sufijo propios (monto, teléfono) |
| InputOTP | sí | sí | sí | Más `PinPad` en nativo |
| NumberField | sí | sí | sí | |
| RadioGroup | sí | sí | sí | Variante de tarjetas en web |
| SearchField | sí | sí | sí | |
| Calendar | sí | sí | no | iOS usa el selector del sistema |
| DateField, DatePicker | sí | sí | sí | |
| DateRangePicker, RangeCalendar | sí | sí | **no** | **Brecha real en iOS**: Android tiene `ZcDateRange` y `ZcCalendar` propios |
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
| Autocomplete, ComboBox | sí | **no** | **no** | **Brecha en nativo**: `Select` solo con pocas opciones |
| Select | sí | sí | sí | |
| Kbd | no | n/a | n/a | Atajos de teclado: solo web; sin pieza propia |
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
| Carousel | sí | sí | no | |
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
2. **Brechas que sí duelen en nativo** (en este orden): `Autocomplete` y `ComboBox` (elegir entre muchas opciones, como clientes o países), `DateRange` en iOS, `Carousel` en iOS, `Command` y `ContextMenu` (solo si hay tablet con teclado), `Fieldset` y grupo de casillas genérico (las tres plataformas).
3. **Brechas de web que no son de HeroUI pero se notan**: sin `Kbd`, sin `Toolbar` propio, sin componentes para sitios públicos (portada, pie de página, secciones de marketing).
4. **HeroUI tiene y no conviene copiar**: los 18 componentes de IA, las ColorArea y Rating, salvo que una app los pida.
