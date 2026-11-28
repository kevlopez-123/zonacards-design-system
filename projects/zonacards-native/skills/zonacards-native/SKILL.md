---
name: zonacards-native
description: Construye pantallas y componentes de Android (Jetpack Compose) con el sistema de diseño Zonacards (zonacards-tokens y zonacards-compose), y de iOS (SwiftUI, con ZonacardsUI). Úsala al crear o modificar pantallas, componentes, temas por marca, textos, pruebas o capturas de la app nativa. Para la web (Angular) usa la skill zonacards-ui.
---

# Zonacards nativo (Android Compose · iOS SwiftUI)

El sistema de diseño es **uno solo** y su fuente de verdad es la web (`@zonacards/ui`): tokens (`styles/tokens.css`), textos (`i18n/{es,en}.json`), íconos, banderas, fuentes, datos (países, ubigeo) y reglas de dominio (montos, fechas, teléfonos, estados). `npm run native` los convierte a código y recursos nativos (las reglas de dominio están en `projects/zonacards-tokens/src/domain` y sus vectores de prueba corren también en Android e iOS); **nada generado se edita a mano**. Las pantallas se arman con componentes `Zc*` de `zonacards-compose`, no con Material ni con vistas propias.

Tu trabajo con esta skill: **componer pantallas con los `Zc*` existentes, los tokens del tema y los textos generados**; si falta una pieza, créala en `zonacards-compose` (con su sección de catálogo, pruebas y captura), no dentro de una pantalla.

## Qué hay hoy

| Plataforma | Estado |
| --- | --- |
| **Android** | Tokens, tema por marca y modo, 124 componentes `Zc*` (formularios, estructura, gráficos, comercio, cuenta, mapa, hojas, importación masiva), catálogo con capturas y auditoría de accesibilidad. **Compilado y probado en CI** (más de 220 pruebas). |
| **iOS** | Tokens, tema por marca y modo (con `ZCBrandStore` para cambiarlos en vivo), 172 tipos públicos de `ZonacardsUI` en SwiftUI (los mismos grupos que Android, más `ZCAdaptiveScaffold` y `ZCListDetail` para iPad), catálogo con capturas y auditoría de accesibilidad de Apple. **Compilado y probado en CI** (macOS, simulador; 66 pruebas del paquete). Solo se probó en simulador, no en un iPhone ni un iPad reales. Lee [references/ios.md](references/ios.md) antes de tocar iOS. |

## Flujo de trabajo (Android)

1. **Mira si ya existe**: [references/compose-api.md](references/compose-api.md) lista cada `Zc*` con su descripción y sus parámetros (se genera con `node scripts/build-native-docs.mjs`). Busca por la web: casi todo componente `zc-foo` de la web es `ZcFoo` aquí.
2. **Tema**: toda pantalla va dentro de `ZonacardsTheme(brand, dark) { … }`. Colores `ZonacardsTheme.colors.*`, forma `ZonacardsTheme.shape.*`, texto con `ZcText` y `ZcType`/`ZcTextTw`.
3. **Textos**: `ctx.getString(R.string.zc_<grupo>_<clave>)` (el `R` de `com.zonacards.ui.tokens`). Para un texto nuevo agrégalo en la web (`projects/zonacards-tokens/i18n/es.json` y `en.json`, mismas claves) y corre `npm run native`. Nunca un literal en español dentro de un componente de librería (las demos del catálogo sí pueden).
4. **Estados**: cargando (`ZcSkeleton`), vacío, sin resultados y error con reintento en toda vista; acciones con `loading`.
5. **Pruebas y captura** de lo que cambies: [references/testing.md](references/testing.md). Antes de terminar corre la suite completa.
6. **Trampas conocidas**: [references/gotchas.md](references/gotchas.md). Léelo la primera vez: ahorra horas.

## Reglas que no se rompen

