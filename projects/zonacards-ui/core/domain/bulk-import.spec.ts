import { BulkColumn, bulkTemplate, parseBulkDate, parseCsv, processMatrix } from './bulk-import';
import { toXlsxSheets } from './export';
import { inflateRaw } from './inflate';
import { InvalidWorkbookError, readXlsx, serialToDate } from './xlsx-read';

const bytes = (b64: string) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
const FIXED = 'i8rPS0xOLEopVogaZQ0CVlpmXmKOwuGNiXkph3cpPJozGQA=';
const DYNAMIC = '7dFbVkFhAMXxqRzklso1UeR+D5Hrofg4bsVR5FLT8GoSXns1k0ZiAAZg19pvv6e99lp/eaqKrpgpc0mmANQfqWIs7XdCVfY/0u92c/pLFAP9ITEQuBgIXAwELgYCFwOBi4HAxUDgYiBwMRC4GAhcDAQuBgIXA4GLgcDFQOBiIHAxELgYCFwMBC4GAhcDgYuBwMVA4GIgcDEQuBgIXAwErqNAGpPV7Y9mivX2QF1ozbab+9jDkyyG06Xu3O4JxLOlRmf0vjqzOLzBRK7c7L5+rPUXzttQMl95Vt5mX4ZL11049Vh96Y3n38ara18kXai1+pPP/7d8AA==';

describe('Descompresión DEFLATE', () => {
  const base = 'Zonacards '.repeat(40) + 'final ñandú ✓';
  it('bloque de código fijo', () => {
    expect(new TextDecoder().decode(inflateRaw(bytes(FIXED)))).toBe(base);
  });
  it('bloque de código dinámico', () => {
    const text = base.repeat(30) + Array.from({ length: 300 }, (_, i) => String.fromCharCode(33 + (i * 7) % 90)).join('');
    expect(new TextDecoder().decode(inflateRaw(bytes(DYNAMIC)))).toBe(text);
  });
  it('datos dañados lanzan error', () => {
    expect(() => inflateRaw(new Uint8Array([0xff, 0xff, 0xff]))).toThrow();
  });
});

describe('Lector de Excel', () => {
  it('lee de vuelta lo que escribe toXlsxSheets (varias hojas, números, tildes y celdas vacías)', () => {
    const book = toXlsxSheets([
      { name: 'Datos', rows: [['Nombre', 'Monto'], ['Ñandú', 12.5], ['', 3]] },
      { name: 'Notas', rows: [['uno']] },
    ]);
    const sheets = readXlsx(book);
    expect(sheets.map(s => s.name)).toEqual(['Datos', 'Notas']);
    expect(sheets[0].rows).toEqual([['Nombre', 'Monto'], ['Ñandú', '12.5'], ['', '3']]);
    expect(sheets[1].rows).toEqual([['uno']]);
  });
  it('un archivo que no es Excel lanza InvalidWorkbookError', () => {
    expect(() => readXlsx(new Uint8Array([1, 2, 3, 4]))).toThrowError(InvalidWorkbookError);
  });
  it('fecha de un número de serie de Excel', () => {
    expect(serialToDate(46000)).toBe('2025-12-09');
  });
});

const COLS: BulkColumn[] = [
  { key: 'email', title: 'Correo', type: 'email', required: true, help: 'Correo del destinatario', example: 'ana@empresa.com', aliases: ['mail'] },
  { key: 'amount', title: 'Monto', type: 'integer', required: true, min: 10, max: 5000, help: 'Entero entre 10 y 5000', example: 100 },
  { key: 'date', title: 'Vence', type: 'date', help: 'AAAA-MM-DD', example: '2026-12-31' },
  { key: 'kind', title: 'Tipo', type: 'option', options: ['Regalo', 'Beneficio'], help: 'Regalo o Beneficio', example: 'Regalo' },
];

