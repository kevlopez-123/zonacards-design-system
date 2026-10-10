import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Lote } from '../../mocks/fixtures/lotes';

export interface LotesPage { items: Lote[]; total: number; }

/** Datos del dominio Lotes. El estado de interfaz (vista, filtros abiertos) vive en el componente. */
@Injectable({ providedIn: 'root' })
export class LotesService {
  readonly query = signal('');
  /** httpResource: una sola petición por cambio de parámetros, cancelación automática y estados loading/error. */
  readonly lotes = httpResource<LotesPage>(() => ({ url: `${environment.apiBase}/lotes`, params: { q: this.query() } }));
}
