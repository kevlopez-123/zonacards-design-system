import { inflateRaw } from './inflate';

/**
 * Lector de libros de Excel (.xlsx) sin dependencias: abre el ZIP, descomprime (síncrono, `inflate.ts`) y devuelve cada hoja como una
 * matriz de textos. No evalúa fórmulas: lee el último valor guardado. Lo usa la importación masiva (`zc-bulk-import`).
 * Adaptado del lector de Enjoy Beneficios.
 */
export interface SheetRead {
  name: string;
  /** Filas con todas las columnas como texto (vacío si la celda no tiene valor). */
  rows: string[][];
}

/** El archivo no es un ZIP o un XLSX legible. */
export class InvalidWorkbookError extends Error {}

interface ZipEntry { name: string; method: number; compressed: number; offset: number }

const utf8 = /* @__PURE__ */ new TextDecoder('utf-8');
const view = (buf: Uint8Array) => new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

/** Entradas del directorio central del ZIP. */
function zipEntries(buf: Uint8Array): Map<string, ZipEntry> {
  const d = view(buf);
  let end = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (d.getUint32(i, true) === 0x06054b50) { end = i; break; }
  }
  if (end < 0) throw new InvalidWorkbookError('zip');
  const total = d.getUint16(end + 10, true);
  let o = d.getUint32(end + 16, true);
  const map = new Map<string, ZipEntry>();
  for (let n = 0; n < total; n++) {
    if (o + 46 > buf.length || d.getUint32(o, true) !== 0x02014b50) throw new InvalidWorkbookError('zip');
    const method = d.getUint16(o + 10, true);
    const compressed = d.getUint32(o + 20, true);
    const nameLen = d.getUint16(o + 28, true);
    const extraLen = d.getUint16(o + 30, true);
    const commentLen = d.getUint16(o + 32, true);
    const offset = d.getUint32(o + 42, true);
    const name = utf8.decode(buf.subarray(o + 46, o + 46 + nameLen));
    map.set(name, { name, method, compressed, offset });
    o += 46 + nameLen + extraLen + commentLen;
  }
  return map;
}

function entryBytes(buf: Uint8Array, e: ZipEntry): Uint8Array {
  const d = view(buf);
  if (d.getUint32(e.offset, true) !== 0x04034b50) throw new InvalidWorkbookError('zip');
  const start = e.offset + 30 + d.getUint16(e.offset + 26, true) + d.getUint16(e.offset + 28, true);
  const data = buf.subarray(start, start + e.compressed);
  if (e.method === 0) return data;
  if (e.method !== 8) throw new InvalidWorkbookError('zip');
  try { return inflateRaw(data); } catch { throw new InvalidWorkbookError('zip'); }
}

const xmlDoc = (s: string) => new DOMParser().parseFromString(s, 'application/xml');
const tags = (el: Element, name: string) => Array.from(el.getElementsByTagName(name));

/** Índice de columna (0 = A) de una referencia de celda («C12»). */
export function columnIndex(ref: string): number {
  let n = 0;
  for (const ch of ref) {
    const c = ch.charCodeAt(0);
    if (c < 65 || c > 90) break;
    n = n * 26 + (c - 64);
  }
  return n - 1;
}

/** Lee todas las hojas del libro. Lanza `InvalidWorkbookError` si el archivo no es un Excel válido. */
export function readXlsx(data: ArrayBuffer | Uint8Array): SheetRead[] {
  const buf = data instanceof Uint8Array ? data : new Uint8Array(data);
  const entries = zipEntries(buf);
  const text = (path: string) => { const e = entries.get(path); return e ? utf8.decode(entryBytes(buf, e)) : ''; };
  const book = text('xl/workbook.xml');
  if (!book) throw new InvalidWorkbookError('xlsx');
  const target = new Map<string, string>();
  const rels = text('xl/_rels/workbook.xml.rels');
  if (rels) for (const r of tags(xmlDoc(rels).documentElement, 'Relationship')) target.set(r.getAttribute('Id') ?? '', (r.getAttribute('Target') ?? '').replace(/^\/?(xl\/)?/, 'xl/'));
  const shared: string[] = [];
  const ss = text('xl/sharedStrings.xml');
  if (ss) for (const si of tags(xmlDoc(ss).documentElement, 'si')) shared.push(tags(si, 't').map(t => t.textContent ?? '').join(''));

  const sheets: SheetRead[] = [];
  for (const s of tags(xmlDoc(book).documentElement, 'sheet')) {
    const rid = s.getAttribute('r:id') ?? s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') ?? '';
    const path = target.get(rid);
    const body = path ? text(path) : '';
    if (!body) continue;
    const rows: string[][] = [];
    for (const row of tags(xmlDoc(body).documentElement, 'row')) {
      const r = Number(row.getAttribute('r') ?? rows.length + 1) - 1;
      const cells: string[] = [];
      for (const c of tags(row, 'c')) {
        const col = columnIndex(c.getAttribute('r') ?? '');
        if (col < 0) continue;
        const type = c.getAttribute('t');
        const v = c.getElementsByTagName('v')[0]?.textContent ?? '';
        let value = v;
        if (type === 's') value = shared[Number(v)] ?? '';
        else if (type === 'inlineStr') value = tags(c, 't').map(t => t.textContent ?? '').join('');
        else if (type === 'b') value = v === '1' ? 'VERDADERO' : 'FALSO';
        cells[col] = value.trim();
      }
      for (let i = 0; i < cells.length; i++) cells[i] ??= '';
      while (cells.length && cells[cells.length - 1] === '') cells.pop();
      rows[r] = cells;
    }
    for (let i = 0; i < rows.length; i++) rows[i] ??= [];
    sheets.push({ name: s.getAttribute('name') ?? `Hoja ${sheets.length + 1}`, rows });
  }
  if (!sheets.length) throw new InvalidWorkbookError('xlsx');
  return sheets;
}

/** Fecha de un número de serie de Excel (días desde 1899-12-30) en formato AAAA-MM-DD. */
export function serialToDate(n: number): string {
  return new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 86400000).toISOString().slice(0, 10);
}
