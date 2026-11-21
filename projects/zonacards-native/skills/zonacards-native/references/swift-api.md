# Referencia de la API de SwiftUI (ZonacardsUI)

Generada desde el código (`node scripts/build-native-docs.mjs`). Cada tipo público con su descripción, su inicializador y, en los enums, sus casos.
Se importan con `import ZonacardsUI`; los tokens (`ZCTheme`, `ZCType`, `ZCSpace`, `ZCIcon`…) están en `import ZonacardsTokens`.
Estado: ver `references/ios.md` (qué está compilado y probado y qué no).

## ZCAtoms.swift

### ZCBadge

Badge de estado: tono y texto (y un ícono opcional). Alto de 28 pt.

`ZCBadge(_ text: String, tone: ZCTone = …, icon: ZCIconName? = …)`

### ZCAvatarSize

Tamaño del avatar: 32, 40 o 56 pt.

Casos: `sm`, `md`, `lg`

### ZCAvatar

Avatar con foto (`image`) o iniciales sobre `surface3`. `square` para empresas. `presence` agrega el punto verde y "En línea" al nombre que lee VoiceOver.

`ZCAvatar(_ name: String, size: ZCAvatarSize = …, brand: Bool = …, image: Image? = …, square: Bool = …, presence: Bool = …, initials: String? = …)`

### ZCAvatarGroup

Grupo de avatares superpuestos con "+N" si hay más de `max`. VoiceOver lee `label` una sola vez.

`ZCAvatarGroup(names: [String], label: String, size: ZCAvatarSize = …, max: Int = …)`

### ZCChip

Chip: etiqueta (solo lectura), seleccionable (filtros, con `selected`) o con "Quitar" (`onRemove`). Alto visual de 32 pt, toque de 44 pt. `invalid` lo marca como no válido con texto para VoiceOver, no solo con color.

`ZCChip(_ label: String, selected: Binding<Bool>? = …, onRemove: (() -> Void)? = …, invalid: Bool = …, icon: ZCIconName? = …)`

### ZCDivider

Separador de 1 pt con el color de borde. Decorativo por defecto.

`ZCDivider(vertical: Bool = …, decorative: Bool = …)`

## ZCButton.swift

### ZCButtonVariant

Variantes del botón. Una sola acción principal (`primary`) por vista.

Casos: `primary`, `secondary`, `outline`, `ghost`, `danger`, `dangerSoft`, `link`

### ZCButtonSize

Tamaño visual: `md` 56 pt, `sm` 44 pt. El área de toque nunca baja de 44 pt.

Casos: `md`, `sm`

### ZCButton

Botón con etiqueta de verbo y objeto ("Crear lote"). `loading` lo deja ocupado y lo anuncia; se aprieta con resorte al presionar (un fundido corto con "Reducir movimiento"). Forma de `theme.shape.button`.

`ZCButton(_ title: String, variant: ZCButtonVariant = …, size: ZCButtonSize = …, leadingIcon: ZCIconName? = …, trailingIcon: ZCIconName? = …, loading: Bool = …, block: Bool = …, action: @escaping () -> Void)`

### ZCIconButton

Botón de solo ícono: `label` es obligatorio (lo lee VoiceOver). 44 pt visual con `small`, 48 pt por defecto.

`ZCIconButton(_ icon: ZCIconName, label: String, variant: ZCButtonVariant = …, small: Bool = …, action: @escaping () -> Void)`

## ZCContent.swift

### ZCAlertTone

Casos: `info`, `success`, `warning`, `danger`

### ZCAlert

Aviso dentro de la página: no se cierra solo. Siempre ícono y título, nunca solo color. `danger` se anuncia de inmediato; el resto, con calma. Error de servidor de un formulario: `danger` al tope, con la referencia en el texto. Las acciones van en `actions` (usa `ZCAlertAction`).

`ZCAlert(_ title: String, tone: ZCAlertTone = …, text: String? = …, @ViewBuilder actions: () -> Actions)`

### ZCTab

Una pestaña. `count` es un contador en píldora de color primario.

`ZCTab(value: String, label: String, icon: ZCIconName? = …, count: Int? = …, enabled: Bool = …)`

### ZCTabsVariant

Casos: `line`, `segmented`

