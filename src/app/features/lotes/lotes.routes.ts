import { Routes } from '@angular/router';
import { canActivatePermission } from '../../core/session/guards';

/** Rutas de Lotes (sección "Rutas principales" de la especificación): listado, nuevo y ficha. */
export const LOTES_ROUTES: Routes = [
  { path: '', title: 'Lotes · Zonacards', loadComponent: () => import('./lotes.page').then(m => m.LotesPage) },
  { path: 'nuevo', title: 'Nuevo lote · Zonacards', canActivate: [canActivatePermission('lotes.crear')], loadComponent: () => import('./nuevo-lote.page').then(m => m.NuevoLotePage) },
  { path: ':id', title: 'Lote · Zonacards', loadComponent: () => import('./lote-detail.page').then(m => m.LoteDetailPage) },
];
