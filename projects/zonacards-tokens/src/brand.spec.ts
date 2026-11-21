import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { BrandDefinition, brandToCss, parseBrand, validateBrand } from './brand';

const acme = JSON.parse(readFileSync(join(import.meta.dirname, '../examples/acme.brand.json'), 'utf8')) as BrandDefinition;

describe('Marcas en datos', () => {
  it('la marca de ejemplo es válida', () => {
    const v = validateBrand(acme);
    expect(v.issues.filter(i => i.level === 'error')).toEqual([]);
    expect(v.ok).toBe(true);
  });

  it('genera el bloque CSS con la misma forma que las marcas del sistema', () => {
    const css = brandToCss(acme);
    expect(css).toContain(':root[data-brand="acme"] { --zc-font-sans: "Inter Variable"');
    expect(css).toContain('--brand-accent: #e11d48;');
    expect(css).toContain('--shape-control: 12px; --shape-card: 20px; --shape-sheet: 24px; --shape-button: 9999px; --shape-field-h: 56px;');
    expect(css).toContain(':root[data-brand="acme"]:not(.dark) { --primary: #be123c;');
    expect(css).toContain('--field-bg: #f4f4f5; --field-bd: #71717a;');
    expect(css).toContain(':root[data-brand="acme"].dark { --primary: #fb7185;');
  });

  it('una marca sin modo oscuro no genera bloque oscuro', () => {
    expect(brandToCss({ id: 'sola', accent: '#112233' })).toBe(':root[data-brand="sola"] { --brand-accent: #112233; }\n');
  });

  it('rechaza ids inválidos o reservados', () => {
    expect(validateBrand({ id: 'Mi Marca' }).ok).toBe(false);
    expect(validateBrand({ id: 'zonacards' }).ok).toBe(false);
    expect(validateBrand({ id: 'mi-marca-2' }).ok).toBe(true);
  });

  it('exige colores #rrggbb y medidas en px o rem', () => {
    const v = validateBrand({ id: 'x', accent: 'rojo', shape: { control: '24', card: '1rem' }, light: { primary: 'rgb(0,0,0)' } });
    const msgs = v.issues.map(i => i.message).join('|');
    expect(v.ok).toBe(false);
    expect(msgs).toContain('accent "rojo"');
    expect(msgs).toContain('shape.control "24"');
    expect(msgs).toContain('light.primary');
    expect(msgs).not.toContain('shape.card');
  });

  it('revisa el contraste de los pares de colores definidos', () => {
    const v = validateBrand({ id: 'flojo', light: { primary: '#ffeb3b', 'on-primary': '#ffffff' } });
    expect(v.ok).toBe(false);
    expect(v.issues[0].message).toMatch(/texto sobre el color primario tiene contraste 1\.\d+:1/);
    expect(validateBrand({ id: 'bien', light: { primary: '#1d4ed8', 'on-primary': '#ffffff' } }).ok).toBe(true);
  });

  it('avisa si defines el primario sin su texto', () => {
    const v = validateBrand({ id: 'a', light: { primary: '#1d4ed8' } });
    expect(v.ok).toBe(true);
    expect(v.issues.some(i => i.level === 'warning' && i.message.includes('on-primary'))).toBe(true);
  });

  it('avisa de campos táctiles demasiado bajos', () => {
    expect(validateBrand({ id: 'a', shape: { fieldHeight: '36px' } }).issues.some(i => i.message.includes('44px'))).toBe(true);
  });

  it('parseBrand lanza con todos los errores', () => {
    expect(() => parseBrand('{"id":"Mal","accent":"x"}')).toThrow(/id "Mal"[\s\S]*accent "x"/);
    expect(parseBrand({ id: 'bien' }).id).toBe('bien');
  });
});
