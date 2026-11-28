import {
  afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, effect, ElementRef, inject, input, output, signal, untracked, viewChild,
} from '@angular/core';
import { AlertComponent } from '@zonacards/ui/alert';
import { ButtonDirective } from '@zonacards/ui/button';
import { injectTranslate } from '@zonacards/ui/core';
import { SkeletonComponent } from '@zonacards/ui/skeleton';
import type * as Leaflet from 'leaflet';

/** Un lugar en el mapa. `count` > 1 lo dibuja como burbuja con el número (locales agrupados por distrito). */
export interface ZcGeoPoint {
  name: string;
  lat: number;
  lng: number;
  count?: number;
  detail?: string;
}

/** Teselas de OpenStreetMap (https://operations.osmfoundation.org/policies/tiles/): atribución obligatoria y sin descarga masiva. */
export const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
/** Zoom al mostrar un solo lugar y tope al encuadrar varios. */
const ZOOM_POINT = 16;
const ZOOM_MAX_FIT = 13;
const ZOOM_MIN = 3;
/** Fallos de teselas antes de avisar (un par aislado es normal al desplazarse). */
const FAILS_WARN = 4;

/**
 * <zc-geo-map [label] [points] [editable] (picked)> · mapa de calles con Leaflet y teselas (OpenStreetMap por defecto).
 * - Lugares sueltos o agrupados con su cantidad (burbuja) y globo con el detalle.
 * - editable: un pin que se arrastra o se coloca con un clic y emite las coordenadas (6 decimales).
 * - Leaflet se carga con import() al dibujarse: no entra en el bundle inicial. Requiere `leaflet` instalado y
 *   `@import "@zonacards/ui/styles/geo-map.css"` en los estilos.
 * - Teclado: flechas, + y − mueven el mapa; el pin editable se mueve con las flechas al tener el foco. Ofrece siempre campos
 *   de latitud y longitud como alternativa escrita.
 * - Si fallan las teselas o la librería, aviso con Reintentar. En tema oscuro las teselas se invierten y atenúan.
 * Para mapas de países con datos (coroplético) usa <zc-map> de @zonacards/ui/charts, sin teselas externas.
 */
@Component({
  selector: 'zc-geo-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AlertComponent, ButtonDirective, SkeletonComponent],
  host: { class: 'grid min-w-0 gap-3' },
  template: `
    <div class="relative min-w-0">
      <div #canvas class="zc-mapa h-80 w-full min-w-0 rounded-md border border-border max-sm:h-72" role="group" [attr.aria-label]="label()"></div>
      @if (loading()) {
        <div class="absolute inset-0 rounded-md" aria-busy="true"><zc-skeleton variant="block" class="h-full" /></div>
      }
    </div>
    @if (tilesFailed() || libFailed()) {
      <zc-alert tone="warning" [title]="t('mol.geoMapa.error.titulo')">
        {{ t('mol.geoMapa.error.texto') }}
        <button zcButton type="button" variant="outline" size="sm" class="mt-2" (click)="retry()">{{ t('mol.geoMapa.error.reintentar') }}</button>
      </zc-alert>
    }
    @if (editable()) {
      <p class="m-0 text-body-sm text-muted">{{ t('mol.geoMapa.ayudaEditable') }}</p>
    }
  `,
})
export class GeoMapComponent {
  readonly t = injectTranslate();
  /** Nombre accesible del mapa: "Mapa de locales en Perú". */
  readonly label = input.required<string>();
  readonly points = input<readonly ZcGeoPoint[]>([]);
  /** Lo que se cuenta en las burbujas: "locales". */
  readonly unit = input('');
  /** Un solo pin (el primer punto) que se mueve; avisa por (picked). */
  readonly editable = input(false);
  /** Centro cuando todavía no hay puntos (por defecto, Lima). */
  readonly center = input<[number, number]>([-12.0464, -77.0428]);
  /** Servidor de teselas y su atribución (obligatoria). Para tráfico alto usa un proveedor propio o de pago. */
  readonly tiles = input(OSM_TILES);
  readonly attribution = input(OSM_ATTRIBUTION);
  readonly picked = output<{ lat: number; lng: number }>();

  private readonly canvas = viewChild.required<ElementRef<HTMLElement>>('canvas');
  private readonly destroy = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly tilesFailed = signal(false);
  protected readonly libFailed = signal(false);

  private L: typeof Leaflet | null = null;
  private map: Leaflet.Map | null = null;
  private layer: Leaflet.LayerGroup | null = null;
  private fails = 0;
  private dragging = false;

  constructor() {
    afterNextRender(() => void this.init());
    effect(() => {
      const points = this.points();
      const editable = this.editable();
      if (this.L && this.map) untracked(() => this.draw(points, editable));
    });
    this.destroy.onDestroy(() => { this.map?.remove(); this.map = null; });
  }

  protected retry(): void {
    this.fails = 0;
    this.tilesFailed.set(false);
    if (this.map) {
      this.map.eachLayer(l => { if ('redraw' in l) (l as Leaflet.TileLayer).redraw(); });
      return;
    }
    this.libFailed.set(false);
    this.loading.set(true);
    void this.init();
  }

