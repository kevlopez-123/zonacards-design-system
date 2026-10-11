// Solo los módulos de ECharts que usan zc-chart y zc-map (se carga con import() la primera vez que se dibuja un gráfico).
import { BarChart, FunnelChart, GaugeChart, HeatmapChart, LineChart, PieChart, SankeyChart, ScatterChart, TreemapChart } from 'echarts/charts';
import { CalendarComponent, GeoComponent, GridComponent, LegendComponent, TooltipComponent, VisualMapComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, BarChart, PieChart, FunnelChart, HeatmapChart, TreemapChart, SankeyChart, GaugeChart, ScatterChart,
  GeoComponent, GridComponent, LegendComponent, TooltipComponent, VisualMapComponent, CalendarComponent, CanvasRenderer]);

export { echarts };
