import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PendingApprovals } from '../../core/approvals/pending-approvals.service';
import { approvalsApiParams } from './aprobaciones-query';
import { Approval, ApprovalsPage, ApprovalsQuery, Decision, DecisionResult } from './aprobaciones.models';

const base = `${environment.apiBase}/aprobaciones`;

/** Datos de la bandeja de aprobaciones. Tras decidir o retirar se actualiza el contador de la barra superior. */
@Injectable({ providedIn: 'root' })
export class AprobacionesService {
  private readonly http = inject(HttpClient);
  private readonly pending = inject(PendingApprovals);

  list(query: () => ApprovalsQuery) { return httpResource<ApprovalsPage>(() => ({ url: base, params: approvalsApiParams(query()) })); }
  detail(id: () => string) { return httpResource<Approval>(() => `${base}/${id()}`); }

  async decide(ids: string[], decision: Decision, comment: string): Promise<DecisionResult> {
    try { return await firstValueFrom(this.http.post<DecisionResult>(`${base}/decisiones`, { ids, decision, comment })); }
    finally { this.pending.refresh(); }
  }
  async withdraw(id: string): Promise<void> {
    try { await firstValueFrom(this.http.delete(`${base}/${id}`)); } finally { this.pending.refresh(); }
  }
}
