import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, input, output, signal, viewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import type { ECharts } from 'echarts/core';
import { MIME, downloadBlob, exportFileName, toCsv, toXlsx } from '../../../domain/export';
import { ButtonDirective } from '../../atoms/button/button.directive';
import { IconComponent } from '../../atoms/icon/icon.component';
import { SkeletonComponent } from '../../atoms/skeleton/skeleton.component';
import { injectLang, injectTranslate } from '../../lang';
import { MenuComponent, ZcMenuItem } from '../../molecules/menu/menu.component';
import { ScrollAreaDirective } from '../../scroll-area';
import { ChartData, ChartKind, ChartTheme, buildChartOption, chartRows, hasData } from './chart-options';

let seq = 0;

/**
 * <zc-chart kind="line" title="Las redenciones crecen 12 % en octubre" [data]="…"> filtros </zc-chart>
 * - Título con la conclusión y subtítulo con métrica, periodo y país. Descargar solo con ícono (PNG, Excel, CSV con los
 *   filtros aplicados). Vista Gráfico/Datos; los filtros propios del gráfico van como contenido ([zcChartFilters]).
 * - Estados: cargando (skeleton del alto del gráfico), sin datos y error con Reintentar (solo este bloque falla).
 * - Se adapta al ancho real: menos etiquetas, leyenda abajo y barras más delgadas por debajo de 480 px.
 * - Colores de los tokens --chart-*; se vuelve a dibujar al cambiar el tema o el idioma.
 * Úsalo dentro de @defer (on viewport): ECharts se carga recién al dibujar.
 */