- **Solo tokens**: nunca `Color(0x…)`, `dp` de radio ni altura de campo sueltos. Radios y altura salen de `ZonacardsTheme.shape` (`control` campos y selects, `card` tarjetas, `sheet` hojas y modales, `button`, `fieldH` alto de campo); el relleno y borde de campo, de `colors.fieldBg` y `colors.fieldBd`. Así una marca cambia la forma sin tocar componentes (la marca `enjoy` es el ejemplo).
- **Nada de Material**: ni `OutlinedTextField`, ni `AlertDialog`, ni `Switch`, ni `ModalBottomSheet`. Usa `ZcTextField`, `ZcModal`/`ZcBottomSheet`, `ZcSwitch`…
- **Íconos** de `ZcIcons` (mismos nombres que la web: `s:phone` → `ZcIcons.sPhone`, `l:plus` → `ZcIcons.lPlus`) con `ZcIcon(icon, contentDescription)`. Nunca emojis.
- **Dominio igual que la web**: montos con `ZcMoney`, fechas con `ZcDates` (ISO `aaaa-mm-dd` como valor, formato solo al mostrar), teléfonos con `ZcPhone`, estados con las máquinas de `ZcDomainData`. Nunca formatear a mano.
- **Accesibilidad**: todo control mide al menos 44 dp (los botones 48/56), tiene nombre para TalkBack, el foco es visible, el estado nunca va solo en color y los errores se anuncian. `CatalogAccessibilityTest` lo audita sobre cada sección del catálogo.
- **Animación con respeto**: con "Quitar animaciones" del sistema (`zcReducedMotion()`) no hay movimiento. El botón se aprieta con un resorte; las listas pueden entrar con `Modifier.zcStaggeredEntry(i)`.
- **Una pieza nueva = catálogo + pruebas + README**: sección en `catalog/`, prueba de comportamiento en `zonacards-compose/src/test`, captura claro y oscuro y una línea en `projects/zonacards-native/README.md`.

## Qué componente usar (los frecuentes)

