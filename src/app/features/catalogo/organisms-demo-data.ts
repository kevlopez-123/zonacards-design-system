import { CountryCode } from '../../shared/domain/countries';
import { GiftcardState } from '../../shared/domain/states';
import { ChartData } from '../../shared/ui/organisms/chart/chart-options';

// Datos de ejemplo de docs/design-system (secciones o-table, o-filter y o-charts), ampliados con semilla fija.
export interface DemoLot {
  id: string; name: string; client: string; country: CountryCode; state: GiftcardState;
  unit: number; qty: number; activated: number; expires: string; channel: 'Correo' | 'WhatsApp' | 'ZIP'; category: string;
}

const BASE: DemoLot[] = [
  { id: '#02829', name: 'Navidad 2026', client: 'Interbank', country: 'pe', state: 'activated', unit: 100, qty: 500, activated: 332, expires: '2026-12-31', channel: 'Correo', category: 'Gastronomía' },
  { id: '#02830', name: 'Bienvenida clientes', client: 'Banco Pichincha', country: 'ec', state: 'activated', unit: 25, qty: 1200, activated: 410, expires: '2027-06-30', channel: 'WhatsApp', category: 'Experiencias' },
  { id: '#02831', name: 'Incentivo fuerza de ventas', client: 'Entel', country: 'cl', state: 'created', unit: 20000, qty: 300, activated: 0, expires: '2027-03-15', channel: 'ZIP', category: 'Tecnología' },
  { id: '#02832', name: 'Día del Padre', client: 'Bancolombia', country: 'co', state: 'activated', unit: 50000, qty: 800, activated: 720, expires: '2027-06-20', channel: 'Correo', category: 'Moda' },
  { id: '#02833', name: 'Campaña aniversario', client: 'Tigo', country: 'bo', state: 'expired', unit: 100, qty: 250, activated: 198, expires: '2026-09-01', channel: 'Correo', category: 'Viajes' },
  { id: '#02834', name: 'Reconocimiento anual', client: 'Bimbo', country: 'mx', state: 'voided', unit: 500, qty: 150, activated: 0, expires: '2027-01-31', channel: 'WhatsApp', category: 'Hogar' },
  { id: '#02835', name: 'Cyber Wow', client: 'BCP', country: 'pe', state: 'activated', unit: 50, qty: 2000, activated: 1610, expires: '2026-11-30', channel: 'Correo', category: 'Tecnología' },
  { id: '#02836', name: 'Fiestas Patrias', client: 'BBVA', country: 'pe', state: 'created', unit: 200, qty: 100, activated: 0, expires: '2027-07-28', channel: 'ZIP', category: 'Gastronomía' },
];

const NAMES = ['Día de la Madre', 'Cierre de año', 'Programa de lealtad', 'Bono de productividad', 'Verano 2027', 'Regreso a clases', 'Aniversario 10 años', 'Premio ventas Q3'];
const CLIENTS: Record<CountryCode, string[]> = {
  pe: ['Interbank', 'BCP', 'BBVA', 'Alicorp'], ec: ['Banco Pichincha', 'Produbanco'], bo: ['Tigo', 'Banco Unión'],
  co: ['Bancolombia', 'Davivienda'], cl: ['Entel', 'Falabella'], mx: ['Bimbo', 'Banorte'],
};
const UNITS: Record<CountryCode, number[]> = { pe: [50, 100, 200], ec: [25, 50], bo: [100, 200], co: [50000, 100000], cl: [20000, 30000], mx: [500, 1000] };
const STATES: GiftcardState[] = ['activated', 'activated', 'created', 'expired', 'activated', 'voided'];
const CHANNELS: DemoLot['channel'][] = ['Correo', 'WhatsApp', 'ZIP'];
const CATS = ['Gastronomía', 'Experiencias', 'Tecnología', 'Moda', 'Viajes', 'Hogar'];
const CC: CountryCode[] = ['pe', 'co', 'cl', 'mx', 'ec', 'bo'];

