---
name: zonacards-principles
description: Principios del sistema de diseño Zonacards que valen en todas las plataformas (web Angular, Android Compose, iOS SwiftUI): fuente única, tokens, estados, textos, formato, accesibilidad, marcas y cómo reportar. Úsala al decidir cómo diseñar o revisar una pantalla sin importar la plataforma, o al llevar una pieza de una plataforma a otra. Para el código usa zonacards-ui (web) o zonacards-native (Android e iOS).
---

# Principios de Zonacards (todas las plataformas)

Zonacards es **un solo sistema de diseño con tres implementaciones**. Esta skill dice lo que no cambia; el cómo de cada plataforma está en su skill:

| Plataforma | Skill | Paquete | Componentes |
| --- | --- | --- | --- |
| Web (Angular 21/22) | `zonacards-ui` | npm `@zonacards/ui` | `zc-*` (`<zc-field>`, `<zc-select>`…) |
| Android (Compose) | `zonacards-native` | Gradle `zonacards-tokens` + `zonacards-compose` | `Zc*` (`ZcTextField`, `ZcSelect`…) |
| iOS (SwiftUI) | `zonacards-native` (sección iOS) | Swift package `ZonacardsTokens` | `ZC*`, **aún sin componentes** |

## Una sola fuente

La web manda (en `@zonacards/tokens`, sin framework). De ella salen, para las tres plataformas: **tokens** (`tokens.css` → DTCG → `ZcTheme`/`ZCTheme`), **textos** (`i18n/es.json` y `en.json` → `strings.xml`/`xcstrings`), **íconos**, **banderas**, **fuentes**, **datos** (países, ubigeo del Perú, logos) y **reglas de dominio** (montos, fechas, teléfonos, claves, recurrencia, máquinas de estado, con los mismos vectores de prueba). Si una regla cambia, cambia en un lugar y se regenera (`npm run native`). Nunca la copies a mano a una app.

## Otros stacks y marcas propias

El dominio en TypeScript (`@zonacards/tokens/domain`) y los vectores de prueba (`conformance/`) sirven a cualquier stack. Una marca nueva es un JSON que se valida y se convierte en CSS con `npx zc-tokens brand`. Guía completa: `docs/otros-stacks.md`.

## Nombres equivalentes

`zc-foo` (web) = `ZcFoo` (Android) = `ZCFoo` (iOS). Mismos nombres de ícono (`s:phone` = `ZcIcons.sPhone` = `.sPhone`), mismas claves de texto (`mol.legal.acepto` = `R.string.zc_mol_legal_acepto`), mismos estados y mismos tokens (`--shape-card` = `ZonacardsTheme.shape.card` = `theme.shape.card`).

## Principios

1. **Compón, no inventes**: antes de dibujar algo, busca el componente. Si falta, se agrega al sistema (con su demo, pruebas y documentación), no a la pantalla.
2. **Solo tokens**: sin colores, radios ni alturas sueltos. Forma por marca con los nombres semánticos (`control`, `card`, `sheet`, `button`, `field-h`, `field-bg`, `field-bd`): una marca nueva cambia solo tokens.
3. **Toda vista tiene sus estados**: cargando (esqueleto), vacío, sin resultados y error con reintento; acciones con estado de carga y resultado visible.
4. **Textos de un solo lugar**: nada de literales en componentes; mismas claves en español e inglés. Placeholders solo como ejemplo de formato; las instrucciones van en la ayuda.
5. **Formato del sistema**: montos, fechas y teléfonos con los formateadores del dominio; el valor guardado es crudo (ISO, número) y el formato es solo para mostrar.
6. **Estado = ícono + texto**, nunca solo color. Errores junto al campo y anunciados.
7. **Accesibilidad**: todo operable sin ratón, foco visible, nombre para el lector de pantalla, targets de al menos 44 (web 48/56), contraste suficiente, respeto de "reducir movimiento" y del tamaño de letra del sistema.
8. **Móvil primero**: listados en tarjetas, filtros y selecciones en hojas inferiores, nunca una hoja sobre otra (subpantalla con Volver).
9. **Acciones de riesgo**: motivo, resumen y aprobación de un segundo usuario; el servidor decide y vuelve a validar todo lo que el cliente valida.
10. **Marcas**: Zonacards, Giftealo, Enjoy y Motiva comparten componentes; las pantallas no preguntan por la marca.

## Al llevar una pieza de una plataforma a otra

1. Parte de la web (o de Android si ya existe) y conserva **nombre, parámetros y comportamiento**.
2. Reusa textos, íconos y dominio generados; no los reescribas.
3. Lo que depende de la plataforma se adapta con el patrón nativo: selector de fecha del sistema, hoja inferior, mapa con el SDK o teselas, permisos, teclado.
4. Pruébala igual que las otras (comportamiento, captura, accesibilidad) y deja el mismo texto de catálogo.

## Al reportar

Separa **escrito**, **compilado** y **probado**; di qué comandos corriste y qué no (por ejemplo: sin Mac no se compila iOS). No hay "listo" sin pruebas verdes de la plataforma tocada. Si algo quedó pendiente, dilo.
