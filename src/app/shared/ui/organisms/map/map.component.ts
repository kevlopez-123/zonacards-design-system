import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, effect, inject, input, signal, viewChild } from '@angular/core';
import type { ECharts } from 'echarts/core';
import { injectTranslate } from '../../lang';

export interface ZcMapPoint { name: string; lat: number; lng: number; value: number }

interface GeoJson { features: { properties: { n: string; cc: string; name?: string } }[] }
let registered: Promise<void> | null = null;
let features: GeoJson['features'] = [];

/**
 * <zc-map label="Mapa de locales por ciudad" [points]="ciudades" [scope]="['Perú', 'Chile']" unit="locales" />
 * Mapa de puntos (o-media de index.html) sobre ECharts con los límites de países en public/geo/latam.json (Natural Earth,
 * dominio público): funciona sin teselas externas. Tamaño del punto = cantidad. Colores de tokens (--map-*, --chart-1, --brand-accent).
 * Para lectores de pantalla, la lista de ciudades con su cantidad va oculta debajo.
 */
@Component({
  selector: 'zc-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2' },
  template: `
    <div #el role="img" [attr.aria-label]="label()" class="relative h-[280px] overflow-hidden rounded-md border border-border bg-(--map-water) md:h-[380px] xl:h-[440px]">
      @if (failed()) { <p class="grid h-full place-items-center text-sm text-muted">{{ t('mol.mapa.error') }}</p> }
    </div>
    <ul class="sr-only">@for (p of points(); track p.name) { <li>{{ p.name }}: {{ p.value }} {{ unit() }}</li> }</ul>
    <div class="flex flex-wrap gap-4 text-[13px] text-muted" aria-hidden="true">
      <span class="inline-flex items-center gap-1.5"><i class="block size-3 rounded-full border-2 border-(--chart-1) bg-(--brand-accent)"></i>{{ t('mol.mapa.puntos', { unit: unit() }) }}</span>
      <span class="inline-flex items-center gap-1.5"><i class="block size-3 rounded-full bg-(--map-scope)"></i>{{ t('mol.mapa.alcance') }}</span>
    </div>`,
})
export class MapComponent {
  readonly t = injectTranslate();
  readonly label = input.required<string>();
  readonly points = input.required<readonly ZcMapPoint[]>();
  /** Códigos de país del alcance (se pintan con --map-scope). */
  readonly scope = input<readonly string[]>([]);
  readonly unit = input('');
  readonly failed = signal(false);
  private readonly el = viewChild.required<ElementRef<HTMLElement>>('el');
  private chart?: ECharts;
  private readonly tick = signal(0);

  constructor() {
    const mo = new MutationObserver(() => this.tick.update(n => n + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-brand'] });
    let ro: ResizeObserver | undefined;
    afterNextRender(() => { ro = new ResizeObserver(() => this.chart?.resize()); ro.observe(this.el().nativeElement); });
    effect(() => { const pts = this.points(); const scope = this.scope(); this.tick(); void this.draw(pts, scope); });
    inject(DestroyRef).onDestroy(() => { mo.disconnect(); ro?.disconnect(); this.chart?.dispose(); });
  }

  private async draw(pts: readonly ZcMapPoint[], scope: readonly string[]) {
    try {
      const { echarts } = await import('../chart/echarts-setup');
      registered ??= fetch('geo/latam.json').then(r => r.json()).then((g: GeoJson) => {
        // El archivo trae n (nombre) y cc (código del alcance); ECharts busca properties.name.
        g.features.forEach(f => (f.properties.name = f.properties.n));
        features = g.features;
        echarts.registerMap('latam', g as never);
      });
      await registered;
      const el = this.el().nativeElement;
      const cs = getComputedStyle(el); const v = (n: string) => cs.getPropertyValue(n).trim();
      if (!this.chart || this.chart.isDisposed()) this.chart = echarts.init(el, null, { renderer: 'canvas' });
      const reduced = !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const lng = pts.map(p => p.lng), lat = pts.map(p => p.lat);
      const pad = 4;
      this.chart.setOption({
        animationDuration: reduced ? 0 : 400,
        tooltip: { trigger: 'item', confine: true, backgroundColor: v('--surface'), borderColor: v('--border'), textStyle: { color: v('--text'), fontFamily: v('--zc-font-sans') } },
        geo: {
          map: 'latam', roam: true, scaleLimit: { min: 1, max: 8 },
          boundingCoords: [[Math.min(...lng) - pad, Math.max(...lat) + pad], [Math.max(...lng) + pad, Math.min(...lat) - pad]],
          itemStyle: { areaColor: v('--map-land'), borderColor: v('--map-line'), borderWidth: 1 },
          emphasis: { disabled: true }, select: { disabled: true }, label: { show: false },
          regions: features.filter(f => scope.includes(f.properties.cc)).map(f => ({ name: f.properties.n, itemStyle: { areaColor: v('--map-scope') } })),
          tooltip: { show: false },
        },
        series: [{
          type: 'scatter', coordinateSystem: 'geo',
          symbolSize: (val: number[]) => 10 + Math.sqrt(val[2]) * 1.8,
          itemStyle: { color: v('--brand-accent'), borderColor: v('--chart-1'), borderWidth: 2, opacity: 0.9 },
          data: pts.map(p => ({ name: p.name, value: [p.lng, p.lat, p.value] })),
          tooltip: { formatter: (p: { name: string; value: number[] }) => `${p.name}: ${p.value[2]} ${this.unit()}` },
        }],
      }, true);
      this.failed.set(false);
    } catch { this.failed.set(true); }
  }
}
