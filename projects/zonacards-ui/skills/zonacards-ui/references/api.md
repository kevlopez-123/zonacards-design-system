# Referencia de API de @zonacards/ui

Generada desde el código (`node scripts/build-api-docs.mjs`). Para cada punto de entrada: componentes y directivas con su selector,
inputs (`[x]`), models (`[(x)]`, entrada y salida), outputs (`(x)`) y métodos públicos. "obligatorio" = input.required.
Importa siempre desde la subruta: `import { X } from '@zonacards/ui/<entrada>'`. Helpers sin UI (formatMoney, zcValidators…): sección `core`.

## `@zonacards/ui/accordion`

### `zc-accordion-item` · AccordionItemComponent

<zc-accordion-item title="…" subtitle="…" icon="…" [open]="true">contenido<zc-badge zcAccordionAside … /></zc-accordion-item> Encabezado con ícono, título, subtítulo, estado (slot zcAccordionAside) y flecha. Deshabilitado con [disabled].

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[title]` | `string` | **obligatorio** |  |
| `[subtitle]` |  | `''` |  |
| `[icon]` | `IconName \| null` | `null` |  |

```html
<zc-accordion-item title="¿Cuándo se activa un código?" [open]="true">Al enviarse por correo o WhatsApp, o al activarse de forma masiva. Un código creado no tiene saldo disponible.</zc-accordion-item>
```

### `zc-accordion` · AccordionComponent

<zc-accordion> · sobre spartan brain accordion. Flechas arriba/abajo, Inicio y Fin recorren los encabezados; Enter o Espacio abren.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[variant]` | `'card' \| 'flush'` | `'card'` |  |
| `[label]` |  | `''` | Título del grupo; en multiple agrega el botón Expandir todo / Contraer todo. |

```html
<zc-accordion type="single" label="Uno abierto a la vez (FAQ)">
```

Métodos: `toggleAll()` Expandir o contraer todo: solo los ítems habilitados.

## `@zonacards/ui/action-bar`

### `zc-action-bar` · ActionBarComponent

<zc-action-bar [count]="selection().length" [actions]="actions" (action)="run($event)" (cleared)="selection.set([])" /> Barra de acciones sobre una selección múltiple: "N seleccionados", las acciones y una X para quitar la selección. Aparece solo con `count` > 0 (y lo anuncia por voz). Por defecto flota abajo y al centro, sobre el contenido y respetando el área segura del dispositivo; con `[floati

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[count]` | `number` | **obligatorio** | Cuántos elementos están seleccionados; con 0 la barra no se dibuja. |
| `[actions]` | `ActionBarAction[]` | `[]` |  |
| `[floating]` |  | `true` |  |
| `(action)` | `string` |  | Id de la acción pulsada. |
| `(cleared)` | `void` |  | Se pulsó la X: quien la usa vacía su selección. |

```html
<zc-action-bar [count]="picked().length" [actions]="barActions()" [floating]="floatingBar()" (action)="barAction($event)" (cleared)="picked.set([])" />
```

## `@zonacards/ui/alert`

### `zc-alert` · AlertComponent

<zc-alert tone="warning" title="Stock bajo mínimo">Quedan 38 códigos…<button zcAlertAction …>Cargar lote</button></zc-alert> Aviso dentro de la página (no se cierra solo). Siempre ícono + título: nunca solo color. danger usa role="alert" (se anuncia de inmediato); el resto, role="status". Error de servidor de un formulario: tone="danger" al tope, con la referencia de correlación en el texto.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[tone]` | `AlertTone` | `'info'` |  |
| `[title]` | `string` | **obligatorio** |  |

```html
<zc-alert tone="warning" title="Antes de pagar">{{ n }}</zc-alert>
```

## `@zonacards/ui/announcement`

### `zc-announcement` · AnnouncementComponent

Anuncio y guía de inicio (o-commerce de index.html), con fondo de marca y cierre. Al cerrar se anuncia y no vuelve (la app guarda el cierre por usuario). Contenido libre: el texto destacado con <strong>. <zc-announcement label="Anuncio" [(open)]="promo">Aprovecha … <strong>20 % de descuento</strong> …</zc-announcement> <zc-onboarding title="Optimiza compras…" [steps]="pasos" [(open)]="guia" />

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[label]` | `string` | **obligatorio** |  |
| `[icon]` | `IconName` | `'l:sparkles'` |  |
| `[(open)]` |  | `true` |  |

```html
<zc-announcement label="Anuncio" [(open)]="annOpen">Aprovecha la promoción de este mes con <strong>20 % de descuento</strong> en tus gift cards</zc-announcement>
```

### `zc-onboarding` · OnboardingComponent

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[title]` | `string` | **obligatorio** |  |
| `[steps]` | `readonly string[]` | **obligatorio** |  |
| `[(open)]` |  | `true` |  |

```html
<zc-onboarding title="Optimiza compras, envío y control sin procesos manuales" [steps]="onboarding" [(open)]="onbOpen" />
```

## `@zonacards/ui/art`

### `zc-art` · ArtComponent

<zc-art category="Viajes" /> · ilustración de categoría que llena su contenedor (decorativa).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[category]` | `ArtCategory \| string` | **obligatorio** |  |
| `[size]` | `16 \| 20 \| 24 \| 32` | `32` |  |

```html
<zc-art category="Tecnología" [size]="20" />
```

## `@zonacards/ui/auth`

### `zc-auth` · AuthComponent

Organismo de autenticación (o-auth de index.html). · admin: Microsoft Entra ID (vía Keycloak) primero y correo para usuarios externos.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[variant]` | `AuthVariant` | `'admin'` |  |
| `[login]` | `(email: string, password: string) => Promise<LoginResult>` | **obligatorio** | Valida correo y contraseña (en la app, el servicio de identidad). |
| `[verifyOtp]` | `(code: string) => Promise<boolean>` | **obligatorio** |  |
| `[userName]` |  | `''` |  |
| `[forgot]` | `((email: string) => Promise<void>) \| null` | `(email: string) => Promise<void>` | Envía el enlace de recuperación (en la app, POST /auth/recuperar). Siempre se muestra "Revisa tu correo", exista o no la cuenta; solo un error de red o del servidor (promesa rechazada) muestra el avis |
| `[resendOtp]` | `(() => Promise<void>) \| null` | `() => Promise<void>` | Pide un nuevo código OTP. |
| `[headingLevel]` | `1 \| 2 \| 3 \| 4` | `1` | Nivel del título de cada vista (1 por defecto: la pantalla de acceso es la página). |
| `[termsUrl]` |  | `''` | Enlaces del pie legal; sin ambos no se muestra. |
| `[privacyUrl]` |  | `''` |  |
| `[verifyRecoveryCode]` | `((code: string) => Promise<boolean>) \| null` | `(code: string) => Promise<boolean>` | Valida un código de recuperación ("Usar otro método" en el paso OTP; sin función, la opción no aparece). |
| `[submitBlocked]` |  | `false` | Bloquea "Ingresar" mientras falte algo de la app, como el CAPTCHA de [zcAuthCaptcha] sin resolver. |
| `(signedIn)` | `void` |  |  |
| `(ssoStart)` | `SsoProvider` |  |  |

```html
<zc-auth #auth [variant]="$any(authVariant())" [login]="demoLogin" [verifyOtp]="demoOtp" userName="Ana" (signedIn)="toastDone()" (ssoStart)="ssoToast($event)" />
```

Métodos: `go(v: AuthView)` Cambia de vista y lleva el foco al título (se anuncia la pantalla nueva). · `setupDone()` La app lo llama cuando <zc-mfa-setup zcAuthMfaSetup> termina: completa el ingreso.

## `@zonacards/ui/autocomplete`

### `zc-autocomplete` · AutocompleteComponent

<zc-autocomplete> · texto libre con sugerencias (a diferencia del combobox, no obliga a elegir de una lista). Sugerencias desde 2 letras con 250 ms de espera, coincidencia resaltada, grupos, búsquedas recientes al enfocar vacío, "Buscando…", sin resultados con alternativa, "Crear" y "Buscar en todo". La lista va bajo el campo también en móvil. Escape cierra la lista; con la lista cerrada, borra el

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[options]` | `readonly ZcOption<T>[]` | `[]` | Opciones locales (se filtran aquí) o una búsqueda propia con `search`. |
| `[search]` | `((q: string) => Promise<ZcOption<T>[]> \| ZcOption<T>[]) \| null` | `(q: string) => Promise<ZcOption<T>[]> \| ZcOption<T>[]` |  |
| `[recentKey]` |  | `''` | Clave de las búsquedas recientes (una lista por campo). |
| `[placeholder]` |  | `''` |  |
| `[minChars]` |  | `2` |  |
| `[debounce]` |  | `250` |  |
| `[maxResults]` |  | `8` |  |
| `[allowCreate]` |  | `false` |  |
| `[searchAll]` |  | `false` |  |
| `[disabled]` |  | `false` |  |
| `[invalid]` |  | `false` |  |
| `[(value)]` |  | `''` |  |
| `(picked)` | `AutocompletePick<T>` |  |  |

```html
<zc-autocomplete [search]="globalSearch" recentKey="catalogo-global" [searchAll]="true" placeholder="Buscar campañas, clientes, marcas o lotes" (picked)="onPick($event)" />
```

## `@zonacards/ui/avatar`

### `zc-avatar-group` · AvatarGroupComponent

<zc-avatar-group label="4 aprobadores" [people]="aprobadores" [max]="3" /> · muestra hasta max y "+N". Único solapamiento permitido por las reglas (sección 16); por eso lleva data-allow-overlap para la auditoría.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[label]` | `string` | **obligatorio** |  |
| `[people]` | `AvatarPerson[]` | **obligatorio** |  |
| `[max]` |  | `3` |  |
| `[size]` | `AvatarSize` | `'sm'` |  |

```html
<zc-avatar-group label="5 aprobadores" [people]="aprobadores" [max]="3" />
```

### `zc-avatar` · AvatarComponent

<zc-avatar name="Lucía Mendoza" [src]="url" presence /> · sobre spartan avatar. Iniciales si no hay imagen o si falla. shape="square" para empresas. Se anuncia como imagen con el nombre.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[name]` | `string` | **obligatorio** |  |
| `[src]` | `string \| null` | `null` |  |
| `[size]` | `AvatarSize` | `'md'` |  |
| `[shape]` | `'circle' \| 'square'` | `'circle'` |  |
| `[presence]` |  | `false` |  |
| `[initials]` |  | `''` | Iniciales propias cuando el nombre no las da bien ("Interbank" → "IB"). |
| `[tone]` | `'neutral' \| 'brand'` | `'neutral'` | brand: fondo secundario de la marca (empresas y clientes, como el avatar cuadrado de index.html). |

```html
<zc-avatar name="Ana Torres" size="sm" />
```

## `@zonacards/ui/badge`

### `zc-badge` · BadgeComponent

Estado: siempre ícono + texto, nunca solo color.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[tone]` | `Tone` | `'neutral'` |  |
| `[icon]` | `IconName \| null` | `null` |  |

```html
<zc-badge [tone]="s.tone" [icon]="$any(s.icon)">{{ s.labelKey | transloco }}</zc-badge>
```

## `@zonacards/ui/brand-logo`

### `zc-brand-logo` · BrandLogoComponent

<zc-brand-logo name="Repsol" [src]="logoUrl" /> · logo circular de la marca sobre la imagen del producto (centrado). Sin [src] muestra el nombre en mayúsculas (máx. 8 letras). Decorativo: el nombre ya está en el título de la tarjeta.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[name]` | `string` | **obligatorio** |  |
| `[src]` | `string \| null` | `null` |  |

```html
<zc-brand-logo [name]="p.brand" />
```

## `@zonacards/ui/breadcrumbs`

### `zc-breadcrumbs` · BreadcrumbsComponent

<zc-breadcrumbs [items]="…" /> · migas de pan, solo desde el tercer nivel. Desktop: ruta completa. Móvil (menos de 768 px): Inicio, "…", padre y actual; "…" muestra la ruta completa. El primer elemento lleva el ícono de inicio; el actual tiene aria-current="page".

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[items]` | `readonly Crumb[]` | **obligatorio** |  |

```html
<zc-breadcrumbs [items]="crumbs" />
```

## `@zonacards/ui/bulk-import`

### `zc-bulk-import` · BulkImportComponent

<zc-bulk-import [columns] [keyOf] (imported)> · importación masiva desde Excel o CSV: 1) plantilla descargable (hoja de datos con ejemplo y hoja de instrucciones), 2) subir el archivo, que se valida fila por fila en el navegador (una fila mala no frena a las demás) con la tabla Fila

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[columns]` | `readonly BulkColumn[]` | **obligatorio** |  |
| `[keyOf]` | `((v: BulkValues) => string) \| undefined` | `(v: BulkValues) => string` | Llave que identifica cada fila para rechazar repetidas ("el correo"). |
| `[maxRows]` |  | `1000` |  |
| `[maxMb]` |  | `5` |  |
| `[templateName]` |  | `'plantilla'` | Nombre de la plantilla descargada ("plantilla-destinatarios-2026-11-20.xlsx"). |
| `[busy]` |  | `false` |  |
| `(imported)` | `BulkValues[]` |  | Filas válidas, con sus valores convertidos. |

```html
<zc-bulk-import [columns]="importColumns" [keyOf]="importKey" [maxRows]="500" templateName="plantilla-destinatarios" (imported)="imported.set($event)" />
```

Métodos: `downloadErrors(it: UploadItem)` Informe de errores: CSV con Fila, Columna y Error.

## `@zonacards/ui/bullet`

### `zc-bullet` · BulletComponent

<zc-bullet [value]="38" [min]="50" [reorder]="66" [max]="160" label="Stock…" /> · medidor de stock (tarjeta de stock de Cards). Franjas: bajo el mínimo (peligro), rango sano (éxito) y sobre el máximo (aviso); barra = valor, marca = punto de pedido. Los textos (cabecera y leyenda) los pone quien lo usa con [head] y [legend]; el medidor es role="img" con [label].

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[value]` | `number` | **obligatorio** |  |
| `[min]` | `number` | **obligatorio** |  |
| `[max]` | `number` | **obligatorio** |  |
| `[reorder]` | `number \| null` | `null` |  |
| `[scale]` | `number \| null` | `null` | Fin de la escala; por defecto 1,25 × máximo. |
| `[label]` | `string` | **obligatorio** |  |

```html
<zc-bullet [value]="38" [min]="50" [reorder]="66" [max]="160" [scale]="200" label="Stock 38, mínimo 50, máximo 160, punto de pedido 66">
```

## `@zonacards/ui/button`

### `button[zcButton], a[zcButton]` · ButtonDirective

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[variant]` | `ButtonVariants['variant']` | `'primary'` |  |
| `[size]` | `ButtonVariants['size']` | `'md'` |  |
| `[block]` |  | `false` |  |
| `[loading]` |  | `false` |  |
| `[type]` | `'button' \| 'submit' \| 'reset'` | `'button'` |  |
| `[class]` |  | `''` |  |

```html
<button zcButton>
```

## `@zonacards/ui/calendar`

### `zc-calendar` · CalendarComponent

<zc-calendar> · un mes, de lunes a domingo (rejilla ARIA con foco itinerante). Flechas: día y semana

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(month)]` | `IsoDate` | **obligatorio** | Primer día del mes visible. |
| `[selected]` | `IsoDate \| null` | `null` |  |
| `[rangeStart]` | `IsoDate \| null` | `null` |  |
| `[rangeEnd]` | `IsoDate \| null` | `null` |  |
| `[min]` | `IsoDate \| null` | `null` |  |
| `[max]` | `IsoDate \| null` | `null` |  |
| `[unavailable]` | `((d: IsoDate) => boolean) \| null` | `(d: IsoDate) => boolean` | Fechas que no se pueden elegir además de las que quedan fuera de [min, max] (feriados, días sin cupo). Una función nueva cada vez que cambia la regla. |
| `[today]` | `IsoDate` | **obligatorio** |  |
| `[(focusDay)]` | `IsoDate` | **obligatorio** | Día con foco itinerante; puede cambiar de mes con el teclado. |
| `[hideOutside]` |  | `false` |  |
| `[showPrev]` |  | `true` |  |
| `[showNext]` |  | `true` |  |
| `[autoFocus]` |  | `true` | Tomar el foco al cambiar focusDay (solo cuando el usuario navega en esta rejilla). |
| `(pick)` | `IsoDate` |  |  |
| `(hover)` | `IsoDate` |  |  |

## `@zonacards/ui/captcha`

### `zc-captcha` · CaptchaComponent

<zc-captcha provider="turnstile" siteKey="…" [(token)]="token" /> · verificación anti-bot para formularios públicos (consulta de saldo, registro, recuperar contraseña).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[provider]` | `ZcCaptchaProvider` | `'turnstile'` |  |
| `[siteKey]` | `string` | **obligatorio** | Clave pública del sitio (la secreta vive solo en el servidor). |
| `[action]` |  | `''` | Acción para los reportes del proveedor (Turnstile): "consulta-saldo". |
| `[(token)]` |  | `''` | Token resuelto; vacío mientras no se verifica o cuando vence. |
| `(expired)` | `void` |  |  |

Métodos: `reset()` Nuevo desafío: después de un envío (el token es de un solo uso) o si el servidor lo rechazó.

## `@zonacards/ui/card`

### `[zcCardMedia]` · CardComponent

