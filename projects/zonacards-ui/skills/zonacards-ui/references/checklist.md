# Revisión antes de terminar

Recorre esta lista sobre cada pantalla o componente que tocaste. Si algo falla, corrígelo antes de reportar.

## Código

- [ ] Imports desde subrutas (`@zonacards/ui/<entrada>`); ninguno desde `'@zonacards/ui'` ni `@zonacards/ui/helm`.
- [ ] Componentes standalone, `OnPush`, signals, `inject()`, control flow `@if/@for`.
- [ ] Ningún color, tamaño o radio fijo; ningún color de la paleta por defecto de Tailwind.
- [ ] Ningún `<select>`, `title=""`, `confirm()`, `alert()`, `<table>` manual, emoji o toaster propio.
- [ ] Gráficos dentro de `@defer (on viewport)`.
- [ ] Listeners de plantilla que no devuelven `false`.

## Contenido

- [ ] Todo texto visible viene de i18n (es y en con las mismas claves).
- [ ] Montos, fechas, teléfonos con los helpers de `@zonacards/ui/core`.
- [ ] Placeholders solo como ejemplo de formato; instrucciones en `hint`.
- [ ] Estados con ícono + texto (`zc-badge [tone] [icon]`).

## Estados

- [ ] Cargando (skeleton), vacío, sin resultados, error con referencia y reintento.
- [ ] Acciones con `[loading]` y toast de resultado; destructivas con `zc-alert-dialog`.

## Responsive

- [ ] Funciona desde 360 px sin scroll horizontal de página.
- [ ] Listados en tarjetas en móvil; filtros en `zc-drawer` con "Limpiar" + "Ver resultados".
- [ ] Ningún sheet sobre otro.
- [ ] Grids con `minmax(0,…)`.

## Accesibilidad

- [ ] Todo operable con teclado; foco visible; Escape cierra overlays.
- [ ] Botones de solo ícono con `aria-label` (y `zcTooltip`).
- [ ] Campos dentro de `zc-field` con etiqueta; errores visibles en el campo.
- [ ] Áreas con scroll con `zcScrollArea` o `tabindex="0"` + `role="region"` + `aria-label`.
- [ ] Contraste correcto en tema claro y oscuro (prueba ambos).

## Verificación

- [ ] `ng build` sin errores ni advertencias nuevas de presupuesto.
- [ ] Pruebas del proyecto en verde.
- [ ] Revisada en el navegador: claro, oscuro, 360 px y desktop.
