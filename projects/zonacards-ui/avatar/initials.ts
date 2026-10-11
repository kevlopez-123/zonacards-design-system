/** Iniciales para avatares: primera letra de las dos primeras palabras ("Lucía Mendoza" → "LM"). */
export function initials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toLocaleUpperCase('es')).join('');
}

export type AvatarSize = 'sm' | 'md' | 'lg';
export const HLM_SIZE: Record<AvatarSize, 'sm' | 'default' | 'lg'> = { sm: 'sm', md: 'default', lg: 'lg' };
