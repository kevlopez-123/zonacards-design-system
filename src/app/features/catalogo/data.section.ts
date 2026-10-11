import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { COUNTRIES, CountryCode, countryByCode } from '../../shared/domain/countries';
import { IsoDate, formatDmy } from '../../shared/domain/dates';
import { formatMoney, formatMoneyCompact } from '../../shared/domain/money';
import { GIFTCARD_LOOK, GiftcardState } from '../../shared/domain/states';
import { DateRangeValue } from '../../shared/forms/validators';
import { BadgeComponent } from '../../shared/ui/atoms/badge/badge.component';
import { ButtonDirective } from '../../shared/ui/atoms/button/button.directive';
import { CheckboxComponent } from '../../shared/ui/atoms/checkbox/checkbox.component';
import { FlagComponent } from '../../shared/ui/atoms/flag/flag.component';
import { IconComponent } from '../../shared/ui/atoms/icon/icon.component';
import { IconName } from '../../shared/ui/atoms/icon/icon-registry.generated';
import { MoneyComponent } from '../../shared/ui/atoms/money/money.component';
import { ProgressComponent } from '../../shared/ui/atoms/progress/progress.component';
import { RadioGroupComponent } from '../../shared/ui/atoms/radio/radio-group.component';
import { RadioComponent } from '../../shared/ui/atoms/radio/radio.component';
import { SegmentedComponent, ZcSegment } from '../../shared/ui/molecules/segmented/segmented.component';
import { SkeletonComponent } from '../../shared/ui/atoms/skeleton/skeleton.component';
import { SwitchComponent } from '../../shared/ui/atoms/switch/switch.component';
import { DateRangeComponent } from '../../shared/ui/molecules/date-range/date-range.component';
import { FieldComponent } from '../../shared/ui/molecules/field/field.component';
import { ZcOption } from '../../shared/ui/molecules/listbox/listbox.component';
import { MenuComponent, ZcMenuItem } from '../../shared/ui/molecules/menu/menu.component';
import { PaginationComponent } from '../../shared/ui/molecules/pagination/pagination.component';
import { SelectComponent } from '../../shared/ui/molecules/select/select.component';
import { ToastService } from '../../shared/ui/molecules/toast/toast.service';
import { ChartComponent } from '../../shared/ui/organisms/chart/chart.component';
import {
  BulkActionsDirective, CellDefDirective, DataTableComponent, RowActionsDirective, RowCardDirective, RowDetailDirective, ZcColumn, ZcSort, compareValues,
} from '../../shared/ui/organisms/data-table/data-table.component';
import { CardsViewDirective, DataViewComponent, DataViewMode, TableViewDirective } from '../../shared/ui/organisms/data-view/data-view.component';
import { FilterBarComponent, FilterMainDirective, FilterMoreDirective, ZcFilterChip } from '../../shared/ui/organisms/filter-bar/filter-bar.component';
import { AlertDialogComponent } from '../../shared/ui/organisms/overlay/alert-dialog.component';
import { KpiComponent } from '../../shared/ui/organisms/kpi/kpi.component';
import { PageHeaderComponent } from '../../shared/ui/organisms/page-header/page-header.component';
import { Crumb } from '../../shared/ui/molecules/breadcrumbs/breadcrumbs.component';
import { LinkComponent } from '../../shared/ui/atoms/misc/misc';
import { PAGE_TEMPLATES } from '../../shared/ui/templates/page-templates';
import { RouterLink } from '@angular/router';
import { DsSectionComponent } from './ds/ds-layout';
import { StateComponent } from '../../shared/ui/organisms/state/state.component';
import { LegacyParts } from './ds/catalog-index';
import { TooltipDirective } from '../../shared/ui/atoms/tooltip/tooltip.directive';
import { DEMO_LOTS, DemoLot, categoryData, mixData, topClientsData, trendData } from './organisms-demo-data';

const STATE_LABEL: Record<GiftcardState, string> = { created: 'Creado', activated: 'Activado', expired: 'Expirado', voided: 'Anulado' };
const SORTS: { id: string; label: string; sort: NonNullable<ZcSort> }[] = [
  { id: 'vence-asc', label: 'Próximos a vencer', sort: { id: 'expires', desc: false } },
  { id: 'valor-desc', label: 'Mayor valor', sort: { id: 'amount', desc: true } },
  { id: 'cliente-asc', label: 'Cliente (A–Z)', sort: { id: 'client', desc: false } },
  { id: 'activados-desc', label: 'Más activados', sort: { id: 'activated', desc: true } },
];
const LOT_MENU: ZcMenuItem[] = [
  { id: 'ver', label: 'Ver ficha', icon: 's:eye' },
  { id: 'enviar', label: 'Enviar códigos', icon: 's:plain' },
  { id: 'descargar', label: 'Descargar información', icon: 's:download-minimalistic' },
  { id: 'anular', label: 'Anular lote', icon: 's:close-circle', danger: true, separatorBefore: true },
];

