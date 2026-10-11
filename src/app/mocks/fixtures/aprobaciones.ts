import type { SessionUser } from '../../core/session/session.service';
import type { Approval, ApprovalChange, ApprovalsPage, ApprovalsQuery, ApprovalType, Decision } from '../../features/aprobaciones/aprobaciones.models';
import { COUNTRIES, CountryCode, countryByCode } from '../../shared/domain/countries';
import { formatMoney } from '../../shared/domain/money';
import { DEMO_USERS } from '../users';
import { LOTES, REF_DATE, applyLotVoid, rng } from './lotes';
import type { Lote } from '../../features/lotes/lotes.models';

/** Quién puede aprobar cada tipo (rol checker). Siempre otra persona distinta de quien solicita. */
export const APPROVER_ROLES: Record<ApprovalType, string[]> = {
  lote_void: ['Operaciones', 'Administrador'], emision: ['Operaciones', 'Administrador'], envio_masivo: ['Operaciones', 'Administrador'],
  activacion_masiva: ['Operaciones', 'Administrador'], reverso: ['Operaciones', 'Administrador'], consumo_manual: ['Operaciones', 'Administrador'],
  extension_vigencia: ['Operaciones', 'Administrador'], liquidacion: ['Supervisor de Finanzas'], archivo_pago: ['Supervisor de Finanzas'],
  regla_antifraude: ['Administrador'],
};
/** Quién suele solicitar cada tipo. */
const MAKERS: Record<ApprovalType, string[]> = {
  lote_void: ['u-ana', 'u-carlos'], emision: ['u-ana', 'u-carlos'], envio_masivo: ['u-ana', 'u-carlos'], activacion_masiva: ['u-carlos', 'u-ana'],
  reverso: ['u-rosa'], consumo_manual: ['u-rosa'], extension_vigencia: ['u-rosa'], liquidacion: ['u-ivan'], archivo_pago: ['u-ivan'], regla_antifraude: ['u-mario'],
};
const REASONS: Record<ApprovalType, string[]> = {
  lote_void: ['Error en la orden de compra', 'Cliente canceló la campaña', 'Pedido duplicado'],
  emision: ['Orden de compra OC-2026-01422', 'Reposición pedida por el cliente'], envio_masivo: ['Campaña de fin de año', 'Bienvenida a nuevos clientes'],
  activacion_masiva: ['Pedido corporativo con tarjetas físicas', 'Activación para evento del cliente'],
  reverso: ['Consumo duplicado en el local', 'Cobro por error del comercio'], consumo_manual: ['Terminal del local sin conexión', 'Canje en evento sin POS'],
  extension_vigencia: ['Beneficiario de viaje durante la vigencia', 'Pedido del cliente corporativo'],
  liquidacion: ['Cierre de octubre', 'Cierre quincenal'], archivo_pago: ['Pago semanal a franquicias', 'Pago de liquidaciones aprobadas'],
  regla_antifraude: ['Picos de canjes nocturnos en Lima', 'Ajuste de geovelocidad'],
};
const REJECT_COMMENTS = ['Falta el sustento del cliente; adjúntalo y vuelve a solicitar.', 'El monto no coincide con la orden de compra.', 'Ya se atendió en otra solicitud.'];

const user = (id: string) => DEMO_USERS.find(u => u.id === id)!;
const who = (u: SessionUser) => ({ id: u.id, name: u.name, role: u.role });
const at = (daysAgo: number, h: number) => { const d = new Date(REF_DATE + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - daysAgo); d.setUTCHours(h, (h * 7) % 60); return d.toISOString().slice(0, 19); };
const fmtDate = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });

