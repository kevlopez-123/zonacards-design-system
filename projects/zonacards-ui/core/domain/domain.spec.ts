import { describe, expect, it } from 'vitest';
import { formatMoney, formatMoneyCompact } from './money';
import { formatDate } from './dates';
import { APPROVAL_TRANSITIONS, canTransition, GIFTCARD_TRANSITIONS } from './states';

describe('montos', () => {
  it('usa la moneda y los decimales del país', () => {
    expect(formatMoney(1250.5, 'pe')).toContain('1,250.50');
    expect(formatMoney(20000, 'cl')).not.toContain(',00');
  });
  it('abrevia con K, M y MM', () => {
    expect(formatMoneyCompact(10900, 'pe')).toBe('S/\u00a010.9K');
    expect(formatMoneyCompact(1240350.5, 'pe')).toBe('S/\u00a01.2M');
    expect(formatMoneyCompact(2750000000, 'cl')).toContain('MM');
    expect(formatMoneyCompact(950, 'pe')).toBe('S/\u00a0950');
  });
  it('sube de unidad al redondear 999.95K', () => {
    expect(formatMoneyCompact(999950, 'pe')).toBe('S/\u00a01M');
  });
});

describe('fechas', () => {
  const d = new Date('2026-03-01T19:30:00Z');
  it('formatos estándar en español', () => {
    expect(formatDate(d, 'short')).toBe('1/3/26');
    expect(formatDate(d, 'medium')).toBe('1 Mar, 2026');
    expect(formatDate(d, 'long')).toBe('1 de marzo de 2026');
    expect(formatDate(d, 'full')).toBe('Domingo, 1 de marzo de 2026');
  });
  it('hora en 12 h con a. m./p. m. y en 24 h', () => {
    expect(formatDate(d, 'time')).toMatch(/^2:30\sp\.\s?m\.$/);
    expect(formatDate(d, 'time-pad')).toMatch(/^02:30/);
    expect(formatDate(d, 'time', { hourCycle: 'h23' })).toBe('14:30');
  });
});

describe('máquinas de estado', () => {
  it('una giftcard vencida no se puede activar', () => {
    expect(canTransition(GIFTCARD_TRANSITIONS, 'expired', 'activated')).toBe(false);
    expect(canTransition(GIFTCARD_TRANSITIONS, 'created', 'activated')).toBe(true);
  });
  it('una aprobación rechazada vuelve a solicitarse', () => {
    expect(canTransition(APPROVAL_TRANSITIONS, 'rejected', 'requested')).toBe(true);
  });
});
