import { isScopeCountry } from '@zonacards/ui/core';
import { ApprovalState } from '@zonacards/ui/core';
import { APPROVAL_TYPES, ApprovalsQuery, ApprovalType } from './aprobaciones.models';

/**
 * Bandeja de aprobaciones en la URL (misma convención que Lotes):
 * ?bandeja=mis-solicitudes&tipo=liquidacion,archivo_pago&pais=pe&estado=rejected&q=lq-2026&pagina=2&filas=50.
 */
export const PAGE_SIZES = [25, 50, 100] as const;
export const DEFAULT_QUERY: ApprovalsQuery = { tab: 'por-aprobar', type: [], country: [], state: [], q: '', page: 1, size: 25 };
const STATES: readonly ApprovalState[] = ['pending', 'executed', 'rejected'];
const list = (v: string | null) => (v ? v.split(',').map(s => s.trim()).filter(Boolean) : []);

export function parseApprovalsQuery(get: (key: string) => string | null): ApprovalsQuery {
  const page = Number(get('pagina')); const size = Number(get('filas'));
  return {
    tab: get('bandeja') === 'mis-solicitudes' ? 'mis-solicitudes' : 'por-aprobar',
    type: [...new Set(list(get('tipo')).filter((t): t is ApprovalType => APPROVAL_TYPES.includes(t as ApprovalType)))],
    country: [...new Set(list(get('pais')).filter(isScopeCountry))],
    state: [...new Set(list(get('estado')).filter((s): s is ApprovalState => STATES.includes(s as ApprovalState)))],
    q: (get('q') ?? '').slice(0, 80),
    page: Number.isInteger(page) && page > 0 ? page : 1,
    size: (PAGE_SIZES as readonly number[]).includes(size) ? size : 25,
  };
}

export function approvalsQueryParams(q: ApprovalsQuery): Record<string, string | null> {
  return {
    bandeja: q.tab === 'mis-solicitudes' ? q.tab : null,
    tipo: q.type.length ? q.type.join(',') : null,
    pais: q.country.length ? q.country.join(',') : null,
    estado: q.state.length ? q.state.join(',') : null,
    q: q.q || null,
    pagina: q.page > 1 ? String(q.page) : null,
    filas: q.size !== 25 ? String(q.size) : null,
  };
}

export function approvalsApiParams(q: ApprovalsQuery): Record<string, string> {
  const out: Record<string, string> = { bandeja: q.tab, pagina: String(q.page), filas: String(q.size) };
  for (const [k, v] of Object.entries(approvalsQueryParams(q))) if (v !== null && !(k in out)) out[k] = v;
  return out;
}