### ZCTabs

Pestañas. `line`: subrayado, con ícono y contador (secciones de una ficha, estados de una lista). `segmented`: pastilla con fondo (alternar vistas o periodos, 2 a 4 opciones). Si no caben, se desplazan en horizontal (nunca saltan de línea) y la elegida se trae a la vista; el indicador se desliza. El contenido de cada panel lo arma quien llama.

`ZCTabs(tabs: [ZCTab], selected: Binding<String>, variant: ZCTabsVariant = …, label: String? = …)`

### ZCAccordionItem

Un elemento de un `ZCAccordion`. `aside` (estado u otro dato a la derecha del título) se oculta en pantallas de menos de 400 pt.


### ZCAccordionVariant

Casos: `card`, `flush`

### ZCAccordion

Acordeón. `multiple = false`: uno abierto a la vez (preguntas frecuentes); `true`: varios (formularios largos por secciones) y, con `label`, el botón "Expandir todo / Contraer todo". `flush`: sin bordes laterales, dentro de paneles y hojas.

`ZCAccordion(items: [ZCAccordionItem], multiple: Bool = …, variant: ZCAccordionVariant = …, label: String? = …, initiallyOpen: [String] = …)`

### ZCDescription

Un par dato–valor. `flag`: código de país, con la bandera antes del valor.

`ZCDescription(term: String, value: String, flag: String? = …)`

### ZCDescriptionLayout

Casos: `grid`, `rows`

### ZCDescriptionList

Pares dato–valor de una ficha. `grid`: dos columnas desde 448 pt de ancho (una, si no caben); `rows`: una por fila con el valor a la derecha (resúmenes, hojas). Los montos ya vienen formateados por quien llama.

`ZCDescriptionList(items: [ZCDescription], layout: ZCDescriptionLayout = …)`

### ZCTimelineItem

Un hecho del historial: ícono, título y una línea en gris (fecha, autor, detalle).

`ZCTimelineItem(icon: ZCIconName, title: String, meta: String? = …)`

### ZCTimeline

Historial vertical: círculo con ícono, conector y título con su detalle.

`ZCTimeline(items: [ZCTimelineItem], label: String? = …)`

### ZCCopyButton

Copia un texto al portapapeles. Solo ícono por defecto (con su nombre para VoiceOver); `showText` muestra el texto. Al copiar: check y "Copiado" durante 2 s, anunciado. Una clave secreta va enmascarada, no aquí.

`ZCCopyButton(value: String, label: String? = …, showText: Bool = …, variant: ZCButtonVariant = …, onCopied: ((String) -> Void)? = …)`

### ZCErrorPage

Página de error (404, 403, 500, 503, sin conexión, sesión expirada): qué pasó, qué se conservó y qué hacer; nunca solo un código. La referencia, solo cuando soporte la necesita (500, 404).

`ZCErrorPage(title: String, text: String, icon: ZCIconName, code: String? = …, reference: String? = …, @ViewBuilder actions: () -> Actions)`

### ZCBullet

Medidor de stock: franjas bajo el mínimo (peligro), rango sano (éxito) y sobre el máximo (aviso); la barra es el valor y la marca, el punto de pedido. Los textos (cabecera y leyenda) los pone quien lo usa; el medidor se anuncia con `label`. `scale` es el fin de la escala (por defecto 1,25 × máximo).

`ZCBullet(value: Double, min: Double, max: Double, label: String, reorder: Double? = …, scale: Double? = …, @ViewBuilder head: () -> Head, @ViewBuilder legend: () -> Legend)`

## ZCControls.swift

### ZCControlSize

Tamaño de los controles pequeños (interruptor, casilla): `md` o `sm` para filas compactas.

Casos: `md`, `sm`

### ZCSwitch

Interruptor: aplica al instante (sin "Guardar"). Activado en `success`, pulgar blanco. Para opciones que esperan confirmación, usa `ZCCheckbox`.

`ZCSwitch(isOn: Binding<Bool>, label: String? = …, description: String? = …, size: ZCControlSize = …)`

### ZCCheckState

Estado de una casilla. `mixed` (guion) es para el padre de una lista con casillas.

Casos: `off`, `on`, `mixed`

### ZCCheckbox

