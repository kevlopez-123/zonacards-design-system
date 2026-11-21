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
