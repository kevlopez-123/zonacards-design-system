import type { ChartContext, ChartData, OpsChartKind } from './chart-options';

/** Gráficos de operación (o-charts2 de index.html). Misma forma de datos que el resto de zc-chart. */

/**
 * Cómo se leen los datos en cada tipo:
 * - funnel, treemap: categorías = etapas o categorías; series[0] = valores.
 * - waterfall: primera y última categoría son totales; las del medio, ajustes (negativos restan).
 * - heatmap: categorías = columnas (horas); cada serie es una fila (día) con un valor por columna.
 * - calendar: categorías = fechas ISO (aaaa-mm-dd); series[0] = valor por día.
 * - sankey: categorías "Origen → Destino"; series[0] = valor del flujo.
 * - gauge: series[0].values = [logrado, meta]; muestra el porcentaje.
 */
export function buildOpsOption(kind: OpsChartKind, data: ChartData, ctx: ChartContext, lang: 'es' | 'en'): Record<string, unknown> {
  const { theme: t, narrow, format } = ctx;
  const color = (i: number) => t.palette[i % t.palette.length];
  const vals = data.series[0]?.values ?? [];
  const base = {
    animationDuration: ctx.reducedMotion ? 0 : 400,
    textStyle: { fontFamily: t.font, color: t.muted },
    tooltip: { trigger: 'item', confine: true, backgroundColor: t.surface, borderColor: t.border, textStyle: { color: t.text } },
  };
  const axis = { axisLine: { lineStyle: { color: t.border } }, axisTick: { show: false }, axisLabel: { color: t.muted, fontSize: 11 } };
  const ramp = (c: string) => ({ min: 0, orient: 'horizontal', left: 'center', bottom: 0, itemWidth: 12, itemHeight: 120, textStyle: { color: t.muted, fontSize: 11 },
    inRange: { color: [t.surface3, c] }, text: lang === 'es' ? ['Más', 'Menos'] : ['More', 'Less'] });

  switch (kind) {
    case 'funnel':
      return { ...base, tooltip: { ...base.tooltip, formatter: (p: { name: string; value: number }) => `${p.name}: ${format(p.value)}` },
        series: [{ type: 'funnel', left: '4%', width: '78%', top: 8, bottom: 8, minSize: '30%', sort: 'descending', gap: 3,
          label: { show: true, position: 'inside', fontSize: 12, lineHeight: 16, formatter: (p: { name: string; value: number }) => `${p.name}\n${format(p.value)}` },
          itemStyle: { borderWidth: 0 }, data: data.categories.map((c, i) => ({ name: c, value: vals[i], itemStyle: { color: color(i) }, label: { color: i === 1 ? t.text : t.surface } })) }] };

    case 'waterfall': {
      let acc = 0; const baseVals: number[] = []; const shown: number[] = [];
      vals.forEach((v, i) => {
        if (i === 0 || i === vals.length - 1) { baseVals.push(0); shown.push(v); acc = v; }
        else { acc += v; baseVals.push(v < 0 ? acc : acc - v); shown.push(Math.abs(v)); }
      });
      return { ...base, grid: { left: 4, right: 12, top: 20, bottom: 4, containLabel: true },
        tooltip: { ...base.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p: { dataIndex: number }[]) => `${data.categories[p[1].dataIndex]}: ${format(vals[p[1].dataIndex])}` },
        xAxis: { type: 'category', data: data.categories, ...axis, axisLabel: { ...axis.axisLabel, interval: 0, width: narrow ? 56 : 80, overflow: 'break' } },
        yAxis: { type: 'value', ...axis, splitLine: { lineStyle: { color: t.border, type: 'dashed' } }, axisLabel: { ...axis.axisLabel, formatter: (v: number) => v / 1000 + 'K' } },
        series: [
          { type: 'bar', stack: 'w', itemStyle: { color: 'transparent' }, data: baseVals, tooltip: { show: false } },
          { type: 'bar', stack: 'w', barMaxWidth: 40, data: shown.map((v, i) => ({ value: v, itemStyle: { borderRadius: 4,
            color: i === 0 ? color(0) : i === shown.length - 1 ? t.success : t.danger } })),
            label: { show: true, position: 'top', color: t.text, fontSize: 11, formatter: (p: { dataIndex: number; value: number }) =>
              (p.dataIndex && p.dataIndex < shown.length - 1 ? '−' : '') + (p.value / 1000).toFixed(1) + 'K' } },
        ] };
    }

    case 'heatmap': {
      const cells: [number, number, number][] = [];
      data.series.forEach((s, y) => s.values.forEach((v, x) => cells.push([x, y, v])));
      const max = Math.max(1, ...cells.map(c => c[2]));
      return { ...base, grid: { left: 4, right: 8, top: 8, bottom: 44, containLabel: true },
        tooltip: { ...base.tooltip, formatter: (p: { value: [number, number, number] }) => `${data.series[p.value[1]].name} ${data.categories[p.value[0]]}: ${format(p.value[2])}` },
        xAxis: { type: 'category', data: data.categories, ...axis, axisLabel: { ...axis.axisLabel, interval: narrow ? 2 : 1 } },
        yAxis: { type: 'category', data: data.series.map(s => s.name), inverse: true, ...axis },
        visualMap: { ...ramp(color(0)), max, calculable: false },
        series: [{ type: 'heatmap', data: cells, itemStyle: { borderColor: t.surface, borderWidth: 2, borderRadius: 3 } }] };
    }

    case 'treemap':
      return { ...base, tooltip: { ...base.tooltip, formatter: (p: { name: string; value: number }) => `${p.name}: ${format(p.value)}` },
        series: [{ type: 'treemap', roam: false, nodeClick: false, breadcrumb: { show: false }, left: 0, right: 0, top: 0, bottom: 0,
          label: { show: true, color: t.surface, fontSize: 12, lineHeight: 16, formatter: (p: { name: string; value: number }) => `${p.name}\n${format(p.value)}` },
          itemStyle: { borderColor: t.surface, borderWidth: 2, gapWidth: 2 },
          data: data.categories.map((c, i) => ({ name: c, value: vals[i], itemStyle: { color: color(i) } })) }] };

    case 'calendar': {
      const year = data.categories[0]?.slice(0, 4) ?? '';
      const days = lang === 'es' ? ['D', 'L', 'M', 'X', 'J', 'V', 'S'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      const months = lang === 'es' ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return { ...base, tooltip: { ...base.tooltip, formatter: (p: { value: [string, number] }) => `${p.value[0]}: ${format(p.value[1])}` },
        visualMap: { ...ramp(color(1)), max: Math.max(1, ...vals) },
        calendar: { top: 24, left: 36, right: 8, bottom: 40, range: year, cellSize: ['auto', narrow ? 9 : 13],
          dayLabel: { firstDay: 1, nameMap: days, color: t.muted, fontSize: 10 }, monthLabel: { nameMap: months, color: t.muted, fontSize: 11 },
          yearLabel: { show: false }, itemStyle: { borderColor: t.surface, borderWidth: 2 }, splitLine: { show: false } },
        series: [{ type: 'heatmap', coordinateSystem: 'calendar', data: data.categories.map((d, i) => [d, vals[i]]) }] };
    }

    case 'sankey': {
      const links = data.categories.map((c, i) => { const [source, target] = c.split(' → '); return { source, target, value: vals[i] }; });
      const nodes = [...new Set(links.flatMap(l => [l.source, l.target]))];
      return { ...base, tooltip: { ...base.tooltip, formatter: (p: { data: { source?: string; target?: string; value?: number }; name: string }) =>
          p.data.source ? `${p.data.source} → ${p.data.target}: ${format(p.data.value ?? 0)}` : p.name },
        series: [{ type: 'sankey', left: 4, right: narrow ? 70 : 100, top: 8, bottom: 8, nodeGap: 12, nodeWidth: 12, draggable: false,
          label: { color: t.text, fontSize: 12 }, lineStyle: { color: 'gradient', opacity: 0.35, curveness: 0.5 },
          data: nodes.map((n, i) => ({ name: n, itemStyle: { color: color(i) } })), links }] };
    }

    case 'gauge': {
      const [done = 0, goal = 1] = vals;
      const pct = Math.round((done / goal) * 100);
      return { ...base, series: [{ type: 'gauge', startAngle: 200, endAngle: -20, min: 0, max: 100, radius: '92%', center: ['50%', '62%'],
        progress: { show: true, width: 16, roundCap: true, itemStyle: { color: color(0) } },
        axisLine: { roundCap: true, lineStyle: { width: 16, color: [[1, t.surface3]] } },
        axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, pointer: { show: false }, anchor: { show: false },
        title: { show: true, offsetCenter: [0, '30%'], color: t.muted, fontSize: 13 },
        detail: { valueAnimation: !ctx.reducedMotion, offsetCenter: [0, '-5%'], formatter: '{value} %', color: t.text, fontSize: 28, fontWeight: 600 },
        data: [{ value: pct, name: `${format(done)} / ${format(goal)}` }] }] };
    }
  }
}
