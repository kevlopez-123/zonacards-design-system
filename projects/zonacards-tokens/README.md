# @zonacards/tokens

La **fuente única** del sistema de diseño Zonacards, sin framework. Sirve a cualquier sitio, panel o app: una web en React, Vue, WordPress o HTML puro, `@zonacards/ui` (Angular), y las apps de Android e iOS, que reciben estos mismos archivos convertidos a Kotlin y Swift.

| Carpeta | Qué trae |
| --- | --- |
| `styles/tokens.css` | Variables CSS: color (claro y oscuro), marcas (`data-brand`), tipografía, espacio, radios, movimiento, sombras, **forma por marca** (`--shape-*`) y estilo de campo (`--field-*`). No depende de Tailwind. |
| `tokens/*.json` | Los mismos tokens en formato W3C Design Tokens (DTCG): `primitives`, `semantic.light/dark`, `brand.<marca>.<modo>` y `$themes.json` (Tokens Studio / Figma). Se generan con `npm run tokens`. |
| `i18n/es.json`, `en.json` | Textos de los componentes (espacios `ui`, `mol`, `org`, `top`, `auth`, `validacion`…), con las mismas claves en las tres plataformas. |
| `assets/geo/` | `latam.json` (límites de países, Natural Earth) y `ubigeo-pe.json` (ubigeo del Perú, INEI 2025, MIT: su licencia viaja en `LICENSE-ubigeos_peru.txt`). |
| `assets/brand/` | Íconos y logos de marca. |
| `skills/zonacards-principles/` | Guía para agentes con los principios comunes a web, Android e iOS. |

## Uso en una web cualquiera

```bash
npm install @zonacards/tokens
```

```css
@import "@zonacards/tokens/styles/tokens.css";

.boton { background: var(--primary); color: var(--on-primary); border-radius: var(--shape-button); height: var(--target); }
```

Modo oscuro: clase `dark` en `<html>`. Marca: `data-brand="giftealo|enjoy|motiva"` (sin atributo = Zonacards). Una marca nueva es un bloque `:root[data-brand="miMarca"] { … }` con sus colores, `--shape-*`, `--shape-field-h`, `--field-bg` y `--field-bd`.

Textos: copia o sirve `node_modules/@zonacards/tokens/i18n/*.json` y lee las claves (`mol.legal.acepto`, `validacion.required`…). Datos: `assets/geo/*.json` se sirven como archivos estáticos.

## Quién lo usa

- **Angular**: `@zonacards/ui` depende de este paquete (sus estilos importan `tokens.css`; sus textos y datos se copian de aquí). Ver su README.
- **Android e iOS**: `npm run native` (en el repositorio del sistema de diseño) lee estos archivos y genera `zonacards-tokens` (Kotlin, recursos) y `ZonacardsTokens` (Swift). No se instala por npm.

## Versión

Esta versión es la **versión del sistema de diseño**: un cambio de tokens, textos o datos sube la versión en `@zonacards/tokens`, `@zonacards/ui` y los paquetes de Android e iOS a la vez. Ver `docs/distribucion-multiplataforma.md` del repositorio.
