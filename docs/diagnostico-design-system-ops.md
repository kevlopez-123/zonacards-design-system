# Diagnóstico del sistema de diseño Zonacards

**Titular:** el sistema es sólido y está bien gobernado por reglas y CI, pero lo que hoy le dice a un agente la documentación, las páginas de referencia y las pruebas por marca y tema oscuro no siempre es cierto; empezar por ahí antes de pedirle a Claude Code que arme productos.

Fecha de la instantánea: 2026-11-28 · repo en `main`, versión 2.0.0 (`@zonacards/ui` y `@zonacards/tokens`) · método: plugin design-system-ops (flujo `/full-diagnostic`, inventario único, tarjetas de traspaso entre pasos). Es una propuesta de análisis: no se cambió nada en el repo salvo este archivo.

---

## Resumen ejecutivo

Zonacards tiene lo que suele faltar en otros sistemas: una fuente única de tokens (`tokens.css` hacia DTCG, Android e iOS), 115 puntos de entrada web con un componente cada uno, reglas escritas y verificadas por CI (axe en 6 anchos, presupuesto de tamaño, `llms.txt` generados, regeneración nativa con `git diff`) y 8 temas generados de forma idéntica para nativo. La deuda no está en la calidad de los componentes base (los de mayor uso, como `field` y `button`, usan correctamente los tokens de forma).

Lo que más pesa para tu objetivo (que Claude Code arme pantallas y flujos) son cuatro cosas de la misma familia, "la verdad que ve el agente":

1. Afirmaciones falsas en las guías que el agente lee primero (iOS "aún sin componentes", "no se construyen pantallas nuevas", versiones pendientes) y que `build-llms` copia a tres `llms-full.txt`.
2. Las páginas que `CLAUDE.md` nombra como plantilla (Lotes y Aprobaciones) arman a mano tarjetas y tamaños de texto que las reglas hoy prohíben, así que un agente que las copie reproduce la deriva.
3. La capa de marcas y modo oscuro es la que concentra deuda de varias áreas: la forma por marca llega a pocos componentes, dos pares de color no cumplen contraste y el e2e de accesibilidad solo corre con la marca y el tema por defecto.
4. No hay un manifiesto de componentes legible por máquina ni descripciones (`$description`) en los tokens.

**Primera acción recomendada:** corregir las cuatro afirmaciones obsoletas y regenerar los `llms` (unas 2 horas), y después añadir la matriz marca por modo al e2e de accesibilidad.

**Madurez inferida (etapa):** Systematic, porque las reglas están codificadas en `CLAUDE.md` y se hacen cumplir con CI. No llega a Measured: no hay datos de adopción ni métricas de deriva en el repo.

---

## Resultados por skill

Severidades: Crítico, Alto, Medio, Bajo. "Inspeccionado" = leído o buscado directamente; "inferido" = deducido de lo leído, sin ejecutar nada.

### Token audit

| ID | Hallazgo | Evidencia | Severidad |
|---|---|---|---|
| TA-01 | Las rampas de color (azul marino, celeste, ámbar, verde, rojo, azul, violeta, turquesa; 11 pasos cada una) solo existen en el catálogo. En los tokens solo hay la rampa `neutral`. Los colores de estado son hex sueltos, no alias de una primitiva (39 valores hex frente a 24 alias en `semantic.light.json`). Hay dos fuentes para el mismo valor. | `src/app/features/catalogo/fundamentos.page.ts:33-46`; `projects/zonacards-tokens/styles/tokens.css:118-123`; `tokens/primitives.json` (solo `color.neutral`) | Alto |
| TA-02 | La fuente de verdad es `tokens.css`, leída con expresiones regulares que ignoran los `@media`. Los JSON DTCG se generan con `npm run tokens`, pero ningún workflow lo corre ni compara. `build-native` toma la lista de marcas de esos JSON. Inferido: una marca nueva en el CSS sin regenerar no llegaría a nativo y el `manifest.json` diría `skipped: []`. Hoy los JSON están al día (mismo commit que el CSS, 2026-11-20). | `scripts/build-tokens.mjs:12-21`; `scripts/build-native.mjs:47`; `package.json:8` (`prebuild` no corre tokens); `.github/workflows/web.yml:26-37` | Medio |
| TA-03 | El conjunto oscuro DTCG no trae 19 tokens que sí están en el claro (`field-bg`, `field-bd`, `row-selected-bg`, `thumb`, `sidebar-*`, `chart-h`, anchos de sidebar). El tema `zonacards-dark` solo activa `semantic.dark`. Inferido: quien consuma `$themes.json` (Tokens Studio, Figma) no resuelve esos alias en oscuro. Nativo no se afecta: `manifest.json` muestra 132 colores en cada uno de los 8 temas. | `tokens/semantic.dark.json` frente a `semantic.light.json`; `tokens/$themes.json:11-19` | Medio |
| TA-04 | Los tokens no tienen `$description`: 0 coincidencias en `primitives.json` y `semantic.light.json`. La intención ("para qué sirve `--text-subtle`", "AA sobre surface-2") vive solo en comentarios de CSS. | `tokens.css:41-45`, `:109-111` | Medio |
| TA-05 | El bloque `:root` mezcla valores de producto (`--pay-*`, `--email-*`, `--camera-*`, `--sso-*`, `--qr-*`) con primitivas, y las dimensiones de layout salen tipadas como `size`. No hay una capa de tokens de componente explícita. Si la mezcla es deliberada, ignora este punto. | `tokens.css:19-29`, `:99-105`; `build-tokens.mjs:30-39` | Bajo |

