import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { BadgeComponent } from '@zonacards/ui/badge';
import { ButtonDirective } from '@zonacards/ui/button';
import { CountComponent } from '@zonacards/ui/count';
import { IconComponent } from '@zonacards/ui/icon';
import { MoneyComponent } from '@zonacards/ui/money';
import { SpinnerComponent } from '@zonacards/ui/spinner';
import { AccordionComponent, AccordionItemComponent } from '@zonacards/ui/accordion';
import { AlertActionDirective, AlertComponent } from '@zonacards/ui/alert';
import { DescriptionListComponent, ZcDescription } from '@zonacards/ui/description-list';
import { FACETS, ZcFacetOption } from '@zonacards/ui/facets';
import { FieldComponent, InputDirective } from '@zonacards/ui/field';
import { ZcOption } from '@zonacards/ui/listbox';
import { OfflineBannerComponent } from '@zonacards/ui/offline-banner';
import { PermissionGroupComponent, ZcPermission } from '@zonacards/ui/permission-group';
import { SelectComponent } from '@zonacards/ui/select';
import { SliderComponent } from '@zonacards/ui/slider';
import { TimelineComponent, ZcTimelineItem } from '@zonacards/ui/timeline';
import { ToastService } from '@zonacards/ui/toast';
import { CARD } from '@zonacards/ui/card';
import { DataTableComponent, ZcColumn } from '@zonacards/ui/table';
import { ErrorPageComponent } from '@zonacards/ui/error-page';
import { OverlayComponent } from '@zonacards/ui/overlay';
import { PipelineComponent, ZcPipelineStage } from '@zonacards/ui/pipeline';
import { ProductCardComponent } from '@zonacards/ui/commerce';
import { StateComponent } from '@zonacards/ui/state';
import { IconName } from '@zonacards/ui/icon';
import { DsSectionComponent } from './ds/ds-layout';

const REF = 'ZC-7F2A-91C0';
interface Prod { name: string; cat: string; city: string; price: number; desc: string; art: string }
const PRODS: Prod[] = ([
  ['Repsol', 'Gourmet Delis y Fast Food', 'Lima', 50, 'Combustible y tienda', 'Viajes'], ['Falabella', 'Moda y accesorios', 'Lima', 50, 'Moda, hogar y más', 'Moda'],
  ['KFC', 'Gourmet Delis y Fast Food', 'Arequipa', 20, 'Combos y postres', 'Gastronomía'], ['Starbucks', 'Restaurantes', 'Lima', 20, 'Café y bocaditos', 'Gastronomía'],
  ['Pizza Hut', 'Gourmet Delis y Fast Food', 'Trujillo', 20, 'Pizzas para compartir', 'Gastronomía'], ['Ripley', 'Moda y accesorios', 'Lima', 55, 'Moda de temporada', 'Moda'],
  ['Bembos', 'Gourmet Delis y Fast Food', 'Lima', 10, 'Hamburguesas peruanas', 'Gastronomía'], ['Cineplanet', 'Entretenimiento y Experiencias', 'Lima', 30, 'Entradas y combos', 'Entretenimiento'],
  ['Promart', 'Hogar, Deco y Electro', 'Arequipa', 50, 'Todo para tu hogar', 'Hogar'], ['Inkafarma', 'Cuidado personal', 'Cusco', 25, 'Salud y belleza', 'Salud y belleza'],
  ['Tottus', 'Multimarcas & Supermercados', 'Piura', 40, 'Supermercado', 'Hogar'], ['Amazon', 'Gift Cards Internacionales', 'Lima', 100, 'Compras internacionales', 'Viajes'],
] as [string, string, string, number, string, string][]).map(([name, cat, city, price, desc, art]) => ({ name, cat, city, price, desc, art }));

interface Failed { id: string; to: string; why: string }
interface Guide { id: string; part: string; rule: string; bad: string; good: string }

