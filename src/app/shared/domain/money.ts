import { CountryCode, countryByCode } from './countries';

/** Monto completo con la moneda y los decimales del país. */
export function formatMoney(amount: number, country: CountryCode): string {
  const c = countryByCode(country);
  return new Intl.NumberFormat(c.locale, { style: 'currency', currency: c.currency, minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals }).format(amount);
}

/** Monto entero, sin decimales (chips de monto: "S/ 50"). */
export function formatMoneyWhole(amount: number, country: CountryCode): string {
  const c = countryByCode(country);
  return new Intl.NumberFormat(c.locale, { style: 'currency', currency: c.currency, maximumFractionDigits: 0 }).format(amount);
}

/** Número con los separadores del país, sin moneda ("1,000"). */
export const formatNumber = (n: number, country: CountryCode): string => new Intl.NumberFormat(countryByCode(country).locale, { maximumFractionDigits: 0 }).format(n);

/** Símbolo de la moneda del país ("S/", "$", "Bs"), para el prefijo de un campo de monto. */
export function currencySymbol(country: CountryCode): string {
  const c = countryByCode(country);
  return new Intl.NumberFormat(c.locale, { style: 'currency', currency: c.currency }).formatToParts(1).find(p => p.type === 'currency')?.value ?? c.currency;
}

const UNITS: ReadonlyArray<readonly [number, string]> = [[1e9, 'MM'], [1e6, 'M'], [1e3, 'K']];

/**
 * Monto abreviado (K, M, MM) con un decimal y el separador del país.
 * Menos de 1.000 solo pierde los decimales. Nunca se usa en tablas, exportaciones ni documentos.
 */
export function formatMoneyCompact(amount: number, country: CountryCode): string {
  const c = countryByCode(country);
  const abs = Math.abs(amount);
  if (abs < 1000) return new Intl.NumberFormat(c.locale, { style: 'currency', currency: c.currency, maximumFractionDigits: 0 }).format(amount);
  let i = UNITS.findIndex(u => abs >= u[0]);
  let value = abs / UNITS[i][0];
  if (Math.round(value * 10) / 10 >= 1000 && i > 0) { i--; value = abs / UNITS[i][0]; }
  const num = new Intl.NumberFormat(c.locale, { maximumFractionDigits: 1 }).format(Math.round(value * 10) / 10);
  const parts = new Intl.NumberFormat(c.locale, { style: 'currency', currency: c.currency }).formatToParts(1);
  const symbolFirst = parts.findIndex(p => p.type === 'currency') < parts.findIndex(p => p.type === 'integer');
  const symbol = parts.find(p => p.type === 'currency')?.value ?? c.currency;
  const space = parts.some(p => p.type === 'literal' && /\s/.test(p.value)) ? '\u00a0' : '';
  const sign = amount < 0 ? '−' : '';
  return sign + (symbolFirst ? symbol + space + num + UNITS[i][1] : num + UNITS[i][1] + space + symbol);
}
