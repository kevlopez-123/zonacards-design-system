import { delay, http, HttpResponse } from 'msw';
import { LOTES } from '../fixtures/lotes';

/**
 * Escenarios con ?scenario= en la URL de la app: vacio, error, lento.
 * Así se prueban los estados de cada pantalla sin backend.
 */
const scenario = () => new URLSearchParams(location.search).get('scenario');

export const lotesHandlers = [
  http.get('/api/lotes', async ({ request }) => {
    const s = scenario();
    await delay(s === 'lento' ? 3000 : 300);
    if (s === 'error') return HttpResponse.json({ code: 'SERVICE_TIMEOUT', message: 'El servicio no respondió a tiempo' }, { status: 503 });
    if (s === 'vacio') return HttpResponse.json({ items: [], total: 0 });
    const q = new URL(request.url).searchParams.get('q')?.toLowerCase() ?? '';
    const items = LOTES.filter(l => !q || (l.name + l.client + l.id).toLowerCase().includes(q));
    return HttpResponse.json({ items, total: items.length });
  }),
];