describe('Importación masiva: validación fila por fila', () => {
  const m = (...rows: string[][]) => [['Correo *', 'Monto', 'Vence', 'Tipo'], ...rows];

  it('convierte los valores y reconoce encabezados sin tildes, con * y por alias', () => {
    const r = processMatrix(COLS, [['MAIL', 'monto *', 'vence', 'tipo'], ['ANA@Empresa.com', '100', '31/12/2026', 'regalo']]);
    expect(r.fileError).toBeUndefined();
    expect(r.rows).toEqual([{ row: 2, values: { email: 'ana@empresa.com', amount: 100, date: '2026-12-31', kind: 'Regalo' } }]);
  });

  it('una fila mala no frena a las demás y el error dice cuál y dónde', () => {
    const r = processMatrix(COLS, m(['ana@empresa.com', '100'], ['sin-arroba', '100'], ['luis@empresa.com', '5'], ['', '100'], ['a@b.co', '10', '2026-02-30']));
    expect(r.rows.map(x => x.error?.code)).toEqual([undefined, 'email', 'min', 'required', 'date']);
    expect(r.rows[2].error).toMatchObject({ field: 'amount', params: { title: 'Monto', min: 10 } });
    expect(r.rows[1].row).toBe(3);
  });

  it('ignora filas vacías y rechaza llaves repetidas a partir de la segunda', () => {
    const r = processMatrix(COLS, m(['ana@empresa.com', '100'], [], ['', '', '', ''], ['ANA@empresa.com', '200']), v => String(v['email']));
    expect(r.rows.map(x => x.row)).toEqual([2, 5]);
    expect(r.rows[1].error).toEqual({ code: 'duplicate', params: { row: 2 } });
  });

  it('errores del archivo: vacío, columnas que faltan y demasiadas filas', () => {
    expect(processMatrix(COLS, []).fileError?.code).toBe('emptyFile');
    expect(processMatrix(COLS, [['Correo']]).fileError).toEqual({ code: 'missingColumns', params: { list: 'Monto' } });
    expect(processMatrix(COLS, m(['a@b.co', '10'], ['c@d.co', '10']), undefined, 1).fileError).toEqual({ code: 'tooManyRows', params: { max: 1, n: 2 } });
  });

  it('opción con otra tilde o mayúscula se normaliza; una inválida lista las permitidas', () => {
    expect(processMatrix(COLS, m(['a@b.co', '10', '', 'BENEFICIO'])).rows[0].values['kind']).toBe('Beneficio');
    expect(processMatrix(COLS, m(['a@b.co', '10', '', 'otro'])).rows[0].error).toMatchObject({ code: 'option', params: { list: 'Regalo, Beneficio' } });
  });

  it('fechas de tres formas', () => {
    expect(parseBulkDate('2026-10-05')).toBe('2026-10-05');
    expect(parseBulkDate('5/10/2026')).toBe('2026-10-05');
    expect(parseBulkDate('46000')).toBe('2025-12-09');
    expect(parseBulkDate('31/02/2026')).toBeNull();
  });

  it('la plantilla trae una hoja de datos y otra de instrucciones que se pueden leer de vuelta', () => {
    const labels = { data: 'Datos', instructions: 'Instrucciones', column: 'Columna', required: 'Obligatoria', whatToWrite: 'Qué escribir', example: 'Ejemplo', yes: 'Sí', no: 'No' };
    const sheets = readXlsx(toXlsxSheets(bulkTemplate(COLS, labels)));
    expect(sheets[0].rows[0]).toEqual(['Correo *', 'Monto *', 'Vence', 'Tipo']);
    expect(sheets[0].rows[1]).toEqual(['ana@empresa.com', '100', '2026-12-31', 'Regalo']);
    expect(sheets[1].rows[1]).toEqual(['Correo', 'Sí', 'Correo del destinatario', 'ana@empresa.com']);
    // La plantilla vuelve a procesarse sin errores.
    expect(processMatrix(COLS, sheets[0].rows).rows.every(r => !r.error)).toBe(true);
  });
});

describe('CSV', () => {
  it('comillas, comas dentro de un campo, comillas dobles, BOM y fin de línea de Windows', () => {
    expect(parseCsv('﻿a,b\r\n"x, y","di ""hola"""\r\n')).toEqual([['a', 'b'], ['x, y', 'di "hola"']]);
  });
  it('detecta el punto y coma de Excel en español', () => {
    expect(parseCsv('Correo;Monto\nana@x.com;10')).toEqual([['Correo', 'Monto'], ['ana@x.com', '10']]);
  });
});
