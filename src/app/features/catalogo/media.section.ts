import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { formatDate } from '@zonacards/ui/core';
import { formatMoney } from '@zonacards/ui/core';
import { ArtComponent } from '@zonacards/ui/art';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { ColorFieldComponent } from '@zonacards/ui/color';
import { FieldComponent, InputDirective } from '@zonacards/ui/field';
import { ZcOption } from '@zonacards/ui/listbox';
import { SegmentedComponent, ZcSegment } from '@zonacards/ui/segmented';
import { SelectComponent } from '@zonacards/ui/select';
import { CAROUSEL } from '@zonacards/ui/carousel';
import { ChartComponent } from '@zonacards/ui/charts';
import { ChartData, ChartKind } from '@zonacards/ui/charts';
import { DataTableComponent, ZcColumn } from '@zonacards/ui/table';
import { MapComponent, ZcMapPoint } from '@zonacards/ui/charts';
import { OverlayComponent } from '@zonacards/ui/overlay';
import { PermissionPromptComponent, PushPreviewComponent } from '@zonacards/ui/mobile';
import { WalletPassComponent, ZcWalletPass } from '@zonacards/ui/wallet';
import { DsSectionComponent } from './ds/ds-layout';
import { ScanResult, ValidationAppComponent } from './validation-app';

interface OpsChart { kind: ChartKind; title: string; subtitle: string; category: string; data: ChartData; money?: boolean; total?: string }
interface Rule { id: string; k: string; v: string }

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7 + 'h');
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const heat = DAYS.map((name, di) => ({ name, values: HOURS.map((_, hi) => {
  const h = hi + 7; return Math.round((h >= 12 && h <= 15 ? 60 : h >= 19 && h <= 21 ? 40 : 15) * (di >= 4 && di <= 5 ? 1.8 : di === 6 ? 1.2 : 1) * (0.8 + ((di * 7 + hi * 3) % 5) / 10));
}) }));
const cal = (() => {
  const cats: string[] = []; const vals: number[] = [];
  for (let d = new Date(Date.UTC(2026, 0, 1)); d.getUTCFullYear() === 2026; d.setUTCDate(d.getUTCDate() + 1)) {
    const m = d.getUTCMonth(); const base = m === 11 ? 180 : m === 5 || m === 6 ? 90 : 30;
    cats.push(d.toISOString().slice(0, 10)); vals.push(Math.round(base * (0.5 + ((d.getUTCDate() * 13) % 10) / 10)));
  }
  return { categories: cats, series: [{ name: 'Códigos', values: vals }] };
})();

