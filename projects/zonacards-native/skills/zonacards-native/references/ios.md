# iOS (SwiftUI): lo que hay y lo que no

**Estado honesto (noviembre de 2026): las olas 0 a 5 de iOS están escritas, compilan y pasan sus pruebas en CI (macOS, simulador).** Hay paquete (`ZonacardsTokens`, `ZonacardsUI`), catálogo, 52 pruebas (incluye los 1 970 casos de dominio compartidos), 40 capturas de referencia y auditoría de accesibilidad de Apple. La ola 5 está hecha (marca en vivo con `ZCBrandStore`, `ZCAdaptiveScaffold` y `ZCListDetail` para iPad); la publicación por SwiftPM está preparada pero sin ejecutar. Hay hallazgos abiertos (Dynamic Type en textos pequeños, probado solo en simulador): ver `docs/plan-ios.md`. No presentes como "probado en un iPhone" lo que solo corrió en simulador. Referencia de la API: `references/swift-api.md` (generada).

## Lo que hay (`projects/zonacards-native/ios`, paquete `ZonacardsTokens`)

| Qué | Dónde | Generado |
| --- | --- | --- |
| Temas (4 marcas × claro/oscuro), `ZCSpace`, `ZCRadius`, `ZCSize`, `ZCType` (Dynamic Type), `ZCMotion`, `ZCShape` | `Generated/ZCTokens.swift` | Sí (`npm run native`) |
| Íconos Solar/Lucide como SVG vectorial, `ZCIconName`, `ZCIcon` | `Icons.xcassets`, `Generated/ZCIconName.swift`, `ZCIcon.swift` | Sí |
| Banderas `ZCFlag("pe")`, fuentes `ZCFonts.register()` | `Generated/` y `Resources/` | Sí |
| Textos (es/en) | `Localizable.xcstrings` (`{{x}}` → `%1$@`) | Sí |
| Datos: países, `latam.json`, `ubigeo-pe.json` (INEI, MIT), `logos.json` | `Resources/` | Sí |
| Dominio: `ZCMoney`, `ZCDates`, `ZCPhone`, `ZCPassword`, `ZCTaxId`, `ZCRecurrence`, `ZCDomainData` | `Domain/*.swift` | Sí, con vectores de prueba compartidos con Android y web (`DomainVectorsTests`) |

Uso básico (compila en un Mac con Xcode 16+, iOS 17+):

```swift
@Environment(\.zcTheme) var theme
Text("Lotes").font(.zc(ZCType.title, theme: theme)).foregroundStyle(theme.colors.text)
RoundedRectangle(cornerRadius: theme.shape.card)   // forma por marca
```

## Ola 0 (escrita, sin compilar)

