# Zonacards 2.0 — Especificación UX/UI y guía de maquetación Angular

Oct 9, 2026 · @Kevin

## Propósito y uso del documento

Este documento es la especificación única para diseñar (UX/UI) y maquetar en Angular el administrador web de Zonacards 2.0. Une tres fuentes: lo que exige el RFP v2.1, lo que precisó la Absolución de Consultas N.° 1 y lo que hace hoy la plataforma actual, recorrida el 09/10/2026.

Cómo usarlo:

1. **Diseño (Figma):** las secciones 5 a 11 son el insumo para wireframes, design system y alta fidelidad. Cada pantalla de la sección 8 indica campos, filtros, acciones y estados.
2. **Maquetación (Claude Code):** exporta el documento a Markdown y guárdalo en el repositorio como `docs/spec-ux-ui.md`. Claude Code lo leerá como contexto; la sección 13 trae el orden de trabajo y los prompts.
3. **Validación con áreas usuarias:** la sección 14 lista lo que aún debe confirmar Promotick antes de cerrar el diseño.

Alcance: solo el frontend del administrador (incluido el rol Comercio) y el visor de entregas corporativas. No incluye portal de beneficiario ni de cliente corporativo (absolución C-073).

## Fuentes y supuestos

| Fuente | Versión / fecha | Uso en este documento |
| --- | --- | --- |
| RFP Zonacards 2.0 — Edición 2026 | v2.1, septiembre 2026 | Requisitos funcionales, reportes, sección UX/UI e inventario de \~80 vistas |
| Absolución Consolidada de Consultas N.° 1 | 28/09/2026, 119 consultas | Precisiones que amplían o recortan el alcance (citadas como C-xxx) |
| Plataforma actual (adminzonacards.promotick.dev) | Recorrido del 09/10/2026, usuario con rol administrador | Inventario as-is de 57 rutas, campos, filtros, columnas y estilo visual |

Supuestos de trabajo:

- Ante contradicción, prevalece la absolución sobre el RFP, y el RFP sobre la plataforma actual.
- La plataforma actual es referencia de flujos y datos, no de diseño: se reemplaza por completo en un corte único (C-005).
- El recorrido fue de solo lectura. Algunas pantallas cargan datos por AJAX, así que ciertos detalles (modales de edición, mensajes de error) no se observaron.
- No se incluyen datos reales (códigos, clientes, montos) en este documento.

## Diagnóstico de la plataforma actual (as-is)

La plataforma actual tiene 57 rutas en 10 menús, construidas con tecnología de 2015 y sin patrones de UI comunes; 4 rutas del menú están rotas. Es útil como inventario de datos y flujos, no como base visual.

### Stack y estilo observados

