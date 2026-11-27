# Zonacards nativo

Tokens, íconos, textos e íconos de app de `@zonacards/ui` para **SwiftUI** (iOS 17+) y **Jetpack Compose** (Android minSdk 26).
Todo lo que está en `Generated/`, `Resources/`, `res/`, `kotlin/` y `BrandAssets/` sale de `npm run native` (script `scripts/build-native.mjs`): no se edita a mano.
Plan completo: https://claude.ai/artifact/KHWtAf5jwYZCHzrLEY9cU3

| Fuente (`projects/zonacards-tokens`, y `projects/zonacards-ui` para íconos, logos y dominio) | iOS (`ios/`) | Android (`android/zonacards-tokens/`) |
| --- | --- | --- |
| `tokens/*.json` (DTCG) | `ZCTokens.swift`: `ZCTheme` (4 marcas × claro/oscuro), `ZCSpace`, `ZCRadius`, `ZCSize`, `ZCType` (Dynamic Type), `ZCMotion` | `ZcTokens.kt`: `ZcTheme`, `LocalZcTheme`, `ZcSpace`, `ZcRadius`, `ZcSize`, `ZcType` (sp), `ZcMotion`; `zc_colors.xml` claro y `values-night` |
| `icon/icons.json` (Solar/Lucide) | `Icons.xcassets` (SVG vectorial, plantilla) + `ZCIconName` + `ZCIcon` | `drawable/zc_ic_*.xml` (VectorDrawable) + `ZcIcons` |
| `i18n/es.json`, `en.json` | `Localizable.xcstrings` (`{{x}}` → `%1$@`) | `values/zc_strings.xml` y `values-en` (`{{x}}` → `%1$s`, clave `zc_<grupo>_<clave>`) |
| `shared/fonts` (Google Fonts, OFL) | `Resources/Fonts` + `ZCFonts.register()` | `res/font` + `ZcFonts.forBrand()` |
| banderas (`flag-icons`, 10 países) | `Flags.xcassets` + `ZCFlag("pe")` | `drawable-xxxhdpi/zc_flag_*.png` + `ZcFlags.of("pe")` |
| `core/domain` (dominio) | `ZCMoney`, `ZCDates`, `ZCPhone`, `ZCPassword`, `ZCTaxId`, `ZCRecurrence`, `ZCDomainData` (países, máquinas de estado) | `ZcMoney`, `ZcDates`, `ZcPhone`, `ZcPassword`, `ZcTaxId`, `ZcRecurrence`, `ZcDomainData` |
| `assets/brand/<marca>` | `BrandAssets/<marca>/AppIcon.appiconset` (claro, oscuro, tintado) | `BrandAssets/<marca>/res` (adaptativo: fondo, primer plano, monocromo) |

## Guías para agentes

La skill `zonacards-native` (`skills/zonacards-native`) explica cómo armar pantallas con los `Zc*` de Android, las trampas conocidas, las pruebas y qué hay en iOS; su `references/compose-api.md` se genera con `node scripts/build-native-docs.mjs` (corre también en `npm run native`). Los principios comunes a web, Android e iOS están en `zonacards-principles` (`projects/zonacards-tokens/skills`). Para usarlas en un proyecto: `cp -r <ruta>/skills/zonacards-native .claude/skills/`.

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

## iOS (compilado y probado en CI)

`ios/Sources/ZonacardsUI` (163 tipos públicos de SwiftUI: tema por marca y modo, átomos, formularios, estructura, dominio, compra, cuenta, acceso, gráficos con Canvas, mapa con MapKit, importación masiva, `ZCBrandStore` y plantillas adaptables a iPad), `ios/Catalog` (app de catálogo con XcodeGen, capturas y auditoría de accesibilidad de Apple) y `.github/workflows/native-ios.yml` (macOS, simulador). Solo se ha probado en simulador, no en un iPhone ni un iPad reales: ver `docs/plan-ios.md`.

## Teléfono y tablet

