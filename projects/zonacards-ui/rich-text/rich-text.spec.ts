import { describe, expect, it } from 'vitest';
import { sanitizeRichText } from './rich-text.component';

describe('sanitizeRichText', () => {
  it('deja solo formato permitido y quita atributos', () => {
    expect(sanitizeRichText('<p style="color:red" onclick="x()">Hola <b>mundo</b><script>alert(1)</script><span>!</span></p>'))
      .toBe('<p>Hola <b>mundo</b>alert(1)!</p>');
  });
  it('enlaces: solo http(s) o mailto, en otra pestaña', () => {
    expect(sanitizeRichText('<a href="javascript:alert(1)">x</a>')).toBe('<a target="_blank" rel="noopener noreferrer">x</a>');
    expect(sanitizeRichText('<a href="https://giftealo.com" class="c">g</a>')).toBe('<a href="https://giftealo.com" target="_blank" rel="noopener noreferrer">g</a>');
  });
  it('convierte div en p y vacía un br suelto', () => {
    expect(sanitizeRichText('<div>a</div>')).toBe('<p>a</p>');
    expect(sanitizeRichText('<br>')).toBe('');
  });
});