@Component({
  selector: 'zc-chart',
  imports: [TranslocoPipe, ButtonDirective, IconComponent, MenuComponent, SkeletonComponent, ScrollAreaDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.title]': 'null', class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 rounded-md border border-border bg-surface p-5 max-md:p-4', '[attr.aria-labelledby]': 'titleId', role: 'figure' },
  template: `
    <div class="flex min-w-0 items-start gap-3">
      <div class="grid min-w-0 flex-1 gap-0.5">
        <h3 [id]="titleId" class="break-words font-semibold leading-[22px]">{{ title() }}</h3>
        @if (subtitle()) { <p class="text-[13px] leading-[18px] text-muted">{{ subtitle() }}</p> }
      </div>
      @if (showData()) {
        <zc-menu [label]="'org.descargarGrafico' | transloco" [tooltip]="'org.descargar' | transloco" triggerIcon="s:download-minimalistic" [dense]="true"
          [items]="downloadItems()" (select)="download($event)" />
      }
    </div>
    <div class="flex min-w-0 flex-wrap items-center gap-2 max-[479px]:flex-col max-[479px]:items-stretch">
      <div role="tablist" [attr.aria-label]="'org.vista' | transloco" class="inline-flex shrink-0 gap-1 self-start rounded-full bg-surface-2 p-1" (keydown)="onTabKey($event)">
        @for (v of views; track v.v) {
          <button type="button" role="tab" [id]="titleId + '-t-' + v.v" [attr.aria-selected]="view() === v.v" [attr.aria-controls]="titleId + '-p-' + v.v"
            [attr.tabindex]="view() === v.v ? 0 : -1" (click)="setView(v.v)"
            class="inline-flex h-[calc(var(--target-sm)-8px)] cursor-pointer items-center gap-2 rounded-full px-3 text-[13.5px] text-muted aria-selected:bg-surface aria-selected:font-medium aria-selected:text-fg aria-selected:shadow-1">
            <zc-icon [name]="v.icon" [size]="16" />{{ v.key | transloco }}
          </button>
        }
      </div>
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2 max-[479px]:flex-col max-[479px]:items-stretch [&_zc-select]:min-w-[150px]"><ng-content select="[zcChartFilters]" /></div>
    </div>
    @if (loading()) {
      <zc-skeleton variant="block" class="h-chart" />
    } @else if (error()) {
      <div class="grid h-chart content-center justify-items-center gap-2 rounded-sm bg-surface-2 p-4 text-center" role="alert">
        <zc-icon name="s:danger-circle" [size]="24" class="text-danger" />
        <strong class="text-[15px]">{{ 'org.errorGrafico' | transloco }}</strong>
        <span class="text-sm text-muted">{{ 'org.errorGraficoTexto' | transloco }}@if (reference()) { {{ ' Ref. ' + reference() }} }</span>
        <button zcButton variant="outline" size="sm" (click)="retry.emit()"><zc-icon name="s:refresh" [size]="16" />{{ 'org.reintentar' | transloco }}</button>
      </div>
    } @else if (!showData()) {
      <div class="grid h-chart content-center justify-items-center gap-1 rounded-sm bg-surface-2 p-4 text-center">
        <zc-icon name="l:chart-column" [size]="24" class="text-muted" />
        <strong class="text-[15px]">{{ 'org.sinDatos' | transloco }}</strong>
        <span class="text-sm text-muted">{{ 'org.sinDatosTexto' | transloco }}</span>
      </div>
    }
    <div [id]="titleId + '-p-chart'" role="tabpanel" [attr.aria-labelledby]="titleId + '-t-chart'" [hidden]="!showData() || view() !== 'chart'">
      <div #chartEl class="h-chart w-full" role="img" [attr.aria-label]="title()"></div>
    </div>
    @if (showData() && view() === 'table') {
      <div [id]="titleId + '-p-table'" role="tabpanel" [attr.aria-labelledby]="titleId + '-t-table'" zcScrollArea class="max-h-chart min-w-0 overflow-auto rounded-sm border border-border">
        <table class="w-full border-separate border-spacing-0 text-sm">
          <caption class="sr-only">{{ 'org.datosDe' | transloco: { title: title() } }}</caption>
          <thead><tr>
            @for (h of rows()[0]; track $index; let i = $index) { <th scope="col" class="sticky top-0 h-10 border-b border-border bg-surface-2 px-3 text-[13px] font-medium whitespace-nowrap text-muted" [class.text-right]="i > 0" [class.text-left]="i === 0">{{ h }}</th> }
          </tr></thead>
          <tbody>
            @for (r of rows().slice(1); track $index) {
              <tr>
                @for (c of r; track $index; let i = $index) {
                  @if (i === 0) { <th scope="row" class="h-10 border-b border-border px-3 text-left font-normal whitespace-nowrap">{{ c }}</th> }
                  @else { <td class="h-10 border-b border-border px-3 text-right whitespace-nowrap num">{{ fmt()($any(c)) }}</td> }
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    }`,
})
export class ChartComponent {
  readonly kind = input.required<ChartKind>();
  /** La conclusión, no el nombre de la métrica: "Gastronomía lidera las redenciones". */
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly data = input<ChartData | null>(null);
  readonly loading = input(false);
  readonly error = input(false);
  readonly reference = input('');
  /** Encabezado de la primera columna en Datos y descargas ("Día", "Cliente"). */
  readonly categoryLabel = input('');
  /** Rótulo bajo el total de la dona. */
  readonly totalLabel = input('');
  /** Formato de los valores (montos con formatMoney); por defecto, número del idioma. */
  readonly format = input<((v: number) => string) | null>(null);
  readonly retry = output<void>();

  private readonly t = injectTranslate();
  private readonly lang = injectLang();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly chartEl = viewChild.required<ElementRef<HTMLDivElement>>('chartEl');
  readonly titleId = `zc-chart-${++seq}`;
  readonly view = signal<'chart' | 'table'>('chart');
  private readonly narrow = signal(false);
  private readonly themeTick = signal(0);
  private chart?: ECharts;

