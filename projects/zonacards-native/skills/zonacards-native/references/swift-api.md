# Referencia de la API de SwiftUI (ZonacardsUI)

Generada desde el código (`node scripts/build-native-docs.mjs`). Cada tipo público con su descripción, su inicializador y, en los enums, sus casos.
Se importan con `import ZonacardsUI`; los tokens (`ZCTheme`, `ZCType`, `ZCSpace`, `ZCIcon`…) están en `import ZonacardsTokens`.
Estado: ver `references/ios.md` (qué está compilado y probado y qué no).

## ZCAccountBasics.swift

### ZCIntroSlide

Una diapositiva de la introducción: título, texto y, opcional, una imagen de fondo o un ícono.

`ZCIntroSlide(title: String, text: String, image: Image? = …, icon: ZCIconName? = …)`

### ZCStepDots

Puntos de avance (introducción, pasos): el actual es una píldora; el resto, puntos. Anuncia "Paso 2 de 3". Solo informa: no se toca (la navegación la hacen los botones).

`ZCStepDots(total: Int, current: Int, color: Color? = …)`

### ZCIntroSlides

Introducción a pantalla completa de la primera vez: una diapositiva a la vez sobre fondo `primary`, puntos de avance, "Saltar" (salvo en la última) y "Continuar", que en la última dice "Empezar". El título anuncia el cambio de diapositiva. La app guarda que ya la vio.

`ZCIntroSlides(slides: [ZCIntroSlide], onFinished: @escaping () -> Void, onSkipped: @escaping () -> Void)`

### ZCCountrySwitcher

País de operación de la barra superior: bandera y moneda. Abre la lista con moneda, identificador tributario y zona horaria; elegir uno define moneda, impuesto y zona horaria. `allowed` limita la lista al alcance del rol: con un solo país se muestra fijo (sin menú) y un valor fuera del alcance pasa al primer país permitido.

`ZCCountrySwitcher(value: Binding<String>, allowed: [String]? = …)`

## ZCAccountMore.swift

### ZCDeletionRequest

Solicitud de eliminación ya registrada: abierta (en trámite) o rechazada.

`ZCDeletionRequest(open: Bool, statusLabel: String, requestedAt: Date, rejectReason: String? = …)`

### ZCDeleteAccount

Eliminar mi cuenta (la App Store lo exige). Explica qué pasa, pide un código que llega al correo y un motivo opcional, y registra una solicitud que atiende el equipo: la cuenta sigue activa hasta entonces. La app envía el código, valida y registra: - Sin solicitud: consecuencias, "Enviar código" y, con `maskedEmail`, código de 6 dígitos, motivo y "Solicitar eliminación". - Con una solicitud abierta: su estado y fecha, y Volver. Rechazada: aviso con el motivo y se puede volver a pedir. `error` (código inválido, sin red) se muestra en el campo del código.

`ZCDeleteAccount(request: ZCDeletionRequest?, maskedEmail: String?, sending: Bool = …, submitting: Bool = …, error: String? = …, consequences: [String]? = …, lang: String = …, onSendCode: @escaping () -> Void, onSubmit: @escaping (_ code: String, _ reason: String?) -> Void, onBack: @escaping () -> Void)`

### ZCPermissionTone

Casos: `info`, `warning`

### ZCPermissionPrompt

Explicación previa a un permiso (cámara, notificaciones, ubicación): ícono en recuadro de 88 pt (radio 28), título, texto y los botones que pone la pantalla ("Permitir" y siempre "Ahora no"). Se muestra justo antes de usar la función, nunca al abrir la app; `warning` es para el permiso negado, con un camino a Ajustes (`UIApplication.openSettingsURLString`). Los textos de uso (`NSCameraUsageDescription`…) van en la app cliente.

`ZCPermissionPrompt(icon: ZCIconName, title: String, text: String, tone: ZCPermissionTone = …, @ViewBuilder actions: () -> Actions)`

### ZCPushPreview

Vista previa de una notificación push: para mostrar cómo llegará el aviso. VoiceOver la lee como imagen.

`ZCPushPreview(app: String, time: String, title: String, text: String)`

