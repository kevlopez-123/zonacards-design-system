import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, linkedSignal, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AppError } from '../../core/http/interceptors';
import { CanDirective } from '../../core/session/can.directive';
import { COUNTRIES, CountryCode, countryByCode } from '@zonacards/ui/core';
import { GIFTCARD_LOOK, GiftcardState } from '@zonacards/ui/core';
import { DateRangeValue } from '@zonacards/ui/core';
import { BadgeComponent } from '@zonacards/ui/badge';
import { ButtonDirective } from '@zonacards/ui/button';
import { FlagComponent } from '@zonacards/ui/flag';
import { IconComponent } from '@zonacards/ui/icon';
import { CARD } from '@zonacards/ui/card';
import { IconName } from '@zonacards/ui/icon';
import { MoneyComponent } from '@zonacards/ui/money';
import { ProgressComponent } from '@zonacards/ui/progress';
import { SkeletonComponent } from '@zonacards/ui/skeleton';
import { DateRangeComponent } from '@zonacards/ui/date-range';
import { FieldComponent } from '@zonacards/ui/field';
import { ZcOption } from '@zonacards/ui/listbox';
import { MenuComponent, ZcMenuItem } from '@zonacards/ui/menu';
import { PaginationComponent } from '@zonacards/ui/pagination';
import { SelectComponent } from '@zonacards/ui/select';
import { ToastService } from '@zonacards/ui/toast';
import { BulkActionsDirective, CellDefDirective, DataTableComponent, RowActionsDirective, ZcColumn, ZcSort } from '@zonacards/ui/table';
import { CardsViewDirective, DataViewComponent, DataViewMode, TableViewDirective } from '@zonacards/ui/table';
import { FilterBarComponent, FilterMainDirective, FilterMoreDirective, ZcFilterChip } from '@zonacards/ui/table';
import { KpiComponent } from '@zonacards/ui/kpi';
import { AlertDialogComponent } from '@zonacards/ui/overlay';
import { PageHeaderComponent } from '@zonacards/ui/page-header';
import { StateComponent } from '@zonacards/ui/state';
import { NARROW_QUERY, injectMedia } from '@zonacards/ui/core';
import { PAGE_SIZES, activeFilterCount, lotesQueryParams, parseLotesQuery } from './lotes-query';
import { ExportFormat, LotesActions, lotAmount, lotPct } from './lotes-ui';
import { Lote, LotesPage as LotesResult, LoteSortKey, LotesQuery } from './lotes.models';
import { TooltipDirective } from '@zonacards/ui/tooltip';
import { LotesService } from './lotes.service';

const STATES: GiftcardState[] = ['activated', 'created', 'expired', 'voided'];
/** Opciones del menú Ordenar: cada una con su dirección natural. */
const SORT_PRESETS: { key: LoteSortKey; desc: boolean }[] = [
  { key: 'expires', desc: false }, { key: 'created', desc: true }, { key: 'amount', desc: true }, { key: 'name', desc: false },
];

/**
 * Lotes (P1 Listado, sección 8.4): migas · encabezado con descargar y acciones · KPI que filtran · barra de filtros con chips ·
 * orden · tarjetas o tabla (desde 1024 px) · paginación en servidor. Filtros, orden, página y vista viven en la URL.
 * Estados: cargando (skeleton), vacío, sin resultados, error con referencia y reintento; sin permiso lo resuelve el guard.
 */
