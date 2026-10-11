import { describe, expect, it } from 'vitest';
import { addDays, addMonths, daysInRange, endOfMonth, formatDmy, isValidHm, maskDmy, maskHm, monthGrid, parseDmy, startOfWeek, timeSlots, todayIso } from './dates';
import { formatPhone, isValidPhone, phoneDigits } from './phone';
import { isValidNitCo, isValidRfcMx, isValidRucEc, isValidRucPe, isValidRutCl, nitCheckDigit, rutCheckDigit, TAX_ID_RULES } from './tax-id';

describe('identificador tributario', () => {
  it('Perú · RUC con verificador módulo 11', () => {
    expect(isValidRucPe('20100047218')).toBe(true);
    expect(isValidRucPe('20100047219')).toBe(false);
    expect(isValidRucPe('2010004721')).toBe(false);
    expect(isValidRucPe('30100047218')).toBe(false);
  });
  it('Ecuador · RUC de 13 dígitos con provincia y establecimiento', () => {
    expect(isValidRucEc('1790010937001')).toBe(true);
    expect(isValidRucEc('9990010937001')).toBe(false);
    expect(isValidRucEc('1790010937000')).toBe(false);
  });
  it('Colombia · NIT con dígito de la DIAN, con o sin guion', () => {
    expect(nitCheckDigit('890903938')).toBe(8);
    expect(isValidNitCo('890903938-8')).toBe(true);
    expect(isValidNitCo('8909039388')).toBe(true);
    expect(isValidNitCo('890903938-7')).toBe(false);
    expect(TAX_ID_RULES.co.normalize('8909039388')).toBe('890903938-8');
  });
  it('Chile · RUT con verificador 0–9 o K', () => {
    const dv = rutCheckDigit('12345678');
    expect(dv).toBe('5');
    expect(isValidRutCl('12.345.678-5')).toBe(true);
    expect(isValidRutCl('12345678-4')).toBe(false);
    expect(TAX_ID_RULES.cl.normalize('123456785')).toBe('12345678-5');
  });
  it('México · RFC de persona moral y física', () => {
    expect(isValidRfcMx('BIM011108DJ5')).toBe(true);
    expect(isValidRfcMx('GODE561231GR8')).toBe(true);
    expect(isValidRfcMx('GODE561331GR8')).toBe(false);
  });
  it('Bolivia · NIT de 7 a 12 dígitos', () => {
    expect(TAX_ID_RULES.bo.isValid('1020703023')).toBe(true);
    expect(TAX_ID_RULES.bo.isValid('123456')).toBe(false);
  });
});

describe('teléfono', () => {
  it('agrupa de a 3 y respeta el largo del país', () => {
    expect(formatPhone('987654321')).toBe('987 654 321');
    expect(phoneDigits('98a7-654 3219999', 'pe')).toBe('987654321');
    expect(isValidPhone('pe', '987654321')).toBe(true);
    expect(isValidPhone('co', '987654321')).toBe(false);
    expect(isValidPhone('br', '11987654321')).toBe(true);
  });
});

describe('fechas de calendario', () => {
  it('hoy según la zona horaria del país, no la del navegador', () => {
    const late = new Date('2026-03-02T03:30:00Z'); // 1 de marzo, 22:30 en Lima
    expect(todayIso('America/Lima', late)).toBe('2026-03-01');
    expect(todayIso('UTC', late)).toBe('2026-03-02');
  });
  it('aritmética sin saltos por zona horaria', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-01');
    expect(endOfMonth('2028-02-10')).toBe('2028-02-29');
    expect(startOfWeek('2026-03-01')).toBe('2026-02-23');
    expect(daysInRange('2026-03-01', '2026-03-30')).toBe(30);
  });
  it('la grilla del mes empieza en lunes y tiene 6 semanas', () => {
    const g = monthGrid('2026-03-01');
    expect(g).toHaveLength(42);
    expect(g[0]).toBe('2026-02-23');
    expect(g).toContain('2026-03-31');
  });
  it('máscara y lectura de dd/mm/aaaa', () => {
    expect(maskDmy('01032026')).toBe('01/03/2026');
    expect(maskDmy('0103')).toBe('01/03');
    expect(parseDmy('01/03/2026')).toBe('2026-03-01');
    expect(parseDmy('31/02/2026')).toBeNull();
    expect(parseDmy('1/3/2026')).toBeNull();
    expect(formatDmy('2026-03-01')).toBe('01/03/2026');
  });
  it('hora de 24 h y franjas de 30 minutos', () => {
    expect(maskHm('1430')).toBe('14:30');
    expect(isValidHm('14:30')).toBe(true);
    expect(isValidHm('24:00')).toBe(false);
    expect(timeSlots('09:00', '10:30')).toEqual(['09:00', '09:30', '10:00', '10:30']);
  });
});
