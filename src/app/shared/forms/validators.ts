import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { countryByCode, CountryCode, dialCountry } from '../domain/countries';
import { daysInRange, formatDmy, isIsoDate, IsoDate, isValidHm } from '../domain/dates';
import { isValidPhone } from '../domain/phone';
import { TAX_ID_RULES } from '../domain/tax-id';

/**
 * Validadores de las moléculas de formulario. Las reglas viven en shared/domain; aquí solo se adaptan a ValidatorFn.
 * Cada error lleva los datos para un mensaje claro ("Ingresa un RUC de 11 dígitos"), que arma fieldError().
 * Un valor vacío no es error: para eso está Validators.required.
 */
const empty = (v: unknown) => v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length);
type CountryInput = CountryCode | (() => CountryCode);
const resolve = (c: CountryInput) => (typeof c === 'function' ? c() : c);

export interface PhoneValue { country: string; number: string; }
export interface DateRangeValue { from: IsoDate; to: IsoDate; preset?: string; compare?: boolean; }

export const zcValidators = {
  /** Teléfono {country, number}: largo exacto del país. */
  phone(): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = c.value as PhoneValue | null;
      if (!v || !v.number) return null;
      if (isValidPhone(v.country, v.number)) return null;
      const dc = dialCountry(v.country);
      return { phoneLength: { country: dc.name, expected: dc.phoneDigits, actual: v.number.length } };
    };
  },

  /** RUC, NIT, RUT o RFC del país (acepta una función para un país que cambia en el formulario). */
  taxId(country: CountryInput): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      if (empty(c.value)) return null;
      const cc = resolve(country);
      return TAX_ID_RULES[cc].isValid(String(c.value)) ? null : { taxId: { type: countryByCode(cc).taxId, hint: countryByCode(cc).taxIdHint } };
    };
  },

  /** Monto mayor a cero, con los decimales de la moneda y dentro del rango. */
  amount(o: { country: CountryInput; min?: number; max?: number }): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      if (empty(c.value)) return null;
      const n = Number(c.value);
      if (!Number.isFinite(n) || n <= 0) return { amountPositive: true };
      const dec = countryByCode(resolve(o.country)).decimals;
      if ((String(n).split('.')[1]?.length ?? 0) > dec) return { amountDecimals: { decimals: dec } };
      if ((o.min !== undefined && n < o.min) || (o.max !== undefined && n > o.max)) return { amountRange: { min: o.min, max: o.max } };
      return null;
    };
  },

  /** Lista de correos: cada uno con formato válido, sin repetir y hasta un máximo. */
  emails(max?: number): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      const list = (c.value ?? []) as string[];
      const bad = list.filter(e => !EMAIL.test(e)).length;
      // Singular y plural con textos distintos ("1 correo no es válido" / "2 correos no son válidos"), como index.html.
      if (bad) return bad === 1 ? { emails: { invalid: 1 } } : { emailsN: { invalid: bad } };
      if (max !== undefined && list.length > max) return { emailsMax: { max } };
      return null;
    };
  },

  /** Fecha ISO existente y dentro de [min, max]. Un texto a medio escribir llega como tal y es formato inválido. */
  date(o: { min?: IsoDate | (() => IsoDate); max?: IsoDate | (() => IsoDate) } = {}): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = c.value;
      if (empty(v)) return null;
      if (!isIsoDate(v)) return { dateFormat: true };
      const min = typeof o.min === 'function' ? o.min() : o.min, max = typeof o.max === 'function' ? o.max() : o.max;
      if (min && v < min) return { dateMin: { min: formatDmy(min) } };
      if (max && v > max) return { dateMax: { max: formatDmy(max) } };
      return null;
    };
  },

  /** Periodo con fin posterior o igual al inicio y, si se indica, un máximo de días. */
  dateRange(maxDays?: number): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => {
      const v = c.value as DateRangeValue | null;
      if (!v) return null;
      if (!v.from || !v.to) return { rangeIncomplete: true };
      if (v.to < v.from) return { rangeOrder: true };
      if (maxDays && daysInRange(v.from, v.to) > maxDays) return { rangeMax: { max: maxDays } };
      return null;
    };
  },

  /** Hora hh:mm de 24 h. */
  time(): ValidatorFn {
    return (c: AbstractControl): ValidationErrors | null => (empty(c.value) || isValidHm(String(c.value)) ? null : { timeFormat: true });
  },

  /** Validador de grupo: la hora "hasta" debe ser posterior a "desde". El error queda en el control "hasta". */
  timeRange(fromKey: string, toKey: string): ValidatorFn {
    return (g: AbstractControl): ValidationErrors | null => {
      const from = g.get(fromKey)?.value, to = g.get(toKey);
      if (!to || !isValidHm(from ?? '') || !isValidHm(to.value ?? '')) return null;
      const err = to.value <= from ? { timeOrder: { from } } : null;
      const rest = { ...(to.errors ?? {}) }; delete rest['timeOrder'];
      const next = err ? { ...rest, ...err } : Object.keys(rest).length ? rest : null;
      if (JSON.stringify(next) !== JSON.stringify(to.errors)) to.setErrors(next);
      return null;
    };
  },
};

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
