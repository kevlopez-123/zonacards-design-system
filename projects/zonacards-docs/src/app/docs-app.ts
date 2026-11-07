import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ToasterComponent } from '@zonacards/ui/toast';

@Component({
  selector: 'zc-docs-app',
  imports: [RouterOutlet, ToasterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet /><zc-toaster />`,
})
export class DocsApp {
  constructor() {
    // GitHub Pages no reescribe rutas: su 404.html guarda la ruta pedida y vuelve al inicio; aquí se retoma.
    try {
      const saved = sessionStorage.getItem('zc-docs-path');
      if (saved) { sessionStorage.removeItem('zc-docs-path'); void inject(Router).navigateByUrl(saved); }
    } catch { /* sin almacenamiento */ }
  }
}
