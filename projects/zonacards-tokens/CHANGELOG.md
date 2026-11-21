# Cambios de @zonacards/tokens

Versionado semántico, con el mismo número que `@zonacards/ui` y que los paquetes de Android e iOS (versión del sistema de diseño).

## 2.0.0

**Paquete nuevo.** Los tokens, textos, datos y guía de principios salen de `@zonacards/ui` para poder usarse sin Angular.

- `styles/tokens.css` (antes `@zonacards/ui/styles/tokens.css`, nunca documentado para consumo directo).
- `tokens/*.json` (DTCG), antes `@zonacards/ui/tokens/*.json`.
- `i18n/es.json` y `en.json`, antes `@zonacards/ui/i18n/*`.
- `assets/geo` y `assets/brand`, antes `@zonacards/ui/assets/*`. Nuevo: `ubigeo-pe.json`.
- `skills/zonacards-principles`, la guía de principios comunes.
- Nuevo: **dominio sin framework** (`@zonacards/tokens/domain`), antes dentro de `@zonacards/ui/core` (que lo reexporta, sin cambios para las apps Angular).
- Nuevo: **marcas en datos** (`@zonacards/tokens/brand`, CLI `zc-tokens`, `schema/brand.schema.json`): una marca es un JSON que se valida y se convierte en CSS.
- Nuevo: `conformance/` con los vectores de prueba del dominio.
- Nuevo en los tokens: forma por marca (`--shape-control`, `--shape-card`, `--shape-sheet`, `--shape-button`, `--shape-field-h`) y estilo de campo (`--field-bg`, `--field-bd`).

Si usas `@zonacards/ui`, ajusta las rutas de textos y datos (ver su CHANGELOG 2.0.0).
