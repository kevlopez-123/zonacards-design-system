import { addDays, IsoDate, isoToDate } from './dates';

/**
 * Regla de recurrencia para envíos, reportes y tareas programadas (sección m-recur de index.html).
 * Fechas de calendario como ISO "aaaa-mm-dd" y hora "hh:mm" en la zona horaria del país de la operación.
 */
export type RecurFreq = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurEnd = 'never' | 'until' | 'count';

export interface RecurRule {
  freq: RecurFreq;
  /** Cada n días, semanas, meses o años (1 a 30). */
  interval: number;
  /** Días de la semana (0 = domingo … 6 = sábado), solo en semanal. */
  days: number[];
  /** Mensual: el mismo día del mes de inicio, o el mismo "n-ésimo día de la semana" (ej. segundo lunes). */
  monthMode: 'day' | 'nth';
  end: RecurEnd;
  until: IsoDate | null;
  /** Número de veces (1 a 100). */
  count: number;
  time: string;
}

export const RECUR_MAX_INTERVAL = 30;
export const RECUR_MAX_COUNT = 100;

const dow = (iso: IsoDate) => isoToDate(iso).getUTCDay();
const dom = (iso: IsoDate) => isoToDate(iso).getUTCDate();
const monthIndex = (iso: IsoDate) => { const d = isoToDate(iso); return d.getUTCFullYear() * 12 + d.getUTCMonth(); };
const daysBetween = (a: IsoDate, b: IsoDate) => Math.round((isoToDate(b).getTime() - isoToDate(a).getTime()) / 864e5);

/** Semana del mes del día (0 = primera … 4 = quinta o última), para "el segundo lunes". */
export const nthOfMonth = (iso: IsoDate) => Math.min(4, Math.floor((dom(iso) - 1) / 7));

/** La regla no produce fechas (semanal sin días). */
export const recurInvalid = (r: RecurRule): 'days' | null => (r.freq === 'weekly' && !r.days.length ? 'days' : null);

/** Próximas fechas desde start (incluida) según la regla; como máximo max. */
export function occurrences(r: RecurRule, start: IsoDate, max: number): IsoDate[] {
  if (r.freq === 'none') return [start];
  if (recurInvalid(r)) return [];
  const n = Math.max(1, r.interval);
  const out: IsoDate[] = [];
  const startMonday = addDays(start, -((dow(start) + 6) % 7));
  const nth = nthOfMonth(start), wd = dow(start);
  let d = start;
  for (let guard = 0; out.length < max && guard < 3700; guard++, d = addDays(d, 1)) {
    let ok = false;
    switch (r.freq) {
      case 'daily': ok = daysBetween(start, d) % n === 0; break;
      case 'weekly': ok = r.days.includes(dow(d)) && Math.floor(daysBetween(startMonday, d) / 7) % n === 0; break;
      case 'monthly': {
        const m = monthIndex(d) - monthIndex(start);
        ok = m % n === 0 && (r.monthMode === 'day' ? dom(d) === dom(start) : dow(d) === wd && nthOfMonth(d) === nth);
        break;
      }
      case 'yearly': ok = d.slice(5) === start.slice(5) && (+d.slice(0, 4) - +start.slice(0, 4)) % n === 0; break;
    }
    if (!ok) continue;
    if (r.end === 'until' && r.until && d > r.until) break;
    if (r.end === 'count' && out.length >= r.count) break;
    out.push(d);
  }
  return out;
}

/** Días ordenados de lunes a domingo (como se leen en la frase). */
export const sortWeekdays = (days: number[]) => [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