Casilla con estado mixto. Sin etiqueta visible, `accessibilityLabel` la nombra (fila compacta de una lista).

`ZCCheckbox(state: ZCCheckState, label: String? = …, description: String? = …, invalid: Bool = …, accessibilityLabel: String? = …, action: @escaping () -> Void)`

### ZCRadioOption

Una opción de un `ZCRadioGroup`.

`ZCRadioOption(_ value: Value, label: String, description: String? = …, enabled: Bool = …)`

### ZCRadioGroup

Grupo de opciones excluyentes (2 a 6): etiqueta del grupo visible, filas separadas 16 pt, error del grupo con texto.

`ZCRadioGroup(_ label: String, options: [ZCRadioOption<Value>], selection: Binding<Value?>, error: String? = …)`

### ZCProgressVariant

Casos: `bar`, `circular`, `meter`

### ZCProgress

Progreso: barra (`bar`), circular o medidor de consumo de un cupo (`meter`, cambia de color con `warnAt` y `dangerAt`, en %). Con `value` nulo es indeterminado (un segmento cruza la pista; nunca parpadea). Sin `valueText` muestra el porcentaje.

`ZCProgress(value: Double?, label: String? = …, valueText: String? = …, variant: ZCProgressVariant = …, tone: ZCTone? = …, warnAt: Int = …, dangerAt: Int = …)`

### ZCSkeletonVariant

Casos: `line`, `block`, `card`

### ZCSkeleton

Esqueleto de carga: brillo que recorre (1,4 s) sobre `surface2`; anuncia "Cargando" una vez. Quieto con "Reducir movimiento".

`ZCSkeleton(variant: ZCSkeletonVariant = …, lines: Int = …)`

## ZCDomainDisplay.swift

### ZCCard

Tarjeta de listado: radio de `theme.shape.card`, borde, padding 16, separación 16. Encabezado con ícono en recuadro de 36 pt (o `lead`), título de 16 semibold y subtítulo en muted, y `aside` a la derecha (menú ⋮ o badge, con su propio toque); `media` a sangre arriba en 16:9, cuerpo libre y `footer` con borde superior. Con `onTap`, toda la tarjeta abre el detalle.

`ZCCard(_ title: String, subtitle: String? = …, icon: ZCIconName? = …, onTap: (() -> Void)? = …, @ViewBuilder media: () -> Media, @ViewBuilder lead: () -> Lead, @ViewBuilder aside: () -> Aside, @ViewBuilder footer: () -> Footer, @ViewBuilder content: () -> Inner)`

### ZCSparkline

Línea de tendencia mínima para un KPI. Decorativa.

`ZCSparkline(values: [Double], color: Color)`

### ZCKpi

KPI: radio de `theme.shape.card`, borde, padding 16. Etiqueta de 14 muted e ícono en recuadro de 32 pt (se oculta si la tarjeta mide 150 o menos); valor de 24 semibold tabular. Con `trend`: píldora de variación (verde o roja según `invert`) y sparkline; solo con `delta`: la variación en línea. `filter` lo vuelve un filtro que se marca (borde `primary` de 2).

`ZCKpi(label: String, value: String, icon: ZCIconName? = …, delta: Double? = …, deltaLabel: String? = …, trend: [Double]? = …, invert: Bool = …, filter: Bool = …, pressed: Binding<Bool>? = …)`

### ZCMoneyText

Monto: una línea con la moneda del país, números tabulares y la tipografía del contexto. Si el monto completo no cabe, muestra el abreviado (K, M, MM) con subrayado punteado; al tocarlo se ve la cifra completa. VoiceOver siempre lee la cifra completa. No usar en tablas ni exportaciones.

`ZCMoneyText(_ amount: Double, country: String, style: ZCTypeStyle = …, weight: Font.Weight? = …, color: Color? = …)`

### ZCStates

Atajos a las máquinas de estado del dominio.


### ZCStateBadge

Badge de un estado de dominio: tono, ícono y texto salen de la máquina de estados, así lote, envío o giftcard se ven igual en web, Android y iOS. Siempre ícono y texto.

`ZCStateBadge(machine: ZCStateMachine, state: String)`

### ZCPayMethod

Casos: `yape`, `plin`, `pagoefectivo`, `puntos`

