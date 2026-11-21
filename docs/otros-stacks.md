# Usar el sistema de diseño en otros stacks, y sumar marcas y plataformas

`@zonacards/tokens` es la fuente única y no depende de ningún framework. Esta guía explica cómo usarlo desde un stack que no sea Angular, Android o iOS, cómo darle a un proyecto su propia marca y cómo sumar una plataforma nueva.

## Qué se comparte

| Pieza | Formato | Dónde |
| --- | --- | --- |
| Tokens (color, tipografía, espacio, forma, movimiento, sombras) | CSS (`tokens.css`) y W3C Design Tokens (DTCG) | `styles/`, `tokens/` |
| Textos de los componentes | JSON es/en con claves `espacio.clave` y `{{param}}` | `i18n/` |
| Datos | JSON (países, ubigeo del Perú, límites de mapa) | `assets/geo/` |
| Reglas de dominio | TypeScript sin framework y vectores de prueba en JSON | `@zonacards/tokens/domain`, `conformance/` |
| Marcas | JSON validado → CSS | `schema/`, `bin/zc-tokens` |
| Guía para agentes | Markdown con encabezado de skill | `skills/zonacards-principles` |

## Recetas por stack

### Web sin Angular (React, Vue, Svelte, HTML)

```bash
npm install @zonacards/tokens
```

```css
@import "@zonacards/tokens/styles/tokens.css";   /* variables: var(--primary), var(--surface), var(--shape-card)… */
```

```ts
import { formatMoney, isValidPhone, toCsv } from '@zonacards/tokens/domain';   // mismas reglas que las apps
import es from '@zonacards/tokens/i18n/es.json';                               // textos; úsalos con tu librería de i18n
```

- Modo oscuro: clase `dark` en `<html>`. Marca: `data-brand="…"`.
- Los componentes visuales (`zc-*`) son de Angular. En otro framework, arma los tuyos con los tokens y respeta las reglas de `zonacards-principles` (tokens, estados, accesibilidad). Los nombres de tokens de forma (`--shape-control`, `--shape-card`, `--shape-sheet`, `--shape-button`, `--shape-field-h`, `--field-bg`, `--field-bd`) son el contrato para que una marca cambie la forma sin tocar tus componentes.
- Los textos usan `{{param}}` (Transloco/ICU simplificado). Cámbialo por el formato de tu librería con una función de una línea.

### Backend (Node)

`@zonacards/tokens/domain` corre en Node: valida teléfonos, documentos tributarios y claves, calcula montos y fechas con la misma regla que la web, y lee o valida importaciones (`readXlsx` necesita `DOMParser`: en Node usa `jsdom` o `linkedom`). Así el servidor y el cliente nunca discrepan.

### WordPress, Elementor y sitios con constructor

Importa `tokens.css` (y el CSS de tu marca) como hoja de estilos global y usa las variables en los estilos del constructor. Los íconos de marca están en `assets/brand/` y los textos en `i18n/`.

### React Native, Flutter y otros móviles

Lee los tokens DTCG (`tokens/semantic.light.json`, `semantic.dark.json`, `brand.<marca>.<modo>.json`, `primitives.json`) con Style Dictionary o un script propio y genera tu tema. Usa `conformance/domain-vectors.json` para probar tu implementación del dominio (ver abajo). Para Android e iOS nativos ya existen los generadores de este repositorio (`npm run native`).

### Figma

`tokens/$themes.json` y los JSON DTCG se importan con el plugin Tokens Studio.

## Una marca propia

Una marca es un archivo JSON (esquema en `schema/brand.schema.json`, ejemplo en `examples/acme.brand.json`):

```json
{
  "id": "acme",
  "font": "\"Inter Variable\", \"Inter\", ui-sans-serif, system-ui, sans-serif",
  "accent": "#e11d48",
  "shape": { "control": "12px", "card": "20px", "sheet": "24px", "button": "9999px", "fieldHeight": "56px" },
  "field": { "background": "#f4f4f5", "border": "#71717a" },
  "light": { "primary": "#be123c", "on-primary": "#ffffff" },
  "dark": { "primary": "#fb7185", "on-primary": "#1c0509" }
}
```

```bash
npx zc-tokens brand --check acme.brand.json          # formato y contraste; sale con 1 si hay errores
npx zc-tokens brand acme.brand.json --out acme.css   # genera el CSS
```

- **Un proyecto con su marca** (web): carga `tokens.css` y luego `acme.css`, y pon `data-brand="acme"` en `<html>`. No hace falta tocar el paquete.
- **Una marca dentro del sistema** (web, Android e iOS): pega el CSS generado al final de `styles/tokens.css`, corre `npm run tokens` y `npm run native`. La marca entra sola en `ZcBrand`/`ZCBrand` y en el menú del catálogo. Si usa una fuente que no está en `projects/zonacards-native/shared/fonts`, las apps nativas usan la del sistema hasta que sueltes sus archivos `.ttf` y su licencia OFL en esa carpeta y agregues una línea a `fonts.json` (familia, archivos y peso). Probado: una marca de ejemplo generó 10 temas y compiló en Android.
- `validateBrand` revisa: id en minúsculas y guiones; colores `#rrggbb`; medidas en `px` o `rem`; contraste del texto sobre el primario, el secundario, el fondo y las superficies (4,5:1), y del primario, el foco y el borde de campo sobre el fondo (3:1).

## Sumar una plataforma

Una plataforma nueva (otro framework, otra tecnología móvil) implementa cuatro cosas, en este orden:

1. **Tema**: lee los tokens (CSS o DTCG) y expón colores, tipografía, espacio, forma y movimiento con los mismos nombres. Implementación de referencia: `scripts/build-native.mjs`.
2. **Textos**: lee `i18n/es.json` y `en.json` y resuelve `espacio.clave` con `{{param}}`. Implementación de referencia: la conversión a `strings.xml` y `Localizable.xcstrings` en `build-native.mjs`.
3. **Dominio**: reimplementa las reglas (`money`, `dates`, `phone`, `password`, `tax-id`, `states`, `recurrence`) y haz que pasen `conformance/domain-vectors.json`: cada caso es una entrada y la salida exacta de la web, con la configuración de idioma de `domain-spec.json` (separadores, patrones de moneda y fecha) para no depender del ICU de cada dispositivo. Android e iOS corren estos mismos vectores. Si dos plataformas discrepan, el vector decide.
4. **Componentes**: sigue `skills/zonacards-principles` (solo tokens, todos los estados, accesibilidad, mismos nombres) y las guías de las plataformas existentes (`zonacards-ui`, `zonacards-native`). Usa la misma batería de pruebas: comportamiento, capturas y auditoría de accesibilidad.

## Lo que todavía no hay

- Componentes visuales fuera de Angular y Android (iOS está sin escribir; React, Vue y otros, tampoco).
- Publicación real: las cuentas, el Maven privado y el repositorio espejo de iOS los define quien responde por el sistema. `node scripts/release.mjs plan` imprime los comandos (ver `distribucion-multiplataforma.md`); nada se publica solo.
