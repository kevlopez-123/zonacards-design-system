import { Routes } from '@angular/router';
import { CATALOGO_ROUTES } from '../../../../src/app/features/catalogo/catalogo.routes';

/**
 * Sitio de documentación: guías en Markdown (las mismas que viajan en el paquete), tokens, el catálogo vivo de la app de
 * administración (mismas demostraciones que prueban los e2e) y la API generada desde el código.
 * Cada guía se carga al abrirla (markdown.page.ts): el Markdown no entra en el paquete inicial.
 */
const md = (title: string, doc: string) => ({ title: `${title} · Zonacards UI`, loadComponent: () => import('./markdown.page').then(m => m.MarkdownPage), data: { doc, heading: title } });

export const DOCS_ROUTES: Routes = [
  {
    path: '', loadComponent: () => import('./docs-shell').then(m => m.DocsShell), children: [
      { path: '', title: 'Zonacards UI · Sistema de diseño', loadComponent: () => import('./home.page').then(m => m.HomePage) },
      { path: 'empezar', ...md('Empezar', 'setup') },
      { path: 'paquete', ...md('El paquete', 'readme') },
      { path: 'tokens', title: 'Tokens · Zonacards UI', loadComponent: () => import('./tokens.page').then(m => m.TokensPage) },
      { path: 'componentes', children: CATALOGO_ROUTES },
      { path: 'api', ...md('API de componentes', 'api') },
      { path: 'guia-ia', ...md('Guía para asistentes de código', 'skill') },
      { path: 'revision', ...md('Revisión antes de terminar', 'checklist') },
      { path: 'cambios', ...md('Cambios', 'changelog') },
      { path: '**', redirectTo: '' },
    ],
  },
];