/** Catálogo · Tanda 7: gráficos de operación, medios, pase Wallet, escáner, patrones móviles y permisos. */
@Component({
  selector: 'zc-catalogo-media',
  imports: [ArtComponent, ButtonDirective, IconComponent, ColorFieldComponent, FieldComponent, InputDirective, SegmentedComponent, SelectComponent, CAROUSEL, ChartComponent,
    DataTableComponent, MapComponent, OverlayComponent, PermissionPromptComponent, PushPreviewComponent, WalletPassComponent, DsSectionComponent, ValidationAppComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-12' },
  template: `
    @if (show('o-charts2')) {
      <zc-ds-section dsId="o-charts2" title="Gráficos de operación"
        description="Embudo de conversión, cascada de liquidación, mapa de calor de canjes, mapa de árbol por categoría, calendario de vencimientos, flujo (Sankey) y cumplimiento de meta. Misma estructura que los demás: título con la conclusión, descargar y vista Gráfico/Datos.">
        <div class="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
          @for (c of ops; track c.title) {
            @defer (on viewport) {
              <zc-chart [kind]="c.kind" [title]="c.title" [subtitle]="c.subtitle" [data]="c.data" [categoryLabel]="c.category" [format]="c.money ? soles : null" />
            } @placeholder { <div class="h-[340px] rounded-md border border-border bg-surface"></div> }
          }
        </div>
      </zc-ds-section>
    }

    @if (show('o-media')) {
      <zc-ds-section dsId="o-media" title="Map, Gallery y Carousel"
        description="El mapa usa los límites de los países incrustados (Natural Earth), así funciona aunque las teselas externas estén bloqueadas.">
        @defer (on viewport) {
          <zc-map label="Mapa de locales por ciudad" [points]="cities" [scope]="scope" unit="locales" />
        } @placeholder { <div class="h-[280px] rounded-md border border-border bg-(--map-water) md:h-[380px] xl:h-[440px]"></div> }
        <h4 class="text-caption font-semibold uppercase tracking-wide text-muted">Gallery</h4>
        <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
          @for (g of gallery; track g) {
            <button type="button" class="grid cursor-pointer gap-2 text-left" [attr.aria-label]="'Ampliar imagen de ' + g" (click)="zoom.set(g)">
              <span class="aspect-[4/3] overflow-hidden rounded-md"><zc-art [category]="g" /></span><span class="text-body-sm">{{ g }}</span>
            </button>
          }
        </div>
        <zc-modal [title]="zoom() ?? ''" subtitle="Imagen de categoría · 1200 × 900" size="lg" [open]="!!zoom()" (openChange)="!$event && zoom.set(null)">
          <div class="aspect-[4/3] overflow-hidden rounded-2xl"><zc-art [category]="zoom() ?? 'Gastronomía'" /></div>
          <p class="flex items-start gap-2 text-caption text-muted"><zc-icon name="s:info-circle" [size]="16" class="mt-px shrink-0" />En la app: foto de Pexels o Unsplash, WebP de máximo 200 KB, con crédito en CREDITS.md.</p>
        </zc-modal>
        <h4 class="text-caption font-semibold uppercase tracking-wide text-muted">Carousel</h4>
        <zc-carousel label="Plantillas" [items]="templates" [itemLabel]="tplName">
          <ng-template zcSlide let-p>
            <div class="aspect-video"><zc-art [category]="p[1]" /></div>
            <div class="grid gap-0.5 px-4 py-3"><strong>{{ p[0] }}</strong><span class="text-caption text-muted">Correo + PDF + pase Wallet</span></div>
          </ng-template>
        </zc-carousel>
      </zc-ds-section>
    }

    @if (show('o-wallet')) {
      <zc-ds-section dsId="o-wallet" title="Diseñador y vista previa de pase Wallet"
        description="Vista previa del pase en Apple Wallet y Google Wallet con frente y reverso, editable en vivo: colores con control de contraste, logo, nombre del programa, saldo o puntos, nivel y código QR.">
        <div class="grid grid-cols-[minmax(0,1fr)] items-start gap-6 min-[900px]:grid-cols-[minmax(0,1fr)_360px]">
          <div class="grid grid-cols-[minmax(0,1fr)] gap-y-2">
            <zc-field label="Nombre del programa" hint="Máximo 24 caracteres." [counter]="pass().program.length + '/24'">
              <input zcInput maxlength="24" [value]="pass().program" (input)="patch({ program: $any($event.target).value })" />
            </zc-field>
            <div class="grid grid-cols-[minmax(0,1fr)] gap-x-4 sm:grid-cols-2">
              <zc-field label="Fondo"><zc-color-field [value]="pass().bg" [against]="pass().fg" (valueChange)="patch({ bg: $event })" /></zc-field>
              <zc-field label="Texto"><zc-color-field [value]="pass().fg" [against]="pass().bg" (valueChange)="patch({ fg: $event })" /></zc-field>
            </div>
            <zc-field label="Etiquetas" info="Apple usa un color aparte para las etiquetas de los campos; Google lo toma del texto.">
              <zc-color-field [value]="pass().label" [against]="pass().bg" (valueChange)="patch({ label: $event })" />
            </zc-field>
            <div class="grid grid-cols-[minmax(0,1fr)] gap-x-4 sm:grid-cols-2">
              <zc-field label="Puntos de ejemplo"><input zcInput inputmode="numeric" [value]="pass().points" (input)="setPoints($any($event.target))" /></zc-field>
              <zc-field label="Nivel"><zc-select [options]="tiers" [value]="pass().tier" (valueChange)="patch({ tier: $any($event) })" /></zc-field>
            </div>
          </div>
          <div class="grid grid-cols-[minmax(0,1fr)] justify-items-center gap-3 rounded-lg bg-surface-2 px-3 py-5">
            <div class="flex flex-wrap items-center justify-center gap-2">
              <zc-segmented size="sm" label="Plataforma" [options]="platforms" [(value)]="os" />
              <button zcButton variant="ghost" size="sm" [attr.aria-pressed]="side() === 'back'" (click)="side.set(side() === 'back' ? 'front' : 'back')"><zc-icon name="s:refresh" [size]="16" />{{ side() === 'back' ? 'Ver frente' : 'Ver reverso' }}</button>
            </div>
            <div class="w-full max-w-[320px]" aria-live="polite"><zc-wallet-pass [pass]="pass()" [os]="$any(os())" [side]="side()" /></div>
            <p class="text-center text-caption text-muted">Vista aproximada. Apple y Google generan el diseño final a partir de los campos y colores.</p>
          </div>
        </div>
      </zc-ds-section>
    }

    @if (show('o-scanner')) {
      <zc-ds-section dsId="o-scanner" title="Escáner QR y de código de barras para canjes"
        description="Para la app de validación de comercios. Visor con guía de encuadre, linterna, cambio de cámara e ingreso manual. Usa la cámara real cuando el navegador lo permite (BarcodeDetector) y un modo de simulación para probar todos los resultados: válido, ya canjeado, vencido, de otro comercio, inválido y sin conexión.">
        <div class="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <zc-validation-app #scanner start="scan" />
          <div class="grid min-w-0 content-start gap-3">
            <h4 class="text-caption font-semibold uppercase tracking-wide text-muted">Probar resultados</h4>
            <div class="flex flex-wrap gap-2">
              @for (r of sims; track r[0]) { <button zcButton variant="outline" size="sm" (click)="scanner.result(r[0])">{{ r[1] }}</button> }
            </div>
            <button zcButton variant="secondary" class="justify-self-start" (click)="scanner.realCamera()"><zc-icon name="s:qr-code" [size]="16" />Usar la cámara real</button>
            <zc-data-table caption="Reglas del escáner" [data]="scanRules" [columns]="ruleCols" [toolbar]="false" density="compact" />
          </div>
        </div>
      </zc-ds-section>
    }

    @if (show('o-mobile')) {
      <zc-ds-section dsId="o-mobile" title="Patrones de app móvil y responsive"
        description="Barra superior con volver, navegación inferior, deslizar para actualizar, acciones al deslizar un elemento, botón principal fijo al pie, teclado numérico para PIN y avisos del sistema (sin conexión, actualización disponible). Respetan las áreas seguras del teléfono.">
        <div class="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <zc-validation-app start="home" />
          <div class="grid min-w-0 content-start gap-3">
            <h4 class="text-caption font-semibold uppercase tracking-wide text-muted">Componentes móviles</h4>
            <zc-data-table caption="Componentes móviles" [data]="mobileRules" [columns]="mobileCols" [toolbar]="false" density="compact" />
            <p class="flex items-start gap-2 text-caption text-muted"><zc-icon name="s:info-circle" [size]="16" class="mt-px shrink-0" />Prueba el teléfono: Inicio para avisos del sistema, Historial para deslizar y actualizar, Ajustes para el teclado PIN.</p>
          </div>
        </div>
      </zc-ds-section>
    }

    @if (show('o-perm')) {
      <zc-ds-section dsId="o-perm" title="Permisos y notificaciones push"
        description="Pantalla previa que explica por qué se pide un permiso antes de que aparezca el diálogo del sistema, estado de permiso denegado con camino a Ajustes y vista previa de notificación push.">
        <div class="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-4">
          <figure class="m-0 grid gap-2">
            <div [class]="'grid h-[440px] content-center rounded-[32px] border-8 border-(--device-frame) bg-surface p-5 transition-shadow ' + (highlight() ? 'shadow-[0_0_0_4px_var(--brand-accent)]' : '')">
              <zc-permission-prompt icon="s:qr-code" title="Usa la cámara para validar vales" text="La necesitamos solo para leer el código QR. No guardamos fotos ni video.">
                <button zcButton [block]="true" (click)="askCamera()">Permitir cámara</button>
                <button zcButton variant="ghost" [block]="true" (click)="later()">Ahora no</button>
              </zc-permission-prompt>
            </div>
            <figcaption class="text-center text-caption text-muted">1. Antes de pedir el permiso</figcaption>
          </figure>
          <figure class="m-0 grid gap-2">
            <div class="grid h-[440px] content-center rounded-[32px] border-8 border-(--device-frame) bg-surface p-5" aria-live="polite">
              @if (granted()) {
                <zc-permission-prompt icon="s:check-circle" title="Cámara activada" text="Ya puedes escanear vales. Puedes quitar el permiso cuando quieras en Ajustes." />
              } @else {
                <zc-permission-prompt icon="l:shield-alert" tone="warning" title="La cámara está desactivada" text="Para escanear, actívala en Ajustes › Zonacards › Cámara. Mientras tanto puedes ingresar el código a mano.">
                  <button zcButton [block]="true">Abrir Ajustes</button><button zcButton variant="outline" [block]="true">Ingresar código</button>
                </zc-permission-prompt>
              }
            </div>
            <figcaption class="text-center text-caption text-muted">2. Si el permiso se negó</figcaption>
          </figure>
          <figure class="m-0 grid gap-2">
            <div class="grid h-[440px] content-start gap-3 rounded-[32px] border-8 border-(--device-frame) bg-[linear-gradient(160deg,var(--lock-from),var(--brand-secondary)_60%,var(--lock-to))] p-5 pt-10 text-(--lock-fg)">
              <span class="text-center text-[56px] leading-none font-light num" aria-hidden="true">9:41</span>
              <span class="mb-3 text-center text-body-sm opacity-85" aria-hidden="true">{{ today }}</span>
              <zc-push-preview app="Zonacards" time="ahora" title="Anulación aprobada" text="Luis Mendoza aprobó anular el canje #CJ-40921 (S/ 30.00)." />
              <zc-push-preview app="Zonacards" time="hace 2 h" title="Stock bajo: Falabella S/ 50" text="Quedan 38 códigos. Toca para cargar un lote." />
            </div>
            <figcaption class="text-center text-caption text-muted">3. Notificaciones push</figcaption>
          </figure>
        </div>
        <zc-data-table caption="Cuándo y cómo pedir permisos" [data]="permRules" [columns]="ruleCols" [toolbar]="false" density="compact" />
      </zc-ds-section>
    }`,
})
export class MediaSection {
  readonly parts = input<string[]>([]);
  readonly show = (id: string) => this.parts().includes(id);
  readonly soles = (v: number) => formatMoney(v, 'pe');

  readonly ops: OpsChart[] = [
    { kind: 'funnel', title: 'El 27 % de lo emitido no llega a canjearse', subtitle: 'Embudo de gift cards · octubre', category: 'Etapa',
      data: { categories: ['Emitidas', 'Enviadas', 'Activadas', 'Con consumo'], series: [{ name: 'Gift cards', values: [12480, 11630, 10120, 9130] }] } },
    { kind: 'waterfall', title: 'De S/ 96,400 brutos se pagan S/ 84,720 a marcas', subtitle: 'Cascada de liquidación · octubre', category: 'Concepto', money: true,
      data: { categories: ['Consumos', 'Comisión Promotick', 'IGV comisión', 'Ajustes', 'Neto a pagar'], series: [{ name: 'Monto', values: [96400, -9640, -1735, -305, 84720] }] } },
    { kind: 'heatmap', title: 'Los canjes se concentran viernes y sábado entre 12 y 15 h', subtitle: 'Canjes por día y hora · últimos 30 días', category: 'Hora',
      data: { categories: HOURS, series: heat } },
    { kind: 'treemap', title: 'Gastronomía y experiencias suman el 60 % del valor', subtitle: 'Valor emitido por categoría · miles', category: 'Categoría',
      data: { categories: ['Gastronomía', 'Experiencias', 'Tecnología', 'Moda', 'Viajes', 'Hogar'], series: [{ name: 'Valor (miles)', values: [412, 298, 190, 160, 92, 48] }] } },
    { kind: 'calendar', title: 'Diciembre concentra los vencimientos del año', subtitle: 'Códigos que vencen por día · 2026', category: 'Fecha', data: cal },
    { kind: 'sankey', title: 'WhatsApp convierte más que correo en activaciones', subtitle: 'Flujo de 10,000 códigos por canal y estado', category: 'Flujo',
      data: { categories: ['Emitidos → Correo', 'Emitidos → WhatsApp', 'Emitidos → ZIP', 'Correo → Activado', 'Correo → Sin activar', 'WhatsApp → Activado', 'WhatsApp → Sin activar', 'ZIP → Activado', 'ZIP → Sin activar'],
        series: [{ name: 'Códigos', values: [5500, 4000, 500, 3800, 1700, 3400, 600, 300, 200] }] } },
    { kind: 'gauge', title: 'La emisión del mes va al 78 % de la meta', subtitle: 'Meta mensual · S/ 1.6 M', category: 'Concepto', money: true,
      data: { categories: ['Emitido', 'Meta'], series: [{ name: 'Monto', values: [1248000, 1600000] }] } },
  ];

  readonly cities: ZcMapPoint[] = ([
    ['Lima', -12.0464, -77.0428, 128], ['Arequipa', -16.409, -71.5375, 34], ['Trujillo', -8.1116, -79.0287, 21], ['Quito', -0.1807, -78.4678, 61], ['Guayaquil', -2.1709, -79.9224, 47],
    ['La Paz', -16.4897, -68.1193, 22], ['Santa Cruz', -17.7833, -63.1821, 18], ['Bogotá', 4.711, -74.0721, 74], ['Medellín', 6.2442, -75.5812, 39], ['Cali', 3.4516, -76.532, 17],
    ['Santiago', -33.4489, -70.6693, 66], ['Concepción', -36.827, -73.0503, 12], ['Ciudad de México', 19.4326, -99.1332, 92], ['Monterrey', 25.6866, -100.3161, 31], ['Guadalajara', 20.6597, -103.3496, 24],
  ] as [string, number, number, number][]).map(([name, lat, lng, value]) => ({ name, lat, lng, value }));
  readonly scope = ['pe', 'ec', 'bo', 'co', 'cl', 'mx'];
  readonly gallery = ['Gastronomía', 'Experiencias', 'Tecnología', 'Moda', 'Viajes', 'Entretenimiento', 'Hogar', 'Salud y belleza'];
  readonly zoom = signal<string | null>(null);
  readonly templates: [string, string][] = [['Navidad', 'Gastronomía'], ['Bienvenida', 'Experiencias'], ['Aniversario', 'Entretenimiento'], ['Día de la Madre', 'Salud y belleza'], ['Incentivo ventas', 'Tecnología'], ['Fiestas Patrias', 'Viajes']];
  readonly tplName = (p: [string, string]) => p[0];

  readonly pass = signal<ZcWalletPass>({ program: 'Club Giftealo', member: 'Ana Torres', points: 12480, tier: 'Oro', bg: '#172948', fg: '#FFFFFF', label: '#F8AE23', code: '4821 7730 9014' });
  readonly os = signal<string | null>('apple');
  readonly side = signal<'front' | 'back'>('front');
  readonly platforms: ZcSegment<string>[] = [{ value: 'apple', label: 'Apple Wallet' }, { value: 'google', label: 'Google Wallet' }];
  readonly tiers: ZcOption<string>[] = ['Bronce', 'Plata', 'Oro', 'Platino'].map(x => ({ value: x, label: x }));
  patch(p: Partial<ZcWalletPass>) { this.pass.update(x => ({ ...x, ...p })); }
  setPoints(el: HTMLInputElement) { const d = el.value.replace(/\D/g, ''); if (d !== el.value) el.value = d; this.patch({ points: +d || 0 }); }

  readonly sims: [ScanResult, string][] = [['valid', 'Válido'], ['used', 'Ya canjeado'], ['expired', 'Vencido'], ['other', 'Otro comercio'], ['invalid', 'Inválido'], ['offline', 'Sin conexión']];
  readonly ruleCols: ZcColumn<Rule>[] = [{ id: 'k', header: 'Regla', value: r => r.k }, { id: 'v', header: 'Comportamiento', value: r => r.v }];
  private rules = (rows: [string, string][]): Rule[] => rows.map(([k, v], i) => ({ id: String(i), k, v }));
  readonly scanRules = this.rules([
    ['Feedback', 'Resultado en pantalla completa con color, ícono y texto; vibración corta si es válido y doble si falla'],
    ['Encuadre', 'Guía central de 240 px, contraste alto sobre la cámara; la línea de escaneo se detiene con movimiento reducido'],
    ['Alternativa', '"Ingresar código" siempre visible: 16 dígitos en grupos de 4'],
    ['Canje parcial', 'El monto es editable hasta el saldo; el resto queda disponible'],
    ['Anulación', 'Requiere PIN de supervisor o biometría'],
    ['Sin conexión', 'No se valida sin internet (evita canjes duplicados); aviso persistente'],
    ['Implementación', 'BarcodeDetector donde exista; ZXing (@zxing/browser) en web y ML Kit o AVFoundation en apps nativas'],
  ]);
  readonly mobileCols: ZcColumn<Rule>[] = [{ id: 'k', header: 'Componente', value: r => r.k }, { id: 'v', header: 'Regla', value: r => r.v }];
  readonly mobileRules = this.rules([
    ['Barra superior', 'Título de la pantalla, volver a la izquierda y una acción a la derecha como máximo'],
    ['Navegación inferior', '3 a 5 destinos con ícono y texto; el activo en Bold y color de marca; siempre visible salvo en flujos enfocados'],
    ['Deslizar para actualizar', 'Solo en listas que cambian; también hay botón Actualizar para teclado y lectores'],
    ['Acciones al deslizar', 'Máximo 2; la destructiva a la derecha en rojo; mismo contenido en el menú ⋮'],
    ['Botón principal fijo', 'Al pie, a todo el ancho, sobre el área segura'],
    ['Teclado PIN', 'Teclas de 64 px, borrar y biometría; vibración breve al tocar'],
    ['Avisos del sistema', 'Banda bajo la barra superior: sin conexión, actualización, mantenimiento'],
    ['Bottom sheet', 'Uno solo a la vez; selectores dentro como subpantalla'],
  ]);
  readonly permRules = this.rules([
    ['Cuándo pedir', 'Justo antes de usar la función (al tocar Escanear), nunca al abrir la app por primera vez.'],
    ['Pantalla previa', 'Explica el beneficio y qué no se hace con el permiso; "Ahora no" siempre disponible.'],
    ['Notificaciones', 'Título de una línea con el hecho, cuerpo con el detalle y la acción; agrupadas por tipo; sin datos sensibles en la pantalla bloqueada.'],
  ]);

  readonly today = formatDate(new Date(), 'full');
  readonly granted = signal(false);
  readonly highlight = signal(false);
  /** Pide el permiso real del navegador; si se niega, se resalta la segunda pantalla. */
  async askCamera() {
    try {
      const s = await navigator.mediaDevices?.getUserMedia({ video: true });
      s?.getTracks().forEach(tr => tr.stop());
      this.granted.set(!!s);
    } catch { this.granted.set(false); }
  }
  later() { this.highlight.set(true); setTimeout(() => this.highlight.set(false), 1200); }
}