| Qué | Dónde |
| --- | --- |
| Producto `ZonacardsUI` (depende de `ZonacardsTokens`; sin dependencias externas) | `ios/Package.swift`, `Sources/ZonacardsUI` |
| `ZCThemeProvider(brand:dark:)` (tema + fuentes + modo) y `ZCText(style:tone:)` | `Sources/ZonacardsUI` |
| Ola 1, átomos (`ZCTone`, `ZCButton`, `ZCIconButton`, `ZCSpinner`, `ZCBadge`, `ZCAvatar`, `ZCAvatarGroup`, `ZCChip`, `ZCDivider`, `ZCSwitch`, `ZCCheckbox` con estado mixto, `ZCRadioGroup`, `ZCProgress`, `ZCSkeleton`) y `ZCString.text("ui.clave", args)` para los textos | `Sources/ZonacardsUI`, `Sources/ZonacardsTokens/ZCString.swift` |
| Ola 1, formularios: `ZCField` (etiqueta, obligatorio/opcional, ayuda `?`, error, éxito, contador, aviso `ZCFlash`), `ZCTextField` (contraseña, `allowed`, `maxLength`, prefijo/sufijo, ícono), `ZCTextArea`, `ZCSearchField`, `ZCSelect`/`ZCMultiSelect` (hoja propia, búsqueda desde 9 opciones), `ZCDateField` (ISO `aaaa-mm-dd`), `ZCMoneyField`, `ZCPhoneField`, `ZCTaxIdField`, `ZCOtpField`, `ZCNumberField` | `Sources/ZonacardsUI` |
| Ola 2, estructura y overlays: `ZCTopBar`, `ZCBottomNav` (`ZCNavItem`), `ZCSystemBanner`, `ZCOfflineBanner`, `ZCState` (+`ZCTechDetails`), `ZCMenu` (`ZCAction`), `ZCSwipeItem`, `ZCPullRefresh` (gesto del sistema), `ZCToastState` + `ZCToaster`; modificadores `.zcSheet(isPresented:title:subtitle:footer:content:)`, `.zcModal(...)`, `.zcAlertDialog(...)` y `.zcChoice(...)` (lo que se abre desde un campo o menú: subpantalla con Volver si ya está en una hoja), `ZCFooterButton` | `Sources/ZonacardsUI/ZCOverlays.swift`, `ZCStructure.swift` |
| Ola 3 (parte 1), contenido y dominio: `ZCAlert`, `ZCTabs` (línea y segmentado), `ZCAccordion`, `ZCDescriptionList`, `ZCTimeline`, `ZCCopyButton`, `ZCErrorPage`, `ZCBullet`, `ZCCard`, `ZCKpi` + `ZCSparkline`, `ZCMoneyText`, `ZCStateBadge` + `ZCStates`, `ZCPayBadge`, `ZCProductCard`, `ZCCtaCard` | `Sources/ZonacardsUI/ZCContent.swift`, `ZCDomainDisplay.swift` |
| Ola 3 (parte 2), compra y cuenta: `ZCCheckoutSteps`, `ZCCart` (`ZCCartLine`, `ZCCartFee`), `ZCAmountPicker`, `ZCCouponField` (`ZCCoupon`, `ZCCouponCheck`, `zcCouponsTotal`), `ZCStepper`, `ZCFormSummary`, `ZCPasswordField` + `ZCPasswordRules`, `ZCLegalConsent` y `.zcLegalSheet`, `.zcSupportSheet` (`ZCSupportInfo`, `zcPrettyPhone`), `ZCIntroSlides` + `ZCStepDots`, `.zcSessionTimeout`, `ZCCountrySwitcher` | `ZCCommerce.swift`, `ZCFormsMore.swift`, `ZCInfoSheets.swift`, `ZCAccountBasics.swift` |
| Ola 3 (parte 3), cuenta y wallet: `ZCCodeImage` (QR y Code 128 con CoreImage; Code 39 dibujado), `ZCWalletPass` y `ZCGiftcardPass` (Apple y Google, con reverso), `ZCDeleteAccount`, `ZCPermissionPrompt`, `ZCPushPreview`, `ZCNotifications`, `ZCUbigeo` + `ZCUbigeoSelect`, `ZCSlider` y `ZCRangeSlider`, `ZCTimeField`, `ZCSecretField`, `ZCTagsField`; `ZCData.json("nombre")` en tokens para leer los datos del paquete | `ZCWallet.swift`, `ZCAccountMore.swift`, `ZCNotifications.swift`, `ZCUbigeo.swift`, `ZCFieldsExtra.swift` |
| Ola 3 (parte 4), acceso y cámara: `ZCScanner` (AVFoundation: QR, Code 128, EAN-13; linterna, cambio de cámara, camino manual), `ZCBiometric` (Face ID o Touch ID con `LocalAuthentication`), `ZCPinPad` + `ZCPinPadState`, `ZCMfaSetup` (QR, verificación, códigos de recuperación con `fileExporter`), `ZCAuth` (acceso admin y tienda, OTP, recuperación, bloqueo tras 5 intentos), `ZCLogo` y `ZCSsoButton` (logos desde `logos.json` con un analizador de trazados SVG propio, `ZCSvgPath`) | `ZCScanner.swift`, `ZCMfaSetup.swift`, `ZCAuth.swift`, `ZCLogos.swift` |
| Pruebas de tema, átomos, formularios, estructura, dominio, compra, cuenta y acceso | `Tests/ZonacardsUITests` |
| App de catálogo (XcodeGen: `cd ios/Catalog && xcodegen generate`) con la secciones Fundamentos, Átomos, Formularios, Estructura, Dominio y Compra y cuenta y Cuenta y wallet y Acceso y cámara | `ios/Catalog/project.yml`, `App/` |
| Capturas (swift-snapshot-testing; `ZC_RECORD=1` graba) y auditoría de Apple (`performAccessibilityAudit`) | `Catalog/SnapshotTests`, `Catalog/UITests` |
| CI en macOS (generado al día, paquete, catálogo; artefacto con resultados y capturas) | `.github/workflows/native-ios.yml` |

