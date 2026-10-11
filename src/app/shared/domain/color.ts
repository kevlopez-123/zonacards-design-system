/**
 * Utilidades de color para el selector de color y los campos de color (sección m-color de index.html).
 * Hexadecimal siempre en mayúsculas con #: "#E4572E".
 */
export type Rgb = [number, number, number];
export type Hsv = [h: number, s: number, v: number];

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const isHex = (v: string): boolean => /^#[0-9A-F]{6}$/i.test(v);

export function hexToRgb(h: string): Rgb {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const rgbToHex = (r: number, g: number, b: number): string =>
  '#' + [r, g, b].map(x => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase();

export function rgbToHsv(r: number, g: number, b: number): Hsv {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, mx ? d / mx : 0, mx];
}

export function hsvToRgb(h: number, s: number, v: number): Rgb {
  const f = (n: number) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}

export const hsvToHex = (h: number, s: number, v: number) => rgbToHex(...hsvToRgb(h, s, v));
export const hexToHsv = (hex: string): Hsv => rgbToHsv(...hexToRgb(hex));

/** Luminancia relativa WCAG. */
export function luminance(hex: string): number {
  const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Contraste WCAG entre dos colores hexadecimales (1 a 21). */
export function contrastRatio(a: string, b: string): number {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** aa: texto normal (4,5:1) · large: solo texto grande (3:1) · fail: no cumple. */
export type ContrastLevel = 'aa' | 'large' | 'fail';
export const contrastLevel = (r: number): ContrastLevel => (r >= 4.5 ? 'aa' : r >= 3 ? 'large' : 'fail');

/** Color de texto con mejor contraste sobre un fondo. */
export const bestTextOn = (bg: string): '#FFFFFF' | '#000000' => (contrastRatio(bg, '#FFFFFF') >= contrastRatio(bg, '#000000') ? '#FFFFFF' : '#000000');

/** Normaliza lo que se escribe en un campo hexadecimal: mayúsculas, # al inicio y solo dígitos hexadecimales. */
export function normalizeHexInput(raw: string): string {
  const v = raw.toUpperCase().replace(/[^#0-9A-F]/g, '').replace(/(?!^)#/g, '');
  return (v && v[0] !== '#' ? '#' + v : v).slice(0, 7);
}
