import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AppError } from '../../core/http/interceptors';
import { COUNTRIES, CountryCode, countryByCode } from '@zonacards/ui/core';
import { APPROVAL_LOOK, ApprovalState } from '@zonacards/ui/core';
import { BadgeComponent } from '@zonacards/ui/badge';
import { ButtonDirective } from '@zonacards/ui/button';
import { CheckboxComponent } from '@zonacards/ui/checkbox';
import { FlagComponent } from '@zonacards/ui/flag';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { SkeletonComponent } from '@zonacards/ui/skeleton';
import { injectLang, injectTranslate } from '@zonacards/ui/core';
import { FieldComponent } from '@zonacards/ui/field';
import { ZcOption } from '@zonacards/ui/listbox';
import { MenuComponent, ZcMenuItem } from '@zonacards/ui/menu';
import { PaginationComponent } from '@zonacards/ui/pagination';
import { SelectComponent } from '@zonacards/ui/select';
import { TabPanelDirective, TabsComponent, ZcTab } from '@zonacards/ui/tabs';
import { ToastService } from '@zonacards/ui/toast';
import { BulkActionsDirective, CellDefDirective, DataTableComponent, RowActionsDirective, ZcColumn } from '@zonacards/ui/table';
import { CardsViewDirective, DataViewComponent, DataViewMode, TableViewDirective } from '@zonacards/ui/table';
import { FilterBarComponent, FilterMainDirective, ZcFilterChip } from '@zonacards/ui/table';
import { PageHeaderComponent } from '@zonacards/ui/page-header';
import { StateComponent } from '@zonacards/ui/state';
import { NARROW_QUERY, injectMedia } from '@zonacards/ui/core';
import { PAGE_SIZES, approvalsQueryParams, parseApprovalsQuery } from './aprobaciones-query';
import { TYPE_ICON, approvalDate, approvalMoney } from './aprobaciones-ui';
import { APPROVAL_TYPES, Approval, ApprovalsPage, ApprovalsQuery, ApprovalTab, ApprovalType, Decision } from './aprobaciones.models';
import { AprobacionesService } from './aprobaciones.service';
import { TooltipDirective } from '@zonacards/ui/tooltip';
import { DecisionDialogComponent } from './decision-dialog.component';

const STATES: ApprovalState[] = ['pending', 'executed', 'rejected'];

/**
 * Bandeja de aprobaciones (maker-checker, sección 8.10). Pestañas "Por aprobar" y "Mis solicitudes".
 * Journey del Supervisor: filtrar por tipo → revisar → aprobar la selección, con resumen de cantidad y montos antes de confirmar.
 * Segregación de funciones: nunca aparece Aprobar sobre una solicitud propia; el servidor también lo impide.
 * En móvil (consulta) no hay selección masiva: se aprueba una a una desde la tarjeta o el detalle.
 */
