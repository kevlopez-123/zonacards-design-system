import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Tokens propios que tailwind-merge no conoce. Sin registrarlos, toma text-body como un color de texto y, al combinarlo con
 * text-on-primary o text-white, borra el color (botones con texto negro sobre fondo oscuro). Lo mismo con las sombras y las capas.
 */
export const TEXT_SIZES = ['2xs', 'tiny', 'caption', 'body-sm', 'body', 'title-sm', 'title', 'heading', 'display-sm', 'display', 'display-lg'] as const;
export const zcMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: [...TEXT_SIZES] }],
      shadow: [{ shadow: ['xs', 'hairline', '1', '2'] }],
    },
  },
});

/** Une clases de Tailwind resolviendo conflictos (la última gana). */
export const cn = (...inputs: ClassValue[]) => zcMerge(clsx(inputs));