/** Catálogo · organismos de datos y análisis (etapa 4): filtros, vista de datos, tabla, gráficos y estados. */
@Component({
  selector: 'zc-catalogo-data',
  imports: [
    TooltipDirective, NgTemplateOutlet, PageHeaderComponent, LinkComponent, PAGE_TEMPLATES, RouterLink, DsSectionComponent, BadgeComponent, ButtonDirective, CheckboxComponent, FlagComponent, IconComponent, MoneyComponent, ProgressComponent, RadioGroupComponent, RadioComponent, SegmentedComponent,
    SkeletonComponent, SwitchComponent, DateRangeComponent, FieldComponent, MenuComponent, PaginationComponent, SelectComponent, ChartComponent,
    DataTableComponent, CellDefDirective, RowActionsDirective, RowCardDirective, RowDetailDirective, BulkActionsDirective,
    DataViewComponent, CardsViewDirective, TableViewDirective, FilterBarComponent, FilterMainDirective, FilterMoreDirective, AlertDialogComponent, StateComponent, KpiComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid grid-cols-[minmax(0,1fr)] gap-12' },
  templateUrl: './data.section.html',
})
export class DataSection extends LegacyParts {
  /** Secciones a dibujar (c-select, c-auto…); null = todas. */
  readonly parts = input<string[] | null>(null);
  private readonly toast = inject(ToastService);
  readonly look = GIFTCARD_LOOK;
  readonly kpiActive = signal(true);
  readonly kpiVoided = signal(false);
  readonly stateLabel = STATE_LABEL;
  readonly lookOf = (l: DemoLot) => GIFTCARD_LOOK[l.state];
  readonly stateText = (l: DemoLot) => STATE_LABEL[l.state];
  readonly countryName = (c: CountryCode) => countryByCode(c).name;
  readonly date = (iso: string) => formatDmy(iso as IsoDate);
  readonly currency = (c: CountryCode) => countryByCode(c).currency;
  readonly asIcon = (s: string) => s as IconName;
  readonly pct = (l: DemoLot) => Math.round((l.activated / l.qty) * 100);
  readonly channelIcon = (c: DemoLot['channel']): IconName => (c === 'WhatsApp' ? 's:phone' : c === 'ZIP' ? 's:archive' : 's:letter');

  // Filtros
  readonly query = signal('');
  readonly countries = signal<CountryCode[]>(['pe']);
  readonly states = signal<GiftcardState[]>([]);
  // Página de ejemplo (p-lotes): migas y KPI que filtran por estado (cuentan con los demás filtros aplicados).
  readonly pageCrumbs: Crumb[] = [{ label: 'Inicio', link: '/' }, { label: 'Lotes' }];
  readonly pageKpis: { state: GiftcardState; label: string; icon: IconName }[] = [
    { state: 'activated', label: 'Activados', icon: 's:check-circle' }, { state: 'created', label: 'Creados', icon: 's:add-circle' },
    { state: 'expired', label: 'Expirados', icon: 's:clock-circle' }, { state: 'voided', label: 'Anulados', icon: 's:close-circle' },
  ];
  kpiCount(st: GiftcardState) { return DEMO_LOTS.filter(l => l.state === st && (!this.countries().length || this.countries().includes(l.country))).length; }
  readonly channels = signal<string[]>([]);
  readonly client = signal<string | null>(null);
  readonly period = signal<DateRangeValue | null>(null);
  readonly onlyAlerts = signal(false);
  readonly countryOptions: ZcOption<CountryCode>[] = COUNTRIES.map(c => ({ value: c.code, label: c.name, flag: c.code }));
  readonly stateOptions: ZcOption<GiftcardState>[] = (Object.keys(STATE_LABEL) as GiftcardState[]).map(s => ({ value: s, label: STATE_LABEL[s], icon: GIFTCARD_LOOK[s].icon as IconName }));
  readonly channelOptions: ZcOption<string>[] = [{ value: 'Correo', label: 'Correo', icon: 's:letter' }, { value: 'WhatsApp', label: 'WhatsApp', icon: 's:phone' }, { value: 'ZIP', label: 'Archivo ZIP', icon: 's:archive' }];
  readonly clientOptions: ZcOption<string>[] = [...new Set(DEMO_LOTS.map(l => l.client))].sort((a, b) => compareValues(a, b)).map(c => ({ value: c, label: c }));

  readonly chips = computed<ZcFilterChip[]>(() => [
    ...this.countries().map(c => ({ id: 'country:' + c, label: 'País: ' + this.countryName(c) })),
    ...this.states().map(s => ({ id: 'state:' + s, label: 'Estado: ' + STATE_LABEL[s] })),
    ...this.channels().map(c => ({ id: 'channel:' + c, label: 'Canal: ' + c })),
    ...(this.client() ? [{ id: 'client:' + this.client(), label: 'Cliente: ' + this.client() }] : []),
    ...(this.onlyAlerts() ? [{ id: 'alerts', label: 'Solo con alertas' }] : []),
  ]);
  removeChip(c: ZcFilterChip) {
    const [k, v] = c.id.split(':');
    if (k === 'country') this.countries.update(l => l.filter(x => x !== v));
    if (k === 'state') this.states.update(l => l.filter(x => x !== v));
    if (k === 'channel') this.channels.update(l => l.filter(x => x !== v));
    if (k === 'client') this.client.set(null);
    if (k === 'alerts') this.onlyAlerts.set(false);
  }
  clearFilters() { this.countries.set([]); this.states.set([]); this.channels.set([]); this.client.set(null); this.onlyAlerts.set(false); this.period.set(null); this.query.set(''); }

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return DEMO_LOTS.filter(l => (!q || (l.name + l.client + l.id).toLowerCase().includes(q))
      && (!this.countries().length || this.countries().includes(l.country))
      && (!this.states().length || this.states().includes(l.state))
      && (!this.channels().length || this.channels().includes(l.channel))
      && (!this.client() || l.client === this.client())
      && (!this.onlyAlerts() || (l.state === 'activated' && l.activated / l.qty < 0.5)));
  });
  readonly countText = computed(() => (this.chips().length || this.query() ? `${this.filtered().length} de ${DEMO_LOTS.length} lotes` : `${DEMO_LOTS.length} lotes`));
  readonly resultText = computed(() => `${this.filtered().length} lotes`);

  // Orden (compartido entre el menú de la vista y los encabezados de la tabla)
  readonly sort = signal<ZcSort>(SORTS[0].sort);
  readonly sortItems = computed(() => SORTS.map(s => ({ id: s.id, label: s.label, checked: this.sort()?.id === s.sort.id && this.sort()?.desc === s.sort.desc }) as ZcMenuItem));
  readonly sortLabel = computed(() => SORTS.find(s => s.sort.id === this.sort()?.id && s.sort.desc === this.sort()?.desc)?.label ?? 'Personalizado');
  onSort(it: ZcMenuItem) { this.sort.set(SORTS.find(s => s.id === it.id)!.sort); }
  private readonly sortValue: Record<string, (l: DemoLot) => string | number> = {
    name: l => l.name, client: l => l.client, country: l => this.countryName(l.country), state: l => STATE_LABEL[l.state],
    amount: l => l.unit * l.qty, qty: l => l.qty, activated: l => l.activated, expires: l => l.expires, channel: l => l.channel,
  };
  readonly sorted = computed(() => {
    const s = this.sort(); const list = [...this.filtered()];
    if (!s) return list;
    const get = this.sortValue[s.id];
    return list.sort((a, b) => compareValues(get(a), get(b)) * (s.desc ? -1 : 1));
  });

  // Vista y paginación
  readonly view = signal<DataViewMode>('cards');
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly pageRows = computed(() => this.sorted().slice((this.page() - 1) * this.pageSize(), this.page() * this.pageSize()));
  readonly selection = signal<string[]>([]);
  readonly tableState = signal<unknown>('data');
  readonly tableRows = computed(() => (this.tableState() === 'empty' ? [] : this.pageRows()));
  constructor() {
    super();
    // Al cambiar filtros u orden se vuelve a la primera página.
    effect(() => { this.filtered(); this.sort(); this.page.set(1); });
  }

  readonly columns: ZcColumn<DemoLot>[] = [
    { id: 'name', header: 'Lote', value: l => l.name, sortable: true },
    { id: 'client', header: 'Cliente', value: l => l.client, sortable: true },
    { id: 'country', header: 'País', value: l => this.countryName(l.country), sortable: true },
    { id: 'state', header: 'Estado', value: l => STATE_LABEL[l.state], sortable: true },
    { id: 'amount', header: 'Valor del lote', value: l => l.unit * l.qty, align: 'end', sortable: true },
    { id: 'qty', header: 'Cantidad', value: l => l.qty, align: 'end', sortable: true },
    { id: 'activated', header: 'Activados', value: l => l.activated, align: 'end', sortable: true },
    { id: 'expires', header: 'Vence', value: l => l.expires, sortable: true },
    { id: 'channel', header: 'Canal', value: l => l.channel, hidden: true },
  ];
  readonly rowId = (l: DemoLot) => l.id;
  readonly rowLabel = (l: DemoLot) => `lote ${l.id}`;
  readonly lotMenu = LOT_MENU;
  readonly lotCountry = (l: DemoLot) => l.country;
  readonly money = (l: DemoLot) => formatMoney(l.unit * l.qty, l.country);

  readonly voidOpen = signal(false);
  readonly voidIds = signal<string[]>([]);
  readonly voidTitle = computed(() => (this.voidIds().length === 1 ? `¿Anular el lote ${this.voidIds()[0]}?` : `¿Anular ${this.voidIds().length} lotes?`));
  onLotMenu(it: ZcMenuItem, l: DemoLot) {
    if (it.id === 'anular') { this.askVoid([l.id]); return; }
    this.toast.info(`${it.label} · ${l.id}`, { text: 'Acción simulada.' });
  }
  askVoid(ids: string[]) { this.voidIds.set(ids); this.voidOpen.set(true); }
  confirmVoid() {
    const n = this.voidIds().length;
    this.voidOpen.set(false);
    this.selection.update(s => s.filter(id => !this.voidIds().includes(id)));
    this.toast.success(n === 1 ? 'Anulación solicitada' : `Anulación de ${n} lotes solicitada`, { text: 'Pendiente de aprobación de un segundo usuario.' });
  }
  bulk(action: string, ids: string[]) { this.toast.info(`${action}: ${ids.length} lotes`, { text: 'Acción simulada.' }); }

  // Gráficos
  readonly trendPeriod = signal<number | null>(30);
  readonly trendCountry = signal<string | string[] | null>('all');
  readonly trendCompare = signal(true);
  readonly topCountry = signal<string | string[] | null>('pe');
  readonly topMetric = signal<string | null>('valor');
  readonly mixCountry = signal<string | string[] | null>('all');
  readonly catCountry = signal<string | string[] | null>('all');
  readonly mixPct = signal<string | null>('abs');
  readonly catPeriod = signal<number | null>(30);
  readonly chartState = signal<unknown>('data');
  // Como index.html: periodo, métrica y escala del gráfico son segmentados chicos en la barra del gráfico.
  readonly periodSegs: ZcSegment<number>[] = [{ value: 7, label: '7 d' }, { value: 30, label: '30 d' }, { value: 90, label: '90 d' }];
  readonly metricSegs: ZcSegment[] = [{ value: 'valor', label: 'Valor' }, { value: 'cant', label: 'Cantidad' }];
  readonly scaleSegs: ZcSegment[] = [{ value: 'abs', label: 'Montos' }, { value: 'pct', label: '%' }];
  readonly periodOptions: ZcOption<number>[] = [{ value: 7, label: 'Últimos 7 días' }, { value: 30, label: 'Últimos 30 días' }, { value: 90, label: 'Últimos 90 días' }];
  readonly chartCountries: ZcOption<string>[] = [{ value: 'all', label: 'Todos los países', icon: 's:global' }, ...(['pe', 'co', 'cl', 'mx'] as CountryCode[]).map(c => ({ value: c, label: this.countryName(c), flag: c }))];
  readonly topCountries = this.chartCountries.slice(1);
  private readonly none = { categories: [], series: [] };
  readonly trend = computed(() => this.chartState() === 'empty' ? this.none : trendData(this.trendPeriod() as number, this.trendCountry() as string, this.trendCompare()));
  readonly top = computed(() => this.chartState() === 'empty' ? this.none : topClientsData(this.topCountry() as string, this.topMetric() as 'valor' | 'cant'));
  readonly mix = computed(() => (this.chartState() === 'empty' ? { categories: [], series: [] } : mixData(this.mixCountry() as string, this.mixPct() === 'pct')));
  readonly cats = computed(() => this.chartState() === 'empty' ? this.none : categoryData('all', this.catPeriod() as number));
  readonly topFormat = computed(() => {
    const c = this.topCountry() as CountryCode;
    return this.topMetric() === 'valor' ? (v: number) => formatMoneyCompact(v, c) : (v: number) => v.toLocaleString('es-PE');
  });
  readonly periodText = (days: unknown) => `Últimos ${days} días`;
  readonly countryText = (c: unknown) => (c === 'all' ? 'todos los países' : this.countryName(c as CountryCode));
  retryChart() { this.chartState.set('loading'); setTimeout(() => this.chartState.set('data'), 900); }

  // Estados
  readonly techDetails = { code: 'BANK_FORMAT_INVALID (422)', service: 'payments-service · POST /payouts/file', date: '10 oct, 2026 · 2:30 p. m.' };
}
