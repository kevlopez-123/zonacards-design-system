import type { XlsxSheet } from './export';
import { serialToDate } from './xlsx-read';

/**
 * Motor de las importaciones masivas: convierte las filas de una hoja en valores validados, fila por fila, sin que una fila mala frene
 * a las demás. Es puro (sin Angular ni red). Adaptado del de Enjoy Beneficios; los errores salen como códigos con parámetros y se
 * traducen al dibujar (`mol.importar.err.<código>`).
 *
 * Reglas: la primera fila es el encabezado (se reconoce sin tildes, sin «*» y sin importar mayúsculas); las filas totalmente vacías se
 * ignoran; las columnas obligatorias deben venir con dato; una llave (`keyOf`) repetida se rechaza a partir de la segunda.
 */
export type BulkColumnType = 'text' | 'code' | 'integer' | 'date' | 'option' | 'email';

export interface BulkColumn {
  key: string;
  title: string;
  type: BulkColumnType;
  required?: boolean;
  /** Máximo de caracteres. */
  maxLength?: number;
  min?: number;
  max?: number;
  /** Valores permitidos (tipo `option`). */
  options?: string[];
  /** Qué escribir (va en la hoja de instrucciones de la plantilla). */
  help: string;
  example: string | number;
  /** Otros nombres con los que se reconoce el encabezado. */
  aliases?: string[];
}

export type BulkValues = Record<string, string | number>;

/** Códigos de error de una fila o del archivo; los parámetros completan el texto traducido. */
export type BulkErrorCode = 'required' | 'maxLength' | 'code' | 'integer' | 'min' | 'max' | 'date' | 'option' | 'email' | 'duplicate'
  | 'emptyFile' | 'missingColumns' | 'tooManyRows' | 'invalidFile';

export interface BulkError { code: BulkErrorCode; field?: string; params?: Record<string, string | number> }

export interface BulkRow {
  /** Número de fila en el archivo (2 = primera fila de datos). */
  row: number;
  /** Valores convertidos; solo las columnas con dato. */
  values: BulkValues;
  /** Primer error de la fila. */
  error?: BulkError;
}

export interface BulkResult {
  rows: BulkRow[];
  /** El archivo no se puede procesar (faltan columnas, está vacío…). */
  fileError?: BulkError;
}

export const stripAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
/** Encabezado normalizado: sin tildes, sin «*», en minúsculas. */
export const normalizeHeader = (s: string) => stripAccents(s.replace(/\*/g, ''));

type Conversion = { ok: true; value: string | number } | { ok: false; error: BulkError };
const good = (value: string | number): Conversion => ({ ok: true, value });
const bad = (c: BulkColumn, code: BulkErrorCode, params: Record<string, string | number> = {}): Conversion => ({ ok: false, error: { code, field: c.key, params: { title: c.title, ...params } } });