Slots de <zc-card>: imagen arriba a sangre, inicio del encabezado (avatar), extremo del encabezado (menú o estado) y pie.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[title]` | `string` | **obligatorio** |  |
| `[subtitle]` |  | `''` |  |
| `[icon]` | `IconName \| null` | `null` |  |
| `[link]` | `string \| unknown[] \| null` | `null` |  |

## `@zonacards/ui/carousel`

### `ng-template[zcSlide]` · CarouselComponent

Contenido de cada diapositiva: <ng-template zcSlide let-item let-i="index">…</ng-template>.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[label]` | `string` | **obligatorio** |  |
| `[items]` | `readonly T[]` | **obligatorio** |  |
| `[itemLabel]` | `(it: T) => string` | `it: T` |  |

```html
<ng-template zcSlide let-p>
```

## `@zonacards/ui/charts`

### `zc-chart` · ChartComponent

<zc-chart kind="line" title="Las redenciones crecen 12 % en octubre" [data]="…"> filtros </zc-chart> · Título con la conclusión y subtítulo con métrica, periodo y país. Descargar solo con ícono (PNG, Excel, CSV con los filtros aplicados). Vista Gráfico/Datos; los filtros propios del gráfico van como contenido ([zcChartFilters]).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[kind]` | `ChartKind` | **obligatorio** |  |
| `[title]` | `string` | **obligatorio** | La conclusión, no el nombre de la métrica: "Gastronomía lidera las redenciones". |
| `[subtitle]` |  | `''` |  |
| `[data]` | `ChartData \| null` | `null` |  |
| `[loading]` |  | `false` |  |
| `[error]` |  | `false` |  |
| `[reference]` |  | `''` |  |
| `[categoryLabel]` |  | `''` | Encabezado de la primera columna en Datos y descargas ("Día", "Cliente"). |
| `[totalLabel]` |  | `''` | Rótulo bajo el total de la dona. |
| `[format]` | `((v: number) => string) \| null` | `(v: number) => string` | Formato de los valores (montos con formatMoney); por defecto, número del idioma. |
| `(retry)` | `void` |  |  |
| `[frame]` |  | `true` | false: sin borde, fondo ni título visible (el título queda para lectores de pantalla), con Gráfico/Datos y la descarga en una sola fila. Para un gráfico dentro de un widget o una tarjeta que ya tiene  |
| `[height]` | `string \| null` | `null` | Alto del gráfico ("160px", "12rem"); por defecto el token --chart-h (240 px, 280 desde tablet). |

```html
<zc-chart kind="line" title="Las redenciones crecen al ritmo de las emisiones" [subtitle]="'Códigos por día · ' + periodText(trendPeriod()) + ' · ' + countryText(trendCountry())"
  [data]="trend()" categoryLabel="Día" [loading]="chartState() === 'loading'" [error]="chartState() === 'error'" reference="ZC-91C0-7F2A" (retry)="retryChart()">
```

### `zc-map` · MapComponent

<zc-map label="Mapa de locales por ciudad" [points]="ciudades" [scope]="['Perú', 'Chile']" unit="locales" /> Mapa de puntos (o-media de index.html) sobre ECharts con los límites de países en public/geo/latam.json (Natural Earth, dominio público): funciona sin teselas externas. Tamaño del punto = cantidad. Colores de tokens (--map-*, --chart-1, --brand-accent). Para lectores de pantalla, la lista d

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[label]` | `string` | **obligatorio** |  |
| `[points]` | `readonly ZcMapPoint[]` | **obligatorio** |  |
| `[scope]` | `readonly string[]` | `[]` | Códigos de país del alcance (se pintan con --map-scope). |
| `[unit]` |  | `''` |  |

```html
<zc-map label="Mapa de locales por ciudad" [points]="cities" [scope]="scope" unit="locales" />
```

## `@zonacards/ui/chat`

### `zc-chat` · ChatComponent

Centro de ayuda y chat (o-chat de index.html): burbujas con estado de envío y lectura, indicador de escritura, respuestas rápidas, adjuntos, enlaces a artículos y paso a un asesor. Enter envía y Shift + Enter hace un salto de línea. El componente solo dibuja y emite (send); las respuestas las agrega la app.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[title]` |  | `''` |  |
| `[status]` |  | `''` |  |
| `[messages]` | `ChatMessage[]` | `[]` |  |
| `[quick]` | `string[]` | `[]` |  |
| `[typing]` |  | `false` |  |
| `(send)` | `string` |  |  |
| `(human)` | `void` |  |  |
| `(openArticle)` | `ChatMessage` |  |  |

```html
<zc-chat title="Ayuda Zonacards" status="Asistente · un asesor responde en menos de 5 min" [messages]="chat()" [quick]="quick" [typing]="typing()"
  (send)="chatSend($event)" (human)="chatSend('Quiero hablar con un asesor')" />
```

## `@zonacards/ui/checkbox`

### `zc-checkbox-group` · CheckboxGroupComponent

<zc-checkbox-group label="Canales de aviso" [options]="canales" [(value)]="elegidos" hint="Elige al menos uno." /> Varias casillas con una sola etiqueta: el grupo se anuncia ("Canales de aviso, grupo") y la ayuda o el error quedan enlazados. `value` es la lista de valores marcados. Con `selectAllLabel` agrega arriba "Seleccionar todo", que queda a medias cuando hay algunas marcadas. Funciona con [

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[label]` | `string` | **obligatorio** |  |
| `[options]` | `readonly CheckboxOption[]` | `[]` |  |
| `[(value)]` | `readonly string[]` | `[]` |  |
| `[hint]` |  | `''` |  |
| `[error]` |  | `''` |  |
| `[required]` |  | `false` |  |
| `[disabled]` |  | `false` |  |
| `[orientation]` | `'vertical' \| 'horizontal'` | `'vertical'` |  |
| `[selectAllLabel]` |  | `''` | Texto de "Seleccionar todo" (sin él no hay casilla padre). |

```html
<zc-checkbox-group label="CheckboxGroup · Canales de aviso" [options]="canalesOpts" [(value)]="canalesAviso" selectAllLabel="Todos los canales" hint="Elige al menos uno." />
```

### `zc-checkbox` · CheckboxComponent

<zc-checkbox [(checked)]="x" description="…">Etiqueta</zc-checkbox> · sobre spartan checkbox. Toda la fila es clicable (48 px, 56 px en táctil); Espacio alterna. Indeterminado para "Seleccionar todo". Funciona con [(checked)] o con formularios reactivos (formControl).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(checked)]` |  | `false` |  |
| `[(indeterminate)]` |  | `false` |  |
| `[description]` |  | `''` |  |
| `[disabled]` |  | `false` |  |
| `[invalid]` |  | `false` |  |
| `[name]` | `string \| null` | `null` |  |
| `[ariaLabel]` |  | `''` | Sin texto visible (celdas de tabla): nombre accesible y fila compacta de 32 px. |

```html
<zc-checkbox [(checked)]="incluir">Incluir en liquidaciones</zc-checkbox>
```

## `@zonacards/ui/checkout`

### `zc-cart` · CartComponent

<zc-cart [(lines)]="carrito" country="pe" [discount]="cupones" [fees]="cargos"> <zc-coupon-field zcCartCoupon … /> </zc-cart> Carrito con cantidades (1 a 10), quitar, cupón (contenido con zcCartCoupon), resumen con cargos explicados y total. Vacío: estado con [zcCartEmpty]. Lo usa el checkout (o-checkout de index.html) en la columna de resumen.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(lines)]` | `ZcCartLine[]` | **obligatorio** |  |
| `[country]` | `CountryCode` | **obligatorio** |  |
| `[discount]` |  | `0` | Descuento de cupones (se limita al subtotal). |
| `[fees]` | `readonly ZcCartFee[]` | `[]` |  |
| `(removed)` | `ZcCartLine` |  |  |

```html
<zc-cart class="lg:sticky lg:top-22 lg:order-2" [(lines)]="cart" country="pe" [discount]="cpn.total()" [fees]="fees()">
```

### `ng-template[zcCheckoutStep]` · CheckoutStepsComponent

Cuerpo de un paso: <ng-template zcCheckoutStep>…</ng-template>, en el mismo orden que [steps].

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[steps]` | `readonly ZcCheckoutStep[]` | **obligatorio** |  |
| `[(current)]` |  | `0` |  |

```html
<ng-template zcCheckoutStep>
```

Métodos: `go(i: number)` Cambia de paso y lleva el foco a su título (lectores de pantalla oyen el paso nuevo).

## `@zonacards/ui/chip`

### `zc-chip` · ChipComponent

Chip = dato removible o seleccionable (el estado va en zc-badge). · estático: <zc-chip label="Gastronomía" />

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[label]` | `string` | **obligatorio** |  |
| `[icon]` | `IconName \| null` | `null` | Ícono decorativo antes del texto (chips de contexto: "Actualizado hace 3 horas"). |
| `[removable]` |  | `false` |  |
| `[selectable]` |  | `false` |  |
| `[(selected)]` |  | `false` |  |
| `[invalid]` |  | `false` |  |
| `[disabled]` |  | `false` |  |
| `(remove)` | `void` |  |  |

```html
<zc-chip label="País: Perú" [removable]="true" (remove)="paisChip.set(false)" />
```

## `@zonacards/ui/code-block`

### `zc-code-block` · CodeBlockComponent

<zc-code-block [code]="payload" language="json" title="Respuesta del webhook" /> · código o JSON de solo lectura (logs, API, webhooks, auditoría). Acepta un objeto en [code] y lo formatea como JSON. Resaltado con los tokens --code-* (claro y oscuro), números de línea opcionales, salto de línea opcional, alto máximo con desplazamiento y botón de copiar. No ejecuta ni interpreta HTML.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[code]` | `string \| object \| null` | **obligatorio** | Texto o un objeto (se formatea como JSON con 2 espacios). |
| `[language]` | `ZcCodeLanguage` | `'json'` |  |
| `[title]` |  | `''` |  |
| `[lineNumbers]` |  | `false` |  |
| `[wrap]` |  | `false` | Salto de línea en vez de desplazamiento horizontal (logs largos). |
| `[copyable]` |  | `true` |  |
| `[maxHeight]` | `string \| null` | `null` | Alto máximo con desplazamiento ("320px"); por defecto sin límite. |

```html
<zc-code-block title="Respuesta del webhook · pedido.creado" language="json" [code]="webhook" [lineNumbers]="true" maxHeight="280px" />
```

## `@zonacards/ui/color`

### `zc-color-field` · ColorFieldComponent

Campo de color con muestra, HEX y contraste contra un color de texto (against, por defecto blanco). La muestra abre zc-color-picker en popover (bottom sheet en móvil); Cancelar o Escape vuelven al color anterior. El mensaje lo calcula el campo: enlázalo al zc-field con una referencia. <zc-field label="Color del botón" [error]="c.error()" [success]="c.success()"><zc-color-field #c [(value)]="hex" /

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(value)]` |  | `'#172948'` |  |
| `[against]` |  | `'#FFFFFF'` | Color del texto que irá sobre este color (o del fondo sobre el que irá). |
| `[disabled]` |  | `false` |  |

```html
<zc-color-field #cp [(value)]="colorPlantilla" />
```

### `zc-color-picker` · ColorPickerComponent

<zc-color-picker [(value)]="hex" /> · área de saturación y brillo, tono, HEX y RGB, paleta de marca, recientes, cuentagotas (si el navegador lo permite) y contraste con texto blanco y negro. Teclado: flechas en el área (Shift = 10 %), flechas en el tono y en R/G/B (Shift = 10), flechas en las paletas. [footer]="true" agrega Cancelar/Aplicar (lo usa zc-color-field dentro del popover).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(value)]` |  | `'#172948'` |  |
| `[palette]` |  | `BRAND_PALETTE` |  |
| `[footer]` |  | `false` |  |
| `(applied)` | `string` |  |  |
| `(cancel)` | `void` |  |  |

```html
<zc-color-picker [(value)]="inlineHex" />
```

Métodos: `apply()` Guarda el color en recientes (máximo 8) y lo confirma.

## `@zonacards/ui/command-palette`

### `zc-command-palette` · CommandPaletteComponent

<zc-command-palette [commands]="…" (run)="ir($event)" /> · búsqueda global (Ctrl + K o el botón Buscar). Diálogo centrado (como .cmd de index.html): un campo, la lista filtrada sin tildes, ↑ ↓ para moverse, Enter abre, Escape cierra y el foco vuelve a donde estaba. Ctrl + K abre y cierra desde cualquier pantalla.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[commands]` | `ZcCommand[]` | **obligatorio** |  |
| `[placeholder]` |  | `''` |  |
| `(run)` | `ZcCommand` |  |  |

## `@zonacards/ui/commerce`

### `zc-cta-card` · CtaCardComponent

<zc-cta-card title="¿Eres una empresa?" text="…" icon="s:buildings-2"><a zcButton variant="secondary" size="sm">Más información</a></zc-cta-card> Llamada a la acción del sitio (o-commerce): fondo con el acento de marca y esquina con el ícono.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[title]` | `string` | **obligatorio** |  |
| `[text]` | `string` | **obligatorio** |  |
| `[icon]` | `IconName` | **obligatorio** |  |

```html
<zc-cta-card title="¿Tienes una tarjeta regalo Giftealo?" text="Aprende a canjearla en simples pasos." icon="s:gift"><button zcButton variant="secondary" size="sm">Te explicamos</button></zc-cta-card>
```

### `zc-help-card` · HelpCardComponent

<zc-help-card title="¿Necesitas ayuda?" text="Te asesoramos gratis…"><button zcButton variant="secondary" size="sm">Escríbenos</button></zc-help-card> Ayuda en el checkout y en flujos largos (o-checkout): fondo informativo e ícono a la derecha.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[title]` | `string` | **obligatorio** |  |
| `[text]` | `string` | **obligatorio** |  |
| `[icon]` | `IconName` | `'s:headphones-round'` |  |

```html
<zc-help-card title="¿Necesitas ayuda?" text="Te asesoramos gratis para que completes tu compra.">
  <button zcButton variant="secondary" size="sm"><zc-icon name="s:chat-round-dots" [size]="16" />Escríbenos</button>
  </zc-help-card>
```

### `zc-amount-picker` · AmountPickerComponent

<zc-field label="¿De cuánto será el valor?" [required]="true" [hint]="a.message()" [error]="a.error()"> <zc-amount-picker #a [amounts]="[50, 100, 150, 200]" [soldOut]="[500]" country="pe" [(value)]="monto" /> </zc-field> Montos como radiogroup (flechas recorren y eligen), "Otro" abre un monto libre entre min y max, agotados tachados.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[amounts]` | `number[]` | **obligatorio** |  |
| `[soldOut]` | `number[]` | `[]` |  |
| `[allowOther]` |  | `true` |  |
| `[min]` |  | `10` |  |
| `[max]` |  | `1000` |  |
| `[country]` | `CountryCode` | `'pe'` |  |
| `[(value)]` | `number \| null` | `null` | Monto elegido; null si "Otro" está vacío. |

```html
<zc-amount-picker #a [amounts]="[50, 100, 150, 200]" [soldOut]="[500]" [min]="10" [max]="1000" country="pe" [(value)]="monto" />
```

### `zc-coupon-field` · CouponFieldComponent

Cupones y gift cards: hasta max códigos con reglas de combinación. <zc-field label="Cupones y gift cards" [optional]="true" [hint]="c.message()" [error]="c.error()" [success]="c.success()"> <zc-coupon-field #c [validate]="validar" [subtotal]="200" country="pe" [(value)]="aplicados" /> </zc-field> validate consulta el código (en la app, el servicio); el campo resuelve repetidos, "no combinable" y e

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[validate]` | `(code: string) => Promise<CouponCheck>` | **obligatorio** |  |
| `[subtotal]` |  | `0` |  |
| `[country]` | `CountryCode` | `'pe'` |  |
| `[max]` |  | `3` |  |
| `[hint]` |  | `''` | Texto de ayuda cuando no hay otro mensaje (ej. códigos de prueba). |
| `[(value)]` | `Coupon[]` | `[]` |  |

```html
<zc-coupon-field #cpn [validate]="validateCoupon" [subtotal]="subtotal()" country="pe" [(value)]="coupons" hint="Prueba BIENVENIDA10 o NAVIDAD20." />
```

### `zc-password-field` · PasswordFieldComponent

Contraseña nueva con medidor de seguridad y requisitos. <zc-field label="Crea una contraseña" [required]="true"><zc-password-field #pw [(value)]="clave" /></zc-field> <zc-password-rules [for]="pw" /> (los requisitos pueden ir al lado o debajo) El medidor no reemplaza el mensaje del campo: los errores siguen en el zc-field.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(value)]` |  | `''` |  |

```html
<zc-password-field #pw [(value)]="clave" />
```

### `zc-password-rules` · PasswordRulesComponent

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[for]` | `PasswordFieldComponent` | **obligatorio** |  |
| `[id]` |  | ``zc-pwr-${++seq}`` |  |

```html
<zc-password-rules [for]="pw" class="md:pt-7" />
```

### `zc-product-card` · ProductCardComponent

<zc-product-card name="Tarjeta Repsol" brand="Repsol" category="Viajes" [price]="50" country="pe" /> · producto del e-commerce (o-commerce y o-facets de index.html): imagen con logo, cinta "Nueva", favorito (aria-pressed), "Desde" y comprar. Imagen propia con [image]; si no, zc-art de la categoría.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[name]` | `string` | **obligatorio** |  |
| `[brand]` | `string` | **obligatorio** |  |
| `[category]` |  | `'Gastronomía'` |  |
| `[description]` |  | `''` |  |
| `[price]` | `number` | **obligatorio** |  |
| `[country]` | `CountryCode` | **obligatorio** |  |
| `[image]` | `string \| null` | `null` |  |
| `[logo]` | `string \| null` | `null` |  |
| `[isNew]` |  | `false` |  |
| `[(favorite)]` |  | `false` |  |
| `(buy)` | `void` |  |  |

