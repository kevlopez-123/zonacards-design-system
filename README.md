# Zonacards 2.0 · Administrador

Frontend del administrador de gift cards de Promotick: Angular 21.2, Tailwind CSS v4, spartan/ui, Transloco y datos simulados con MSW.
Responsable del design system: Kevin López (Regional Product Design Lead).

## Requisitos
- Node.js 22.12 o superior (`.nvmrc`), o Node 24.
- npm 10 para `npm ci`. Para **agregar** dependencias usa npm 11 (`npx npm@11 install <paquete>`): npm 10 tiene un error conocido al resolver las dependencias opcionales de Vitest y jsdom.

## Primeros pasos
```bash
npm ci                     # instala versiones exactas
npm start                  # http://localhost:4200 con datos simulados
npm test                   # pruebas unitarias (Vitest)
npx playwright install chromium   # solo la primera vez
npm run e2e                # flujos + auditoría de layout y accesibilidad en 6 anchos
npm run build              # producción en dist/ (sin mocks)
```

Pruebas de estados sin backend: `/lotes?scenario=vacio`, `?scenario=error`, `?scenario=lento`.

## Estructura
```text
src/
  styles/tokens.css            # única fuente de colores, tipografía, espacios, radios y temas
  styles.css                   # Tailwind v4 + puente de tokens (@theme)
  app/
    core/                      # tema, idioma, sesión y permisos, interceptores HTTP
    shared/
      domain/                  # países, montos, fechas, máquinas de estado (+ pruebas)
      ui/atoms|molecules|organisms   # componentes zc-* del design system
    features/<dominio>/        # páginas; un dominio no importa de otro
    mocks/                     # MSW: handlers por dominio y fixtures con semilla fija
public/i18n/                   # es.json, en.json
docs/                          # especificación, reglas, design system (HTML) y plan de trabajo
e2e/                           # Playwright: flujos y auditoría
scripts/build-icons.mjs        # empaqueta solo los íconos usados (Solar y Lucide)
CLAUDE.md                      # reglas permanentes para Claude Code
```

## Trabajar con Claude Code
1. Completa `docs/` exportando las dos pestañas del documento de especificación (ver `docs/LEEME.md`).
2. Abre el repositorio con Claude Code: lee `CLAUDE.md` en cada sesión.
3. Sigue `docs/tareas-claude-code.md` en orden, una tarea por sesión, y revisa cada entrega en `/catalogo` contra `docs/design-system/index.html`.
4. Opcional: `npx skills add spartan-ng/spartan` para que Claude Code conozca la API de spartan/ui.

## Decisiones técnicas
- **Zoneless + signals + OnPush**; recursos HTTP con `httpResource`.
- **Figtree autoalojada** (`@fontsource-variable/figtree`, OFL): sin depender de Google Fonts.
- **Íconos empaquetados en build** desde `@iconify-json` (sin peticiones en ejecución). **Banderas** de `flag-icons` servidas como archivos y cargadas solo cuando se usan.
- **Angular 21.2.24** (última versión estable de la rama 21). Pasar a Angular 22 más adelante es una migración con `ng update` y se decide con el equipo.
- **Versiones exactas** en `package.json`, todas publicadas hace al menos 14 días al crear el proyecto (10/10/2026).
