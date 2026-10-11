import { Routes } from '@angular/router';
import { CatalogoLayout } from './catalogo.layout';

/** /catalogo/<nivel>#<sección>: mismos ids que docs/design-system/index.html (http://localhost:4300/#<sección>). */
export const CATALOGO_ROUTES: Routes = [
  {
    path: '', component: CatalogoLayout, children: [
      { path: '', pathMatch: 'full', redirectTo: 'fundamentos' },
      { path: 'fundamentos', title: 'Fundamentos · Catálogo · Zonacards', loadComponent: () => import('./fundamentos.page').then(m => m.FundamentosPage) },
      { path: 'atomos', title: 'Átomos · Catálogo · Zonacards', loadComponent: () => import('./atomos.page').then(m => m.AtomosPage) },
      ...(['moleculas', 'organismos', 'plantillas'] as const).map(nivel => ({
        path: nivel, data: { nivel }, title: `${nivel === 'moleculas' ? 'Moléculas' : nivel === 'organismos' ? 'Organismos' : 'Plantillas'} · Catálogo · Zonacards`,
        loadComponent: () => import('./nivel.page').then(m => m.NivelPage),
      })),
    ],
  },
];
