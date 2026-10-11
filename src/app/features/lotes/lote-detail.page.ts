import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AppError } from '../../core/http/interceptors';
import { SessionService } from '../../core/session/session.service';
import { countryByCode } from '@zonacards/ui/core';
import { formatDate } from '@zonacards/ui/core';
import { GIFTCARD_LOOK } from '@zonacards/ui/core';
import { BadgeComponent } from '@zonacards/ui/badge';
import { ButtonDirective } from '@zonacards/ui/button';
import { FlagComponent } from '@zonacards/ui/flag';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { MoneyComponent } from '@zonacards/ui/money';
import { ProgressComponent } from '@zonacards/ui/progress';
import { SkeletonComponent } from '@zonacards/ui/skeleton';
import { AlertActionDirective, AlertComponent } from '@zonacards/ui/alert';
import { MenuComponent, ZcMenuItem } from '@zonacards/ui/menu';
import { PaginationComponent } from '@zonacards/ui/pagination';
import { TabPanelDirective, TabsComponent, ZcTab } from '@zonacards/ui/tabs';
import { ToastService } from '@zonacards/ui/toast';
import { BulkActionsDirective, CellDefDirective, DataTableComponent, ZcColumn } from '@zonacards/ui/table';
import { KpiComponent } from '@zonacards/ui/kpi';
import { AlertDialogComponent } from '@zonacards/ui/overlay';
import { PageHeaderComponent } from '@zonacards/ui/page-header';
import { StateComponent } from '@zonacards/ui/state';
import { LotesActions, lotAmount, lotPct, voidBlock } from './lotes-ui';
import { LoteCode, LoteEvent, LoteSend } from './lotes.models';
import { LotesService } from './lotes.service';

/**
 * Ficha del lote (P3 Detalle, sección 8.4): cabecera con estado y cantidades · pestañas Códigos (enmascarados), Envíos e Historial
 * · datos del lote al costado en desktop. Anulación total o por selección de códigos, siempre con motivo y doble aprobación:
 * la ficha muestra quién solicitó y quién debe aprobar, y quien solicitó puede retirar la solicitud.
 */
@Component({
  selector: 'zc-lote-detail-page',
  imports: [
    RouterLink, TranslocoPipe, BadgeComponent, ButtonDirective, FlagComponent, IconComponent, MoneyComponent, ProgressComponent, SkeletonComponent,
    AlertComponent, AlertActionDirective, MenuComponent, PaginationComponent, TabsComponent, TabPanelDirective, DataTableComponent, CellDefDirective,
    BulkActionsDirective, KpiComponent, AlertDialogComponent, PageHeaderComponent, StateComponent,
  ],
  providers: [LotesActions],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lote-detail.page.html',
})
export class LoteDetailPage {
  /** Parámetro de ruta :id (withComponentInputBinding). */
  readonly id = input.required<string>();
  private readonly svc = inject(LotesService);
  private readonly session = inject(SessionService);
  private readonly toast = inject(ToastService);
  readonly ui = inject(LotesActions);
  readonly t = this.ui.t;
  readonly asIcon = (s: string) => s as IconName;
  readonly codeLook = (c: LoteCode) => GIFTCARD_LOOK[c.state];

  readonly detail = this.svc.detail(() => this.id());
  readonly lot = computed(() => (this.detail.hasValue() ? this.detail.value() : null));
  readonly error = computed(() => (this.detail.error() as AppError | undefined) ?? null);
  readonly notFound = computed(() => this.error()?.status === 404);
  readonly look = computed(() => { const l = this.lot(); return l ? GIFTCARD_LOOK[l.state] : null; });
  readonly country = computed(() => { const l = this.lot(); return l ? countryByCode(l.country) : null; });
  readonly pct = computed(() => { const l = this.lot(); return l ? lotPct(l) : 0; });
  readonly amount = computed(() => { const l = this.lot(); return l ? lotAmount(l) : 0; });
  readonly crumbs = computed(() => [{ label: this.t('nav.inicio'), link: '/inicio' }, { label: this.t('lotes.titulo'), link: '/lotes' }, { label: '#' + this.id() }]);
  readonly subtitle = computed(() => { const l = this.lot(); return l ? `#${l.id} · ${l.client} · ${l.program}` : ''; });
  readonly menu = computed<ZcMenuItem[]>(() => { const l = this.lot(); return l ? this.ui.menu(l, { withView: false }).filter(i => i.id !== 'anular') : []; });
  readonly canVoid = computed(() => { const l = this.lot(); return !!l && this.session.can('lotes.anular') && !voidBlock(l); });
  readonly isRequester = computed(() => this.lot()?.pendingVoid?.requestedBy === this.session.user()?.name);