/** Generador determinista (mulberry32): mismos datos en cada carga y en las pruebas. */
function rng(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export const DEMO_LOTS: DemoLot[] = (() => {
  const r = rng(2829); const pick = <T>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  const extra = Array.from({ length: 22 }, (_, i): DemoLot => {
    const country = CC[i % CC.length]; const state = pick(STATES); const qty = [100, 250, 500, 800, 1200][Math.floor(r() * 5)];
    const month = 1 + Math.floor(r() * 12), day = 1 + Math.floor(r() * 28);
    return {
      id: '#0' + (2837 + i), name: pick(NAMES), client: pick(CLIENTS[country]), country, state, unit: pick(UNITS[country]), qty,
      activated: state === 'created' || state === 'voided' ? 0 : Math.round(qty * (0.3 + r() * 0.65)),
      expires: `${state === 'expired' ? 2026 : 2027}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      channel: pick(CHANNELS), category: pick(CATS),
    };
  });
  return [...BASE, ...extra];
})();

/** Series para los gráficos: tendencia diaria, top de clientes, mezcla por mes y redenciones por categoría. */
export function trendData(days: number, country: string, compare: boolean): ChartData {
  const k = country === 'all' ? 1 : ({ pe: 0.45, co: 0.25, cl: 0.18, mx: 0.3 } as Record<string, number>)[country] ?? 0.3;
  const r = rng(days * 7 + country.length);
  const em = Array.from({ length: days }, (_, i) => Math.round((380 + 60 * Math.sin(i / 3) + r() * 70 + i * 2) * k));
  const rd = em.map((v, i) => Math.round(v * (0.62 + (i / days) * 0.12)));
  const pv = Array.from({ length: days }, (_, i) => Math.round((340 + 50 * Math.sin(i / 3 + 1) + r() * 60) * k));
  const today = new Date(2026, 9, 10);
  const categories = Array.from({ length: days }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() - (days - 1 - i)); return `${d.getDate()}/${d.getMonth() + 1}`; });
  return { categories, series: [{ name: 'Emitidos', values: em }, { name: 'Redimidos', values: rd }, ...(compare ? [{ name: 'Periodo anterior', values: pv, dashed: true }] : [])] };
}

const TOP: Record<string, [string, number][]> = {
  pe: [['Interbank', 412000], ['BCP', 380000], ['BBVA', 298000], ['Alicorp', 190000], ['Scotiabank', 160000], ['Backus', 92000]],
  co: [['Bancolombia', 520000], ['Davivienda', 410000], ['Éxito', 300000], ['Avianca', 210000], ['Rappi', 160000], ['Claro', 90000]],
  cl: [['Entel', 380000], ['Falabella', 340000], ['Cencosud', 250000], ['LATAM', 200000], ['Banco de Chile', 150000], ['Copec', 80000]],
  mx: [['Bimbo', 820000], ['Banorte', 640000], ['Femsa', 520000], ['Telcel', 410000], ['Liverpool', 300000], ['Cemex', 180000]],
};
export function topClientsData(country: string, metric: 'valor' | 'cant'): ChartData {
  const rows = TOP[country] ?? TOP['pe'];
  return { categories: rows.map(r => r[0]), series: [{ name: metric === 'valor' ? 'Valor emitido' : 'Códigos', values: rows.map(r => (metric === 'valor' ? r[1] : Math.round(r[1] / 230))) }] };
}

export function mixData(country: string, pct: boolean): ChartData {
  const k = country === 'all' ? 1 : 0.4;
  const own = [520, 560, 610, 590, 640, 680].map(x => Math.round(x * k)), third = [260, 300, 360, 390, 420, 470].map(x => Math.round(x * k));
  const months = ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'];
  if (!pct) return { categories: months, series: [{ name: 'Propias', values: own }, { name: 'Terceros', values: third }] };
  return { categories: months, series: [{ name: 'Propias %', values: own.map((v, i) => Math.round((v / (v + third[i])) * 100)) }, { name: 'Terceros %', values: third.map((v, i) => Math.round((v / (own[i] + v)) * 100)) }] };
}

export function categoryData(country: string, days: number): ChartData {
  const k = (country === 'all' ? 1 : 0.35) * (days / 30);
  return { categories: ['Gastronomía', 'Experiencias', 'Tecnología', 'Moda', 'Viajes', 'Hogar'], series: [{ name: 'Redenciones', values: [3120, 2210, 1640, 1180, 820, 160].map(x => Math.round(x * k)) }] };
}