```html
<zc-product-card [name]="'Tarjeta ' + p.brand" [brand]="p.brand" [category]="p.cat" [description]="p.desc" [price]="p.price" country="pe" [isNew]="i < 2" />
```

## `@zonacards/ui/copy-button`

### `zc-copy-button` · CopyButtonComponent

<zc-copy-button [value]="apiKey" label="Copiar la clave de API" /> · copia un texto al portapapeles.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[value]` | `string` | **obligatorio** | Texto que se copia. |
| `[label]` |  | `''` | Nombre accesible ("Copiar el número de pedido"); por defecto "Copiar". |
| `[showText]` |  | `false` |  |
| `[variant]` | `'ghost' \| 'outline'` | `'ghost'` |  |
| `(copied)` | `string` |  |  |
| `(failed)` | `void` |  |  |

```html
<zc-copy-button value="TX-8F3A-21C9" label="Copiar el ID de transacción" />
```

## `@zonacards/ui/core`

Incluye las reglas de dominio de `@zonacards/tokens/domain` (reexportadas): montos, fechas, teléfonos, claves, estados, color, exportación e importación.

Funciones: 

- `cn(...inputs: ClassValue[])` · Une clases de Tailwind resolviendo conflictos (la última gana).
- `rememberMenuTrigger(el: HTMLElement)` · zc-menu lo llama al elegir un ítem: su disparador es el destino de reserva del overlay que abra esa acción.
- `restoreFocus(target: HTMLElement | null | undefined): boolean` · Enfoca target si sigue en el documento; si no, el disparador del último menú. Devuelve si pudo enfocar algo.
- `fieldError(control: AbstractControl, overrides: Record<string, string> = {}): Signal<string | null>` · Mensaje de error de un control para <zc-field [error]>, en el idioma activo. Solo aparece después de salir del campo (touched) o al intentar enviar (markAllAsTouched). Cada clave de error se traduce desde "validacion.<cl
- `applyServerErrors(form: AbstractControl, errors: ServerErrors): string[]` · Pone los errores del servidor en sus controles (equivale a `validationErrors` del formulario de HeroUI): cada mensaje queda como error `server` del control (los campos anidados se nombran con punto, `direccion.calle`) y 
- `focusFirstInvalid(root: ParentNode, frames = 8): Promise<HTMLElement | null>` · Lleva el foco al primer campo con error dentro de `root` (en el orden de la pantalla) y lo muestra si estaba fuera de vista. El error y `aria-invalid` aparecen un instante después de la validación (los mensajes se arman 
- `mergeTranslations(base: Translation, over: Translation): Translation` · Combina traducciones en profundidad: las claves de `over` reemplazan a las de `base`.
- `rejectsInput(e: InputEvent, allowed: RegExp): boolean` · Filtro de caracteres al escribir o pegar (beforeinput). - Una tecla no permitida se bloquea. - Un texto pegado con caracteres mezclados ("987-654-321") entra y el componente lo limpia en (input). Devuelve true si había c
- `injectLang(): Signal<'es' | 'en'>` · Idioma activo como signal ('es' | 'en'), para formatear fechas y montos con Intl.
- `injectTranslate(): (key: string, params?: Record<string, unknown>) => string` · translate() que se puede usar dentro de computed(): se recalcula al cambiar de idioma y al terminar de cargar las traducciones (sin esto, un computed evaluado antes de la carga se queda con la clave, ej. "ui.codigoPais")
- `animateOut(el: Element | null | undefined, frames: Keyframe[], duration: number, done: ()`
- `sheetOut(sheet: Element | null | undefined, backdrop: Element | null | undefined, done: ()` · Bottom sheet: baja hasta salir por el borde inferior; el scrim se desvanece a la vez.
- `drawerOut(drawer: Element | null | undefined, backdrop: Element | null | undefined, done: ()` · Drawer lateral: sale por la derecha.
- `modalOut(modal: Element | null | undefined, backdrop: Element | null | undefined, done: ()` · Modal: se desvanece y se achica apenas (inverso de su entrada).
- `popoverOut(panel: Element | null | undefined, done: ()` · Popover y menú: se desvanecen hacia su ancla.
- `placeIndicator(indicator: HTMLElement | null | undefined, active: HTMLElement | null | undefined, animate: boolean): void` · Indicador deslizante (pestañas, control segmentado): lo lleva bajo el elemento activo con transform y ancho. La primera vez se coloca sin animar; después se desliza con la curva estándar.
- `injectMedia(query: string): Signal<boolean>` · Una media query como signal; se desuscribe al destruir el componente.
- `stripAccents(s: string)`
- `normalizeHeader(s: string)` · Encabezado normalizado: sin tildes, sin «*», en minúsculas.
- `parseBulkDate(s: string): string | null` · Fecha AAAA-MM-DD, dd/mm/aaaa o número de serie de Excel → «AAAA-MM-DD» (o `null`).
- `processMatrix(columns: BulkColumn[], matrix: string[][], keyOf?: (v: BulkValues)` · Procesa la matriz de una hoja. `keyOf` arma la llave que identifica cada fila (las repetidas se rechazan desde la segunda).
- `parseCsv(text: string): string[][]` · Texto simple de un CSV (comillas dobles, coma o punto y coma como separador, BOM) → matriz de textos.
- `bulkTemplate(columns: readonly BulkColumn[], l: BulkTemplateLabels): XlsxSheet[]` · Plantilla descargable: hoja «Datos» (encabezados, con «*» en los obligatorios, y una fila de ejemplo) y hoja de instrucciones con qué escribir en cada columna. Se escribe con `toXlsxSheets`.
- `isHex(v: string): boolean`
- `hexToRgb(h: string): Rgb`
- `rgbToHex(r: number, g: number, b: number): string`
- `rgbToHsv(r: number, g: number, b: number): Hsv`
- `hsvToRgb(h: number, s: number, v: number): Rgb`
- `hsvToHex(h: number, s: number, v: number)`
- `hexToHsv(hex: string): Hsv`
- `luminance(hex: string): number` · Luminancia relativa WCAG.
- `contrastRatio(a: string, b: string): number` · Contraste WCAG entre dos colores hexadecimales (1 a 21).
- `contrastLevel(r: number): ContrastLevel`
- `bestTextOn(bg: string): '#FFFFFF' | '#000000'` · Color de texto con mejor contraste sobre un fondo.
- `normalizeHexInput(raw: string): string` · Normaliza lo que se escribe en un campo hexadecimal: mayúsculas, # al inicio y solo dígitos hexadecimales.
- `countryByCode(code: CountryCode): Country`
- `dialCountry(code: string): DialCountry`
- `isScopeCountry(code: string): code is CountryCode`
- `formatDate(d: Date, style: DateStyle, o: DateFormatOptions = {}): string`
- `isIsoDate(s: unknown): s is IsoDate`
- `isoToDate(iso: IsoDate): Date` · Medianoche UTC del día: úsala con formatDate(…, { timeZone: 'UTC' }).
- `todayIso(timeZone = 'America/Lima', now: Date = new Date()` · Hoy en la zona horaria del país de la operación.
- `addDays(iso: IsoDate, n: number): IsoDate`
- `addMonths(iso: IsoDate, n: number): IsoDate` · Suma meses al primer día del mes (navegación del calendario).
- `startOfMonth(iso: IsoDate): IsoDate`
- `endOfMonth(iso: IsoDate): IsoDate`
- `startOfWeek(iso: IsoDate): IsoDate` · Lunes de la semana del día.
- `daysInRange(from: IsoDate, to: IsoDate): number` · Días del rango contando ambos extremos.
- `sameMonth(a: IsoDate, b: IsoDate)`
- `monthGrid(month: IsoDate): IsoDate[]` · 42 días (6 semanas, de lunes a domingo) que cubren el mes.
- `maskDmy(raw: string): string` · Máscara dd/mm/aaaa mientras se escribe: solo dígitos y barras automáticas.
- `parseDmy(s: string): IsoDate | null` · "dd/mm/aaaa" → ISO, o null si el formato o la fecha no existen (31/02).
- `formatDmy(iso: IsoDate): string`
- `maskHm(raw: string): string` · Máscara hh:mm (24 h) mientras se escribe.
- `isValidHm(s: string): boolean`
- `timeSlots(from = '00:00', to = '23:30', step = 30): string[]` · Horas cada `step` minutos entre dos horas (incluidas).
- `formatRange(a: Date, b: Date, o: DateFormatOptions = {}): string` · Rango compacto: "1–15 mar 2026" (periodos, vigencias, filtros). Sin repetir mes ni año cuando coinciden.
- `formatRelative(d: Date, now: Date = new Date()` · "hace 3 horas", "mañana", "dentro de 3 días". Mostrar la fecha completa en tooltip.
- `toCsv(rows: Rows): string`
- `crc32(data: Uint8Array): number`
- `zipStore(files: readonly { name: string; data: string }[]): Uint8Array<ArrayBuffer>` · ZIP sin compresión (método 0): suficiente para un XLSX de pocas filas y sin dependencias.
- `toXlsxSheets(sheets: readonly XlsxSheet[]): Uint8Array<ArrayBuffer>` · Libro de Excel con una o más hojas (Office Open XML con cadenas en línea, ZIP sin compresión).
- `toXlsx(rows: Rows, sheetName = 'Datos'): Uint8Array<ArrayBuffer>` · Libro de una sola hoja.
- `pdfTextWidth(text: string, size: number, bold = false): number` · Ancho en puntos de un texto a ese tamaño (la negrita se aproxima con un 6 % más). Las letras con tilde miden como su base.
- `toPdf(rows: Rows, o: PdfOptions): Uint8Array<ArrayBuffer>`
- `exportFileName(title: string, ext: string, isoDate: string): string` · Nombre de archivo seguro: minúsculas, sin tildes, con fecha ISO. "ventas-por-dia-2026-10-10.xlsx".
- `downloadBlob(data: BlobPart, type: string, fileName: string)`
- `inflateRaw(datos: Uint8Array): Uint8Array` · Descomprime datos DEFLATE sin encabezado zlib (método 8 de los ZIP). Lanza `Error` si están dañados.
- `formatMoney(amount: number, country: CountryCode, opts: MoneyOptions = {}): string` · Monto completo con la moneda y los decimales del país.
- `formatMoneyWhole(amount: number, country: CountryCode, opts: MoneyOptions = {}): string` · Monto entero, sin decimales (chips de monto: "S/ 50").
- `formatNumber(n: number, country: CountryCode): string` · Número con los separadores del país, sin moneda ("1,000").
- `currencySymbol(country: CountryCode, opts: MoneyOptions = {}): string` · Moneda para el prefijo de un campo de monto: "S/", "Bs" o el código ("CLP") cuando el símbolo sería "$" (con 'auto').
- `formatMoneyCompact(amount: number, country: CountryCode, opts: MoneyOptions = {}): string` · Monto abreviado (K, M, MM) con un decimal y el separador del país. Menos de 1.000 solo pierde los decimales. Nunca se usa en tablas, exportaciones ni documentos.
- `passwordChecks(v: string): Record<PasswordRule, boolean>`
- `passwordScore(v: string): 0 | 1 | 2 | 3 | 4` · 0 = sin evaluar (vacía) · 1 a 4 = baja, media, buena, alta.
- `formatPhone(digits: string): string` · Número nacional en grupos de 3 ("987 654 321").
- `phoneDigits(raw: string, country: string): string` · Solo dígitos, recortado al largo del país.
- `isValidPhone(country: string, digits: string): boolean`
- `formatPhoneIntl(country: string, digits: string): string` · Formato internacional para mostrar o enviar: "+51 987 654 321".
- `nthOfMonth(iso: IsoDate)` · Semana del mes del día (0 = primera … 4 = quinta o última), para "el segundo lunes".
- `recurInvalid(r: RecurRule): 'days' | null` · La regla no produce fechas (semanal sin días).
- `occurrences(r: RecurRule, start: IsoDate, max: number): IsoDate[]` · Próximas fechas desde start (incluida) según la regla; como máximo max.
- `sortWeekdays(days: number[])` · Días ordenados de lunes a domingo (como se leen en la frase).
- `isValidRucPe(v: string): boolean` · Perú · RUC: 11 dígitos, prefijo 10/15/16/17/20 y verificador módulo 11.
- `isValidRucEc(v: string): boolean` · Ecuador · RUC: 13 dígitos, provincia 01–24 o 30 y establecimiento 001 en adelante.
- `nitCheckDigit(base: string): number` · Colombia · NIT: 9 dígitos + verificador (módulo 11 con pesos primos de la DIAN).
- `isValidNitCo(v: string): boolean`
- `rutCheckDigit(body: string): string` · Chile · RUT: cuerpo de 7 u 8 dígitos y verificador módulo 11 (0–9 o K).
- `isValidRutCl(v: string): boolean`
- `isValidRfcMx(v: string): boolean` · México · RFC: 3 (moral) o 4 (física) letras, fecha AAMMDD válida y homoclave de 3.
- `columnIndex(ref: string): number` · Índice de columna (0 = A) de una referencia de celda («C12»).
- `readXlsx(data: ArrayBuffer | Uint8Array): SheetRead[]` · Lee todas las hojas del libro. Lanza `InvalidWorkbookError` si el archivo no es un Excel válido.
- `serialToDate(n: number): string` · Fecha de un número de serie de Excel (días desde 1899-12-30) en formato AAAA-MM-DD.

## `@zonacards/ui/count`

### `zc-count` · CountComponent

<zc-count [value]="12" /> · cantidad (Count de index.html): neutro o peligro; variant="dot" es el punto de "sin leer". Badge = estado; Chip = dato; Count = cantidad. El punto necesita [label] ("Sin leer") porque no tiene texto.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[value]` | `number \| string` | `0` |  |
| `[variant]` | `'neutral' \| 'danger' \| 'dot'` | `'neutral'` |  |
| `[label]` |  | `''` |  |

```html
<zc-count [value]="12" label="12 elementos" />
```

## `@zonacards/ui/country-switcher`

### `zc-country-switcher` · CountrySwitcherComponent

País de operación en la barra superior (index.html: bandera + moneda). Abre la lista de países con moneda, identificador tributario y zona horaria; elegir uno filtra los datos y define moneda, impuesto y zona horaria. Popover en desktop y bottom sheet en móvil; flechas recorren y Enter o Espacio eligen. [allowed] limita la lista al alcance del rol: con un solo país se muestra fijo (sin menú) y un 

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(value)]` | `CountryCode` | `'pe'` |  |
| `[allowed]` | `readonly CountryCode[] \| null` | `null` | Países del alcance del rol; null = todos. |

## `@zonacards/ui/dashboard`

### `ng-template[zcWidgetBody]` · DashboardGridComponent

Cuerpo de los widgets: <ng-template zcWidgetBody let-id let-width="width">…</ng-template>.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[catalog]` | `readonly ZcWidgetDef[]` | **obligatorio** |  |
| `[defaults]` | `readonly string[]` | **obligatorio** |  |
| `[(layout)]` | `ZcWidget[]` | **obligatorio** |  |
| `(saved)` | `ZcWidget[]` |  |  |
| `[viewActions]` | `((w: ZcWidget) => ZcMenuItem[]) \| null` | `(w: ZcWidget) => ZcMenuItem[]` | Menú del widget fuera de la edición (acciones de la app); null o [] = sin menú. |
| `(widgetAction)` | `{ widget: ZcWidget; item: ZcMenuItem }` |  |  |

```html
<ng-template zcWidgetBody let-id let-width="width">
```

Métodos: `flexOf(w: ZcWidget)` Base de cada widget según las columnas (gap de 12 px); flex-grow con su proporción llena la fila. · `resizeStart(e: PointerEvent, w: ZcWidget)` Esquina: arrastrar en horizontal cambia el ancho a 1, 2 o 4 columnas.

## `@zonacards/ui/date-field`

### `zc-date-field` · DateFieldComponent

<zc-date-field [min]="hoy" [max]="…"> · se escribe dd/mm/aaaa (barras automáticas) o se elige en el calendario. Un solo ícono, a la derecha, abre el calendario (también Alt+↓). Atajos al pie: Hoy, +30 y +90 días; si el máximo es hoy o antes, Hoy, hace 7 y hace 30 días. Valor: fecha ISO "aaaa-mm-dd"; si lo escrito no es una fecha válida, el texto tal cual (zcValidators.date() lo marca).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[min]` | `IsoDate \| null` | `null` |  |
| `[max]` | `IsoDate \| null` | `null` |  |
| `[unavailable]` | `((d: IsoDate) => boolean) \| null` | `(d: IsoDate) => boolean` | Fechas que no se pueden elegir además de las que quedan fuera de [min, max]. |
| `[ariaLabel]` |  | `''` | Nombre accesible si no tiene un zc-field que lo nombre (por ejemplo, dentro de zc-datetime-field). |
| `[fieldLink]` |  | `true` | false: no toma el id ni la ayuda del zc-field que lo contiene. |
| `[timeZone]` |  | `'America/Lima'` | Zona horaria del país de la operación (define qué día es "hoy"). |
| `[shortcuts]` | `DateShortcut[] \| null` | `null` | Atajos al pie del calendario; vacío para ocultarlos. |
| `[disabled]` |  | `false` |  |
| `[invalid]` |  | `false` |  |
| `[(value)]` | `IsoDate \| string \| null` | `null` |  |

```html
<zc-date-field [min]="today" [value]="dest().date" (valueChange)="patchDest({ date: $any($event) })" />
```

## `@zonacards/ui/date-range`

### `zc-date-range` · DateRangeComponent

<zc-date-range> · periodo de reportes y filtros. Periodos predefinidos, personalizado con dos meses (uno en móvil), campos Desde/Hasta escribibles y "Comparar con el periodo anterior". Un solo ícono de calendario en el disparador; Aplicar confirma, Cancelar descarta. Valor: { from, to, preset, compare } con fechas ISO.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[placeholder]` |  | `''` |  |
| `[timeZone]` |  | `'America/Lima'` |  |
| `[allowFuture]` |  | `false` | Por defecto no se eligen fechas futuras (reportes). |
| `[maxDays]` | `number \| null` | `null` | Largo máximo del periodo en días (estancia o reporte con tope): al elegir el inicio, lo que lo pasaría queda deshabilitado. |
| `[unavailable]` | `((d: IsoDate) => boolean) \| null` | `(d: IsoDate) => boolean` | Fechas que no se pueden elegir; un periodo tampoco puede cruzarlas. Una función nueva cada vez que cambia la regla. |
| `[disabled]` |  | `false` |  |
| `[invalid]` |  | `false` |  |
| `[(value)]` | `DateRangeValue \| null` | `null` |  |

```html
<zc-date-range [(value)]="period" />
```

Métodos: `presetOff(p: RangePreset)` Un periodo predefinido más largo que el tope no se puede elegir.

## `@zonacards/ui/datetime-field`

### `zc-datetime-field` · DateTimeFieldComponent

<zc-field label="Envío programado"><zc-datetime-field [(value)]="envio" [min]="hoy" /></zc-field> Fecha y hora en un solo campo (equivale al `granularity` de DatePicker de HeroUI): un campo de fecha y uno de hora lado a lado, con un solo valor "aaaa-mm-ddThh:mm" (hora local de la operación, sin zona). Mientras falte una de las dos partes el valor es `null` y las dos partes se conservan en pantalla

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[min]` | `IsoDate \| null` | `null` |  |
| `[max]` | `IsoDate \| null` | `null` |  |
| `[unavailable]` | `((d: IsoDate) => boolean) \| null` | `(d: IsoDate) => boolean` |  |
| `[timeZone]` |  | `'America/Lima'` |  |
| `[timeFrom]` |  | `'00:00'` | Horas que se ofrecen en la lista (la hora también se puede escribir). |
| `[timeTo]` |  | `'23:30'` |  |
| `[step]` |  | `30` |  |
| `[ariaLabel]` |  | `''` | Nombre accesible si no hay un zc-field que lo nombre. |
| `[disabled]` |  | `false` |  |
| `[invalid]` |  | `false` |  |
| `[(value)]` | `string \| null` | `null` | "aaaa-mm-ddThh:mm" o `null` mientras falte una parte. |

```html
<zc-datetime-field [(value)]="envio" [min]="today" />
```

## `@zonacards/ui/delete-account`

### `zc-delete-account` · DeleteAccountComponent

<zc-delete-account [request] [maskedEmail] [sending] [submitting] [error] (sendCode) (submit) (back)> · eliminar mi cuenta (las tiendas de apps lo exigen). Explica qué pasa, pide un código que llega al correo y un motivo opcional, y registra una solicitud que la atiende el equipo: la cuenta sigue activa hasta entonces. Sin estado propio de red: la app envía el código, valida y registra.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[request]` | `DeletionRequest \| null` | `null` |  |
| `[maskedEmail]` | `string \| null` | `null` | Correo enmascarado ("a•••@empresa.com") una vez enviado el código; null antes. |
| `[sending]` |  | `false` |  |
| `[submitting]` |  | `false` |  |
| `[error]` | `string \| null` | `null` | Error de la app (código inválido, sin red); se muestra en el campo del código. |
| `[consequences]` | `readonly string[] \| null` | `null` | Consecuencias a mostrar; por defecto, las genéricas de la librería. |
| `(sendCode)` | `void` |  |  |
| `(submit)` | `DeletionSubmit` |  |  |
| `(back)` | `void` |  |  |

```html
<zc-delete-account [request]="delRequest()" [maskedEmail]="delMasked()" [sending]="delSending()" [submitting]="delSubmitting()" [error]="delError()"
  (sendCode)="delSendCode()" (submit)="delSubmit($event)" (back)="delReset()" />
```

## `@zonacards/ui/description-list`

### `zc-description-list` · DescriptionListComponent

<zc-description-list [items]="[{ term: 'Cliente', value: 'Interbank' }]" /> · pares dato–valor de una ficha (DescriptionList de index.html). layout="grid": dos columnas

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[items]` | `ZcDescription[]` | **obligatorio** |  |
| `[layout]` | `'grid' \| 'rows'` | `'grid'` |  |

```html
<zc-description-list [items]="lotData" />
```

## `@zonacards/ui/email-editor`

### `zc-email-editor` · EmailEditorComponent

<zc-email-editor [(blocks)]="correo" (test)="…" /> · editor de correo por bloques (o-email de index.html). Catálogo de bloques (título, texto, imagen, botón, giftcard, separador), lienzo con reordenar arrastrando (zcSortable), panel para editar el bloque elegido y vista previa en escritorio y celular. El lienzo usa tokens --email-* (el correo es claro).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(blocks)]` | `ZcEmailBlock[]` | **obligatorio** |  |
| `[(selected)]` | `string \| null` | `null` |  |
| `(test)` | `void` |  |  |

```html
<zc-email-editor [(blocks)]="email" [(selected)]="emailSel" (test)="toast.success('Correo de prueba enviado', { text: 'A ana.torres@promotick.com' })" />
```

Métodos: `add(type: ZcEmailBlockType)` Agrega después del bloque elegido (o al final) y lo deja seleccionado.

## `@zonacards/ui/error-page`

### `zc-error-page` · ErrorPageComponent

<zc-error-page code="404" icon="s:magnifer" title="No encontramos esta página" text="…" reference="ZC-…"> <a zcButton size="sm" routerLink="/">Ir al inicio</a><button zcButton variant="ghost" size="sm">Buscar</button> </zc-error-page> Páginas de error (o-errors): 404, 403, 500, 503, sin conexión y sesión expirada. Qué pasó, qué se conservó y qué hacer; nunca solo un código. Referencia solo cuando 

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[code]` |  | `''` |  |
| `[icon]` | `IconName` | **obligatorio** |  |
| `[title]` | `string` | **obligatorio** |  |
| `[text]` | `string` | **obligatorio** |  |
| `[reference]` |  | `''` |  |

```html
<zc-error-page [code]="p.code" [icon]="p.icon" [title]="p.title" [text]="p.text" [reference]="p.ref ? refId : ''">
  <button zcButton size="sm" (click)="toast.info(p.main, { text: 'Acción simulada.' })">{{ p.main }}</button>
  @if (p.alt) { <button zcButton variant="ghost" size="sm" (click)="toast.info(p.alt, { text: 'Acción simulada.' })">{{ p.alt }}</button> }
  </zc-error-page>
```

## `@zonacards/ui/facets`

### `zc-facets` · FacetsComponent

Filtros por facetas (o-facets de index.html). Columna lateral en desktop: <zc-facets> <zc-facet-group title="Por categoría" [count]="cats().length"><zc-facet-options [options]="…" [(value)]="cats" [searchable]="true" /></zc-facet-group> <zc-facet-group title="Valor máximo"><zc-slider … /></zc-facet-group> </zc-facets> En móvil la página muestra un botón "Filtrar" que abre un drawer (bottom sheet) 

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[title]` | `string` | **obligatorio** |  |
| `[count]` |  | `0` |  |
| `[(open)]` |  | `true` |  |

```html
<zc-facets class="max-lg:hidden">
```

### `zc-facet-group` · FacetGroupComponent

Grupo plegable con título y cuántas opciones hay marcadas.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[title]` | `string` | **obligatorio** |  |
| `[count]` |  | `0` |  |
| `[(open)]` |  | `true` |  |

```html
<zc-facet-group title="Por categoría" [count]="cats().length">
  <zc-facet-options [options]="catOptions()" [(value)]="cats" [searchable]="true" searchLabel="Buscar categoría" />
  </zc-facet-group>
```

### `zc-facet-options` · FacetOptionsComponent

Casillas con conteo; con [searchable] busca dentro del grupo; más de [visible] opciones → "Mostrar N más".

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[options]` | `readonly ZcFacetOption[]` | **obligatorio** |  |
| `[(value)]` | `string[]` | `[]` |  |
| `[searchable]` |  | `false` |  |
| `[searchLabel]` |  | `''` |  |
| `[visible]` |  | `5` |  |

```html
<zc-facet-options [options]="catOptions()" [(value)]="cats" [searchable]="true" searchLabel="Buscar categoría" />
```

## `@zonacards/ui/field`

### `zc-field` · FieldComponent

Anatomía fija: etiqueta (20 px, una línea) · control

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[label]` | `string` | **obligatorio** |  |
| `[hint]` |  | `''` |  |
| `[error]` | `string \| null` | `null` |  |
| `[required]` |  | `false` |  |
| `[optional]` |  | `false` |  |
| `[info]` | `string \| null` | `null` |  |
| `[success]` | `string \| null` | `null` | Confirmación en la misma línea del mensaje ("Código válido (Luhn)."), en verde con ícono. |
| `[counter]` | `string \| null` | `null` | Contador a la derecha del mensaje ("0/280"), lo calcula la página. |
| `[reserve]` |  | `true` | false: el mensaje vacío no reserva su línea (formularios de acceso, como .auth-card de index.html). |

```html
<zc-field label="Nombre de la campaña" [required]="true" hint="Lo verá el equipo y el cliente."><input zcInput placeholder="Ej. Navidad 2026" maxlength="60" /></zc-field>
```

### `input[zcInput], textarea[zcInput]` · InputDirective

input[zcInput] y textarea[zcInput] dentro de <zc-field>: estilo de control y conexión accesible. Misma altura para todos los inputs (--target); el textarea crece desde 96 px y se redimensiona en vertical.

```html
<input zcInput placeholder="Ej. Navidad 2026" maxlength="60" />
```

## `@zonacards/ui/fieldset`

### `zc-fieldset` · FieldsetComponent

<zc-fieldset legend="Datos de contacto" description="Para avisarte del envío."> …campos… </zc-fieldset> Agrupa campos relacionados con una leyenda que los lectores de pantalla anuncian al entrar al grupo (`<fieldset>` + `<legend>`). Con `disabled`, deshabilita todos los controles de adentro. `bordered` lo dibuja como una tarjeta suave. 16 px entre la leyenda y cada campo, como `.fieldset` de index

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[legend]` | `string` | **obligatorio** | Título del grupo: obligatorio, porque sin él el grupo no tiene nombre para quien no lo ve. |
| `[description]` |  | `''` |  |
| `[bordered]` |  | `false` |  |
| `[disabled]` |  | `false` |  |

```html
<zc-fieldset class="md:col-span-2" legend="Fieldset · Datos de contacto" description="Para avisarte cuando salga el envío." [bordered]="true">
  <zc-field label="Nombre de contacto"><input zcInput autocomplete="off" /></zc-field>
  <zc-field label="Correo de contacto" hint="Donde llega el aviso."><input zcInput type="email" autocomplete="off" /></zc-field>
  </zc-fieldset>
```

## `@zonacards/ui/file-upload`

### `zc-file-upload` · FileUploadComponent

<zc-file-upload accept=".xlsx" [maxMb]="5" label="Subir archivo XLSX de contactos" [(items)]="…" (added)="subir($event)" /> · Desktop: zona para arrastrar o elegir. Móvil o táctil: solo el botón "Elegir archivo".

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[accept]` |  | `''` | Tipos aceptados como en <input accept>: ".xlsx,.csv". |
| `[maxMb]` |  | `5` |  |
| `[multiple]` |  | `false` |  |
| `[label]` | `string` | **obligatorio** | Nombre accesible de la zona: "Subir archivo XLSX de contactos". |
| `[title]` |  | `''` | Texto principal de la zona (desktop). |
| `[hint]` |  | `''` | Ayuda; por defecto, "Solo .xlsx, hasta 5 MB." |
| `[(items)]` | `UploadItem[]` | `[]` |  |
| `(added)` | `UploadAdded[]` |  |  |
| `(removed)` | `UploadItem` |  |  |
| `(downloadErrors)` | `UploadItem` |  |  |

```html
<zc-file-upload label="Subir archivo XLSX de contactos" title="Arrastra el XLSX o haz clic para elegirlo" accept=".xlsx" [maxMb]="5" [multiple]="true"
  [(items)]="uploads" (added)="onAdded($event)" (downloadErrors)="downloadErrors($event)">
  <button type="button" class="cursor-pointer text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-current" (click)="downloadTemplate()">Descarga la plantilla</button>
  </zc-file-upload>
```

## `@zonacards/ui/flag`

### `zc-flag` · FlagComponent

Bandera SVG de flag-icons (MIT), servida desde /flags/<código>.svg y cargada solo cuando se usa. Decorativa: siempre va junto al nombre o código del país. Nunca emojis.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[code]` | `CountryCode \| string` | **obligatorio** |  |
| `[size]` |  | `18` |  |

```html
<zc-flag code="pe" />
```

## `@zonacards/ui/geo-map`

### `zc-geo-map` · GeoMapComponent

<zc-geo-map [label] [points] [editable] (picked)> · mapa de calles con Leaflet y teselas (OpenStreetMap por defecto).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[label]` | `string` | **obligatorio** | Nombre accesible del mapa: "Mapa de locales en Perú". |
| `[points]` | `readonly ZcGeoPoint[]` | `[]` |  |
| `[unit]` |  | `''` | Lo que se cuenta en las burbujas: "locales". |
| `[editable]` |  | `false` | Un solo pin (el primer punto) que se mueve; avisa por (picked). |
| `[center]` | `[number, number]` | `[-12.0464, -77.0428]` | Centro cuando todavía no hay puntos (por defecto, Lima). |
| `[tiles]` |  | `OSM_TILES` | Servidor de teselas y su atribución (obligatoria). Para tráfico alto usa un proveedor propio o de pago. |
| `[attribution]` |  | `OSM_ATTRIBUTION` |  |
| `(picked)` | `{ lat: number; lng: number }` |  |  |

## `@zonacards/ui/icon`

### `zc-icon` · IconComponent

<zc-icon name="s:gift" /> · Solar Linear por defecto, Bold para activos, Lucide como respaldo. Decorativo por defecto (aria-hidden). Si es el único contenido de un botón, el aria-label va en el botón.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[name]` | `IconName` | **obligatorio** |  |
| `[size]` | `16 \| 20 \| 24 \| 32` | `20` |  |

```html
<zc-icon name="s:add" [size]="16" />
```

## `@zonacards/ui/image-gallery`

### `zc-image-gallery` · ImageGalleryComponent

<zc-image-gallery [(images)]="fotos" [max]="8" /> · galería con carga de imágenes (o-images de index.html). Varias a la vez (arrastrar o elegir), vista previa real, validación de tipo, peso y medidas, progreso, portada (la primera), texto alternativo obligatorio y reordenar arrastrando (zcSortable). validate() marca los faltantes y enfoca el primero.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(images)]` | `ZcGalleryImage[]` | **obligatorio** |  |
| `[max]` |  | `8` |  |
| `[maxBytes]` |  | `3 * 1024 * 1024` |  |
| `[minWidth]` |  | `800` |  |
| `[minHeight]` |  | `600` |  |
| `[uploader]` | `ZcUploader` | `fakeUpload` |  |

```html
<zc-image-gallery #gal [(images)]="images" />
```

Métodos: `add(files: FileList | File[])` Valida tipo y peso al instante, medidas al leer la imagen, y sube las válidas mostrando el avance. · `validate()` Antes de guardar: imágenes sin texto alternativo o con error. Enfoca el primer campo vacío.

## `@zonacards/ui/input-group`

### `zc-input-group` · InputGroupComponent

<zc-input-group prefixIcon="s:letter"><input zcInput type="email" /></zc-input-group> · input con prefijo y sufijo (".control" de index.html): un solo borde y anillo de foco para todo el conjunto, misma altura que cualquier campo.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[prefixIcon]` | `IconName \| null` | `null` |  |
| `[prefixText]` |  | `''` |  |
| `[revealable]` |  | `false` |  |
| `[valid]` |  | `false` |  |

```html
<zc-input-group prefixIcon="s:letter" class="border-focus! shadow-[0_0_0_3px_color-mix(in_srgb,var(--focus)_22%,transparent)]!"><input zcInput type="email" value="ana.torres@interbank.pe" /></zc-input-group>
```

## `@zonacards/ui/intro`

### `zc-step-dots` · StepDotsComponent

<zc-step-dots [total] [(current)] /> · puntos de avance (introducción, carrusel de pasos). El actual es una píldora; el resto, puntos. Anuncia "Paso 2 de 3". Solo informa: no se toca (la navegación la hacen los botones).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[total]` | `number` | **obligatorio** |  |
| `[(current)]` |  | `0` | Paso actual desde 0. |

### `zc-intro-slides` · IntroSlidesComponent

<zc-intro-slides [slides] (finished) (skipped)> · introducción a pantalla completa de la primera vez: una diapositiva a la vez sobre fondo `primary`, puntos de avance, "Saltar" (salvo en la última) y "Continuar" que en la última dice "Empezar". El título anuncia el cambio de diapositiva. La app guarda que ya la vio. Llena su contenedor: ponla en una pantalla o en un overlay.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[slides]` | `readonly IntroSlide[]` | **obligatorio** |  |
| `[(index)]` |  | `0` |  |
| `(finished)` | `void` |  |  |
| `(skipped)` | `void` |  |  |

```html
<zc-intro-slides class="max-w-md" [slides]="introSlides" (finished)="introDone.set(true)" (skipped)="introDone.set(true)" />
```

## `@zonacards/ui/kanban`

### `ng-template[zcKanbanCard]` · KanbanComponent

Contenido de cada tarjeta: <ng-template zcKanbanCard let-card>…</ng-template>.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[columns]` | `readonly ZcKanbanColumn[]` | **obligatorio** |  |
| `[(board)]` | `ZcKanbanBoard<T>` | **obligatorio** |  |
| `[cardId]` | `(c: T) => string` | **obligatorio** |  |
| `[cardLabel]` | `(c: T) => string` | **obligatorio** |  |

```html
<ng-template zcKanbanCard let-p>
```

Métodos: `move(card: T, col: string, idx?: number)` Mueve a la columna y posición indicadas (sin posición: al final), avisa si supera el límite y lo anuncia.

## `@zonacards/ui/kpi`

### `zc-kpi` · KpiComponent

<zc-kpi label="Activados" value="132" icon="s:check-circle" [filter]="true" [(pressed)]="x" /> · tarjeta KPI.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[label]` | `string` | **obligatorio** |  |
| `[value]` | `string \| number` | **obligatorio** |  |
| `[icon]` | `IconName \| null` | `null` |  |
| `[delta]` | `number \| null` | `null` | Variación porcentual (8.2 = +8,2 %). |
| `[deltaLabel]` |  | `''` |  |
| `[trend]` | `readonly number[] \| null` | `null` | Serie del sparkline (KPI con tendencia de Cards): la variación pasa a píldora y la línea va a la derecha. |
| `[invert]` |  | `false` | Si subir es malo (por vencer, errores), el color se invierte. |
| `[filter]` |  | `false` |  |
| `[(pressed)]` |  | `false` |  |

```html
<zc-kpi [label]="k.label" [value]="k.value" [icon]="k.icon" [delta]="k.delta" deltaLabel="vs. mes ant." [trend]="k.trend" [invert]="!!k.invert"
  [filter]="true" [pressed]="kpiOn() === i" (pressedChange)="kpiOn.set($event ? i : null)" />
```

## `@zonacards/ui/legal`

### `zc-legal-sheet` · LegalSheetComponent

<zc-legal-sheet [(open)] [document] [loading] [error] (confirm) (retry)> · términos o privacidad en una hoja (bottom sheet en móvil, modal en desktop): encabezados y párrafos, versión en el subtítulo y un botón en el pie. En un registro, `confirmLabel` es "Aceptar" y `(confirm)` marca la casilla; en el resto, "Entendido" solo cierra. El texto lo trae la app (`document`): aquí no hay HTTP. Con `loa

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(open)]` |  | `false` |  |
| `[document]` | `LegalDocument \| null` | `null` | Documento cargado; null mientras carga o si falló. |
| `[title]` | `string` | **obligatorio** | Título mientras el documento no llega ("Términos y condiciones"). |
| `[loading]` |  | `false` |  |
| `[error]` |  | `false` |  |
| `[confirmLabel]` |  | `''` | Texto del botón del pie; por defecto "Entendido". |
| `(confirm)` | `void` |  |  |
| `(retry)` | `void` |  |  |

```html
<zc-legal-sheet title="Términos y condiciones" [document]="termsDoc" confirmLabel="Aceptar" [open]="legalOpen() === 'terms'" (openChange)="legalOpen.set($event ? 'terms' : null)" (confirm)="legalChecked.set(true)" />
```

### `zc-legal-consent` · LegalConsentComponent

<zc-legal-consent [(checked)] [error] (openTerms) (openPrivacy)> · aceptación de términos en una caja: casilla, enlaces para leer los términos y la política (la app abre `zc-legal-sheet`) y, ya aceptados, el chip "Términos aceptados". `error` marca la casilla cuando se intenta continuar sin aceptar.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(checked)]` |  | `false` |  |
| `[error]` |  | `false` |  |
| `(openTerms)` | `void` |  |  |
| `(openPrivacy)` | `void` |  |  |

```html
<zc-legal-consent [(checked)]="legalChecked" [error]="legalTried()" (openTerms)="legalOpen.set('terms')" (openPrivacy)="legalOpen.set('privacy')" />
```

## `@zonacards/ui/listbox`

### `zc-listbox` · ListboxComponent

Lista de opciones (role="listbox") con foco virtual: el foco real queda en el buscador o en la lista y la opción activa se anuncia con aria-activedescendant. Flechas, Inicio/Fin, Enter, Espacio y escribir para saltar. Uso interno de las moléculas de selección.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[options]` | `readonly ZcOption<T>[]` | **obligatorio** |  |
| `[listId]` | `string` | **obligatorio** |  |
| `[isSelected]` | `(o: ZcOption<T>) => boolean` | `o: ZcOption<T>` |  |
| `[multiple]` |  | `false` |  |
| `[query]` |  | `''` | Texto buscado, para resaltar la coincidencia. |
| `[emptyText]` |  | `''` |  |
| `[label]` |  | `''` |  |
| `[focusable]` |  | `false` | Sin buscador, la lista recibe el foco y maneja el teclado. |
| `[fill]` |  | `false` | Ocupa el alto disponible (sheet y subpantalla). |
| `[(active)]` |  | `0` |  |
| `(pick)` | `ZcOption<T>` |  |  |

Métodos: `typeahead(char: string)` Escribir para saltar: busca la siguiente opción que empieza con lo tecleado. · `handleKey(e: KeyboardEvent, opts: { space?: boolean; typeahead?: boolean } = { space: true, typeahead: true })` Teclado compartido por la lista y por el buscador. Devuelve true si lo manejó (no usar directo en un listener de template).

## `@zonacards/ui/location-picker`

### `zc-location-picker` · LocationPickerComponent

<zc-location-picker [(value)]="punto" label="Ubica el punto de entrega" [center]="..." /> · punto exacto en el mapa (dirección de entrega, local). Un pin que se arrastra o se coloca con un clic en el mapa, las coordenadas escritas como alternativa (latitud y longitud validadas) y "Usar mi ubicación". `center` centra el mapa mientras no hay punto (por ejemplo, el distrito elegido en <zc-ubigeo-sele

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(value)]` | `ZcLatLng \| null` | `null` | Punto elegido (latitud y longitud) o null. |
| `[label]` | `string` | **obligatorio** | Nombre accesible del mapa y título del bloque. |
| `[center]` | `[number, number]` | `[-12.0464, -77.0428]` | Centro del mapa mientras no hay punto: [latitud, longitud]. Por defecto, Lima. |

```html
<zc-location-picker [(value)]="point" label="Ubica el punto de entrega" [center]="mapCenter()" />
```

Métodos: `set(p: ZcLatLng)` Lo que emite el mapa: se redondea, se valida y se refleja en las cajas.

## `@zonacards/ui/logo`

### `zc-logo` · LogoComponent

<zc-logo name="visa" [size]="28" [label]="true" /> · logos de medios de pago, redes y marcas (Simple Icons, CC0). Color de marca por defecto; [mono] usa currentColor (fondos oscuros, listas). Empaquetados en build (sin red). Con [label] el logo es una imagen con nombre ("Visa"); sin él es decorativo y el texto va al lado. Usarlos solo para identificar medios de pago, redes y comercios afiliados, s

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[name]` | `LogoName \| string` | **obligatorio** |  |
| `[size]` |  | `24` |  |
| `[mono]` |  | `false` |  |
| `[label]` |  | `false` |  |

```html
<zc-logo [name]="l" [size]="18" />
```

## `@zonacards/ui/menu`

### `[zcContextMenu]` · ContextMenuDirective

[zcContextMenu]="menu" · menú contextual sobre un área (fila, tarjeta, nodo de un árbol, lienzo). <zc-menu #menu trigger="none" label="Acciones del lote #02829" [items]="acciones" (select)="…" /> <article [zcContextMenu]="menu" tabindex="0">…</article>

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[zcContextMenu]` | `MenuComponent` | **obligatorio** |  |
| `[zcContextMenuEnabled]` |  | `true` | false lo desactiva (por ejemplo, sin acciones disponibles). |

### `zc-menu` · MenuComponent

<zc-menu label="Acciones del lote #02829" [items]="…" (select)="…" /> · menú de acciones.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[items]` | `readonly ZcMenuItem[]` | **obligatorio** |  |
| `[label]` | `string` | **obligatorio** | Nombre accesible del botón y título del sheet: "Acciones del lote #02829". |
| `[triggerText]` |  | `''` | Con texto, el disparador es un botón "Más acciones ⌄" en vez del kebab. |
| `[triggerVariant]` | `'ghost' \| 'outline'` | `'ghost'` |  |
| `[dense]` |  | `false` | Kebab de 36 px (44 en táctil) para tarjetas y filas densas. |
| `[triggerIcon]` | `IconName` | `'s:menu-dots-vertical-bold'` | Ícono del disparador sin texto: kebab vertical Bold por defecto; "Descargar" en gráficos. |
| `[tooltip]` |  | `''` | Tooltip del disparador de solo ícono (obligatorio si el ícono no es el kebab). |
| `[leadIcon]` | `IconName \| null` | `null` | Ícono antes del texto del disparador (idioma: globo + "ES"); con él no se muestra la flecha. |
| `(select)` | `ZcMenuItem` |  |  |
| `[trigger]` | `'button' \| 'none'` | `'button'` | 'none': sin botón propio; lo abre un área con [zcContextMenu] (clic derecho, tecla Menú o Mayús+F10, presión larga en táctil). |

```html
<zc-menu zcCardAside label="Acciones del lote #02829" [items]="lotMenu" [dense]="true" (select)="toast.info($event.label, { text: 'Acción simulada.' })" />
```

Métodos: `openAt(point: { x: number; y: number }, origin: HTMLElement)` Abre el menú en un punto de la pantalla (menú contextual); origin recibe el foco al cerrar.

## `@zonacards/ui/mfa-setup`

### `zc-mfa-setup` · MfaSetupComponent

<zc-mfa-setup [qrImage] [secret] [verify] [recoveryCodes] (finished)> · enrolamiento del segundo factor (TOTP). 1. Escanear el QR con una app de autenticación, o escribir la clave a mano (agrupada de a 4, con copiar). 2. Escribir el código de 6 dígitos; la app lo valida con [verify]. 3. Si hay [recoveryCodes]: mostrarlos con copiar y descargar, y confirmar que se guardaron antes de terminar. El QR

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[qrImage]` | `string` | **obligatorio** | QR del servidor como data URI o URL (otpauth://… ya dibujado). |
| `[secret]` | `string` | **obligatorio** | Clave en Base32 para escribirla a mano. |
| `[account]` |  | `''` | Cuenta que se enrola ("Zonacards · ana@empresa.com"). |
| `[verify]` | `(code: string) => Promise<boolean>` | **obligatorio** | Valida el código: true si es correcto. Una promesa rechazada muestra el aviso de error de conexión. |
| `[recoveryCodes]` | `readonly string[]` | `[]` | Códigos de recuperación (opcional): con ellos se agrega el paso 3. |
| `[fileName]` |  | `'codigos-recuperacion'` | Nombre del archivo de códigos (sin extensión). |
| `[headingLevel]` | `1 \| 2 \| 3 \| 4` | `2` |  |
| `(finished)` | `void` |  | Código verificado (y códigos guardados si los hay). |

Métodos: `go(s: Step)` Cambia de paso y lleva el foco al título (se anuncia la pantalla nueva).

## `@zonacards/ui/misc`

### `kbd[zcKbd]` · KbdDirective

<kbd zcKbd>Ctrl</kbd> · atajo de teclado (Kbd de index.html).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[orientation]` | `'horizontal' \| 'vertical'` | `'horizontal'` |  |
| `[decorative]` |  | `true` |  |

```html
<kbd zcKbd>
```

### `zc-separator` · SeparatorComponent

<zc-separator /> · línea horizontal; orientation="vertical" entre elementos de una fila (se estira a su alto). Decorativo por defecto; [decorative]="false" lo expone como separador para lectores de pantalla.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[orientation]` | `'horizontal' \| 'vertical'` | `'horizontal'` |  |
| `[decorative]` |  | `true` |  |

```html
<zc-separator orientation="vertical" />
```

### `[zcButtonGroup]` · ButtonGroupDirective

<div zcButtonGroup aria-label="Exportar"> botones outline </div> · acciones relacionadas (ButtonGroup de index.html): bordes compartidos, extremos redondeados.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[label]` | `string` | **obligatorio** |  |
| `[disabled]` |  | `false` |  |

### `zc-close-button` · CloseButtonComponent

<zc-close-button label="Cerrar" (click)="…" /> · cierre de overlays, toasts y avisos (CloseButton de index.html).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[label]` | `string` | **obligatorio** |  |
| `[disabled]` |  | `false` |  |

```html
<zc-close-button label="Cerrar aviso" />
```

### `a[zcLink], button[zcLink]` · LinkComponent

<a zcLink href="…" [external]="true">Ver detalle</a> · enlace de texto (Link de index.html): subrayado suave que se intensifica al pasar el mouse; externo con ícono. También en <button zcLink> para acciones de texto.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[external]` |  | `false` | Con <a>: abre en otra pestaña y lo anuncia. Con <button>: solo el ícono (la acción la define la página). |

```html
<a zcLink href="#a-button" [external]="true">
```

## `@zonacards/ui/mobile`

### `zc-mobile-bar` · MobileBarComponent

Patrones de app móvil (o-mobile de index.html). Respetan áreas seguras (env(safe-area-inset-*)). · <zc-mobile-bar title subtitle [back] (backClick)> con una acción a la derecha como máximo ([zcMobileAction]).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[title]` | `string` | **obligatorio** |  |
| `[subtitle]` |  | `''` |  |
| `[back]` |  | `false` |  |
| `(backClick)` | `void` |  |  |

```html
<zc-mobile-bar [title]="titles[tab()]" subtitle="KFC Jockey Plaza · Caja 2" [back]="tab() === 'set'" (backClick)="tab.set('hist')">
  @if (tab() === 'hist') {
  <button zcMobileAction type="button" class="grid size-10 cursor-pointer place-items-center rounded-sm hover:bg-surface-2" aria-label="Actualizar" (click)="refresh()"><zc-icon name="s:refresh" /></button>
  }
  </zc-mobile-bar>
```

### `zc-bottom-nav` · BottomNavComponent

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[items]` | `readonly ZcBottomNavItem[]` | **obligatorio** |  |
| `[label]` | `string` | **obligatorio** |  |
| `[(current)]` | `string \| null` | `null` |  |

```html
<zc-bottom-nav label="Navegación de la app" [items]="nav" [current]="tab()" (currentChange)="go($any($event))" />
```

### `zc-system-banner` · SystemBannerComponent

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `(refresh)` | `void` |  | La página actualiza y llama a done() (o pone [busy] en false). |
| `[(busy)]` |  | `false` |  |

```html
<zc-system-banner tone="offline">Sin conexión. No se pueden validar canjes hasta reconectar.</zc-system-banner>
```

### `zc-pull-refresh` · PullRefreshComponent

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `(refresh)` | `void` |  | La página actualiza y llama a done() (o pone [busy] en false). |
| `[(busy)]` |  | `false` |  |

```html
<zc-pull-refresh [(busy)]="refreshing" (refresh)="refresh()">
```

### `zc-swipe-item` · SwipeItemComponent

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[actions]` | `readonly ZcSwipeAction[]` | **obligatorio** |  |
| `[menuLabel]` | `string` | **obligatorio** |  |
| `(action)` | `string` |  |  |

```html
<zc-swipe-item [actions]="swipe" [menuLabel]="'Acciones de ' + op.title" (action)="onSwipe($event)">
```

### `zc-pin-pad` · PinPadComponent

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[length]` |  | `4` |  |
| `[error]` | `string \| null` | `null` |  |
| `[(value)]` |  | `''` |  |
| `(complete)` | `string` |  |  |
| `(biometric)` | `void` |  |  |

```html
<zc-pin-pad [(value)]="pinValue" [error]="pinError()" (complete)="checkPin($event)" (biometric)="toast.info('Biometría', { text: 'En la app abre la huella o Face ID del sistema.' })" />
```

Métodos: `reject()` La página llama a reject() si el PIN es incorrecto: vibra, tiembla y se limpia.

### `zc-permission-prompt` · PermissionPromptComponent

Permisos y push (o-perm de index.html). <zc-permission-prompt icon="s:qr-code" title="Usa la cámara…" text="…"> botones </zc-permission-prompt> Pantalla previa: se muestra justo antes de usar la función (nunca al abrir la app), explica el beneficio y qué no se hace; "Ahora no" siempre disponible. tone="warning" para el permiso negado con camino a Ajustes. <zc-push-preview app="Zonacards" time="aho

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[icon]` | `IconName` | **obligatorio** |  |
| `[title]` | `string` | **obligatorio** |  |
| `[text]` | `string` | **obligatorio** |  |
| `[tone]` | `'info' \| 'warning'` | `'info'` |  |

```html
<zc-permission-prompt icon="s:qr-code" title="Usa la cámara para validar vales" text="La necesitamos solo para leer el código QR. No guardamos fotos ni video.">
  <button zcButton [block]="true" (click)="askCamera()">Permitir cámara</button>
  <button zcButton variant="ghost" [block]="true" (click)="later()">Ahora no</button>
  </zc-permission-prompt>
```

### `zc-push-preview` · PushPreviewComponent

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[app]` | `string` | **obligatorio** |  |
| `[time]` | `string` | **obligatorio** |  |
| `[title]` | `string` | **obligatorio** |  |
| `[text]` | `string` | **obligatorio** |  |

```html
<zc-push-preview app="Zonacards" time="ahora" title="Anulación aprobada" text="Luis Mendoza aprobó anular el canje #CJ-40921 (S/ 30.00)." />
```

## `@zonacards/ui/money`

### `zc-money` · MoneyComponent

Monto completo si cabe; si no, abreviado (K, M, MM) con la cifra completa en tooltip (mouse y foco) y para lectores de pantalla. No usar en tablas, exportaciones ni documentos financieros: ahí siempre va la cifra completa.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[amount]` | `number` | **obligatorio** |  |
| `[country]` | `CountryCode` | **obligatorio** |  |

```html
<zc-money class="text-xl font-semibold" [amount]="x[0]" [country]="x[1]" />
```

## `@zonacards/ui/money-field`

### `zc-money-field` · MoneyFieldComponent

<zc-money-field [country]="'pe'"> · símbolo a la izquierda y código de moneda a la derecha. Acepta dígitos y un separador decimal (punto o coma) con los decimales de la moneda (0 en CLP y COP); al salir muestra la cifra con separadores del país. Valor: número o null. Validar con zcValidators.amount({ country, min, max }).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[country]` | `CountryCode` | **obligatorio** |  |
| `[disabled]` |  | `false` |  |
| `[invalid]` |  | `false` |  |
| `[(value)]` | `number \| null` | `null` |  |
| `[display]` | `MoneyDisplay` | `'auto'` | Prefijo de la moneda: 'auto' escribe el código cuando el símbolo sería "$" ("CLP"); "S/" y "Bs" quedan igual. |

```html
<zc-money-field [country]="countryCode()" formControlName="amount" />
```

## `@zonacards/ui/notifications`

### `zc-notifications` · NotificationsComponent

Campana de la barra superior con su panel (Notificaciones de index.html): contador de no leídas, "Marcar todo como leído", pestañas Todas / Aprobaciones / Alertas, grupos por fecha y "Ver todas". Popover en desktop y bottom sheet en móvil. Abrir una notificación la marca como leída y emite (open) para navegar.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(items)]` | `ZcNotification[]` | `[]` |  |
| `(open)` | `ZcNotification` |  |  |
| `(seeAll)` | `void` |  |  |

## `@zonacards/ui/number-field`

### `zc-number-field` · NumberFieldComponent

<zc-number-field [min]="1" [max]="10000"> · cantidades enteras; con [decimals]="2" y suffix="%", tasas y porcentajes. −/+ y flechas arriba/abajo cambian de a `step`; con Shift, de a 100 × step. Rechaza lo que no es número (con decimales acepta coma o punto y muestra el separador del idioma), ajusta al rango y redondea al salir, y deshabilita −/+ en los límites. Se anuncia como spinbutton con su va

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[min]` |  | `0` |  |
| `[max]` |  | `Number.MAX_SAFE_INTEGER` |  |
| `[step]` |  | `1` |  |
| `[decimals]` |  | `0` | Decimales permitidos (0 = enteros). |
| `[suffix]` |  | `''` | Unidad después del número ("%", "días"); se anuncia con el valor. |
| `[disabled]` |  | `false` |  |
| `[invalid]` |  | `false` |  |
| `[ariaLabel]` |  | `''` | Nombre sin zc-field (celda de una tabla editable: "Cantidad de la fila 2"). |
| `[(value)]` | `number \| null` | `null` |  |

```html
<zc-number-field [min]="1" [max]="10000" formControlName="qty" />
```

## `@zonacards/ui/offline-banner`

### `zc-offline-banner` · OfflineBannerComponent

<zc-offline-banner [pending]="cola()" /> · aviso de sin conexión con los cambios en cola (o-errors y o-mobile). Es role="status": se anuncia al aparecer. La app lo muestra mientras navigator.onLine es false.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[pending]` |  | `0` |  |

```html
<zc-offline-banner [pending]="queue()" />
```

## `@zonacards/ui/otp`

### `zc-otp` · OtpComponent

<zc-field label="Código de verificación" [error]="e" [success]="ok"><zc-otp [(value)]="code" (complete)="verificar($event)" /></zc-field> Un casillero por dígito: escribir avanza, Retroceso vuelve, flechas recorren y pegar llena todos. Solo acepta dígitos (avisa con field.flash). El primero lleva autocomplete="one-time-code" para el SMS del sistema. state: 'valid' | 'invalid' pinta los bordes; el 

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(value)]` |  | `''` |  |
| `[length]` |  | `6` |  |
| `[disabled]` |  | `false` |  |
| `[state]` | `'valid' \| 'invalid' \| null` | `null` |  |
| `(complete)` | `string` |  | Emite el código al completar todos los dígitos. |

```html
<zc-otp [(value)]="otp" [state]="otpState()" />
```

## `@zonacards/ui/overlay`

### `zc-alert-dialog` · AlertDialogComponent

<zc-alert-dialog> · acción destructiva o irreversible ("¿Anular 500 códigos?"). confirmVariant="primary" si no destruye.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[title]` | `string` | **obligatorio** |  |
| `[text]` |  | `''` | Consecuencia en una frase: qué pasa y qué no se puede deshacer. |
| `[reasonLabel]` |  | `''` | Etiqueta del motivo ("Motivo"); vacío = sin motivo. |
| `[reasonPlaceholder]` |  | `''` |  |
| `[reasonMin]` |  | `5` |  |
| `[confirmWord]` |  | `''` | Palabra a escribir para confirmar (acciones masivas): "ANULAR". |
| `[confirmLabel]` | `string` | **obligatorio** | Verbo + objeto: "Solicitar anulación". |
| `[cancelLabel]` | `string` | **obligatorio** |  |
| `[confirmVariant]` | `'danger' \| 'primary'` | `'danger'` | danger (por defecto) para destruir o anular; primary para confirmaciones irreversibles que no destruyen (aprobar, enviar, cerrar el periodo). |
| `[busy]` |  | `false` |  |
| `[(open)]` |  | `false` |  |
| `(confirm)` | `AlertDialogResult` |  |  |

```html
<zc-alert-dialog [title]="voidTitle()" text="Los códigos dejarán de funcionar. Se enviará a aprobación de un segundo usuario." reasonLabel="Motivo"
  reasonPlaceholder="Ej. Error en la orden de compra" [confirmWord]="voidIds().length >
```

### `zc-modal, zc-drawer` · OverlayComponent

<zc-modal> y <zc-drawer> · un solo componente sobre CDK Overlay (el tipo sale de la etiqueta).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[title]` | `string` | **obligatorio** |  |
| `[subtitle]` |  | `''` |  |
| `[size]` | `'md' \| 'lg'` | `'md'` | Ancho del modal en desktop: md 520 px (por defecto), lg 760 px (imagen, vista previa). |
| `[dialogRole]` | `'dialog' \| 'alertdialog'` | `'dialog'` | alertdialog para confirmaciones (zc-alert-dialog). No se llama role: un atributo estático quedaría también en el host oculto. |
| `[closable]` |  | `true` | Botón X en el encabezado. |
| `[dismissible]` |  | `true` | Tocar el scrim cierra (en un alert dialog no: la decisión se toma con sus botones). |
| `[busy]` |  | `false` | Mientras hay una acción en curso no se cierra (evita perder el resultado o enviar dos veces). |
| `[(open)]` |  | `false` |  |
| `(closed)` | `void` |  |  |

```html
<zc-modal [title]="zoom() ?? ''" subtitle="Imagen de categoría · 1200 × 900" size="lg" [open]="!!zoom()" (openChange)="!$event && zoom.set(null)">
  <div class="aspect-[4/3] overflow-hidden rounded-2xl"><zc-art [category]="zoom() ?? 'Gastronomía'" /></div>
  <p class="flex items-start gap-2 text-[13px] text-muted"><zc-icon name="s:info-circle" [size]="16" class="mt-px shrink-0" />En la app: foto de Pexels o Unsplash, WebP de máximo 200 KB, con crédito en CREDITS.md.</p>
  </zc-modal>
```

Métodos: `dragStart(e: PointerEvent)` Bottom sheet: deslizar hacia abajo desde el asa o el encabezado cierra (más de 80 px).

## `@zonacards/ui/page-header`

### `zc-page-header` · PageHeaderComponent

<zc-page-header title="Lotes" subtitle="144 de 1.240 lotes" [crumbs]="…"> acciones </zc-page-header> Migas (desde el tercer nivel) · título de una línea

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[title]` | `string` | **obligatorio** |  |
| `[subtitle]` |  | `''` | Conteo o descripción breve: "144 de 1.240 lotes". |
| `[crumbs]` | `readonly Crumb[]` | `[]` |  |
| `[level]` | `1 \| 2` | `1` | h1 en páginas; h2 solo para demostrarlo dentro del catálogo. |
| `[live]` |  | `true` | Anuncia el subtítulo al cambiar (conteos que dependen de filtros). |

```html
<zc-page-header zcPageHeader title="Lotes" [subtitle]="countText()" [crumbs]="pageCrumbs" [level]="2" [live]="false">
  <button zcButton variant="ghost" size="icon" aria-label="Descargar lotes" zcTooltip="Descargar"><zc-icon name="s:download-minimalistic" /></button>
  <button zcButton variant="outline" class="max-md:hidden"><zc-icon name="s:import" [size]="16" />Carga masiva</button>
  <button zcButton><zc-icon name="s:add" [size]="16" />Nuevo lote</button>
  </zc-page-header>
```

## `@zonacards/ui/pagination`

### `zc-pagination` · PaginationComponent

<zc-pagination> · sección 16 de las reglas: sin paginador si todo cabe en una página (el conteo va en el encabezado de la lista).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[variant]` | `'compact' \| 'numeric' \| 'more'` | `'compact'` |  |
| `[total]` | `number` | **obligatorio** |  |
| `[(page)]` |  | `1` | Página actual, desde 1. |
| `[(pageSize)]` |  | `25` |  |
| `[pageSizes]` | `readonly number[]` | `[10, 25, 50, 100]` |  |
| `[loaded]` |  | `0` | Variante more: cuántos se muestran ya y si está cargando. |
| `[loading]` |  | `false` |  |
| `[itemLabel]` |  | `''` | Nombre en plural de lo que se lista ("lotes"), para "Mostrando 12 de 48 lotes". |
| `(loadMore)` | `void` |  |  |

```html
<zc-pagination [total]="sorted().length" [(page)]="page" [(pageSize)]="pageSize" [pageSizes]="[10, 25, 50]" />
```

Métodos: `go(p: number, e: Event | null)` Va a la página (limitada a 1..N). Si el botón usado queda deshabilitado, el foco pasa al campo "Página".

## `@zonacards/ui/panel`

### `zc-panel` · PanelComponent

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[subData]` | `PanelData \| null` | `null` | Datos cuando este panel es una subpantalla dentro de otro. |

## `@zonacards/ui/pay-badge`

### `zc-pay-badge` · PayBadgeComponent

<zc-pay-badge name="yape" /> · insignia de texto para medios de pago sin logo vectorial en zc-logo (billeteras, puntos). Color de marca desde tokens (--pay-*). Decorativa: el nombre del medio va en el texto de la opción.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[name]` | `PayBadge` | **obligatorio** |  |

```html
<zc-pay-badge [name]="b" />
```

## `@zonacards/ui/permission-group`

### `zc-permission-group` · PermissionGroupComponent

<zc-permission-group title="Lotes" [(enabled)]="lotesOn" [(permissions)]="permisosLotes" /> · un módulo de la matriz de permisos (o-domain). El switch activa el módulo; apagado desmarca y deshabilita sus permisos. El conteo "3/6 permisos" se actualiza solo.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[title]` | `string` | **obligatorio** |  |
| `[(enabled)]` |  | `true` |  |
| `[(permissions)]` | `ZcPermission[]` | **obligatorio** |  |

```html
<zc-permission-group title="Lotes" [(enabled)]="lotsOn" [(permissions)]="perms" />
```

## `@zonacards/ui/phone-field`

### `zc-phone-field` · PhoneFieldComponent

<zc-phone-field> · bandera + prefijo + número. Solo dígitos, largo por país y grupos de 3 ("987 654 321"). El prefijo es un combobox con búsqueda por país o prefijo; los 6 países del alcance van primero. Valor: { country: 'pe', number: '987654321' } (solo dígitos). Validar con zcValidators.phone().

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[disabled]` |  | `false` |  |
| `[invalid]` |  | `false` |  |
| `[(value)]` | `PhoneValue` | `{ country: 'pe', number: '' }` |  |

```html
<zc-phone-field [value]="dest().phone" (valueChange)="patchDest({ phone: $event })" />
```

## `@zonacards/ui/pipeline`

### `zc-pipeline` · PipelineComponent

<zc-pipeline [stages]="etapas" country="pe" [(selected)]="etapa" /> · etapas con conteo y monto (o-domain, liquidaciones). Cada etapa es un botón que filtra (aria-pressed); el color va con ícono y texto. 2 columnas en móvil, 3 en tablet, 6 en desktop.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[stages]` | `readonly ZcPipelineStage[]` | **obligatorio** |  |
| `[country]` | `CountryCode` | **obligatorio** |  |
| `[label]` | `string` | **obligatorio** |  |
| `[unit]` |  | `''` | Qué se cuenta ("liquidaciones"), para el nombre accesible. |
| `[(selected)]` | `string \| null` | `null` |  |

```html
<zc-pipeline label="Liquidaciones por etapa" unit="liquidaciones" [stages]="stages" country="pe" [(selected)]="stage" />
```

## `@zonacards/ui/popover`

### `zc-info-popover` · InfoPopoverComponent

<zc-info-popover heading="Breakage" triggerText="¿Qué es breakage?">Texto… <a zcLink …>Ver reporte</a></zc-info-popover> Popover informativo (Popover de index.html): explica un término o dato sin sacar al usuario de la pantalla. Clic abre y cierra; Escape o clic fuera cierran y el foco vuelve al botón. En móvil, bottom sheet. Sin triggerText es un botón de solo ícono (?) con aria-label = heading.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[heading]` | `string` | **obligatorio** |  |
| `[triggerText]` |  | `''` |  |
| `[width]` |  | `320` |  |

```html
<zc-info-popover heading="Breakage" triggerText="¿Qué es breakage?">
  <p class="m-0">Saldo de giftcards vencidas que nunca se usó. Se reconoce como ingreso al vencer y aparece en el reporte Breakage y Pasivo.</p>
  <a zcLink href="#m-feedback" class="justify-self-start text-fg" [external]="true">Ver reporte</a>
  </zc-info-popover>
```

## `@zonacards/ui/progress`

### `zc-progress` · ProgressComponent

<zc-progress label="Envío en curso" [value]="332" [max]="500" valueText="332/500" /> · sobre spartan progress.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[label]` | `string` | **obligatorio** |  |
| `[value]` | `number \| null` | `0` |  |
| `[max]` |  | `100` |  |
| `[variant]` | `'bar' \| 'circular' \| 'meter'` | `'bar'` |  |
| `[valueText]` |  | `''` | Texto visible a la derecha (ej. "332/500"); por defecto, el porcentaje. |
| `[showLabel]` |  | `true` |  |
| `[tone]` | `ProgressTone \| null` | `null` | Fuerza un color; si no, neutral en bar/circular y por umbral en meter. |
| `[warnAt]` |  | `75` |  |
| `[dangerAt]` |  | `90` |  |

```html
<zc-progress variant="circular" label="66% activado" [value]="66" />
```

## `@zonacards/ui/qr`

### `zc-qr` · QrComponent

<zc-qr [seed]="42" /> · código QR de muestra para vistas previas (pase Wallet, vales). Decorativo: no codifica datos. En producción el QR real lo genera el backend o Apple/Google; aquí solo se dibuja la forma (3 marcas de posición + módulos). Siempre negro sobre blanco (tokens --qr-*) para que el contraste sea el de un código legible.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[seed]` |  | `7` |  |

## `@zonacards/ui/radio`

### `zc-radio-group` · RadioGroupComponent

<zc-radio-group label="Canal de envío" [(value)]="canal"> <zc-radio value="mail">Correo</zc-radio> … </zc-radio-group> Sobre spartan radio-group: flechas recorren y marcan, Tab sale del grupo. Funciona con formularios reactivos. variant="card" para tarjetas seleccionables (opciones con descripción, precio o imagen).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[label]` |  | `''` |  |
| `[variant]` | `'list' \| 'card'` | `'list'` |  |
| `[orientation]` | `'vertical' \| 'horizontal'` | `'vertical'` |  |

```html
<zc-radio-group label="Radio · Canal de envío" [(value)]="canal">
  <zc-radio value="mail">Correo electrónico</zc-radio>
  <zc-radio value="whatsapp">WhatsApp</zc-radio>
  <zc-radio value="zip">Archivo ZIP</zc-radio>
  <zc-radio value="sms" [disabled]="true">SMS (fuera de alcance)</zc-radio>
  </zc-radio-group>
```

### `zc-radio` · RadioComponent

<zc-radio value="mail" description="…">Correo electrónico</zc-radio> · siempre dentro de <zc-radio-group>. Toda la fila (o la tarjeta) es clicable. Contenido extra a la derecha de la tarjeta con el atributo zcRadioAside. Tarjeta con ícono (Cards de index.html, "Códigos propios"): [icon] + [subtitle]; el radio va a la derecha y la descripción abajo.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[value]` | `unknown` | **obligatorio** |  |
| `[description]` |  | `''` |  |
| `[disabled]` |  | `false` |  |
| `[icon]` | `IconName \| null` | `null` | Solo en tarjeta: ícono en un recuadro a la izquierda. |
| `[subtitle]` |  | `''` |  |

```html
<zc-radio value="mail">Correo electrónico</zc-radio>
```

## `@zonacards/ui/recipients-editor`

### `zc-recipients-editor` · RecipientsEditorComponent

<zc-recipients-editor [(rows)]="destinatarios" [available]="50" (importExcel)="…" /> · tabla editable (o-grid de index.html, paso de destinatarios del portal de empresas). Edición en línea con validación por celda al salir del campo, cantidades con −/+ limitadas a lo disponible, agregar, limpiar y quitar filas, acciones masivas y resumen en vivo. En móvil, una tarjeta por fila. validate() marca to

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(rows)]` | `ZcRecipient[]` | **obligatorio** |  |
| `[available]` | `number` | **obligatorio** |  |
| `(importExcel)` | `void` |  |  |
| `[contact]` | `ZcRecipientContact` | `'email'` | Canal de entrega: 'email' (por defecto), 'phone' (WhatsApp), 'both' o 'any' (al menos uno). |
| `[country]` |  | `'pe'` | País del WhatsApp: largo del número y código de país. |

```html
<zc-recipients-editor #rec [(rows)]="recipients" [available]="50" (importExcel)="importExcel()" />
```

Métodos: `shownError(r: ZcRecipient, k: Key)` El error se muestra recién al salir del campo (o al validar todo). · `validate()` Marca todo y enfoca el primer error. Devuelve cuántas filas tienen datos por corregir y cuántas no tienen cantidad.

## `@zonacards/ui/recurrence`

### `zc-recurrence` · RecurrenceComponent

<zc-recurrence [(value)]="regla" timeZone="America/Lima" timeZoneLabel="Hora de Lima (UTC−5)" /> Frecuencia, intervalo, días (semanal), modo mensual, hora, fin (nunca, fecha, N veces), una frase que resume la regla y las próximas fechas. Semanal sin días muestra el error y no da fechas.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(value)]` | `RecurRule` | `DEFAULT_RECUR` |  |
| `[timeZone]` |  | `'America/Lima'` |  |
| `[timeZoneLabel]` |  | `''` |  |
| `[from]` | `IsoDate \| null` | `null` | Primer día posible (por defecto, hoy en la zona horaria). |
| `[preview]` |  | `4` | Cuántas próximas fechas mostrar. |

```html
<zc-recurrence [(value)]="regla" timeZone="America/Lima" timeZoneLabel="Hora de Lima (UTC−5)" />
```

## `@zonacards/ui/rich-text`

### `zc-rich-text` · RichTextComponent

<zc-field label="Mensaje" [counter]="r.counter()" [error]="r.error()"><zc-rich-text #r [(value)]="html" [maxLength]="1000" /></zc-field> Negrita, cursiva, subrayado, tachado, título, cita, listas, enlace, quitar formato, deshacer y rehacer. Atajos Ctrl+B/I/U/K; la barra es un toolbar (flechas, Inicio y Fin). Pegar quita el formato de origen. value es el HTML ya sanitizado (sanitizeRichText).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(value)]` |  | `''` |  |
| `[maxLength]` |  | `1000` |  |
| `[placeholder]` |  | `''` |  |

```html
<zc-rich-text #r [(value)]="html" [maxLength]="1000" placeholder="Escribe un saludo para acompañar la gift card…" />
```

Métodos: `state()` Estado de los botones y contador. · `keepSelection(e: MouseEvent)` Los botones no roban la selección del texto.

## `@zonacards/ui/rule-builder`

### `zc-rule-builder` · RuleBuilderComponent

<zc-rule-builder [fields]="campos" [(rule)]="regla" country="pe" /> · constructor de reglas y segmentos (o-rules de index.html). Condiciones con campo, operador y valor, unidas con Todas (Y) / Alguna (O), con un nivel de grupos anidados. Debajo, la frase que resume la regla. Sirve para antifraude, promociones, límites y segmentación.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[fields]` | `readonly ZcRuleField[]` | **obligatorio** |  |
| `[(rule)]` | `ZcRuleGroup` | **obligatorio** |  |
| `[country]` | `CountryCode` | `'pe'` |  |

```html
<zc-rule-builder [fields]="ruleFields" [(rule)]="rule" country="pe" />
```

Métodos: `decimals(f: ZcRuleField)` Decimales del campo: los indicados, o los de la moneda del país (S/ 2, CLP 0) en money.

## `@zonacards/ui/scanner`

### `zc-scanner` · ScannerComponent

<zc-scanner (scanned)="validar($event)" (manual)="ingresarCodigo()" /> · escáner QR y de código de barras para canjes (o-scanner de index.html). Visor con guía de encuadre de 240 px, línea de escaneo (se detiene con movimiento reducido), linterna, cambio de cámara e "Ingresar código" siempre visible. start() pide la cámara; usa BarcodeDetector si el navegador lo tiene (en la app: ZXing, ML Kit o A

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `(scanned)` | `string` |  |  |
| `(manual)` | `void` |  |  |

```html
<zc-scanner (scanned)="onScanned($event)" (manual)="openManual()" />
```

Métodos: `start()` Abre la cámara (trasera por defecto) y busca códigos cada 350 ms.

## `@zonacards/ui/secret-field`

### `zc-secret-field` · SecretFieldComponent

<zc-field label="API Key de la campaña" hint="Se muestra completa solo a roles autorizados y queda auditado."> <zc-secret-field [value]="key" [canReveal]="puedeVer" (revealed)="auditar()" /> </zc-field> Snippet de credenciales: enmascarado con los últimos 4 visibles, mostrar (evento para auditoría) y copiar con confirmación.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[value]` | `string` | **obligatorio** |  |
| `[canReveal]` |  | `true` | Solo los roles autorizados ven el valor completo; copiar siempre copia el valor real. |
| `[keepPrefix]` |  | `''` | Prefijo que se deja visible ("zc_live_"). |
| `(revealed)` | `void` |  | Se mostró el valor completo (para registrarlo en la auditoría). |

```html
<zc-secret-field value="zc_live_4f8c21a9d0b37e65c1f27f2a" keepPrefix="zc_live_" />
```

## `@zonacards/ui/segmented`

### `zc-segmented` · SegmentedComponent

<zc-segmented label="Estilo de logo" [options]="…" [(value)]="x" /> · ToggleButtonGroup (".seg-group" de index.html): 2 a 5 opciones excluyentes siempre visibles (vista, densidad, periodo, escala). Grupo de radio: Tab entra a la opción marcada, las flechas cambian y mueven el foco (con vuelta, saltando las deshabilitadas). size="sm" para barras de herramientas (gráficos, tablas). Si no cabe, se de

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[options]` | `readonly ZcSegment<T>[]` | **obligatorio** |  |
| `[(value)]` | `T \| null` | `null` |  |
| `[label]` | `string` | **obligatorio** |  |
| `[size]` | `'md' \| 'sm'` | `'md'` |  |

```html
<zc-segmented zcChartFilters size="sm" label="Periodo" [options]="periodSegs" [(value)]="trendPeriod" />
```

## `@zonacards/ui/select`

### `zc-select, zc-combobox` · SelectComponent

<zc-select> y <zc-combobox> · un solo componente: sin <select> nativo.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[options]` | `readonly ZcOption<T>[]` | **obligatorio** |  |
| `[multiple]` |  | `false` |  |
| `[searchable]` | `boolean \| 'auto'` | `'auto'` | 'auto': búsqueda solo si hay más de 8 opciones. |
| `[placeholder]` |  | `''` |  |
| `[searchPlaceholder]` |  | `''` |  |
| `[disabled]` |  | `false` |  |
| `[invalid]` |  | `false` |  |
| `[icon]` | `IconName \| null` | `null` | Ícono decorativo al inicio del disparador. |
| `[compact]` |  | `false` | El disparador muestra el dato corto (meta) en vez del nombre: "+51" en el teléfono. |
| `[appearance]` | `'default' \| 'inline'` | `'default'` | 'inline': sin borde, dentro de otro control (prefijo del teléfono). |
| `[size]` | `'md' \| 'sm'` | `'md'` | 'sm': altura --target-sm, para barras densas (filas por página del paginador). |
| `[ariaLabel]` |  | `''` | Nombre accesible cuando no está dentro de un zc-field, y título del sheet. |
| `[fieldLink]` |  | `true` | false: no toma el id ni la etiqueta del zc-field que lo contiene (es parte de otro control). |
| `[(value)]` | `T \| T[] \| null` | `null` |  |

```html
<zc-select [options]="countryOptions" [multiple]="true" placeholder="País" [value]="countries()" (valueChange)="countries.set($any($event))" />
```

## `@zonacards/ui/session-timeout`

### `zc-session-timeout` · SessionTimeoutComponent

Aviso de sesión por expirar (o-filter de index.html): alertdialog con cuenta regresiva. "Seguir conectado" emite (extend); "Cerrar sesión" o llegar a 0 emiten (logout). No se cierra con el scrim. Escape (o deslizar el sheet en móvil) es actividad del usuario: cuenta como "Seguir conectado". La app lo abre cuando detecta inactividad (por ejemplo, 14 de 15 minutos).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(open)]` |  | `false` |  |
| `[seconds]` |  | `60` | Segundos de aviso antes de cerrar la sesión. |
| `(extend)` | `void` |  |  |
| `(logout)` | `void` |  |  |

```html
<zc-session-timeout [(open)]="sessionOpen" (extend)="toast.success('Sesión extendida', { text: 'Seguirás conectado 15 minutos más.' })" (logout)="toast.info('Sesión cerrada', { text: 'En la app vuelve al inicio de sesión.' })" />
```

## `@zonacards/ui/sidebar`

### `zc-sidebar` · SidebarComponent

<zc-sidebar [groups]="…" /> · navegación principal (sección 20 y 21 de las reglas).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[groups]` | `readonly ZcNavGroup[]` | **obligatorio** |  |
| `[label]` |  | `''` | Nombre accesible de la navegación. |
| `[brandTitle]` |  | `''` | Título del encabezado (marca o producto). Sin título, el encabezado solo aparece en el drawer. |
| `[appearance]` | `'surface' \| 'tint' \| 'brand'` | `'surface'` |  |
| `[storageKey]` |  | `'zc-sb-mode'` | Clave para guardar expandido/riel. |
| `[shortcut]` |  | `true` | Ctrl+B alterna el menú. |
| `[contained]` |  | `false` | Dentro de un marco (catálogo): el drawer y el scrim se posicionan respecto del contenedor, no de la ventana. |
| `[(current)]` | `string \| null` | `null` | Ítem actual cuando los ítems no tienen ruta. |
| `[tablet]` | `'rail' \| 'drawer'` | `'rail'` | Tablet: riel de íconos (por defecto) o el mismo cajón que en móvil. |
| `(navigate)` | `string` |  |  |

```html
<zc-sidebar #demoSb [groups]="demoNav" [contained]="true" [shortcut]="false" brandTitle="Portal de empresas" label="Navegación del portal (demostración)"
  storageKey="zc-sb-demo" [appearance]="asAppearance(sbAppearance())" [(current)]="sbCurrent">
  <span zcSidebarBrand class="grid size-8 shrink-0 place-items-center rounded-sm bg-secondary text-sm font-bold text-on-secondary" aria-hidden="true">G</span>
  </zc-sidebar>
```

Métodos: `open()` Abre el drawer (móvil) o el menú completo sobre el contenido (tablet). El foco vuelve al disparador al cerrar. · `setPref(next: 'full' | 'rail')` Expandido o riel en desktop (se recuerda por usuario).

## `@zonacards/ui/signature`

### `zc-signature` · SignatureComponent

<zc-field label="Firma del responsable" [required]="true" [hint]="…" [error]="s.error()" [success]="s.success()"> <zc-signature #s (signed)="guardar($event)" /> </zc-field> Dibujar con dedo, lápiz o mouse (el grosor sigue la presión y la velocidad), o escribir el nombre como alternativa accesible. Deshacer trazo, limpiar y validación de firma vacía (menos de 8 puntos, o nombre sin apellido).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `(signed)` | `SignatureResult` |  |  |

```html
<zc-signature #s (signed)="signed($event)" />
```

## `@zonacards/ui/skeleton`

### `zc-skeleton` · SkeletonComponent

Estado de carga con la forma del contenido final (nunca un spinner a pantalla completa). Sobre spartan skeleton. · line: párrafo de [lines] líneas (la última más corta).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[variant]` | `'line' \| 'block' \| 'card' \| 'table-row'` | `'line'` |  |
| `[lines]` |  | `3` |  |
| `[columns]` |  | `4` |  |

```html
<zc-skeleton [lines]="3" />
```

## `@zonacards/ui/slider`

### `zc-slider` · SliderComponent

<zc-field label="Comisión del cliente" hint="0 %" [counter]="texto"><zc-slider [(value)]="x" [min]="0" [max]="15" [step]="0.5" [format]="fmt" /></zc-field> Slider de un valor sobre input range nativo (flechas, Inicio/Fin, Re Pág/Av Pág). format da el texto que se anuncia y se muestra.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(value)]` |  | `0` |  |
| `[min]` |  | `0` |  |
| `[max]` |  | `100` |  |
| `[step]` |  | `1` |  |
| `[disabled]` |  | `false` |  |
| `[ariaLabel]` |  | `''` |  |
| `[format]` | `(v: number) => string` | `v: number` | Texto del valor ("4,5 %"); por defecto, el número. |

```html
<zc-slider [(value)]="comision" [min]="0" [max]="15" [step]="0.5" [format]="pct" />
```

### `zc-range-slider` · RangeSliderComponent

<zc-field label="Rango de monto" [counter]="…"><zc-range-slider [(value)]="[50, 500]" [min]="0" [max]="1000" [step]="10" [minGap]="10" /></zc-field> Dos pulgares que no se cruzan (minGap de separación mínima). Cada uno se anuncia como "Monto mínimo" y "Monto máximo".

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(value)]` | `[number, number]` | `[0, 100]` |  |
| `[min]` |  | `0` |  |
| `[max]` |  | `100` |  |
| `[step]` |  | `1` |  |
| `[minGap]` |  | `0` | Separación mínima entre los dos valores. |
| `[disabled]` |  | `false` |  |
| `[minLabel]` |  | `''` |  |
| `[maxLabel]` |  | `''` |  |
| `[format]` | `(v: number) => string` | `v: number` |  |

```html
<zc-range-slider [(value)]="rango" [min]="0" [max]="1000" [step]="10" [minGap]="10" minLabel="Monto mínimo" maxLabel="Monto máximo" [format]="soles" />
```

## `@zonacards/ui/sortable`

### `[zcSortable]` · SortableItemDirective

Reordenar con drag & drop (o-sortable de index.html), sobre signals y sin librerías: <ol [(zcSortable)]="cats" [zcSortableLabel]="labelOf" #s="zcSortable"> @for (c of cats(); track c.id) { <li [zcSortableItem]="c"><button zcSortableHandle [item]="c">…grip…</button> …</li> } </ol> · Mouse y táctil: se arrastra desde el asa (copia flotante que sigue al puntero; el original queda punteado).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[item]` | `T` | **obligatorio** |  |

### `[zcSortableHandle]` · SortableHandleDirective

Asa de arrastre: botón con aria-pressed mientras está tomado. Ponle aria-label (o usa [label]).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[item]` | `T` | **obligatorio** |  |
| `[label]` |  | `''` |  |

## `@zonacards/ui/sparkline`

### `zc-sparkline` · SparklineComponent

<zc-sparkline [values]="[3, 5, 4, 8]" tone="success" /> Â· tendencia mÃ­nima para KPI (Cards de index.html). Decorativo: el dato y la variaciÃ³n ya estÃ¡n en texto al lado.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[values]` | `readonly number[]` | **obligatorio** |  |
| `[tone]` | `'success' \| 'danger' \| 'neutral'` | `'success'` |  |
| `[w]` |  | `88` |  |
| `[h]` |  | `28` |  |

## `@zonacards/ui/spinner`

### `zc-spinner` · SpinnerComponent

```html
<zc-spinner [size]="16" />
```

## `@zonacards/ui/split`

### `zc-split` · SplitComponent

<zc-split [(size)]="ancho" storageKey="aprobaciones-split"> <div zcSplitStart>lista</div> <div zcSplitEnd>detalle</div> </zc-split> Dos paneles con un separador que se arrastra: lista y detalle, editor y vista previa, filtros y resultados. · size: porcentaje del primer panel (entre min y max). Con storageKey se recuerda por usuario.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[orientation]` | `'horizontal' \| 'vertical'` | `'horizontal'` |  |
| `[initial]` |  | `40` | Porcentaje inicial del primer panel. |
| `[(size)]` | `number` | `NaN` |  |
| `[min]` |  | `20` |  |
| `[max]` |  | `80` |  |
| `[storageKey]` |  | `''` |  |
| `[stackBelow]` |  | `768` | Ancho del contenedor (px) por debajo del cual los paneles se apilan sin separador. |
| `[label]` |  | `''` | Nombre accesible del separador ("Ancho de la lista"). |

```html
<zc-split class="h-72 rounded-md border border-border" storageKey="catalogo-split" label="Ancho de la lista" [initial]="38">
```

## `@zonacards/ui/sso-button`

### `button[zcSso]` · SsoButtonComponent

<button zcSso provider="google" theme="light" text="continue"></button> · acceso con Google, Apple o Microsoft (Entra ID), según las guías de cada marca: logo sin modificar, texto aprobado y colores propios. shape: pill (Google y Apple por defecto) o rect (Microsoft); text null = solo logo (lleva aria-label de "Iniciar sesión con …"). block: todo el ancho (formularios de acceso). loading: "Redirig

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[provider]` | `SsoProvider` | **obligatorio** |  |
| `[theme]` | `SsoTheme` | `'light'` |  |
| `[text]` | `SsoText \| null` | `'continue'` |  |
| `[shape]` | `'pill' \| 'rect' \| null` | `null` |  |
| `[block]` |  | `false` |  |
| `[loading]` |  | `false` |  |

```html
<button zcSso provider="google" [theme]="$any(th)" [text]="ssoText()" [loading]="ssoBusy() === 'g-' + th" (click)="sso('g-' + th, 'Google')">
```

## `@zonacards/ui/state`

### `zc-state` · StateComponent

<zc-state> · estado vacío, sin resultados, sin acceso, enlace vencido o error. Qué pasó (título), por qué o qué se conservó (texto) y una acción para salir (contenido). En error: referencia y, si se pasa [details], "Ver detalles técnicos" con "Copiar detalles" para soporte.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[kind]` | `'empty' \| 'error'` | `'empty'` |  |
| `[icon]` | `IconName` | `'s:box'` |  |
| `[title]` | `string` | **obligatorio** |  |
| `[text]` |  | `''` |  |
| `[reference]` |  | `''` |  |
| `[details]` | `TechDetails \| null` | `null` |  |

```html
<zc-state icon="s:magnifier" title="Sin resultados" text="Ningún lote coincide con la búsqueda o los filtros. Prueba quitar alguno.">
  <button zcButton variant="outline" (click)="clearFilters()">Limpiar filtros</button>
  </zc-state>
```

## `@zonacards/ui/stepper`

### `zc-stepper` · StepperComponent

<zc-stepper [steps]="['Empresa', 'Contacto', 'Comercial', 'Resumen']" [current]="paso" label="Nuevo cliente" /> Desktop y tablet: pasos horizontales (hechos con check, actual destacado, aria-current="step"); se desplaza si no caben. Móvil: compacto, "Paso 2 de 4: Contacto" con barra de progreso.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[steps]` | `readonly string[]` | **obligatorio** |  |
| `[current]` |  | `0` | Índice del paso actual (desde 0). |
| `[label]` | `string` | **obligatorio** |  |

```html
<zc-stepper label="Nuevo cliente" [steps]="steps" [current]="step()" />
```

### `zc-form-summary` · FormSummaryComponent

<zc-form-summary [errors]="…" /> · resumen de errores al tope del formulario (sección 5 de las reglas). Al fallar el envío, la página llama a focus(): el resumen recibe el foco y se anuncia; cada error es un enlace que lleva al campo. Sin errores no ocupa espacio.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[errors]` | `readonly ZcFormError[]` | `[]` |  |

```html
<zc-form-summary [errors]="summaryErrors()" />
```

## `@zonacards/ui/subnav`

### `zc-subnav` · SubnavComponent

Menú secundario (configuración, layout 3 "Riel + menú secundario" de index.html). Desktop y tablet: columna con la lista de secciones. Móvil: pestañas desplazables arriba del contenido. Con link navega (routerLink); sin link emite el cambio en [(current)].

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[items]` | `ZcSubnavItem[]` | **obligatorio** |  |
| `[label]` | `string` | **obligatorio** |  |
| `[(current)]` | `string \| null` | `null` |  |

```html
<zc-subnav class="border-border bg-surface p-2 md:border-r" label="Configuración" [items]="subnav" [(current)]="subnavCurrent" />
```

## `@zonacards/ui/support`

### `zc-support-sheet` · SupportSheetComponent

<zc-support-sheet [(open)] [info]> · "Ayuda y soporte": horario y una fila por canal disponible (llamar, WhatsApp, correo, centro de ayuda). Cada fila es un solo enlace con el canal y el dato (`tel:`, `wa.me`, `mailto:` o la dirección web), de 56 px. Hoja en móvil.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(open)]` |  | `false` |  |
| `[info]` | `SupportInfo` | **obligatorio** |  |

```html
<zc-support-sheet [info]="support" [(open)]="supportOpen" />
```

Métodos: `waLink(n: string)` WhatsApp abre el chat con solo los dígitos del número.

## `@zonacards/ui/switch`

### `zc-switch` · SwitchComponent

<zc-switch [(checked)]="x" description="…">Alertas de stock</zc-switch> · sobre spartan switch. Activa algo de inmediato (sin botón Guardar). Toda la fila es clicable; Espacio alterna. sm para filas densas.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(checked)]` |  | `false` |  |
| `[description]` |  | `''` |  |
| `[disabled]` |  | `false` |  |
| `[size]` | `'md' \| 'sm'` | `'md'` |  |