/** Fecha AAAA-MM-DD, dd/mm/aaaa o número de serie de Excel → «AAAA-MM-DD» (o `null`). */
export function parseBulkDate(s: string): string | null {
  let iso: string;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) iso = s;
  else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [d = '', m = '', a = ''] = s.split('/');
    iso = `${a}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  } else if (/^\d{5}(\.\d+)?$/.test(s) && +s > 20000 && +s < 90000) iso = serialToDate(+s);
  else return null;
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso ? null : iso;
}

function convert(c: BulkColumn, raw: string): Conversion {
  const s = raw.trim();
  const tooLong = (t: string) => (c.maxLength !== undefined && t.length > c.maxLength ? bad(c, 'maxLength', { max: c.maxLength, len: t.length }) : null);
  switch (c.type) {
    case 'text': return tooLong(s) ?? good(s);
    case 'code':
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(s)) return bad(c, 'code');
      return tooLong(s) ?? good(s);
    case 'integer': {
      if (!/^-?\d+(\.0+)?$/.test(s)) return bad(c, 'integer');
      const n = Number(s.replace(/\.0+$/, ''));
      if (c.min !== undefined && n < c.min) return bad(c, 'min', { min: c.min });
      if (c.max !== undefined && n > c.max) return bad(c, 'max', { max: c.max });
      return good(n);
    }
    case 'date': { const f = parseBulkDate(s); return f ? good(f) : bad(c, 'date'); }
    case 'option': {
      const found = (c.options ?? []).find(o => stripAccents(o) === stripAccents(s));
      return found ? good(found) : bad(c, 'option', { list: (c.options ?? []).join(', ') });
    }
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return bad(c, 'email');
      return tooLong(s) ?? good(s.toLowerCase());
  }
}

/** Procesa la matriz de una hoja. `keyOf` arma la llave que identifica cada fila (las repetidas se rechazan desde la segunda). */
export function processMatrix(columns: BulkColumn[], matrix: string[][], keyOf?: (v: BulkValues) => string, maxRows?: number): BulkResult {
  const [header, ...data] = matrix;
  if (!header?.some(c => (c ?? '').trim())) return { rows: [], fileError: { code: 'emptyFile' } };
  const normal = header.map(h => normalizeHeader(h ?? ''));
  const index = columns.map(c => normal.findIndex(h => h === normalizeHeader(c.title) || h === normalizeHeader(c.key) || (c.aliases ?? []).some(a => normalizeHeader(a) === h)));
  const missing = columns.filter((c, i) => index[i] === -1 && c.required).map(c => c.title);
  if (missing.length) return { rows: [], fileError: { code: 'missingColumns', params: { list: missing.join(', ') } } };
  const filled = data.filter(cells => cells?.some(c => (c ?? '').trim()));
  if (maxRows !== undefined && filled.length > maxRows) return { rows: [], fileError: { code: 'tooManyRows', params: { max: maxRows, n: filled.length } } };

  const seen = new Map<string, number>();
  const rows: BulkRow[] = [];
  data.forEach((cells, k) => {
    if (!cells?.some(c => (c ?? '').trim())) return;
    const row = k + 2;
    const values: BulkValues = {};
    let error: BulkError | undefined;
    columns.forEach((c, i) => {
      if (error) return;
      const pos = index[i] ?? -1;
      const rawValue = pos >= 0 ? (cells[pos] ?? '').trim() : '';
      if (!rawValue) { if (c.required) error = { code: 'required', field: c.key, params: { title: c.title } }; return; }
      const r = convert(c, rawValue);
      if (r.ok) values[c.key] = r.value; else error = r.error;
    });
    if (!error && keyOf) {
      const key = keyOf(values).toLowerCase();
      const previous = seen.get(key);
      if (previous) error = { code: 'duplicate', params: { row: previous } };
      else seen.set(key, row);
    }
    rows.push({ row, values, ...(error ? { error } : {}) });
  });
  return { rows };
}

/** Texto simple de un CSV (comillas dobles, coma o punto y coma como separador, BOM) → matriz de textos. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const sep = (src.split(/\r?\n/, 1)[0] ?? '').split(';').length > (src.split(/\r?\n/, 1)[0] ?? '').split(',').length ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [], cur = '', quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') { if (src[i + 1] === '"') { cur += '"'; i++; } else quoted = false; } else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) { row.push(cur.trim()); cur = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && src[i + 1] === '\n') i++; row.push(cur.trim()); rows.push(row); row = []; cur = ''; }
    else cur += ch;
  }
  if (cur !== '' || row.length) { row.push(cur.trim()); rows.push(row); }
  return rows;
}

/** Rótulos de la plantilla (ya traducidos por quien la pide). */
export interface BulkTemplateLabels { data: string; instructions: string; column: string; required: string; whatToWrite: string; example: string; yes: string; no: string }

/**
 * Plantilla descargable: hoja «Datos» (encabezados, con «*» en los obligatorios, y una fila de ejemplo) y hoja de instrucciones con qué
 * escribir en cada columna. Se escribe con `toXlsxSheets`.
 */
export function bulkTemplate(columns: readonly BulkColumn[], l: BulkTemplateLabels): XlsxSheet[] {
  return [
    { name: l.data, rows: [columns.map(c => c.title + (c.required ? ' *' : '')), columns.map(c => c.example)] },
    { name: l.instructions, rows: [[l.column, l.required, l.whatToWrite, l.example], ...columns.map(c => [c.title, c.required ? l.yes : l.no, c.help, c.example])] },
  ];
}
