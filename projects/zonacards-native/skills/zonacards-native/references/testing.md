# Pruebas y capturas del catálogo Android

Todo corre en la JVM con Robolectric (gráficos nativos), sin emulador. Los comandos van desde `projects/zonacards-native/android`:

```bash
# Grabar capturas nuevas (solo si el cambio visual es intencional) y correr todo
powershell -ExecutionPolicy Bypass -File .\build-local.ps1 assembleDebug testDebugUnitTest -Psnapshots=record
# Verificar contra las capturas guardadas (lo normal antes de cerrar una tarea)
powershell -ExecutionPolicy Bypass -File .\build-local.ps1 testDebugUnitTest
```

Se espera `BUILD SUCCESSFUL` y la línea `EXIT 0` en `build-local.log`.

## Qué hay

| Dónde | Qué prueba |
| --- | --- |
| `zonacards-compose/src/test/kotlin/.../*Test.kt` | Comportamiento de cada grupo de componentes (clics, texto, estados, callbacks). Una clase por grupo: `AtomsTest`, `AccountTest`, `CommerceTest`, `DateRangeTest`, `UbigeoTest`, `LocationTest`, `InfoSheetsTest`, `DeleteAccountTest`… |
| `catalog/src/test/.../CatalogSnapshotTest` | Una captura por sección del catálogo, en claro y oscuro, comparada píxel a píxel (falla con más de 1 % de diferencia). Las referencias están en `catalog/src/test/snapshots`. |
| `CatalogAccessibilityTest` (en `CatalogSnapshotTest.kt`) | Recorre cada sección y falla ante un control de menos de 44 dp (mide `n.size`, no `boundsInRoot`) o sin nombre. |
| `ContrastTest` (en `CatalogSnapshotTest.kt`) | Contraste mínimo de pares de colores del tema en las ocho combinaciones de marca y modo. |
| `ShapeTokensTest` (en `zonacards-compose`) | Que las marcas por defecto conservan la forma original y que `enjoy` la sobrescribe. |

## Agregar una pieza nueva (receta)

1. Componente en `zonacards-compose/src/main/kotlin/com/zonacards/ui/compose/` (público, con KDoc de una o dos frases: alimenta la referencia generada).
2. Textos nuevos: en la web (`i18n/es.json` y `en.json`) y `npm run native`.
3. Demo en una pantalla de `catalog/`: sección en la que corresponda (o una nueva: `CatalogSection` en `MainActivity.kt`, rama del `when`, ícono en `Screens.kt` y filas `claro`/`oscuro` en `CatalogSnapshotTest`).
4. Prueba de comportamiento con `@Config(qualifiers = "es-w320dp-h1600dp")`.
5. `-Psnapshots=record`, abrir las imágenes nuevas y mirarlas (recorta con `System.Drawing` si son largas), luego correr la verificación sin `record`.
6. Una línea en `projects/zonacards-native/README.md` y, si la web tiene el equivalente, en el plan.
7. `node scripts/build-native-docs.mjs` para refrescar [compose-api.md](compose-api.md) (también corre dentro de `npm run native`).

## Reglas de las pruebas

- Lo que depende de la red se inyecta (`fetchTile`, `document`, `verify`, `login`): las pruebas pasan una función falsa. Nunca llames a internet.
- Pruebas deterministas: `today` fijo en las demos (`"2026-11-20"`), animaciones detenidas en las capturas.
- Al reportar, separa "escrito", "compilado" y "probado". Si no pudiste compilar, dilo.