  readonly views = [{ v: 'chart' as const, key: 'org.grafico', icon: 's:chart-2' as const }, { v: 'table' as const, key: 'org.datos', icon: 'l:table-2' as const }];
  readonly showData = computed(() => !this.loading() && !this.error() && hasData(this.data()));
  readonly fmt = computed(() => this.format() ?? ((v: number) => v.toLocaleString(this.lang() === 'es' ? 'es-PE' : 'en-US')));
  readonly rows = computed(() => (hasData(this.data()) ? chartRows(this.data()!, this.categoryLabel()) : [[]]));
  readonly downloadItems = computed<ZcMenuItem[]>(() => [
    { id: 'png', label: this.t('org.png'), description: this.t('org.pngAyuda'), icon: 's:gallery', group: this.t('org.descargarComo') },
    { id: 'xlsx', label: this.t('org.excel'), description: this.t('org.excelAyuda'), icon: 's:document', group: this.t('org.descargarComo') },
    { id: 'csv', label: this.t('org.csv'), description: this.t('org.csvAyuda'), icon: 's:file', group: this.t('org.descargarComo') },
  ]);

  constructor() {
    const destroy = inject(DestroyRef);
    // Tema: la clase .dark en <html> cambia los tokens; se vuelve a dibujar con los colores nuevos.
    const mo = new MutationObserver(() => this.themeTick.update(n => n + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-brand'] });
    let ro: ResizeObserver | undefined;
    afterNextRender(() => {
      ro = new ResizeObserver(() => {
        const w = this.host.nativeElement.clientWidth;
        if (!w) return;
        this.narrow.set(w < 480);
        this.chart?.resize();
      });
      ro.observe(this.host.nativeElement);
    });
    effect(() => {
      const data = this.data(); const show = this.showData(); const kind = this.kind(); const narrow = this.narrow();
      this.themeTick(); const lang = this.lang(); const fmt = this.fmt(); const total = this.totalLabel();
      if (!show || !data) return;
      void this.draw(kind, data, narrow, lang, fmt, total);
    });
    destroy.onDestroy(() => { mo.disconnect(); ro?.disconnect(); this.chart?.dispose(); });
  }

  private async draw(kind: ChartKind, data: ChartData, narrow: boolean, lang: 'es' | 'en', format: (v: number) => string, totalLabel: string) {
    const { echarts } = await import('./echarts-setup');
    const el = this.chartEl().nativeElement;
    if (!this.chart || this.chart.isDisposed()) this.chart = echarts.init(el, null, { renderer: 'canvas' });
    const reducedMotion = !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.chart.setOption(buildChartOption(kind, data, { theme: this.theme(), narrow, format, totalLabel, reducedMotion }, lang), true);
    this.chart.resize();
  }

  private theme(): ChartTheme {
    const cs = getComputedStyle(this.host.nativeElement);
    const v = (n: string) => cs.getPropertyValue(n).trim();
    return {
      palette: [1, 2, 3, 4, 5, 6].map(i => v(`--chart-${i}`)),
      text: v('--text'), muted: v('--text-muted'), border: v('--border'), surface: v('--surface'), surface3: v('--surface-3'), font: v('--zc-font-sans'),
    };
  }

  setView(v: 'chart' | 'table') {
    this.view.set(v);
    if (v === 'chart') setTimeout(() => this.chart?.resize());
  }

  onTabKey(e: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const next = this.view() === 'chart' ? 'table' : 'chart';
    this.setView(next);
    document.getElementById(`${this.titleId}-t-${next}`)?.focus();
  }

  download(it: ZcMenuItem) {
    const data = this.data();
    if (!data) return;
    const today = new Date().toISOString().slice(0, 10);
    if (it.id === 'png') {
      const url = this.chart?.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: this.theme().surface });
      if (!url) return;
      const a = document.createElement('a'); a.href = url; a.download = exportFileName(this.title(), 'png', today); a.click();
      return;
    }
    const rows = chartRows(data, this.categoryLabel());
    if (it.id === 'csv') downloadBlob(toCsv(rows), MIME.csv, exportFileName(this.title(), 'csv', today));
    else downloadBlob(toXlsx(rows), MIME.xlsx, exportFileName(this.title(), 'xlsx', today));
  }
}
