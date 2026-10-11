import { Routes } from '@angular/router';

/** Bandeja de aprobaciones y detalle (sección 8.10). El guard de permiso está en app.routes. */
export const APROBACIONES_ROUTES: Routes = [
  { path: '', title: 'Aprobaciones · Zonacards', loadComponent: () => import('./aprobaciones.page').then(m => m.AprobacionesPage) },
  { path: ':id', title: 'Solicitud · Zonacards', loadComponent: () => import('./aprobacion-detail.page').then(m => m.AprobacionDetailPage) },
];
