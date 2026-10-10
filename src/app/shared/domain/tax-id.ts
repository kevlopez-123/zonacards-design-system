import { CountryCode } from './countries';

/**
 * Identificador tributario por país (RUC, NIT, RUT, RFC): caracteres permitidos mientras se escribe,
 * largo máximo, teclado y validación con dígito verificador cuando el país lo tiene.
 */
export interface TaxIdRule {
  /** Un carácter permitido. Lo demás se rechaza al escribir o pegar. */
  readonly allowed: RegExp;
  readonly maxLength: number;
  readonly inputMode: 'numeric' | 'text';
  /** Formato al salir del campo (mayúsculas, guion del verificador). */
  normalize(raw: string): string;
  isValid(value: string): boolean;
}

const digits = (s: string) => s.replace(/\D/g, '');

/** Perú · RUC: 11 dígitos, prefijo 10/15/16/17/20 y verificador módulo 11. */
export function isValidRucPe(v: string): boolean {
  if (!/^(10|15|16|17|20)\d{9}$/.test(v)) return false;
  const w = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = w.reduce((s, x, i) => s + x * +v[i], 0);
  const dv = (11 - (sum % 11)) % 10;
  return dv === +v[10];
}

/** Ecuador · RUC: 13 dígitos, provincia 01–24 o 30 y establecimiento 001 en adelante. */
export function isValidRucEc(v: string): boolean {
  if (!/^\d{13}$/.test(v)) return false;
  const prov = +v.slice(0, 2);
  return ((prov >= 1 && prov <= 24) || prov === 30) && +v.slice(10) >= 1;
}

/** Colombia · NIT: 9 dígitos + verificador (módulo 11 con pesos primos de la DIAN). */
export function nitCheckDigit(base: string): number {
  const w = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const sum = base.split('').reverse().reduce((s, d, i) => s + +d * w[i], 0);
  const r = sum % 11;
  return r > 1 ? 11 - r : r;
}
export function isValidNitCo(v: string): boolean {
  const m = v.match(/^(\d{9})-?(\d)$/);
  return !!m && nitCheckDigit(m[1]) === +m[2];
}

/** Chile · RUT: cuerpo de 7 u 8 dígitos y verificador módulo 11 (0–9 o K). */
export function rutCheckDigit(body: string): string {
  let sum = 0, f = 2;
  for (let i = body.length - 1; i >= 0; i--) { sum += +body[i] * f; f = f === 7 ? 2 : f + 1; }
  const dv = 11 - (sum % 11);
  return dv === 11 ? '0' : dv === 10 ? 'K' : String(dv);
}
export function isValidRutCl(v: string): boolean {
  const m = v.replace(/\./g, '').toUpperCase().match(/^(\d{7,8})-([\dK])$/);
  return !!m && rutCheckDigit(m[1]) === m[2];
}

/** México · RFC: 3 (moral) o 4 (física) letras, fecha AAMMDD válida y homoclave de 3. */
export function isValidRfcMx(v: string): boolean {
  const m = v.toUpperCase().match(/^([A-ZÑ&]{3,4})(\d{2})(\d{2})(\d{2})([A-Z\d]{2}[A\d])$/);
  if (!m) return false;
  const month = +m[3], day = +m[4];
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

export const TAX_ID_RULES: Record<CountryCode, TaxIdRule> = {
  pe: { allowed: /\d/, maxLength: 11, inputMode: 'numeric', normalize: digits, isValid: isValidRucPe },
  ec: { allowed: /\d/, maxLength: 13, inputMode: 'numeric', normalize: digits, isValid: isValidRucEc },
  bo: { allowed: /\d/, maxLength: 12, inputMode: 'numeric', normalize: digits, isValid: v => /^\d{7,12}$/.test(v) },
  co: {
    allowed: /[\d-]/, maxLength: 11, inputMode: 'numeric',
    normalize: v => { const d = digits(v); return d.length === 10 ? d.slice(0, 9) + '-' + d[9] : v; },
    isValid: isValidNitCo,
  },
  cl: {
    allowed: /[\dkK.-]/, maxLength: 12, inputMode: 'text',
    normalize: v => { const s = v.replace(/[.-]/g, '').toUpperCase(); return s.length >= 8 ? s.slice(0, -1) + '-' + s.slice(-1) : v.toUpperCase(); },
    isValid: isValidRutCl,
  },
  mx: { allowed: /[A-Za-zÑñ&\d]/, maxLength: 13, inputMode: 'text', normalize: v => v.toUpperCase(), isValid: isValidRfcMx },
};