### ZCPayBadge

Medio de pago local: 22 pt de alto, radio 4, texto de 10 bold; colores de marca desde los tokens `pay*`. Decorativo (acompáñalo del nombre).

`ZCPayBadge(_ method: ZCPayMethod)`

### ZCProductCard

Tarjeta de producto: imagen 16:10 con cinta "Nueva" y favorito (40 pt, colores `media*`), nombre, descripción, "Desde" y monto, y botón de compra de solo ícono.

`ZCProductCard(name: String, price: Double, country: String, description: String? = …, image: Image? = …, isNew: Bool = …, favorite: Binding<Bool>? = …, onBuy: @escaping () -> Void)`

### ZCCtaCard

Tarjeta de llamado: fondo con 18 % del acento de marca, título, texto y botón; esquina con ícono sobre `secondary`.

`ZCCtaCard(title: String, text: String, icon: ZCIconName, @ViewBuilder action: () -> Action)`

## ZCDomainFields.swift

### ZCMoneyField

Monto en la moneda del país: símbolo a la izquierda y código ISO a la derecha; solo dígitos y hasta los decimales del país (CLP y COP sin decimales). Mientras se escribe se ve el número limpio; al salir, con separadores ("1,250.00").

`ZCMoneyField(_ label: String, amount: Binding<Double?>, country: String, hint: String? = …, error: String? = …, required: Bool = …)`

### ZCPhoneField

Teléfono: a la izquierda bandera, prefijo y flecha (abre la lista de países en una hoja, con búsqueda), y los dígitos nacionales en grupos de 3.

`ZCPhoneField(_ label: String, digits: Binding<String>, country: Binding<String>, hint: String? = …, error: String? = …, required: Bool = …)`

### ZCTaxIdField

Identificador tributario del país (RUC, NIT, RUT, RFC): segmento izquierdo con el tipo, rechaza caracteres no permitidos, corta al largo máximo, teclado numérico o de texto según el país y normaliza al salir (mayúsculas, guion del verificador). Al cambiar de país el documento anterior ya no aplica y se vacía.

`ZCTaxIdField(value: Binding<String>, country: String, label: String? = …, hint: String? = …, error: String? = …, required: Bool = …)`

### ZCOtpField

Código de un solo uso: casilleros de hasta 52 pt de ancho, con 6 o más dígitos un guion separa las mitades (123 – 456). `valid` pinta el borde de éxito; rechaza lo que no es número con aviso; pegar el código completo funciona. Llama `onComplete` al llegar al largo.

`ZCOtpField(_ label: String, value: Binding<String>, length: Int = …, error: String? = …, hint: String? = …, valid: Bool = …, onComplete: ((String) -> Void)? = …)`

### ZCNumberField

Número entero con − y +: caja de control con botones de paso y rango `min`…`max`. VoiceOver lo trata como control ajustable (deslizar arriba o abajo).

`ZCNumberField(value: Binding<Int>, min: Int = …, max: Int = …, label: String? = …)`

## ZCField.swift

### ZCFlash

Aviso temporal de un campo (como `field.flash()` de la web): reemplaza la ayuda 1,6 s, en tono de error. Se usa al rechazar caracteres.

`ZCFlash()`

### ZCField

Marco de un campo: etiqueta (con * u "(opcional)" y ayuda "?"), el control y una línea de mensaje que reserva su alto: error con ícono, éxito con ícono, aviso temporal (`flash`) o ayuda, y el contador a la derecha.

`ZCField(_ label: String, required: Bool = …, optional: Bool = …, hint: String? = …, error: String? = …, counter: String? = …, success: String? = …, info: String? = …, flash: ZCFlash? = …, reserve: Bool = …, @ViewBuilder control: () -> Control)`

### ZCTextField

Campo de texto: caja de alto `theme.shape.fieldH`, texto de cuerpo y un solo ícono a la derecha (contraseña: mostrar u ocultar). `allowed` (expresión regular de UN carácter, como `\d`) rechaza lo demás y avisa con `rejectMessage`; `maxLength` corta; `onBlur` normaliza. `multiline` lo vuelve área de texto (mínimo 96 pt).

