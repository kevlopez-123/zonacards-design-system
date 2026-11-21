# iOS (SwiftUI): lo que hay y lo que no

**Estado honesto: iOS solo tiene la capa generada y de dominio. No hay componentes SwiftUI.** Y el Swift que existe nunca se compiló ni se probó en un Mac. No presentes nada de iOS como "hecho" o "probado" sin haberlo compilado.

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

## Lo que falta

Los componentes SwiftUI equivalentes a los `Zc*` de Android (botón, campos, selects, hojas, calendario, mapa con MapKit, ubigeo, cuenta, gráficos con Swift Charts o Canvas…) y la pantalla de catálogo con capturas. Cuando se escriban, deben:

- Leer `theme.shape` y `theme.colors.fieldBg/fieldBd`, no valores fijos.
- Sacar los textos de `Localizable.xcstrings` (mismas claves que Android).
- Usar el mismo dominio (`ZCMoney`, `ZCDates`…) y los mismos nombres que Android (`ZcLocationPicker` → `ZCLocationPicker`).
- Respetar Dynamic Type, "Reducir movimiento" y VoiceOver; targets de 44 pt como mínimo.
- Probarse con capturas (swift-snapshot-testing) y auditoría de accesibilidad.

Decisión pendiente: gráficos con Swift Charts o dibujados a mano (Canvas), como en Android.

## Cómo trabajar en iOS sin Mac

Puedes escribir Swift y regenerar recursos, pero **no puedes compilar**: di siempre que está "escrito, sin compilar". Pide compilar y probar en un Mac antes de dar algo por terminado.