```html
<zc-switch [(checked)]="alertas">Alertas de stock</zc-switch>
```

## `@zonacards/ui/table`

### `ng-template[zcCell]` · DataTableComponent

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[data]` | `readonly T[]` | `[]` |  |
| `[columns]` | `readonly ZcColumn<T>[]` | `[]` |  |
| `[rowId]` | `(row: T) => string` | `row: T` |  |
| `[rowLabel]` | `(row: T) => string` | `row: T` | Nombre de la fila para lectores de pantalla: "lote #02829". |
| `[caption]` | `string` | **obligatorio** | Nombre de la tabla (caption); se completa con el orden actual. |
| `[selectable]` |  | `false` |  |
| `[loading]` |  | `false` |  |
| `[manualSort]` |  | `false` | Orden en el servidor: la tabla solo emite [(sort)] y muestra las filas tal como llegan. |
| `[maxHeight]` | `string \| null` | `null` |  |
| `[toolbar]` |  | `true` | Barra con Columnas y Densidad. Sin ella para tablas cortas de detalle (resultado parcial, guías): sin columna fija y con texto en varias líneas. |
| `[(sort)]` | `ZcSort` | `null` |  |
| `[(selection)]` | `string[]` | `[]` |  |
| `[(density)]` | `ZcDensity` | `'comfortable'` |  |
| `[resizable]` |  | `false` | Columnas con asa para cambiar el ancho (arrastrar, flechas ±16 px, doble clic restablece). Anchos en [(widths)] (px por id). |
| `[(widths)]` | `Record<string, number>` | `{}` |  |
| `[virtual]` |  | `false` | Filas virtuales: solo se dibujan las visibles (miles de filas sin perder fluidez). Requiere [maxHeight]. Las filas tienen alto fijo (densidad), así que no hay fila expandible (zcRowDetail) en este mod |

```html
<ng-template zcCell="name" [zcCellOf]="tableRows()" let-l>
```

Métodos: `toggleSort(id: string)` Primer clic ascendente; el siguiente alterna.

### `ng-template[zcCardsView]` · DataViewComponent

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(view)]` | `DataViewMode` | `'cards'` |  |
| `[selectable]` |  | `false` |  |
| `[(selection)]` | `string[]` | `[]` | Ids seleccionados (en tarjetas, cada zc-card con su checkbox los actualiza). |
| `[ids]` | `readonly string[]` | `[]` | Ids de la página visible, para "Seleccionar todas". |