`ZCTextField(_ label: String, text: Binding<String>, placeholder: String? = …, hint: String? = …, error: String? = …, success: String? = …, info: String? = …, required: Bool = …, optional: Bool = …, password: Bool = …, keyboard: UIKeyboardType = …, capitalization: TextInputAutocapitalization = …, submitLabel: SubmitLabel = …, allowed: String? = …, rejectMessage: String? = …, maxLength: Int? = …, showCounter: Bool = …, multiline: Bool = …, prefix: String? = …, suffix: String? = …, trailingIcon: ZCIconName? = …, trailingLabel: String? = …, onTrailingTap: (() -> Void)? = …, hideLabel: Bool = …, flash: ZCFlash? = …, leading: AnyView? = …, below: AnyView? = …, reserve: Bool = …, onSubmit: (() -> Void)? = …, onBlur: (() -> Void)? = …, onFocusChange: ((Bool) -> Void)? = …)`

### ZCTextArea

Área de texto: mínimo 96 pt, crece con el contenido; contador opcional con `maxLength`.

`ZCTextArea(_ label: String, text: Binding<String>, placeholder: String? = …, hint: String? = …, error: String? = …, required: Bool = …, optional: Bool = …, maxLength: Int? = …)`

### ZCSearchField

Buscador: lupa a la izquierda, sin etiqueta visible (la etiqueta es el nombre para VoiceOver), "Limpiar" a la derecha cuando hay texto. La acción del teclado es "Buscar".

`ZCSearchField(query: Binding<String>, label: String? = …, placeholder: String? = …, onSearch: ((String) -> Void)? = …)`

## ZCOverlays.swift

### ZCToastKind

Casos: `success`, `error`, `info`

### ZCToast


### ZCToastState

Avisos de resultado de una acción. Un solo `ZCToaster` en la raíz de la app. 6 s por defecto; los errores con acción ("Reintentar") no se cierran solos; con más de 3, los demás esperan en cola.

`ZCToastState()`

### ZCToaster

Pila de avisos arriba (bajo la barra superior). VoiceOver los anuncia al aparecer; el tiempo se detiene mientras se toca el aviso.

`ZCToaster(state: ZCToastState)`

## ZCSelect.swift

### ZCOption

Una opción de un select. `description` es una segunda línea opcional.

`ZCOption(_ value: Value, label: String, description: String? = …, enabled: Bool = …)`

### ZCSelect

Select de una opción: el valor se elige en una hoja propia (no hay `Picker` del sistema).

`ZCSelect(_ label: String, options: [ZCOption<Value>], selection: Binding<Value?>, placeholder: String? = …, hint: String? = …, error: String? = …, required: Bool = …, optional: Bool = …, info: String? = …)`

### ZCMultiSelect

Select de varias opciones: filas con casilla y pie "Limpiar" y "Listo". El campo muestra la opción o "n seleccionados".

`ZCMultiSelect(_ label: String, options: [ZCOption<Value>], selection: Binding<Set<Value>>, placeholder: String? = …, hint: String? = …, error: String? = …, required: Bool = …, optional: Bool = …)`

### ZCDateField

Fecha de calendario como texto ISO `aaaa-mm-dd` (nunca con hora). Se muestra como dd/mm/aaaa y se elige en una hoja con el calendario del sistema.

`ZCDateField(_ label: String, iso: Binding<String>, min: String? = …, max: String? = …, hint: String? = …, error: String? = …, required: Bool = …, optional: Bool = …)`

## ZCSpinner.swift

### ZCSpinner

Indicador de carga: aro de 2 pt con tres cuartos visibles. Anuncia "Cargando" salvo `decorative`; con "Reducir movimiento" queda fijo.

`ZCSpinner(size: CGFloat = …, color: Color? = …, decorative: Bool = …)`

## ZCStructure.swift

### ZCTopBar

Barra superior: Volver cuadrado de 40 pt (radio 8, toque 44), título y subtítulo de 12 pt, y una acción a la derecha. Lleva un borde inferior.

`ZCTopBar(_ title: String, subtitle: String? = …, onBack: (() -> Void)? = …, @ViewBuilder action: () -> Action)`

### ZCNavItem

Destino de la navegación inferior. `iconActive` suele ser la variante `-bold` del ícono.

