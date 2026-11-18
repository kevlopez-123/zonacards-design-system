# Zonacards nativo

Tokens, íconos, textos e íconos de app de `@zonacards/ui` para **SwiftUI** (iOS 17+) y **Jetpack Compose** (Android minSdk 26).
Todo lo que está en `Generated/`, `Resources/`, `res/`, `kotlin/` y `BrandAssets/` sale de `npm run native` (script `scripts/build-native.mjs`): no se edita a mano.
Plan completo: https://claude.ai/artifact/KHWtAf5jwYZCHzrLEY9cU3

| Fuente (`projects/zonacards-ui`) | iOS (`ios/`) | Android (`android/zonacards-tokens/`) |
| --- | --- | --- |
| `tokens/*.json` (DTCG) | `ZCTokens.swift`: `ZCTheme` (4 marcas × claro/oscuro), `ZCSpace`, `ZCRadius`, `ZCSize`, `ZCType` (Dynamic Type), `ZCMotion` | `ZcTokens.kt`: `ZcTheme`, `LocalZcTheme`, `ZcSpace`, `ZcRadius`, `ZcSize`, `ZcType` (sp), `ZcMotion`; `zc_colors.xml` claro y `values-night` |
| `icon/icons.json` (Solar/Lucide) | `Icons.xcassets` (SVG vectorial, plantilla) + `ZCIconName` + `ZCIcon` | `drawable/zc_ic_*.xml` (VectorDrawable) + `ZcIcons` |
| `i18n/es.json`, `en.json` | `Localizable.xcstrings` (`{{x}}` → `%1$@`) | `values/zc_strings.xml` y `values-en` (`{{x}}` → `%1$s`, clave `zc_<grupo>_<clave>`) |
| `shared/fonts` (Google Fonts, OFL) | `Resources/Fonts` + `ZCFonts.register()` | `res/font` + `ZcFonts.forBrand()` |
| banderas (`flag-icons`, 10 países) | `Flags.xcassets` + `ZCFlag("pe")` | `drawable-xxxhdpi/zc_flag_*.png` + `ZcFlags.of("pe")` |
| `core/domain` (dominio) | `ZCMoney`, `ZCDates`, `ZCPhone`, `ZCPassword`, `ZCTaxId`, `ZCRecurrence`, `ZCDomainData` (países, máquinas de estado) | `ZcMoney`, `ZcDates`, `ZcPhone`, `ZcPassword`, `ZcTaxId`, `ZcRecurrence`, `ZcDomainData` |
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

## Componentes Compose (fase 3)

Módulo `android/zonacards-compose` (depende de `zonacards-tokens`). Ola 1 (átomos): `ZonacardsTheme`, `ZcText`, `ZcIcon`, `ZcButton` (7 variantes, MD/SM, cargando, sobre primario con `LocalZcOnPrimary`), `ZcIconButton`, `ZcSpinner`, `ZcBadge` (tonos), `ZcAvatar`, `ZcChip` (seleccionable, quitar, no válido), `ZcSwitch`, `ZcCheckbox` (con estado mixto), `ZcRadioGroup`, `ZcProgress` (indeterminado sin parpadeo), `ZcSkeleton`, `ZcDivider`.

- Toque mínimo de 48 dp en todos (aunque el tamaño visual sea menor), rol y estado para TalkBack, textos de `zc_strings` (es/en).
- Pruebas con Robolectric (`AtomsTest`) y galería en claro y oscuro (`GalleryCapture` deja PNG en `zonacards-compose/build/gallery`).

## Dominio idéntico a la web

`scripts/build-native-domain.mjs` ejecuta el dominio real de `@zonacards/ui` y guarda:

- `shared/domain-spec.json`: separadores, patrones de moneda, meses, patrones de fecha, rangos y tiempo relativo sacados de Intl. Swift y Kotlin formatean con esto, no con el ICU del teléfono, así un monto o una fecha sale igual en web, iOS y Android.
- `shared/domain-vectors.json`: 1970 casos (entrada → salida de la web) que corren las pruebas de iOS (`swift test`) y Android (`testDebugUnitTest`).

Compilar y probar Android en Windows: `androiduild-local.ps1` (usa el JDK de Android Studio y el nombre corto del SDK, porque la ruta tiene tilde).

## Notas

- 1 px CSS = 1 pt (iOS) = 1 dp (Android).
- `s:pallete-2` usa una máscara en Solar; en Android se aproxima con la mitad del grosor (diferencia mínima).
- Android: compila y pasa las pruebas (AGP 9.5, Kotlin 2.4, compileSdk 37, minSdk 26).
- iOS: escrito pero sin compilar (se necesita una Mac con Xcode 16+): `swift test` en `ios/` es el primer paso del equipo iOS.
