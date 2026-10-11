import { delay, http, HttpResponse } from 'msw';
import type { ZcNotification } from '@zonacards/ui/notifications';

/** Notificaciones de la barra superior (index.html, Notificaciones). En memoria: marcar como leídas dura la sesión. */
let NOTIFS: (ZcNotification & { link?: string })[] = [
  { id: 'n1', icon: 's:checklist-minimalistic', title: 'Luis Mendoza solicitó anular el lote #02834', meta: 'Aprobaciones · hace 5 min', kind: 'apr', unread: true, group: 'Hoy', link: '/aprobaciones' },
  { id: 'n2', icon: 's:danger-triangle', title: 'Stock bajo mínimo: Falabella S/ 50', meta: 'Alertas · hace 1 h', kind: 'alr', unread: true, group: 'Hoy', link: '/lotes' },
  { id: 'n3', icon: 's:check-circle', title: 'Archivo bancario aprobado (12 liquidaciones)', meta: 'Pagos · hace 3 h', kind: 'otro', unread: true, group: 'Hoy' },
  { id: 'n4', icon: 's:clock-circle', title: '254 códigos vencen en 7 días', meta: 'Alertas · ayer', kind: 'alr', unread: false, group: 'Anteriores', link: '/lotes' },
  { id: 'n5', icon: 's:plain', title: 'Envío "Bienvenida" terminó con 3 errores', meta: 'Envíos · ayer', kind: 'otro', unread: false, group: 'Anteriores' },
];

export const notificacionesHandlers = [
  http.get('/api/notificaciones', async () => { await delay(150); return HttpResponse.json({ items: NOTIFS }); }),
  /** Marca como leídas: { ids } o todas si no se envían. */
  http.post('/api/notificaciones/leidas', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { ids?: string[] };
    NOTIFS = NOTIFS.map(n => (!body.ids || body.ids.includes(n.id) ? { ...n, unread: false } : n));
    return HttpResponse.json({ ok: true });
  }),
];