  // Pestañas
  readonly tab = signal<string | undefined>('codigos');
  readonly sends = this.svc.sends(() => this.id());
  readonly history = this.svc.history(() => this.id());
  readonly sendList = computed<LoteSend[]>(() => (this.sends.hasValue() ? this.sends.value() : []));
  readonly events = computed<LoteEvent[]>(() => (this.history.hasValue() ? this.history.value() : []));
  readonly tabs = computed<ZcTab[]>(() => [
    { value: 'codigos', label: this.t('lotes.ficha.codigos'), icon: 's:gift', count: this.lot()?.quantity },
    { value: 'envios', label: this.t('lotes.ficha.envios'), icon: 's:plain', count: this.sends.hasValue() ? this.sendList().length : undefined },
    { value: 'historial', label: this.t('lotes.ficha.historial'), icon: 's:history' },
  ]);

  // Códigos (paginados en servidor, enmascarados)
  readonly codePage = signal(1);
  readonly codeSize = signal(25);
  readonly codes = this.svc.codes(() => this.id(), () => this.codePage(), () => this.codeSize());
  readonly codeItems = computed<LoteCode[]>(() => (this.codes.hasValue() ? this.codes.value().items : []));
  readonly codeTotal = computed(() => (this.codes.hasValue() ? this.codes.value().total : this.lot()?.quantity ?? 0));
  readonly selection = signal<string[]>([]);
  readonly codeColumns = computed<ZcColumn<LoteCode>[]>(() => [
    { id: 'masked', header: this.t('lotes.ficha.codigo'), value: c => c.masked },
    { id: 'state', header: this.t('lotes.estado'), value: c => c.state },
    { id: 'activatedAt', header: this.t('lotes.ficha.activadoEl'), value: c => c.activatedAt },
    { id: 'recipient', header: this.t('lotes.ficha.destinatario'), value: c => c.recipient },
  ]);
  readonly sendColumns = computed<ZcColumn<LoteSend>[]>(() => [
    { id: 'date', header: this.t('lotes.ficha.fecha'), value: s => s.date },
    { id: 'channel', header: this.t('lotes.canal'), value: s => this.t('lotes.canales.' + s.channel) },
    { id: 'total', header: this.t('lotes.ficha.total'), value: s => s.total, align: 'end' },
    { id: 'delivered', header: this.t('lotes.ficha.entregados'), value: s => s.delivered, align: 'end' },
    { id: 'opened', header: this.t('lotes.ficha.abiertos'), value: s => s.opened, align: 'end' },
    { id: 'activated', header: this.t('lotes.activados'), value: s => s.activated, align: 'end' },
    { id: 'failed', header: this.t('lotes.ficha.conError'), value: s => s.failed, align: 'end' },
  ]);
  readonly codeId = (c: LoteCode) => c.id;
  readonly codeLabel = (c: LoteCode) => this.t('lotes.ficha.seleccionCodigo', { c: c.masked });
  readonly sendId = (s: LoteSend) => s.id;
  dateTime(iso: string) { return formatDate(new Date(iso), 'dt-medium', { lang: this.ui.lang() }); }
  eventText(e: LoteEvent) { return this.t('lotes.ficha.evento.' + e.kind, { n: Number(e.detail).toLocaleString('es-PE') }); }

  // Anulación total o por selección
  readonly voidOpen = signal(false);
  readonly voidCodes = signal<string[] | null>(null);
  readonly voiding = signal(false);
  readonly voidTitle = computed(() => this.t('lotes.anular.titulo', { n: this.voidCodes()?.length ?? this.lot()?.available ?? 0, id: this.id() }));
  askVoid(codes: string[] | null) { this.voidCodes.set(codes); this.voidOpen.set(true); }
  async confirmVoid(reason: string) {
    const l = this.lot();
    if (!l) return;
    this.voiding.set(true);
    const ok = await this.ui.requestVoid(l, reason, this.voidCodes() ?? undefined);
    this.voiding.set(false);
    this.voidOpen.set(false);
    if (ok) { this.selection.set([]); this.detail.reload(); this.history.reload(); }
  }
  readonly withdrawing = signal(false);
  async withdraw() {
    const l = this.lot();
    if (!l?.pendingVoid) return;
    this.withdrawing.set(true);
    try {
      await this.svc.cancelVoid(l.id, l.pendingVoid.id);
      this.toast.success(this.t('lotes.aprobacion.retirada'));
      this.detail.reload(); this.history.reload();
    } catch (e) { this.ui.fail(e, 'lotes.anular.error'); } finally { this.withdrawing.set(false); }
  }

  onMenu(it: ZcMenuItem) {
    const l = this.lot();
    if (l && it.id === 'descargar') void this.ui.downloadCodes(l);
  }
}
