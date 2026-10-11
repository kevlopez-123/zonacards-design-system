import { describe, expect, it } from 'vitest';
import { ChartTheme, isOpsKind } from './chart-options';
import { buildOpsOption } from './chart-options-ops';

const theme: ChartTheme = { palette: ['#111', '#222', '#333', '#444', '#555', '#666'], text: '#000', muted: '#555', border: '#ddd', surface: '#fff', surface3: '#eee', font: 'Figtree', success: '#0a0', danger: '#a00' };
const ctx = { theme, narrow: false, format: (v: number) => String(v), totalLabel: '', reducedMotion: true };
type Series = { type: string; data: unknown[]; links?: { source: string; target: string; value: number }[] }[];

describe('gráficos de operación: opciones', () => {
  it('distingue los tipos de operación de los básicos', () => {
    expect(isOpsKind('funnel')).toBe(true);
    expect(isOpsKind('line')).toBe(false);
  });

  it('cascada: el primero y el último son totales; los ajustes cuelgan del acumulado', () => {
    const o = buildOpsOption('waterfall', { categories: ['Bruto', 'Comisión', 'Ajuste', 'Neto'], series: [{ name: 'M', values: [100, -10, -5, 85] }] }, ctx, 'es');
    const [base, shown] = o['series'] as Series;
    expect(base.data).toEqual([0, 90, 85, 0]);
    expect((shown.data as { value: number }[]).map(d => d.value)).toEqual([100, 10, 5, 85]);
  });

  it('meta: muestra el porcentaje logrado', () => {
    const o = buildOpsOption('gauge', { categories: ['Emitido', 'Meta'], series: [{ name: 'M', values: [1248000, 1600000] }] }, ctx, 'es');
    expect(((o['series'] as Series)[0].data[0] as { value: number }).value).toBe(78);
  });

  it('sankey: arma nodos y enlaces desde "Origen → Destino"', () => {
    const o = buildOpsOption('sankey', { categories: ['A → B', 'B → C'], series: [{ name: 'F', values: [5, 3] }] }, ctx, 'es');
    const s = (o['series'] as Series)[0];
    expect(s.links).toEqual([{ source: 'A', target: 'B', value: 5 }, { source: 'B', target: 'C', value: 3 }]);
    expect((s.data as { name: string }[]).map(n => n.name)).toEqual(['A', 'B', 'C']);
  });

  it('mapa de calor: una celda por día y hora', () => {
    const o = buildOpsOption('heatmap', { categories: ['8h', '9h'], series: [{ name: 'Lun', values: [1, 2] }, { name: 'Mar', values: [3, 4] }] }, ctx, 'es');
    expect((o['series'] as Series)[0].data).toEqual([[0, 0, 1], [1, 0, 2], [0, 1, 3], [1, 1, 4]]);
  });
});
