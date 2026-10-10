# Plan de trabajo con Claude Code

Una tarea por sesión (`/clear` entre tareas). Cada tarea termina con la definición de terminado de `CLAUDE.md` y tu revisión visual contra `docs/design-system/index.html`.

## Etapa 0 · Lo que ya está en el repositorio
Angular 21.2 zoneless, Tailwind v4 con tokens, Figtree autoalojada, Transloco (es/en), MSW con escenarios, sesión y permisos simulados, interceptores de correlación y errores, dominio (países, montos, fechas, máquinas de estado) con pruebas, y los componentes piloto: icon, flag, button, badge, spinner, money, field + input, state, shell. Pantallas: catálogo y Lotes (piloto).

## Etapa 1 · spartan/ui y átomos restantes
> Instala los componentes helm de spartan/ui que vamos a envolver (`npx @spartan-ng/cli` o `ng g @spartan-ng/cli:ui`): checkbox, radio-group, switch, tooltip, popover, dialog, sheet, menu, select, command, tabs, accordion. Luego crea en shared/ui/atoms: checkbox, radio, switch, chip, avatar, progress, skeleton y tooltip, siguiendo "Entrada de datos" y "Datos y estado" del design system y la tabla de la sección 15 de las reglas. Agrégalos a /catalogo con todos sus estados.

## Etapa 2 · Moléculas de formulario
> Crea select y combobox (búsqueda si hay más de 8 opciones, multiselección con Limpiar/Listo, bottom sheet en móvil y subpantalla con Volver dentro de otro sheet), autocomplete, teléfono, documento por país, número, monto, etiquetas, fecha (dd/mm/aaaa + calendario), periodo (presets + un solo ícono de calendario) y hora (HH:MM + reloj). Valida con ValidatorFn por país. Agrégalas a /catalogo.

## Etapa 3 · Moléculas de navegación y feedback
> Tabs, migas, paginación (compacta; oculta si hay una sola página), alert, toast (cola, aria-live), acordeón (variantes), menú kebab (Bold), carga de archivos. Agrégalas a /catalogo.

## Etapa 4 · Organismos base
> Sidebar con riel y drawer móvil, page header, barra de filtros + bottom sheet de filtros, data view (tarjetas/tabla desde 1024 px), data table (TanStack Table: orden, selección masiva, columnas, densidad, fila expandible, tarjetas en móvil), modal, alert dialog con confirmación escrita, drawer, stepper con resumen de errores, gráficos (ECharts con descargar y vista Datos), estados vacíos y de error.

## Etapa 5 · Pantalla Lotes completa
> Completa features/lotes según la página de ejemplo del design system y la sección 8.4 de la especificación: KPI que filtran, filtros con chips y URL, orden, vista tabla en desktop, descargar (Excel, CSV, PDF), menú por tarjeta, ficha del lote y anulación con doble aprobación. Amplía los mocks a 200 lotes con semilla fija.

## Etapa 6 · Resto del administrador
Un prompt por módulo, reutilizando Lotes como plantilla: maestros (sección 8.3), envíos y activación, stock, ATC, liquidaciones y pagos, reportes (P4), seguridad y control, dashboard por rol, rol Comercio.

## Pendientes externos (no bloquean)
Logos de Zonacards y Giftealo · cuadro de alarmas de stock (C-043) · confirmar cifras tabulares de Figtree · validar el azul accesible de Giftealo con marca · tasas de impuesto por país con Finanzas.