```html
<ng-template zcCardsView>
```

Métodos: `toggle(id: string, v: boolean)` Agrega o quita un id (checkbox de una tarjeta).

### `ng-template[zcFilterMain]` · FilterBarComponent

Hasta 3 filtros principales: en línea desde 1024 px; dentro del panel de filtros por debajo.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(query)]` |  | `''` |  |
| `[searchLabel]` | `string` | **obligatorio** |  |
| `[searchPlaceholder]` |  | `''` |  |
| `[chips]` | `readonly ZcFilterChip[]` | `[]` |  |
| `[resultText]` |  | `''` | Resultado con la unidad: "144 lotes" (subtítulo y botón del panel). |
| `[(panelOpen)]` |  | `false` |  |
| `[moreCount]` | `number \| null` | `null` | Desde 1024 px la insignia de "Más filtros" cuenta solo los filtros del panel; sin valor, cuenta todos los chips. |
| `(removeChip)` | `ZcFilterChip` |  |  |
| `(clearAll)` | `void` |  |  |

```html
<ng-template zcFilterMain>
```

Métodos: `remove(c: ZcFilterChip, i: number)` Al quitar un chip el foco pasa al siguiente (o al botón de filtros): nunca se pierde en la página.

## `@zonacards/ui/tabs`

### `zc-tabs` · TabsComponent

<zc-tabs> · sobre spartan brain tabs (flechas izquierda/derecha, Inicio/Fin, una seleccionada).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[tabs]` | `readonly ZcTab[]` | **obligatorio** |  |
| `[variant]` | `'line' \| 'segmented'` | `'line'` |  |
| `[label]` |  | `''` | Nombre accesible del grupo de pestañas. |