- `ZcAppScaffold`: barra inferior (< 600 dp), riel de 76 (600–1279) y menú lateral de 264 contraíble (≥ 1280).
- Plantillas `ZcListPage`, `ZcDetailPage` (columna lateral desde 1024), `ZcFormPage` (máx. 880, acciones fijas), `ZcDashboardPage` y `ZcDashboardGrid` (1/2/4 columnas), `ZcPageHeader`, `ZcSubnav`.
- Estas deciden por el ancho de la ventana (como los breakpoints de la web). `ZcAdaptiveGrid` (auto-fit, 128 dp) y `ZcListDetail` (lado a lado desde 768) deciden por su contenedor.
- `TabletSnapshotTest`: capturas a 600, 840 y 1280 horizontal, y auditoría de accesibilidad a 600 y en horizontal.

## Gráficos (hechos a mano)

- `ZcChart` dibuja línea, barras horizontales, apiladas y dona con Canvas y los tokens `chart-1…6`, sin librerías de terceros. Mismos datos que `ChartData` de la web (`ZcChartData`, `ZcChartSeries`) y mismas reglas: periodo anterior punteado, mayor destacado en barras, total al centro de la dona, ejes abreviados (`1.2K`).
- Al tocar o deslizar aparece el globo con los valores. Para TalkBack, cada gráfico expone un resumen con todos sus valores.
- `ZcChartPanel` agrega la barra con "Vista" (Gráfico | Datos), la vista de datos como alternativa accesible, el estado vacío y un espacio para los filtros del llamador (`ZcSegmented`, `ZcSwitch`…).
- Para iOS los datos, los colores (tokens) y el formato son los mismos; el dibujo es con el Canvas de SwiftUI (sin Swift Charts).
- Tipos de operación, con los mismos datos que la web: `FUNNEL`, `WATERFALL` (primera y última categoría son totales), `HEATMAP` (una serie por fila), `TREEMAP`, `CALENDAR` (categorías ISO `aaaa-mm-dd`, lunes primero), `SANKEY` (categorías "Origen → Destino") y `GAUGE` (`[logrado, meta]`). Todos admiten toque con globo, resumen para TalkBack y vista Datos. Los rellenos eligen texto claro u oscuro según el contraste (el ámbar no admite texto blanco).
- Diferencias con la web, a propósito: en la cascada un ajuste positivo va en verde (la web lo pinta rojo), y en apiladas la esquina redondeada va en el segmento más alto con valor.
- `ZcMap` (zc-map): los países de la web (`latam.json`, que el generador copia a `res/raw/zc_latam.json` y a iOS), los del `scope` en `map-scope` y un punto por ciudad con tamaño según la cantidad. Pellizco para acercar, un dedo para mover (solo con zoom: sin zoom el dedo desplaza la página) y botones + y − como alternativa al pellizco. Tocar un punto abre el globo; el resumen para TalkBack lista cada ciudad con su cantidad.

## Contenido base (ola 5)

`ZcTabs` (línea y segmentadas, con ícono y contador, se desplazan y traen la elegida a la vista), `ZcAlert` (cuatro tonos; el de peligro se anuncia de inmediato), `ZcAccordion` (uno a la vez o varios, con "Expandir todo"), `ZcDescriptionList` (dos columnas desde 448 dp o en filas), `ZcTimeline`, `ZcCopyButton` (portapapeles del sistema, anuncia "Copiado"), `ZcErrorPage` y `ZcBullet` (medidor de stock). Cada uno se construyó leyendo su componente web. `zc-logo` se hizo después (ver Cuenta y sesión).

La auditoría de accesibilidad mide el tamaño real de cada control (`size`), no `boundsInRoot`, que Compose recorta a lo visible: una pestaña fuera de pantalla medía 0×0.

## Campos avanzados (ola 5)

