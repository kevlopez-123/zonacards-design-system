import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CardsTemplatesSection } from './cards-templates.section';
import { DataSection } from './data.section';
import { MediaSection } from './media.section';
import { WorkspaceSection } from './workspace.section';
import { ToolsSection } from './tools.section';
import { CommerceSection } from './commerce.section';
import { OpsSection } from './ops.section';
import { FlowsSection } from './flows.section';
import { CATALOG } from './ds/catalog-index';
import { DsGroupComponent, DsLevelComponent, DsPendingComponent } from './ds/ds-layout';
import { FormAdvancedSection } from './form-advanced.section';
import { FormMoleculesSection } from './form-molecules.section';
import { NavFeedbackSection } from './nav-feedback.section';
import { StructureSection } from './structure.section';
import { StructureAdvancedSection } from './structure-advanced.section';

type Host = 'form' | 'adv' | 'nav' | 'structure' | 'sadv' | 'data' | 'ctpl' | 'flow' | 'ops' | 'com' | 'wsp' | 'med' | 'tools';
/** Sección del DS → componente del catálogo que la dibuja y qué partes. Las que no están aquí se muestran como pendientes. */
const PORTED: Record<string, [Host, string[]]> = {
  'p-lotes': ['data', ['p-lotes']],
  'o-tree': ['tools', ['o-tree']], 'o-split': ['tools', ['o-split']], 'o-context': ['tools', ['o-context']], 'o-code': ['tools', ['o-code']], 'o-vtable': ['tools', ['o-vtable']],
  'o-perm': ['med', ['o-perm']],
  'o-mobile': ['med', ['o-mobile']],
  'o-scanner': ['med', ['o-scanner']],
  'o-wallet': ['med', ['o-wallet']],
  'o-media': ['med', ['o-media']],
  'o-charts2': ['med', ['o-charts2']],
  'o-kanban': ['wsp', ['o-kanban']],
  'o-images': ['wsp', ['o-images']],
  'o-email': ['wsp', ['o-email']],
  'o-dash': ['wsp', ['o-dash']],
  'o-commerce': ['com', ['o-commerce']],
  'o-checkout': ['com', ['o-checkout']],
  'o-rules': ['com', ['o-rules']],
  'o-grid': ['com', ['o-grid']],
  'o-errors': ['ops', ['o-errors']],
  'o-domain': ['ops', ['o-domain']],
  'o-facets': ['ops', ['o-facets']],
  'o-sortable': ['flow', ['o-sortable']],
  'm-select': ['form', ['m-select']], 'm-auto': ['form', ['m-auto']], 'm-special': ['form', ['m-special']], 'm-dates': ['form', ['m-dates']],
  'm-slider': ['adv', ['m-slider']], 'm-color': ['adv', ['m-color']], 'm-rte': ['adv', ['m-rte']], 'm-recur': ['adv', ['m-recur']], 'm-sign': ['adv', ['m-sign']],
  'm-commerce': ['adv', ['m-commerce']], 'm-social': ['adv', ['m-social']],
  'm-nav': ['nav', ['m-nav']], 'm-pager': ['nav', ['m-pager']], 'm-feedback': ['nav', ['m-feedback']], 'm-accordion': ['nav', ['m-accordion']], 'm-upload': ['nav', ['m-upload']],
  'o-l10n': ['sadv', ['o-l10n']], 'o-auth': ['sadv', ['o-auth']], 'o-chat': ['sadv', ['o-chat']], 'o-tour': ['sadv', ['o-tour']],
  'o-sidebar': ['structure', ['c-sidebar', 'c-pagehead']], 'o-filter': ['structure', ['c-overlays']], 'o-wizard': ['structure', ['c-stepper']],
  'o-cards': ['ctpl', ['o-cards']], 't-templates': ['ctpl', ['t-templates']], 't-layouts': ['ctpl', ['t-layouts']], 'o-table': ['data', ['c-list']], 'o-charts': ['data', ['c-charts']], 'o-states': ['ops', ['o-states']],
};

/**
 * Catálogo · Moléculas, Organismos y Plantillas: mismos grupos y secciones que docs/design-system/index.html.
 * Las secciones ya portadas reutilizan las demos existentes; el resto queda marcado como pendiente en su lugar.
 */
@Component({
  selector: 'zc-catalogo-nivel',
  imports: [
    DsLevelComponent, DsGroupComponent, DsPendingComponent,
    FormMoleculesSection, FormAdvancedSection, NavFeedbackSection, StructureSection, StructureAdvancedSection, DataSection, CardsTemplatesSection, MediaSection, WorkspaceSection, CommerceSection, OpsSection, FlowsSection, ToolsSection,
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
                  @case ('adv') { <zc-catalogo-form-advanced [parts]="p[1]" /> }
                  @case ('nav') { <zc-catalogo-nav-feedback [parts]="p[1]" /> }
                  @case ('sadv') { <zc-catalogo-structure-advanced [parts]="p[1]" /> }
                  @case ('structure') { <zc-catalogo-structure [parts]="p[1]" /> }
                  @case ('data') { <zc-catalogo-data [parts]="p[1]" /> }
                  @case ('flow') { <zc-catalogo-flows [parts]="p[1]" /> }
                  @case ('ops') { <zc-catalogo-ops [parts]="p[1]" /> }
                  @case ('com') { <zc-catalogo-commerce [parts]="p[1]" /> }
                  @case ('wsp') { <zc-catalogo-workspace [parts]="p[1]" /> }
                  @case ('med') { <zc-catalogo-media [parts]="p[1]" /> }
                  @case ('tools') { <zc-catalogo-tools [parts]="p[1]" /> }
                  @case ('ctpl') { <zc-catalogo-cards-templates [parts]="p[1]" /> }
                }
              </div>
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