function build(type: ApprovalType, i: number, r: () => number, lot: Lote | null): Omit<Approval, 'id' | 'state' | 'requestedBy' | 'requestedAt' | 'decidedBy' | 'decidedAt' | 'comment' | 'executedAt' | 'approverRoles' | 'reason'> {
  const pickC = (): CountryCode => ['pe', 'pe', 'co', 'cl', 'mx'][Math.floor(r() * 5)] as CountryCode;
  const money = (n: number, c: CountryCode) => formatMoney(n, c);
  if (lot && (type === 'lote_void' || type === 'envio_masivo' || type === 'emision' || type === 'activacion_masiva')) {
    const c = lot.country;
    const entity = { kind: 'lote' as const, id: lot.id, label: `#${lot.id}` };
    const title = `Lote #${lot.id} · ${lot.name} · ${lot.client}`;
    if (type === 'lote_void') {
      const n = lot.available;
      return { type, title, entity, country: c, amount: n * lot.unitAmount, quantity: n,
        changes: [{ field: 'Códigos disponibles', before: String(n), after: '0' }, { field: 'Códigos anulados', before: String(lot.voided), after: String(lot.voided + n) },
          ...(lot.activated === 0 ? [{ field: 'Estado del lote', before: 'Creado', after: 'Anulado' }] : [])] };
    }
    if (type === 'envio_masivo') {
      const n = Math.min(lot.available, 100 + Math.floor(r() * 400));
      return { type, title, entity, country: c, amount: n * lot.unitAmount, quantity: n,
        changes: [{ field: 'Contactos', before: '—', after: `${n} (archivo contactos.xlsx)` }, { field: 'Canal', before: '—', after: lot.channel === 'whatsapp' ? 'WhatsApp' : 'Correo' },
          { field: 'Disponibles', before: String(lot.available), after: String(lot.available - n) }] };
    }
    const n = [200, 500, 1000][i % 3];
    return { type, title: type === 'emision' ? `Nuevo lote · ${lot.giftcard} · ${lot.client}` : title, entity: type === 'emision' ? null : entity, country: c,
      amount: n * lot.unitAmount, quantity: n,
      changes: type === 'emision'
        ? [{ field: 'Giftcard', before: '—', after: lot.giftcard }, { field: 'Cantidad', before: '—', after: String(n) }, { field: 'Vencimiento', before: '—', after: fmtDate(lot.expiresAt) }]
        : [{ field: 'Tarjetas activadas', before: String(lot.activated), after: String(lot.activated + n) }, { field: 'Flete', before: '—', after: money(35, c) }] };
  }
  const c = pickC();
  const last4 = String(1000 + Math.floor(r() * 9000));
  switch (type) {
    case 'reverso': { const a = [25, 50, 100][i % 3]; return { type, title: `Giftcard •••• ${last4} · Reverso total`, entity: { kind: 'giftcard', id: last4, label: `•••• ${last4}` }, country: c, amount: a, quantity: null,
      changes: [{ field: 'Saldo', before: money(0, c), after: money(a, c) }, { field: 'Consumo', before: `${money(a, c)} en Starbucks Larcomar`, after: 'Revertido' }] }; }
    case 'consumo_manual': { const a = [15, 40, 80][i % 3]; return { type, title: `Giftcard •••• ${last4} · Consumo manual`, entity: { kind: 'giftcard', id: last4, label: `•••• ${last4}` }, country: c, amount: a, quantity: null,
      changes: [{ field: 'Saldo', before: money(100, c), after: money(100 - a, c) }, { field: 'Local', before: '—', after: 'Cineplanet Alcázar' }] }; }
    case 'extension_vigencia': return { type, title: `Giftcard •••• ${last4} · Extensión de vigencia`, entity: { kind: 'giftcard', id: last4, label: `•••• ${last4}` }, country: c, amount: null, quantity: 1,
      changes: [{ field: 'Vence', before: '31 dic. 2026', after: '31 mar. 2027' }] };
    case 'liquidacion': { const a = Math.round(40000 + r() * 90000); const code = `LQ-${2026}-${String(300 + i).padStart(4, '0')}`;
      return { type, title: `Liquidación ${code} · ${12 + (i % 9)} franquicias`, entity: { kind: 'liquidacion', id: code, label: code }, country: c, amount: a, quantity: 12 + (i % 9),
        changes: [{ field: 'Estado', before: 'Pendiente de aprobación', after: 'Pendiente de firma' }, { field: 'Total a pagar', before: '—', after: money(a, c) }] }; }
    case 'archivo_pago': { const a = Math.round(80000 + r() * 150000); const code = `PG-${2026}-${String(80 + i).padStart(4, '0')}`;
      return { type, title: `Archivo de pago ${code} · BCP`, entity: { kind: 'pago', id: code, label: code }, country: c, amount: a, quantity: 8 + (i % 7),
        changes: [{ field: 'Estado de las liquidaciones', before: 'Por pagar', after: 'En pago' }, { field: 'Banco', before: '—', after: 'BCP · formato TXT' }] }; }
    default: return { type, title: `Regla antifraude · Límite de canjes por día`, entity: { kind: 'regla', id: 'R-07', label: 'R-07' }, country: c, amount: null, quantity: null,
      changes: [{ field: 'Canjes por giftcard y día', before: '5', after: '3' }, { field: 'Acción al superar', before: 'Alertar', after: 'Retener para revisión' }] };
  }
}