`ZCNavItem(id: String, label: String, icon: ZCIconName, iconActive: ZCIconName? = …, badge: String? = …)`

### ZCBottomNav

Navegación inferior: 3 a 5 destinos con ícono de 20 pt y texto pequeño; el activo en Bold y color de marca, marcado como seleccionado. Margen inferior de 14 pt o el del sistema.

`ZCBottomNav(items: [ZCNavItem], current: String?, onSelect: @escaping (String) -> Void)`

### ZCBannerTone

Casos: `offline`, `update`

### ZCSystemBanner

Banda bajo la barra superior: sin conexión o actualización disponible. VoiceOver la anuncia al aparecer.

`ZCSystemBanner(_ text: String, tone: ZCBannerTone = …, @ViewBuilder action: () -> Action)`

### ZCOfflineBanner

Aviso de sin conexión con cambios pendientes: bloque con radio 8 y texto de 14 pt.

`ZCOfflineBanner(pending: Int)`

### ZCStateKind

Casos: `empty`, `error`

### ZCTechDetails

Detalles técnicos de un error para soporte (código, servicio, fecha).

`ZCTechDetails(code: String, service: String, date: String)`

### ZCState

Estado de bloque (vacío o error): borde punteado, ícono en recuadro de 44 pt, qué pasó (título), por qué o qué se conservó (texto), la acción para salir y luego la referencia. En errores, "Ver detalles técnicos" con "Copiar detalles".

`ZCState(_ title: String, kind: ZCStateKind = …, icon: ZCIconName? = …, text: String? = …, reference: String? = …, details: ZCTechDetails? = …, onCopied: (() -> Void)? = …, @ViewBuilder action: () -> Action)`

### ZCAction

Acción de menú o de deslizamiento. `disabledReason` explica por qué no se puede (se lee y se muestra).

`ZCAction(id: String, label: String, icon: ZCIconName? = …, danger: Bool = …, description: String? = …, disabledReason: String? = …, checked: Bool? = …, separatorBefore: Bool = …)`

### ZCMenu

Menú de acciones (kebab Bold): filas de 48 pt con ícono de 16 en muted (rojo si es destructiva), descripción, marca de elegido, separadores y deshabilitadas con su motivo. Se abre en una hoja inferior (o subpantalla si ya está en una). `dense`: kebab de 36 pt visibles (toque 44).

`ZCMenu(actions: [ZCAction], label: String, dense: Bool = …, onAction: @escaping (String) -> Void)`

### ZCSwipeItem

Fila deslizable: al deslizar a la izquierda más de 70 pt se abren las acciones (152 pt, texto de 12). Las mismas acciones están en el menú ⋮ (denso) y como acciones de VoiceOver, así nadie depende del gesto.

`ZCSwipeItem(actions: [ZCAction], menuLabel: String, onAction: @escaping (String) -> Void, @ViewBuilder content: () -> Content)`

### ZCPullRefresh

Deslizar para actualizar: usa el gesto del sistema (`refreshable`), que VoiceOver ya ofrece como acción. Termina cuando `onRefresh` retorna.

`ZCPullRefresh(onRefresh: @escaping () async -> Void, @ViewBuilder content: () -> Content)`

## ZCText.swift

### ZCText

Texto con la escala tipográfica del sistema (escala con Dynamic Type) y un tono semántico. No uses `Text` con colores ni fuentes fijas.

`ZCText(_ text: String, style: ZCTypeStyle = …, tone: Tone = …)`

### Tone

Color semántico del texto.

Casos: `normal`, `muted`, `danger`, `onPrimary`

## ZCThemeProvider.swift

### ZCThemeProvider

Resuelve el tema (marca × claro/oscuro), registra las tipografías y lo pone en el entorno (`\.zcTheme`) para todo lo que contiene. Sin `dark` sigue el modo del sistema. Úsalo una vez en la raíz de la app y en cada captura del catálogo.

`ZCThemeProvider(brand: ZCBrand = …, dark: Bool? = …, @ViewBuilder content: () -> Content)`

## ZCTone.swift

### ZCTone

Tono semántico de estados y badges: siempre con ícono y texto, nunca solo color.

Casos: `success`, `warning`, `danger`, `info`, `accent`, `neutral`
