# Cómo se distribuye el sistema de diseño (web, Android, iOS)

Pregunta: ¿un solo paquete para todo, o uno por tipo de proyecto? Respuesta corta: **una sola fuente y un solo número de versión, pero un paquete por tecnología**, porque cada plataforma instala los suyos con su propio gestor (npm, Gradle/Maven, Swift Package Manager). Un paquete de npm no lo puede instalar una app Android o iOS.

## Hoy

| Pieza | Dónde vive | Cómo se consume | Publicado |
| --- | --- | --- | --- |
| Tokens, textos, íconos de marca, datos (países, ubigeo) y guía de principios, sin framework | `projects/zonacards-tokens` → npm `@zonacards/tokens` | `npm install @zonacards/tokens` | No (versión 2.0.0, lista para publicar; se pregunta antes) |
| Componentes Angular + guía para agentes | `projects/zonacards-ui` → npm `@zonacards/ui` | `npm install @zonacards/ui` (trae a `@zonacards/tokens`) | No: las versiones 1.3.0 a 1.7.0 siguen sin publicar y la próxima es la 2.0.0 (se pregunta antes) |
| Tokens, textos, íconos, fuentes, datos y dominio en Kotlin | `projects/zonacards-native/android/zonacards-tokens` (generado) | Módulo Gradle del mismo repo | No |
| Componentes Compose | `projects/zonacards-native/android/zonacards-compose` | Módulo Gradle del mismo repo | No |
| Tokens, íconos, textos, datos y dominio en Swift | `projects/zonacards-native/ios` (paquete `ZonacardsTokens`) | `.package(path:)` | No (y sin compilar: falta un Mac) |

Lo que une a las tres: **la web es la fuente** y `npm run native` genera lo de Android e iOS desde ella. Eso ya es "un solo sistema".

## Recomendación

### 1. Una sola fuente en un solo repositorio

Se queda como está (monorepo). Es lo que garantiza que un cambio de color, de texto o de regla llegue a las tres plataformas a la vez. Separar repos solo se justifica si equipos distintos mantienen web y móvil y casi no se coordinan; aun así los tokens deberían seguir compartidos.

### 2. Un paquete por tecnología

| Paquete | Para qué proyecto | Gestor |
| --- | --- | --- |
| `@zonacards/tokens` *(a crear)* | Cualquier sitio o panel web, sea o no Angular (React, Vue, WordPress, HTML): `tokens.css`, tokens DTCG, textos es/en, íconos, banderas, datos (países, ubigeo, logos), dominio en TypeScript y la guía de principios. | npm |
| `@zonacards/ui` | Proyectos Angular: los componentes `zc-*`. Depende de `@zonacards/tokens`. | npm |
| `com.zonacards:tokens` y `com.zonacards:compose` | Apps Android. | Maven (repositorio privado: GitHub Packages, Azure Artifacts o Artifactory) |
| `ZonacardsKit` | Apps iOS. | Swift Package Manager por URL de git y etiqueta (un paquete en una subcarpeta no se puede referir por URL: hace falta un espejo o un repositorio de publicación) |

Hoy `@zonacards/ui` ya trae dentro los tokens, textos y datos, así que un proyecto que no es Angular tendría que instalar todo el paquete de componentes para usarlos. Separar `@zonacards/tokens` evita eso y es lo que hace "multiuso" al sistema (otras webs, otros paneles, otras apps).

### 3. Un solo número de versión

Versión del sistema de diseño = versión de `@zonacards/tokens` (tokens, textos, datos y reglas). Cada paquete de componentes declara con qué versión de tokens es compatible:

- Un cambio de tokens, textos o reglas sube la versión **en todos** a la vez (por ejemplo 1.8.0 en npm, Maven y la etiqueta de iOS).
- Una corrección que solo toca una plataforma sube el parche de esa (Android 1.8.1) sin mover las demás.
- Una app declara una sola versión menor ("Zonacards 1.8") y sabe que web, Android e iOS dicen lo mismo.

Versiones independientes por plataforma ahorran poco y obligan a recordar qué combinación es compatible; en un equipo pequeño el número único es lo más claro.

## Estado de la recomendación

- **Hecho:** `@zonacards/tokens` extraído (`projects/zonacards-tokens`, versión 2.0.0 en ambos paquetes). `@zonacards/ui` depende de él, sus estilos importan `tokens.css` desde el paquete, y `npm run tokens` y `npm run native` leen y escriben en él. La raíz lo enlaza con `file:projects/zonacards-tokens`.
- **Hecho también:** el dominio en TypeScript (`montos`, `fechas`, `teléfonos`, importación y exportación…) vive en `@zonacards/tokens/domain` (se compila con `npm run build:tokens-pkg` y se prueba con `npm run test:tokens`); `@zonacards/ui/core` lo reexporta. Las marcas se definen en datos (`zc-tokens brand`) y los vectores de prueba del dominio van en `conformance/`. Guía para otros stacks: `docs/otros-stacks.md`.
- **Lanzamiento con un solo número de versión (hecho):** `node scripts/release.mjs` — `check` (versiones y CHANGELOG coinciden), `set <versión>` (fija tokens, ui, el rango de la dependencia y Maven), `verify` (compila y prueba todo, con `--android` también Android), `pack` (verify + `dist/release/*.tgz` + módulos Maven con `--android`) y `plan` (imprime los comandos de publicación de npm, Maven e iOS; **no ejecuta ninguno**). Atajos: `npm run release:check`, `release:pack`, `release:plan`.
- **Android en Maven (configurado y probado):** `com.zonacards:zonacards-tokens` y `com.zonacards:zonacards-compose` con la versión de `gradle.properties` (`zonacards.version`). Sin variables de entorno solo se publica a Maven local; con `ZC_MAVEN_URL`, `ZC_MAVEN_USER` y `ZC_MAVEN_PASSWORD`, al repositorio privado. Se verificó publicando a una carpeta local: salen el `.aar`, las fuentes, el `.pom` (que enlaza tokens ← compose) y el `.module`.
- **iOS por Swift Package Manager (comandos listos):** el paquete está en una subcarpeta, y SwiftPM necesita la raíz de un repositorio: `release.mjs plan` imprime el `git subtree split` hacia un repositorio espejo con su etiqueta. Falta que alguien cree ese repositorio.
- **Pendiente:** elegir el Maven privado (GitHub Packages, Azure Artifacts, Artifactory…) y el repositorio espejo de iOS, y crear las cuentas. Antes estaba pendiente: Maven privado para Android y repositorio de publicación para iOS. Un flujo único de lanzamiento. Nada de esto se publica sin tu confirmación.

## Lo que había que hacer (referencia)

1. Extraer `@zonacards/tokens` de `@zonacards/ui` (carpetas `styles`, `tokens`, `i18n`, `assets`, dominio y `skills/zonacards-principles`) y hacer que `@zonacards/ui` y `scripts/build-native.mjs` lo lean. Cambia las rutas de importación de estilos para los consumidores: se anunciaría con el CHANGELOG.
2. Publicar Android a un Maven privado (o usarlo como build incluido) y fijar el repositorio de publicación de iOS.
3. Un único flujo de lanzamiento: etiqueta de versión, `npm run build`, pruebas de las tres plataformas y publicación de cada paquete.
4. **Nada se publica sin tu confirmación.** Quedan pendientes las versiones 1.3.0 a 1.7.0 de `@zonacards/ui`.