`ZcStepper` (horizontal desde 768 dp; compacto con barra en teléfono) y `ZcFormSummary` (errores que llevan al campo), `ZcSlider` y `ZcRangeSlider` (ajustables con TalkBack, con paso, háptica y separación mínima), `ZcTimeField` (máscara hh:mm y selector de hora del sistema), `ZcPasswordField` con `ZcPasswordRules`, `ZcSecretField` (credencial enmascarada: el prefijo y los últimos 4 siempre se ven; copia marcada como sensible) y `ZcTagsField` (varios correos; coma, espacio o "Listo" agregan, pegar una lista la separa). `ZcTextField` ganó la ranura `below` para el medidor de la contraseña.

`ZcDateRange` y `ZcCalendar` (calendario propio con rango, porque el selector del sistema no admite rangos) se hicieron después: periodos predefinidos como chips, Desde y Hasta escribibles con máscara, un mes con el rango resaltado, comparar con el periodo anterior y Aplicar/Cancelar; los días miden 44 dp y no deja elegir fechas futuras salvo `allowFuture`.

## Comercio (ola 5)

`ZcAmountPicker` (montos como grupo de opciones, "Otro" con monto libre entre mínimo y máximo, agotados tachados, "Total: S/ 50.00"), `ZcCouponField` (hasta N códigos con `validate` asíncrono, repetidos, "no combinable" y máximo; `ZcCoupon.discountOf` y `zcCouponsTotal` calculan el descuento sin pasar del subtotal), `ZcAnnouncement` y `ZcOnboarding` (el cierre lo guarda la app), `ZcHelpCard` y `ZcCarousel` (desliza y encaja en cada diapositiva; 1,2, 2 o 3 a la vista según el ancho; puntos con área de toque de 44 dp).

## Cuenta y sesión (ola 5)

`ZcAuth` (acceso de administrador con Microsoft o del portal con Google y Apple, más registro; correo y contraseña, segundo factor, código de recuperación, olvidé mi contraseña y vista para configurar el segundo factor; bloqueo de 15 minutos tras 5 fallos, aviso de Bloq Mayús, reenvío del código cada 30 s, un fallo de red no cuenta como intento; panel de marca desde 900 dp), `ZcMfaSetup` (QR sobre fondo claro, clave manual, código de 6 dígitos que valida el servidor, códigos de recuperación que se copian o se guardan con el selector de archivos del sistema), `ZcSessionTimeout` (cuenta regresiva que se anuncia cada 15 s; Atrás equivale a seguir conectado), `ZcCountrySwitcher` (con un solo país queda fijo y un valor fuera de alcance se corrige), `ZcNotifications` (campana con contador, filtro, grupos, marcar todo) y `ZcSsoButton` con los logos de `ZcLogo`.

Los logos viajan como datos (`zc_logos.json`, generado desde el registro de la web: 32 logos y 3 de acceso) y se dibujan con `PathParser`: no son VectorDrawable porque Android no lee las banderas de arco comprimidas. `ZcBrandLogo` (círculo de 64 dp centrado sobre la imagen del producto; sin imagen muestra el nombre corto) completa el grupo.

## Marcas: forma y estilo

Cada tema trae `shape` (`ZcShape` en Kotlin, `ZCShape` en Swift): radio de control, de tarjeta, de hoja y de botón, y alto de los campos; los colores de campo salen como `fieldBg` y `fieldBd`. Botón, campo (`zcControl`), tarjeta, modal y hoja ya los leen, así que una marca cambia su aspecto sin tocar componentes. La pantalla "Marcas y forma" del catálogo muestra la misma pantalla con tres marcas. Los valores por defecto no cambian: las capturas anteriores siguen iguales.

## Ubigeo del Perú

`ZcUbigeoSelect` (departamento › provincia › distrito) y `ZcUbigeo` (consulta por código: provincias de un departamento, distritos de una provincia, etiqueta "Miraflores, Lima, Lima" y coordenadas del distrito) leen el mismo archivo que la web (`zc_ubigeo_pe.json` en Android, `ubigeo-pe.json` en iOS, con su licencia MIT). El valor es el código del distrito (6 dígitos, notación INEI: Callao es `07`). En iOS el archivo ya viaja en el paquete; falta el selector SwiftUI.