## ZCAdaptive.swift

### ZCAdaptiveScaffold

Navegación principal que se adapta al ancho: en iPhone (ancho compacto) una barra inferior con 3 a 5 destinos (`ZCBottomNav`); en iPad (ancho regular) una barra lateral con `NavigationSplitView` y el contenido al lado. Mismos destinos y misma selección en los dos. El contenido recibe el id del destino elegido.

`ZCAdaptiveScaffold(items: [ZCNavItem], selection: Binding<String>, @ViewBuilder content: @escaping (String) -> Content)`

### ZCListDetail

Lista y detalle: en ancho regular (iPad) las dos columnas a la vez, la lista de ancho fijo; en ancho compacto (iPhone) una sola, la lista o el detalle según `showsDetail` (quien llama maneja el "Volver", por ejemplo con `ZCTopBar(onBack:)`).

`ZCListDetail(showsDetail: Bool, listWidth: CGFloat = …, @ViewBuilder list: () -> ListContent, @ViewBuilder detail: () -> Detail)`

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

## ZCAuth.swift

### ZCAuthVariant

Casos: `admin`, `shop`

### ZCAuthView

Casos: `login`, `otp`, `recovery`, `setup`, `forgot`, `sent`, `signup`, `done`

### ZCLoginResult

`otp`: pedir el código; `setup`: la cuenta debe configurar el segundo factor antes de entrar; `ok`: entra; `bad`: datos incorrectos.

Casos: `otp`, `setup`, `ok`, `bad`

### ZCAuthState

Vista actual y conteo de intentos del acceso; `reset()` vuelve al inicio (demostraciones y cierre de sesión).

`ZCAuthState()`

### ZCAuth

Acceso. `admin`: Microsoft Entra ID primero y correo para usuarios externos. `shop`: Google y Apple, correo y registro. Recuperar contraseña, segundo factor (OTP), código de recuperación, intentos fallidos con bloqueo de 15 min tras 5 y mensajes que no revelan si una cuenta existe. `login` y `verifyOtp` los resuelve la app. Desde 900 pt de ancho (iPad) lleva un panel lateral con la marca (`logo` opcional). Si `login` devuelve `.setup`, se muestra `mfaSetup` (con `ZCMfaSetup`, llamando a `done` al terminar). iOS no informa si Bloq Mayús está activo, así que no hay aviso de mayúsculas.

`ZCAuth(variant: ZCAuthVariant = …, state: ZCAuthState = …, userName: String = …, login: @escaping (_ email: String, _ password: String) async throws -> ZCLoginResult, verifyOtp: @escaping (String) async throws -> Bool, forgot: ((_ email: String) async throws -> Void)? = …, resendOtp: (() async -> Void)? = …, verifyRecoveryCode: ((String) async throws -> Bool)? = …, onSsoStart: @escaping (ZCSsoProvider) -> Void =, termsUrl: String = …, privacyUrl: String = …, submitBlocked: Bool = …, onSignedIn: @escaping () -> Void, @ViewBuilder logo: () -> Logo, @ViewBuilder captcha: () -> Captcha, @ViewBuilder mfaSetup: @escaping (_ done: @escaping () -> Void) -> MfaSetup)`

## ZCAutocomplete.swift

### ZCAutocomplete

Select con búsqueda hecha por quien llama (equivale a `zc-autocomplete` y al ComboBox con datos remotos): al escribir, espera 250 ms y llama a `onQueryChange(texto)`; la app responde con `options` ya filtradas (del servidor) y `loading` mientras tarda. Con menos de `minChars` letras no se pide nada y se explica ("Escribe al menos 2 letras"); sin resultados, se dice con ayuda; con `onCreate` se ofrece "Crear “texto”". `selection` es la opción elegida: el campo muestra su etiqueta aunque ya no esté en `options` (otra búsqueda la sacó de la lista). Como `ZCSelect`, la lista va en una hoja y, dentro de otra hoja, como subpantalla con Volver.

`ZCAutocomplete(_ label: String, options: [ZCOption<Value>], selection: Binding<ZCOption<Value>?>, onQueryChange: @escaping (String) -> Void, placeholder: String? = …, hint: String? = …, error: String? = …, required: Bool = …, loading: Bool = …, minChars: Int = …, onCreate: ((String) -> Void)? = …)`

