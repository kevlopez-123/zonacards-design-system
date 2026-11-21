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