  private async init(): Promise<void> {
    try {
      const mod = await import('leaflet');
      const L = ((mod as unknown as { default?: typeof Leaflet }).default ?? mod) as typeof Leaflet;
      this.L = L;
      const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const map = L.map(this.canvas().nativeElement, {
        center: this.center(), zoom: 11, minZoom: ZOOM_MIN, zoomControl: true, attributionControl: true,
        zoomAnimation: !reduce, fadeAnimation: !reduce, markerZoomAnimation: !reduce, keyboard: true,
      });
      map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
      L.tileLayer(this.tiles(), { attribution: this.attribution(), maxZoom: 19, crossOrigin: true })
        .on('tileerror', () => { if (++this.fails >= FAILS_WARN) this.tilesFailed.set(true); })
        .on('tileload', () => { this.fails = 0; this.tilesFailed.set(false); })
        .addTo(map);
      this.map = map;
      this.layer = L.layerGroup().addTo(map);
      // Se redibuja si cambia el tamaño del contenedor (drawer abierto, giro del móvil, panel que se despliega).
      const ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(this.canvas().nativeElement);
      this.destroy.onDestroy(() => ro.disconnect());
      map.on('click', e => { if (this.editable()) this.move(e.latlng.lat, e.latlng.lng); });
      this.draw(this.points(), this.editable());
      this.loading.set(false);
    } catch {
      this.libFailed.set(true);
      this.loading.set(false);
    }
  }

  private move(lat: number, lng: number): void {
    const round = (n: number) => Math.round(n * 1e6) / 1e6;
    this.picked.emit({ lat: round(lat), lng: round(lng) });
  }

  private draw(points: readonly ZcGeoPoint[], editable: boolean): void {
    const L = this.L!;
    const map = this.map!;
    this.layer!.clearLayers();
    if (!points.length) return;

    if (editable) {
      const p = points[0];
      const pin = L.marker([p.lat, p.lng], { icon: this.icon(p), draggable: true, keyboard: true, title: p.name, alt: p.name });
      pin.on('dragstart', () => { this.dragging = true; });
      pin.on('dragend', () => { this.dragging = false; const c = pin.getLatLng(); this.move(c.lat, c.lng); });
      pin.addTo(this.layer!);
      if (!this.dragging && !map.getBounds().contains([p.lat, p.lng])) map.setView([p.lat, p.lng], Math.max(map.getZoom(), ZOOM_POINT - 2));
      else if (!this.dragging && map.getZoom() < ZOOM_POINT - 4) map.setView([p.lat, p.lng], ZOOM_POINT);
      return;
    }

    for (const p of points) {
      L.marker([p.lat, p.lng], { icon: this.icon(p), keyboard: true, title: this.title(p), alt: this.title(p) })
        .bindPopup(this.popup(p))
        .addTo(this.layer!);
    }
    if (points.length === 1) map.setView([points[0].lat, points[0].lng], ZOOM_POINT);
    else map.fitBounds(L.latLngBounds(points.map(p => [p.lat, p.lng] as [number, number])), { padding: [32, 32], maxZoom: ZOOM_MAX_FIT });
  }

  private title(p: ZcGeoPoint): string {
    const n = p.count ?? 1;
    return n > 1 ? `${p.name}: ${n}${this.unit() ? ` ${this.unit()}` : ''}` : p.name;
  }

  /** Contenido del globo armado con nodos (no con HTML) para no inyectar texto de los datos. */
  private popup(p: ZcGeoPoint): HTMLElement {
    const box = document.createElement('div');
    box.className = 'zc-mapa-popup';
    const title = document.createElement('strong');
    title.textContent = p.name;
    box.append(title);
    const text = (p.count ?? 1) > 1 ? this.title(p).slice(p.name.length + 2) : p.detail;
    if (text) {
      const line = document.createElement('span');
      line.textContent = text;
      box.append(line);
    }
    return box;
  }

  /** Burbuja con la cantidad (varios) o pin (uno). Estilos en styles/geo-map.css con los tokens del sistema. */
  private icon(p: ZcGeoPoint): Leaflet.DivIcon {
    const L = this.L!;
    const n = p.count ?? 1;
    if (n > 1) {
      const side = 2 + Math.min(n, 60) / 60 * 1.5;
      return L.divIcon({ className: 'zc-mapa-marca', html: `<span class="zc-mapa-burbuja" style="--lado:${side}rem">${n}</span>`, iconSize: [0, 0] });
    }
    return L.divIcon({
      className: 'zc-mapa-marca',
      html: '<svg class="zc-mapa-pin" viewBox="0 0 24 32" aria-hidden="true" focusable="false"><path d="M12 1C6.5 1 2 5.4 2 10.8 2 18 12 31 12 31s10-13 10-20.2C22 5.4 17.5 1 12 1z"/><circle cx="12" cy="11" r="4"/></svg>',
      iconSize: [0, 0],
    });
  }
}