## ZCBrandStore.swift

### ZCBrandStore

Marca y modo elegidos, que se recuerdan entre sesiones. Cambiarlos redibuja toda la app al momento (sin reiniciar): `ZCLiveThemeProvider` los lee, y todo lo que está dentro toma colores, forma y tipografía de la marca nueva. Útil para apps con varias marcas (Zonacards, Giftealo, Enjoy, Motiva…) y para probar una marca nueva sin recompilar.

`ZCBrandStore(defaultBrand: ZCBrand = …, defaults: UserDefaults = …, keyPrefix: String = …)`

### ZCLiveThemeProvider

Como `ZCThemeProvider`, pero la marca y el modo salen de un `ZCBrandStore`: al cambiarlos, todo se redibuja con la marca nueva.

`ZCLiveThemeProvider(store: ZCBrandStore, @ViewBuilder content: () -> Content)`

## ZCBulkImport.swift

### ZCBulkImport

Importación masiva desde un Excel o un CSV, en dos pasos: (1) descargar la plantilla con los encabezados de `columns`, (2) subir el archivo. Cada fila se valida en el teléfono (`ZCBulk.processMatrix`; el servidor vuelve a validar): se muestran las filas válidas, los errores por fila con su causa, y "Importar N filas" entrega solo las válidas a `onImport`. Las filas con errores se omiten, con aviso. El archivo lo elige el usuario con el selector de documentos del sistema (`fileImporter`, sin permisos) y la plantilla se guarda con el de "guardar como" (`fileExporter`). `templateTitle` da el nombre del archivo de la plantilla ("plantilla-clientes-2026-11-23.xlsx"). `keyOf` arma la llave que identifica cada fila (las repetidas se rechazan desde la segunda). Archivos de más de 10 MB no se leen.

`ZCBulkImport(columns: [ZCBulkColumn], templateTitle: String = …, maxRows: Int? = …, keyOf: (([String: ZCBulkValue]) -> String)? = …, onImport: @escaping ([ZCBulkRow]) -> Void)`

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

## ZCChart.swift

### ZCChartSeries

Serie de un gráfico. `dashed`: periodo anterior (línea punteada en gris).

`ZCChartSeries(name: String, values: [Double], dashed: Bool = …)`

### ZCChartData

Mismos datos que `ChartData` de la web: categorías y series con un valor por categoría.

`ZCChartData(categories: [String], series: [ZCChartSeries])`

### ZCChartKind

Tipos de la web: línea, barras horizontales (una serie, el mayor destacado), apiladas y dona; y los de operación (embudo, cascada, mapa de calor, treemap, calendario, sankey y medidor), con la misma forma de datos.

Casos: `line`, `barH`, `stacked`, `donut`, `funnel`, `waterfall`, `heatmap`, `treemap`, `calendar`, `sankey`, `gauge`

### ZCChart

Gráfico dibujado a mano con los tokens `chart1…6` (`Canvas`, sin Swift Charts: así los 11 tipos se ven igual en las tres plataformas): línea (con área suave en la primera serie y punteada para el periodo anterior), barras horizontales (el mayor en el color principal y el resto en neutro), apiladas y dona (total al centro), y los de operación. Al tocar o deslizar aparece el globo con los valores. VoiceOver lee un resumen (`description` y valores); la alternativa completa es la vista Datos de `ZCChartPanel`.

`ZCChart(data: ZCChartData, kind: ZCChartKind, format: @escaping (Double) -> String = …, description: String? = …, totalLabel: String = …, height: CGFloat? = …, initialSelection: Int? = …)`

### ZCChartTable

Vista Datos (alternativa accesible del gráfico): una fila por categoría y una columna por serie (la dona y las barras, solo la primera).

`ZCChartTable(data: ZCChartData, kind: ZCChartKind, categoryLabel: String = …, format: @escaping (Double) -> String = …)`

### ZCSegmentOption

`ZCSegmentOption(id: String, label: String)`

### ZCSegmented

