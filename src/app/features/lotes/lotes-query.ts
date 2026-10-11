import { isScopeCountry } from '@zonacards/ui/core';
import { GiftcardState } from '@zonacards/ui/core';
import { LoteSortKey, LotesQuery, LoteType } from './lotes.models';

/**
 * Filtros, orden y página de Lotes como parámetros de URL (se comparten y sobreviven a Atrás).
 * Claves cortas y en español: ?q=navidad&pais=pe,cl&estado=activated&orden=-amount&pagina=2&filas=50.
 * Lo que no es válido se ignora: una URL editada a mano nunca rompe la pantalla.
 */
export const PAGE_SIZES = [25, 50, 100] as const;
export const DEFAULT_QUERY: LotesQuery = {
  q: '', country: [], state: [], client: null, program: null, brand: null, type: null, from: null, to: null,
  sort: 'expires', desc: false, page: 1, size: 25,
};

const STATES: readonly GiftcardState[] = ['created', 'activated', 'expired', 'voided'];
const SORTS: readonly LoteSortKey[] = ['expires', 'created', 'amount', 'name', 'client', 'quantity', 'available'];
const ISO = /^\d{4}-\d{2}-\d{2}$/;

const list = (v: string | null) => (v ? v.split(',').map(s => s.trim()).filter(Boolean) : []);

export function parseLotesQuery(get: (key: string) => string | null): LotesQuery {
  const orden = get('orden') ?? '';
  const sortKey = orden.replace(/^-/, '') as LoteSortKey;
  const sortOk = SORTS.includes(sortKey);
  const page = Number(get('pagina'));
  const size = Number(get('filas'));
  const type = get('tipo');
  const from = get('desde'), to = get('hasta');
  return {
    q: (get('q') ?? '').slice(0, 80),
    country: [...new Set(list(get('pais')).filter(isScopeCountry))],
    state: [...new Set(list(get('estado')).filter((s): s is GiftcardState => STATES.includes(s as GiftcardState)))],
    client: get('cliente') || null,
    program: get('programa') || null,
    brand: get('marca') || null,
    type: type === 'propio' || type === 'terceros' ? (type as LoteType) : null,
    from: from && ISO.test(from) ? from : null,
    to: to && ISO.test(to) ? to : null,
    sort: sortOk ? sortKey : DEFAULT_QUERY.sort,
    desc: sortOk ? orden.startsWith('-') : DEFAULT_QUERY.desc,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    size: (PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_QUERY.size,
  };
}

/** Parámetros de URL sin los valores por defecto (URLs cortas). null quita el parámetro al navegar con merge. */
export function lotesQueryParams(q: LotesQuery): Record<string, string | null> {
  const d = DEFAULT_QUERY;
  const sortChanged = q.sort !== d.sort || q.desc !== d.desc;
  return {
    q: q.q || null,
    pais: q.country.length ? q.country.join(',') : null,
    estado: q.state.length ? q.state.join(',') : null,
    cliente: q.client, programa: q.program, marca: q.brand, tipo: q.type,
    desde: q.from, hasta: q.to,
    orden: sortChanged ? (q.desc ? '-' : '') + q.sort : null,
    pagina: q.page > 1 ? String(q.page) : null,
    filas: q.size !== d.size ? String(q.size) : null,
  };
}

/** Parámetros para la API (mismo formato que la URL de la pantalla). */
export function lotesApiParams(q: LotesQuery): Record<string, string> {
  const p = lotesQueryParams(q);
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(p)) if (v !== null) out[k] = v;
  out['pagina'] = String(q.page); out['filas'] = String(q.size);
  return out;
}

/** Cantidad de filtros activos (los chips): no cuenta búsqueda, orden ni página. */
export const activeFilterCount = (q: LotesQuery) =>
  q.country.length + q.state.length + [q.client, q.program, q.brand, q.type].filter(Boolean).length + (q.from || q.to ? 1 : 0);