function generate(): Approval[] {
  const r = rng(707);
  const voidable = LOTES.filter(l => l.state === 'activated' && l.available > 0);
  const lotsFor = LOTES.filter(l => l.state !== 'expired' && l.state !== 'voided' && l.available > 0);
  const out: Approval[] = [];
  let seq = 100;
  // 25 pendientes (sección 11) + 40 resueltas. Ana tiene solicitudes pendientes, ejecutadas y rechazadas para "Mis solicitudes".
  const plan: { type: ApprovalType; state: Approval['state']; maker?: string }[] = [
    ...(['lote_void', 'lote_void', 'lote_void', 'envio_masivo', 'envio_masivo', 'emision', 'emision', 'activacion_masiva', 'reverso', 'reverso', 'consumo_manual',
      'consumo_manual', 'extension_vigencia', 'extension_vigencia', 'liquidacion', 'liquidacion', 'liquidacion', 'liquidacion', 'archivo_pago', 'archivo_pago',
      'regla_antifraude', 'envio_masivo', 'reverso', 'liquidacion', 'emision'] as ApprovalType[]).map((type, i) => ({ type, state: 'pending' as const, maker: i === 1 || i === 5 ? 'u-ana' : undefined })),
    ...Array.from({ length: 40 }, (_, i) => {
      const type = ['lote_void', 'envio_masivo', 'emision', 'reverso', 'liquidacion', 'archivo_pago', 'consumo_manual', 'extension_vigencia'][i % 8] as ApprovalType;
      return { type, state: (i % 5 === 0 ? 'rejected' : 'executed') as Approval['state'], maker: i < 6 && MAKERS[type].includes('u-ana') ? 'u-ana' : undefined };
    }),
  ];
  plan.forEach((p, i) => {
    const pending = p.state === 'pending';
    const lot = p.type === 'lote_void' ? (pending ? voidable[(i * 13) % voidable.length] : lotsFor[(i * 7) % lotsFor.length]) : lotsFor[(i * 11) % lotsFor.length];
    const makerId = p.maker ?? MAKERS[p.type][i % MAKERS[p.type].length] ?? 'u-carlos';
    const maker = user(makerId === 'u-ana' && !p.maker ? 'u-carlos' : makerId);
    const roles = APPROVER_ROLES[p.type];
    const checker = DEMO_USERS.find(u => roles.includes(u.role) && u.id !== maker.id && u.id !== 'u-ana') ?? user('u-mario');
    const daysAgo = pending ? (i % 6) : 7 + i;
    const base = build(p.type, i, r, lot);
    const a: Approval = {
      ...base, id: `AP-${++seq}`, state: p.state, reason: REASONS[p.type][i % REASONS[p.type].length], requestedBy: who(maker), requestedAt: at(daysAgo, 9 + (i % 8)),
      approverRoles: roles, decidedBy: pending ? null : who(checker), decidedAt: pending ? null : at(daysAgo - 1, 15),
      comment: p.state === 'rejected' ? REJECT_COMMENTS[i % REJECT_COMMENTS.length] : null, executedAt: p.state === 'executed' ? at(daysAgo - 1, 15) : null,
    };
    out.push(a);
    // Una anulación pendiente se ve en la ficha del lote (quién solicitó y quién aprueba).
    if (pending && p.type === 'lote_void' && lot && !lot.pendingVoid) {
      lot.pendingVoid = { id: a.id, count: a.quantity ?? 0, scope: 'all', reason: a.reason, requestedBy: maker.name, requestedAt: a.requestedAt, approverRole: roles.join(' o '), state: 'pending' };
    }
  });
  return out;
}

export const APPROVALS: Approval[] = generate();
let nextId = 900;

