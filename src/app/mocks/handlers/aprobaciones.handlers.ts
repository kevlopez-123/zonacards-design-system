import { delay, http, HttpResponse } from 'msw';
import { parseApprovalsQuery } from '../../features/aprobaciones/aprobaciones-query';
import type { Approval, Decision, DecisionResult } from '../../features/aprobaciones/aprobaciones.models';
import { APPROVALS, ERROR_TEXT, canDecide, decide, queryApprovals, removeApproval } from '../fixtures/aprobaciones';
import { LOTES } from '../fixtures/lotes';
import { demoUser } from '../users';

/** Escenarios ?scenario=vacio|error|lento, como en Lotes. El usuario actual llega en X-Demo-User (en producción, el token). */
const scenario = () => new URLSearchParams(location.search).get('scenario');
const wait = () => delay(scenario() === 'lento' ? 3000 : 250);
const me = (r: Request) => demoUser(r.headers.get('X-Demo-User'));
const withAllowed = (a: Approval, r: Request): Approval => ({ ...a, allowed: canDecide(a, me(r)) });
const fail = (code: string) => { const [status, message] = ERROR_TEXT[code] ?? [400, code]; return HttpResponse.json({ code, message }, { status }); };

export const aprobacionesHandlers = [
  http.get('/api/aprobaciones', async ({ request }) => {
    await wait();
    if (scenario() === 'error') return HttpResponse.json({ code: 'SERVICE_TIMEOUT', message: 'El servicio no respondió a tiempo' }, { status: 503 });
    if (scenario() === 'vacio') return HttpResponse.json({ items: [], total: 0, counts: { porAprobar: 0, misSolicitudes: 0 } });
    const url = new URL(request.url);
    const page = queryApprovals(APPROVALS, parseApprovalsQuery(k => url.searchParams.get(k)), me(request));
    return HttpResponse.json({ ...page, items: page.items.map(a => withAllowed(a, request)) });
  }),

  /** Contador de la barra superior. */
  http.get('/api/aprobaciones/resumen', async ({ request }) => {
    await delay(150);
    if (scenario() === 'vacio') return HttpResponse.json({ porAprobar: 0 });
    const u = me(request);
    return HttpResponse.json({ porAprobar: APPROVALS.filter(a => canDecide(a, u) === 'ok' && u!.countries.includes(a.country)).length });
  }),

  http.get('/api/aprobaciones/:id', async ({ params, request }) => {
    await wait();
    const a = APPROVALS.find(x => x.id === params['id']);
    return a ? HttpResponse.json(withAllowed(a, request)) : HttpResponse.json({ code: 'NOT_FOUND', message: 'No existe la solicitud' }, { status: 404 });
  }),

  /** Aprobar o rechazar una o varias. Resultado parcial: lo que no se pudo vuelve con su motivo ("Aprobamos 4 de 5"). */
  http.post('/api/aprobaciones/decisiones', async ({ request }) => {
    await delay(scenario() === 'lento' ? 3000 : 600);
    const body = (await request.json()) as { ids: string[]; decision: Decision; comment?: string };
    if (body.decision === 'reject' && (body.comment ?? '').trim().length < 5) return fail('COMMENT_REQUIRED');
    const res: DecisionResult = { ok: [], failed: [] };
    for (const id of body.ids) {
      const a = APPROVALS.find(x => x.id === id);
      const err = a ? decide(a, body.decision, body.comment ?? '', me(request)) : 'NOT_FOUND';
      if (err) res.failed.push({ id, code: err, message: ERROR_TEXT[err]?.[1] ?? 'No existe la solicitud' });
      else res.ok.push(id);
    }
    return HttpResponse.json(res);
  }),

  /** Retirar: solo quien solicitó y mientras esté pendiente. */
  http.delete('/api/aprobaciones/:id', async ({ params, request }) => {
    await delay(300);
    const a = APPROVALS.find(x => x.id === params['id']);
    if (!a) return HttpResponse.json({ code: 'NOT_FOUND', message: 'No existe la solicitud' }, { status: 404 });
    if (a.state !== 'pending') return fail('ALREADY_DECIDED');
    if (a.requestedBy.id !== me(request)?.id) return HttpResponse.json({ code: 'FORBIDDEN', message: 'Solo quien solicitó puede retirar la solicitud' }, { status: 403 });
    const lot = a.type === 'lote_void' ? LOTES.find(l => l.id === a.entity?.id) : undefined;
    if (lot?.pendingVoid?.id === a.id) lot.pendingVoid = null;
    removeApproval(a.id);
    return new HttpResponse(null, { status: 204 });
  }),
];
