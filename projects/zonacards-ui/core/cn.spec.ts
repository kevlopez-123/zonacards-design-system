import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn (combinar clases)', () => {
  it('la escala tipogr\u00e1fica no borra el color de texto', () => {
    expect(cn('bg-primary text-on-primary', 'h-target px-5 text-body')).toContain('text-on-primary');
    expect(cn('text-white', 'text-caption')).toBe('text-white text-caption');
    expect(cn('text-sm', 'text-body')).toBe('text-body');
  });
  it('las sombras propias se reemplazan entre s\u00ed', () => {
    expect(cn('shadow-xs', 'shadow-2')).toBe('shadow-2');
  });
});
