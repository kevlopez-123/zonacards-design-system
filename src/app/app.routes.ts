import { Routes } from '@angular/router';
import { canActivatePermission } from './core/session/guards';
import { ShellComponent } from './layout/shell/shell.component';

/** Cada dominio carga diferido y no importa de otro dominio (sección 12 de las reglas). */
export const routes: Routes = [
  {
    path: '', component: ShellComponent, children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', title: 'Inicio · Zonacards', loadComponent: () => import('./features/sistema/sistema.pages').then(m => m.InicioPage) },
      { path: 'lotes', canActivate: [canActivatePermission('lotes.ver')], loadChildren: () => import('./features/lotes/lotes.routes').then(m => m.LOTES_ROUTES) },
      { path: 'aprobaciones', canActivate: [canActivatePermission('aprobaciones.ver')], loadChildren: () => import('./features/aprobaciones/aprobaciones.routes').then(m => m.APROBACIONES_ROUTES) },
      { path: 'catalogo', loadChildren: () => import('./features/catalogo/catalogo.routes').then(m => m.CATALOGO_ROUTES) },
      { path: 'sin-acceso', title: 'Sin acceso · Zonacards', loadComponent: () => import('./features/sistema/sistema.pages').then(m => m.SinAccesoPage) },
      { path: '**', title: 'No encontrada · Zonacards', loadComponent: () => import('./features/sistema/sistema.pages').then(m => m.NoEncontradaPage) },
    ],
  },
];