Segmentado: pista `surface2`, el elegido sobre `surface` con sombra. Cada opción mide al menos 44 pt de alto con el dedo; `small` es el tamaño de las barras de gráficos y listados.

`ZCSegmented(options: [ZCSegmentOption], selected: Binding<String>, label: String? = …, small: Bool = …)`

### ZCChartPanel

Gráfico con su barra de herramientas: "Vista" (Gráfico, Datos) y, a continuación, los filtros del llamador (periodo, métrica, país, Comparar). Sin datos muestra el estado vacío; la vista Datos lleva el título como en la web ("Datos: …").

`ZCChartPanel(title: String, data: ZCChartData?, kind: ZCChartKind, format: @escaping (Double) -> String = …, totalLabel: String = …, categoryLabel: String = …, @ViewBuilder toolbar: () -> Toolbar)`

## ZCCommerce.swift

### ZCCheckoutStep

Un paso del checkout. `summary` se muestra cuando el paso está completado.

`ZCCheckoutStep(id: String, title: String, summary: String? = …)`

### ZCCheckoutSteps

Pasos del checkout: una sección por paso (radio 16, borde); el actual abierto, los futuros al 60 %. Círculo de 28 pt: completado en `success` con check, actual en `primary` con número, futuro solo con borde. Los completados muestran su resumen y "Editar". VoiceOver lee "completado", "paso actual" o "bloqueado"; al cambiar de paso, el foco va al título. El botón "Guardar y continuar" lo pone la pantalla dentro del cuerpo.

`ZCCheckoutSteps(steps: [ZCCheckoutStep], current: Binding<Int>, @ViewBuilder body: @escaping (_ index: Int) -> StepBody)`

### ZCCartLine

`ZCCartLine(id: String, name: String, brand: String, price: Double, qty: Int, note: String? = …, category: String? = …)`

### ZCCartFee

`ZCCartFee(label: String, amount: Double, info: String? = …)`

### ZCCart

Carrito: "Tu carrito (n)", líneas con miniatura de 56 pt (44 en pantallas angostas), nombre, "marca · nota · precio c/u", cantidad de 1 a 10, quitar (aviso "Producto eliminado") y total de la línea; `coupon` debajo de las líneas; resumen con subtotal, descuento en verde (tope el subtotal), cargos con su ayuda y total; "Pago 100 % seguro". Vacío: estado con acción.

`ZCCart(lines: Binding<[ZCCartLine]>, country: String, discount: Double = …, fees: [ZCCartFee] = …, toasts: ZCToastState? = …, onRemoved: ((ZCCartLine) -> Void)? = …, @ViewBuilder coupon: () -> Coupon, @ViewBuilder empty: () -> Empty)`

### ZCAmountPicker

Elegir un monto: montos como grupo de opciones, "Otro" abre un monto libre entre `min` y `max`, y los agotados van tachados y sin respuesta. El mensaje del campo muestra "Total: S/ 50.00"; con "Otro" vacío o fuera de rango avisa. Los montos se dan en la moneda de `country`.

`ZCAmountPicker(_ label: String, amounts: [Double], value: Binding<Double?>, soldOut: [Double] = …, allowOther: Bool = …, min: Double = …, max: Double = …, country: String = …, required: Bool = …)`

### ZCCouponKind

Casos: `pct`, `fix`, `gc`

### ZCCoupon

`pct`: porcentaje del subtotal (0,10 = 10 %) · `fix`: monto fijo · `gc`: gift card con saldo. `solo`: no se combina con otros.

`ZCCoupon(code: String, kind: ZCCouponKind, value: Double, description: String, solo: Bool = …)`

### ZCCouponCheck

Casos: `valid`, `notFound`, `expired`

### ZCCouponField

Cupones y gift cards: hasta `max` códigos con las reglas de combinación. `validate` consulta el código (en la app, el servicio); el campo resuelve repetidos, "no combinable" y el máximo, y avisa cada resultado. Los códigos se escriben en mayúsculas; "Listo" del teclado también aplica.

