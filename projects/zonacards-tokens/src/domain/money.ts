import { CountryCode, countryByCode } from './countries';

/**
 * Cómo se escribe la moneda:
 * - 'auto' (por defecto): código ISO cuando el símbolo del país es "$" (CLP, COP, MXN y el USD de Ecuador) y el símbolo en los demás
 *   ("S/ 1,250.00", "Bs 1.250,00"). En una vista que mezcla países, "$ 12.345" no dice qué moneda es.
 * - 'symbol': siempre el símbolo del país. 'code': siempre el código ISO.
 */
export type MoneyDisplay = 'auto' | 'symbol' | 'code';
export interface MoneyOptions { display?: MoneyDisplay }

const symbolOf = (c: ReturnType<typeof countryByCode>) =>
  new Intl.NumberFormat(c.locale, { style: 'currency', currency: c.currency }).formatToParts(1).find(p => p.type === 'currency')?.value ?? c.currency;

/** true si el monto debe llevar el código ISO en vez del símbolo. */
function useCode(country: CountryCode, display: MoneyDisplay = 'auto'): boolean {
  return display === 'code' || (display === 'auto' && symbolOf(countryByCode(country)) === '$');
}

function currencyFormat(country: CountryCode, display: MoneyDisplay | undefined, digits: { min?: number; max: number }) {
  const c = countryByCode(country);
  return new Intl.NumberFormat(c.locale, {
    style: 'currency', currency: c.currency, currencyDisplay: useCode(country, display) ? 'code' : 'symbol',
    minimumFractionDigits: digits.min, maximumFractionDigits: digits.max,
  });
}

/** El código ISO siempre separado por un espacio duro ("CLP 12.345", "12.345 CLP"). */
const hardSpace = (s: string) => s.replace(/([A-Z]{3})\s*(?=\S)/, '$1 ').replace(/(\S)\s*([A-Z]{3})$/, '$1 $2');

/** Monto completo con la moneda y los decimales del país. */
export function formatMoney(amount: number, country: CountryCode, opts: MoneyOptions = {}): string {
  const c = countryByCode(country);
  return hardSpace(currencyFormat(country, opts.display, { min: c.decimals, max: c.decimals }).format(amount));
}

/** Monto entero, sin decimales (chips de monto: "S/ 50"). */
export function formatMoneyWhole(amount: number, country: CountryCode, opts: MoneyOptions = {}): string {
  return hardSpace(currencyFormat(country, opts.display, { max: 0 }).format(amount));
}

/** Número con los separadores del país, sin moneda ("1,000"). */
export const formatNumber = (n: number, country: CountryCode): string => new Intl.NumberFormat(countryByCode(country).locale, { maximumFractionDigits: 0 }).format(n);

/** Moneda para el prefijo de un campo de monto: "S/", "Bs" o el código ("CLP") cuando el símbolo sería "$" (con 'auto'). */
export function currencySymbol(country: CountryCode, opts: MoneyOptions = {}): string {
  const c = countryByCode(country);
  return useCode(country, opts.display) ? c.currency : symbolOf(c);
}

const UNITS: ReadonlyArray<readonly [number, string]> = [[1e9, 'MM'], [1e6, 'M'], [1e3, 'K']];

/**
 * Monto abreviado (K, M, MM) con un decimal y el separador del país.
 * Menos de 1.000 solo pierde los decimales. Nunca se usa en tablas, exportaciones ni documentos.
 */
export function formatMoneyCompact(amount: number, country: CountryCode, opts: MoneyOptions = {}): string {
  const c = countryByCode(country);
  const abs = Math.abs(amount);
  if (abs < 1000) return formatMoneyWhole(amount, country, opts);
  let i = UNITS.findIndex(u => abs >= u[0]);
  let value = abs / UNITS[i][0];
  if (Math.round(value * 10) / 10 >= 1000 && i > 0) { i--; value = abs / UNITS[i][0]; }
  const num = new Intl.NumberFormat(c.locale, { maximumFractionDigits: 1 }).format(Math.round(value * 10) / 10);
  const parts = currencyFormat(country, opts.display, { max: 0 }).formatToParts(1);
  const symbolFirst = parts.findIndex(p => p.type === 'currency') < parts.findIndex(p => p.type === 'integer');
  const symbol = currencySymbol(country, opts);
  const space = useCode(country, opts.display) || parts.some(p => p.type === 'literal' && /\s/.test(p.value)) ? ' ' : '';
  const sign = amount < 0 ? '−' : '';
  return sign + (symbolFirst ? symbol + space + num + UNITS[i][1] : num + UNITS[i][1] + space + symbol);
}
