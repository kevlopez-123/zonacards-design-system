import { describe, expect, it } from 'vitest';
import { contrastLevel, contrastRatio, hexToHsv, hsvToHex, normalizeHexInput } from './color';
import { RecurRule, occurrences, recurInvalid, sortWeekdays } from './recurrence';

const base: RecurRule = { freq: 'weekly', interval: 1, days: [1, 4], monthMode: 'day', end: 'never', until: null, count: 10, time: '09:00' };

describe('recurrencia', () => {
  it('semanal: lunes y jueves desde un domingo', () => {
    expect(occurrences(base, '2026-10-11', 4)).toEqual(['2026-10-12', '2026-10-15', '2026-10-19', '2026-10-22']);
  });
  it('cada 2 semanas salta la semana intermedia', () => {
    expect(occurrences({ ...base, interval: 2, days: [1] }, '2026-10-12', 3)).toEqual(['2026-10-12', '2026-10-26', '2026-11-09']);
  });
  it('mensual por día y por n-ésimo día de la semana', () => {
    expect(occurrences({ ...base, freq: 'monthly' }, '2026-10-11', 3)).toEqual(['2026-10-11', '2026-11-11', '2026-12-11']);
    // 11 de octubre de 2026 es el segundo domingo
    expect(occurrences({ ...base, freq: 'monthly', monthMode: 'nth' }, '2026-10-11', 3)).toEqual(['2026-10-11', '2026-11-08', '2026-12-13']);
  });
  it('fin por fecha y por número de veces', () => {
    expect(occurrences({ ...base, freq: 'daily', end: 'until', until: '2026-10-13' }, '2026-10-11', 10)).toEqual(['2026-10-11', '2026-10-12', '2026-10-13']);
    expect(occurrences({ ...base, freq: 'daily', end: 'count', count: 2 }, '2026-10-11', 10)).toHaveLength(2);
  });
  it('anual y sin repetición', () => {
    expect(occurrences({ ...base, freq: 'yearly' }, '2026-10-11', 2)).toEqual(['2026-10-11', '2027-10-11']);
    expect(occurrences({ ...base, freq: 'none' }, '2026-10-11', 4)).toEqual(['2026-10-11']);
  });
  it('semanal sin días es inválida y no produce fechas', () => {
    const r = { ...base, days: [] };
    expect(recurInvalid(r)).toBe('days');
    expect(occurrences(r, '2026-10-11', 4)).toEqual([]);
    expect(sortWeekdays([0, 4, 1])).toEqual([1, 4, 0]);
  });
});

describe('color', () => {
  it('contraste WCAG y nivel', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
    expect(contrastRatio('#E4572E', '#FFFFFF')).toBeCloseTo(3.7, 1);
    expect(contrastLevel(3.7)).toBe('large');
    expect(contrastLevel(14.5)).toBe('aa');
  });
  it('ida y vuelta HSV sin perder el color', () => {
    expect(hsvToHex(...hexToHsv('#0F766E'))).toBe('#0F766E');
  });
  it('normaliza lo escrito', () => {
    expect(normalizeHexInput('e4572ezz')).toBe('#E4572E');
    expect(normalizeHexInput('#1#2')).toBe('#12');
  });
});