`ZCCouponField(_ label: String, value: Binding<[ZCCoupon]>, subtotal: Double = …, country: String = …, max: Int = …, hint: String? = …, optional: Bool = …, validate: @escaping (String) async throws -> ZCCouponCheck)`

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

## ZCFieldsExtra.swift

### ZCSlider

Deslizador de un valor, para ir dentro de un `ZCField`. Paso a paso con háptica; para VoiceOver es ajustable (deslizar arriba o abajo) y anuncia `format(valor)` ("4,5 %"). Pista de 6 pt, perilla de 24 con área de toque de 44.

`ZCSlider(value: Binding<Double>, in range: ClosedRange<Double> = …, step: Double = …, label: String? = …, format: ((Double) -> String)? = …)`

### ZCRangeSlider

Deslizador de rango: dos perillas que no se cruzan (`minGap`), anunciadas como "mínimo" y "máximo".

`ZCRangeSlider(low: Binding<Double>, high: Binding<Double>, in range: ClosedRange<Double> = …, step: Double = …, minGap: Double = …, minLabel: String? = …, maxLabel: String? = …, format: ((Double) -> String)? = …)`

### ZCTimeField

Campo de hora: se escribe hh:mm (24 h, los dos puntos se ponen solos) o se elige con la rueda del sistema. El ícono de reloj, a la derecha, la abre. Valor: "hh:mm", o el texto escrito si aún no está completo; nulo si está vacío.

`ZCTimeField(_ label: String, value: Binding<String?>, hint: String? = …, error: String? = …, info: String? = …, required: Bool = …, optional: Bool = …)`

### ZCSecretField

Credencial enmascarada: los últimos 4 caracteres a la vista, mostrar (solo con `canReveal`; avisa por `onRevealed` para la auditoría) y copiar con confirmación. Copiar siempre copia el valor real, marcado como local y con vencimiento para que no viaje a otros dispositivos. El estado "visible" no se conserva al volver.

`ZCSecretField(value: String, label: String, hint: String? = …, canReveal: Bool = …, keepPrefix: String = …, toasts: ZCToastState? = …, onRevealed: @escaping () -> Void =)`

### ZCTagKind

Casos: `email`, `text`

### ZCTagsField

Varias etiquetas (por lo general correos) en un campo. Coma, punto y coma, espacio o "Listo" del teclado agregan; pegar una lista la separa; las repetidas se avisan y no se agregan; con `max`, al llegar al tope el campo lo dice. Cada etiqueta se valida por separado (no válida con texto para VoiceOver).

`ZCTagsField(_ label: String, value: Binding<[String]>, kind: ZCTagKind = …, max: Int? = …, placeholder: String? = …, hint: String? = …, error: String? = …, required: Bool = …, optional: Bool = …)`

## ZCFormsMore.swift

### ZCStepper

Pasos de un formulario largo. Desde 768 pt de ancho: pasos en horizontal (hechos con check, el actual destacado; se desplazan si no caben). En iPhone: compacto, "Paso 2 de 4: Contacto" con barra de progreso. No es interactivo: solo informa.

`ZCStepper(steps: [String], current: Int, label: String)`

### ZCFormError

`ZCFormError(id: String, message: String)`

### ZCFormSummary

Resumen de errores al tope del formulario. Al fallar el envío el resumen se anuncia de inmediato y cada error es un toque que lleva al campo (`onGo`). Sin errores no ocupa espacio.

`ZCFormSummary(errors: [ZCFormError], onGo: @escaping (String) -> Void)`

### ZCPasswordField

Contraseña nueva con medidor de seguridad: mostrar y ocultar con un solo ícono, cuatro barras (peligro, aviso, info, éxito) y el nivel anunciado. El medidor no reemplaza el mensaje del campo: los errores siguen en el campo. Los requisitos van aparte, con `ZCPasswordRules`.

`ZCPasswordField(_ label: String, text: Binding<String>, hint: String? = …, error: String? = …, required: Bool = …, submitLabel: SubmitLabel = …, onSubmit: (() -> Void)? = …)`

### ZCPasswordRules

Requisitos de la contraseña: ícono y texto, y "cumplido" o "pendiente" para VoiceOver.

`ZCPasswordRules(value: String)`

