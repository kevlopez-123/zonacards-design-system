import { formatLatLng, isValidLatLng, parseCoord, roundCoord } from './geo';

describe('Coordenadas del selector de ubicación', () => {
  it('acepta coma o punto y rechaza lo que no es número', () => {
    expect(parseCoord('-12.5')).toBe(-12.5);
    expect(parseCoord(' -12,5 ')).toBe(-12.5);
    expect(parseCoord('+3')).toBe(3);
    expect(parseCoord('12.')).toBeNull();
    expect(parseCoord('abc')).toBeNull();
    expect(parseCoord('')).toBeNull();
  });

  it('valida los rangos de latitud y longitud', () => {
    expect(isValidLatLng({ lat: -12.04, lng: -77.04 })).toBe(true);
    expect(isValidLatLng({ lat: 90, lng: 180 })).toBe(true);
    expect(isValidLatLng({ lat: 91, lng: 0 })).toBe(false);
    expect(isValidLatLng({ lat: 0, lng: -181 })).toBe(false);
    expect(isValidLatLng({ lat: NaN, lng: 0 })).toBe(false);
    expect(isValidLatLng(null)).toBe(false);
  });

  it('redondea a 6 decimales y muestra 5', () => {
    expect(roundCoord(-12.04637249)).toBe(-12.046372);
    expect(formatLatLng({ lat: -12.0464, lng: -77.0428 })).toBe('-12.04640, -77.04280');
  });
});
