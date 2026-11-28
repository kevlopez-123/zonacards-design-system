/**
 * Puntos de quiebre en píxeles: los mismos de Tailwind (sm:, md:, lg:, xl:) y de los tokens `--bp-*` de tokens.css.
 * Úsalos para armar un `matchMedia` en TypeScript; en plantillas se usan los prefijos de Tailwind. `scripts/check-breakpoints.mjs`
 * comprueba que coincidan con los tokens, así que no se escribe un número suelto.
 */
export const BREAKPOINT = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const;
/** `(min-width: …px)` para un punto de quiebre. */
export const minWidth = (bp: keyof typeof BREAKPOINT) => `(min-width: ${BREAKPOINT[bp]}px)`;
/** `(max-width: …px)`: hasta justo antes del punto de quiebre. */
export const belowWidth = (bp: keyof typeof BREAKPOINT) => `(max-width: ${BREAKPOINT[bp] - 1}px)`;