## ZCGroups.swift

### ZCCheckboxOption

Una opción de `ZCCheckboxGroup`.

`ZCCheckboxOption(_ value: String, label: String, description: String? = …, enabled: Bool = …)`

### ZCCheckboxGroup

Varias casillas con una sola etiqueta (equivale a `zc-checkbox-group`): el grupo se anuncia con su nombre, y el error o la ayuda quedan debajo. `selection` es el conjunto de valores marcados. Con `selectAllLabel` aparece arriba "Seleccionar todo", que queda a medias cuando hay algunas marcadas y no cambia las opciones deshabilitadas.

`ZCCheckboxGroup(_ label: String, options: [ZCCheckboxOption], selection: Binding<Set<String>>, hint: String? = …, error: String? = …, required: Bool = …, horizontal: Bool = …, selectAllLabel: String? = …)`

### ZCFieldset

Agrupa campos relacionados con una leyenda que VoiceOver anuncia como título del grupo (equivale a `zc-fieldset`). `bordered` lo dibuja como una tarjeta suave. 16 pt entre la leyenda y cada campo.

`ZCFieldset(_ legend: String, description: String? = …, bordered: Bool = …, @ViewBuilder content: () -> Content)`

## ZCInfoSheets.swift

### ZCLegalSection

Una sección de un documento legal: encabezado y párrafos.

`ZCLegalSection(title: String, paragraphs: [String])`

### ZCLegalDocument

Términos o política de privacidad: título, versión y secciones.

`ZCLegalDocument(title: String, version: String? = …, sections: [ZCLegalSection])`

### ZCLegalConsent

Aceptación de términos en una caja: casilla, enlaces para leer los términos y la política (la app abre `zcLegalSheet`) y, ya aceptados, el chip "Términos aceptados". `error` marca la casilla cuando se intenta continuar sin aceptar.

`ZCLegalConsent(checked: Binding<Bool>, error: Bool = …, onOpenTerms: @escaping () -> Void, onOpenPrivacy: @escaping () -> Void)`

### ZCSupportInfo

Canales de contacto; los que faltan no se muestran. Teléfonos en formato internacional (+51900000099).

`ZCSupportInfo(hours: String? = …, phone: String? = …, whatsapp: String? = …, email: String? = …, url: String? = …)`

### ZCSupportActions

Qué hace cada fila al tocarla. Por defecto abre la app del sistema (teléfono, WhatsApp, correo o navegador).

`ZCSupportActions(call: @escaping (String) -> Void, whatsapp: @escaping (String) -> Void, email: @escaping (String) -> Void, web: @escaping (String) -> Void)`

## ZCLocation.swift

### ZCLatLng

Punto del mapa en grados decimales (WGS 84).

`ZCLatLng(lat: Double, lng: Double)`

### ZCLocationPicker

Punto exacto en el mapa (dirección de entrega, local): mapa de MapKit con pin que se coloca con un toque, botones para moverlo (norte, sur, este y oeste: la alternativa para VoiceOver y para ajustes finos), coordenadas escritas como alternativa (latitud y longitud validadas) y, si la app lo pide, "Usar mi ubicación" (el permiso `NSLocationWhenInUseUsageDescription` y la lectura los hace la app). `center` centra el mapa mientras no hay punto (por ejemplo, el distrito elegido en `ZCUbigeoSelect`).

`ZCLocationPicker(_ label: String, value: Binding<ZCLatLng?>, center: ZCLatLng = …, onUseMyLocation: (() -> Void)? = …, locating: Bool = …, locationError: String? = …)`

## ZCLogos.swift

### ZCLogo

Logo de un medio de pago, red o marca: color de marca por defecto; `mono` usa el color del texto. Los negros pasan al color del texto para verse en oscuro. Con `label` es una imagen con nombre ("Visa"); sin él es decorativo y el texto va al lado. Un nombre desconocido muestra sus dos primeras letras. Úsalos solo para identificar medios de pago, redes y comercios.

`ZCLogo(_ name: String, size: CGFloat = …, mono: Bool = …, label: Bool = …)`

### ZCSsoProvider

Casos: `google`, `apple`, `microsoft`