/** Crea la solicitud de anulación de un lote (la llama el handler de Lotes). */
export function createLotVoidApproval(l: Lote, count: number, scope: 'all' | 'selection', reason: string, requester: SessionUser): Approval {
  const a: Approval = {
    id: `AP-${++nextId}`, type: 'lote_void', state: 'pending', title: `Lote #${l.id} · ${l.name} · ${l.client}`, entity: { kind: 'lote', id: l.id, label: `#${l.id}` },
    country: l.country, amount: count * l.unitAmount, quantity: count, reason, requestedBy: who(requester), requestedAt: new Date().toISOString().slice(0, 19),
    approverRoles: APPROVER_ROLES.lote_void,
    changes: [{ field: 'Códigos disponibles', before: String(l.available), after: String(l.available - count) }, { field: 'Códigos anulados', before: String(l.voided), after: String(l.voided + count) },
      ...(scope === 'all' && l.activated === 0 ? [{ field: 'Estado del lote', before: 'Creado', after: 'Anulado' }] : [])],
    decidedBy: null, decidedAt: null, comment: null, executedAt: null,
  };
  APPROVALS.unshift(a);
  return a;
}
export function removeApproval(id: string) { const i = APPROVALS.findIndex(a => a.id === id); if (i >= 0) APPROVALS.splice(i, 1); }

/** Segregación de funciones: pendiente, otro usuario, con permiso de aprobar y con un rol checker del tipo. */
export function canDecide(a: Approval, u: SessionUser | null): 'ok' | 'not_pending' | 'self' | 'role' {
  if (a.state !== 'pending') return 'not_pending';
  if (!u || a.requestedBy.id === u.id) return 'self';
  if (!u.permissions.includes('aprobaciones.aprobar') || !a.approverRoles.includes(u.role)) return 'role';
  return 'ok';
}

const tabFilter = (q: ApprovalsQuery, u: SessionUser | null) => (a: Approval) =>
  q.tab === 'mis-solicitudes' ? a.requestedBy.id === u?.id : canDecide(a, u) === 'ok' && u!.countries.includes(a.country);

/** Lo que hará el backend: bandeja por usuario, filtros, conteos por pestaña y paginación. Las más recientes primero. */
export function queryApprovals(all: readonly Approval[], q: ApprovalsQuery, u: SessionUser | null): ApprovalsPage {
  const text = q.q.trim().toLowerCase();
  const matches = (a: Approval) => (!text || `${a.id} ${a.title} ${a.requestedBy.name} ${a.reason}`.toLowerCase().includes(text))
    && (!q.type.length || q.type.includes(a.type)) && (!q.country.length || q.country.includes(a.country)) && (!q.state.length || q.state.includes(a.state));
  const counts = {
    porAprobar: all.filter(tabFilter({ ...q, tab: 'por-aprobar' }, u)).length,
    misSolicitudes: all.filter(a => a.requestedBy.id === u?.id && a.state === 'pending').length,
  };
  const items = all.filter(tabFilter(q, u)).filter(matches).sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : a.requestedAt > b.requestedAt ? -1 : 0));
  return { items: items.slice((q.page - 1) * q.size, q.page * q.size), total: items.length, counts };
}

/** Aprueba (y ejecuta) o rechaza. Devuelve el código de error o null. Rechazar exige comentario. */
export function decide(a: Approval, d: Decision, comment: string, u: SessionUser | null): string | null {
  const can = canDecide(a, u);
  if (can !== 'ok') return can === 'not_pending' ? 'ALREADY_DECIDED' : can === 'self' ? 'SELF_APPROVAL' : 'FORBIDDEN';
  if (d === 'reject' && comment.trim().length < 5) return 'COMMENT_REQUIRED';
  const now = new Date().toISOString().slice(0, 19);
  a.decidedBy = who(u!); a.decidedAt = now; a.comment = comment.trim() || null;
  const lot = a.type === 'lote_void' && a.entity ? LOTES.find(l => l.id === a.entity!.id) : undefined;
  if (d === 'reject') { a.state = 'rejected'; if (lot?.pendingVoid?.id === a.id) lot.pendingVoid = null; return null; }
  a.state = 'executed'; a.executedAt = now;
  if (lot) applyLotVoid(lot, a.quantity ?? 0, lot.pendingVoid?.scope ?? 'all');
  return null;
}

export const ERROR_TEXT: Record<string, [number, string]> = {
  ALREADY_DECIDED: [409, 'La solicitud ya fue resuelta por otro usuario'],
  SELF_APPROVAL: [403, 'No puedes aprobar ni rechazar tu propia solicitud'],
  FORBIDDEN: [403, 'Tu rol no aprueba este tipo de operación'],
  COMMENT_REQUIRED: [422, 'Para rechazar, explica el motivo al solicitante'],
};

export const countryCurrency = (c: CountryCode) => countryByCode(c).currency;
export const ALL_COUNTRIES = COUNTRIES.map(c => c.code);