@Component({
  selector: 'zc-aprobaciones-page',
  imports: [
    TooltipDirective, NgTemplateOutlet, RouterLink, TranslocoPipe, BadgeComponent, ButtonDirective, CheckboxComponent, FlagComponent, IconComponent, SkeletonComponent, FieldComponent,
    MenuComponent, PaginationComponent, SelectComponent, TabsComponent, TabPanelDirective, DataTableComponent, CellDefDirective, RowActionsDirective, BulkActionsDirective,
    DataViewComponent, CardsViewDirective, TableViewDirective, FilterBarComponent, FilterMainDirective, PageHeaderComponent, StateComponent, DecisionDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './aprobaciones.page.html',
})
export class AprobacionesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(AprobacionesService);
  private readonly toast = inject(ToastService);
  readonly t = injectTranslate();
  readonly lang = injectLang();
  readonly narrow = injectMedia(NARROW_QUERY);
  readonly typeIcon = TYPE_ICON;
  readonly iconOf = (a: Approval) => TYPE_ICON[a.type];
  readonly pageSizes = PAGE_SIZES;
  readonly money = approvalMoney;
  readonly date = (iso: string) => approvalDate(iso, this.lang());
  readonly look = (a: Approval) => APPROVAL_LOOK[a.state];
  readonly asIcon = (s: string) => s as IconName;
  readonly countryName = (c: CountryCode) => countryByCode(c).name;

  private readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  readonly query = computed(() => parseApprovalsQuery(k => this.params().get(k)));
  readonly view = computed<DataViewMode>(() => (this.params().get('vista') === 'tabla' ? 'table' : 'cards'));
  readonly search = linkedSignal(() => this.query().q);
  private searchTimer?: ReturnType<typeof setTimeout>;

  readonly res = this.svc.list(() => this.query());
  /** Última respuesta: al cambiar filtros se sigue viendo la anterior (atenuada) en vez de parpadear. */
  readonly data = linkedSignal<ApprovalsPage | undefined, ApprovalsPage | undefined>({
    source: () => (this.res.hasValue() ? this.res.value() : undefined),
    computation: (v, prev) => v ?? prev?.value,
  });
  readonly items = computed(() => this.data()?.items ?? []);
  readonly total = computed(() => this.data()?.total ?? 0);
  readonly error = computed(() => (this.res.error() as AppError | undefined) ?? null);
  readonly firstLoad = computed(() => this.res.isLoading() && !this.data());
  readonly filtered = computed(() => { const q = this.query(); return !!(q.type.length || q.country.length || q.state.length || q.q); });
  readonly isInbox = computed(() => this.query().tab === 'por-aprobar');

  constructor() { inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer)); }

  readonly crumbs = computed(() => [{ label: this.t('nav.inicio'), link: '/inicio' }, { label: this.t('aprobaciones.titulo') }]);
  readonly subtitle = computed(() => { const c = this.data()?.counts; return c ? this.t('aprobaciones.conteoPorAprobar', { n: c.porAprobar }) : ''; });
  readonly tabs = computed<ZcTab[]>(() => {
    const c = this.data()?.counts;
    return [
      { value: 'por-aprobar', label: this.t('aprobaciones.tabs.porAprobar'), icon: 's:checklist-minimalistic', count: c?.porAprobar },
      { value: 'mis-solicitudes', label: this.t('aprobaciones.tabs.misSolicitudes'), icon: 's:user-check', count: c?.misSolicitudes || undefined },
    ];
  });

  update(patch: Partial<ApprovalsQuery>, opts: { keepPage?: boolean; replace?: boolean } = {}) {
    const next = { ...this.query(), ...patch };
    if (!opts.keepPage && patch.page === undefined) next.page = 1;
    void this.router.navigate([], { relativeTo: this.route, replaceUrl: opts.replace, queryParams: { ...approvalsQueryParams(next), vista: this.view() === 'table' ? 'tabla' : null } });
  }
  setTab(v: string | undefined) {
    if (!v || v === this.query().tab) return;
    this.selection.set([]);
    this.update({ tab: v as ApprovalTab, state: [] });
  }
  setView(v: DataViewMode) {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { vista: v === 'table' ? 'tabla' : null }, queryParamsHandling: 'merge', replaceUrl: true });
  }
  onSearch(q: string) {
    this.search.set(q);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.update({ q: q.trim() }, { replace: true }), 300);
  }

  // Filtros
  readonly typeOptions = computed<ZcOption<ApprovalType>[]>(() => APPROVAL_TYPES.map(t => ({ value: t, label: this.t('aprobaciones.tipos.' + t), icon: TYPE_ICON[t] })));
  readonly countryOptions: ZcOption<CountryCode>[] = COUNTRIES.map(c => ({ value: c.code, label: c.name, flag: c.code }));
  readonly stateOptions = computed<ZcOption<ApprovalState>[]>(() => STATES.map(s => ({ value: s, label: this.t(APPROVAL_LOOK[s].labelKey), icon: APPROVAL_LOOK[s].icon as IconName })));
  setList(k: 'type' | 'country' | 'state', v: unknown) { this.update({ [k]: Array.isArray(v) ? v : v ? [v] : [] } as Partial<ApprovalsQuery>); }
  readonly chips = computed<ZcFilterChip[]>(() => {
    const q = this.query(); const t = this.t;
    const chip = (id: string, k: string, v: string) => ({ id, label: t('aprobaciones.filtro.chip', { k: t(k), v }) });
    return [
      ...q.type.map(x => chip('type:' + x, 'aprobaciones.filtro.tipo', t('aprobaciones.tipos.' + x))),
      ...q.country.map(x => chip('country:' + x, 'aprobaciones.filtro.pais', this.countryName(x))),
      ...q.state.map(x => chip('state:' + x, 'aprobaciones.filtro.estado', t(APPROVAL_LOOK[x].labelKey))),
    ];
  });
  removeChip(c: ZcFilterChip) {
    const [k, v] = c.id.split(':') as ['type' | 'country' | 'state', string];
    this.update({ [k]: (this.query()[k] as string[]).filter(x => x !== v) } as Partial<ApprovalsQuery>);
  }
  clearFilters() { this.search.set(''); this.update({ type: [], country: [], state: [], q: '' }); }

  // Selección (tarjetas y tabla comparten la misma) y decisiones
  readonly selection = signal<string[]>([]);
  readonly selectable = computed(() => this.isInbox() && !this.narrow());
  isSelected(id: string) { return this.selection().includes(id); }
  toggle(id: string, v: boolean) { this.selection.update(s => (v ? [...new Set([...s, id])] : s.filter(x => x !== id))); }
  readonly allSelected = computed(() => !!this.items().length && this.items().every(a => this.isSelected(a.id)));
  readonly someSelected = computed(() => !this.allSelected() && this.items().some(a => this.isSelected(a.id)));
  toggleAll(v: boolean) { const ids = this.items().map(a => a.id); this.selection.update(s => (v ? [...new Set([...s, ...ids])] : s.filter(x => !ids.includes(x)))); }

  readonly decisionItems = signal<Approval[]>([]);
  readonly decision = signal<Decision | null>(null);
  decide(d: Decision, items: Approval[]) { this.decisionItems.set(items); this.decision.set(d); }
  decideSelected(d: Decision, ids = this.selection()) {
    const items = this.items().filter(a => ids.includes(a.id) && a.allowed === 'ok');
    if (items.length) this.decide(d, items);
  }
  onDone() { this.selection.set([]); this.res.reload(); }

  readonly withdrawing = signal<string | null>(null);
  async withdraw(a: Approval) {
    this.withdrawing.set(a.id);
    try { await this.svc.withdraw(a.id); this.toast.success(this.t('aprobaciones.resultado.retirada')); this.res.reload(); }
    catch (e) { const err = e as Partial<AppError>; this.toast.error(this.t('aprobaciones.resultado.error'), { text: err.message }); }
    finally { this.withdrawing.set(null); }
  }

  menuFor = (a: Approval): ZcMenuItem[] => [
    { id: 'ver', label: this.t('aprobaciones.acciones.ver'), icon: 's:eye' },
    ...(a.allowed === 'ok' ? [
      { id: 'aprobar', label: this.t('aprobaciones.acciones.aprobar'), icon: 's:check-circle' as IconName },
      { id: 'rechazar', label: this.t('aprobaciones.acciones.rechazar'), icon: 's:close-circle' as IconName, danger: true },
    ] : []),
    ...(a.allowed === 'self' ? [{ id: 'retirar', label: this.t('aprobaciones.acciones.retirar'), icon: 's:undo-left' as IconName, separatorBefore: true }] : []),
  ];
  onMenu(it: ZcMenuItem, a: Approval) {
    if (it.id === 'ver') void this.router.navigate([a.id], { relativeTo: this.route });
    else if (it.id === 'aprobar') this.decide('approve', [a]);
    else if (it.id === 'rechazar') this.decide('reject', [a]);
    else if (it.id === 'retirar') void this.withdraw(a);
  }

  readonly columns = computed<ZcColumn<Approval>[]>(() => [
    { id: 'title', header: this.t('aprobaciones.campos.solicitud'), value: a => a.title },
    { id: 'type', header: this.t('aprobaciones.campos.tipo'), value: a => this.t('aprobaciones.tipos.' + a.type) },
    { id: 'requestedBy', header: this.t('aprobaciones.campos.solicito'), value: a => a.requestedBy.name },
    { id: 'requestedAt', header: this.t('aprobaciones.campos.fecha'), value: a => a.requestedAt },
    { id: 'amount', header: this.t('aprobaciones.campos.monto'), value: a => a.amount, align: 'end' },
    { id: 'quantity', header: this.t('aprobaciones.campos.cantidad'), value: a => a.quantity, align: 'end' },
    { id: 'state', header: this.t('aprobaciones.campos.estado'), value: a => a.state, hidden: this.isInbox() },
  ]);
  readonly rowId = (a: Approval) => a.id;
  readonly rowLabel = (a: Approval) => a.id;
}
