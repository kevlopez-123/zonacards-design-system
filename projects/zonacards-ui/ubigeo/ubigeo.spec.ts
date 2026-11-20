import data from '../assets/geo/ubigeo-pe.json';
import { Ubigeo, UbigeoFile } from './ubigeo';

describe('Ubigeo del Perú (INEI)', () => {
  const u = new Ubigeo(data as unknown as UbigeoFile);

  it('trae el árbol completo', () => {
    expect(u.departments().length).toBe(25);
    expect(u.file.provincias.length).toBe(196);
    expect(u.file.distritos.length).toBe(1891);
  });

  it('baja de departamento a provincia a distrito', () => {
    const lima = u.departments().find(d => d.nombre === 'Lima')!;
    expect(lima.codigo).toBe('15');
    const provLima = u.provinces('15').find(p => p.nombre === 'Lima')!;
    expect(provLima.codigo).toBe('1501');
    expect(u.districts('1501').some(d => d.nombre === 'Miraflores' && d.codigo === '150122')).toBe(true);
  });

  it('Callao es departamento (07) en la notación INEI', () => {
    expect(u.departments().find(d => d.nombre === 'Callao')?.codigo).toBe('07');
  });

  it('arma la etiqueta y las coordenadas del distrito', () => {
    expect(u.label('150122')).toBe('Miraflores, Lima, Lima');
    expect(u.district('150122')?.lat).toBeCloseTo(-12.12, 1);
    expect(u.path('150122').department?.codigo).toBe('15');
  });

  it('la corrección de Ninabamba quedó en Santa Cruz', () => {
    expect(u.label('061306')).toContain('Santa Cruz');
  });

  it('un código desconocido o vacío no revienta', () => {
    expect(u.label(null)).toBe('');
    expect(u.provinces('99')).toEqual([]);
    expect(u.districts(null)).toEqual([]);
  });
});