Regla de overlays: nunca una hoja sobre otra. Los selects, el calendario, el prefijo del teléfono y los menús usan `.zcChoice`, que dentro de una hoja (`ZCSheetBody` provee `ZCSubscreenHost`) se abre como subpantalla con Volver. Diferencias con Android: el modal en iPhone es una hoja inferior y en iPad la hoja centrada del sistema; `ZCPullRefresh` usa `refreshable` del sistema; no hay Atrás predictivo propio (lo da el sistema). Pendiente de la ola 1: la casilla mixta no anuncia "mixto" a VoiceOver (falta una clave `ui.mixto` en i18n, que cambiaría web y Android también). Gráficos (`ZCChart`, `ZCChartOps`: Canvas, sin Swift Charts), `ZCMap` y `ZCLocationPicker` (MapKit) existen; el texto de los ejes no lo lee VoiceOver, por eso cada gráfico expone un resumen y la vista Datos; no se captura la sección de gráficos entera (hacía caer el CI). La ola 3 está completa en código, salvo importar y exportar (tampoco existe en Android: se hará en las dos juntas). Permisos que declara la app cliente: `NSCameraUsageDescription` (escáner), `NSFaceIDUsageDescription` (biometría) y la capacidad Sign in with Apple (el flujo con `ASAuthorizationController` lo hace la app; `ZCSsoButton` solo dibuja y avisa). iOS no informa si Bloq Mayús está activo, así que `ZCAuth` no avisa de mayúsculas. Los formularios no tienen aún: contraseña con medidor de seguridad (hay un hueco `below` en `ZCTextField`), correos múltiples, rango de fechas ni hora.

Una sección nueva del catálogo se suma a `CatalogSection` (App) y a `sections` de `AccessibilityAuditTests`.

## Lo que falta

Los componentes SwiftUI equivalentes a los `Zc*` de Android (botón, campos, selects, hojas, calendario, mapa con MapKit, ubigeo, cuenta, gráficos con Swift Charts o Canvas…) y la pantalla de catálogo con capturas. Cuando se escriban, deben:

- Leer `theme.shape` y `theme.colors.fieldBg/fieldBd`, no valores fijos.
- Sacar los textos de `Localizable.xcstrings` (mismas claves que Android).
- Usar el mismo dominio (`ZCMoney`, `ZCDates`…) y los mismos nombres que Android (`ZcLocationPicker` → `ZCLocationPicker`).
- Respetar Dynamic Type, "Reducir movimiento" y VoiceOver; targets de 44 pt como mínimo.
- Probarse con capturas (swift-snapshot-testing) y auditoría de accesibilidad.

Decisiones (plan en `docs/plan-ios.md`): gráficos a mano con Canvas y mapa con MapKit, salvo que se indique otra cosa.

## Cómo trabajar en iOS sin Mac

Sin Mac se compila y se prueba en el CI de macOS (`.github/workflows/native-ios.yml`): corre solo al subir a `main` y a mano con `gh workflow run native-ios.yml` (`-f record=true` graba capturas nuevas). El flujo que funcionó:

1. Antes de subir, corre los verificadores locales: `npm run native:strings` (claves de texto), `npm run native:order` (orden de argumentos de Swift) y `npm run native:docs` (regenera `swift-api.md`; si olvidas subirlo, falla la comprobación de lo generado).
2. Sube, espera la corrida y lee el resumen del paso "Errores y pruebas fallidas" (o baja el artefacto `ios-resultados` con `gh run download <id> -n ios-resultados`: logs y `.xcresult`). El compilador de Swift se detiene por capas: es normal que salgan errores nuevos al corregir los primeros.
3. Las capturas viven en `ios/Catalog/SnapshotTests/__Snapshots__`. Un cambio visual intencional se graba con `record=true`, se revisan las imágenes del artefacto y se suben.

Tipografía: los estilos de 10 y 11 pt (`xxs`, `tiny`) van atados a `relativeTo: .caption`, no a `.caption2` (la auditoría de Apple marca 11 pt sobre `caption2` como Dynamic Type no soportado). Para grabar capturas nuevas, `xcodebuild` solo pasa al proceso de pruebas las variables con prefijo `TEST_RUNNER_`.

Trampas que ya costaron una corrida: `xcodebuild | tee | tail` oculta el fallo sin `pipefail`; el esquema de pruebas del paquete es `ZonacardsUI-Package`; Node de CI debe ser el mismo que el local (25.4.0) o el ICU cambia los vectores de dominio; un `RoundedRectangle` con radio 9999 y borde dibuja tramos rectos (limitar a la mitad del alto); `\.` se pierde al escribir Swift desde un comando de shell (edita con la herramienta de archivos).

## Textos

`node scripts/check-native-strings.mjs` (`npm run native:strings`, también en CI) comprueba que cada clave usada en el Swift (`ZCString.text("espacio.clave")`) exista en `i18n/es.json` y `en.json`. Las claves anidadas se escriben con punto (`mol.clave.regla.len`, `sesionExpira.texto`, `top.pais.boton`).