Orphans no evaluados (ver Scope).

### Naming audit

| ID | Hallazgo | Evidencia | Severidad |
|---|---|---|---|
| NA-01 | Hay tres esquemas de nombre para el mismo dominio. Movimiento: `--dur`/`--ease` por un lado y `--dur-fast/base/slow/exit` y `--motion-ease-*` por otro (`--dur: 160ms` equivale a `--dur-exit` pero tiene otro nombre). Sombras: `--elev-*` y `--shadow-*`. Radios: `--r-*` (escala) y `--shape-*` (por rol). | `tokens.css:51` frente a `:84-87`; `:80` frente a `:136`; `projects/zonacards-ui/styles/zonacards.css:101` | Medio |
| NA-02 | El punto de entrada `misc` agrupa cinco átomos sin relación (`zcKbd`, `zc-separator`, `zcButtonGroup`, `zc-close-button`, `zcLink`). Su "Para" es solo la lista de selectores, y `CLAUDE.md` dice "un punto de entrada por componente". Un agente que busque "button group" no adivina `misc`. | `projects/zonacards-ui/skills/zonacards-ui/references/components.md:369-373` | Bajo |

El resto de la nomenclatura es consistente: prefijo `zc-` en todos los selectores propios, `Zc`/`ZC` por plataforma (documentado como decisión en `zonacards-principles`), y nombres de ícono, claves de texto y marcas iguales entre plataformas.

### Component audit

| ID | Hallazgo | Evidencia | Severidad |
|---|---|---|---|
| CA-01 | Inventario: 115 puntos de entrada web (por `ng-package.json`, sin la raíz). Solo 21 contienen un `.spec.ts` (28 archivos de prueba en la librería). La calidad se apoya en 23 specs e2e sobre el catálogo más la auditoría axe. Los de mayor dependencia interna son `icon` (92 archivos importadores), `core` (85), `button` (43), `field` (37). | `find projects/zonacards-ui -name ng-package.json`; `e2e/` | Medio |
| CA-02 | `captcha` y `mfa-setup` solo se exportan: ningún otro componente los importa, no tienen demo en el catálogo, ni e2e, ni sección en `index.html` o en `design-system-port.md`. Sin demo no pasan por axe. `CLAUDE.md` pide "primero en /catalogo". (Control: el mismo método sí encuentra `sparkline` y `geo-map` en el catálogo.) | `projects/zonacards-ui/captcha/`, `mfa-setup/`; `src/public-api.ts`; `CHANGELOG.md:104` (agregados en 1.x) | Medio |
| CA-03 | Paridad iOS. Por nombre, no hay equivalente en `ios/Sources` de plantillas de página (`ZCListPage`, `ZCDetailPage`, `ZCFormPage`, `ZCDashboardPage`), `ZCLegalSheet`, `ZCSupportSheet`, `ZCSubnav`, `ZCDashboardGrid`, `ZCOnboarding`, `ZCDateWheel`, `ZCTooltip`, `ZCAnnouncement`. Android sí los tiene. Para armar pantallas en iOS con el sistema, faltan justo las plantillas. | búsqueda en `projects/zonacards-native/ios/Sources` (0 coincidencias cada una); `references/compose-api.md` | Medio |

