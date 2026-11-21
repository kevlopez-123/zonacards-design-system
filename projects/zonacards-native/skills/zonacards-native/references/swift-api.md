# Referencia de la API de SwiftUI (ZonacardsUI)

Generada desde el código (`node scripts/build-native-docs.mjs`). Cada tipo público con su descripción, su inicializador y, en los enums, sus casos.
Se importan con `import ZonacardsUI`; los tokens (`ZCTheme`, `ZCType`, `ZCSpace`, `ZCIcon`…) están en `import ZonacardsTokens`.
Estado: ver `references/ios.md` (qué está compilado y probado y qué no).

## ZCText.swift

### ZCText

Texto con la escala tipográfica del sistema (escala con Dynamic Type) y un tono semántico. No uses `Text` con colores ni fuentes fijas.

`ZCText(_ text: String, style: ZCTypeStyle = …, tone: Tone = …)`

### Tone

Color semántico del texto.

Casos: `normal`, `muted`, `danger`, `onPrimary`

## ZCThemeProvider.swift

### ZCThemeProvider

Resuelve el tema (marca × claro/oscuro), registra las tipografías y lo pone en el entorno (`\.zcTheme`) para todo lo que contiene. Sin `dark` sigue el modo del sistema. Úsalo una vez en la raíz de la app y en cada captura del catálogo.

`ZCThemeProvider(brand: ZCBrand = …, dark: Bool? = …, @ViewBuilder content: () -> Content)`
