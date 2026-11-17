# Zonacards nativo (Fase 1: base compartida)

Tokens, íconos, textos e íconos de app de `@zonacards/ui` para **SwiftUI** (iOS 16+) y **Jetpack Compose** (Android minSdk 26).
Todo lo que está en `Generated/`, `Resources/`, `res/`, `kotlin/` y `BrandAssets/` sale de `npm run native` (script `scripts/build-native.mjs`): no se edita a mano.
Plan completo: https://claude.ai/artifact/KHWtAf5jwYZCHzrLEY9cU3

| Fuente (`projects/zonacards-ui`) | iOS (`ios/`) | Android (`android/zonacards-tokens/`) |
| --- | --- | --- |
| `tokens/*.json` (DTCG) | `ZCTokens.swift`: `ZCTheme` (4 marcas × claro/oscuro), `ZCSpace`, `ZCRadius`, `ZCSize`, `ZCType` (Dynamic Type), `ZCMotion` | `ZcTokens.kt`: `ZcTheme`, `LocalZcTheme`, `ZcSpace`, `ZcRadius`, `ZcSize`, `ZcType` (sp), `ZcMotion`; `zc_colors.xml` claro y `values-night` |
| `icon/icons.json` (Solar/Lucide) | `Icons.xcassets` (SVG vectorial, plantilla) + `ZCIconName` + `ZCIcon` | `drawable/zc_ic_*.xml` (VectorDrawable) + `ZcIcons` |
| `i18n/es.json`, `en.json` | `Localizable.xcstrings` (`{{x}}` → `%1$@`) | `values/zc_strings.xml` y `values-en` (`{{x}}` → `%1$s`, clave `zc_<grupo>_<clave>`) |
| `assets/brand/<marca>` | `BrandAssets/<marca>/AppIcon.appiconset` (claro, oscuro, tintado) | `BrandAssets/<marca>/res` (adaptativo: fondo, primer plano, monocromo) |

## Uso

```swift
// Package.swift de la app: .package(path: "…/zonacards-native/ios")
@Environment(\.zcTheme) var theme
Text("Lotes").font(.zc(ZCType.title, theme: theme)).foregroundStyle(theme.colors.text)
ZCIcon(.sBox).foregroundStyle(theme.colors.primary)
```

```kotlin
CompositionLocalProvider(LocalZcTheme provides ZcTheme.resolve(ZcBrand.ZONACARDS, isSystemInDarkTheme())) {
    val t = LocalZcTheme.current
    Text(stringResource(R.string.zc_ui_copiar), style = ZcType.body, color = t.colors.text)
    Icon(painterResource(ZcIcons.sBox), contentDescription = null, tint = t.colors.primary)
}
```

## Notas

- 1 px CSS = 1 pt (iOS) = 1 dp (Android). Las fuentes de letra (Figtree, Lato, Outfit, Geist) no se incluyen todavía: falta revisar sus licencias para apps.
- `s:pallete-2` usa una máscara en Solar; en Android se aproxima con la mitad del grosor (diferencia mínima).
- Banderas: pendiente (siguen en `flag-icons` para la web).
- Sin compilar todavía en Xcode ni Android Studio (este equipo es Windows): es el primer paso del equipo nativo.
