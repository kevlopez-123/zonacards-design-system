import { delay, http, HttpResponse } from 'msw';
import { parseLotesQuery } from '../../features/lotes/lotes-query';
import type { VoidRequest } from '../../features/lotes/lotes.models';
import { LOTES, lotCodes, lotesBrands, lotesClients, lotesPrograms, lotHistory, lotSends, queryLotes } from '../fixtures/lotes';

/**
 * Escenarios con ?scenario= en la URL de la app: vacio, error, lento.
 * Así se prueban los estados de cada pantalla sin backend.
 */
const scenario = () => new URLSearchParams(location.search).get('scenario');
const wait = () => delay(scenario() === 'lento' ? 3000 : 250);
const failure = () => HttpResponse.json({ code: 'SERVICE_TIMEOUT', message: 'El servicio no respondió a tiempo' }, { status: 503 });
const notFound = () => HttpResponse.json({ code: 'NOT_FOUND', message: 'No existe el lote' }, { status: 404 });
const byId = (id: string) => LOTES.find(l => l.id === id);
let voidSeq = 400;

export const lotesHandlers = [
  http.get('/api/lotes', async ({ request }) => {
    await wait();
    if (scenario() === 'error') return failure();
    const url = new URL(request.url);
    const q = parseLotesQuery(k => url.searchParams.get(k));
    if (scenario() === 'vacio') return HttpResponse.json({ items: [], total: 0, overall: 0, counts: { created: 0, activated: 0, expired: 0, voided: 0 } });
    // ?todo=1: todas las filas con los filtros aplicados (exportaciones).
    if (url.searchParams.get('todo') === '1') { q.page = 1; q.size = LOTES.length; }
    return HttpResponse.json(queryLotes(LOTES, q));
  }),

  http.get('/api/lotes/opciones', async () => {
    await wait();
    return HttpResponse.json({ clients: lotesClients(), programs: lotesPrograms(), brands: lotesBrands() });
  }),

  http.get('/api/lotes/:id', async ({ params }) => {
    await wait();
    if (scenario() === 'error') return failure();
    const l = byId(String(params['id']));
    return l ? HttpResponse.json(l) : notFound();
  }),

  http.get('/api/lotes/:id/codigos', async ({ params, request }) => {
    await wait();
    const l = byId(String(params['id']));
    if (!l) return notFound();
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('pagina')) || 1);
    const size = Math.min(100, Number(url.searchParams.get('filas')) || 25);
    const all = lotCodes(l);
    if (url.searchParams.get('todo') === '1') return HttpResponse.json({ items: all, total: all.length });
    return HttpResponse.json({ items: all.slice((page - 1) * size, page * size), total: all.length });
  }),

  http.get('/api/lotes/:id/envios', async ({ params }) => {
    await wait();
    const l = byId(String(params['id']));
    return l ? HttpResponse.json(lotSends(l)) : notFound();
  }),

  http.get('/api/lotes/:id/historial', async ({ params }) => {
    await wait();
    const l = byId(String(params['id']));
    return l ? HttpResponse.json(lotHistory(l)) : notFound();
  }),

  /** Solicitud de anulación: no anula, queda pendiente de aprobación de un segundo usuario (doble aprobación). */
  http.post('/api/lotes/:id/anulaciones', async ({ params, request }) => {
    await delay(scenario() === 'lento' ? 3000 : 600);
    const l = byId(String(params['id']));
    if (!l) return notFound();
    const body = (await request.json()) as { reason?: string; scope?: 'all' | 'selection'; codes?: string[]; requestedBy?: string };
    if (l.pendingVoid) return HttpResponse.json({ code: 'VOID_PENDING', message: 'Ya hay una anulación pendiente de aprobación' }, { status: 409 });
    if (!body.reason || body.reason.trim().length < 5) return HttpResponse.json({ code: 'VALIDATION', message: 'Falta el motivo', fieldErrors: { reason: 'Escribe al menos 5 caracteres.' } }, { status: 422 });
    const count = body.scope === 'selection' ? body.codes?.length ?? 0 : l.available;
    if (!count) return HttpResponse.json({ code: 'NOTHING_TO_VOID', message: 'El lote no tiene códigos disponibles para anular' }, { status: 422 });
    const req: VoidRequest = {
      id: `AP-${++voidSeq}`, count, scope: body.scope ?? 'all', reason: body.reason.trim(), requestedBy: body.requestedBy ?? 'Usuario',
      requestedAt: new Date().toISOString().slice(0, 19), approverRole: 'Supervisor de Operaciones', state: 'pending',
    };
    l.pendingVoid = req;
    return HttpResponse.json(req, { status: 202 });
  }),

  /** Quien solicitó puede retirar la solicitud mientras está pendiente. */
  http.delete('/api/lotes/:id/anulaciones/:req', async ({ params }) => {
    await delay(300);
    const l = byId(String(params['id']));
    if (!l?.pendingVoid || l.pendingVoid.id !== params['req']) return notFound();
    l.pendingVoid = null;
    return new HttpResponse(null, { status: 204 });
  }),
];