/** Catálogo · organismos de operación (Tanda 4): dominio, errores, estados vacíos y facetas. */
@Component({
  selector: 'zc-catalogo-ops',
  imports: [BadgeComponent, ButtonDirective, CountComponent, IconComponent, MoneyComponent, SpinnerComponent, AccordionComponent, AccordionItemComponent, AlertComponent,
    AlertActionDirective, DescriptionListComponent, FACETS, FieldComponent, InputDirective, OfflineBannerComponent, PermissionGroupComponent, SelectComponent, SliderComponent,
    TimelineComponent, CARD, DataTableComponent, ErrorPageComponent, OverlayComponent, PipelineComponent, ProductCardComponent, StateComponent, DsSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-12' },
  template: `
    @if (show('o-facets')) {
      <zc-ds-section dsId="o-facets" title="Filtros por facetas"
        description='Grupos plegables con conteo por opción, búsqueda dentro del grupo y "Mostrar más". En desktop van en una columna lateral; en móvil, en pantalla completa con el botón "Mostrar N resultados".'>
        <div class="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <zc-facets class="max-lg:hidden">
            <zc-facet-group title="Por categoría" [count]="cats().length">
              <zc-facet-options [options]="catOptions()" [(value)]="cats" [searchable]="true" searchLabel="Buscar categoría" />
            </zc-facet-group>
            <zc-facet-group title="Por ciudad" [count]="cities().length"><zc-facet-options [options]="cityOptions()" [(value)]="cities" /></zc-facet-group>
            <zc-facet-group title="Valor máximo" [count]="maxPrice() < 100 ? 1 : 0">
              <zc-slider [min]="10" [max]="100" [step]="5" [(value)]="maxPrice" ariaLabel="Valor máximo" [format]="soles" />
              <p class="text-caption text-muted num">Hasta S/ {{ maxPrice() }}</p>
            </zc-facet-group>
          </zc-facets>
          <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <strong class="mr-auto num" aria-live="polite">{{ results().length === 1 ? 'Mostrando 1 resultado' : 'Mostrando ' + results().length + ' resultados' }}</strong>
              <button zcButton variant="outline" size="sm" class="lg:hidden" (click)="facetSheet.set(true)">
                <zc-icon name="s:tuning-2" [size]="16" />Filtrar @if (activeFacets()) { <zc-count [value]="activeFacets()" /> }
              </button>
            </div>
            @if (activeFacets()) {
              <div class="flex flex-wrap gap-2">
                @for (c of cats(); track c) { <button zcButton variant="outline" size="sm" [attr.aria-label]="'Quitar ' + c" (click)="removeCat(c)">{{ c }}<zc-icon name="l:x" [size]="16" /></button> }
                @for (c of cities(); track c) { <button zcButton variant="outline" size="sm" [attr.aria-label]="'Quitar ' + c" (click)="removeCity(c)">{{ c }}<zc-icon name="l:x" [size]="16" /></button> }
                @if (maxPrice() < 100) { <button zcButton variant="outline" size="sm" aria-label="Quitar valor máximo" (click)="maxPrice.set(100)">Hasta S/ {{ maxPrice() }}<zc-icon name="l:x" [size]="16" /></button> }
              </div>
            }
            @if (results().length) {
              <div class="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-3">
                @for (p of results(); track p.name; let i = $index) {
                  <zc-product-card [name]="'Tarjeta ' + p.name" [brand]="p.name" [category]="p.art" [description]="p.desc + ' · ' + p.city" [price]="p.price" country="pe" [isNew]="i < 2"
                    (favoriteChange)="toast.success($event ? 'Agregado a favoritos' : 'Quitado de favoritos')" />
                }
              </div>
            } @else {
              <zc-state icon="s:magnifer" title="Sin gift cards con esos filtros" text="Quita alguna ciudad o sube el valor máximo.">
                <button zcButton variant="outline" (click)="clearFacets()">Limpiar filtros</button>
              </zc-state>
            }
          </div>
        </div>
        <zc-drawer title="Filtros" [(open)]="facetSheet">
          <zc-field label="Categoría"><zc-select [options]="catSelect()" [multiple]="true" placeholder="Todas las categorías" [value]="cats()" (valueChange)="cats.set($any($event) ?? [])" /></zc-field>
          <zc-field label="Ciudad"><zc-select [options]="citySelect()" [multiple]="true" placeholder="Todas las ciudades" [value]="cities()" (valueChange)="cities.set($any($event) ?? [])" /></zc-field>
          <zc-field label="Valor máximo" [hint]="'Hasta S/ ' + maxPrice()"><zc-slider [min]="10" [max]="100" [step]="5" [(value)]="maxPrice" ariaLabel="Valor máximo" [format]="soles" /></zc-field>
          <div zcOverlayFooter>
            <button zcButton variant="outline" (click)="clearFacets()">Limpiar</button>
            <button zcButton (click)="facetSheet.set(false)">Mostrar {{ results().length }} resultados</button>
          </div>
        </zc-drawer>
      </zc-ds-section>
    }

    @if (show('o-domain')) {
      <zc-ds-section dsId="o-domain" title="Pipeline, Timeline, Matriz de permisos y Notificaciones" description="El centro de notificaciones se abre desde la campana de la barra superior.">
        <zc-pipeline label="Liquidaciones por etapa" unit="liquidaciones" [stages]="stages" country="pe" [(selected)]="stage" />
        <p class="text-body-sm text-muted" aria-live="polite">{{ stage() ? 'Filtrando por ' + stageLabel() + '.' : 'Toca una etapa para filtrar el listado.' }}</p>
        <div class="grid grid-cols-[minmax(0,1fr)] items-start gap-6 md:grid-cols-2">
          <div class="grid min-w-0 gap-3">
            <h4 class="text-caption font-semibold uppercase tracking-wide text-muted">Historial de la giftcard</h4>
            <zc-timeline label="Historial de la giftcard" [items]="history" />
          </div>
          <div class="grid min-w-0 gap-3">
            <h4 class="text-caption font-semibold uppercase tracking-wide text-muted">Permisos del rol</h4>
            <zc-permission-group title="Lotes" [(enabled)]="lotsOn" [(permissions)]="perms" />
          </div>
        </div>
      </zc-ds-section>
    }

    @if (show('o-errors')) {
      <zc-ds-section dsId="o-errors" title="Gestión de errores" description="Cada error dice qué pasó, qué se conservó y qué hacer. Nunca se muestra solo un código. El ID de referencia permite a soporte encontrar el caso.">
        <h4 class="text-caption font-semibold uppercase tracking-wide text-muted">Páginas de error</h4>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-3">
          @for (p of pages; track p.code) {
            <zc-error-page [code]="p.code" [icon]="p.icon" [title]="p.title" [text]="p.text" [reference]="p.ref ? refId : ''">
              <button zcButton size="sm" (click)="toast.info(p.main, { text: 'Acción simulada.' })">{{ p.main }}</button>
              @if (p.alt) { <button zcButton variant="ghost" size="sm" (click)="toast.info(p.alt, { text: 'Acción simulada.' })">{{ p.alt }}</button> }
            </zc-error-page>
          }
        </div>

        <div class="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-2">
          <div class="grid min-w-0 gap-2.5">
            <h4 class="text-caption font-semibold uppercase tracking-wide text-muted">Reintento automático con espera creciente</h4>
            <zc-card title="Ventas del mes" subtitle="Widget del dashboard" icon="s:chart-2">
              <div class="grid min-h-24 content-center" aria-live="polite">
                @switch (retry().phase) {
                  @case ('idle') { <p class="text-body-sm text-muted">El resto del dashboard sigue funcionando aunque este bloque falle.</p> }
                  @case ('loading') { <span class="inline-flex items-center gap-2 text-body-sm text-muted"><zc-spinner [size]="16" />Cargando… (intento {{ retry().tries }} de 3)</span> }
                  @case ('waiting') {
                    <zc-alert tone="warning" title="No respondió el servicio de reportes">
                      Reintentando en {{ retry().wait }} s (intento {{ retry().tries + 1 }} de 3)…
                      <button zcAlertAction zcButton variant="outline" size="sm" (click)="attempt()">Reintentar ahora</button>
                    </zc-alert>
                  }
                  @case ('done') {
                    <div class="grid gap-1">
                      <span class="text-caption text-muted">Total del mes</span>
                      <zc-money class="text-display-sm font-semibold" [amount]="1240350.5" country="pe" />
                      <zc-badge tone="success" icon="l:trending-up" class="justify-self-start">+5,1 %</zc-badge>
                    </div>
                  }
                }
              </div>
              <div zcCardFooter><button zcButton variant="outline" size="sm" (click)="startRetry()"><zc-icon name="l:rotate-cw" [size]="16" />Cargar (falla 2 veces)</button></div>
            </zc-card>
          </div>

          <div class="grid min-w-0 gap-2.5">
            <h4 class="text-caption font-semibold uppercase tracking-wide text-muted">Resultado parcial de una acción masiva</h4>
            <zc-card title="Envío de gift cards" subtitle="Lote #02829 · 50 destinatarios">
              @if (!partialFixed()) {
                <zc-alert tone="warning" title="Enviamos 47 de 50 gift cards">3 no se enviaron. Las 47 enviadas ya están activas; no se volverán a enviar.</zc-alert>
                <zc-data-table caption="Envíos fallidos" [data]="failed" [columns]="failedCols" [toolbar]="false" density="compact" />
                <div class="flex flex-wrap gap-2">
                  <button zcButton size="sm" [loading]="partialBusy()" (click)="retryFailed()"><zc-icon name="l:rotate-cw" [size]="16" />Reintentar los 3</button>
                  <button zcButton variant="outline" size="sm"><zc-icon name="s:download-minimalistic" [size]="16" />Descargar detalle</button>
                </div>
              } @else {
                <zc-alert tone="success" title="Se enviaron 2 de 3">
                  maria&#64;empresa sigue con correo inválido: corrígelo en la lista de destinatarios.
                  <button zcAlertAction zcButton variant="outline" size="sm">Corregir destinatario</button>
                </zc-alert>
              }
            </zc-card>
          </div>

          <div class="grid min-w-0 gap-2.5">
            <h4 class="text-caption font-semibold uppercase tracking-wide text-muted">Error del servidor en un campo</h4>
            <form class="grid gap-4 rounded-card border border-border bg-surface p-5 max-md:p-4" novalidate (submit)="saveClient($event)">
              @if (rucError()) { <zc-alert tone="danger" title="No se guardó el cliente">Revisa el campo marcado. Los demás datos siguen en el formulario.</zc-alert> }
              <zc-field label="RUC del cliente" [required]="true" hint="Prueba guardar: el servidor responde que ya existe." [error]="rucError()">
                <input #ruc zcInput inputmode="numeric" [value]="'20100047218'" />
              </zc-field>
              <button zcButton type="submit" class="justify-self-start" [loading]="saving()">Guardar cliente</button>
            </form>
          </div>

          <div class="grid min-w-0 gap-2.5">
            <h4 class="text-caption font-semibold uppercase tracking-wide text-muted">Detalles técnicos para soporte</h4>
            <div class="grid gap-3 rounded-card border border-border bg-surface p-5 max-md:p-4">
              <zc-alert tone="danger" title="No se pudo generar el archivo bancario">
                El banco rechazó el formato de 2 cuentas. Corrige los datos de las franquicias y vuelve a generarlo.
                <button zcAlertAction zcButton variant="outline" size="sm">Ver franquicias</button>
              </zc-alert>
              <zc-accordion variant="flush">
                <zc-accordion-item title="Ver detalles técnicos">
                  <zc-description-list layout="rows" [items]="tech" />
                  <button zcButton variant="outline" size="sm" class="mt-2 justify-self-start" (click)="copyTech()"><zc-icon name="l:clipboard-copy" [size]="16" />Copiar detalles</button>
                </zc-accordion-item>
              </zc-accordion>
            </div>
          </div>

          <div class="grid min-w-0 gap-2.5">
            <h4 class="text-caption font-semibold uppercase tracking-wide text-muted">Sin conexión y cola de cambios</h4>
            <div class="grid gap-3 rounded-card border border-border bg-surface p-5 max-md:p-4">
              @if (offline()) { <zc-offline-banner [pending]="queue()" /> }
              <p class="text-body-sm text-muted">Simula una caída de red y edita: los cambios quedan en cola y se sincronizan al volver.</p>
              <div class="flex flex-wrap gap-2">
                <button zcButton variant="outline" size="sm" (click)="toggleOffline()"><zc-icon [name]="offline() ? 'l:wifi' : 'l:wifi-off'" [size]="16" />{{ offline() ? 'Simular reconexión' : 'Simular sin conexión' }}</button>
                <button zcButton variant="outline" size="sm" [disabled]="!offline()" (click)="queueChange()">Guardar un cambio</button>
              </div>
            </div>
          </div>

          <div class="grid min-w-0 gap-2.5">
            <h4 class="text-caption font-semibold uppercase tracking-wide text-muted">Demasiadas solicitudes (429)</h4>
            <div class="grid gap-3 rounded-card border border-border bg-surface p-5 max-md:p-4">
              @if (rateWait() > 0) {
                <zc-alert tone="info" title="Espera un momento">Hiciste varias exportaciones seguidas. Podrás exportar de nuevo en <strong class="num">{{ rateWait() }} s</strong>.</zc-alert>
              }
              <p class="text-body-sm text-muted">Exportar varias veces seguidas activa el límite.</p>
              <button zcButton variant="outline" size="sm" class="justify-self-start" [disabled]="rateWait() > 0" (click)="exportRate()"><zc-icon name="s:download-minimalistic" [size]="16" />Exportar</button>
            </div>
          </div>
        </div>

        <h4 class="text-caption font-semibold uppercase tracking-wide text-muted">Cómo escribir un mensaje de error</h4>
        <zc-data-table caption="Cómo escribir un mensaje de error" [data]="guide" [columns]="guideCols" [toolbar]="false" density="compact" />
      </zc-ds-section>
    }

    @if (show('o-states')) {
      <zc-ds-section dsId="o-states" title="Empty state y Error state">
        <div class="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 xl:grid-cols-3">
          <zc-state icon="s:box" title="Aún no hay lotes" text="Los lotes agrupan códigos para enviarlos, activarlos o dejarlos listos para pedidos API.">
            <button zcButton><zc-icon name="s:add" [size]="16" />Crear primer lote</button>
          </zc-state>
          <zc-state icon="s:magnifer" title="Sin resultados" text='Ningún lote coincide con "Navidad" en Chile. Prueba otro país o quita filtros.'>
            <button zcButton variant="outline">Limpiar filtros</button>
          </zc-state>
          <zc-state kind="error" icon="s:danger-circle" title="No se pudieron cargar los lotes" text="El servicio no respondió a tiempo. Tus filtros se conservaron." [reference]="refId"
            [details]="{ code: 'TIMEOUT (504)', service: 'lots-service · GET /lots', date: '11/10/2026 10:42' }">
            <button zcButton variant="outline"><zc-icon name="s:refresh" [size]="16" />Reintentar</button>
          </zc-state>
          <zc-state icon="s:lock-password" title="No tienes acceso a Liquidaciones" text="Pide a un administrador que agregue el permiso a tu rol.">
            <button zcButton variant="outline">Volver al inicio</button>
          </zc-state>
          <zc-state kind="error" icon="s:clock-circle" title="Este enlace venció" text="Los enlaces de descarga duran 7 días. Pide uno nuevo a tu ejecutivo de Promotick." />
          <zc-state icon="s:inbox" title="Sin notificaciones" text="Te avisaremos cuando haya aprobaciones o alertas." />
        </div>
      </zc-ds-section>
    }`,
})
export class OpsSection {
  readonly parts = input<string[]>([]);
  readonly show = (id: string) => this.parts().includes(id);
  readonly toast = inject(ToastService);
  private readonly live = inject(LiveAnnouncer);
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  readonly refId = REF;

  constructor() { inject(DestroyRef).onDestroy(() => this.timers.forEach(t => clearTimeout(t))); }
  private later(fn: () => void, ms: number) { const t = setTimeout(() => { this.timers.delete(t); fn(); }, ms); this.timers.add(t); return t; }

  // ---- Facetas ----
  readonly cats = signal<string[]>([]);
  readonly cities = signal<string[]>([]);
  readonly maxPrice = signal(100);
  readonly facetSheet = signal(false);
  readonly soles = (v: number) => 'S/ ' + v;
  private readonly unique = (k: 'cat' | 'city') => [...new Set(PRODS.map(p => p[k]))];
  // Conteo de cada opción con los demás filtros aplicados (como index.html).
  private count(k: 'cat' | 'city', v: string) {
    return PRODS.filter(p => p[k] === v && (k === 'cat' || !this.cats().length || this.cats().includes(p.cat)) && (k === 'city' || !this.cities().length || this.cities().includes(p.city))).length;
  }
  readonly catOptions = computed<ZcFacetOption[]>(() => this.unique('cat').map(v => ({ value: v, label: v, count: this.count('cat', v) })));
  readonly cityOptions = computed<ZcFacetOption[]>(() => this.unique('city').map(v => ({ value: v, label: v, count: this.count('city', v) })));
  readonly catSelect = computed<ZcOption<string>[]>(() => this.catOptions().map(o => ({ value: o.value, label: o.label, meta: String(o.count) })));
  readonly citySelect = computed<ZcOption<string>[]>(() => this.cityOptions().map(o => ({ value: o.value, label: o.label, meta: String(o.count) })));
  readonly results = computed(() => PRODS.filter(p => (!this.cats().length || this.cats().includes(p.cat)) && (!this.cities().length || this.cities().includes(p.city)) && p.price <= this.maxPrice()));
  readonly activeFacets = computed(() => this.cats().length + this.cities().length + (this.maxPrice() < 100 ? 1 : 0));
  removeCat(c: string) { this.cats.update(a => a.filter(x => x !== c)); }
  removeCity(c: string) { this.cities.update(a => a.filter(x => x !== c)); }
  clearFacets() { this.cats.set([]); this.cities.set([]); this.maxPrice.set(100); }

  // ---- Dominio ----
  readonly stages: ZcPipelineStage[] = [
    { id: 'factura', label: 'Esperando factura', count: 5, amount: 35541, tone: 'warning', icon: 's:hourglass' },
    { id: 'revisar', label: 'Por revisar', count: 4, amount: 22100, tone: 'info', icon: 's:eye' },
    { id: 'cola', label: 'En cola de pago', count: 3, amount: 18920, tone: 'accent', icon: 's:wallet-money' },
    { id: 'programado', label: 'Pago programado', count: 6, amount: 141300.75, tone: 'info', icon: 's:calendar' },
    { id: 'pagadas', label: 'Pagadas', count: 12, amount: 1096400, tone: 'success', icon: 's:check-circle' },
    { id: 'observadas', label: 'Observadas', count: 2, amount: 6500, tone: 'danger', icon: 's:danger-triangle' },
  ];
  readonly stage = signal<string | null>(null);
  readonly stageLabel = computed(() => this.stages.find(s => s.id === this.stage())?.label ?? '');
  readonly history: ZcTimelineItem[] = [
    { icon: 's:add-circle', title: 'Código generado', meta: 'Lote #02829 · 01/10/2026 09:00 · Sistema' },
    { icon: 's:plain', title: 'Enviado por correo', meta: 'dani@gmail.com · 15/10/2026 11:00 · Ana Torres' },
    { icon: 's:check-circle', title: 'Activado', meta: '15/10/2026 12:02' },
    { icon: 's:wallet-money', title: 'Consumo S/ 40.00', meta: 'Local La Carolina · saldo S/ 60.00 · 20/10/2026' },
    { icon: 's:calendar', title: 'Vigencia extendida', meta: 'Hasta 31/03/2027 · aprobado por Luis Mendoza' },
  ];
  readonly lotsOn = signal(true);
  readonly perms = signal<ZcPermission[]>([['Ver', true], ['Crear', true], ['Exportar', true], ['Anular', false], ['Extender vigencia', false], ['Aprobar', false]]
    .map(([label, on]) => ({ id: String(label), label: String(label), on: !!on })));

  // ---- Errores ----
  readonly pages: { code: string; icon: IconName; title: string; text: string; main: string; alt: string; ref: boolean }[] = [
    { code: '404', icon: 's:magnifer', title: 'No encontramos esta página', text: 'Puede que el enlace esté mal escrito o que el lote se haya eliminado.', main: 'Ir al inicio', alt: 'Buscar', ref: true },
    { code: '403', icon: 's:lock-keyhole-minimalistic', title: 'No tienes acceso', text: 'Tu rol no incluye Liquidaciones. Pide el permiso a un administrador.', main: 'Solicitar acceso', alt: 'Volver', ref: false },
    { code: '500', icon: 's:server-square', title: 'Algo falló de nuestro lado', text: 'No es tu culpa. Ya registramos el error; intenta de nuevo en unos minutos.', main: 'Reintentar', alt: 'Ir al inicio', ref: true },
    { code: '503', icon: 'l:construction', title: 'Estamos en mantenimiento', text: 'Volvemos hoy a las 23:00 (hora de Lima). Los envíos programados se harán igual.', main: 'Ver estado del servicio', alt: '', ref: false },
    { code: 'Sin conexión', icon: 'l:wifi-off', title: 'Sin conexión a internet', text: 'Lo que estabas editando está a salvo en este equipo y se enviará al reconectar.', main: 'Reintentar', alt: '', ref: false },
    { code: 'Sesión', icon: 's:clock-circle', title: 'Tu sesión expiró', text: 'Por seguridad cerramos la sesión tras 15 minutos sin actividad. Tus filtros se conservaron.', main: 'Volver a ingresar', alt: '', ref: false },
  ];

  /** Reintento: 3 intentos, espera de 2 s y luego 4 s (crece con cada fallo). */
  readonly retry = signal<{ phase: 'idle' | 'loading' | 'waiting' | 'done'; tries: number; wait: number }>({ phase: 'idle', tries: 0, wait: 0 });
  private retryTimer?: ReturnType<typeof setTimeout>;
  startRetry() { this.retry.set({ phase: 'idle', tries: 0, wait: 0 }); this.attempt(); }
  attempt() {
    clearTimeout(this.retryTimer);
    const tries = this.retry().tries + 1;
    this.retry.set({ phase: 'loading', tries, wait: 0 });
    this.retryTimer = this.later(() => {
      if (tries >= 3) { this.retry.set({ phase: 'done', tries, wait: 0 }); this.live.announce('Datos cargados.'); return; }
      const tick = (w: number) => {
        if (w <= 0) { this.attempt(); return; }
        this.retry.set({ phase: 'waiting', tries, wait: w });
        this.retryTimer = this.later(() => tick(w - 1), 1000);
      };
      tick(tries * 2);
    }, 700);
  }

  readonly failed: Failed[] = [
    { id: '1', to: 'maria@empresa', why: 'Correo sin dominio válido' },
    { id: '2', to: '+51 98765432', why: 'Teléfono con 8 dígitos' },
    { id: '3', to: 'luis@empresa.com', why: 'Rebotado por el servidor del destinatario' },
  ];
  readonly failedCols: ZcColumn<Failed>[] = [{ id: 'to', header: 'Destinatario', value: r => r.to }, { id: 'why', header: 'Motivo', value: r => r.why }];
  readonly partialBusy = signal(false);
  readonly partialFixed = signal(false);
  retryFailed() { this.partialBusy.set(true); this.later(() => { this.partialBusy.set(false); this.partialFixed.set(true); }, 900); }

  private readonly ruc = viewChild<ElementRef<HTMLInputElement>>('ruc');
  readonly saving = signal(false);
  readonly rucError = signal<string | null>(null);
  saveClient(e: Event) {
    e.preventDefault();
    this.saving.set(true);
    this.later(() => {
      this.saving.set(false);
      this.rucError.set('Este RUC ya está registrado como "Interbank". Abre ese cliente o usa otro RUC.');
      this.ruc()?.nativeElement.focus();
    }, 700);
  }

  readonly tech: ZcDescription[] = [
    { term: 'Referencia', value: REF }, { term: 'Código', value: 'BANK_FORMAT_INVALID (422)' },
    { term: 'Servicio', value: 'payments-service · POST /payouts/file' }, { term: 'Fecha', value: '11/10/2026 10:42' },
  ];
  async copyTech() {
    try { await navigator.clipboard.writeText(this.tech.map(d => d.term + ': ' + d.value).join('\n')); } catch { /* sin permiso de portapapeles */ }
    this.toast.success('Detalles copiados', { text: 'Pégalos en tu mensaje a soporte.' });
  }

  readonly offline = signal(false);
  readonly queue = signal(0);
  toggleOffline() {
    const off = !this.offline();
    this.offline.set(off);
    if (!off && this.queue()) {
      const n = this.queue();
      this.toast.success('Conexión restablecida', { text: n + (n > 1 ? ' cambios sincronizados.' : ' cambio sincronizado.') });
      this.queue.set(0);
    }
  }
  queueChange() { this.queue.update(n => n + 1); this.toast.info('Guardado en este equipo', { text: 'Se enviará al reconectar.' }); }

  private exports = 0;
  readonly rateWait = signal(0);
  exportRate() {
    if (++this.exports < 3) { this.toast.success('Exportación en curso'); return; }
    const tick = (s: number) => { this.rateWait.set(s); if (s <= 0) { this.exports = 0; return; } this.later(() => tick(s - 1), 1000); };
    tick(30);
  }

  readonly guide: Guide[] = [
    { id: 'q', part: 'Qué pasó', rule: 'En lenguaje del usuario, sin culpar', bad: 'Error 500', good: 'No pudimos guardar el lote' },
    { id: 'c', part: 'Qué se conservó', rule: 'Tranquiliza sobre datos y dinero', bad: '—', good: 'Tus cambios siguen en el formulario' },
    { id: 'h', part: 'Qué hacer', rule: 'Una acción concreta en un botón', bad: 'Intente más tarde', good: 'Reintentar · Descargar detalle' },
    { id: 'r', part: 'Referencia', rule: 'ID copiable solo cuando hace falta soporte', bad: 'Stack trace visible', good: 'Ref. ' + REF },
  ];
  readonly guideCols: ZcColumn<Guide>[] = [
    { id: 'part', header: 'Parte', value: r => r.part }, { id: 'rule', header: 'Regla', value: r => r.rule },
    { id: 'bad', header: 'Mal', value: r => r.bad }, { id: 'good', header: 'Bien', value: r => r.good },
  ];
}
