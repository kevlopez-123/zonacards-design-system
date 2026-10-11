/** Tipos de zc-chart (sección 7): línea con comparación, barras horizontales, barras apiladas y dona con total; más los de operación (o-charts2). */
export type OpsChartKind = 'funnel' | 'waterfall' | 'heatmap' | 'treemap' | 'calendar' | 'sankey' | 'gauge';
export type ChartKind = 'line' | 'bar-h' | 'stacked' | 'donut' | OpsChartKind;
/** Los de operación se arman en chart-options-ops (se carga con import() solo cuando se dibuja uno). */
export const isOpsKind = (k: ChartKind): k is OpsChartKind => !['line', 'bar-h', 'stacked', 'donut'].includes(k);

export interface ChartSeries {
  name: string;
  values: readonly number[];
  /** Línea punteada (periodo anterior). */
  dashed?: boolean;
}
export interface ChartData { categories: readonly string[]; series: readonly ChartSeries[]; }

/** Colores y medidas resueltos de los tokens en el momento de dibujar (cambian con el tema). */
export interface ChartTheme {
  palette: readonly string[];
  text: string; muted: string; border: string; surface: string; surface3: string; font: string; success: string; danger: string;
}
export interface ChartContext {
  theme: ChartTheme;
  /** Contenedor angosto (menos de 480 px): menos etiquetas, leyenda abajo y barras más delgadas. */
  narrow: boolean;
  format: (v: number) => string;
  /** Rótulo bajo el total de la dona ("redenciones"). */
  totalLabel: string;
  reducedMotion: boolean;
}

export const hasData = (d: ChartData | null | undefined): d is ChartData =>
  !!d && d.categories.length > 0 && d.series.some(s => s.values.some(v => v !== 0));

/** Abrevia ejes: 1.240 → 1,2K. */
export function axisShort(v: number, lang: 'es' | 'en'): string {
  const abs = Math.abs(v);
  const f = (n: number, s: string) => n.toLocaleString(lang === 'es' ? 'es-PE' : 'en-US', { maximumFractionDigits: 1 }) + s;
  return abs >= 1e6 ? f(v / 1e6, 'M') : abs >= 1e3 ? f(v / 1e3, 'K') : f(v, '');
}