| Necesitas | Usa |
| --- | --- |
| Botón / ícono / enlace | `ZcButton` (variant `PRIMARY·SECONDARY·OUTLINE·GHOST·DANGER·DANGER_SOFT·LINK`, `loading`, `block`), `ZcIconButton` |
| Campo de texto | `ZcTextField` (etiqueta arriba, `hint`, `error`, `reserve`), `ZcPasswordField`, `ZcOtpField`, `ZcNumberField`, `ZcTagsField`, `ZcSecretField` |
| Elegir | `ZcSelect` (con búsqueda desde 9 opciones), `ZcAutocomplete` (búsqueda en el servidor, con "Buscando…", mínimo de letras y "Crear"), `ZcMultiSelect`, `ZcRadioGroup`, `ZcCheckbox`, `ZcCheckboxGroup` (una etiqueta y "Seleccionar todo"), `ZcSwitch`, `ZcSegmented`, `ZcSlider`. En iOS: `ZCSelect`, `ZCAutocomplete`, `ZCMultiSelect`, `ZCCheckboxGroup`… |
| Errores del servidor | `rememberZcServerErrors("email", …)` → `ZcServerErrors` (`apply`, `error`, `clear`, `requester`, `focusFirst`) con `ZcTextField(focusRequester = …)`; en iOS `ZCServerErrors` con `ZCTextField(focusRequest:)` y `server.binding(…)`. En web, `applyServerErrors` y `focusFirstInvalid` |
| Agrupar campos | `ZcFieldset` (leyenda que TalkBack anuncia, descripción, borde opcional); en iOS `ZCFieldset` |
| Fechas | `ZcDateField` (selector del sistema), `ZcDateWheelField` (día/mes/año para fechas lejanas), `ZcDateRange` + `ZcCalendar`, `ZcTimeField` |
| Perú | `ZcUbigeoSelect` (departamento › provincia › distrito), `ZcLocationPicker` (punto en el mapa) |
| Separación entre campos, bloques, secciones o dentro de una tarjeta; margen de página | `ZcSpacing.field` (16), `fieldX` (20), `block` (16), `pageBlock`, `card`, `cardInset`, `section` (40), `group` (12), `inline` (8), `marginPage` (16), `marginPageY` (24), `contentMax`; en iOS `ZCSpacing`. No `ZcSpace.v4` suelto para estas relaciones |
| Tamaño y peso del texto | `ZcType.body`, `caption`, `title`… (escala del sistema, con `sp`) y `ZcWeight.medium`/`semibold`/`bold`; en iOS `ZCType.*` y `ZCWeight.*` | `FontWeight.SemiBold`, `.weight(.semibold)` ni tamaños en `sp` sueltos |
| Control pulsado | `ZcScale.pressed` (0,97) con la animación de resorte del botón; en iOS `ZCScale.pressed`. Colores de estado del tema: `stateHoverBg`, `stateActiveBg`, `stateSelectedBg` (el hover es del mouse: en el teléfono no aplica) |
| Control deshabilitado | `.alpha(if (enabled) 1f else ZcOpacity.disabled)`; en iOS `.opacity(isEnabled ? 1 : ZCOpacity.disabled)` (0,45 en todo el sistema, no 0,4 ni 0,5) |
| Calificación con estrellas | `ZcRating(value, label, onValueChange = …)` (solo lectura si no pasas `onValueChange`; `allowHalf`, `size`, `count`, `showValue`); en iOS `ZCRating(label, value: $v)` o `ZCRating(label, readOnly: 4.3)`. Interactiva se ajusta con TalkBack/VoiceOver como deslizador |
| Acciones sobre una selección múltiple | `ZcActionBar(count, actions: List<ZcAction>, onAction, onClear)` abajo y al centro; solo íconos en teléfono, `disabledReason` como estado; en iOS `ZCActionBar(count:actions:onAction:onClear:)` con `ZCAction` |
| Overlays | `ZcBottomSheet`, `ZcModal`, `ZcAlertDialog`, `ZcToaster` + `rememberZcToastState()` |
| Cuenta | `ZcAuth`, `ZcMfaSetup`, `ZcSessionTimeout`, `ZcNotifications`, `ZcCountrySwitcher`, `ZcSsoButton`, `ZcDeleteAccount`, `ZcLegalSheet` + `ZcLegalConsent`, `ZcSupportSheet`, `ZcIntroSlides` |
| Contenido | `ZcTabs`, `ZcAlert`, `ZcAccordion`, `ZcDescriptionList`, `ZcTimeline`, `ZcCard`, `ZcKpi`, `ZcBadge`, `ZcChip`, `ZcSkeleton` |
| Gráficos | `ZcChart(data, kind)` con `ZcChartKind` (línea, barras, apiladas, dona y los de operación: embudo, cascada, mapa de calor, treemap, calendario, sankey, medidor), `ZcChartPanel` (con filtros), `ZcChartTable` (vista de datos), `ZcMap` |
| Importar y exportar | `ZcBulkImport` (plantilla, archivo del selector del sistema, errores por fila, entrega de las filas válidas); núcleo `ZcBulk` (`processFile`, `processMatrix`), `ZcExport` (`toCsv`, `toXlsx`, `fileName`), `ZcXlsx.read`. En iOS: `ZCBulkImport`, `ZCBulk`, `ZCExport`, `ZCXlsx`. Sin PDF: cada plataforma trae el suyo |
| App adaptable | `ZcAppScaffold` (barra inferior, riel o menú lateral según el ancho), `ZcBottomNav`, `ZcNavRail`, `ZcListPage`, `ZcListDetail`, `ZcAdaptiveGrid`. En iOS: `ZCAdaptiveScaffold` (barra inferior o `NavigationSplitView`) y `ZCListDetail` |

La lista completa y los parámetros exactos están en [references/compose-api.md](references/compose-api.md).

## Marcas y temas

`ZcBrand` = `ZONACARDS`, `GIFTEALO`, `ENJOY`, `MOTIVA`; modo claro u oscuro. `ZonacardsTheme(brand, dark)` provee colores, fuente de la marca y forma. Un tema nuevo se define en la web (`tokens.css`, bloque `:root[data-brand="…"]` con `--shape-*`, `--field-*` y colores), y `npm run native` lo trae a Android e iOS. Las pantallas no preguntan "qué marca es": usan los tokens.

## Compartido con la web

Principios, estados obligatorios, formato y accesibilidad son los mismos que en la web: ver la skill `zonacards-principles` (`projects/zonacards-tokens/skills/zonacards-principles`).
