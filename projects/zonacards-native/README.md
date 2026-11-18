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

Ola 2 (formularios): `ZcField` (etiqueta, obligatorio/opcional, ayuda, error con ícono, contador), `ZcTextField` (contraseña con mostrar/ocultar, filtro `allowed`, `maxLength`, `onBlur`), `ZcSearchField`, `ZcMoneyField` (moneda y decimales del país), `ZcPhoneField` (prefijo en sheet, grupos de 3), `ZcTaxIdField` (RUC/NIT/RUT/RFC, normaliza al salir), `ZcOtpField`, `ZcPinPad`, `ZcSelect` y `ZcMultiSelect` (en `ZcBottomSheet`, búsqueda desde 9 opciones, pie Limpiar/Listo), `ZcDateField` (selector nativo de Android).

Ola 3 (estructura): `ZcTopBar`, `ZcBottomNav` (3 a 5 destinos, badge), `ZcSystemBanner` / `ZcOfflineBanner`, `ZcState` (vacío o error con referencia y acción), `ZcBottomSheet` completo (arrastre para cerrar, salida animada, Atrás, subpantallas con Volver vía `LocalZcSubscreenHost`), `ZcModal` (sheet en teléfono, diálogo desde 600 dp), `ZcAlertDialog`, `ZcToastState` + `ZcToaster` (arriba en móvil, errores con acción no se cierran solos), `ZcPullRefresh`, `ZcSwipeItem` y `ZcMenu` (las acciones del gesto también en el menú ⋮ y en TalkBack). Selects, prefijos y menús dentro de un sheet se abren como subpantalla, nunca otro sheet.

Ola 4 (dominio), construida desde cada componente web: `ZcCard`, `ZcKpi` (variación, sparkline, filtro), `ZcMoneyText` (abrevia si no cabe; TalkBack lee la cifra completa), `ZcStateBadge` (tono, ícono y texto desde las máquinas de estado), `ZcProductCard`, `ZcPayBadge`, `ZcNumberField`, `ZcCtaCard`, `ZcWalletPass` y `ZcGiftcardPass` (Apple/Google, QR y códigos de barras reales con ZXing), `ZcScanner` (CameraX + ML Kit, linterna, cambio de cámara, ingreso manual, permiso), `ZcPermissionPrompt`, `ZcPushPreview`, `ZcCheckoutSteps` y `ZcCart`.

- Toque mínimo de 48 dp en todos (aunque el tamaño visual sea menor), rol y estado para TalkBack, textos de `zc_strings` (es/en).
- Pruebas con Robolectric en modo gráfico nativo (`AtomsTest`, `FormsTest`) y galería en claro y oscuro (`GalleryCapture` deja PNG en `zonacards-compose/build/gallery`).

## Catálogo, capturas de referencia y accesibilidad (fase 4)

- **App de catálogo** (`android/catalog`, APK en `catalog/build/outputs/apk/debug`): inicio, fundamentos, átomos, formularios, estructura y dominio; marca y tema desde ⋮.
- **Capturas de referencia** (`catalog/src/test/snapshots`, 12): cada sección en claro y oscuro (y Giftealo); fallan si cambia más del 1 % de los píxeles. Cambio intencional: `./gradlew :catalog:testDebugUnitTest -Psnapshots=record`. Las que fallan quedan en `catalog/build/snapshots-failed`.
- **Auditoría de accesibilidad** (`ZcA11yAudit`): todo lo tocable tiene nombre y toque de 44 dp o más; `AccessibilityCheckerSelfTest` comprueba que la auditoría detecta errores (el verificador ATF de Google no corre bajo Robolectric).
- **Contraste** (`ContrastTest`): pares de color de las 8 combinaciones marca/modo contra WCAG AA, con la lista de pendientes de diseño.
- **CI**: `.github/workflows/native-android.yml` (regenera y compara, compila, prueba, publica el APK y, con los secretos, lo distribuye por Firebase App Distribution).

## Teléfono y tablet

- `ZcAppScaffold`: barra inferior (< 600 dp), riel de 76 (600–1279) y menú lateral de 264 contraíble (≥ 1280).
- Plantillas `ZcListPage`, `ZcDetailPage` (columna lateral desde 1024), `ZcFormPage` (máx. 880, acciones fijas), `ZcDashboardPage` y `ZcDashboardGrid` (1/2/4 columnas), `ZcPageHeader`, `ZcSubnav`.
- Estas deciden por el ancho de la ventana (como los breakpoints de la web). `ZcAdaptiveGrid` (auto-fit, 128 dp) y `ZcListDetail` (lado a lado desde 768) deciden por su contenedor.
- `TabletSnapshotTest`: capturas a 600, 840 y 1280 horizontal, y auditoría de accesibilidad a 600 y en horizontal.

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
