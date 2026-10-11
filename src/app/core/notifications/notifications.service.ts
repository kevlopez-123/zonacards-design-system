import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject, linkedSignal } from '@angular/core';
import { environment } from '../../../environments/environment';
import type { ZcNotification } from '@zonacards/ui/notifications';

export type AppNotification = ZcNotification & { link?: string };

/** Notificaciones del usuario para la campana de la barra superior. Marcar como leídas se guarda en el servidor. */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly res = httpResource<{ items: AppNotification[] }>(() => `${environment.apiBase}/notificaciones`);
  /** Copia local editable (la campana la actualiza al leer); se rehace cuando llega la respuesta. */
  readonly items = linkedSignal<AppNotification[]>(() => (this.res.hasValue() ? this.res.value().items : []));

  /** Sincroniza con el servidor lo que el panel marcó como leído. */
  persist(next: AppNotification[]) {
    const read = next.filter(n => !n.unread && this.items().find(x => x.id === n.id)?.unread).map(n => n.id);
    this.items.set(next);
    if (read.length) this.http.post(`${environment.apiBase}/notificaciones/leidas`, { ids: read }).subscribe({ error: () => this.res.reload() });
  }
}