### ZCSsoTheme

Casos: `light`, `dark`, `neutral`, `black`, `white`, `outline`

### ZCSsoText


### ZCSsoButton

Acceso con Google, Apple o Microsoft (Entra ID) según la guía de cada marca: logo sin modificar, texto aprobado y colores propios (tokens `sso*`). Pastilla para Google y Apple, rectángulo para Microsoft. `text = nil` deja solo el logo, con su nombre para VoiceOver. `loading` muestra "Redirigiendo…" mientras se abre el proveedor. Este botón solo dibuja y avisa: el flujo (`ASAuthorizationController` para Apple, `ASWebAuthenticationSession` para los demás) lo hace la app. Apple pide ofrecer "Iniciar sesión con Apple" si hay otros accesos de terceros.

`ZCSsoButton(_ provider: ZCSsoProvider, theme: ZCSsoTheme? = …, text: ZCSsoText? = …, block: Bool = …, loading: Bool = …, action: @escaping () -> Void)`

## ZCMap.swift

### ZCMapPoint

Punto del mapa (ciudad): `value` es la cantidad y fija el tamaño.

`ZCMapPoint(name: String, lat: Double, lng: Double, value: Double)`

### ZCMap

Mapa de puntos: los límites de países de la web (sin teselas externas), los países del `scope` en `mapScope` y un punto por ciudad con tamaño según la cantidad. Pellizco para acercar y un dedo para mover (con zoom; sin zoom el dedo sigue desplazando la página); los botones + y − hacen lo mismo con un solo toque. Tocar un punto abre el globo con su cantidad. Para VoiceOver, el resumen lista cada ciudad con su cantidad.

`ZCMap(label: String, points: [ZCMapPoint], scope: [String] = …, unit: String = …, format: ((Double) -> String)? = …, initialZoom: CGFloat = …, initialSelection: Int? = …)`

## ZCMfaSetup.swift

### ZCMfaSetup

Activar el segundo factor, TOTP. 1) Escanear el QR con una app de autenticación, o escribir la clave a mano. 2) Escribir el código de 6 dígitos, que valida `verify`. 3) Si hay `recoveryCodes`: mostrarlos con copiar y guardar en un archivo (selector de archivos del sistema), y confirmar que se guardaron. El servidor genera el secreto: aquí llega `qrPayload` (la URI `otpauth://…`) y el componente no crea secretos. El QR va siempre sobre fondo claro.

`ZCMfaSetup(qrPayload: String, secret: String, account: String = …, recoveryCodes: [String] = …, fileName: String = …, verify: @escaping (String) async throws -> Bool, onFinished: @escaping () -> Void, @ViewBuilder cancel: () -> Cancel)`

## ZCNotifications.swift

### ZCNotificationKind

Casos: `apr`, `alr`, `other`

### ZCNotification

`ZCNotification(id: String, icon: ZCIconName, title: String, meta: String, kind: ZCNotificationKind, unread: Bool, group: String)`

### ZCNotifications

Campana de la barra superior con su panel: contador de no leídas, "Marcar todo como leído", pestañas Todas, Aprobaciones y Alertas, grupos por fecha y "Ver todas". El panel es una hoja inferior. Abrir una notificación la marca como leída y avisa por `onOpen` para navegar.

`ZCNotifications(items: Binding<[ZCNotification]>, onOpen: @escaping (ZCNotification) -> Void, onSeeAll: @escaping () -> Void)`

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

## ZCScanner.swift

### ZCBiometricResult

Casos: `success`, `cancelled`, `failed`

### ZCBiometric

Face ID o Touch ID con el diálogo del sistema. Úsalo desde el botón de biometría de `ZCPinPad`. La app nunca ve los datos biométricos: solo recibe éxito, cancelación o error. La app cliente debe declarar `NSFaceIDUsageDescription` en su Info.plist.


### ZCScanner

