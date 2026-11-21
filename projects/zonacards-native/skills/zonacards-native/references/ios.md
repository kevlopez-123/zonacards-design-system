# iOS (SwiftUI): lo que hay y lo que no

**Estado honesto: iOS tiene la capa generada y de dominio, y la infraestructura de la ola 0 (`ZCThemeProvider`, `ZCText`, catálogo, capturas, auditoría, CI). Faltan casi todos los componentes SwiftUI.** Y el Swift que existe (generado y escrito a mano) nunca se compiló ni se probó en un Mac: la primera corrida de `.github/workflows/native-ios.yml` dirá qué hay que corregir. No presentes nada de iOS como "hecho" o "probado" sin haberlo compilado. Referencia de la API: `references/swift-api.md` (generada).

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
| Pruebas de tema, átomos y formularios | `Tests/ZonacardsUITests` |
| App de catálogo (XcodeGen: `cd ios/Catalog && xcodegen generate`) con la secciones Fundamentos, Átomos y Formularios | `ios/Catalog/project.yml`, `App/` |
| Capturas (swift-snapshot-testing; `ZC_RECORD=1` graba) y auditoría de Apple (`performAccessibilityAudit`) | `Catalog/SnapshotTests`, `Catalog/UITests` |
| CI en macOS (generado al día, paquete, catálogo; artefacto con resultados y capturas) | `.github/workflows/native-ios.yml` |

Pendiente de la ola 1: la casilla mixta no anuncia "mixto" a VoiceOver (falta una clave `ui.mixto` en i18n, que cambiaría web y Android también). Los formularios no tienen aún: contraseña con medidor de seguridad (hay un hueco `below` en `ZCTextField`), correos múltiples, rango de fechas ni hora.

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

Puedes escribir Swift y regenerar recursos, pero **no puedes compilar**: di siempre que está "escrito, sin compilar". Pide compilar y probar en un Mac antes de dar algo por terminado.
