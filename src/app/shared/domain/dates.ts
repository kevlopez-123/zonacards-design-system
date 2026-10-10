/**
 * Formatos de fecha y hora del design system (sección 17 y 20 de las reglas).
 * Siempre con Intl, en el idioma del usuario y la zona horaria del país de la operación.
 */
export type DateStyle = 'short' | 'medium' | 'long' | 'full' | 'time' | 'time-pad' | 'dt-short' | 'dt-medium' | 'month' | 'iso';
export interface DateFormatOptions { lang?: 'es' | 'en'; timeZone?: string; hourCycle?: 'h12' | 'h23'; }

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function formatDate(d: Date, style: DateStyle, o: DateFormatOptions = {}): string {
  const lang = o.lang ?? 'es';
  const locale = lang === 'en' ? 'en-US' : 'es-PE';
  const base: Intl.DateTimeFormatOptions = { timeZone: o.timeZone ?? 'America/Lima' };
  const f = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...base, ...opts }).format(d);
  const hc = o.hourCycle ?? 'h12';
  switch (style) {
    case 'short': return f({ day: 'numeric', month: 'numeric', year: '2-digit' });
    case 'medium': {
      const mon = cap(f({ month: 'short' }).replace('.', ''));
      return lang === 'en' ? `${mon} ${f({ day: 'numeric' })}, ${f({ year: 'numeric' })}` : `${f({ day: 'numeric' })} ${mon}, ${f({ year: 'numeric' })}`;
    }
    case 'long': return f({ day: 'numeric', month: 'long', year: 'numeric' });
    case 'full': return cap(f({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    case 'time': return f({ hour: 'numeric', minute: '2-digit', hourCycle: hc });
    case 'time-pad': return f({ hour: '2-digit', minute: '2-digit', hourCycle: hc });
    case 'dt-short': return `${formatDate(d, 'short', o)} ${formatDate(d, 'time-pad', o)}`;
    case 'dt-medium': return `${formatDate(d, 'medium', o)} · ${formatDate(d, 'time', o)}`;
    case 'month': return cap(f({ month: 'long', year: 'numeric' }));
    case 'iso': return d.toISOString().slice(0, 10);
  }
}

/* --------------------------------------------------------------------------
   Fechas de calendario (sin hora) como texto ISO "aaaa-mm-dd".
   Se calculan en UTC para que la zona horaria del navegador no corra el día.
   -------------------------------------------------------------------------- */
export type IsoDate = string;

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (d: Date): IsoDate => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

export const isIsoDate = (s: unknown): s is IsoDate => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
/** Medianoche UTC del día: úsala con formatDate(…, { timeZone: 'UTC' }). */
export const isoToDate = (iso: IsoDate): Date => new Date(iso + 'T00:00:00Z');

/** Hoy en la zona horaria del país de la operación. */
export function todayIso(timeZone = 'America/Lima', now: Date = new Date()): IsoDate {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function addDays(iso: IsoDate, n: number): IsoDate {
  const d = isoToDate(iso); d.setUTCDate(d.getUTCDate() + n); return toIso(d);
}
/** Suma meses al primer día del mes (navegación del calendario). */
export function addMonths(iso: IsoDate, n: number): IsoDate {
  const d = isoToDate(iso); return toIso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1)));
}
export const startOfMonth = (iso: IsoDate): IsoDate => iso.slice(0, 8) + '01';
export function endOfMonth(iso: IsoDate): IsoDate {
  const d = isoToDate(iso); return toIso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)));
}
/** Lunes de la semana del día. */
export function startOfWeek(iso: IsoDate): IsoDate { return addDays(iso, -((isoToDate(iso).getUTCDay() + 6) % 7)); }
/** Días del rango contando ambos extremos. */
export const daysInRange = (from: IsoDate, to: IsoDate): number => Math.round((isoToDate(to).getTime() - isoToDate(from).getTime()) / 864e5) + 1;
export const sameMonth = (a: IsoDate, b: IsoDate) => a.slice(0, 7) === b.slice(0, 7);

/** 42 días (6 semanas, de lunes a domingo) que cubren el mes. */
export function monthGrid(month: IsoDate): IsoDate[] {
  const first = startOfWeek(startOfMonth(month));
  return Array.from({ length: 42 }, (_, i) => addDays(first, i));
}

/** Máscara dd/mm/aaaa mientras se escribe: solo dígitos y barras automáticas. */
export function maskDmy(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  return d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}
/** "dd/mm/aaaa" → ISO, o null si el formato o la fecha no existen (31/02). */
export function parseDmy(s: string): IsoDate | null {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  return +m[2] >= 1 && +m[2] <= 12 && toIso(isoToDate(iso)) === iso ? iso : null;
}
export const formatDmy = (iso: IsoDate): string => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/** Máscara hh:mm (24 h) mientras se escribe. */
export function maskHm(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
}
export const isValidHm = (s: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
/** Horas cada `step` minutos entre dos horas (incluidas). */
export function timeSlots(from = '00:00', to = '23:30', step = 30): string[] {
  const toMin = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3);
  const out: string[] = [];
  for (let m = toMin(from); m <= toMin(to); m += step) out.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  return out;
}

/** "hace 3 horas", "mañana", "dentro de 3 días". Mostrar la fecha completa en tooltip. */
export function formatRelative(d: Date, now: Date = new Date(), lang: 'es' | 'en' = 'es'): string {
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  const s = (d.getTime() - now.getTime()) / 1000; const a = Math.abs(s);
  if (a < 60) return rtf.format(Math.round(s), 'second');
  if (a < 3600) return rtf.format(Math.round(s / 60), 'minute');
  if (a < 86400) return rtf.format(Math.round(s / 3600), 'hour');
  if (a < 86400 * 30) return rtf.format(Math.round(s / 86400), 'day');
  return rtf.format(Math.round(s / 2592000), 'month');
}