/** Opción de ECharts para cada tipo. Función pura: se prueba sin navegador. */
export function buildChartOption(kind: Exclude<ChartKind, OpsChartKind>, data: ChartData, ctx: ChartContext, lang: 'es' | 'en'): Record<string, unknown> {
  const { theme: t, narrow, format } = ctx;
  const color = (i: number) => t.palette[i % t.palette.length];
  const base = {
    animationDuration: ctx.reducedMotion ? 0 : 400,
    textStyle: { fontFamily: t.font, color: t.muted },
    // Línea y apiladas: la leyenda es HTML sobre el gráfico (chartLegend), como index.html; la dona la dibuja ECharts.
    grid: { left: 4, right: narrow ? 8 : 16, top: 12, bottom: 4, containLabel: true },
    tooltip: { trigger: 'axis', confine: true, backgroundColor: t.surface, borderColor: t.border, textStyle: { color: t.text }, valueFormatter: (v: number) => format(v) },
    legend: { show: kind === 'donut', bottom: 0, left: 'center', icon: 'roundRect', itemWidth: 12, itemHeight: 8, itemGap: narrow ? 10 : 16, textStyle: { color: t.muted, fontSize: 12 } },
  };
  const axis = {
    axisLine: { lineStyle: { color: t.border } }, axisTick: { show: false },
    axisLabel: { color: t.muted, fontSize: narrow ? 11 : 12, hideOverlap: true },
    splitLine: { lineStyle: { color: t.border, type: 'dashed' } },
  };
  const valueAxis = { type: 'value', ...axis, axisLabel: { ...axis.axisLabel, formatter: (v: number) => axisShort(v, lang) } };

  if (kind === 'line') {
    const every = Math.max(1, Math.ceil(data.categories.length / (narrow ? 4 : 7)));
    return {
      ...base,
      xAxis: { type: 'category', data: data.categories, boundaryGap: false, ...axis, splitLine: { show: false }, axisLabel: { ...axis.axisLabel, interval: every - 1 } },
      yAxis: valueAxis,
      series: data.series.map((s, i) => ({
        name: s.name, type: 'line', data: s.values, smooth: 0.3, symbol: 'none',
        lineStyle: { width: s.dashed ? 1.5 : 2.5, type: s.dashed ? 'dashed' : 'solid', color: s.dashed ? color(5) : color(i) },
        itemStyle: { color: s.dashed ? color(5) : color(i) },
        ...(i === 0 && !s.dashed ? { areaStyle: { color: color(0), opacity: 0.08 } } : {}),
      })),
    };
  }

  if (kind === 'bar-h') {
    const s = data.series[0];
    const cats = [...data.categories].reverse(); const vals = [...(s?.values ?? [])].reverse();
    return {
      ...base, legend: { show: false },
      tooltip: { ...base.tooltip, axisPointer: { type: 'shadow' } },
      xAxis: { ...valueAxis, splitNumber: narrow ? 3 : 5 },
      yAxis: { type: 'category', data: cats, ...axis, splitLine: { show: false }, axisLabel: { ...axis.axisLabel, width: narrow ? 80 : 120, overflow: 'truncate' } },
      series: [{
        name: s?.name, type: 'bar', barWidth: narrow ? 14 : 18, itemStyle: { borderRadius: [0, 6, 6, 0] },
        // El mayor se destaca con el color principal; el resto en neutro (la conclusión se lee de un vistazo).
        data: vals.map((v, i) => ({ value: v, itemStyle: { color: i === vals.length - 1 ? color(0) : t.surface3 } })),
        label: { show: true, position: 'right', color: t.text, fontSize: 12, formatter: (p: { value: number }) => format(p.value) },
      }],
    };
  }

  if (kind === 'stacked') {
    return {
      ...base,
      tooltip: { ...base.tooltip, axisPointer: { type: 'shadow' } },
      xAxis: { type: 'category', data: data.categories, ...axis, splitLine: { show: false } },
      yAxis: valueAxis,
      series: data.series.map((s, i) => ({
        name: s.name, type: 'bar', stack: 'total', data: s.values, barMaxWidth: narrow ? 20 : 32, itemStyle: {
          color: color(i), borderRadius: i === data.series.length - 1 ? [6, 6, 0, 0] : 0,
        },
      })),
    };
  }

  // Dona: el total al centro y la leyenda con porcentaje (a la derecha si hay espacio, abajo si no).
  const s = data.series[0];
  const values = s?.values ?? [];
  const total = values.reduce((a, v) => a + v, 0);
  const center = narrow ? ['50%', '40%'] : ['30%', '50%'];
  return {
    ...base,
    tooltip: { trigger: 'item', confine: true, backgroundColor: t.surface, borderColor: t.border, textStyle: { color: t.text },
      formatter: (p: { name: string; value: number; percent: number }) => `${p.name}: ${format(p.value)} (${p.percent} %)` },
    legend: {
      ...base.legend, orient: narrow ? 'horizontal' : 'vertical', left: narrow ? 'center' : '60%', top: narrow ? undefined : 'middle', bottom: narrow ? 0 : undefined,
      formatter: (n: string) => { const i = data.categories.indexOf(n); return total ? `${n}  ${Math.round((values[i] / total) * 100)} %` : n; },
    },
    series: [{
      type: 'pie', radius: narrow ? ['40%', '60%'] : ['52%', '76%'], center, avoidLabelOverlap: true,
      label: { show: true, position: 'center', formatter: () => `{a|${format(total)}}\n{b|${ctx.totalLabel}}`,
        rich: { a: { fontSize: narrow ? 16 : 18, fontWeight: 600, color: t.text, lineHeight: 22 }, b: { fontSize: 11, color: t.muted, lineHeight: 16 } } },
      emphasis: { label: { show: true } },
      itemStyle: { borderColor: t.surface, borderWidth: 3, borderRadius: 4 },
      data: data.categories.map((c, i) => ({ name: c, value: values[i] ?? 0, itemStyle: { color: color(i) } })),
    }],
  };
}

/** Leyenda HTML de línea y apiladas: marca (línea, guion o cuadro) y número de color --chart-N. Barras horizontales y dona: sin leyenda. */
export interface LegendItem { name: string; mark: 'line' | 'dash' | 'box'; color: number; }
export function chartLegend(kind: ChartKind, data: ChartData): LegendItem[] {
  if (kind === 'line') return data.series.map((s, i) => ({ name: s.name, mark: s.dashed ? 'dash' : 'line', color: s.dashed ? 6 : i + 1 }));
  if (kind === 'stacked') return data.series.map((s, i) => ({ name: s.name, mark: 'box', color: i + 1 }));
  return [];
}

/** Filas para la vista Datos y las descargas: encabezado + una fila por categoría. */
export function chartRows(data: ChartData, categoryLabel: string): (string | number)[][] {
  return [[categoryLabel, ...data.series.map(s => s.name)], ...data.categories.map((c, i) => [c, ...data.series.map(s => s.values[i] ?? 0)])];
}
