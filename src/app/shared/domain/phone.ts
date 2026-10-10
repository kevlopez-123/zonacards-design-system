import { dialCountry } from './countries';

/** Número nacional en grupos de 3 ("987 654 321"). */
export const formatPhone = (digits: string): string => digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();

/** Solo dígitos, recortado al largo del país. */
export const phoneDigits = (raw: string, country: string): string => raw.replace(/\D/g, '').slice(0, dialCountry(country).phoneDigits);

export const isValidPhone = (country: string, digits: string): boolean => /^\d+$/.test(digits) && digits.length === dialCountry(country).phoneDigits;

/** Formato internacional para mostrar o enviar: "+51 987 654 321". */
export const formatPhoneIntl = (country: string, digits: string): string => `${dialCountry(country).dial} ${formatPhone(digits)}`;
