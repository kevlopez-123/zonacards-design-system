import { describe, expect, it } from 'vitest';
import { APPROVALS, canDecide, createLotVoidApproval, decide, queryApprovals } from '../../mocks/fixtures/aprobaciones';
import { LOTES } from '../../mocks/fixtures/lotes';
import { demoUser } from '../../mocks/users';
import { DEFAULT_QUERY, approvalsApiParams, approvalsQueryParams, parseApprovalsQuery } from './aprobaciones-query';
import { decisionSummary } from './aprobaciones-ui';
import { Approval } from './aprobaciones.models';

const ana = demoUser('u-ana')!, carlos = demoUser('u-carlos')!, lucia = demoUser('u-lucia')!;
const parse = (qs: string) => { const p = new URLSearchParams(qs); return parseApprovalsQuery(k => p.get(k)); };

describe('Aprobaciones: datos simulados', () => {
  it('25 pendientes, de varios tipos, y solicitudes propias de Ana para "Mis solicitudes"', () => {
    expect(APPROVALS.filter(a => a.state === 'pending')).toHaveLength(25);
    expect(new Set(APPROVALS.map(a => a.type)).size).toBeGreaterThanOrEqual(8);
    expect(APPROVALS.some(a => a.requestedBy.id === ana.id && a.state === 'pending')).toBe(true);
    expect(APPROVALS.filter(a => a.state === 'rejected').every(a => !!a.comment)).toBe(true);
  });

  it('las anulaciones pendientes se ven en la ficha del lote', () => {
    const pendingVoids = APPROVALS.filter(a => a.type === 'lote_void' && a.state === 'pending');
    for (const a of pendingVoids) expect(LOTES.find(l => l.id === a.entity!.id)!.pendingVoid?.id).toBe(a.id);
  });
});

describe('Aprobaciones: segregación de funciones', () => {
  const own = APPROVALS.find(a => a.state === 'pending' && a.requestedBy.id === ana.id)!;
  const liq = APPROVALS.find(a => a.state === 'pending' && a.type === 'liquidacion')!;

  it('nadie aprueba su propia solicitud; el rol debe ser checker del tipo', () => {
    expect(canDecide(own, ana)).toBe('self');
    expect(canDecide(own, carlos)).toBe('ok');
    expect(canDecide(liq, ana)).toBe('role');
    expect(canDecide(liq, lucia)).toBe('ok');
  });

  it('"Por aprobar" nunca incluye las propias; "Mis solicitudes" solo las propias', () => {
    const inbox = queryApprovals(APPROVALS, { ...DEFAULT_QUERY, size: 100 }, ana);
    expect(inbox.items.every(a => a.requestedBy.id !== ana.id && canDecide(a, ana) === 'ok')).toBe(true);
    expect(inbox.items.every(a => ana.countries.includes(a.country))).toBe(true);
    const mine = queryApprovals(APPROVALS, { ...DEFAULT_QUERY, tab: 'mis-solicitudes', size: 100 }, ana);
    expect(mine.items.every(a => a.requestedBy.id === ana.id)).toBe(true);
    expect(mine.counts.misSolicitudes).toBe(mine.items.filter(a => a.state === 'pending').length);
  });

  it('rechazar exige comentario; una solicitud resuelta no se puede volver a resolver', () => {
    const a = structuredClone(liq) as Approval;
    expect(decide(a, 'reject', 'no', lucia)).toBe('COMMENT_REQUIRED');
    expect(decide(a, 'reject', 'Falta el sustento del cliente', lucia)).toBeNull();
    expect(a.state).toBe('rejected');
    expect(a.decidedBy?.id).toBe(lucia.id);
    expect(decide(a, 'approve', '', lucia)).toBe('ALREADY_DECIDED');
  });

  it('aprobar una anulación de lote la ejecuta en el lote', () => {
    const lot = LOTES.find(l => l.state === 'activated' && l.available > 0 && !l.pendingVoid)!;
    const before = lot.available;
    const a = createLotVoidApproval(lot, before, 'all', 'Pedido duplicado', ana);
    lot.pendingVoid = { id: a.id, count: before, scope: 'all', reason: a.reason, requestedBy: ana.name, requestedAt: a.requestedAt, approverRole: '', state: 'pending' };
    expect(decide(a, 'approve', '', ana)).toBe('SELF_APPROVAL');
    expect(decide(a, 'approve', '', carlos)).toBeNull();
    expect(a.state).toBe('executed');
    expect(lot.available).toBe(0);
    expect(lot.voided).toBe(before);
    expect(lot.pendingVoid).toBeNull();
  });
});

describe('Aprobaciones: resumen antes de confirmar', () => {
  it('cuenta por tipo, suma cantidades y agrupa montos por moneda (nunca mezcla monedas)', () => {
    const mk = (type: Approval['type'], country: Approval['country'], amount: number | null, quantity: number | null) => ({ type, country, amount, quantity }) as Approval;
    const s = decisionSummary([mk('liquidacion', 'pe', 1000, 10), mk('liquidacion', 'pe', 500, 5), mk('archivo_pago', 'cl', 20000, 3), mk('regla_antifraude', 'pe', null, null)]);
    expect(s.count).toBe(4);
    expect(s.byType).toEqual([{ type: 'liquidacion', n: 2 }, { type: 'archivo_pago', n: 1 }, { type: 'regla_antifraude', n: 1 }]);
    expect(s.quantity).toBe(18);
    expect(s.money.map(m => m.currency)).toEqual(['CLP', 'PEN']);
    expect(s.money.find(m => m.currency === 'PEN')!.text).toContain('1,500.00');
  });
});

describe('Aprobaciones: URL', () => {
  it('lee y escribe la bandeja, filtros y página; ignora lo inválido', () => {
    const q = parse('bandeja=mis-solicitudes&tipo=liquidacion,foo&pais=pe&estado=rejected,xx&pagina=2');
    expect(q).toMatchObject({ tab: 'mis-solicitudes', type: ['liquidacion'], country: ['pe'], state: ['rejected'], page: 2, size: 25 });
    expect(parse('bandeja=otra').tab).toBe('por-aprobar');
    expect(Object.values(approvalsQueryParams(DEFAULT_QUERY)).every(v => v === null)).toBe(true);
    expect(approvalsApiParams(DEFAULT_QUERY)).toEqual({ bandeja: 'por-aprobar', pagina: '1', filas: '25' });
  });
});
