# Plan de iOS (SwiftUI)

Estado de partida y camino para tener en iOS lo mismo que hoy hay en Android, con las mismas pruebas.

## De dónde se parte

| Hay | No hay |
| --- | --- |
| Paquete Swift `ZonacardsTokens` (iOS 17+): temas por marca y modo con colores, `ZCShape`, `ZCSpace`, `ZCRadius`, `ZCSize`, `ZCType` (Dynamic Type), `ZCMotion`; íconos (`ZCIcon`), banderas, fuentes, textos (`Localizable.xcstrings`), datos (países, ubigeo, logos) y el dominio (`ZCMoney`, `ZCDates`, `ZCPhone`, `ZCPassword`, `ZCTaxId`, `ZCRecurrence`, `ZCDomainData`) con los vectores de prueba compartidos. Todo generado por `npm run native`. | Componentes SwiftUI (los 123 `Zc*` de Android), pantalla de catálogo, capturas, auditoría de accesibilidad, proyecto de Xcode, integración continua. |
| El código Swift generado se escribió para compilar, con la misma lógica que Kotlin. | **Nada de Swift se ha compilado ni probado** (el equipo trabaja en Windows). Hay que esperar correcciones de compilación al empezar. |

## Condición previa: dónde se compila

Sin un Mac no se puede avanzar con certeza. Opciones, de más a menos recomendable:

1. **Integración continua en macOS** (GitHub Actions `macos-15`, Bitbucket Pipelines con runner macOS, o Xcode Cloud): cada cambio compila, corre las pruebas y deja las capturas como artefacto. Permite trabajar desde Windows y es lo que dejaría iOS al mismo nivel de verificación que Android. Cuesta minutos de runner por corrida.
2. **Un Mac propio o remoto** (alquilado por horas, tipo MacStadium): sirve para depurar visualmente en simulador. Combinable con la opción 1.
3. **Escribir sin compilar**: posible, pero cada pieza queda "escrita, sin compilar" y los errores se acumulan. No lo recomiendo más allá de un bloque corto.

**Decisión 1 (tuya):** ¿qué opción? Mi recomendación: la 1 desde el primer día, y la 2 si hay un Mac disponible.

## Estructura

```
projects/zonacards-native/ios/
  Package.swift                      productos: ZonacardsTokens (hay), ZonacardsUI (nuevo)
  Sources/ZonacardsTokens/           generado (hay)
  Sources/ZonacardsUI/               componentes SwiftUI (nuevo): mismos nombres que Android con prefijo ZC
  Tests/ZonacardsUITests/            comportamiento y capturas (swift-snapshot-testing)
  Catalog/                           app de catálogo (proyecto con XcodeGen: project.yml) con la misma navegación por secciones
```

Reglas (las mismas de `zonacards-principles`): solo tokens (`theme.shape`, `theme.colors.fieldBg`…), sin estilos del sistema (nada de `.borderedProminent`, `Form`, `Picker` con estilo por defecto), textos de `Localizable.xcstrings`, dominio de `ZonacardsTokens`, Dynamic Type, VoiceOver, "Reducir movimiento" y destinos táctiles de 44 pt.

## Estado

**Noviembre de 2026: las olas 0 a 3 están escritas, compilan y pasan sus pruebas en CI (macOS, simulador de iPhone 16).** Repositorio de prueba: `kevlopez-123/zonacards-design-system` (privado, personal); el flujo se lanza solo al subir a `main` o con `gh workflow run native-ios.yml` (`-f record=true` graba capturas nuevas).

| Qué | Resultado en CI |
| --- | --- |
| Compilación de `ZonacardsTokens` (todo lo generado) y de `ZonacardsUI` (146 tipos públicos) | Verde |
| 38 pruebas del paquete: dominio con los 1 970 casos compartidos con la web y Android, átomos, formularios, estructura, dominio, compra, cuenta, acceso y Dynamic Type | Verde |
| 32 capturas de referencia (8 secciones × Zonacards y Giftealo × claro y oscuro), comparadas con un margen de 1 % | Verde |
| Auditoría de accesibilidad de Apple sobre las 8 secciones | Verde en contraste, descripción y área de toque; ver "Hallazgos abiertos" |
| Verificadores previos: claves de texto (589) y orden de argumentos de Swift (151 llamadas) | Verde |

**Contenido:** átomos (12), formularios (campo, texto, área, buscador, selects con hoja, fecha, hora, monto, teléfono, documento, OTP, número, deslizadores, etiquetas, secreto, contraseña con medidor), estructura y overlays (barras, avisos, estados, menú, fila deslizable, hojas con subpantallas, modal, confirmaciones, toasts), contenido y dominio (avisos, pestañas, acordeón, ficha, historial, tarjeta, KPI, monto, estados, pagos, producto), compra (pasos, carrito, cupones, monto), cuenta (legal, soporte, introducción, sesión, país, notificaciones, ubigeo, eliminar cuenta, wallet y pases, QR y códigos), acceso (acceso completo, segundo factor, PIN, biometría, escáner, logos y proveedores).

