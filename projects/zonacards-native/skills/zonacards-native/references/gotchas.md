# Trampas conocidas de Compose en Zonacards

Cada una costó una vuelta de compilación o de pruebas. Léelas antes de escribir un componente nuevo.

## Código

- **Parámetros llamados `min` y `max`** tapan `kotlin.math.min/max` dentro de la función: `max(a, b)` deja de compilar. Usa `lo`/`hi`, `minValue`/`maxValue`.
- **Una variable local llamada `remember`** (o `derivedStateOf`…) tapa la función. Llámala `rememberMe`.
- **`fieldName(label, required)` es `@Composable`**: no se puede llamar dentro de `semantics { }` ni de un lambda no composable. Calcúlala antes.
- **`ZcText` pisa la fuente** con `LocalZcFontFamily`. Para texto monoespaciado (credenciales, códigos) envuelve con `CompositionLocalProvider(LocalZcFontFamily provides FontFamily.Monospace)`.
- **Layouts que miden en subcomposición** (`SubcomposeLayout`, `BoxWithConstraints`) no admiten intrínsecos (`IntrinsicSize`): fallan en ejecución. Dale tamaño explícito.
- **Imports que se olvidan**: `ZcType`, `ZcIcons`, `ZcRadius`, `ZcMotion`, `R` y `ZcShape` están en `com.zonacards.ui.tokens`; las funciones del dominio (`ZcMoney`, `ZcDates`, `ZcPhone`) en `com.zonacards.ui.tokens.domain`. `KeyEvent.nativeKeyEvent` es miembro: no se importa.
- **Radios y alturas**: para campos, tarjetas, hojas y botones usa `ZonacardsTheme.shape.*`, no `ZcRadius.sm/md/lg` ni `ZcSize.target`; de lo contrario esa pieza no sigue a la marca. `ZonacardsTheme.shape` es `@Composable`: léelo antes de entrar a un lambda de modificador no composable.
- **Montos**: el formato lleva espacios irrompibles (`S/ 1,000.00`). Arma el texto completo con `ZcMoney.formatWhole`/`format` y úsalo igual en pantalla y en pruebas; nunca lo concatenes a mano.
- **Fechas**: el valor es texto ISO `aaaa-mm-dd` (`LocalDate.parse`); formatea solo al mostrar con `ZcDates.format(instant, ZcDateStyle.MEDIUM, lang, "UTC")`.
- **Logos de marca y de acceso** viajan como datos (`zc_logos.json`) y se dibujan con `PathParser`, no como `VectorDrawable`: el parser de Android no lee las banderas de arco comprimidas de los SVG. No intentes convertirlos a XML.
- **Un `LaunchedEffect` que lee y escribe el mismo estado** puede hacer un bucle: sincroniza desde el valor externo solo cuando difiere de lo que ya hay.
- **`Role.DropdownList` / `RadioButton` / `Button`**: ponlos en el `clickable`, no en `semantics`, o TalkBack anuncia mal.
- **Listas perezosas** (`LazyColumn`) descartan lo que sale de pantalla: no guardes estado dentro del ítem ni asumas que existe en el árbol.
- **Sin red en los componentes**: lo que descarga (teselas del mapa, documentos legales) se recibe como lambda (`fetchTile`, `document`) para poder probarlo y para que la app decida el cliente HTTP.

## Pruebas

- **Pantalla pequeña oculta nodos**: Robolectric usa 320 dp. Un nodo fuera de pantalla "no se muestra" y un clic fuera de límites no hace nada. Pon `@Config(qualifiers = "es-w320dp-h1600dp")` en la clase de pruebas.
- **El estado de la prueba debe ser `mutableStateOf`**: si el componente lee `var x` normal, no se recompone y la aserción posterior falla.
- **`onNodeWithText` falla si hay varios** (por ejemplo, "Lima" es departamento y provincia). Usa `onAllNodesWithText(...).fetchSemanticsNodes()` o un nombre más específico.
- **Campo editable ≠ texto**: su nodo tiene `EditableText`; para el valor usa `assertTextEquals` o `hasSetTextAction()`. Un campo OTP expone un solo nodo editable.
- **`waitUntil` adelanta el tiempo virtual**; con `mainClock.autoAdvance = false` (capturas) avanza a mano con `advanceTimeBy`.
- **Listas perezosas y pruebas**: un elemento lejano no está compuesto. Elige un caso cercano al inicial o desplázate con `performScrollToNode`.
- **Capturas**: el tamaño es 400 dp × 3800 dp a 2×. Si la sección es más larga, la imagen sale recortada y lo de abajo no se prueba: sube la altura con `@Config` en esa prueba (por ejemplo `es-w400dp-h5600dp-xhdpi`).
- **Mismo resultado en claro y oscuro**: revisa las dos capturas; el contraste lo vigila `ContrastTest`.
- **Cambiaste un componente base y las capturas cambiaron**: no regraves a ciegas. Abre el diff, decide si el cambio es intencional y solo entonces `-Psnapshots=record`.

## Compilar en Windows

- Gradle con `build-local.ps1` (envuelve el wrapper y escribe `build-local.log` en UTF-16; el estado final es la línea `EXIT n`). Lanza el build en una pestaña de terminal y espera a `EXIT` leyendo el log (`iconv -f UTF-16 -t UTF-8`). No más de seis pestañas abiertas: cierra las viejas.
- Si la carpeta temporal del usuario tiene tilde, Gradle puede fallar con `Unable to establish loopback connection`: apunta `TMP`/`TEMP` a una ruta sin tilde.
- Cambiar `zonacards-tokens` (tokens, textos, íconos) recompila todo: tarda minutos. Agrupa los cambios.
