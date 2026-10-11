import { httpResource } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { SessionService } from '../session/session.service';

/**
 * Cantidad de solicitudes que el usuario puede aprobar, para el acceso directo de la barra superior
 * (las aprobaciones tienen acceso desde la barra, sección "Arquitectura de información").
 * Sin permiso de aprobar no se pide nada y el acceso no se muestra.
 */
@Injectable({ providedIn: 'root' })
export class PendingApprovals {
  private readonly session = inject(SessionService);
  readonly visible = computed(() => this.session.can('aprobaciones.ver'));
  // El id del usuario va en la petición para que el contador se vuelva a pedir al cambiar de usuario.
  private readonly res = httpResource<{ porAprobar: number }>(() =>
    (this.visible() ? { url: `${environment.apiBase}/aprobaciones/resumen`, params: { usuario: this.session.user()?.id ?? '' } } : undefined));
  readonly count = computed(() => (this.res.hasValue() ? this.res.value().porAprobar : 0));
  refresh() { this.res.reload(); }
}