**Hallazgos abiertos**
- Dynamic Type (resuelto en casi todo): la causa era que `xxs` y `tiny` (10 y 11 pt) estaban atados a `relativeTo: .caption2`; la auditoría de Apple marca 11 pt sobre `caption2` y no marca el mismo tamaño sobre `caption`, `footnote` o `subheadline` (medido en CI con el banco `DynamicTypeLab`, que se abre con `-dtlab`). Ahora van sobre `caption` y Dynamic Type **falla** la auditoría en 7 de las 8 secciones. Queda un caso sin explicar: los 8 nombres de las muestras de color de Fundamentos se marcan en el catálogo pero no en el banco con la misma estructura; las fuentes sí crecen (medido: 16 → 49 pt en el tamaño más grande). Es AVISO solo en esa sección.
- Texto cortado dentro de la pantalla: también AVISO; la auditoría lo marca en los títulos de navegación del sistema. Las capturas no muestran recortes.
- Code 39 solo validado contra las reglas del formato, no con un lector real. QR y Code 128 dependen de CoreImage.
- Casilla mixta sin "mixto" para VoiceOver (falta la clave `ui.mixto` en i18n, que cambia web y Android).
- Importar y exportar no existe aún en ninguna plataforma nativa.
- Probado solo en simulador: cámara, Face ID y Sign in with Apple necesitan un iPhone.

**Siguiente:** ola 4 (gráficos con Canvas y mapa con MapKit) y ola 5 (cambio de marca en vivo, iPad con `NavigationSplitView`, publicación por SwiftPM). Decisiones 2 y 3 sin respuesta explícita: se sigue con las recomendadas (Canvas y MapKit).

## Olas

Mismas olas que Android, para poder comparar pieza por pieza. Cada ola termina con: compila, pruebas verdes, capturas claro y oscuro revisadas, auditoría de accesibilidad sin hallazgos, README y guía actualizados.

| Ola | Contenido | Piezas aprox. |
| --- | --- | --- |
| 0. Infraestructura | Integración continua en macOS, producto `ZonacardsUI`, proyecto del catálogo, capturas de referencia, auditoría con `performAccessibilityAudit()`, corrección de lo generado que no compile, script que genera la referencia de API de Swift (como `build-native-docs.mjs`). | — |
| 1. Átomos y formularios | `ZCText`, botón (`ButtonStyle` propio con resorte), íconos, chip, badge, avatar, checkbox, switch, radio, segmentado, campo de texto (`ZCField`), contraseña, OTP, número, select con hoja propia, fecha, montos, teléfono, documento. | ~35 |
| 2. Estructura y overlays | Hojas inferiores (`.sheet` con `presentationDetents`, sin estilo del sistema), modal, alerta, toasts, barra superior e inferior, pestañas, acordeón, estados vacío y error, esqueleto. | ~25 |
| 3. Dominio, cuenta y comercio | Tarjetas, KPI, wallet y pases, escáner (AVFoundation / Vision), checkout, cupones, acceso con proveedor (Sign in with Apple obligatorio), segundo factor, sesión por expirar, notificaciones, país, ubigeo, hojas legal y de soporte, introducción, eliminar cuenta, importar y exportar. | ~35 |
| 4. Gráficos y mapa | Los 11 gráficos con los mismos datos y colores de la web, vista de datos y resumen para VoiceOver; mapa de países y selector de punto con MapKit. | ~15 |
| 5. Pulido | Cambio de marca en vivo, plantillas adaptables (iPhone y iPad con `NavigationSplitView`), guía `zonacards-native` actualizada para iOS, publicación del paquete por SwiftPM. | ~10 |

## Decisiones técnicas

| Tema | Recomendación | Por qué |
| --- | --- | --- |
| Gráficos | **Dibujados a mano con `Canvas`**, como en Android | Swift Charts no cubre embudo, cascada, treemap, sankey ni medidor, y un solo estilo en las dos plataformas evita diferencias visuales. Para VoiceOver, `accessibilityChartDescriptor` en los tipos que lo admiten y la vista de datos para todos. |
| Mapa de punto exacto | **MapKit** (iOS 17: `Map` con `MapReader`) | Es lo que espera una app de iPhone y evita la política de uso de teselas; Android usa teselas de OpenStreetMap por no tener SDK. Misma interfaz (`ZCLocationPicker(value:onChange:center:)`). |
| Fechas | `DatePicker` nativo (rueda o compacto) con la forma de campo del sistema | Es el patrón de iOS; el rango usa calendario propio como en Android. |
| Selects | Hoja propia con la lista del sistema de diseño | Igual que Android: nada de `Menu`/`Picker` con estilo por defecto. |
| Tipografía | Fuentes de la marca registradas con `ZCFonts.register()` y `Font.custom(..., relativeTo:)` | Dynamic Type sin perder la fuente de marca. |
| Capturas | `swift-snapshot-testing` (dependencia solo de pruebas) a 390 × alto de sección, claro y oscuro | Equivale a los snapshots de Android. |
| Mínimo | iOS 17 (ya fijado) | `@Observable`, `MapReader`, `ScrollView` modernos. |

**Decisión 2 (tuya):** gráficos con `Canvas` (recomendado) o Swift Charts donde exista.
**Decisión 3 (tuya):** MapKit (recomendado) o las mismas teselas de OpenStreetMap que Android.

## Riesgos

- Swift sin compilar: la primera ola puede tardar por errores de lo ya generado (`ZCTokens.swift`, `ZCDomainData.swift`, `ZCIcon`).
- Diferencias de redondeo y de fuentes entre plataformas: las capturas de iOS y Android no serán idénticas píxel a píxel; se comparan a ojo y por las medidas de los tokens.
- Sign in with Apple, escáner, biometría y wallet piden entitlements y permisos en la app cliente, no en la librería.
- App Store: eliminar cuenta (ya está en la lista), enlaces legales y la declaración de privacidad.

## Qué entrego al final

Paquete `ZonacardsUI` con todos los componentes, catálogo con capturas, pruebas y auditoría de accesibilidad en CI, referencia de API generada, la skill `zonacards-native` con iOS al mismo nivel que Android, y el paquete publicable por SwiftPM (ver `distribucion-multiplataforma.md`).