```html
<zc-tabs variant="segmented" label="Ejemplo horizontal" [tabs]="scrollTabs" [(value)]="scrollTab">
  <!-- Paneles solo para lectores de pantalla: la demo muestra el desplazamiento de las pestañas, no su contenido. -->
  @for (t of scrollTabs; track t.value) { <div [zcTabPanel]="t.value" class="sr-only">Contenido de {{ t.label }}</div> }
  </zc-tabs>
```

### `[zcTabPanel]` · TabPanelDirective

Panel de una pestaña: <div zcTabPanel="datos">…</div>. Solo se muestra el activo.

## `@zonacards/ui/tags-field`

### `zc-tags-field` · TagsFieldComponent

<zc-tags-field [max]="5"> · varios correos (o etiquetas) en un campo. Enter, coma, punto y coma o espacio agregan; pegar una lista la separa; Retroceso con el campo vacío quita el último. Cada etiqueta se valida por separado (chip inválido con ícono); los repetidos se avisan y no se agregan. Valor: string[]. Validar con zcValidators.emails(max).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[max]` | `number \| null` | `null` |  |
| `[kind]` | `'email' \| 'text'` | `'email'` |  |
| `[placeholder]` |  | `''` |  |
| `[disabled]` |  | `false` |  |
| `[invalid]` |  | `false` |  |
| `[(value)]` | `string[]` | `[]` |  |

```html
<zc-tags-field [max]="5" placeholder="Escribe un correo y presiona Enter" formControlName="mails" />
```

## `@zonacards/ui/tax-id-field`

### `zc-tax-id-field` · TaxIdFieldComponent

<zc-tax-id-field [country]="'pe'"> · RUC, NIT, RUT o RFC según el país. Rechaza los caracteres que el país no usa mientras se escribe y da formato al salir (guion del verificador, mayúsculas). Al cambiar de país se vacía. Validar con zcValidators.taxId(país): incluye el dígito verificador.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[country]` | `CountryCode` | **obligatorio** |  |
| `[disabled]` |  | `false` |  |
| `[invalid]` |  | `false` |  |
| `[(value)]` |  | `''` |  |

