/** Coordenadas de un punto del mapa (grados decimales, WGS 84). */
export interface ZcLatLng { lat: number; lng: number }

/** Redondea a 6 decimales (≈ 10 cm): lo que se guarda y se muestra. */
export const roundCoord = (n: number) => Math.round(n * 1e6) / 1e6;

/** Latitud entre −90 y 90 y longitud entre −180 y 180. */
export function isValidLatLng(p: ZcLatLng | null | undefined): p is ZcLatLng {
  return !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;
}

/** Acepta coma o punto decimal y espacios; devuelve null si no es un número. */
export function parseCoord(text: string): number | null {
  const t = text.trim().replace(',', '.');
  if (!/^[-+]?\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}

/** "-12.121667, -77.029167": para mostrar y copiar (5 decimales, como en la app Enjoy). */
export const formatLatLng = (p: ZcLatLng) => `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
