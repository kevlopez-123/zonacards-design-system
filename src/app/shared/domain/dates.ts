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
