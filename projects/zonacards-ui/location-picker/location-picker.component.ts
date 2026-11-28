import { ChangeDetectionStrategy, Component, computed, effect, input, model, signal, untracked } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { AlertComponent } from '@zonacards/ui/alert';
import { ButtonDirective } from '@zonacards/ui/button';
import { FieldComponent, InputDirective } from '@zonacards/ui/field';
import { GeoMapComponent, ZcGeoPoint } from '@zonacards/ui/geo-map';
import { IconComponent } from '@zonacards/ui/icon';
import { formatLatLng, isValidLatLng, parseCoord, roundCoord, ZcLatLng } from './geo';

/**
 * <zc-location-picker [(value)]="punto" label="Ubica el punto de entrega" [center]="..." /> · punto exacto en el mapa (dirección de
 * entrega, local). Un pin que se arrastra o se coloca con un clic en el mapa, las coordenadas escritas como alternativa (latitud y
 * longitud validadas) y "Usar mi ubicación". `center` centra el mapa mientras no hay punto (por ejemplo, el distrito elegido en
 * <zc-ubigeo-select>). Requiere `leaflet` y `@import "@zonacards/ui/styles/geo-map.css"` (ver zc-geo-map).
 */
@Component({
  selector: 'zc-location-picker',
  imports: [AlertComponent, ButtonDirective, FieldComponent, GeoMapComponent, IconComponent, InputDirective, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3' },
  template: `
    <p class="m-0 flex items-center gap-2 text-body font-semibold"><zc-icon name="s:map-point" [size]="20" />{{ label() }}</p>
    <zc-geo-map [label]="label()" [points]="points()" [editable]="true" [center]="center()" (picked)="set($event)" />
    <p class="m-0 text-body-sm text-muted num" aria-live="polite">
      @if (value(); as v) { {{ 'mol.ubicacion.coordenadas' | transloco: { coords: coords(v) } }} } @else { {{ 'mol.ubicacion.sinPunto' | transloco }} }
    </p>
    <div class="grid grid-cols-[repeat(2,minmax(0,1fr))] items-start gap-x-4">
      <zc-field [label]="'mol.ubicacion.latitud' | transloco" [error]="latError() ? (latError()! | transloco) : null">
        <input zcInput inputmode="decimal" autocomplete="off" class="num" [value]="latText()" (input)="typeLat($any($event.target).value)" />
      </zc-field>
      <zc-field [label]="'mol.ubicacion.longitud' | transloco" [error]="lngError() ? (lngError()! | transloco) : null">
        <input zcInput inputmode="decimal" autocomplete="off" class="num" [value]="lngText()" (input)="typeLng($any($event.target).value)" />
      </zc-field>
    </div>
    <div>
      <button zcButton type="button" variant="outline" size="sm" [disabled]="locating()" [loading]="locating()" (click)="useMine()">
        <zc-icon name="s:map-point" [size]="16" />{{ 'mol.ubicacion.usarMia' | transloco }}
      </button>
    </div>
    @if (geoError(); as g) {
      <zc-alert tone="warning" [title]="'mol.ubicacion.errorTitulo' | transloco">{{ ('mol.ubicacion.error.' + g) | transloco }}</zc-alert>
    }`,
})
export class LocationPickerComponent {
  /** Punto elegido (latitud y longitud) o null. */
  readonly value = model<ZcLatLng | null>(null);
  /** Nombre accesible del mapa y título del bloque. */
  readonly label = input.required<string>();
  /** Centro del mapa mientras no hay punto: [latitud, longitud]. Por defecto, Lima. */
  readonly center = input<[number, number]>([-12.0464, -77.0428]);

  readonly points = computed<ZcGeoPoint[]>(() => { const v = this.value(); return v ? [{ name: this.label(), lat: v.lat, lng: v.lng }] : []; });
  readonly coords = formatLatLng;
  readonly latText = signal('');
  readonly lngText = signal('');
  readonly latError = signal<string | null>(null);
  readonly lngError = signal<string | null>(null);
  readonly locating = signal(false);
  readonly geoError = signal<'denegado' | 'noDisponible' | 'sinSenal' | null>(null);

  constructor() {
    // Las cajas siguen al valor que llega de afuera (mapa, formulario) sin pisar lo que se está escribiendo.
    effect(() => {
      const v = this.value();
      untracked(() => {
        if (!v) { if (!this.latError() && !this.lngError() && parseCoord(this.latText()) !== null && parseCoord(this.lngText()) !== null) { this.latText.set(''); this.lngText.set(''); } return; }
        if (parseCoord(this.latText()) !== v.lat) this.latText.set(String(v.lat));
        if (parseCoord(this.lngText()) !== v.lng) this.lngText.set(String(v.lng));
      });
    });
  }

  /** Lo que emite el mapa: se redondea, se valida y se refleja en las cajas. */
  set(p: ZcLatLng) {
    if (!isValidLatLng(p)) return;
    this.value.set({ lat: roundCoord(p.lat), lng: roundCoord(p.lng) });
    this.latError.set(null); this.lngError.set(null); this.geoError.set(null);
  }

  typeLat(text: string) { this.latText.set(text); this.fromText(); }
  typeLng(text: string) { this.lngText.set(text); this.fromText(); }

  private fromText() {
    const lat = parseCoord(this.latText());
    const lng = parseCoord(this.lngText());
    this.latError.set(this.latText().trim() && (lat === null || Math.abs(lat) > 90) ? 'mol.ubicacion.latRango' : null);
    this.lngError.set(this.lngText().trim() && (lng === null || Math.abs(lng) > 180) ? 'mol.ubicacion.lngRango' : null);
    if (lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) this.value.set({ lat: roundCoord(lat), lng: roundCoord(lng) });
  }

  useMine() {
    this.geoError.set(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) { this.geoError.set('noDisponible'); return; }
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      pos => { this.locating.set(false); this.set({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
      err => { this.locating.set(false); this.geoError.set(err.code === err.PERMISSION_DENIED ? 'denegado' : 'sinSenal'); },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }
}
