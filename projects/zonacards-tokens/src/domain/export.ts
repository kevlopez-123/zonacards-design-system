/**
 * Exportación de datos tabulares sin librerías: CSV (UTF-8 con BOM, para que Excel respete tildes) y XLSX mínimo
 * (Office Open XML con cadenas en línea, empaquetado en un ZIP sin compresión).
 * Las cifras van sin formato (número puro) y las fechas en ISO 8601, como pide la sección 17 de las reglas.
 */
export type Cell = string | number | null | undefined;
export type Rows = readonly (readonly Cell[])[];

export function toCsv(rows: Rows): string {
  const esc = (v: Cell) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map(r => r.map(esc).join(',')).join('\r\n');
}

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const colName = (i: number) => { let s = ''; for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };

function sheetXml(rows: Rows): string {
  const body = rows.map((r, ri) => `<row r="${ri + 1}">` + r.map((v, ci) => {
    const ref = colName(ci) + (ri + 1);
    if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"><v>${v}</v></c>`;
    if (v === null || v === undefined || v === '') return '';
    return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xml(String(v))}</t></is></c>`;
  }).join('') + '</row>').join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
}

let crcTable: Uint32Array | null = null;
export function crc32(data: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
  }
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = crcTable[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** ZIP sin compresión (método 0): suficiente para un XLSX de pocas filas y sin dependencias. */
export function zipStore(files: readonly { name: string; data: string }[]): Uint8Array<ArrayBuffer> {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = []; const central: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name), data = enc.encode(f.data), crc = crc32(data);
    const local = new Uint8Array(30 + name.length); const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(8, 0, true);
    lv.setUint32(14, crc, true); lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true); lv.setUint16(26, name.length, true);
    local.set(name, 30);
    const cen = new Uint8Array(46 + name.length); const cv = new DataView(cen.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
    cv.setUint32(16, crc, true); cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true); cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true); cen.set(name, 46);
    parts.push(local, data); central.push(cen);
    offset += local.length + data.length;
  }
  const cenSize = central.reduce((s, c) => s + c.length, 0);
  const end = new Uint8Array(22); const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
  ev.setUint32(12, cenSize, true); ev.setUint32(16, offset, true);
  const all = [...parts, ...central, end];
  const out = new Uint8Array(all.reduce((s, p) => s + p.length, 0));
  let p = 0; for (const a of all) { out.set(a, p); p += a.length; }
  return out;
}

/** Una hoja de un libro de Excel: nombre (máx. 31 caracteres) y filas. */
export interface XlsxSheet { name: string; rows: Rows }

/** Libro de Excel con una o más hojas (Office Open XML con cadenas en línea, ZIP sin compresión). */
export function toXlsxSheets(sheets: readonly XlsxSheet[]): Uint8Array<ArrayBuffer> {
  const head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const types = head + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    + sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') + '</Types>';
  const book = head + `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${rel}"><sheets>`
    + sheets.map((sh, i) => `<sheet name="${xml(sh.name.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets></workbook>';
  const bookRels = head + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${rel}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') + '</Relationships>';
  return zipStore([
    { name: '[Content_Types].xml', data: types },
    { name: '_rels/.rels', data: head + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: 'xl/workbook.xml', data: book },
    { name: 'xl/_rels/workbook.xml.rels', data: bookRels },
    ...sheets.map((sh, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml(sh.rows) })),
  ]);
}

/** Libro de una sola hoja. */
export function toXlsx(rows: Rows, sheetName = 'Datos'): Uint8Array<ArrayBuffer> {
  return toXlsxSheets([{ name: sheetName, rows }]);
}

/** Caracteres fuera de Latin-1 que WinAnsiEncoding sí tiene (viñeta del enmascarado, guiones, comillas). */
const WIN_ANSI: Record<string, number> = { '•': 0x95, '–': 0x96, '—': 0x97, '…': 0x85, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '€': 0x80 };
function winAnsi(s: string): number[] {
  const out: number[] = [];
  for (const ch of s.normalize('NFC')) {
    const c = ch.codePointAt(0)!;
    const b = WIN_ANSI[ch] ?? (c < 256 ? c : 0x3f);
    if (b === 0x28 || b === 0x29 || b === 0x5c) out.push(0x5c); // ( ) \ se escapan
    out.push(b === 0xa0 || b === 0x202f ? 0x20 : b);
  }
  return out;
}

/**
 * PDF mínimo (sin librerías): título, subtítulo y una tabla de texto en A4 horizontal, paginada, Helvetica 8 pt.
 * Suficiente para un listado con los filtros aplicados; los documentos con diseño (vales, cobranza) van en backend.
 */
/** Anchos de Helvetica (por 1000 unidades, de espacio a «}») para medir texto y alinear columnas. */
const HELVETICA = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584,
  584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611,
  278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722,
  500, 500, 500, 334, 260, 334, 584,
];
/** Ancho en puntos de un texto a ese tamaño (la negrita se aproxima con un 6 % más). Las letras con tilde miden como su base. */
export function pdfTextWidth(text: string, size: number, bold = false): number {
  let u = 0;
  for (const ch of text) {
    const c = (ch.normalize('NFD')[0] ?? ch).charCodeAt(0);
    u += c >= 32 && c <= 126 ? (HELVETICA[c - 32] ?? 556) : 556;
  }
  return (u / 1000) * size * (bold ? 1.06 : 1);
}

export interface PdfOptions {
  title: string;
  subtitle?: string;
  /** Columnas alineadas a la derecha; si se omite, las que son todas números (o montos) se alinean solas. */
  rightAlign?: readonly number[];
  /** Líneas de resumen (indicadores de un reporte) que van sobre la tabla. */
  notes?: readonly string[];
  /** Texto pequeño bajo el título ("Generado el 20/11/2026 15:30"). */
  generated?: string;
}

export function toPdf(rows: Rows, o: PdfOptions): Uint8Array<ArrayBuffer> {
  const W = 842, H = 595, M = 36, FS = 8, LH = 13;
  const width = (s: string, bold = false) => pdfTextWidth(s, FS, bold);
  const text = rows.map(r => r.map(v => (v === null || v === undefined ? '' : String(v))));
  const cols = text[0]?.length ?? 0;
  const natural = Array.from({ length: cols }, (_, c) => Math.min(170, Math.max(...text.map((r, ri) => width(r[c] ?? '', ri === 0))) + 10));
  const scale = Math.min(1, (W - 2 * M) / natural.reduce((a, b) => a + b, 0));
  const colW = natural.map(w => w * scale);
  const fit = (s: string, w: number, bold = false) => { let t = s; while (t.length > 1 && width(t, bold) > w - 6) t = (t.endsWith('…') ? t.slice(0, -2) : t.slice(0, -1)) + '…'; return t; };
  // Número, porcentaje o monto con símbolo o código de moneda ("S/ 1,000.00", "USD 50", "$ 3.5").
  const isNum = (v: string) => /^([A-Za-z]{1,3}\/?\.?|[$€£])?\s?[-+]?[\d.,\s]+%?$/.test(v);
  const numeric = (c: number) => text.length > 1 && text.slice(1).every(r => (r[c] ?? '') === '' || isNum(r[c] ?? '')) && text.slice(1).some(r => (r[c] ?? '') !== '');
  const right = o.rightAlign ?? Array.from({ length: cols }, (_, c) => c).filter(numeric);
  const notes = o.notes ?? [];
  const perPage = Math.floor((H - 2 * M - 40) / LH) - 1 - notes.length;
  const body = text.slice(1);
  const pageCount = Math.max(1, Math.ceil(body.length / perPage));
  const pages: string[][] = [];
  for (let p = 0; p === 0 || p * perPage < body.length; p++) {
    const ops: string[] = [];
    const put = (x: number, y: number, s: string, size = FS, bold = false) => ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x.toFixed(1)} ${y.toFixed(1)} Td <${winAnsi(s).map(b => b.toString(16).padStart(2, '0')).join('')}> Tj ET`);
    let y = H - M;
    if (p === 0) {
      put(M, y - 6, o.title, 14, true);
      if (o.subtitle) put(M, y - 22, o.subtitle, 9);
      if (o.generated) put(W - M - pdfTextWidth(o.generated, 8), y - 6, o.generated, 8);
      y -= 40;
      for (const n of notes) { put(M, y, n, 9); y -= LH; }
    } else y -= 10;
    const row = (cells: string[], bold: boolean) => {
      let x = M;
      cells.forEach((c, i) => {
        const s = fit(c, colW[i], bold);
        put(right.includes(i) ? x + colW[i] - 6 - width(s, bold) : x, y, s, FS, bold);
        x += colW[i];
      });
      y -= LH;
    };
    row(text[0] ?? [], true);
    ops.push(`0.6 G ${M} ${(y + LH - 4).toFixed(1)} m ${W - M} ${(y + LH - 4).toFixed(1)} l S`);
    body.slice(p * perPage, (p + 1) * perPage).forEach(r => row(r, false));
    put(W - M - pdfTextWidth(`${p + 1} / ${pageCount}`, 8), M - 16, `${p + 1} / ${pageCount}`, 8);
    pages.push(ops);
  }
  const objs: string[] = [];
  const pageIds = pages.map((_, i) => 5 + i * 2);
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[2] = `<< /Type /Pages /Kids [${pageIds.map(i => `${i} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  pages.forEach((ops, i) => {
    const content = ops.join('\n');
    objs[pageIds[i]] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageIds[i] + 1} 0 R >>`;
    objs[pageIds[i] + 1] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let i = 1; i < objs.length; i++) { offsets[i] = pdf.length; pdf += `${i} 0 obj\n${objs[i]}\nendobj\n`; }
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + offsets.slice(1).map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  pdf += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  // Todo el contenido es ASCII (el texto va en hexadecimal), así que cada carácter es un byte.
  const out = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) out[i] = pdf.charCodeAt(i);
  return out;
}

/** Nombre de archivo seguro: minúsculas, sin tildes, con fecha ISO. "ventas-por-dia-2026-10-10.xlsx". */
export function exportFileName(title: string, ext: string, isoDate: string): string {
  const slug = title.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  return `${slug || 'datos'}-${isoDate}.${ext}`;
}

export function downloadBlob(data: BlobPart, type: string, fileName: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type }));
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 0);
}

export const MIME = { csv: 'text/csv;charset=utf-8', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', pdf: 'application/pdf' } as const;