## Punto en el mapa

`ZcLocationPicker` (pin que se arrastra o se coloca con un toque, latitud y longitud escritas con validación, y "Usar mi ubicación" si la app pasa `onUseMyLocation`: el permiso y la lectura los hace la app) sobre `ZcTileMap`, un mapa de teselas dibujado a mano sin SDK de mapas (OpenStreetMap por defecto, con su atribución; arrastrar mueve el mapa, +/− acercan; TalkBack ve un grupo con acciones para mover el punto al norte, sur, este u oeste). `ZcGeo` trae la proyección Web Mercator. Para tráfico alto cambia la plantilla de URL por un proveedor propio o de pago; la política de OpenStreetMap no admite descargas masivas. En iOS falta el equivalente (MapKit).

## Legal, soporte e introducción

`ZcLegalSheet` (términos o privacidad: versión, esqueleto al cargar, error con Reintentar, botón "Entendido" o "Aceptar") y `ZcLegalConsent` (casilla, enlaces para leer y chip "Términos aceptados"); `ZcSupportSheet` (horario y una fila por canal; por defecto abre el marcador, WhatsApp, el correo o el navegador, y `ZcSupportActions` permite reemplazarlo) con `zcPrettyPhone`; `ZcIntroSlides` y `ZcStepDots` (introducción de la primera vez: Saltar, Continuar y Empezar). Se ven en la pantalla "Cuenta y sesión" del catálogo.

`ZcDeleteAccount` es la pantalla de eliminar cuenta que exigen las tiendas (consecuencias, código al correo, motivo opcional, solicitud abierta o rechazada); la app envía el código y registra la solicitud.

## Ideas tomadas de Enjoy Beneficios

Revisado el kit de la app Enjoy Beneficios (mismo enfoque: Compose sin Material). Incorporado aquí: el botón se aprieta y rebota al soltar (resorte; con las animaciones del sistema apagadas, un fundido corto), `Modifier.zcStaggeredEntry(índice)` (los elementos de una lista entran con fundido y suben 12 dp, 60 ms entre uno y otro, hasta 6 escalones; `zcReducedMotion()` lo apaga) y `ZcDateWheelField` (día, mes y año en tres columnas para fechas lejanas como el cumpleaños). En la web se agregó `@zonacards/ui/unsaved` (aviso de cambios sin guardar). Pendiente de evaluar: selector de ubigeo en cascada (solo si hace falta una dirección peruana).

## Dominio idéntico a la web

`scripts/build-native-domain.mjs` ejecuta el dominio real de `@zonacards/ui` y guarda:

- `shared/domain-spec.json`: separadores, patrones de moneda, meses, patrones de fecha, rangos y tiempo relativo sacados de Intl. Swift y Kotlin formatean con esto, no con el ICU del teléfono, así un monto o una fecha sale igual en web, iOS y Android.
- `shared/domain-vectors.json`: 2043 casos (entrada → salida de la web; incluyen importar y exportar) que corren las pruebas de iOS (`swift test`) y Android (`testDebugUnitTest`).

Compilar y probar Android en Windows: `android\build-local.ps1` (usa el JDK de Android Studio y el nombre corto del SDK, porque la ruta tiene tilde).

## Notas

- 1 px CSS = 1 pt (iOS) = 1 dp (Android).
- `s:pallete-2` usa una máscara en Solar; en Android se aproxima con la mitad del grosor (diferencia mínima).
- Android: compila y pasa las pruebas (AGP 9.5, Kotlin 2.4, compileSdk 37, minSdk 26).
- iOS: compila y pasa las pruebas en CI (macOS 15, Xcode 16.4, simulador iPhone 16); en una Mac, `swift test` en `ios/` (o `xcodebuild test -scheme ZonacardsUI-Package`).
