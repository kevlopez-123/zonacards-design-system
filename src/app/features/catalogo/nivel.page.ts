import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from '../../shared/ui/atoms/button/button.directive';
import { IconComponent } from '../../shared/ui/atoms/icon/icon.component';
import { DataSection } from './data.section';
import { CATALOG } from './ds/catalog-index';
import { DsGroupComponent, DsLevelComponent, DsPendingComponent, DsSectionComponent } from './ds/ds-layout';
import { FormMoleculesSection } from './form-molecules.section';
import { NavFeedbackSection } from './nav-feedback.section';
import { StructureSection } from './structure.section';

type Host = 'form' | 'nav' | 'structure' | 'data';
/** Sección del DS → componente del catálogo que la dibuja y qué partes. Las que no están aquí se muestran como pendientes. */
const PORTED: Record<string, [Host, string[]]> = {
  'm-select': ['form', ['c-select']], 'm-auto': ['form', ['c-auto']], 'm-special': ['form', ['c-special']], 'm-dates': ['form', ['c-dates']],
  'm-nav': ['nav', ['c-nav']], 'm-pager': ['nav', ['c-pager']], 'm-feedback': ['nav', ['c-feedback', 'c-menu']], 'm-accordion': ['nav', ['c-acc']], 'm-upload': ['nav', ['c-upload']],
  'o-sidebar': ['structure', ['c-sidebar', 'c-pagehead']], 'o-filter': ['structure', ['c-overlays']], 'o-wizard': ['structure', ['c-stepper']],
  'o-cards': ['data', ['c-kpi']], 'o-table': ['data', ['c-list']], 'o-charts': ['data', ['c-charts']], 'o-states': ['data', ['c-state']],
};

/**
 * Catálogo · Moléculas, Organismos y Plantillas: mismos grupos y secciones que docs/design-system/index.html.
 * Las secciones ya portadas reutilizan las demos existentes; el resto queda marcado como pendiente en su lugar.
 */
@Component({
  selector: 'zc-catalogo-nivel',
  imports: [
    RouterLink, ButtonDirective, IconComponent, DsLevelComponent, DsGroupComponent, DsSectionComponent, DsPendingComponent,
    FormMoleculesSection, NavFeedbackSection, StructureSection, DataSection,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (level(); as l) {
      <div class="grid grid-cols-[minmax(0,1fr)] gap-12">
        <zc-ds-level [title]="l.title" [subtitle]="l.subtitle" />
        @for (g of l.groups; track g.title) {
          <zc-ds-group [title]="g.title" [count]="g.sections.length" />
          @for (s of g.sections; track s.id) {
            @if (ported(s.id); as p) {
              <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-12">
                @switch (p[0]) {
                  @case ('form') { <zc-catalogo-form-molecules [parts]="p[1]" /> }
                  @case ('nav') { <zc-catalogo-nav-feedback [parts]="p[1]" /> }
                  @case ('structure') { <zc-catalogo-structure [parts]="p[1]" /> }
                  @case ('data') { <zc-catalogo-data [parts]="p[1]" /> }
                }
              </div>
            } @else if (s.id === 'p-lotes') {
              <zc-ds-section dsId="p-lotes" title="Página: Lotes" description="Plantilla de listado completa con filtros en la URL, KPI, vista tarjetas/tabla, ficha y acciones con aprobación.">
                <div class="flex flex-wrap items-center gap-3">
                  <a zcButton routerLink="/lotes"><zc-icon name="s:box" [size]="16" />Abrir Lotes</a>
                  <a zcButton variant="outline" routerLink="/aprobaciones">Abrir Aprobaciones</a>
                </div>
              </zc-ds-section>
            } @else {
              <zc-ds-pending [dsId]="s.id" [title]="s.title" />
            }
          }
        }
      </div>
    }`,
})
export class NivelPage {
  /** Ruta del nivel (moleculas, organismos, plantillas); llega por los datos de la ruta. */
  readonly nivel = input.required<string>();
  readonly level = computed(() => CATALOG.find(l => l.route === this.nivel()) ?? null);
  ported(id: string) { return PORTED[id] ?? null; }
}
