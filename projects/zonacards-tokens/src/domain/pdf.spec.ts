import { pdfTextWidth, toPdf } from './export';

const asText = (b: Uint8Array) => String.fromCharCode(...b);
const hex = (s: string) => Array.from(s).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');

describe('PDF: medición con las métricas de Helvetica', () => {
  it('las letras angostas miden menos que las anchas y la negrita más', () => {
    expect(pdfTextWidth('iii', 10)).toBeLessThan(pdfTextWidth('WWW', 10));
    expect(pdfTextWidth('Total', 10, true)).toBeGreaterThan(pdfTextWidth('Total', 10));
  });
  it('una letra con tilde mide como su base y el tamaño escala', () => {
    expect(pdfTextWidth('é', 8)).toBe(pdfTextWidth('e', 8));
    expect(pdfTextWidth('Día', 20)).toBeCloseTo(pdfTextWidth('Día', 10) * 2, 6);
  });
});

describe('PDF: tabla', () => {
  const rows = [['Lote', 'Monto'], ['Navidad', 'S/ 1,000.00'], ['Día del Padre', 'S/ 250.50']];

  it('numera "página / total", lleva el resumen y la fecha de generación', () => {
    const t = asText(toPdf(rows, { title: 'Lotes', notes: ['Total emitido: S/ 1,250.50'], generated: 'Generado el 20/11/2026' }));
    expect(t).toContain('/Count 1');
    expect(t).toContain(hex('1 / 1'));
    expect(t).toContain(hex('Total emitido: S/ 1,250.50'));
    expect(t).toContain(hex('Generado el 20/11/2026'));
  });

  it('alinea sola a la derecha la columna de montos: su texto empieza más a la derecha que con la alineación izquierda', () => {
    const x = (t: string) => Number(new RegExp('([\\d.]+) [\\d.]+ Td <' + hex('S/ 250.50') + '>').exec(t)?.[1]);
    const auto = asText(toPdf(rows, { title: 'A' }));
    const left = asText(toPdf(rows, { title: 'A', rightAlign: [] }));
    expect(x(auto)).toBeGreaterThan(x(left));
  });

  it('un texto largo se recorta con puntos suspensivos (0x85 en WinAnsi)', () => {
    const t = asText(toPdf([['Nombre'], ['x'.repeat(400)]], { title: 'A' }));
    expect(t).toContain('85>');
  });
});
