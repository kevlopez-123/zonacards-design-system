/** Configuración por país. En producción viene de la API de parámetros (sección 7 de la especificación). */
export type CountryCode = 'pe' | 'ec' | 'bo' | 'co' | 'cl' | 'mx';

export interface Country {
  code: CountryCode;
  name: string;
  currency: string;
  decimals: number;
  locale: string;
  taxId: string;
  taxIdHint: string;
  phoneDigits: number;
  dial: string;
  timeZone: string;
}

export const COUNTRIES: readonly Country[] = [
  { code: 'pe', name: 'Perú', currency: 'PEN', decimals: 2, locale: 'es-PE', taxId: 'RUC', taxIdHint: 'RUC de 11 dígitos', phoneDigits: 9, dial: '+51', timeZone: 'America/Lima' },
  { code: 'ec', name: 'Ecuador', currency: 'USD', decimals: 2, locale: 'es-EC', taxId: 'RUC', taxIdHint: 'RUC de 13 dígitos', phoneDigits: 9, dial: '+593', timeZone: 'America/Guayaquil' },
  { code: 'bo', name: 'Bolivia', currency: 'BOB', decimals: 2, locale: 'es-BO', taxId: 'NIT', taxIdHint: 'NIT de 7 a 12 dígitos', phoneDigits: 8, dial: '+591', timeZone: 'America/La_Paz' },
  { code: 'co', name: 'Colombia', currency: 'COP', decimals: 0, locale: 'es-CO', taxId: 'NIT', taxIdHint: 'NIT de 9 dígitos + verificador', phoneDigits: 10, dial: '+57', timeZone: 'America/Bogota' },
  { code: 'cl', name: 'Chile', currency: 'CLP', decimals: 0, locale: 'es-CL', taxId: 'RUT', taxIdHint: 'RUT con guion, ej. 12345678-5', phoneDigits: 9, dial: '+56', timeZone: 'America/Santiago' },
  { code: 'mx', name: 'México', currency: 'MXN', decimals: 2, locale: 'es-MX', taxId: 'RFC', taxIdHint: 'RFC de 12 o 13 caracteres', phoneDigits: 10, dial: '+52', timeZone: 'America/Mexico_City' },
];

export const countryByCode = (code: CountryCode): Country => {
  const c = COUNTRIES.find(x => x.code === code);
  if (!c) throw new Error(`País no configurado: ${code}`);
  return c;
};