Duplicación (dimensión 3 del skill): no se evaluó con rigor; no se encontraron pares de componentes con el mismo propósito en `components.md`, que ya trae "No para: usa X" en 64 de 111 entradas.

### Drift detection (consumidor: `src/app`, fuera de `catalogo` y `mocks`)

Sin hallazgos en: importes por el barril o rutas relativas a `projects/`, `hlm-*` directo, `@ng-icons`, `<select>` nativo, clases de paleta Tailwind, emojis, `window.confirm`. Control: el patrón de importes sí encuentra los 107 puntos de entrada en `src`. Los patrones de `hlm`, paleta y emojis no tienen control positivo, así que esos "cero" quedan sin confirmar.

| ID | Hallazgo | Clase | Evidencia | Severidad |
|---|---|---|---|---|
| DF-01 | Las plantillas que `CLAUDE.md` nombra (Lotes y Aprobaciones) arman la tarjeta de listado a mano: `<article class="… rounded-md border … p-5">`. La regla actual es `<zc-card>` y `rounded-card` ("No armes `<article>` a mano"), y con la marca Enjoy la tarjeta debería medir 28 px, no 16. `lotes.page.html` no se toca desde 2026-10-11; `zc-card` se tocó por última vez el 2026-11-20. | B (desfase de versión) | `src/app/features/lotes/lotes.page.html:132`; `aprobaciones/aprobaciones.page.html:111`; 11 usos de `rounded-sm/md` en pantallas | Alto |
| DF-02 | 51 usos de `text-[Npx]` en pantallas (18 en `aprobacion-detail`, 12 en `lote-detail`, 10 en `aprobaciones`, 7 en `lotes`). Los valores 13, 14.5, 15 y 17 px son exactamente los tokens `caption`, `body-sm`, `body` y `title-sm`; se pierde además el interlineado del par. Hay 9 usos de `text-sm/base/xs`: la escala por defecto de Tailwind sigue disponible (no se encontró `--text-*: initial` en `zonacards.css`). | C / D (descuido o desconocimiento) | `aprobacion-detail.page.html:24`; `lote-detail.page.html:93`; `tokens.css:62-67` | Medio |

Reparto de causa: no hay deriva por "falta del sistema" (clase E): lo que se hace a mano ya existe en el sistema.

### Docs coverage

| ID | Hallazgo | Evidencia | Severidad |
|---|---|---|---|
| DC-01 | La guía común dice que iOS está "aún sin componentes", y `ios.md` lista como "Lo que falta" los componentes que ya existen (42 archivos Swift en `ZonacardsUI`; `plan-ios.md:58` da la ola 5 por hecha con CI en verde el 23 nov). `build-llms` copia la frase a tres `llms-full.txt`. El `--check` de CI verifica la derivación, no que sea cierto. | `projects/zonacards-tokens/skills/zonacards-principles/SKILL.md:14`; `…/llms-full.txt:15`; `projects/zonacards-native/llms-full.txt:80`; `projects/zonacards-ui/llms-full.txt:239`; `…/references/ios.md:46` | Alto |
| DC-02 | `design-system-port.md` dice "Mientras dure el port no se construyen pantallas nuevas", pero su tabla tiene 71 filas hechas y ninguna pendiente (⬜ y 🟡 solo aparecen en la leyenda). Contradice el objetivo actual y `CLAUDE.md`. Además `:120` cuenta 97 entradas (hay 115) y `distribucion-multiplataforma.md:58` dice que faltan publicar 1.3.0 a 1.7.0 cuando el paquete está en 2.0.0. | `docs/design-system-port.md:116,120`; `docs/distribucion-multiplataforma.md:58` | Alto |
| DC-03 | `components.md` (la tabla "necesito X, usa Y") no trae `zc-action-bar`, `zc-datetime-field` ni `zc-fieldset`; sí están en `api.md`. `CLAUDE.md` pide actualizarla en cada componente nuevo y ninguna prueba lo comprueba. (Control: el método encuentra los otros 112 de 115.) | `references/components.md` (0 coincidencias); `references/api.md` | Medio |
| DC-04 | El workflow web ignora los cambios que solo tocan `.md` o `docs/`, y las skills (fuente de los `llms.txt`) son `.md`. Un commit solo de skills no corre el `--check`. Además, 23 de 153 commits llevan `[skip ci]`, todos desde el 2026-11-20 (23 de 102 en ese periodo). | `.github/workflows/web.yml:7-10,33`; `git log --grep='skip ci'` | Medio |
| DC-05 | `docs/design-system/index.html` (la referencia visual) no tiene sección para 13 ids que el catálogo sí tiene (`m-action-bar`, `m-delete`, `m-import`, `m-intro`, `m-legal`, `m-menu`, `m-support`, `m-ubigeo`, `o-code`, `o-context`, `o-split`, `o-tree`, `o-vtable`). Por verificar: comparé `id="x-…"` con `dsId=`; otros 5 ids que parecían faltar resultaron estar mapeados en `ds/catalog-index.ts`. | `src/app/features/catalogo/ds/catalog-index.ts`; `docs/design-system/index.html` | Bajo |

