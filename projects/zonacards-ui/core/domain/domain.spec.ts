import { describe, expect, it } from 'vitest';
import { currencySymbol, formatMoney, formatMoneyCompact, formatMoneyWhole, MoneyDisplay } from './money';
import { CountryCode } from './countries';
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

describe('montos sin ambig\u00fcedad (display)', () => {
  const all = (n: number, c: CountryCode, display?: MoneyDisplay) =>
    [formatMoney(n, c, { display }), formatMoneyWhole(n, c, { display }), formatMoneyCompact(n * 100, c, { display }), currencySymbol(c, { display })];
  const cases: [CountryCode, string, string][] = [['pe', 'PEN', 'S/'], ['ec', 'USD', '$'], ['bo', 'BOB', 'Bs'], ['co', 'COP', '$'], ['cl', 'CLP', '$'], ['mx', 'MXN', '$']];
  for (const [c, code, symbol] of cases) {
    it(`${c}: auto usa ${symbol === '$' ? code : symbol}`, () => {
      for (const s of all(12345, c)) {
        if (symbol === '$') { expect(s).toContain(code); expect(s).not.toContain('$'); }
        else { expect(s).toContain(symbol); expect(s).not.toContain(code); }
      }
    });
    it(`${c}: symbol y code`, () => {
      for (const s of all(12345, c, 'symbol')) expect(s).toContain(symbol);
      for (const s of all(12345, c, 'code')) expect(s).toContain(code);
    });
  }
  it('formato exacto con espacio duro y decimales del pa\u00eds', () => {
    expect(formatMoney(12345, 'cl')).toBe('CLP\u00a012.345');
    expect(formatMoney(1250, 'ec')).toMatch(/^USD\u00a01[.,]250[.,]00$/);
    expect(formatMoney(1250, 'pe')).toBe('S/\u00a01,250.00');
    expect(formatMoneyCompact(1_250_000, 'mx')).toBe('MXN\u00a01.3M');
    expect(currencySymbol('cl')).toBe('CLP');
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
