import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { lotesApiParams } from './lotes-query';
import { CodesPage, Lote, LoteEvent, LoteSend, LotesPage, LotesQuery, VoidRequest } from './lotes.models';

export interface LotesOptions { clients: string[]; programs: string[]; brands: string[]; }
export interface VoidBody { reason: string; scope: 'all' | 'selection'; codes?: string[]; requestedBy: string; }

const base = `${environment.apiBase}/lotes`;

/**
 * Datos del dominio Lotes. Los recursos se crean desde cada página (en su contexto de inyección) para que se
 * cancelen al salir; el estado de interfaz (vista, filtros abiertos) vive en el componente y en la URL.
 */
@Injectable({ providedIn: 'root' })
export class LotesService {
  private readonly http = inject(HttpClient);

  /** Listado paginado en servidor con conteos por estado para los KPI. */
  list(query: () => LotesQuery) {
    return httpResource<LotesPage>(() => ({ url: base, params: lotesApiParams(query()) }));
  }
  options() { return httpResource<LotesOptions>(() => `${base}/opciones`); }
  detail(id: () => string) { return httpResource<Lote>(() => `${base}/${id()}`); }
  codes(id: () => string, page: () => number, size: () => number) {
    return httpResource<CodesPage>(() => ({ url: `${base}/${id()}/codigos`, params: { pagina: page(), filas: size() } }));
  }
  sends(id: () => string) { return httpResource<LoteSend[]>(() => `${base}/${id()}/envios`); }
  history(id: () => string) { return httpResource<LoteEvent[]>(() => `${base}/${id()}/historial`); }

  /** Todas las filas con los filtros aplicados, para Excel, CSV y PDF. */
  async exportAll(q: LotesQuery): Promise<Lote[]> {
    const page = await firstValueFrom(this.http.get<LotesPage>(base, { params: { ...lotesApiParams(q), todo: '1' } }));
    return page.items;
  }

  /** Todos los códigos del lote, enmascarados (nunca el código completo ni CVV). */
  async allCodes(id: string): Promise<CodesPage> {
    return firstValueFrom(this.http.get<CodesPage>(`${base}/${id}/codigos`, { params: { todo: '1' } }));
  }

  /** La anulación no se ejecuta: queda pendiente de aprobación de un segundo usuario. */
  requestVoid(id: string, body: VoidBody): Promise<VoidRequest> {
    return firstValueFrom(this.http.post<VoidRequest>(`${base}/${id}/anulaciones`, body));
  }
  cancelVoid(id: string, requestId: string): Promise<unknown> {
    return firstValueFrom(this.http.delete(`${base}/${id}/anulaciones/${requestId}`));
  }
}