```html
<zc-tax-id-field [country]="countryCode()" formControlName="taxId" />
```

## `@zonacards/ui/templates`

### `[zcPageHeader]` · PageActionsSlot

Plantillas de página (t-templates de index.html): solo distribuyen organismos, no traen datos ni textos. Cada slot es un atributo sobre el elemento proyectado. Todas son de una columna en móvil. Listado <zc-list-page> zcPageHeader · zcPageKpis

### `zc-list-page` · ListPageComponent

```html
<zc-list-page>
```

### `zc-detail-page` · DetailPageComponent

### `zc-form-page` · FormPageComponent

### `zc-dashboard-page` · DashboardPageComponent

## `@zonacards/ui/time-field`

### `zc-time-field` · TimeFieldComponent

<zc-time-field from="06:00" to="22:00"> · se escribe hh:mm (24 h, dos puntos automáticos) o se elige cada 30 min. Un solo ícono, a la derecha, abre la lista (también Alt+↓). Valor: "hh:mm" o el texto escrito si no es válido. Para un rango desde–hasta, usar zcValidators.timeRange() en el grupo.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[from]` |  | `'00:00'` |  |
| `[to]` |  | `'23:30'` |  |
| `[step]` |  | `30` |  |
| `[ariaLabel]` |  | `''` | Nombre accesible si comparte la etiqueta con otro campo (rango desde–hasta). |
| `[fieldLink]` |  | `true` | false: no toma el id del zc-field (segundo campo de un rango). |
| `[disabled]` |  | `false` |  |
| `[invalid]` |  | `false` |  |
| `[(value)]` | `string \| null` | `null` |  |

```html
<zc-time-field from="07:00" to="21:00" [value]="dest().time" (valueChange)="patchDest({ time: $event })" />
```

## `@zonacards/ui/timeline`

### `zc-timeline` · TimelineComponent

<zc-timeline [items]="historial" label="Historial de la giftcard" /> · historial vertical (o-domain de index.html).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[items]` | `readonly ZcTimelineItem[]` | **obligatorio** |  |
| `[label]` |  | `''` |  |

