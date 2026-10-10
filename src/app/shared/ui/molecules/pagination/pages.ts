/** Cálculos puros del paginador (probados en pagination.spec.ts). */

export function pageCount(total: number, size: number): number {
  return Math.max(1, Math.ceil(Math.max(0, total) / Math.max(1, size)));
}

export function clampPage(page: number, count: number): number {
  return Math.min(Math.max(1, Math.trunc(page) || 1), count);
}

/** Rango visible: { from: 1, to: 25 } de "1–25 de 1.240". */
export function pageRange(page: number, size: number, total: number): { from: number; to: number } {
  if (total <= 0) return { from: 0, to: 0 };
  const from = (page - 1) * size + 1;
  return { from, to: Math.min(total, page * size) };
}

/**
 * Páginas de la variante numérica: todas si son 7 o menos; si no, primera, última y la actual con sus vecinas,
 * con "…" en los saltos (máximo 5 números visibles).
 */
export function numericPages(page: number, count: number): (number | 'gap')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  if (page <= 3) return [1, 2, 3, 4, 'gap', count];
  if (page >= count - 2) return [1, 'gap', count - 3, count - 2, count - 1, count];
  return [1, 'gap', page - 1, page, page + 1, 'gap', count];
}

/** Número con separador de miles según el idioma (siempre agrupado: "1.240"). */
export function formatCount(n: number, lang: 'es' | 'en'): string {
  return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-ES', { useGrouping: 'always' as unknown as boolean }).format(n);
}