@Component({
  selector: 'zc-lotes-page',
  imports: [
    ...CARD, TooltipDirective, NgTemplateOutlet, RouterLink, TranslocoPipe, CanDirective, BadgeComponent, ButtonDirective, FlagComponent, IconComponent, MoneyComponent, ProgressComponent,
    SkeletonComponent, DateRangeComponent, FieldComponent, MenuComponent, PaginationComponent, SelectComponent, DataTableComponent, CellDefDirective,
    RowActionsDirective, BulkActionsDirective, DataViewComponent, CardsViewDirective, TableViewDirective, FilterBarComponent, FilterMainDirective,
    FilterMoreDirective, KpiComponent, AlertDialogComponent, PageHeaderComponent, StateComponent,
  ],
  providers: [LotesActions],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lotes.page.html',
})
export class LotesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(LotesService);
  private readonly toast = inject(ToastService);
  readonly ui = inject(LotesActions);
  readonly t = this.ui.t;
  readonly narrow = injectMedia(NARROW_QUERY);
  readonly look = GIFTCARD_LOOK;
  readonly states = STATES;
  readonly pageSizes = PAGE_SIZES;
  readonly amount = lotAmount;
  readonly pct = lotPct;
  readonly asIcon = (s: string) => s as IconName;
  readonly lookOf = (l: Lote) => GIFTCARD_LOOK[l.state];
  readonly crumbs = computed(() => [{ label: this.t('nav.inicio'), link: '/inicio' }, { label: this.t('lotes.titulo') }]);
  readonly countryName = (c: CountryCode) => countryByCode(c).name;
  readonly channelIcon = (c: Lote['channel']): IconName => (c === 'whatsapp' ? 's:phone' : c === 'zip' ? 's:archive' : 's:letter');

  // Estado en la URL
  private readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  readonly query = computed(() => parseLotesQuery(k => this.params().get(k)));
  readonly view = computed<DataViewMode>(() => (this.params().get('vista') === 'tabla' ? 'table' : 'cards'));
  /** Texto del buscador: se escribe al instante y llega a la URL 300 ms después. */
  readonly search = linkedSignal(() => this.query().q);
  private searchTimer?: ReturnType<typeof setTimeout>;

  // Móvil: "Cargar más" acumula páginas en vez de paginar.
  private readonly filterKey = computed(() => JSON.stringify({ ...this.query(), page: 1 }));
  readonly morePage = linkedSignal({ source: this.filterKey, computation: () => 1 });
  private readonly apiQuery = computed<LotesQuery>(() => (this.narrow() ? { ...this.query(), page: this.morePage() } : this.query()));
  readonly res = this.svc.list(() => this.apiQuery());
  readonly options = this.svc.options();
  /** Última respuesta: al cambiar filtros se sigue viendo el resultado anterior (atenuado) en vez de parpadear. */
  readonly data = linkedSignal<LotesResult | undefined, LotesResult | undefined>({
    source: () => (this.res.hasValue() ? this.res.value() : undefined),
    computation: (v, prev) => v ?? prev?.value,
  });
  private readonly accumulated = signal<Lote[]>([]);
  readonly items = computed(() => (this.narrow() ? this.accumulated() : this.data()?.items ?? []));
  readonly total = computed(() => this.data()?.total ?? 0);
  readonly error = computed(() => (this.res.error() as AppError | undefined) ?? null);
  readonly firstLoad = computed(() => this.res.isLoading() && !this.data());
  readonly filtered = computed(() => activeFilterCount(this.query()) > 0 || !!this.query().q);

  readonly countText = computed(() => (this.filtered() ? this.t('lotes.conteoDe', { n: this.fmtN(this.total()), total: this.fmtN(this.allCount()) }) : this.t('lotes.conteo', { n: this.fmtN(this.total()) })));
  private readonly allCount = computed(() => this.data()?.overall ?? 0);
  /** Filtros que están dentro del panel en desktop (los tres principales van en la barra). */
  readonly moreCount = computed(() => { const q = this.query(); return [q.client, q.program, q.brand, q.type].filter(Boolean).length; });
  readonly resultText = computed(() => this.t('lotes.conteo', { n: this.fmtN(this.total()) }));
  private fmtN(n: number) { return n.toLocaleString(this.ui.lang() === 'es' ? 'es-PE' : 'en-US'); }

  constructor() {
    effect(() => {
      if (!this.res.hasValue()) return;
      const page = this.res.value();
      const n = untracked(() => this.apiQuery().page);
      untracked(() => this.accumulated.update(a => (n === 1 ? page.items : [...a, ...page.items])));
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer));
  }

  /** Cambia filtros/orden/página en la URL. Cambiar un filtro vuelve a la página 1. Atrás deshace el último cambio. */
  update(patch: Partial<LotesQuery>, opts: { keepPage?: boolean; replace?: boolean } = {}) {
    const next = { ...this.query(), ...patch };
    if (!opts.keepPage && patch.page === undefined) next.page = 1;
    void this.router.navigate([], {
      relativeTo: this.route, replaceUrl: opts.replace,
      queryParams: { ...lotesQueryParams(next), vista: this.view() === 'table' ? 'tabla' : null },
    });
  }
  setView(v: DataViewMode) {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { vista: v === 'table' ? 'tabla' : null }, queryParamsHandling: 'merge', replaceUrl: true });
  }
  onSearch(q: string) {
    this.search.set(q);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.update({ q: q.trim() }, { replace: true }), 300);
  }
  retry() { this.res.reload(); }

  // KPI que filtran: un KPI marcado = filtro de estado con solo ese estado.
  readonly counts = computed(() => this.data()?.counts);
  kpiPressed(s: GiftcardState) { const st = this.query().state; return st.length === 1 && st[0] === s; }
  toggleKpi(s: GiftcardState) { this.update({ state: this.kpiPressed(s) ? [] : [s] }); }

  // Filtros
  readonly countryOptions: ZcOption<CountryCode>[] = COUNTRIES.map(c => ({ value: c.code, label: c.name, flag: c.code }));
  readonly stateOptions = computed<ZcOption<GiftcardState>[]>(() => STATES.map(s => ({ value: s, label: this.t(GIFTCARD_LOOK[s].labelKey), icon: GIFTCARD_LOOK[s].icon as IconName })));
  private readonly opts = computed(() => (this.options.hasValue() ? this.options.value() : { clients: [], programs: [], brands: [] }));
  readonly clientOptions = computed(() => this.opts().clients.map(c => ({ value: c, label: c })));
  readonly programOptions = computed(() => this.opts().programs.map(c => ({ value: c, label: c })));
  readonly brandOptions = computed(() => this.opts().brands.map(c => ({ value: c, label: c })));
  readonly typeOptions = computed<ZcOption<string>[]>(() => [{ value: 'propio', label: this.t('lotes.tipos.propio') }, { value: 'terceros', label: this.t('lotes.tipos.terceros') }]);
  readonly period = computed<DateRangeValue | null>(() => { const q = this.query(); return q.from && q.to ? { from: q.from, to: q.to } : null; });
  setPeriod(v: DateRangeValue | null) { this.update({ from: v?.from ?? null, to: v?.to ?? null }); }
  setList<K extends 'country' | 'state'>(k: K, v: unknown) { this.update({ [k]: (Array.isArray(v) ? v : v ? [v] : []) as LotesQuery[K] }); }
  setOne(k: 'client' | 'program' | 'brand' | 'type', v: unknown) { this.update({ [k]: (v as string | null) || null }); }

  readonly chips = computed<ZcFilterChip[]>(() => {
    const q = this.query(); const t = this.t;
    const chip = (id: string, k: string, v: string) => ({ id, label: t('lotes.filtro.chip', { k: t(k), v }) });
    return [
      ...q.country.map(c => chip('country:' + c, 'lotes.pais', this.countryName(c))),
      ...q.state.map(s => chip('state:' + s, 'lotes.estado', t(GIFTCARD_LOOK[s].labelKey))),
      ...(q.from && q.to ? [chip('period', 'lotes.periodo', `${this.ui.date(q.from)} – ${this.ui.date(q.to)}`)] : []),
      ...(q.client ? [chip('client', 'lotes.cliente', q.client)] : []),
      ...(q.program ? [chip('program', 'lotes.programa', q.program)] : []),
      ...(q.brand ? [chip('brand', 'lotes.marca', q.brand)] : []),
      ...(q.type ? [chip('type', 'lotes.tipo', t('lotes.tipos.' + q.type))] : []),
    ];
  });
  removeChip(c: ZcFilterChip) {
    const [k, v] = c.id.split(':'); const q = this.query();
    if (k === 'country') this.update({ country: q.country.filter(x => x !== v) });
    else if (k === 'state') this.update({ state: q.state.filter(x => x !== v) });
    else if (k === 'period') this.update({ from: null, to: null });
    else this.update({ [k]: null } as Partial<LotesQuery>);
  }
  clearFilters() {
    this.search.set('');
    this.update({ q: '', country: [], state: [], client: null, program: null, brand: null, type: null, from: null, to: null });
  }

  // Orden: menú (tarjetas) y encabezados (tabla) usan el mismo estado de la URL.
  readonly sortItems = computed<ZcMenuItem[]>(() => SORT_PRESETS.map(s => ({ id: s.key, label: this.t('lotes.orden.' + s.key), checked: this.query().sort === s.key && this.query().desc === s.desc })));
  readonly sortLabel = computed(() => { const q = this.query(); const p = SORT_PRESETS.find(s => s.key === q.sort && s.desc === q.desc); return this.t(p ? 'lotes.orden.' + p.key : 'lotes.orden.otro'); });
  onSort(it: ZcMenuItem) { const p = SORT_PRESETS.find(s => s.key === it.id)!; this.update({ sort: p.key, desc: p.desc }); }
  readonly tableSort = computed<ZcSort>(() => ({ id: this.query().sort, desc: this.query().desc }));
  onTableSort(s: ZcSort) { if (s) this.update({ sort: s.id as LoteSortKey, desc: s.desc }); }

  // Tabla
  readonly selection = signal<string[]>([]);
  readonly columns = computed<ZcColumn<Lote>[]>(() => {
    const t = this.t;
    return [
      { id: 'name', header: t('lotes.lote'), value: l => l.name, sortable: true },
      { id: 'giftcard', header: t('lotes.giftcard'), value: l => l.giftcard },
      { id: 'client', header: t('lotes.cliente'), value: l => l.client, sortable: true },
      { id: 'country', header: t('lotes.pais'), value: l => this.countryName(l.country), hidden: true },
      { id: 'amount', header: t('lotes.valor'), value: l => lotAmount(l), align: 'end', sortable: true },
      { id: 'quantity', header: t('lotes.cantidad'), value: l => l.quantity, align: 'end', sortable: true },
      { id: 'available', header: t('lotes.disponibles'), value: l => l.available, align: 'end', sortable: true },
      { id: 'expires', header: t('lotes.vence'), value: l => l.expiresAt, sortable: true },
      { id: 'state', header: t('lotes.estado'), value: l => this.ui.stateLabel(l) },
    ];
  });
  readonly rowId = (l: Lote) => l.id;
  readonly rowLabel = (l: Lote) => `${this.t('lotes.lote').toLowerCase()} #${l.id}`;
  menuFor = (l: Lote) => this.ui.menu(l, { withView: true });

  onLotMenu(it: ZcMenuItem, l: Lote) {
    if (it.id === 'ver') void this.router.navigate([l.id], { relativeTo: this.route });
    else if (it.id === 'descargar') void this.ui.downloadCodes(l);
    else if (it.id === 'anular') this.askVoid([l]);
  }

  // Anulación (una o varias): siempre con motivo, confirmación escrita y doble aprobación.
  readonly voidTarget = signal<Lote[]>([]);
  readonly voidOpen = signal(false);
  readonly voiding = signal(false);
  readonly voidTitle = computed(() => {
    const l = this.voidTarget();
    return l.length === 1 ? this.t('lotes.anular.titulo', { n: l[0].available, id: l[0].id }) : this.t('lotes.anular.tituloLotes', { n: l.length });
  });
  askVoid(lots: Lote[]) { this.voidTarget.set(lots); this.voidOpen.set(true); }
  bulkVoid(ids: string[]) {
    const lots = this.items().filter(l => ids.includes(l.id) && this.ui.menu(l, { withView: false }).some(i => i.id === 'anular' && !i.disabled));
    if (!lots.length) { this.toast.info(this.t('lotes.acciones.sinDisponibles')); return; }
    this.askVoid(lots);
  }
  async confirmVoid(reason: string) {
    this.voiding.set(true);
    const results = await Promise.all(this.voidTarget().map(l => this.ui.requestVoid(l, reason)));
    this.voiding.set(false);
    this.voidOpen.set(false);
    if (results.some(Boolean)) { this.selection.set([]); this.res.reload(); }
  }

  // Descargas con los filtros aplicados
  readonly exportItems = computed(() => this.ui.exportItems());
  readonly mobileMore = computed<ZcMenuItem[]>(() => [
    { id: 'carga', label: this.t('lotes.cargaMasiva'), icon: 's:import' },
    ...this.exportItems().map(i => ({ ...i, separatorBefore: i.id === 'xlsx' })),
  ]);
  readonly exporting = signal(false);
  async export(format: ExportFormat, only?: string[]) {
    this.exporting.set(true);
    try {
      const lots = only ? this.items().filter(l => only.includes(l.id)) : await this.svc.exportAll(this.query());
      const filters = this.chips().map(c => c.label).join(' · ');
      this.ui.download(format, this.ui.rows(lots), this.t('lotes.titulo'), filters ? this.t('lotes.exportar.filtros', { f: filters }) : this.t('lotes.exportar.sinFiltros'));
      this.toast.success(this.t('lotes.exportar.listo'), { text: this.t('lotes.exportar.texto', { n: lots.length }) });
    } catch (e) { this.ui.fail(e, 'lotes.exportar.error'); } finally { this.exporting.set(false); }
  }
  onMore(it: ZcMenuItem) {
    if (it.id === 'carga') void this.router.navigate(['nuevo'], { relativeTo: this.route });
    else void this.export(it.id as ExportFormat);
  }
}
