import { ChangeDetectionStrategy, Component, Directive, contentChild } from '@angular/core';

/**
 * Plantillas de página (t-templates de index.html): solo distribuyen organismos, no traen datos ni textos.
 * Cada slot es un atributo sobre el elemento proyectado. Todas son de una columna en móvil.
 *
 * Listado    <zc-list-page>      zcPageHeader · zcPageKpis · zcPageFilters · (contenido: zc-data-view) · zcPageFooter (paginador)
 * Ficha      <zc-detail-page>    zcPageHeader · zcPageTabs · (contenido principal) · zcPageAside (actividad; abajo en móvil)
 * Formulario <zc-form-page>      zcPageHeader · zcPageSteps · (secciones) · zcPageActions (pie fijo con la acción principal)
 * Dashboard  <zc-dashboard-page> zcPageHeader · zcPageKpis · (gráficos: grilla de 2 columnas desde 1024 px) · zcPageAside (alertas)
 */
@Directive({ selector: '[zcPageHeader]' }) export class PageHeaderSlot {}
@Directive({ selector: '[zcPageKpis]', host: { class: 'grid grid-cols-[repeat(auto-fit,minmax(128px,1fr))] gap-3' } }) export class PageKpisSlot {}
@Directive({ selector: '[zcPageFilters]' }) export class PageFiltersSlot {}
@Directive({ selector: '[zcPageFooter]', host: { class: 'flex min-w-0 justify-end' } }) export class PageFooterSlot {}
@Directive({ selector: '[zcPageTabs]' }) export class PageTabsSlot {}
@Directive({ selector: '[zcPageAside]', host: { class: 'grid min-w-0 content-start grid-cols-[minmax(0,1fr)] gap-4' } }) export class PageAsideSlot {}
@Directive({ selector: '[zcPageSteps]' }) export class PageStepsSlot {}
@Directive({
  selector: '[zcPageActions]',
  // Móvil y tablet: barra de ancho completo sobre la superficie. Escritorio: alineada con la columna del formulario, con el fondo de la página.
  host: { class: 'sticky bottom-0 z-(--z-sticky) -mx-4 flex min-w-0 flex-wrap items-center justify-end gap-3 border-t border-border bg-surface px-4 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] md:-mx-6 md:px-6 lg:mx-0 lg:bg-bg lg:px-0' },
}) export class PageActionsSlot {}

const PAGE = 'grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6 max-md:gap-4';

@Component({
  selector: 'zc-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: PAGE },
  template: `<ng-content select="[zcPageHeader]" /><ng-content select="[zcPageKpis]" /><ng-content select="[zcPageFilters]" /><ng-content /><ng-content select="[zcPageFooter]" />`,
})
export class ListPageComponent {}

@Component({
  selector: 'zc-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: PAGE },
  template: `
    <ng-content select="[zcPageHeader]" /><ng-content select="[zcPageTabs]" />
    <!-- Sin [zcPageAside] el contenido usa todo el ancho (no queda una columna vacía a la derecha). -->
    <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-6" [class]="aside() ? 'lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]' : ''">
      <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6"><ng-content /></div>
      <ng-content select="[zcPageAside]" />
    </div>`,
})
export class DetailPageComponent {
  readonly aside = contentChild(PageAsideSlot);
}

@Component({
  selector: 'zc-form-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: PAGE + ' mx-auto w-full max-w-[880px]' },
  template: `<ng-content select="[zcPageHeader]" /><ng-content select="[zcPageSteps]" /><div class="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6"><ng-content /></div><ng-content select="[zcPageActions]" />`,
})
export class FormPageComponent {}

@Component({
  selector: 'zc-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: PAGE },
  template: `
    <ng-content select="[zcPageHeader]" /><ng-content select="[zcPageKpis]" />
    <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-2"><ng-content /></div>
    <ng-content select="[zcPageAside]" />`,
})
export class DashboardPageComponent {}

export const PAGE_TEMPLATES = [
  ListPageComponent, DetailPageComponent, FormPageComponent, DashboardPageComponent,
  PageHeaderSlot, PageKpisSlot, PageFiltersSlot, PageFooterSlot, PageTabsSlot, PageAsideSlot, PageStepsSlot, PageActionsSlot,
] as const;