### Theme audit (4 marcas por 2 modos = 8 temas)

Nota: el repo tiene 3 bloques `data-brand` (giftealo, enjoy, motiva) más la base Zonacards. Son 4 marcas y 8 combinaciones, no 8 marcas (`manifest.json` y `$themes.json` lo confirman).

| ID | Hallazgo | Evidencia | Severidad |
|---|---|---|---|
| TH-01 | El e2e de accesibilidad (axe, `wcag2aa`, incluye contraste) corre solo con la marca y el tema por defecto: ningún spec de `e2e/` activa `.dark` ni `data-brand`. Las capturas visuales sí alternan claro y oscuro, pero solo con la marca base y no están en `web.yml`. El comentario del workflow dice que el tema claro/oscuro lo cubren "las propias pruebas e2e". Nativo sí tiene `ContrastTest` en las 8 combinaciones, aunque con 13 pares y ninguno de `text-subtle` ni `field-bd`. | `e2e/audit.spec.ts:58`; `e2e-visual/visual.spec.ts:42`; `.github/workflows/web.yml:1-3`; `native/android/catalog/src/test/kotlin/com/zonacards/catalog/CatalogSnapshotTest.kt:219` | Alto |
| TH-02 | Contraste de `--text-subtle` en claro (#737373): 4.35:1 sobre `surface-2` (#f5f5f5), 3.76:1 sobre `surface-3` y 4.45:1 sobre el fondo de Giftealo (#f5f8fc). AA para texto pide 4.5:1. En oscuro ya se corrigió (comentario en el CSS), en claro no. Hay 32 usos de `text-subtle`; no verifiqué cuáles caen sobre esas superficies (p. ej. `calendar.component.ts:110` usa `bg-surface-2`). Cálculo propio con la fórmula WCAG. | `tokens.css:112` y `:144-146`; `projects/zonacards-ui/calendar/calendar.component.ts:110` | Medio |
| TH-03 | Enjoy en claro: el borde de los campos (`--field-bd` #d4d4d4) sobre `--field-bg` (#f5f5f5) da 1.36:1, y 1.42:1 contra el fondo de página. WCAG 1.4.11 pide 3:1 para el borde que identifica un control. La marca base usa `--border-strong` (3.28:1 sobre blanco). Cálculo propio. | `tokens.css:168`; `field.component.ts:82` | Medio |
| TH-04 | La forma por marca (`--shape-*`) llega a pocos componentes: 23 usos de `rounded-control/card/sheet` frente a 102 de `rounded-sm/md/lg` en la librería (sin `helm`; el conteo incluye usos que no son tarjeta). Con Enjoy (tarjeta y hoja 28 px) estos bloques se quedan en 16 px: `accordion.component.ts:83`, `cart.component.ts:26`, `chart.component.ts:140`, `dashboard-grid.component.ts:61`, `carousel.component.ts:27`. Los campos de color usan `rounded-sm` con `h-target`, no `rounded-control`/`h-field`. Los tokens de forma se introdujeron el 2026-11-20 (commit `a2b40ac`), cuando ya existían los componentes (p. ej. `accordion` y `card`, 2026-10-11). | `projects/zonacards-ui/color/color-field.component.ts:21`; `styles/zonacards.css:83` | Medio |
| TH-05 | Variante "marca oscura" del sidebar: `--sidebar-brand-bg` usa `--brand-secondary`, que ninguna marca sobreescribe (las marcas tocan `--primary`/`--secondary`). Se queda en el azul marino de la base en Enjoy y Motiva. En los gráficos, solo Motiva (claro) cambia `--chart-1` y solo Giftealo (claro) `--chart-2`: en oscuro vuelven al color base. Si es intencional, márcalo como aceptado. | `tokens.css:131`, `:164-170` | Bajo |

### Figma variable audit

Omitido: Figma no está configurado (ver Scope). No es un hallazgo.

### System health

| Dimensión | Estado | Evidencia principal |
|---|---|---|
| Tokens | Functional | Fuente única, DTCG, 8 temas iguales en nativo; débil en rampas primitivas (TA-01), guardas de generación (TA-02) y descripciones (TA-04) |
| Componentes | Strong (web) / Functional (iOS) | 115 entradas, reglas de forma, estados y accesibilidad verificadas por e2e; poca prueba unitaria (CA-01) y plantillas iOS ausentes (CA-03) |
| Documentación | Functional | Referencias de API generadas y `llms.txt` por paquete; con afirmaciones obsoletas (DC-01, DC-02) y vacíos en `components.md` (DC-03) |
| Adopción | No evaluada | No se aportaron datos de adopción; hay un solo consumidor en el repo (`src/app`) y la deriva no se usa para inferirla |
| Decisiones y gobierno | Weak | Las reglas son fuertes (`CLAUDE.md`), pero no se encontraron registros de decisión, CODEOWNERS, plantilla de PR ni CONTRIBUTING; los 153 commits son de una sola persona (dos variantes del nombre) |
| Preparación para agentes | Functional | Base fuerte (skills por plataforma, `llms.txt`, API generada, vectores de dominio); faltan manifiesto JSON, contrato de accesibilidad por componente y hechos al día (ver sección siguiente) |
| Madurez de plataforma | Weak | Semver con CHANGELOG que dice qué ajuste se puede borrar, versión única y `release.mjs plan`; pero `git tag` no devuelve etiquetas y `distribucion-multiplataforma.md` lista como pendientes el Maven privado y el espejo de iOS |

---

## Preparación para agentes (AI-readiness, nota `ai-readiness.md`)

| Criterio de la nota | Lo encontrado | Estado |
|---|---|---|
| Orientación para elegir el componente | `components.md`: Para / No para / Selectores / Exporta; "No para" en 64 de 111 entradas | Parcial |
| Props con tipo, valor por defecto y obligatoriedad | `api.md` generado desde el código (2713 líneas) | Cumple (sin descripciones de intención por prop, salvo lo que traiga el JSDoc; no verificado) |
| Accesibilidad por componente | Reglas globales (`CLAUDE.md`, `checklist.md`); solo 2 menciones de teclado/aria/rol en `components.md` | Falta por componente |
| Manifiesto legible por máquina | No se encontró un JSON de componentes (`components.json` o `custom-elements.json`); `shared/manifest.json` solo describe temas, íconos y textos de nativo | Falta |
| Intención de los tokens | Sin `$description` (TA-04) | Falta |
| Relaciones y composición | Parcial: reglas de composición en `CLAUDE.md` (átomos sin dependencias, un dominio no importa de otro); sin grafo explícito | Parcial |
| Versión legible | `generatedFrom: @zonacards/ui 2.0.0` en `shared/manifest.json`; `llms.txt` sin versión visible | Parcial |
| Hechos al día | DC-01, DC-02 | Falla |
| Validación automática | `llms --check`, regeneración nativa con `git diff`, vectores de dominio (2043 casos), axe | Cumple, con las lagunas DC-04 y TA-02 |

Para tu caso de uso, lo decisivo es lo último: un agente confía en las guías y en las páginas plantilla. Hoy las guías afirman cosas falsas y la plantilla de listados va por detrás de las reglas.

---

## Patrones entre skills

**Patrón principal: deuda concentrada en la capa de marcas y modo oscuro** (token, componentes, tema y deriva apuntan al mismo origen).
- Evidencia: forma por marca introducida el 2026-11-20, después de los componentes (TH-04); `--sidebar-brand-bg` ligado a una variable que las marcas no tocan (TH-05); pares de color sin cumplir en claro y en Enjoy (TH-02, TH-03) que ninguna prueba mira porque el axe no corre por marca ni por tema oscuro (TH-01); las páginas plantilla con radios de la escala (DF-01); `$themes.json` oscuro incompleto (TA-03).
- Respuesta única: una matriz marca por modo en el e2e de accesibilidad como red de seguridad, y luego migrar las clases de forma. Si se arreglan los componentes sin la red, la deuda vuelve.

**Patrón 2: las guardas comprueban que se generó, no que sea cierto o completo** (preparación para agentes).
- Evidencia: `llms --check` pasa con la frase falsa de iOS (DC-01); los JSON de tokens no se comparan en CI (TA-02); el workflow web no corre con cambios solo de `.md` (DC-04); nada exige `components.md` completo (DC-03).
- Respuesta única: una revisión mínima de hechos (o una lista corta de afirmaciones a comprobar) en la CI, más `npm run tokens` con `git diff` y quitar `.md` de `paths-ignore` para las skills.

**Patrón 3: brecha de preparación para agentes** (lo bueno ya está; falta lo legible por máquina). Sin manifiesto JSON, sin `$description` en tokens y sin accesibilidad por componente. Respuesta: generar el manifiesto desde la misma fuente que `api.md`.

**Patrón 4: madurez de plataforma** (se evalúa porque hay CHANGELOG y se comprobó la ausencia de etiquetas): buena disciplina de versionado, pero no hay etiquetas ni publicación; relevante para la mudanza a la organización.

No se observan: cascada de dependencia (los componentes de mayor dependencia, `field` y `button`, usan `rounded-control` y `rounded-button`; la deriva está en componentes hoja), brecha de gobierno por deriva en el tiempo (no hay historial de deriva ni de adopción) ni brecha estructural (lo que se hace a mano ya existe en el sistema).

---

## Acciones ordenadas por impacto

Los esfuerzos son estimaciones mías, no mediciones; ajústalos con quien implemente.

**Inmediato (4 semanas)**

| # | Acción | Cierra | Esfuerzo estimado |
|---|---|---|---|
| 1 | Corregir las afirmaciones obsoletas (iOS "sin componentes" en principles e `ios.md`; "no se construyen pantallas" y "97 entradas" en `design-system-port.md`; versiones pendientes en `distribucion-multiplataforma.md`) y regenerar los `llms` con `npm run native` | DC-01, DC-02 | 2 h |
| 2 | Migrar Lotes y Aprobaciones a `<zc-card>`, `rounded-card` y los `text-caption/body/title-sm`; correr `npm run e2e` | DF-01, DF-02 | 0.5 a 1 día |
| 3 | Parametrizar `audit.spec.ts` por modo (`.dark`) y marca (`data-brand`) sobre un subconjunto de páginas del catálogo; vigilar el tiempo de CI | TH-01 | 0.5 a 1 día |
| 4 | Ajustar `--text-subtle` (claro) y `--field-bd` (Enjoy claro) hasta cumplir; añadir esos pares al `ContrastTest` | TH-02, TH-03 | 2 a 3 h |
| 5 | En `web.yml`: `npm run tokens` + `git diff --exit-code` sobre `tokens/`; no ignorar `.md` de las skills; agregar `projects/zonacards-tokens/**` a `native-android.yml` (iOS ya lo tiene) | TA-02, DC-04 | 2 a 3 h |
| 6 | Completar `components.md` con `action-bar`, `datetime-field` y `fieldset`; añadir demo en el catálogo a `captcha` y `mfa-setup` | DC-03, CA-02 | 0.5 día |

**Siguiente trimestre**

| # | Acción | Cierra | Esfuerzo estimado |
|---|---|---|---|
| 7 | Migrar la forma por marca: de `rounded-sm/md/lg` a `rounded-control/card/sheet` en componentes con aspecto de tarjeta o campo, con una regla de lint (búsqueda en CI) | TH-04 | 1 a 2 días |
| 8 | Generar un manifiesto JSON de componentes (categoría, propósito, "No para", props, teclado) desde la fuente de `api.md`, y `$description` en tokens | TA-04, patrón 3 | 2 a 4 días |
| 9 | Subir las rampas a primitivas y hacer que los estados sean alias; regenerar los 8 temas y nativo | TA-01 | 1 a 2 días |
| 10 | Unificar los esquemas de nombre de movimiento y sombra, o documentarlos como decisión (ver NA-01) | NA-01 | 0.5 día |
| 11 | Decidir si `--sidebar-brand-bg` y los colores de gráfico deben seguir la marca | TH-05 | 1 h + decisión |
| 12 | Cubrir con prueba unitaria los componentes de mayor dependencia (`icon`, `core`, `button`, `field`, `tooltip`, `panel`) | CA-01 | 2 a 3 días |

**Seis meses o más**

| # | Acción | Cierra | Esfuerzo estimado |
|---|---|---|---|
| 13 | Plantillas de página y hojas faltantes en iOS (según `plan-ios.md`) | CA-03 | [necesita dato: alcance y ritmo del equipo iOS] |
| 14 | Etiquetas de versión, publicación y primera adopción medible (hoy no hay datos para evaluar adopción) | madurez de plataforma | [necesita dato: destino de publicación] |

### Si se mueve el repo a Plaza Points

Lo siguiente sale de los archivos; las decisiones son tuyas o de legal.

| Punto | Dónde está | Qué decidir |
|---|---|---|
| Titularidad de la licencia MIT con copyright a una persona | `projects/zonacards-ui/LICENSE:3`; `package.json:6` (campo `author`) en ui y tokens; `zonacards-compose/build.gradle.kts:59` | Si el copyright y los autores pasan a la organización; el campo `author` trae un correo que se publicaría tal cual |
| `publishConfig.access: public` y MIT, con marcas de clientes (Giftealo, Enjoy, Motiva) en los tokens y el catálogo | `projects/zonacards-ui/package.json:8-10`; `tokens.css:164-170` | Si el paquete debe ser público y si esas marcas se pueden distribuir bajo MIT. [necesita dato: acuerdos con cada marca] |
| Remoto y secretos | `git remote` apunta a un repo personal; `native-android.yml:22,68` usa `FIREBASE_APP_ID` y `FIREBASE_SERVICE_ACCOUNT` | Recrear secretos en la organización; no se leyó ningún valor |
| Gobierno | un solo autor, sin CODEOWNERS ni plantilla de PR; responsable en `CLAUDE.md:3` | Definir propietarios, revisores y registro de decisiones antes de abrir el repo a más personas |
| Ámbito npm y repos de publicación | `@zonacards/*`; Maven privado y espejo iOS siguen pendientes (`distribucion-multiplataforma.md:50-51`) | [necesita dato: nombre del ámbito y dueño de las cuentas] |

---

## Detalle por skill disponible a pedido

- Token audit: 5 hallazgos con rutas y el conteo de alias frente a hex por conjunto.
- Naming audit: inventario de los tres esquemas de nombre y de las entradas agrupadoras.
- Component audit: lista de las 115 entradas, cuáles tienen spec y cuáles se usan en pantallas reales (31 fuera del catálogo).
- Drift detection: los 51 `text-[Npx]` por archivo y línea, y los 11 radios de escala en pantallas.
- Docs coverage: cruce de entradas contra `components.md`, `api.md`, catálogo e `index.html`.
- Theme audit: pares de contraste calculados y matriz de tokens claro frente a oscuro.
- System health: siete dimensiones con evidencia.

Siguiente paso sugerido: dos de los hallazgos (DC-01 y TH-01) justifican un resumen para decisores; el skill `stakeholder-brief` puede partir de este informe.

---

## Scope

**Inspeccionado**
- `CLAUDE.md`, `docs/*.md` (revisados: `reglas-implementacion`, `design-system-port`, `distribucion-multiplataforma`, `plan-ios`, `revision-heroui` en cabecera), `docs/design-system/index.html` (solo ids de sección).
- `projects/zonacards-tokens`: `styles/tokens.css`, `tokens/*.json`, estructura de `skills`, `conformance`, `schema`, `package.json`.
- `projects/zonacards-ui`: 115 entradas (estructura, selectores, specs, importes), `styles/zonacards.css`, `skills/zonacards-ui/references/{components,api}.md`, `llms*.txt`.
- `projects/zonacards-native`: `shared/manifest.json`, nombres de archivos Kotlin y Swift, `references/*.md`, `ContrastTest`.
- `src/app` (31 archivos `.ts` fuera de catálogo y mocks, más sus plantillas HTML), catálogo (ids y mapa), `e2e/` y `e2e-visual/`.
- `.github/workflows/*.yml`, `package.json` (scripts), `scripts/build-tokens.mjs` (cabecera) y `build-native.mjs` (línea 47), `git log` y `git tag`.
- Cálculos de contraste hechos por mí con la fórmula WCAG sobre los hex del CSS.

**No inspeccionado**
- Figma: omitido, no está configurado (por instrucción). No es un hallazgo.
- Red: no se usó `npx`, `npm view` ni descargas; no se ejecutó `build.sh`, `verify-install.sh` ni script alguno del plugin, ni los scripts del repo (`npm run tokens`, `native`, `build`, tests, e2e). Todo es lectura del código; lo que depende de ejecutar algo está marcado como inferido.
- Contenido de los componentes más allá de las búsquedas (no se leyeron los 115). No se verificaron los contrastes de todos los pares ni las capturas visuales.
- Orphans de tokens: no se hizo el paso de huérfanos (los tokens se consumen por Tailwind `@theme`, CSS directo y generación nativa; no validé patrones de búsqueda por formato, así que no afirmo cuáles están sin uso).
- Duplicación entre componentes: no se hizo un análisis completo.
- Código de apps consumidoras fuera de este repo, uso real en producción y datos de adopción, issues, tiempos de respuesta o decisiones no escritas.
- Código nativo en profundidad: solo nombres de archivo, referencias de API y un test de contraste; no se compilaron ni abrieron las capturas.
- `docs/spec-ux-ui.md` y `docs/otros-stacks.md` no se leyeron completos.

**Cómo se comprobó una ausencia**
- Importes por el barril, rutas relativas a `projects/`, `@ng-icons`, `<select>`: el patrón de importes sí encuentra los 107 puntos de entrada en `src`; los demás patrones no tuvieron control positivo y quedan sin confirmar.
- Ramas "marca" y ".dark" en `e2e/`: la búsqueda encuentra `dark` en `e2e-visual/visual.spec.ts` y `data-brand` en `theme.service.ts`, así que sí detecta esas cadenas donde existen.
- Entradas ausentes de `components.md`: el mismo método encontró 112 de 115 (más `helm`, interno, excluido).
- `captcha` y `mfa-setup` sin demo: el método sí encuentra `sparkline` y `geo-map` en el catálogo.
- No se encontró `$description` ni manifiesto JSON: búsqueda de la cadena y de `manifest*.json` / `custom-elements*` bajo `projects/`.
- Ramas y etiquetas: `git tag` no devolvió nada; el repo no tiene etiquetas visibles localmente (podrían existir en el remoto, no consultado).

**Supuestos**
- Las "8 marcas" del encargo se interpretaron como 4 marcas por 2 modos. Si existen otras marcas fuera de este repo, no se vieron.
- Los conteos de `rounded-*` y `text-[Npx]` son de búsqueda de texto: incluyen usos legítimos (círculos, avatares) que no separé uno a uno.
- Los esfuerzos de la lista de acciones son estimaciones.
- La interpretación de "el catálogo está por delante de `index.html`" (DC-05) es una hipótesis.

**Nota de cierre:** si alguno de estos puntos es una decisión deliberada (por ejemplo, la escala de radios en bloques que no deben seguir la marca, el mismo azul marino del sidebar en todas las marcas, tipos de tamaño en el conjunto de primitivas), dímelo y lo marco como aceptado para las próximas corridas.

*Generado por el agente full-system-diagnostic de Design System Ops · 2026-11-28 · método de evaluación: inspección directa del código y de la documentación, con cálculos propios de contraste; las partes marcadas como inferidas no se ejecutaron*

## Seguimiento

- **28 nov 2026 · DC-01 y DC-02 corregidos:** iOS ya no figura "sin componentes" (guía común e `ios.md`), `design-system-port.md` dice que el port terminó (y 115 entradas), `distribucion-multiplataforma.md` ya no lista 1.3.0 a 1.7.0 como pendientes y `plan-ios.md` indica que se cumplió. Los `llms.txt` se regeneraron.