| Aspecto | Valor actual |
| --- | --- |
| Frontend | Páginas Java servidas por Tomcat 9 (Spring Security), jQuery 1.11.3, Bootstrap 3.3.6, DataTables 1.10.15, Select2, SweetAlert2 |
| Tipografía | Open Sans |
| Color | Barra superior azul (#1C93D1), menú lateral azul marino, fondo gris claro, botones primarios oscuros |
| Layout | Menú lateral fijo con submenús desplegables, título fijo "Administrador Zonacards" en todas las pantallas y migas de pan |
| Idioma | Solo español; hay textos con codificación rota ("Correo electrï¿½nico") |

### Inventario de menús y rutas

| Menú | Rutas actuales |
| --- | --- |
| Usuarios | Usuarios (lista + carga XLSX), Roles |
| Empresa | Empresas, Programas, Programa Categoría, Programa Token |
| Marcas | Carga masiva, Categorías, Carga masiva categorías, Marcas, Franquicias, Terminales, Locales, Usuarios de marca (ValidCode), Plantillas, Comercios |
| Giftcards | Carga masiva, Lista de giftcards, Envío masivo (correo), Envío masivo WSP, Validar giftcard (404), Consulta giftcard |
| Lotes | Carga masiva, Registro de lote, Listar lotes, Activación masiva, Desactivar lote, Subir adjuntos |
| Promociones | Ver promociones (404) |
| Reportes | 17 reportes: Todos los giftcards, Lotes, Compras web, Activaciones, Consumos, Anulados, Vencidos, Transacciones, Transacciones V2, Consumo (Cont), Documentos TXT, Liquidaciones y pagos, Cobranza, Consumos preliquidación, Contabilidad, Pedido envíos, Lote envíos |
| Liquidaciones | Generar liquidación, Reporte de liquidación, Pago |
| Giftcards internacionales | Marcas, Nuevo pedido, Reporte compras, Reporte saldo (error 500), Reporte liquidación (404) |
| Stock | Stock (reposición), Stock simple (valorizado) |

### Hallazgos de UX

- **Sin dashboard real.** El enlace "Dashboard" abre el perfil del usuario (cambio de contraseña).
- **Rutas rotas o vacías:** Validar giftcard y Promociones (404), Reporte saldo internacional (500), Reporte liquidación internacional (404).
- **Reportes duplicados y ambiguos:** Transacciones y Transacciones V2 tienen las mismas columnas; hay tres reportes de consumo con nombres poco claros.
- **Tablas inmanejables:** Lista de giftcards tiene 31 columnas (con "Precio programa" repetido); Reporte de lotes tiene 31; Compras web 29. No hay selección de columnas visibles.
- **Dato sensible expuesto:** los reportes Compras web, Anulados y Vencidos incluyen la columna "Cod seguridad". El RFP prohíbe mostrar o exportar el CVV.
- **Filtros inconsistentes:** cada pantalla resuelve búsqueda, rango de fechas y orden de forma distinta (botón Buscar separado, lupa por filtro, radios para estados).
- **Formularios largos sin agrupación:** crear giftcard tiene 28 campos en una sola columna; crear franquicia, 23.
- **Login propio con usuario y contraseña,** sin SSO ni 2FA.
- **Campañas sin maestro:** se crean dentro de un modal del envío masivo. Tampoco existen maestros de Clientes ni Almacenes como tales (hoy son Empresa y Programa).

## Análisis de brechas

Seis piezas del inventario del RFP no existen hoy (dashboard, maestros de Campañas y Almacenes, auditoría, visor corporativo y acceso de comercios). Casi todo lo demás existe pero cambia de forma sustancial, y hay pantallas exigidas por la sección de seguridad que no figuran en el inventario de \~80 vistas.

### Módulo por módulo

| Módulo RFP | Vistas RFP | Plataforma actual | Brecha y decisión de diseño |
| --- | --- | --- | --- |
| Login, 2FA y recuperación | 3 | Login propio usuario/contraseña | Nuevo. Login federado con Keycloak (SSO con Entra ID), 2FA por correo o app autenticadora, códigos de recuperación (C-029). Las pantallas de credenciales las sirve Keycloak: el diseño se aplica como tema de Keycloak. |
| Dashboard | 1 | No existe | Nuevo. Por rol y configurable por usuario con widgets de un catálogo de métricas. |
| Usuarios y roles | 3 + roles | Lista, alta con contraseña, roles con "datos sensibles" | Sin contraseña local: los usuarios vienen del AD. Se agregan grupo AD, dispositivos 2FA e historial de cambios de rol. |
| Clientes | 3 | "Empresas" (solo nombre) | Ampliar: identificador tributario por país, 2 contactos, 2 teléfonos, carga XLSX, validación de duplicados. |
| Programas | 3 | Programas (país, moneda, comisión, descuento, flete, remitente de correo) | Mantener campos de remitente y país; agregar Comisión Cliente (CC%) y carga XLSX. |
| Campañas | 3 | Modal dentro del envío masivo | Nuevo maestro: almacén, vigencia, imagen, API Key/Security Key, comisión. Alerta antes del vencimiento; no se extienden. |
| Giftcards | 3 | Formulario de 28 campos | Reagrupar en pasos (datos, comercial, restricciones, entrega). Agregar Margen, Markup, Afecto a impuesto, QR. |
| Franquicias | 3 | 23 campos, 1 cuenta | Segunda cuenta con moneda, tipos de cuenta según banco, validación de cuenta y CCI por banco. |
| Locales | 3 | Existe con ubigeo y geolocalización | Ubigeo parametrizable por país; validación de duplicados por nombre, dirección y coordenadas. |
| Marcas | 3 | Existe | Agregar Emisión (propia/terceros), CM%, Tipo de compra (compra/consignación), código autogenerado. |
| Almacenes | 3 | No existe | Nuevo, con código homologado de NetSuite. |
| Auditoría y transacciones | 2 | No existe consulta de auditoría | Nuevo. Solo lectura; la propia consulta queda auditada. |
| Gestión de lotes | 4 | Registro, carga, lista, desactivar, subir adjuntos (5 rutas) | Unificar en un asistente: propios (16 dígitos Luhn) o terceros en 1 o 2 pasos. Al terminar, elegir destino: pedidos API, envío masivo o activación masiva. Anulación total o parcial con motivo. |
| Envíos masivos | 3 | Dos pantallas separadas (correo y WhatsApp) | Una sola pantalla con selector de canal. Validación previa del archivo y doble aprobación antes de ejecutar. |
| Activación masiva | 2 | Existe | Agregar flete y cobro de tarjeta física; exportación sin CVV y código enmascarado. |
| Gestión de stocks | 2 | Stock y Stock simple | Solo terceros. Umbrales mín./máx./punto de pedido con vigencia por periodo o campaña; traslado entre giftcards equivalentes. |
| Terminales POS y ValidCode | 3 | Terminales, Comercios, Usuarios de marca | Se elimina la pantalla de terminales POS y códigos de comercio (C-076). Se mantiene solo la vinculación de usuarios ValidCode a locales. |
| Plantillas | 2 | Lista con previsualizar | Agregar carga de plantillas ad hoc con aprobación previa y la sección de wallets. |
| ATC | 4 | "Consulta giftcard" con reenvío, anulación, historial | Ampliar: búsqueda de pedidos, consumo manual con local, reverso total o parcial (con doble aprobación), extensión de vigencia. |
| Liquidaciones, cobranza y pagos | 6 | Generar, reporte con aprobación, pagos | Mantener el ciclo. Agregar detalle del documento de cobranza, carga del documento firmado (firma manual, C-095) y formatos de pago por país y banco. |
| Reportes | 11 | 17 reportes, varios duplicados | Consolidar en los 11 reportes cerrados del RFP (C-083) con un único patrón. |
| Visor de entregas corporativas | 2 | No existe en el admin | Nuevo, adaptando el código del visor existente (C-077). |
| Acceso de comercios | 2 | No existe | Nuevo: rol Comercio con reporte de consumos consolidado de sus locales. |
| Transversales | 6 | — | Navegación, permisos, notificaciones, errores, estados vacío y carga. |

### Funciones actuales sin lugar en el RFP

Estas rutas existen hoy y no aparecen en el RFP. Ninguna se elimina sin destino: se fusionan con el módulo que ya cubre su propósito.

| Función actual | Decisión | Destino en Zonacards 2.0 |
| --- | --- | --- |
| Giftcards internacionales (marcas, pedidos, compras, saldo) | Fusionar | Son giftcards de terceros de otro país y moneda: se cargan como lotes de terceros con país y moneda, y se ven en los reportes de Ventas y Stock filtrando por país |
| Programa Token (token, envía email, plantillas por tipo) | Fusionar | Pestaña "Credenciales y entrega" de la ficha de Campaña: API Key, Security Key y plantillas por tipo de giftcard |
| Categorías de marca y Programa Categoría | Migrar | Catálogo de Categorías dentro de Maestros; se asigna a marcas y giftcards y sirve como filtro en reportes y dashboard |
| Reporte Compras web | Fusionar | Reporte de Ventas, filtrando por canal |
| Reporte Activaciones (canjes) | Fusionar | Reporte de Ventas, filtrando por estado Activado |
| Reportes Pedido envíos y Lote envíos | Fusionar | Pantalla Seguimiento de envíos (sección 8.4) |
| Reportes Anulados y Vencidos | Fusionar | Reporte de Ventas, filtrando por estado Anulado o Expirado |
| Terminales POS y Comercios (código de comercio) | Eliminar | Sin APIs para POS (C-076). Solo queda Usuarios ValidCode |

### Pantallas que exige el RFP fuera del inventario de \~80 vistas

| Pantalla | Origen | Vistas estimadas |
| --- | --- | --- |
| Bandeja de aprobaciones Maker-Checker | Seguridad: emisiones masivas, reversos, cambios de saldo, vigencias, desbloqueos (C-019, C-107) | 2 (bandeja + detalle) |
| Configuración de doble aprobación por tipo de operación | C-107 | 1 |
| Motor de reglas antifraude: reglas, listas negras, decisiones retenidas | Seguridad (C-106) | 4 |
| Extensión de vigencia individual o por lote | C-086 | 1 (modal) |
| Configuración de recordatorios de vencimiento en cascada | Proceso de saldos | 1 |
| Consulta de saldo web para beneficiario | C-073 | 1 (pública, responsive) |
| Parámetros por país (impuestos, moneda, bancos, formatos de pago) | Alcance multipaís | 2 |

## Usuarios, roles y permisos

El diseño parte de siete perfiles, derivados de las áreas que nombra el RFP para el research (Comercial, Operaciones, Finanzas/Contabilidad, ATC y Administración) más el Supervisor de Finanzas y el rol Comercio. Estos perfiles son plantillas iniciales: los roles son personalizables, de modo que el administrador puede duplicar una plantilla, ajustar permisos por módulo y acción, y crear roles nuevos sin desarrollo. Keycloak asigna el rol a cada usuario según su grupo del AD.

| Perfil | Tarea principal | Widgets de dashboard sugeridos |
| --- | --- | --- |
| Administrador | Usuarios, roles, parámetros por país, reglas antifraude | Alertas activas, cambios de configuración, integraciones con falla |
| Comercial | Clientes, programas, campañas, ventas | Ventas por cliente, comparativo de campañas del último mes, campañas por vencer |
| Operaciones | Giftcards, lotes, envíos, activaciones, stock | Stock bajo mínimo, puntos de pedido alcanzados, envíos en curso o con error |
| Finanzas / Contabilidad | Liquidaciones, cobranza, pagos, breakage | Liquidaciones por estado, pasivo vigente, breakage del mes |
| Supervisor de Finanzas | Aprobar liquidaciones y documentos TXT | Pendientes de aprobación, pagos por cerrar |
| ATC | Consultas, reenvíos, consumos manuales, reversos | Búsqueda rápida de giftcard o pedido, solicitudes en aprobación |
| Comercio (externo) | Reporte de consumos de sus marcas y locales | Consumos del mes por local |

### Matriz de acceso por módulo

V = ver, E = crear o editar, A = aprobar (checker), — = sin acceso. Es la propuesta inicial para validar en el research.

| Módulo | Admin | Comercial | Operaciones | Finanzas | Sup. Finanzas | ATC | Comercio |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard | V | V | V | V | V | V | V |
| Usuarios, roles, parámetros | E | — | — | — | — | — | — |
| Clientes, programas, campañas | V | E | V | V | V | V | — |
| Giftcards, marcas, franquicias, locales, almacenes | E | V | E | V | V | V | — |
| Lotes, envíos, activación masiva | V | V | E | V | — | V | — |
| Stock | V | V | E | V | — | — | — |
| ATC (consumo manual, reverso, extensión) | V | — | V | — | — | E | — |
| Aprobaciones Maker-Checker | A | A | A | A | A | — | — |
| Liquidaciones y cobranza | V | — | — | E | A | — | — |
| Pagos y documento TXT | V | — | — | E | A | — | — |
| Reportes | V | V | V | V | V | V | Solo consumos propios |
| Auditoría | V | — | — | — | — | — | — |
| Reglas antifraude | E (con aprobación) | — | — | — | — | — | — |

Reglas que debe respetar la UI:

- **Segregación de funciones:** quien crea una operación sujeta a doble aprobación nunca ve el botón Aprobar sobre su propia solicitud.
- **Ocultar, no deshabilitar:** un módulo sin permiso no aparece en el menú; una acción sin permiso no se muestra.
- **Comercio:** solo ve datos de sus propias marcas y locales, siempre con el código enmascarado.

Qué define cada rol personalizado:

| Configuración | Detalle |
| --- | --- |
| Permisos | Por módulo (interruptor) y por acción: ver, crear, editar, exportar, anular, aprobar. Contador de permisos activos por módulo, como en Enjoy |
| Alcance de datos | Países, clientes o marcas visibles (por ejemplo, Finanzas Chile solo ve operaciones de Chile) |
| Datos sensibles | Si puede exportar información sensible y si la exportación requiere aprobación |
| Aprobaciones | Qué operaciones de doble aprobación puede aprobar como checker |
| Dashboard por defecto | Widgets y orden que verá cada usuario del rol al entrar |

Los cambios de rol quedan auditados y versionados, y un rol en uso no se puede eliminar, solo desactivar.

## Arquitectura de información y navegación

El menú pasa de 10 grupos organizados por entidad técnica a 8 grupos organizados por tarea, en el orden en que se usan cada día. Los 17 reportes actuales se reducen a 11, y las aprobaciones tienen acceso directo desde la barra superior.

&#91;embedded content: mapa de navegación · 8 grupos de menú + accesos externos\]

La ficha del registro (patrón P3) es el centro de la navegación: desde un lote se llega a sus envíos, desde una giftcard a sus transacciones y desde una liquidación a su documento de cobranza, sin volver al menú. Las rutas de Angular de cada grupo están en la sección 12. Siguiendo a Wallet Motiva, los grupos van rotulados y siempre visibles (sin desplegables) y la barra superior incluye búsqueda global con Ctrl+K.

## Reglas transversales y patrones de interacción

Casi todas las pantallas se arman con cuatro patrones. Si se diseñan y maquetan bien una vez, cubren alrededor del 70% de las vistas.

### Los cuatro patrones

| Patrón | Dónde se usa | Estructura |
| --- | --- | --- |
| P1 Listado | 9 maestros, lotes, pagos, plantillas, terminales | Encabezado con título y acciones (Nuevo, Carga masiva, Exportar) · barra de filtros · tarjetas por defecto (tabla como alternativa solo en desktop) · menú ⋮ por tarjeta |
| P2 Formulario | Alta y edición de maestros | Página o panel lateral según tamaño. Secciones con título; 2 columnas en desktop, 1 en tablet y móvil; botones fijos al pie (Cancelar, Guardar) |
| P3 Detalle | Ficha de cualquier registro | Cabecera con datos clave y estado · pestañas (Datos, Relacionados, Historial de cambios) · acciones contextuales |
| P4 Reporte | 11 reportes | Filtros arriba (colapsables) · botón Aplicar · tarjetas de resumen por defecto, con vista de tabla y selector de columnas en desktop · exportar XLSX con los filtros aplicados |

Complementos: **asistente por pasos** (lotes, envíos masivos, carga masiva XLSX, nuevo giftcard) y **bandeja** (aprobaciones, alertas).

### Reglas de datos sensibles

- El número de giftcard se muestra siempre enmascarado (`•••• 1234`) en pantallas, reportes, exportaciones y logs.
- El CVV nunca se muestra ni se exporta. La columna "Cod seguridad" de hoy desaparece.
- Los enlaces a vales (Link PDF) son firmados y caducan; la UI muestra el ícono de enlace y la fecha de caducidad, no la URL.
- Las exportaciones sensibles llevan marca de agua, quedan registradas y pueden requerir aprobación.

### Filtros y tablas

- Un único componente de filtros para todo el sistema: rango de fechas, selects de selección múltiple para estados, buscador predictivo para entidades (cliente, programa, campaña, marca, giftcard).
- Los filtros aplicados se muestran como chips removibles y se conservan en la URL, para compartir o volver atrás sin perderlos.
- Paginación de 25, 50 o 100 registros; orden por columna; columnas fijas a la izquierda (ID y nombre) y a la derecha (acciones).
- Montos alineados a la derecha, con moneda del país y separadores según idioma.

### Cargas masivas XLSX

Asistente de 4 pasos: descargar plantilla → subir archivo → previsualizar con errores por fila → confirmar. Los errores se muestran en la tabla de previsualización y se pueden descargar. Se rechazan archivos con macros o de tipo no permitido (validación en servidor; la UI muestra el motivo).

### Estados de cada vista

Toda vista se diseña con cinco estados: con datos, cargando (skeleton), vacío (con acción sugerida), sin resultados para el filtro (con "Limpiar filtros") y error (mensaje + reintentar + ID de correlación para soporte).

### Acciones de alto riesgo

Emisiones masivas, reversos, cambios de saldo, cambios de vigencia, desbloqueos y anulaciones siguen el mismo flujo: formulario con motivo obligatorio → resumen de confirmación → la operación queda "Pendiente de aprobación" → un segundo usuario aprueba o rechaza desde la bandeja. La UI siempre indica quién solicitó y quién debe aprobar.

### Multipaís, multimoneda y multiidioma

País, moneda e idioma son tres ejes independientes: un usuario en Lima puede operar Chile, ver montos en pesos chilenos y usar la interfaz en inglés. Nada de esto se escribe en el código: todo viene de la configuración de país (pantalla Parámetros por país) y de los archivos de traducción.

| País | Moneda (ISO) | Decimales | Identificador tributario | Impuesto (referencial) | Locale | Zona horaria |
| --- | --- | --- | --- | --- | --- | --- |
| Perú | PEN (S/) | 2 | RUC (11 dígitos) | IGV 18% | es-PE | America/Lima |
| Ecuador | USD ($) | 2 | RUC (13 dígitos) | IVA 15% | es-EC | America/Guayaquil |
| Bolivia | BOB (Bs) | 2 | NIT | IVA 13% | es-BO | America/La\_Paz |
| Colombia | COP ($) | 0 en pantalla | NIT con dígito verificador | IVA 19% | es-CO | America/Bogota |
| Chile | CLP ($) | 0 | RUT con dígito verificador | IVA 19% | es-CL | America/Santiago |
| México | MXN ($) | 2 | RFC | IVA 16% | es-MX | America/Mexico\_City |

Las tasas son referenciales y se parametrizan; Finanzas de cada país confirma valores y formatos bancarios en la fase de diseño (C-032, C-096).

Reglas de interfaz:

- **Selector de país** en la barra superior, limitado a los países del alcance del rol. Filtra datos y define moneda, impuesto, identificador tributario, niveles geográficos (departamento/provincia/distrito en Perú, región/comuna en Chile, estado/municipio en México) y formato bancario.
- **Moneda siempre explícita:** cada monto muestra su símbolo o código; cuando una vista mezcla países (dashboard consolidado), se agrupa por moneda y nunca se suman monedas distintas, porque no hay conversión de tipo de cambio (C-003).
- **Formato con `Intl.NumberFormat` y `Intl.DateTimeFormat`** según el locale del país; fechas guardadas en UTC y mostradas en la zona horaria del país de la operación.
- **Validaciones por país** como funciones (`ValidatorFn`): RUC, NIT, RUT y RFC con su longitud y dígito verificador; teléfono con selector de prefijo, como en Motiva.
- **Idioma:** español e inglés en la fase 1 (C-081), con Transloco y claves por módulo (`lotes.nuevo.titulo`). Agregar un idioma es agregar un archivo JSON. Los textos de correos, PDF y pases de wallet usan el idioma del destinatario.
- **Textos que crecen:** los componentes toleran textos 30% más largos (el inglés y el español difieren en longitud) sin cortar etiquetas.
- Sesión que expira a los 15 minutos de inactividad, con aviso un minuto antes.

### Responsive

Desktop es la plataforma principal (1280–1920 px). Tablet (768–1279 px) con menú colapsado. Smartphone (≤767 px) para consulta (C-074): tablas como tarjetas apiladas y acciones masivas ocultas.

## Especificación de pantallas por módulo

Cada pantalla indica patrón (P1–P4 de la sección 7), contenido y reglas propias. Lo que dicen las reglas transversales no se repite aquí.

### 8.1 Acceso

| Vista | Contenido | Reglas |
| --- | --- | --- |
| Inicio de sesión | Botón "Ingresar con cuenta corporativa" (Keycloak) | Tema de Keycloak con la marca Giftealo; selector de idioma |
| Configurar 2FA | QR para app autenticadora o envío por correo; códigos de recuperación de un solo uso | Obligatorio en el primer ingreso administrativo |
| Recuperar acceso | Ingreso de código de recuperación; contacto con soporte | Mensajes que no revelan si la cuenta existe |

### 8.2 Dashboard

Cuadrícula de widgets. El administrador fija el dashboard por defecto de cada rol; cada usuario puede agregar, quitar y reordenar widgets desde "Personalizar" y volver al del rol con "Restablecer". Rango de fechas global y selector de país.

Catálogo de widgets (base del RFP): giftcards emitidas y valor emitido; redimidas y valor redimido (ambos segmentados en propia vs. terceros, con % de redención); comparativo de ventas por cliente; comparativo de campañas del último mes; comercios con más transacciones; distribución de marcas propias vs. terceros; alertas activas. Cada tarjeta enlaza al reporte filtrado que la origina.

### 8.3 Maestros (P1 + P2 + P3)

| Maestro | Filtros del listado | Secciones del formulario | Validaciones clave |
| --- | --- | --- | --- |
| Usuarios | Rol, estado, buscador | Datos del AD (solo lectura) · Rol en Zonacards · Estado | Sin contraseña local; ficha con dispositivos 2FA e intentos de acceso |
| Roles | Buscador | Nombre y plantilla de origen · matriz de permisos · alcance por país, cliente o marca · datos sensibles · operaciones que aprueba · dashboard por defecto | Cambios auditados y alertados |
| Clientes | Estado, buscador predictivo | Empresa (país, identificador tributario, razón social) · Contacto 1 · Contacto 2 | Identificador y razón social únicos; formato del identificador según país |
| Programas | Cliente, estado, vigencia | Datos (cliente, nombre, tipo, país, moneda) · Comercial (CC%, descuento, flete) · Correo emisor (nombre, correo, asunto, copias ocultas) | CC% entre 0 y 100 |
| Campañas | Cliente, programa, vigencia | Datos (programa, nombre, imagen, fechas) · Almacén · Comisión · Credenciales API (generadas, copiar) | Fecha fin > inicio; sin opción de extender; aviso X días antes del fin |
| Giftcards | Programa, marca, almacén, cliente, estado, tipo | Asistente de 4 pasos: Producto (marca, tipo nominal/experiencia, etiqueta, descripción, imagen) · Comercial (face value, monto, precio programa, comisión, descuento, margen calculado, markup) · Uso (multimarca, marcas, locales, ocasiones de consumo, liquidable, afecto a impuesto) · Entrega (tipo, plantilla, código de barras, QR, NetSuite) | Margen se calcula y no se edita; descuento toma CM% de la marca por defecto |
| Franquicias | Buscador por razón social o identificador | Empresa · Cuenta 1 (banco, tipo según banco, número, CCI, moneda) · Cuenta 2 opcional · Contacto · Pago (modalidad, tipo documento, validación IDC) · Marcas asociadas | Número de cuenta y CCI validados por banco al salir del campo |
| Locales | Marca, franquicia, estado, ubicación | Datos · Ubicación (niveles geográficos según país, dirección, referencia) · Mapa con pin para latitud y longitud | Aviso de posible duplicado antes de guardar |
| Marcas | Emisión, tipo de compra, estado | Datos (nombre, código autogenerado, logo, descripción) · Comercial (emisión, CM%, tipo de compra) · Contacto | Nombre único |
| Almacenes | Estado, buscador | Nombre · código de almacén NetSuite | Solo formulario, sin carga masiva |

### 8.4 Lotes, envíos y activación

| Vista | Contenido | Reglas |
| --- | --- | --- |
| Listado de lotes (P1) | Filtros: fecha, programa, marca, tipo, estado. Columnas: ID, campaña, giftcard, monto, cantidad, stock disponible, vencimiento, estado | Acción por fila: ver, anular, ir a envío o activación |
| Nuevo lote (asistente) | 1. Origen: propios o terceros · 2a. Propios: giftcard, cantidad, campaña, descripción (OC), vencimiento (fecha o días) · 2b. Terceros: plantilla XLSX y, si aplica, ZIP de vales · 3. Entrega: PDF, tipo de código de barras, QR, plantilla · 4. Resumen y crear | Al terminar pregunta el destino: dejar para pedidos API, envío masivo o activación masiva |
| Detalle de lote (P3) | Cabecera con estado y cantidades; pestañas Códigos (enmascarados), Envíos, Historial | Anulación total o por selección, con motivo; opción de reemitir |
| Anular lote (modal) | Alcance, motivo obligatorio, resumen | Pasa por doble aprobación |
| Envío masivo (asistente) | 1. Giftcard (preseleccionada si viene del lote) · 2. Canal: correo, WhatsApp o ZIP · 3. Plantilla · 4. Contactos XLSX con validación por fila · 5. Resumen | Contactos ≤ stock disponible; teléfono validado para WhatsApp; queda pendiente de aprobación |
| Seguimiento de envíos | Por envío: total, enviados, entregados, abiertos, activados, con error | Reenviar fallidos; descargar detalle |
| Activación masiva | Giftcard, cantidad, campaña, contacto del pedido; flete y cobro de tarjeta física si es física | Exporta XLSX sin CVV y con código enmascarado |

### 8.5 Stock (solo terceros)

| Vista | Contenido |
| --- | --- |
| Stock actual | Por almacén, giftcard y denominación: stock, mínimo, máximo, punto de pedido y estado (Normal / Bajo mínimo / Sobre máximo) con color. Acción "Trasladar" |
| Umbrales | Por giftcard: mínimo, máximo y punto de pedido, con vigencia por periodo o por campaña |
| Trasladar stock (modal) | Origen y destino de la misma marca y denominación, cantidad, motivo |

### 8.6 Terminales y plantillas

- **Usuarios ValidCode:** listado y formulario que vincula un usuario ValidCode a un local. La pantalla de terminales POS se elimina (C-076).
- **Plantillas:** listado con buscador y previsualización con datos de prueba en escritorio y móvil. Carga de plantilla ad hoc → previsualizar → enviar a aprobación → activar.

### 8.7 Atención al cliente (ATC)

Una sola pantalla de trabajo con un buscador arriba (código de giftcard, número de pedido o correo) y el resultado en una ficha:

- **Ficha de giftcard:** estado, saldo, vencimiento, cliente, campaña, canal de entrega y línea de tiempo de transacciones (activación, consumos, reversos).
- **Ficha de pedido:** estado, cantidades, historial de envíos y cambios.
- **Acciones:** reenviar (eligiendo plantilla y canal), consumo manual (monto + local), reverso total o parcial, extensión de vigencia (una sola vez, antes del vencimiento), anular. Todas, salvo reenviar, piden motivo y pasan por doble aprobación.

### 8.8 Liquidaciones, cobranza y pagos

| Vista | Contenido | Reglas |
| --- | --- | --- |
| Generar liquidación | Filtros: fechas, campaña, marca, tipo de programa. Tabla previa por razón social: consumos, % comisión, comisión, impuesto, total a pagar | Impuesto según país; botón Generar crea en "Pendiente de aprobación" |
| Liquidaciones | Estados como pestañas con contador: Pendiente de aprobación, Pendiente de firma, Por pagar, En pago, Pagada | Supervisor aprueba en lote con casillas |
| Documento de cobranza (P3) | Cabecera (serie-correlativo, totales) y detalle agrupado por programa de consumo o marca | Suma del detalle = totales; descargar sin firmar y subir firmado |
| Pagos (P1) | Descripción, comercios, monto, fecha, documentos TXT, liquidaciones, estado | — |
| Nuevo pago | Nombre y fecha de ejecución; selección de liquidaciones por pagar con checklist y total en vivo | — |
| Documento de pago | Generar archivo según banco y país; errores de validación listados por franquicia | Aprobar o desaprobar; cerrar marca las liquidaciones como pagadas |

### 8.9 Reportes (P4)

Los 11 reportes cerrados (C-083) comparten la misma plantilla; cambian filtros y columnas, que ya están definidos en el RFP: Ventas, Transacciones, Documentos TXT, Liquidaciones, Documentos de cobranza, Consumos, Gift Cards, Lotes, Breakage y Pasivo, Stock y Resultados (EPyG).

Dos requieren vista especial: **Breakage y Pasivo** agrega una vista de aging por antigüedad, y **Resultados** se presenta como estado de resultados con columnas por mes y acumulado anual, no como tabla plana.

### 8.10 Seguridad y control

| Vista | Contenido |
| --- | --- |
| Bandeja de aprobaciones | Pestañas "Por aprobar" y "Mis solicitudes". Fila: tipo, solicitante, fecha, monto o cantidad, motivo. Detalle con antes y después; Aprobar o Rechazar con comentario |
| Reglas antifraude | Reglas (límites, geovelocidad, scoring), listas negras y operaciones retenidas para revisión. Toda edición se versiona y pasa por aprobación |
| Auditoría | Solo lectura. Filtros: fecha, usuario, módulo, tipo y resultado del evento. Detalle con valor anterior y posterior |
| Parámetros por país | Por país: impuestos, moneda, identificador tributario, niveles geográficos, bancos y formatos de pago. Generales: días de aviso antes del vencimiento de giftcards y campañas (por defecto, sobreescribibles por cliente, programa y campaña) |

### 8.11 Accesos externos

- **Visor de entregas corporativas:** Página pública con enlace cifrado y caducable, construida con el design system Giftealo (incluido el modo oscuro) a partir del código del visor existente. Muestra cliente, envío y vencimiento del enlace; botones Descargar ZIP de PDF y Descargar XLSX según configuración. En el admin, una lista de enlaces con accesos, descargas e invalidar o regenerar.
- **Rol Comercio:** mismo layout del admin con menú reducido a Inicio y Consumos; reporte consolidado de todos sus locales con filtros por local, fechas y estado.
- **Consulta de saldo (beneficiario):** página pública responsive con código y CAPTCHA adaptativo; muestra saldo y vencimiento sin revelar otros datos.

## Flujos críticos a prototipar

El RFP pide un prototipo navegable en Figma de tres recorridos. En los tres, la operación queda en espera hasta que un segundo usuario la aprueba; ese paso es el que más cambia respecto de la plataforma actual, donde hoy no existe.

&#91;embedded content: flujos críticos del prototipo · 3 recorridos, 6 pasos cada uno\]

Para cada flujo el prototipo debe incluir también el camino de rechazo (la solicitud vuelve al solicitante con el comentario del aprobador) y los errores más probables: archivo XLSX con filas inválidas, contactos que superan el stock disponible, archivo de pago que no pasa la validación bancaria y saldo insuficiente en un consumo manual.

## Referencia 1: Admin de Enjoy (Figma)

El Admin de Enjoy (Regalos 2.0) ya resuelve casi todos los problemas de Zonacards: códigos con ciclo de vida, empresas y campañas, liquidaciones a marcas, roles y auditoría. Se revisaron las páginas "I. General" y "II. Marca" (más de 150 pantallas y modales). La recomendación es usarlo como base de patrones y reemplazar solo la capa de marca por Giftealo; el archivo incluso ya define el token `giftealo/colors/secondary/500` (#172948).

### Patrones a adoptar

| Patrón en Enjoy | Dónde se ve | Uso en Zonacards |
| --- | --- | --- |
| Fila de KPI con ícono sobre la tabla (Sin enviar, Descargados, Enviados, Activados, Canjeados, Vencidos) | Detalle de empresa / Códigos | Encabezado de Lotes, Stock y Ventas. Cada tarjeta filtra la tabla al hacer clic |
| Ficha de entidad con logo, estado, 3 métricas y menú ⋮ | Detalle de empresa, Liquidación | Patrón P3 para Cliente, Franquicia, Lote y Liquidación |
| Pestañas segmentadas dentro de la ficha (Campañas · Códigos · Usuarios · Reportes) | Detalle de empresa | Ficha de Cliente: Programas · Campañas · Lotes · Reportes |
| Barra "Alertas activas" con contadores por severidad, desplegable a tarjetas con acción directa (Enviar ahora, Reenviar) | Inicio, Detalle de empresa | Alertas de vencimiento, stock bajo, campañas por vencer y liquidaciones atrasadas |
| Buscador + botón "Filtros" con contador de filtros activos + Exportar | Todas las listas | Barra de filtros estándar (sustituye los filtros sueltos de hoy) |
| Panel lateral de filtros con conteo en vivo ("144 códigos coinciden") y botones Limpiar / Aplicar | Códigos, Pre carga, Participantes | Filtros avanzados de reportes y consulta ATC |
| Acciones masivas sobre la tabla (Reenviar no activados, Descargar disponibles, Enviar disponibles) | Códigos | Envíos y activaciones desde el detalle del lote |
| Celda doble: dato principal + secundario gris (empresa + RUC, código + lote, beneficiario + correo) | Todas las tablas | Reduce columnas: ID tributario, lote y contacto van bajo el dato principal |
| Badge "Venc. extendido" junto al código | Códigos | Marca visual de la extensión única de vigencia (C-086) |
| Detalle de código en modal con datos agrupados por ícono y línea de tiempo (Generado → Enviado → Activo) | Detalles Activado / Canjeado / Vencido | Ficha de giftcard en ATC |
| Anulación con alcance (solo este código o todo el lote), motivo obligatorio y botón rojo deshabilitado hasta completar | Anular códigos | Anulación de lote o código; luego pasa a doble aprobación |
| Modal de lote en 3 estados (vacío → lleno → éxito con cantidad creada) | Generar lote de códigos | Paso final del asistente de lotes propios |
| Carga masiva en 2 pasos numerados (descargar plantilla → subir) con resultado de éxito o error | Subir lote de códigos, Carga masiva productos | Todas las cargas XLSX |
| Formulario largo con índice lateral de progreso ("0 de 5 secciones"), secciones plegables y mapa para ubicar el pin | Nueva marca / establecimiento | Alta de Giftcard, Franquicia y Local |
| Pipeline de liquidaciones en tarjetas de color por etapa con cantidad y monto (Esperando factura → Por revisar → En cola → Programado → Pagadas → Observadas) | Liquidaciones / Consolidado, Reporte financiero | Pantalla Liquidaciones: el ciclo completo de un vistazo |
| Tarjetas "Próximo corte", "Próximo desembolso", "A desembolsar este ciclo" | Liquidaciones | Cabecera del módulo de pagos |
| Detalle de liquidación con documento adjunto (Ver, Descargar) y botones Observar / Aprobar | Liqui / General \[Factura recibida\] | Documento de cobranza firmado y aprobación del Supervisor de Finanzas |
| Roles con permisos por módulo: interruptor por módulo, casillas por acción y contador "0/11 permisos" | Nuevo rol | Maestro de Roles |
| Logs de auditoría con pestañas por ámbito y estado Exitoso / Fallido | Auditoría | Consulta de auditoría |
| Estados vacíos dedicados por pantalla y variantes "filtro activo" | Empresas / Empty, Códigos / Filtro activo | Estados vacío y sin resultados de la sección 7 |
| Reporte global con accesos rápidos a reportes detallados y pestañas General · Negocio · Financiero | Reportes | Puerta de entrada al módulo de 11 reportes |

### Fundamentos visuales observados

Tipografía Outfit (16/24 cuerpo desktop, 14/20 tablet y móvil, 12/18 texto secundario, títulos 24/32 en negrita). Escala neutra de 10 pasos (#FAFAFA a #404040), bordes #E5E5E5 y sombra suave única. Radios de 16 px para tarjetas y 24 px para contenedores grandes; botones e insignias totalmente redondeados. Colores de estado en pares fondo 50 + texto 700 (éxito, peligro, advertencia, azul, púrpura). Botón primario negro y modo oscuro desde la barra superior.

### Qué mejorar respecto de Enjoy

- El error de carga masiva solo dice "Se han encontrado registros inválidos". En Zonacards debe mostrar la fila, columna y motivo, con descarga del archivo de errores.
- Las tarjetas del pipeline distinguen etapas solo por color; agregar ícono y texto (ya lo tienen) y no depender del tono.
- El código se muestra parcialmente (RQ4-\*\*\*\*\*\*) solo en algunos estados. En Zonacards el enmascarado es obligatorio en todos (`•••• 1234`).
- El menú lateral en mayúsculas con 6 grupos colapsados obliga a abrir grupos para encontrar pantallas; conviene mantener abierto el grupo activo y permitir búsqueda rápida (Ctrl+K).

## Referencia 2: Wallet Motiva

Wallet Motiva aporta lo que a Enjoy le falta: navegación rápida, vistas alternables, edición con vista previa en vivo y una base técnica igual a la que pide Zonacards (Angular con Tailwind v4, tipografía Geist). Se recorrieron las 14 secciones del panel de empresa, la ficha de cliente y de programa, el asistente de creación, la búsqueda global y el panel de actividad.

### Patrones a adoptar

| Patrón en Motiva | Dónde se ve | Uso en Zonacards |
| --- | --- | --- |
| Búsqueda global con Ctrl+K: resultados agrupados por tipo, navegación con flechas y Enter | Barra superior | Buscar giftcard (por últimos 4 dígitos o pedido), cliente, campaña o pantalla desde cualquier lugar; acelera ATC |
| Menú lateral con grupos rotulados siempre visibles (Fidelidad, Adquisición, Operación, Recursos), sin desplegables | Todo el panel | Mejor que los grupos colapsados de Enjoy y de la plataforma actual |
| Saludo con fecha y periodo ("Así va… en los últimos 30 días") y acciones primarias arriba a la derecha | Dashboard | Encabezado del dashboard por rol |
| KPI con ícono de ayuda (?) que explica cómo se calcula, porcentaje en chip y desglose en texto pequeño | Dashboard, Analytics | Métricas de emisión, redención, breakage y stock |
| Panel "Actividad reciente" en vivo con indicador Live, también accesible desde la campana | Dashboard, barra superior | Últimas emisiones, consumos, aprobaciones pendientes y errores de integración |
| Selector de periodo segmentado (7d · 30d · 90d · 180d) junto a filtros de programa y local | Analytics | Filtro de periodo del dashboard y reportes |
| Filtros principales visibles + "Más filtros" que despliega una segunda fila (estado, edad, nivel, actividad, registro, orden) | Clientes | Reportes con muchos filtros: primero los 3 más usados, el resto a demanda |
| Alternar vista tarjetas / tabla en listados | Clientes, Rewards, Enlaces, Usuarios, Facturas | Maestros visuales (Marcas, Giftcards, Plantillas) en tarjetas; maestros de datos en tabla |
| Conteo de resultados y acción contextual masiva sobre la lista ("Recordar guardar la tarjeta (167)") | Clientes | "Reenviar a no activados (N)", "Activar disponibles (N)" |
| Ficha con pestañas y "Zona de peligro" separada en rojo para acciones destructivas | Ficha de programa | Anular, desactivar o eliminar quedan aislados del trabajo diario |
| Vista previa de la tarjeta Wallet con conmutador Apple / Google | Ficha de programa | Ficha de Giftcard y módulo de Plantillas: ver el vale PDF, el correo y el pase de cada billetera |
| Elegir tipo con tarjetas ilustradas antes de crear (Sellos, Niveles, Prepago) | Crear programa | Tipo de lote (propios o terceros) y tipo de giftcard (nominal o experiencia) |
| Asistente por pasos con vista previa en vivo a la derecha, texto de ayuda bajo cada campo y contador de caracteres | Crear programa | Plantillas ad hoc, giftcards y campañas |
| Verificador de contraste en los selectores de color ("16.2:1 AA", "3.7:1 Bajo") | Crear programa, paso Landing | Plantillas de correo y de vale personalizadas por cliente |
| Ficha de cliente con consentimiento visible y acciones de datos personales (descargar, eliminar) | Ficha de cliente | Protección de datos del destinatario en ATC |
| Línea de tiempo filtrable por programa | Ficha de cliente | Historial de la giftcard y del pedido en ATC |
| Teléfono con selector de país y prefijo (EC +593) | Configuración | Contactos en Clientes y Franquicias (multipaís) |
| Uso del plan con barras de capacidad (3/10, 4/15) | Plan y facturación | Stock contra máximo; cupo de campaña |
| Mapa de locales con conteo por ubicación | Locales | Maestro de Locales y reporte de consumos por local |
| Sello "DEMO · datos de prueba" fijo arriba | Todo el sitio | Distinguir los ambientes de desarrollo y QA de producción |

### Comportamiento responsive observado

El código usa los cortes de Tailwind v4 (40, 48, 64, 80 y 96 rem), consultas de contenedor, reglas para pantallas táctiles (`pointer: coarse` o menos de 640 px) y respeta `prefers-reduced-motion`. La app de staff (/worker) es una aplicación aparte, de una sola columna, con tema oscuro y botones grandes, pensada para el teléfono.

En móvil (revisado a 500 px, el ancho mínimo que permite la ventana de Chrome, ya por debajo del corte de 640 px):

| Pantalla | Comportamiento | Para Zonacards |
| --- | --- | --- |
| Barra superior | Logo y menú lateral se reemplazan por un botón que abre el menú como panel superpuesto; la búsqueda y la campana se mantienen | Adoptar tal cual |
| Dashboard | KPI y gráficos pasan a una columna; las acciones primarias quedan bajo el título | Mejorar: KPI en grilla de 2 columnas para no obligar a desplazarse 6 tarjetas |
| Clientes | Filtros se acomodan en filas y los textos de los selectores se cortan ("Todos los programa", "Cumpleaños: t"); la tabla mantiene columnas con desplazamiento horizontal | Mejorar: en móvil abrir filtros en panel inferior y forzar vista de tarjetas |
| Ficha de cliente | Cabecera apilada, datos con ícono uno por línea, acciones de datos personales visibles | Adoptar para la ficha de giftcard en ATC |
| Crear programa | Pasos del asistente en fila deslizable horizontal; la vista previa se mueve debajo del formulario | Adoptar; mostrar "Paso 2 de 7" para no perder contexto |

### Qué mejorar respecto de Motiva

- En la tabla de Clientes el correo se corta en mitad de palabra; en Zonacards las celdas largas se truncan con puntos suspensivos y muestran el texto completo al pasar el cursor.
- La tabla no tiene selección de filas; Zonacards necesita casillas y barra de acciones masivas.
- Los pasos del asistente no indican por qué están bloqueados; mostrar qué falta completar.

## Referencia 3: skill UI UX Pro Max

El skill se ejecutó con el perfil "backoffice fintech de gift cards", densidad alta (8/10), variación baja (3/10) y movimiento sutil (3/10). Su recomendación de estilo, densidad y reglas se adopta; su paleta y tipografía no, porque la marca la define Giftealo.

### Qué se adopta y qué no

| Recomendación del skill | Decisión | Motivo |
| --- | --- | --- |
| Estilo Minimalism & Swiss: alto contraste, grilla, sans-serif, sin decoración | Se adopta | Coincide con Enjoy y con una herramienta de trabajo diario |
| Densidad de tablero: escala de espaciado 8–32 px | Se adopta para tablas y filtros; 16–40 px para fichas y formularios | Muchas columnas sin perder legibilidad |
| Patrón "operaciones en tiempo real": métricas arriba, colores de estado verde/ámbar/rojo, mostrar hora de actualización | Se adopta | Dashboard, stock y alertas |
| Paleta oscura (#0F172A) con acento verde | No se adopta como base | La paleta es la de Giftealo; el modo oscuro queda como tema alternativo |
| Tipografía Fira Sans / Fira Code | No se adopta | Se usa la tipografía de marca (Outfit en Enjoy). Para montos y códigos, cifras tabulares (`font-variant-numeric: tabular-nums`) |
| Microinteracciones de 150–300 ms y respeto de `prefers-reduced-motion` | Se adopta | Sin animaciones decorativas |
| Gráfico de bala (bullet chart) para indicador contra meta | Se adopta | Stock contra mínimo, máximo y punto de pedido |

### Reglas de UX que pasan a ser obligatorias

1. **Accesibilidad:** contraste mínimo 4.5:1, foco visible en todo control, navegación completa por teclado, botones de solo ícono con etiqueta accesible.
2. **Formularios:** etiqueta visible siempre (nunca solo placeholder), validación al salir del campo, error debajo del campo enlazado con `aria-describedby`, y un resumen de errores al tope que recibe el foco al fallar el envío.
3. **Acciones destructivas:** confirmación explícita y mensaje breve de éxito al terminar; nunca éxito silencioso.
4. **Tablas:** selección múltiple con barra de acciones masivas; en móvil, tarjetas apiladas o desplazamiento horizontal dentro del contenedor.
5. **Carga:** skeleton estable con `aria-busy`; sin parpadeo de spinner en respuestas rápidas.
6. **Estados vacíos:** mensaje que explica y una acción para salir del vacío.
7. **Navegación:** migas de pan solo desde el tercer nivel, enlaces profundos (filtros en la URL), botón Volver predecible.
8. **Íconos:** SVG de un solo set (Lucide o el que defina la marca), nunca emojis. El saludo con emoji de Enjoy no se replica.

### Reglas de implementación en Angular

- Formularios reactivos tipados (`FormBuilder` con genéricos) en todo formulario no trivial.
- Validadores personalizados como funciones (`ValidatorFn`), por ejemplo CCI por banco o identificador tributario por país.
- `updateOn: 'blur'` en validadores costosos o asíncronos (duplicados de RUC, de razón social, de local).

### Lista de verificación antes de entregar cada pantalla

- [ ] Sin emojis como íconos; todos los íconos en SVG del mismo set
- [ ] Cursor de mano en todo lo clicable y estado hover de 150–300 ms
- [ ] Contraste de texto 4.5:1 en tema claro y oscuro
- [ ] Foco visible y orden de tabulación igual al visual
- [ ] `prefers-reduced-motion` respetado
- [ ] Probado en 375, 768, 1024 y 1440 px
- [ ] Estados cargando, vacío, sin resultados y error implementados

## Design system Giftealo: fundamentos y tokens

La identidad de Giftealo (logo, colores, línea gráfica) la entrega Promotick como punto de partida (C-112); hasta recibirla, los colores de marca quedan como variables sin valor final. La estructura de tokens sí puede fijarse ya, para que diseño y código trabajen sobre los mismos nombres.

### Estructura de tokens

Tres niveles, de modo que cambiar la marca solo toque el primero:

1. **Primitivos:** paleta cruda (`blue-500`, `gray-100`), tamaños, radios.
2. **Semánticos:** intención (`color-primary`, `color-surface`, `color-text-muted`, `color-danger`). Aquí viven los temas claro y oscuro.
3. **De componente:** solo cuando hace falta (`button-primary-bg`, `table-row-hover`).

| Grupo | Tokens propuestos | Valor inicial |
| --- | --- | --- |
| Color de marca | primary, primary-hover, primary-contrast, secondary, accent | Pendiente: identidad Giftealo; el Figma de Enjoy ya define secondary-500 #172948 |
| Color neutro | bg, surface, surface-raised, border, text, text-muted, text-disabled | Escala de grises de 10 pasos |
| Color de estado | success, warning, danger, info (cada uno con fondo suave y texto) | Pares fondo 50 + texto 700 (éxito, advertencia, peligro, azul, púrpura), como en Enjoy |
| Estados de giftcard | created, activated, voided, expired | Gris, verde, rojo, ámbar: siempre con texto, nunca solo color |
| Tipografía | font-family-base, font-family-mono; tamaños 12, 14, 16, 18, 20, 24, 32; pesos 400, 500, 600 | Figtree (Outfit queda para Enjoy): 16/24 cuerpo, 14/20 tablas y móvil, 12/18 secundario, 24/32 títulos; cifras tabulares en montos |
| Espaciado | space-1 a space-12 en base 4 px | 4, 8, 12, 16, 20, 24, 32, 40, 48 |
| Radios | radius-sm, radius-md, radius-lg, radius-full | 8 campos, 16 tarjetas, 24 contenedores, 9999 botones e insignias (como Enjoy) |
| Elevación | shadow-sm, shadow-md, shadow-lg | Para tarjetas, menús y modales |
| Layout | sidebar-width, sidebar-collapsed, topbar-height, content-max-width | 256, 72, 64, 1600 px |
| Breakpoints | sm, md, lg, xl | 0, 768, 1280, 1920 px |

### Criterios de accesibilidad

El RFP pide accesibilidad en sentido de multiplataforma, idioma, moneda y país. Se recomienda además tomar WCAG 2.1 AA como criterio interno: contraste mínimo 4.5:1 en texto, foco visible en todo control, navegación completa por teclado en tablas y formularios, y etiquetas en todos los campos.

### Exportación a Angular

Los tokens se mantienen en Figma (Variables) y se exportan a un JSON en formato Design Tokens. Un script los convierte a variables CSS (`--zc-color-primary`) que Tailwind v4 expone como utilidades mediante @theme y que usan los componentes de spartan/ui. Así, un cambio de marca no requiere tocar componentes.

Archivo `src/styles/tokens.css` con los valores del Figma de Enjoy (variables `semantic/*`, `spacing/*`, `radius/*`, `typography/*`) y Giftealo como capa de marca. Cambiar la tipografía es cambiar `--zc-font-sans`; cambiar la marca es cambiar el bloque `--brand-*`.

```css
@import "tailwindcss";

/* 1. Primitivos (Figma Enjoy) */
:root {
  --zc-font-sans: "Figtree", ui-sans-serif, system-ui, sans-serif;
  --brand-primary: #000000;          /* botón primario en Enjoy; reemplazar con Giftealo */
  --brand-secondary: #172948;        /* giftealo/colors/secondary/500 */
  --brand-accent: #f8ae23;           /* enjoy/colors/secondary/500, referencia */
  --neutral-50: #fafafa; --neutral-100: #f5f5f5; --neutral-200: #e5e5e5;
  --neutral-400: #a3a3a3; --neutral-500: #737373; --neutral-700: #404040;
  --neutral-900: #171717; --neutral-950: #0a0a0a;
}

/* 2. Semánticos: tema claro */
:root, [data-theme="light"] {
  --zc-bg: var(--neutral-50);
  --zc-surface: #ffffff;
  --zc-border: var(--neutral-200);
  --zc-text: #000000;
  --zc-text-muted: var(--neutral-500);
  --zc-primary: var(--brand-primary);
  --zc-on-primary: #ffffff;
  --zc-success-bg: #f0fdf4;  --zc-success-fg: #15803d;
  --zc-warning-bg: #fffbeb;  --zc-warning-fg: #b45309;
  --zc-danger-bg:  #fef2f2;  --zc-danger-fg:  #b91c1c;
  --zc-info-bg:    #eff6ff;  --zc-info-fg:    #1d4ed8;
  --zc-accent-bg:  #faf5ff;  --zc-accent-fg:  #7e22ce;
  --zc-shadow-1: 0 16px 32px rgb(105 108 128 / 0.08);
}

/* 3. Semánticos: tema oscuro (fase 1) */
[data-theme="dark"] {
  --zc-bg: var(--neutral-950);
  --zc-surface: var(--neutral-900);
  --zc-border: var(--neutral-700);
  --zc-text: var(--neutral-50);
  --zc-text-muted: var(--neutral-400);
  --zc-primary: #ffffff;
  --zc-on-primary: #000000;
  --zc-success-bg: rgb(34 197 94 / 0.15);  --zc-success-fg: #4ade80;
  --zc-warning-bg: rgb(245 158 11 / 0.15); --zc-warning-fg: #fbbf24;
  --zc-danger-bg:  rgb(239 68 68 / 0.15);  --zc-danger-fg:  #f87171;
  --zc-info-bg:    rgb(59 130 246 / 0.15); --zc-info-fg:    #60a5fa;
  --zc-accent-bg:  rgb(168 85 247 / 0.15); --zc-accent-fg:  #c084fc;
  --zc-shadow-1: none;
}

/* 4. Puente a utilidades de Tailwind v4 (bg-surface, text-muted, rounded-md…) */
@theme inline {
  --font-sans: var(--zc-font-sans);
  --color-bg: var(--zc-bg);
  --color-surface: var(--zc-surface);
  --color-border: var(--zc-border);
  --color-fg: var(--zc-text);
  --color-muted: var(--zc-text-muted);
  --color-primary: var(--zc-primary);
  --radius-sm: 8px;   /* campos */
  --radius-md: 16px;  /* tarjetas (radius/md) */
  --radius-lg: 24px;  /* contenedores (radius/lg) */
  --text-xs: 12px; --text-sm: 14px; --text-base: 16px; --text-xl: 20px; --text-2xl: 24px;
}
```

El modo oscuro sigue la preferencia del sistema por defecto y el usuario puede fijarlo desde la barra superior (claro, oscuro o sistema); la elección se guarda en su perfil. Todo par fondo/texto se verifica a 4.5:1 en ambos temas.

## Librería de componentes y estados

> El inventario definitivo, con base spartan/ui, variantes y estados, está en la pestaña "Reglas para Claude Code", sección 7. Esta sección queda como referencia del origen de cada componente.

La librería se compone de 25 componentes: los que pide el RFP más los que exigen los patrones de la sección 7. Todos se diseñan en los siete estados del RFP (normal, hover, foco, deshabilitado, error, vacío, carga) cuando aplican, y se nombran igual en Figma y en código (prefijo `zc-`).

| Componente | Selector Angular | Uso principal | Notas |
| --- | --- | --- | --- |
| App shell | `zc-shell` | Barra superior, menú lateral, migas, área de contenido | Menú colapsable; selector de país e idioma; notificaciones |
| Encabezado de página | `zc-page-header` | Título, migas y acciones primarias | Máximo una acción primaria visible |
| Barra de filtros | `zc-filter-bar` | P1 y P4 | Chips de filtros aplicados; sincroniza con la URL |
| Rango de fechas | `zc-date-range` | Filtros y formularios | Atajos: hoy, 7 días, mes actual, mes anterior |
| Buscador predictivo | `zc-entity-search` | Cliente, programa, campaña, marca, giftcard | Búsqueda en servidor tras 3 caracteres |
| Select múltiple | `zc-multi-select` | Estados y catálogos | Con "Seleccionar todo" |
| Tabla de datos | `zc-data-table` | P1 y P4 | Paginación en servidor, orden, columnas configurables y fijas, selección, acciones por fila, vista tarjeta en móvil |
| Celda de estado | `zc-status-badge` | Estados de giftcard, lote, liquidación, pago | Color + texto + ícono |
| Código enmascarado | `zc-masked-code` | Número de giftcard | Siempre `•••• 1234`; nunca expone el valor completo |
| Monto | `zc-money` | Montos en tablas y fichas | Moneda e idioma del país |
| Campo de formulario | `zc-form-field` | Todos los formularios | Etiqueta, ayuda, error, contador |
| Sección de formulario | `zc-form-section` | P2 | Título, descripción, grilla de 2 columnas |
| Asistente | `zc-stepper` | Lotes, envíos, carga masiva, giftcard | Pasos con validación por paso y resumen final |
| Carga de archivo | `zc-file-drop` | XLSX y ZIP | Arrastrar y soltar, tipo y tamaño máximo, progreso |
| Previsualización de carga | `zc-import-preview` | Cargas masivas | Filas con error resaltadas; descargar errores |
| Modal | `zc-dialog` | Confirmaciones y formularios cortos | Tamaños sm, md, lg |
| Confirmación crítica | `zc-confirm-critical` | Anular, reversar, aprobar | Motivo obligatorio y resumen del impacto |
| Panel lateral | `zc-drawer` | Edición rápida y detalle | Desde la derecha |
| Toast | `zc-toast` | Resultado de acciones | Éxito, error, info; con enlace al registro |
| Alerta en línea | `zc-alert` | Avisos en página | Campaña por vencer, stock bajo |
| Estado vacío | `zc-empty-state` | Listas y reportes | Ilustración, texto y acción |
| Skeleton | `zc-skeleton` | Carga | Variantes de tabla, tarjeta y formulario |
| Tarjeta de métrica | `zc-kpi-card` | Dashboard | Valor, variación, mini gráfico, enlace |
| Gráfico | `zc-chart` | Dashboard y Resultados | Barras, líneas, dona; tokens de color |
| Línea de tiempo | `zc-timeline` | Historial de giftcard, pedido y aprobaciones | Evento, usuario, fecha |

Componentes adicionales tomados del Admin de Enjoy:

| Componente | Selector Angular | Uso |
| --- | --- | --- |
| Ficha de entidad | `zc-entity-header` | Logo, nombre, estado, 3 métricas y menú de acciones |
| Franja de KPI | `zc-stat-strip` | 4 a 6 tarjetas con ícono que filtran la tabla al hacer clic |
| Barra de alertas | `zc-alert-bar` | Contadores por severidad, desplegable a tarjetas con acción directa |
| Pipeline | `zc-pipeline` | Etapas con cantidad y monto (liquidaciones, envíos) |
| Panel de filtros | `zc-filter-drawer` | Filtros avanzados con conteo de resultados en vivo, Limpiar y Aplicar |
| Pestañas segmentadas | `zc-segmented-tabs` | Pestañas dentro de una ficha |
| Progreso de formulario | `zc-form-progress` | Índice lateral fijo de secciones completadas en formularios largos |
| Matriz de permisos | `zc-permission-matrix` | Interruptor por módulo, casillas por acción y contador |
| Selector de alcance | `zc-scope-picker` | "Solo este código" o "Todo el lote" en anulaciones y extensiones |

## Lineamientos técnicos Angular

El frontend es una SPA estática alojada en S3 y servida por CloudFront, que consume los microservicios Quarkus con tokens JWT de Keycloak. Las decisiones siguientes son la propuesta para validar con el arquitecto de Promotick.

### Decisiones de base

| Tema | Propuesta | Motivo |
| --- | --- | --- |
| Versión | Última versión estable de Angular al iniciar el proyecto | Soporte largo y APIs actuales |
| Estilo de componentes | Standalone, signals, control flow nativo (`@if`, `@for`), `OnPush` | Menos código y mejor rendimiento en tablas grandes |
| Librería base | Tailwind CSS v4 + spartan/ui (port de shadcn/ui para Angular, sobre Angular CDK), con los tokens como variables de @theme | Mismo stack que Wallet Motiva; componentes accesibles cuyo código queda en el repositorio (propiedad de Promotick) y se adapta 100% a Giftealo. Tablas con TanStack Table |
| Autenticación | Librería OIDC compatible con Keycloak (`keycloak-angular` o `angular-auth-oidc-client`), flujo Authorization Code + PKCE | Estándar del RFP; nada de contraseñas en el frontend |
| Autorización | Guard de ruta por rol y directiva `*zcCan="'lotes.anular'"` para acciones | Ocultar lo que el usuario no puede hacer |
| i18n | Traducción en tiempo de ejecución (Transloco o ngx-translate) con archivos `es.json` y `en.json` | Cambiar idioma sin recompilar; preparado para más idiomas |
| Formato | Pipes propios para moneda, fecha e identificador tributario según país | Multipaís |
| Estado | Servicios con signals por módulo; sin store global salvo sesión, país e idioma | Simplicidad |
| Datos | Servicios HTTP tipados por dominio, interceptores de token, errores e ID de correlación | Trazabilidad con OpenTelemetry |
| Gráficos | Una librería ligera (ECharts o Chart.js) envuelta en `zc-chart` | Dashboard y Resultados |
| Calidad | ESLint, Prettier, pruebas unitarias de componentes, cobertura para el gate de SonarQube | Pipeline de Jenkins |
| Seguridad | CSP estricta, sin `innerHTML` con datos del servidor, sin datos sensibles en `localStorage` | ASVS y prueba de hacking ético |

### Estructura de carpetas

```text
src/app/
  core/            # auth, interceptores, guards, layout (shell), servicios de sesión, país e idioma
  shared/
    ui/            # componentes zc-* del design system
    pipes/         # moneda, fecha, enmascarado, identificador tributario
    models/        # tipos compartidos
  features/
    dashboard/
    maestros/      # usuarios, roles, clientes, programas, campañas, giftcards,
                   # franquicias, locales, marcas, almacenes
    lotes/
    envios/
    activacion/
    stock/
    atc/
    liquidaciones/ # liquidaciones, cobranza, pagos
    reportes/
    seguridad/     # aprobaciones, antifraude, auditoría, parámetros
    comercio/      # vistas del rol Comercio
  styles/          # tokens.css generado, tema de Tailwind
public/i18n/       # es.json, en.json
```

El visor de entregas corporativas y la consulta de saldo del beneficiario son públicos y sin sesión. Se recomienda construirlos como una segunda aplicación del mismo workspace (`projects/visor`), que reutiliza `shared/ui`, para no cargar Keycloak en páginas públicas.

### Rutas principales

| Ruta | Módulo |
| --- | --- |
| `/dashboard` | Dashboard |
| `/maestros/:entidad` · `/maestros/:entidad/nuevo` · `/maestros/:entidad/:id` | Maestros (listado, alta, detalle) |
| `/lotes` · `/lotes/nuevo` · `/lotes/:id` | Lotes |
| `/envios` · `/envios/nuevo` · `/envios/:id` | Envíos masivos |
| `/activacion` | Activación masiva |
| `/stock` · `/stock/umbrales` | Stock |
| `/atc` · `/atc/giftcard/:id` · `/atc/pedido/:id` | ATC |
| `/liquidaciones` · `/liquidaciones/generar` · `/cobranza/:id` · `/pagos` · `/pagos/nuevo` | Liquidaciones |
| `/reportes/:reporte` | Reportes |
| `/aprobaciones` · `/antifraude` · `/auditoria` · `/parametros` | Seguridad y control |
| `/comercio/consumos` | Rol Comercio |

Cada módulo de `features/` se carga en diferido (`loadChildren`), con su guard de rol.

### Contrato con el backend

Las APIs de Zonacards 2.0 son nuevas (C-078) y se construyen en paralelo, así que el frontend se maqueta y prueba contra **Mock APIs** desde el primer día. Cuando el backend esté listo se apaga el mock con una variable de entorno, sin tocar componentes.

| Pieza | Herramienta | Detalle |
| --- | --- | --- |
| Contrato | OpenAPI 3.1 por dominio (`contracts/lotes.yaml`, `contracts/liquidaciones.yaml`…) | Se acuerda con backend antes de maquetar cada módulo; de él se generan los tipos TypeScript |
| Mock en el navegador | MSW (Mock Service Worker) | Intercepta las llamadas HTTP reales del `HttpClient`, de modo que el código es el mismo con mock o sin él |
| Datos de prueba | Fábricas con Faker y semillas fijas | Datos de los 6 países, con monedas, identificadores tributarios válidos y nombres locales; códigos siempre enmascarados |
| Escenarios | Parámetro `?scenario=` o panel de desarrollo | Vacío, lista larga (10 000 filas), latencia de 3 s, error 500, sesión expirada, sin permisos, operación pendiente de aprobación |
| Pruebas unitarias | Vitest (corredor por defecto en Angular 21) | Reutilizan los mismos handlers de MSW |
| Pruebas de extremo a extremo | Playwright | Flujos críticos de la sección 9 en desktop (1440 px) y móvil (375 px), tema claro y oscuro, español e inglés |
| Interruptor | `environment.useMocks` | Activo en local y QA de frontend; apagado en integración y producción |

Estructura sugerida: `src/mocks/handlers/<dominio>.ts`, `src/mocks/fixtures/<pais>.ts` y `src/mocks/browser.ts`.

### Arquitectura para escalar

- **Por dominio:** cada carpeta de `features/` es independiente, con carga diferida y sin importar de otro dominio; lo compartido vive en `shared/`.
- **Angular moderno:** componentes standalone, signals, zoneless y `OnPush`; menos código y mejor rendimiento en tablas grandes.
- **Tablas grandes:** paginación, orden y filtros en servidor; virtualización con CDK cuando una vista supere las 500 filas visibles.
- **Configuración, no código:** países, impuestos, monedas, bancos, idiomas, roles, umbrales y días de aviso salen de la API de parámetros; agregar un país no requiere desplegar el frontend.
- **Design system aislado:** `shared/ui` no conoce reglas de negocio, de modo que puede convertirse en librería propia si Promotick lanza otro producto.

## Plan de maquetación con Claude Code

La maquetación avanza en 6 etapas, de lo transversal a lo específico: primero la base y los componentes, después un módulo piloto completo, y recién entonces el resto en paralelo. Cada etapa termina con revisión visual contra Figma antes de seguir.

### Preparación del repositorio

1. Exporta este documento a Markdown y guárdalo como `docs/spec-ux-ui.md`.
2. Exporta los tokens de Figma a `design/tokens.json` y, cuando existan, capturas o enlaces de cada pantalla a `design/screens/`.
3. Crea un `CLAUDE.md` en la raíz con las reglas permanentes del proyecto. Claude Code lo lee en cada sesión:

```markdown
# Zonacards 2.0 — Admin (Angular)
- Especificación funcional y de UX: docs/spec-ux-ui.md. Léela antes de crear cualquier pantalla.
- Reglas de implementación obligatorias: docs/reglas-implementacion.md (prevalece ante conflicto).
- Íconos: Solar Linear, y Lucide solo si Solar no lo tiene. Banderas: flag-icons. Nunca emojis.
- Listados en tarjetas por defecto; tabla solo como alternativa en desktop.
- Targets: 48 px con mouse y 56 px en táctil (token --target); sin <select> nativo.
- Atomic Design: átomos sin dependencias, organismos sin servicios, páginas en features/ (ver reglas, sección 7).
- Componentes standalone, signals, control flow nativo, ChangeDetection OnPush.
- Solo usar componentes zc-* de src/app/shared/ui; si falta uno, crearlo ahí, no dentro del feature.
- Colores, espacios y radios solo desde variables CSS --zc-*; nunca valores fijos.
- Todo texto visible va en public/i18n/es.json y en.json; nada de textos en el template.
- El número de giftcard siempre con zc-masked-code; el CVV nunca se muestra.
- Cada vista contempla estados: cargando, vacío, sin resultados, error.
- Datos simulados con MSW (src/mocks) mientras environment.useMocks sea true; contratos en contracts/*.yaml.
- Cada pantalla se prueba en tema claro y oscuro, en español e inglés, y con al menos 2 países (moneda de 2 y de 0 decimales).
- Correr lint y pruebas antes de dar una tarea por terminada.
```

Para que Claude Code use spartan/ui correctamente, instala su skill oficial en el repositorio (`npx skills add spartan-ng/spartan`) y, si lo usas, su servidor MCP de documentación (`@spartan-ng/mcp`). Agrega al `CLAUDE.md`: "Componentes base de spartan/ui (brain + helm) generados con `@spartan-ng/cli`; los `zc-*` los envuelven con la marca. Estilos solo con utilidades de Tailwind v4 y tokens de @theme."

### Etapas y prompts sugeridos

| Etapa | Entregable | Prompt sugerido para Claude Code |
| --- | --- | --- |
| 1. Base | Workspace, estructura de carpetas, tokens a CSS, Tailwind v4 y spartan/ui, i18n, auth simulada | "Crea el workspace Angular según la sección 12 de docs/spec-ux-ui.md. Genera src/styles/tokens.css desde design/tokens.json y configura Tailwind v4 con esas variables en @theme e instala spartan/ui con su CLI. Configura Transloco con es y en, un servicio de sesión con usuario y roles simulados, y MSW con handlers y datos de los 6 países en src/mocks." |
| 2. Shell | `zc-shell` con menú por rol, selector de país e idioma, migas, aviso de expiración de sesión | "Implementa zc-shell según las secciones 6 y 7. El menú se arma desde una configuración de rutas con roles, y oculta lo que el rol no puede ver. Agrega el aviso de sesión a los 14 minutos de inactividad." |
| 3. Componentes | Los 25 componentes de la sección 11 con sus estados, y una página de catálogo interna | "Implementa los componentes de la sección 11 en shared/ui, empezando por zc-data-table, zc-filter-bar y zc-form-section. Crea una ruta /catalogo que muestre cada componente en todos sus estados." |
| 4. Piloto | Maestro de Marcas completo: listado, alta, edición, detalle y carga masiva | "Construye el maestro de Marcas usando los patrones P1, P2 y P3 y la carga masiva de la sección 7. Usa mocks. Este módulo será la plantilla de los demás: deja el código lo más genérico posible." |
| 5. Maestros y operación | Los otros 8 maestros; luego lotes, envíos, activación, stock y ATC | "Replica el patrón del maestro de Marcas para Franquicias, con los campos y validaciones de la sección 8.3." (un prompt por módulo) |
| 6. Finanzas, reportes y control | Liquidaciones, cobranza, pagos, 11 reportes, aprobaciones, antifraude, auditoría, dashboard, rol Comercio, visor | "Implementa la plantilla P4 de reportes y genera el Reporte de Ventas con los filtros y columnas del RFP sección Reportes del Sistema." |

### Buenas prácticas al trabajar con Claude Code

- Pide un plan antes de escribir código en tareas grandes, y apruébalo o corrígelo antes de que empiece.
- Una pantalla o un componente por tarea; tareas cortas dan resultados más consistentes.
- Adjunta la captura de Figma de la pantalla en el prompt cuando la tengas.
- Cuando una corrección aplique a todo el proyecto, agrégala a `CLAUDE.md` para que no se repita el error.

## Decisiones tomadas y preguntas abiertas

Diez de los once puntos quedaron decididos el 09/10/2026; solo falta el cuadro de criterios de alarmas de stock.

| Tema | Decisión |
| --- | --- |
| Países de la fase 1 | Perú, Ecuador, Bolivia, Colombia, Chile y México, cada uno con su moneda, impuesto, identificador tributario y formatos bancarios (sección 7) |
| Terminales POS y código de comercio | Se elimina la pantalla. Solo queda la vinculación de usuarios ValidCode a locales |
| Funciones actuales sin lugar en el RFP | Se migran o fusionan según la sección 4 |
| Roles | Personalizables: el administrador crea roles con la matriz de permisos; los perfiles de la sección 5 son plantillas iniciales. Los aprobadores de cada operación también se configuran |
| Identidad de marca | Se usan los tokens del Figma de Enjoy con Giftealo como capa de marca. Los logos de Zonacards y Giftealo llegan durante la maquetación. La tipografía se cambia con una sola variable CSS |
| Dashboard por defecto | Cada rol tiene un dashboard por defecto que fija el administrador; cada usuario puede personalizar el suyo y volver al del rol |
| Aviso antes del vencimiento | Configurable en días, por cliente, programa y campaña (el nivel más específico prevalece) |
| Modo oscuro | Incluido en la fase 1 |
| Tema de Keycloak | Promotick aplica el tema de login diseñado |
| Visor corporativo | Se adapta al design system Giftealo |

- [ ] **Abierta:** cuadro de criterios de alarmas de stock (C-043), necesario para el semáforo Normal / Bajo mínimo / Sobre máximo.
