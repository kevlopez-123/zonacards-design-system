import { prettyPhone } from './support.component';

describe('Teléfonos de soporte', () => {
  it('agrupa un celular y un fijo de Lima', () => {
    expect(prettyPhone('+51900000099')).toBe('+51 900 000 099');
    expect(prettyPhone('+5117008000')).toBe('+51 1 700 8000');
  });
  it('un número de otro país conocido y uno desconocido', () => {
    expect(prettyPhone('+56912345678')).toBe('+56 912 345 678');
    expect(prettyPhone('+99912345')).toBe('+99912345');
  });
});