```html
<zc-timeline label="Historial de la giftcard" [items]="history" />
```

## `@zonacards/ui/toast`

### `zc-toast` · ToastComponent

Un toast. Su temporizador se pausa con el mouse encima o con foco dentro (WCAG 2.2.1).

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[toast]` | `Toast` | **obligatorio** |  |

### `zc-toaster` · ToasterComponent

<zc-toaster /> · región de toasts (una sola, en el shell). Desktop: abajo a la derecha, 400 px. Móvil: ancho completo al pie, sobre el área segura. Las regiones existen siempre, así los lectores de pantalla anuncian lo que entra: errores en role="alert"; éxito e información en aria-live="polite".

## `@zonacards/ui/tooltip`

### `[zcTooltip]` · TooltipDirective

[zcTooltip]="texto" · sobre spartan tooltip. Aparece con mouse y con foco de teclado, Escape lo oculta, se enlaza con aria-describedby y nunca contiene acciones. En táctil no aparece: usa texto visible o (?) con popover. Botón deshabilitado con motivo: un botón disabled no recibe foco ni mouse, así que el tooltip va en un contenedor enfocable: <span zcTooltip="Completa los campos obligatorios" tab

## `@zonacards/ui/tour`

### `zc-tour` · TourComponent

Tour guiado con spotlight (o-tour de index.html): resalta un elemento real y explica para qué sirve. Atrás, Siguiente, Saltar; Escape cierra y el foco vuelve a quien lo abrió; el foco queda dentro de la tarjeta. En móvil la tarjeta va abajo. Nunca más de 5 pasos. start(origen) lo abre.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[steps]` | `TourStep[]` | **obligatorio** |  |
| `(finished)` | `boolean` |  | Terminó (con Terminar) o se cerró antes (Saltar, Escape, X). |

```html
<zc-tour #tour [steps]="tourSteps" (finished)="tourDone($event)" />
```

Métodos: `trap(e: KeyboardEvent)` El foco no sale de la tarjeta.

## `@zonacards/ui/tree`

### `zc-tree` · TreeComponent

<zc-tree [nodes]="categorias" [(expanded)]="abiertos" [(selected)]="elegidos" selection="checkbox" label="Permisos" /> Jerarquías: categorías, estructura de clientes y locales, permisos, carpetas. Patrón ARIA tree con foco itinerante. · Teclado: ↑ ↓ recorren lo visible, → abre o baja al primer hijo, ← cierra o sube al padre, Inicio/Fin, Enter o Espacio eligen, abre los hermanos, y escribir salta a

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[nodes]` | `readonly ZcTreeNode[]` | **obligatorio** |  |
| `[label]` | `string` | **obligatorio** | Nombre accesible del árbol. |
| `[selection]` | `ZcTreeSelection` | `'single'` |  |
| `[(expanded)]` | `string[]` | `[]` |  |
| `[(selected)]` | `string[]` | `[]` |  |
| `(activate)` | `ZcTreeNode` |  | Nodo activado con Enter o clic (navegar a su detalle). |

```html
<zc-tree label="Clientes y locales" [nodes]="clientes" selection="single" [(expanded)]="openNav" [(selected)]="selNav" />
```

## `@zonacards/ui/ubigeo`

### `zc-ubigeo-select` · UbigeoSelectComponent

<zc-ubigeo-select [(value)]="distrito" /> · departamento › provincia › distrito del Perú (INEI). El valor es el código del distrito (6 dígitos) o null. Cambiar el departamento limpia la provincia y el distrito; la provincia, el distrito. Cada nivel es un combobox con búsqueda. `located` entrega el distrito con sus coordenadas (centro de mapa). Carga `geo/ubigeo-pe.json` una sola vez (o pásale `[da

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[(value)]` | `string \| null` | `null` | Código del distrito (INEI, 6 dígitos). |
| `[required]` |  | `false` |  |
| `[disabled]` |  | `false` |  |
| `[error]` | `string \| null` | `null` |  |
| `[data]` | `Ubigeo \| null` | `null` | Datos ya cargados; si se omite, se descargan de `url`. |
| `[url]` |  | `'geo/ubigeo-pe.json'` |  |
| `(located)` | `UbigeoDistrict` |  | Distrito elegido, con sus coordenadas, para centrar un mapa. |

```html
<zc-ubigeo-select [(value)]="district" [required]="true" (located)="located.set($event)" />
```

## `@zonacards/ui/unsaved`

### `zc-confirm-host` · ConfirmHostComponent

<zc-confirm-host /> · dibuja la confirmación pendiente de ConfirmService. Un solo host, en el shell.

## `@zonacards/ui/wallet`

### `zc-giftcard-pass` · GiftcardPassComponent

<zc-giftcard-pass os="google" side="front" [pass]="giftcard" country="pe" /> · vista previa de una giftcard en Google Wallet (tipo Gift card) y Apple Wallet (storeCard), frente y reverso.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[pass]` | `ZcGiftcardPass` | **obligatorio** |  |
| `[os]` | `'apple' \| 'google'` | `'google'` |  |
| `[side]` | `'front' \| 'back'` | `'front'` |  |
| `[country]` | `CountryCode` | `'pe'` |  |

### `zc-wallet-pass` · WalletPassComponent

<zc-wallet-pass os="apple" side="front" [pass]="pase" country="pe" /> · vista previa del pase (o-wallet de index.html). Apple Wallet y Google Wallet, frente y reverso. Es aproximada: Apple y Google generan el diseño final con los campos y colores. Los colores vienen del diseñador (datos de la marca), no de los tokens; el QR siempre negro sobre blanco.

| Nombre | Tipo | Defecto | Descripción |
| --- | --- | --- | --- |
| `[pass]` | `ZcWalletPass` | **obligatorio** |  |
| `[os]` | `'apple' \| 'google'` | `'apple'` |  |
| `[side]` | `'front' \| 'back'` | `'front'` |  |
| `[country]` | `CountryCode` | `'pe'` |  |

```html
<zc-wallet-pass [pass]="pass()" [os]="$any(os())" [side]="side()" />
```

