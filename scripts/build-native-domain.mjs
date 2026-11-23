// Fase 2 del plan nativo: núcleo de dominio compartido.
// 1. Ejecuta el dominio real de @zonacards/tokens (src/domain) y extrae de Intl todo lo que depende del idioma
//    (separadores, patrones de moneda, nombres de meses, patrones de fecha, rangos, tiempo relativo) → domain-spec.json.
//    Así Swift y Kotlin no dependen de la versión de ICU de cada teléfono: formatean igual que la web.
// 2. Genera casos de prueba (entrada → salida de la web) → domain-vectors.json, que corren las tres plataformas.
// 3. Genera los datos (países, prefijos, máquinas de estado, apariencias, reglas tributarias) en Swift y Kotlin.
// Uso: npm run native (lo llama build-native.mjs) o node scripts/build-native-domain.mjs
import { buildSync } from 'esbuild';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { deflateRawSync } from 'node:zlib';
import { JSDOM } from 'jsdom';

const OUT = 'projects/zonacards-native';
const HEADER = 'Archivo generado por scripts/build-native-domain.mjs. No editar a mano.';
const write = (file, text) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, text); };

// ---------- Cargar el dominio TypeScript tal cual ----------
const entry = 'projects/zonacards-tokens/src/domain/__native_entry.ts';
const bundle = resolve(tmpdir(), `zc-domain-${process.pid}.mjs`);
writeFileSync(entry, ['money', 'countries', 'dates', 'phone', 'password', 'tax-id', 'states', 'recurrence', 'export', 'xlsx-read', 'bulk-import'].map((m) => `export * from './${m}';`).join('\n'));
try { buildSync({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', outfile: bundle, logLevel: 'error' }); } finally { rmSync(entry, { force: true }); }
const d = await import(pathToFileURL(bundle).href);
rmSync(bundle, { force: true });

// ---------- Especificación de idioma ----------
const LANG_LOCALE = { es: 'es-PE', en: 'en-US' };
const NUM = '#';
const money = {};
for (const c of d.COUNTRIES) {
  const parts = new Intl.NumberFormat(c.locale, { minimumFractionDigits: 1 }).formatToParts(12345.6);
  const group = parts.find((p) => p.type === 'group')?.value ?? '';
  const decimal = parts.find((p) => p.type === 'decimal')?.value ?? '.';
  // ¿Agrupa desde 4 cifras ("1.234") o solo desde 5 ("1234")?
  const minGrouping = new Intl.NumberFormat(c.locale).format(1234).includes(group) ? 1 : 2;
  const patterns = {};
  for (const display of ['auto', 'symbol', 'code']) {
    const pos = d.formatMoneyWhole(7, c.code, { display }).replace('7', NUM);
    const neg = d.formatMoneyWhole(-7, c.code, { display }).replace('7', NUM);
    const compactParts = d.formatMoneyCompact(7000, c.code, { display }); // "S/ 7K"
    patterns[display] = { pos, neg, compact: compactParts.replace('7K', NUM) };
  }
  money[c.code] = { decimals: c.decimals, group, decimal, minGrouping, patterns };
}

const DATE_OPTS = {
  short: { day: 'numeric', month: 'numeric', year: '2-digit' },
  long: { day: 'numeric', month: 'long', year: 'numeric' },
  full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  month: { month: 'long', year: 'numeric' },
  time: { hour: 'numeric', minute: '2-digit' },
  'time-pad': { hour: '2-digit', minute: '2-digit' },
};
const token = (type, opts, hc) => {
  switch (type) {
    case 'day': return opts.day === '2-digit' ? '{dd}' : '{d}';
    case 'month': return opts.month === 'numeric' ? '{M}' : opts.month === 'short' ? '{MMM}' : '{MMMM}';
    case 'year': return opts.year === '2-digit' ? '{yy}' : '{yyyy}';
    case 'weekday': return '{EEEE}';
    case 'hour': return hc === 'h23' ? (opts.hour === '2-digit' ? '{HH}' : '{H}') : (opts.hour === '2-digit' ? '{hh}' : '{h}');
    case 'minute': return '{mm}';
    case 'dayPeriod': return '{a}';
    case 'literal': return null;
  }
  throw new Error(`Parte de fecha sin token: ${type}`);
};
// format() de V8 usa un espacio común donde formatToParts devuelve U+202F (espacio fino irrompible): se iguala a format().
const lit = (s) => s.replace(/[{}]/g, '').replace(/ /g, ' ');
// La hora se decide por lo que Intl escribe a las 05:07 (en 24 h, "numeric" también rellena: "05:07").
const toPattern = (parts, opts, hc) => parts.map((p) => (p.type === 'hour' ? (hc === 'h23' ? (p.value.length === 2 ? '{HH}' : '{H}') : (p.value.length === 2 ? '{hh}' : '{h}')) : token(p.type, opts, hc) ?? lit(p.value))).join('');
const earlySample = new Date('2026-03-05T05:07:00Z');
const sample = new Date('2026-03-05T19:07:00Z');
const dates = {};
for (const [lang, locale] of Object.entries(LANG_LOCALE)) {
  const fmt = (o) => new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...o });
  // Nombres tomados dentro de una fecha (forma de contexto: "marzo"), no sueltos (forma independiente: "Marzo").
  const partOf = (o, date, type) => fmt(o).formatToParts(date).find((p) => p.type === type).value;
  const months = (m) => Array.from({ length: 12 }, (_, i) => partOf({ day: 'numeric', month: m, year: 'numeric' }, new Date(Date.UTC(2026, i, 15)), 'month'));
  const weekdays = Array.from({ length: 7 }, (_, i) => partOf({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, new Date(Date.UTC(2026, 2, 1 + i)), 'weekday')); // 1 mar 2026 = domingo
  const period = (h) => partOf({ hour: 'numeric', minute: '2-digit', hourCycle: 'h12' }, new Date(Date.UTC(2026, 0, 1, h)), 'dayPeriod');
  const patterns = {};
  for (const [style, o] of Object.entries(DATE_OPTS)) {
    for (const hc of style.startsWith('time') ? ['h12', 'h23'] : [null]) {
      const opts = hc ? { ...o, hourCycle: hc } : o;
      patterns[hc ? `${style}.${hc}` : style] = toPattern(fmt(opts).formatToParts(hc ? earlySample : sample), opts, hc);
    }
  }
  // Rangos (formatRange): mismo día, mismo mes, mismo año y años distintos.
  const rangeFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const rOpts = { day: 'numeric', month: 'short', year: 'numeric' };
  const rangeTok = (parts) => parts.map((p) => {
    const t = token(p.type, rOpts);
    if (!t) return lit(p.value);
    return p.source === 'endRange' ? t.replace('}', '2}') : p.source === 'startRange' ? t.replace('}', '1}') : t.replace('}', '1}');
  }).join('');
  const U = (y, m, dd) => new Date(Date.UTC(y, m, dd, 12));
  const ranges = {
    sameDay: rangeTok(rangeFmt.formatToParts(U(2026, 2, 1))),
    sameMonth: rangeTok(rangeFmt.formatRangeToParts(U(2026, 2, 1), U(2026, 2, 15))),
    sameYear: rangeTok(rangeFmt.formatRangeToParts(U(2026, 2, 1), U(2026, 3, 15))),
    other: rangeTok(rangeFmt.formatRangeToParts(U(2025, 11, 20), U(2026, 0, 15))),
  };
  // Tiempo relativo (numeric: 'auto'): textos exactos para -1, 0 y 1 y patrón para el resto.
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  const relative = {};
  for (const unit of ['second', 'minute', 'hour', 'day', 'month']) {
    relative[unit] = { ...Object.fromEntries([-2, -1, 0, 1, 2].map((n) => [String(n), rtf.format(n, unit)])), past: rtf.format(-7, unit).replace('7', NUM), future: rtf.format(7, unit).replace('7', NUM) };
  }
  dates[lang] = { monthsShort: months('short'), monthsLong: months('long'), weekdaysLong: weekdays, am: period(9), pm: period(15), patterns, ranges, relative, numberGroup: new Intl.NumberFormat(lang).formatToParts(12345).find((p) => p.type === 'group')?.value ?? '' };
}
const spec = { money, dates };

// ---------- Casos de prueba (lo que hace la web) ----------
const V = { money: [], dates: [], calendar: [], phone: [], password: [], taxId: [], recurrence: [], bulkDate: [], bulk: [], csvParse: [], csvOut: [], fileName: [], template: [], xlsxOut: [], xlsxRead: [] };
const AMOUNTS = [0, 0.5, 1, -1, 7, 12.345, 999.995, 1000, 1234, 1234.5, -1234.5, 99999.99, 999950, -999950, 1234567.891, 1e9, 1.5e9, 2.5, -0.005];
for (const c of d.COUNTRIES) for (const display of ['auto', 'symbol', 'code']) for (const a of AMOUNTS) {
  V.money.push({ fn: 'formatMoney', amount: a, country: c.code, display, out: d.formatMoney(a, c.code, { display }) });
  V.money.push({ fn: 'formatMoneyWhole', amount: a, country: c.code, display, out: d.formatMoneyWhole(a, c.code, { display }) });
  V.money.push({ fn: 'formatMoneyCompact', amount: a, country: c.code, display, out: d.formatMoneyCompact(a, c.code, { display }) });
}
for (const c of d.COUNTRIES) {
  for (const a of [0, 7, 999, 1000, 1234, 1234567, -45678, 12.6]) V.money.push({ fn: 'formatNumber', amount: a, country: c.code, out: d.formatNumber(a, c.code) });
  for (const display of ['auto', 'symbol', 'code']) V.money.push({ fn: 'currencySymbol', country: c.code, display, out: d.currencySymbol(c.code, { display }) });
}
const INSTANTS = ['2026-03-05T19:07:00Z', '2026-01-01T04:59:00Z', '2026-12-31T23:30:00Z', '2026-07-14T12:00:00Z', '2026-09-01T00:05:00Z', '2025-02-28T15:45:00Z'];
const STYLES = ['short', 'medium', 'long', 'full', 'time', 'time-pad', 'dt-short', 'dt-medium', 'month', 'iso'];
for (const iso of INSTANTS) for (const lang of ['es', 'en']) for (const timeZone of ['America/Lima', 'America/Santiago', 'America/Mexico_City', 'UTC']) for (const hourCycle of ['h12', 'h23']) for (const style of STYLES) {
  if (hourCycle === 'h23' && !/time|dt-/.test(style)) continue;
  V.dates.push({ fn: 'formatDate', instant: iso, style, lang, timeZone, hourCycle, out: d.formatDate(new Date(iso), style, { lang, timeZone, hourCycle }) });
}
const RANGES = [['2026-03-01T15:00:00Z', '2026-03-15T15:00:00Z'], ['2026-03-01T15:00:00Z', '2026-04-15T15:00:00Z'], ['2025-12-20T15:00:00Z', '2026-01-15T15:00:00Z'], ['2026-03-01T15:00:00Z', '2026-03-01T20:00:00Z'], ['2026-05-31T03:00:00Z', '2026-06-01T03:00:00Z']];
for (const [a, b] of RANGES) for (const lang of ['es', 'en']) for (const timeZone of ['America/Lima', 'UTC']) V.dates.push({ fn: 'formatRange', from: a, to: b, lang, timeZone, out: d.formatRange(new Date(a), new Date(b), { lang, timeZone }) });
const NOW = '2026-03-05T19:07:00Z';
for (const s of [0, -10, 30, -59, 60, -90, 600, -3599, 3600, -7200, 86399, -86400, 172800, -2591000, 2592000, -31536000, 0.4, -0.4, 89.5, -150]) for (const lang of ['es', 'en']) {
  V.dates.push({ fn: 'formatRelative', instant: new Date(Date.parse(NOW) + s * 1000).toISOString(), now: NOW, lang, out: d.formatRelative(new Date(Date.parse(NOW) + s * 1000), new Date(NOW), lang) });
}
const C = (fn, args, out) => V.calendar.push({ fn, args, out });
for (const tz of ['America/Lima', 'America/Santiago', 'America/Mexico_City', 'America/Bogota', 'UTC']) for (const now of ['2026-03-06T03:30:00Z', '2026-03-06T05:30:00Z', '2026-12-31T23:59:00Z']) C('todayIso', [tz, now], d.todayIso(tz, new Date(now)));
for (const [iso, n] of [['2026-03-05', 1], ['2026-02-28', 1], ['2024-02-28', 1], ['2026-12-31', 1], ['2026-03-01', -1], ['2026-01-15', -30], ['2026-03-05', 400]]) C('addDays', [iso, n], d.addDays(iso, n));
for (const [iso, n] of [['2026-01-31', 1], ['2026-12-15', 1], ['2026-01-10', -1], ['2026-03-05', 14]]) C('addMonths', [iso, n], d.addMonths(iso, n));
for (const iso of ['2026-02-10', '2024-02-10', '2026-12-01', '2026-04-30']) { C('startOfMonth', [iso], d.startOfMonth(iso)); C('endOfMonth', [iso], d.endOfMonth(iso)); }
for (const iso of ['2026-03-01', '2026-03-02', '2026-03-05', '2026-03-08', '2026-01-01']) C('startOfWeek', [iso], d.startOfWeek(iso));
for (const [a, b] of [['2026-03-01', '2026-03-01'], ['2026-03-01', '2026-03-31'], ['2025-12-25', '2026-01-05'], ['2024-02-01', '2024-03-01']]) C('daysInRange', [a, b], d.daysInRange(a, b));
for (const m of ['2026-03-01', '2026-02-15', '2026-11-30']) C('monthGrid', [m], d.monthGrid(m));
for (const r of ['', '1', '05', '053', '0503', '05032026', '05/03/2026x', 'ab12cd34ef567']) C('maskDmy', [r], d.maskDmy(r));
for (const s of ['05/03/2026', '31/02/2026', '29/02/2024', '29/02/2026', '00/01/2026', '15/13/2026', '5/3/2026', '2026-03-05']) C('parseDmy', [s], d.parseDmy(s));
for (const iso of ['2026-03-05', '1999-12-31']) C('formatDmy', [iso], d.formatDmy(iso));
for (const r of ['', '9', '093', '0930', '09305', 'a1b2c3']) C('maskHm', [r], d.maskHm(r));
for (const s of ['09:30', '23:59', '24:00', '9:30', '12:60', '00:00']) C('isValidHm', [s], d.isValidHm(s));
for (const a of [['00:00', '02:00', 30], ['08:00', '09:00', 15], ['22:00', '23:30', 45]]) C('timeSlots', a, d.timeSlots(...a));
for (const [cc, raw] of [['pe', '987 654 321'], ['pe', '9876543210'], ['co', '(300) 123-4567'], ['bo', '7123456'], ['us', '+1 415 555 0100'], ['br', '11987654321']]) {
  const digits = d.phoneDigits(raw, cc);
  V.phone.push({ country: cc, raw, digits, valid: d.isValidPhone(cc, digits), formatted: d.formatPhone(digits), intl: d.formatPhoneIntl(cc, digits) });
}
for (const p of ['', 'abc', 'abcdefgh', 'Abcdefgh', 'Abcdefg1', 'Abcdefg1!', 'ABC123_x', '12345678', 'a1#']) V.password.push({ value: p, checks: d.passwordChecks(p), score: d.passwordScore(p) });
const TAX = {
  pe: ['20100070970', '20100070971', '10467793549', '30100070970', '2010007097'],
  ec: ['1790011674001', '1790011674000', '2590011674001', '3090011674001', '179001167400'],
  bo: ['1234567', '123456', '123456789012', '1234567890123'],
  co: ['900123456-8', '9001234568', '900123456-1', '800197268-4', '90012345-8'],
  cl: ['12345678-5', '12.345.678-5', '12345678-K', '7654321-6', '1-9', '11111111-1'],
  mx: ['XAXX010101000', 'GODE561231GR8', 'ABC991332AB1', 'abc010101ab1', 'ABCD0101011A', 'AB0101011AA'],
};
for (const [cc, values] of Object.entries(TAX)) for (const v of values) {
  const rule = d.TAX_ID_RULES[cc];
  V.taxId.push({ country: cc, value: v, valid: rule.isValid(v), normalized: rule.normalize(v) });
}
for (const [cc, values] of Object.entries({ co: ['9001234568', '900123456', '900-123'], cl: ['123456785', '12.345.678-5', '1234567k', '12345'], mx: ['gode561231gr8'] })) for (const v of values) V.taxId.push({ country: cc, value: v, valid: d.TAX_ID_RULES[cc].isValid(v), normalized: d.TAX_ID_RULES[cc].normalize(v) });
const base = { freq: 'daily', interval: 1, days: [], monthMode: 'day', end: 'never', until: null, count: 10, time: '09:00' };
const RULES = [
  [{ ...base }, '2026-03-05'], [{ ...base, interval: 3 }, '2026-03-05'], [{ ...base, freq: 'none' }, '2026-03-05'],
  [{ ...base, freq: 'weekly', days: [1, 3, 5] }, '2026-03-05'], [{ ...base, freq: 'weekly', days: [0], interval: 2 }, '2026-03-05'], [{ ...base, freq: 'weekly', days: [] }, '2026-03-05'],
  [{ ...base, freq: 'monthly' }, '2026-01-31'], [{ ...base, freq: 'monthly', monthMode: 'nth' }, '2026-03-09'], [{ ...base, freq: 'monthly', monthMode: 'nth', interval: 2 }, '2026-03-30'],
  [{ ...base, freq: 'yearly' }, '2024-02-29'], [{ ...base, freq: 'yearly', interval: 2 }, '2026-03-05'],
  [{ ...base, end: 'until', until: '2026-03-08' }, '2026-03-05'], [{ ...base, end: 'count', count: 3 }, '2026-03-05'],
];
for (const [rule, start] of RULES) V.recurrence.push({ rule, start, max: 8, out: d.occurrences(rule, start, 8), nth: d.nthOfMonth(start), invalid: d.recurInvalid(rule) });

// ---------- Importar y exportar: casos para el motor de importación masiva, CSV, XLSX y plantilla ----------
// El lector de Excel de la web usa DOMParser; aquí lo presta jsdom solo para sacar las salidas esperadas.
globalThis.DOMParser = new JSDOM('').window.DOMParser;
const b64 = (u8) => Buffer.from(u8).toString('base64');
const BULK_COLS = [
  { key: 'code', title: 'Código', type: 'code', required: true, maxLength: 12, help: 'Letras, números, punto, guion', example: 'A-001' },
  { key: 'name', title: 'Nombre', type: 'text', required: true, maxLength: 20, help: 'Nombre completo', example: 'Ana Pérez', aliases: ['Nombre completo', 'cliente'] },
  { key: 'qty', title: 'Cantidad', type: 'integer', min: 1, max: 100, help: 'Entre 1 y 100', example: 5 },
  { key: 'date', title: 'Fecha', type: 'date', help: 'dd/mm/aaaa', example: '2026-01-31' },
  { key: 'kind', title: 'Tipo', type: 'option', options: ['Físico', 'Digital'], help: 'Físico o Digital', example: 'Físico' },
  { key: 'email', title: 'Correo', type: 'email', maxLength: 30, help: 'Correo del contacto', example: 'ana@empresa.com' },
];
const HEAD = ['Código *', 'NOMBRE *', 'cantidad', 'Fecha', 'Tipo', 'Correo'];
const MATRICES = [
  { name: 'válida', matrix: [HEAD, ['A-001', 'Ana Pérez', '5', '31/01/2026', 'Físico', 'ANA@Empresa.com'], ['B.2', 'Luis', '5.0', '2026-02-28', 'digital', 'luis@x.co']] },
  { name: 'alias y sin acentos', matrix: [['codigo', 'Nombre completo', 'Cantidad'], ['X1', 'Eva', '3'], ['', '', ''], ['X2', 'Ola', '4']] },
  { name: 'filas vacías', matrix: [HEAD, [], ['', '  ', ''], ['C1', 'Uno', '1'], [], ['C2', 'Dos', '2']] },
  { name: 'errores de cada tipo', matrix: [HEAD, ['', 'Sin código'], ['_mal', 'Código malo'], ['A'.repeat(13), 'Código largo'], ['D1', ''], ['D2', 'N'.repeat(21)], ['D3', 'Ok', 'abc'], ['D4', 'Ok', '1.5'], ['D5', 'Ok', '0'], ['D6', 'Ok', '101'], ['D7', 'Ok', '1', '2026-02-30'], ['D8', 'Ok', '1', '31/13/2026'], ['D9', 'Ok', '1', '46000'], ['E1', 'Ok', '1', '99999'], ['E2', 'Ok', '1', '2026-01-01', 'Mixto'], ['E3', 'Ok', '1', '2026-01-01', 'FISICO'], ['E4', 'Ok', '1', '2026-01-01', 'Físico', 'no-es-correo'], ['E5', 'Ok', '1', '2026-01-01', 'Físico', 'a@b.co ' + 'x'.repeat(30) + '.com'], ['E6', 'Ok', '-3']] },
  { name: 'repetidas por código', keyFields: ['code'], matrix: [HEAD, ['K1', 'Uno'], ['k1', 'Otra con la misma'], ['K2', 'Dos'], ['K1', 'Tercera']] },
  { name: 'repetidas por código y tipo', keyFields: ['code', 'kind'], matrix: [HEAD, ['K1', 'Uno', '', '', 'Físico'], ['K1', 'Dos', '', '', 'Digital'], ['K1', 'Tres', '', '', 'físico']] },
  { name: 'archivo vacío', matrix: [] },
  { name: 'solo encabezado vacío', matrix: [['', ' ']] },
  { name: 'faltan columnas', matrix: [['Cantidad', 'Fecha'], ['1', '2026-01-01']] },
  { name: 'demasiadas filas', maxRows: 2, matrix: [HEAD, ['A', 'a'], ['B', 'b'], ['C', 'c']] },
  { name: 'en el límite', maxRows: 3, matrix: [HEAD, ['A', 'a'], [], ['B', 'b'], ['C', 'c']] },
  { name: 'celdas de más y de menos', matrix: [HEAD, ['Z1', 'Zeta', '7', '2026-12-31', 'Digital', 'z@z.co', 'sobra', 'más'], ['Z2']] },
];
for (const m of MATRICES) {
  const keyOf = m.keyFields ? (v) => m.keyFields.map((f) => String(v[f] ?? '')).join('|') : undefined;
  V.bulk.push({ name: m.name, columns: BULK_COLS, matrix: m.matrix, keyFields: m.keyFields ?? null, maxRows: m.maxRows ?? null, out: d.processMatrix(BULK_COLS, m.matrix, keyOf, m.maxRows) });
}
for (const s of ['2026-01-31', '2026-02-29', '2024-02-29', '31/01/2026', '1/2/2026', '01/02/2026', '31/02/2026', '00/01/2026', '45000', '45000.5', '19999', '90000', '89999', '20001', '', 'hoy', '2026-1-1', '2026/01/31', '1/1/26', '12345']) V.bulkDate.push({ s, out: d.parseBulkDate(s) });
for (const text of ['a,b,c\n1,2,3', 'a;b;c\n1;2;3', '﻿a,b\r\n1,2\r\n', 'a,b\n"x, y","z ""q"""\n', 'a,b\n"línea\nsalto",2', 'a,b\r\n1,2\r\n\r\n3,4', '  a , b  \n 1 , 2 ', 'a;b,c;d\n1;2', '', '\n', 'solo', 'a,b\n1,', ',\n,', '"a"\n"b"']) V.csvParse.push({ text, out: d.parseCsv(text) });
for (const rows of [[['a', 'b'], [1, 2.5]], [['x,y', 'q"r', 'l\ns']], [[null, undefined, '', 0]], [['ñandú', 'Pérez', '€']], [], [[]], [[1e21, -0.5, 1234567]]]) V.csvOut.push({ rows, out: d.toCsv(rows) });
for (const [title, ext, iso] of [['Ventas por día', 'xlsx', '2026-10-10'], ['  ¡Niños y Niñas!  ', 'csv', '2026-01-02'], ['', 'pdf', '2026-03-04'], ['---', 'csv', '2026-03-04'], ['Año Ñandú Ç', 'xlsx', '2026-05-06'], ['a'.repeat(80), 'csv', '2026-05-06'], ['Lote #02829 (final)', 'pdf', '2026-05-06']]) V.fileName.push({ title, ext, iso, out: d.exportFileName(title, ext, iso) });
const LABELS = { data: 'Datos', instructions: 'Instrucciones', column: 'Columna', required: 'Obligatoria', whatToWrite: 'Qué escribir', example: 'Ejemplo', yes: 'Sí', no: 'No' };
V.template.push({ columns: BULK_COLS, labels: LABELS, out: d.bulkTemplate(BULK_COLS, LABELS) });
const SHEETS = [
  { sheets: [{ name: 'Datos', rows: [['Nombre', 'Monto'], ['Ana', 10.5], ['Luis', -3], [null, '', 0]] }] },
  { sheets: [{ name: 'Con <&> "comillas"', rows: [['a & b', '<tag>', 'dice "hola"'], ['ñandú', 'tilde: é']] }, { name: 'Segunda hoja de un nombre muy largo de más de treinta y un caracteres', rows: [[1, 2, 3]] }] },
  { sheets: [{ name: 'Muchas columnas', rows: [Array.from({ length: 30 }, (_, i) => `c${i}`), Array.from({ length: 30 }, (_, i) => i)] }] },
  { sheets: [{ name: 'Vacía', rows: [] }] },
];
for (const x of SHEETS) {
  const bytes = d.toXlsxSheets(x.sheets);
  V.xlsxOut.push({ sheets: x.sheets, base64: b64(bytes), crc: d.crc32(bytes) });
  V.xlsxRead.push({ name: 'escrito por toXlsxSheets', base64: b64(bytes), out: d.readXlsx(bytes) });
}
// Un libro como el que guarda Excel: cadenas compartidas, celdas sueltas, booleanos y ZIP comprimido (método 8).
function zipDeflate(files) {
  const enc = new TextEncoder(); const parts = []; const central = []; let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name), raw = enc.encode(f.data), comp = deflateRawSync(raw), crc = d.crc32(raw);
    const local = Buffer.alloc(30 + name.length); local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8); local.writeUInt32LE(crc, 14); local.writeUInt32LE(comp.length, 18); local.writeUInt32LE(raw.length, 22); local.writeUInt16LE(name.length, 26); Buffer.from(name).copy(local, 30);
    const cen = Buffer.alloc(46 + name.length); cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6); cen.writeUInt16LE(8, 10); cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(comp.length, 20); cen.writeUInt32LE(raw.length, 24); cen.writeUInt16LE(name.length, 28); cen.writeUInt32LE(offset, 42); Buffer.from(name).copy(cen, 46);
    parts.push(local, comp); central.push(cen); offset += local.length + comp.length;
  }
  const cenSize = central.reduce((n, c) => n + c.length, 0); const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(cenSize, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, ...central, end]);
}
const XH = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const excelBook = zipDeflate([
  { name: 'xl/workbook.xml', data: XH + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Clientes" sheetId="1" r:id="rId1"/><sheet name="Vacía" sheetId="2" r:id="rId2"/></sheets></workbook>' },
  { name: 'xl/_rels/workbook.xml.rels', data: XH + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="x/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="x/worksheet" Target="/xl/worksheets/sheet2.xml"/></Relationships>' },
  { name: 'xl/sharedStrings.xml', data: XH + '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="5" uniqueCount="5"><si><t>Código</t></si><si><t>Nombre</t></si><si><r><t>Ana </t></r><r><t>Pérez</t></r></si><si><t xml:space="preserve">  con espacios  </t></si><si><t>Línea &amp; &lt;texto&gt;</t></si></sst>' },
  { name: 'xl/worksheets/sheet1.xml', data: XH + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="D1" t="inlineStr"><is><t>En línea</t></is></c></row><row r="2"><c r="A2"><v>1001</v></c><c r="B2" t="s"><v>2</v></c><c r="C2" t="b"><v>1</v></c><c r="D2"><v>45000.5</v></c></row><row r="4"><c r="B4" t="s"><v>3</v></c><c r="C4" t="b"><v>0</v></c><c r="AA4" t="s"><v>4</v></c></row><row r="5"><c r="A5"/></row></sheetData></worksheet>' },
  { name: 'xl/worksheets/sheet2.xml', data: XH + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData/></worksheet>' },
]);
V.xlsxRead.push({ name: 'como lo guarda Excel (comprimido, cadenas compartidas)', base64: b64(excelBook), out: d.readXlsx(excelBook) });
for (const [name, bytes] of [['no es un ZIP', new Uint8Array([1, 2, 3, 4])], ['vacío', new Uint8Array(0)], ['ZIP sin libro', d.zipStore([{ name: 'otro.txt', data: 'hola' }])]]) V.xlsxRead.push({ name, base64: b64(bytes), out: 'error' });
for (const x of V.xlsxRead) if (x.out === 'error') { let threw = false; try { d.readXlsx(Buffer.from(x.base64, 'base64')); } catch { threw = true; } if (!threw) throw new Error('se esperaba un error: ' + x.name); }

// ---------- Datos de dominio en Swift y Kotlin ----------
const sStr = (s) => JSON.stringify(s);
const machines = {
  giftcard: [d.GIFTCARD_TRANSITIONS, d.GIFTCARD_LOOK], settlement: [d.SETTLEMENT_TRANSITIONS, d.SETTLEMENT_LOOK], approval: [d.APPROVAL_TRANSITIONS, d.APPROVAL_LOOK],
  lot: [d.LOT_TRANSITIONS, d.LOT_LOOK], shipment: [d.SHIPMENT_TRANSITIONS, d.SHIPMENT_LOOK], transfer: [d.TRANSFER_TRANSITIONS, d.TRANSFER_LOOK],
};
const camel = (s) => s.replace(/[_-](\w)/g, (_, c) => c.toUpperCase());
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const swiftLit = (v) => (typeof v === 'string' ? sStr(v) : Array.isArray(v) ? `[${v.map(swiftLit).join(', ')}]` : v && typeof v === 'object' ? (Object.keys(v).length ? `[${Object.entries(v).map(([k, x]) => `${sStr(k)}: ${swiftLit(x)}`).join(', ')}]` : '[:]') : String(v));
const ktLit = (v) => (typeof v === 'string' ? sStr(v).replace(/\$/g, '\\$') : Array.isArray(v) ? `listOf(${v.map(ktLit).join(', ')})` : v && typeof v === 'object' ? `mapOf(${Object.entries(v).map(([k, x]) => `${sStr(k)} to ${ktLit(x)}`).join(', ')})` : String(v));
const taxRules = Object.fromEntries(Object.entries(d.TAX_ID_RULES).map(([k, r]) => [k, { maxLength: r.maxLength, inputMode: r.inputMode, allowed: r.allowed.source }]));

let sw = `// ${HEADER}\nimport Foundation\n\n`;
sw += `public struct ZCCountry: Sendable, Equatable { public let code, name, currency: String; public let decimals: Int; public let locale, taxId, taxIdHint: String; public let phoneDigits: Int; public let dial, timeZone: String }\n`;
sw += `public struct ZCDialCountry: Sendable, Equatable { public let code, name, dial: String; public let phoneDigits: Int }\n`;
sw += `public struct ZCStateLook: Sendable, Equatable { public let tone, icon, labelKey: String }\n`;
sw += `public struct ZCStateMachine: Sendable {\n    public let transitions: [String: [String]]\n    public let looks: [String: ZCStateLook]\n    public func canTransition(from: String, to: String) -> Bool { transitions[from]?.contains(to) ?? false }\n    public func next(from: String) -> [String] { transitions[from] ?? [] }\n}\n`;
sw += `public struct ZCTaxIdRule: Sendable { public let maxLength: Int; public let inputMode: String; public let allowed: String }\n\n`;
sw += `public enum ZCDomainData {\n    public static let countries: [ZCCountry] = [\n${d.COUNTRIES.map((c) => `        ZCCountry(code: ${sStr(c.code)}, name: ${sStr(c.name)}, currency: ${sStr(c.currency)}, decimals: ${c.decimals}, locale: ${sStr(c.locale)}, taxId: ${sStr(c.taxId)}, taxIdHint: ${sStr(c.taxIdHint)}, phoneDigits: ${c.phoneDigits}, dial: ${sStr(c.dial)}, timeZone: ${sStr(c.timeZone)}),`).join('\n')}\n    ]\n`;
sw += `    public static let dialCountries: [ZCDialCountry] = [\n${d.DIAL_COUNTRIES.map((c) => `        ZCDialCountry(code: ${sStr(c.code)}, name: ${sStr(c.name)}, dial: ${sStr(c.dial)}, phoneDigits: ${c.phoneDigits}),`).join('\n')}\n    ]\n`;
sw += `    public static let settlementObservable: [String] = ${swiftLit(d.SETTLEMENT_OBSERVABLE)}\n`;
for (const [name, [tr, look]] of Object.entries(machines)) sw += `    public static let ${name} = ZCStateMachine(transitions: ${swiftLit(tr)}, looks: [${Object.entries(look).map(([k, l]) => `${sStr(k)}: ZCStateLook(tone: ${sStr(l.tone)}, icon: ${sStr(l.icon)}, labelKey: ${sStr(l.labelKey)})`).join(', ')}])\n`;
sw += `    public static let taxIdRules: [String: ZCTaxIdRule] = [${Object.entries(taxRules).map(([k, r]) => `${sStr(k)}: ZCTaxIdRule(maxLength: ${r.maxLength}, inputMode: ${sStr(r.inputMode)}, allowed: ${sStr(r.allowed)})`).join(', ')}]\n`;
sw += `    public static let recurMaxInterval = ${d.RECUR_MAX_INTERVAL}\n    public static let recurMaxCount = ${d.RECUR_MAX_COUNT}\n}\n`;
write(`${OUT}/ios/Sources/ZonacardsTokens/Generated/ZCDomainData.swift`, sw);

let kt = `// ${HEADER}\npackage com.zonacards.ui.tokens\n\n`;
kt += `data class ZcCountry(val code: String, val name: String, val currency: String, val decimals: Int, val locale: String, val taxId: String, val taxIdHint: String, val phoneDigits: Int, val dial: String, val timeZone: String)\n`;
kt += `data class ZcDialCountry(val code: String, val name: String, val dial: String, val phoneDigits: Int)\n`;
kt += `data class ZcStateLook(val tone: String, val icon: String, val labelKey: String)\n`;
kt += `class ZcStateMachine(val transitions: Map<String, List<String>>, val looks: Map<String, ZcStateLook>) {\n    fun canTransition(from: String, to: String): Boolean = transitions[from]?.contains(to) ?: false\n    fun next(from: String): List<String> = transitions[from] ?: emptyList()\n}\n`;
kt += `data class ZcTaxIdRule(val maxLength: Int, val inputMode: String, val allowed: Regex)\n\n`;
kt += `object ZcDomainData {\n    val countries = listOf(\n${d.COUNTRIES.map((c) => `        ZcCountry(${[c.code, c.name, c.currency].map(sStr).join(', ')}, ${c.decimals}, ${[c.locale, c.taxId, c.taxIdHint].map(sStr).join(', ')}, ${c.phoneDigits}, ${sStr(c.dial)}, ${sStr(c.timeZone)}),`).join('\n')}\n    )\n`;
kt += `    val dialCountries = listOf(\n${d.DIAL_COUNTRIES.map((c) => `        ZcDialCountry(${sStr(c.code)}, ${sStr(c.name)}, ${sStr(c.dial)}, ${c.phoneDigits}),`).join('\n')}\n    )\n`;
kt += `    val settlementObservable = ${ktLit(d.SETTLEMENT_OBSERVABLE)}\n`;
for (const [name, [tr, look]] of Object.entries(machines)) kt += `    val ${name} = ZcStateMachine(${ktLit(tr)}, mapOf(${Object.entries(look).map(([k, l]) => `${sStr(k)} to ZcStateLook(${sStr(l.tone)}, ${sStr(l.icon)}, ${sStr(l.labelKey)})`).join(', ')}))\n`;
kt += `    val taxIdRules = mapOf(${Object.entries(taxRules).map(([k, r]) => `${sStr(k)} to ZcTaxIdRule(${r.maxLength}, ${sStr(r.inputMode)}, Regex(${sStr(r.allowed).replace(/\$/g, '\\$')}))`).join(', ')})\n`;
kt += `    const val RECUR_MAX_INTERVAL = ${d.RECUR_MAX_INTERVAL}\n    const val RECUR_MAX_COUNT = ${d.RECUR_MAX_COUNT}\n}\n`;
write(`${OUT}/android/zonacards-tokens/src/main/kotlin/com/zonacards/ui/tokens/generated/ZcDomainData.kt`, kt);

// La especificación viaja como recurso (la leen ZCLocaleSpec / ZcLocaleSpec); los casos, solo a las pruebas.
const specJson = JSON.stringify(spec, null, 1) + '\n';
const vectorsJson = JSON.stringify(V) + '\n';
write(`${OUT}/shared/domain-spec.json`, specJson);
write(`${OUT}/shared/domain-vectors.json`, vectorsJson);
// Paquete neutral: la especificación de idioma y los vectores (entrada → salida de la web) para probar implementaciones en otros stacks.
write(`projects/zonacards-tokens/conformance/domain-spec.json`, specJson);
write(`projects/zonacards-tokens/conformance/domain-vectors.json`, vectorsJson);
write(`${OUT}/ios/Sources/ZonacardsTokens/Resources/domain-spec.json`, specJson);
write(`${OUT}/android/zonacards-tokens/src/main/resources/zonacards/domain-spec.json`, specJson);
write(`${OUT}/android/zonacards-tokens/src/test/resources/zonacards/domain-vectors.json`, vectorsJson);
write(`${OUT}/ios/Tests/ZonacardsTokensTests/Resources/domain-vectors.json`, vectorsJson);
const total = Object.values(V).reduce((s, a) => s + a.length, 0);
console.log(`Dominio nativo: ${total} casos (${Object.entries(V).map(([k, a]) => `${k} ${a.length}`).join(', ')})`);
