import { FormControl, FormGroup } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { zcValidators } from './validators';

describe('zcValidators', () => {
  it('teléfono: informa país, largo esperado y actual', () => {
    const c = new FormControl({ country: 'co', number: '987654321' }, zcValidators.phone());
    expect(c.errors).toEqual({ phoneLength: { country: 'Colombia', expected: 10, actual: 9 } });
    c.setValue({ country: 'co', number: '3001234567' });
    expect(c.valid).toBe(true);
  });

  it('documento: usa el país vigente del formulario', () => {
    let country: 'pe' | 'co' = 'pe';
    const c = new FormControl('20100047218', zcValidators.taxId(() => country));
    expect(c.valid).toBe(true);
    country = 'co';
    c.updateValueAndValidity();
    expect(c.errors?.['taxId'].type).toBe('NIT');
  });

  it('monto: positivo, decimales de la moneda y rango', () => {
    const c = new FormControl<number | null>(null, zcValidators.amount({ country: 'cl', min: 1000, max: 50000 }));
    expect(c.valid).toBe(true);
    c.setValue(0); expect(c.errors).toEqual({ amountPositive: true });
    c.setValue(1500.5); expect(c.errors).toEqual({ amountDecimals: { decimals: 0 } });
    c.setValue(500); expect(c.errors).toEqual({ amountRange: { min: 1000, max: 50000 } });
    c.setValue(10.15); c.setValidators(zcValidators.amount({ country: 'pe' })); c.updateValueAndValidity();
    expect(c.valid).toBe(true);
  });

  it('correos: formato y máximo', () => {
    const c = new FormControl(['a@b.pe', 'mal'], zcValidators.emails(2));
    expect(c.errors).toEqual({ emails: { invalid: 1 } });
    expect(new FormControl(['mal', 'peor'], zcValidators.emails(5)).errors).toEqual({ emailsN: { invalid: 2 } });
    c.setValue(['a@b.pe', 'c@d.pe', 'e@f.pe']);
    expect(c.errors).toEqual({ emailsMax: { max: 2 } });
  });

  it('fecha: formato, mínimo y máximo', () => {
    const c = new FormControl<string | null>('31/02/2026', zcValidators.date({ min: '2026-01-01', max: '2026-12-31' }));
    expect(c.errors).toEqual({ dateFormat: true });
    c.setValue('2025-12-31'); expect(c.errors).toEqual({ dateMin: { min: '01/01/2026' } });
    c.setValue('2026-06-01'); expect(c.valid).toBe(true);
  });

  it('periodo: completo, ordenado y con máximo de días', () => {
    const c = new FormControl<unknown>({ from: '2026-03-10', to: '2026-03-01' }, zcValidators.dateRange(31));
    expect(c.errors).toEqual({ rangeOrder: true });
    c.setValue({ from: '2026-01-01', to: '2026-03-01' }); expect(c.errors).toEqual({ rangeMax: { max: 31 } });
  });

  it('rango de horas: el error queda en "hasta" y se limpia al corregir', () => {
    const g = new FormGroup({ from: new FormControl('18:00'), to: new FormControl('09:00', zcValidators.time()) }, { validators: zcValidators.timeRange('from', 'to') });
    expect(g.controls.to.errors).toEqual({ timeOrder: { from: '18:00' } });
    g.controls.to.setValue('19:00');
    expect(g.controls.to.errors).toBeNull();
  });
});