Escáner de QR y códigos de barras con AVFoundation: visor oscuro con guía de 240 pt (radio 20), máscara, esquinas, línea de escaneo animada (quieta con "Reducir movimiento") y mensaje anunciado. Barra con Linterna, Ingresar código (camino manual, siempre visible) y Cambiar cámara. Pide el permiso de cámara al iniciar; si se niega, lo explica y deja el camino manual. Lee QR, Code 128 y EAN-13; al leer vibra, se detiene y emite `onScanned`. La app cliente debe declarar `NSCameraUsageDescription` en su Info.plist. En el simulador no hay cámara: se muestra el aviso y el camino manual.

`ZCScanner(toasts: ZCToastState? = …, onScanned: @escaping (String) -> Void, onManual: @escaping () -> Void)`

### ZCPinPadState

Estado del teclado de PIN: `reject()` tiembla, vibra y limpia (PIN incorrecto), como `reject()` de la web.

`ZCPinPadState()`

### ZCPinPad

Teclado de PIN en pantalla: puntos de 16 pt con borde de 2 (anunciados como "PIN, 2 de 4 dígitos"), teclas de 72 × 64 con radio 20 y número de 24, separadas 12; biometría y borrar. Vibra en cada tecla; el error lleva ícono. El PIN nunca se muestra.

`ZCPinPad(value: Binding<String>, length: Int = …, error: String? = …, state: ZCPinPadState = …, onComplete: ((String) -> Void)? = …, onBiometric: (() -> Void)? = …)`

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

## ZCUbigeo.swift

### ZCUbigeoPlace

Un nivel del ubigeo (INEI): departamento (2 dígitos), provincia (4) o distrito (6).


### ZCUbigeo

Ubigeo del Perú (INEI): departamento › provincia › distrito, desde el mismo archivo que la web (`ubigeo-pe.json`; datos MIT © 2025 MichaelSuarez0). Consulta con índices por código.


### ZCUbigeoSelect

Departamento › provincia › distrito del Perú. El valor es el código del distrito (6 dígitos) o nulo. Cambiar un nivel limpia los de abajo. Cada nivel es un select con búsqueda (más de 8 opciones). `onLocated` entrega el distrito con sus coordenadas (centro de mapa).

`ZCUbigeoSelect(value: Binding<String?>, required: Bool = …, error: String? = …, data: ZCUbigeo? = …, onLocated: @escaping (ZCUbigeoPlace) -> Void =)`

## ZCWallet.swift

### ZCWalletOs

Casos: `apple`, `google`

### ZCBarcode

Casos: `qr`, `code128`, `code39`

### ZCCodeImage

Código QR o de barras real, siempre negro sobre blanco (tokens `qr*`) con el número debajo. Decorativo: el pase que lo contiene lo anuncia.

`ZCCodeImage(_ value: String, format: ZCBarcode, caption: String? = …, showsValue: Bool = …)`

### ZCLoyaltyPass

Datos de un pase de fidelidad. Los colores del pase vienen de la marca del programa (no de los tokens del sistema).

`ZCLoyaltyPass(program: String, member: String, points: Int, tier: String, bg: Color, fg: Color, label: Color, code: String, art: Image? = …)`

### ZCWalletPass

Pase de puntos en Apple o Google Wallet: vista aproximada del pase real, ancho máximo 320 pt. VoiceOver lo lee como una imagen ("Pase de Apple Wallet: …"). `back` muestra el reverso.

`ZCWalletPass(pass: ZCLoyaltyPass, os: ZCWalletOs = …, country: String = …, back: Bool = …)`

### ZCGiftcardData

Datos de una giftcard en wallet. `expires` en ISO (`aaaa-mm-dd`); colores del emisor.

`ZCGiftcardData(issuer: String, title: String, balance: Double, number: String, pin: String? = …, expires: String? = …, barcode: ZCBarcode = …, image: Image? = …, bg: Color, fg: Color, label: Color, terms: String? = …, support: String? = …)`

### ZCGiftcardPass

Giftcard en Apple o Google Wallet: saldo, número enmascarado (•••• 1234), vencimiento y código. En Apple el PIN solo va en el reverso y Code 39 se muestra como QR con aviso. Debajo, siempre, la nota de vista aproximada.

`ZCGiftcardPass(card: ZCGiftcardData, country: String, os: ZCWalletOs = …, back: Bool = …)`
