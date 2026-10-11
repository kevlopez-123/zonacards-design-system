import { Injectable, inject } from '@angular/core';
import { AppError } from '../../core/http/interceptors';
import { SessionService } from '../../core/session/session.service';
import { countryByCode } from '@zonacards/ui/core';
import { formatDate, todayIso } from '@zonacards/ui/core';
import { MIME, Rows, downloadBlob, exportFileName, toCsv, toPdf, toXlsx } from '@zonacards/ui/core';
import { formatMoney } from '@zonacards/ui/core';
import { GIFTCARD_LOOK, GIFTCARD_TRANSITIONS } from '@zonacards/ui/core';
import { injectLang, injectTranslate } from '@zonacards/ui/core';
import { ZcMenuItem } from '@zonacards/ui/menu';
import { ToastService } from '@zonacards/ui/toast';
import { Lote } from './lotes.models';
import { LotesService } from './lotes.service';

export type ExportFormat = 'xlsx' | 'csv' | 'pdf';
export const lotAmount = (l: Lote) => l.unitAmount * l.quantity;
export const lotPct = (l: Lote) => (l.quantity ? Math.round((l.activated / l.quantity) * 100) : 0);

/** Solo se puede pedir anular si la máquina de estados lo permite, quedan códigos y no hay otra solicitud pendiente. */
export function voidBlock(l: Lote): 'state' | 'empty' | 'pending' | null {
  if (!GIFTCARD_TRANSITIONS[l.state].includes('voided')) return 'state';
  if (l.pendingVoid) return 'pending';
  if (!l.available) return 'empty';
  return null;
}

/**
 * Acciones de Lotes que comparten el listado y la ficha: menú ⋮, descargas y solicitud de anulación.
 * Se provee en cada página (providers) para usar su idioma, sesión y toasts.
 */
@Injectable()
export class LotesActions {
  private readonly svc = inject(LotesService);
  private readonly session = inject(SessionService);
  private readonly toast = inject(ToastService);
  readonly t = injectTranslate();
  readonly lang = injectLang();

  date = (iso: string) => formatDate(new Date(iso.length === 10 ? iso + 'T12:00:00' : iso), 'medium', { lang: this.lang() });
  money = (l: Lote) => formatMoney(lotAmount(l), l.country);
  stateLabel = (l: Pick<Lote, 'state'>) => this.t(GIFTCARD_LOOK[l.state].labelKey);

  /** Menú ⋮ de un lote. Lo que el rol no puede hacer no aparece; lo imposible se muestra deshabilitado con el motivo. */
  menu(l: Lote, opts: { withView: boolean }): ZcMenuItem[] {
    const items: ZcMenuItem[] = [];
    if (opts.withView) items.push({ id: 'ver', label: this.t('lotes.acciones.ver'), icon: 's:eye' });
    const soon = this.t('lotes.acciones.proximamente');
    items.push(
      { id: 'envio', label: this.t('lotes.acciones.envio'), icon: 's:plain', disabled: true, description: soon },
      { id: 'activacion', label: this.t('lotes.acciones.activacion'), icon: 's:check-circle', disabled: true, description: soon },
      { id: 'descargar', label: this.t('lotes.acciones.descargar'), icon: 's:download-minimalistic' },
    );
    if (this.session.can('lotes.anular')) {
      const block = voidBlock(l);
      if (block !== 'state') {
        items.push({
          id: 'anular', label: this.t('lotes.acciones.anular'), icon: 's:close-circle', danger: true, separatorBefore: true, disabled: !!block,
          description: block === 'pending' ? this.t('lotes.acciones.yaPendiente') : block === 'empty' ? this.t('lotes.acciones.sinDisponibles') : undefined,
        });
      }
    }
    return items;
  }

  /** Filas con cifras sin formato y fechas ISO (sección 17): se pueden sumar y ordenar en Excel. */
  rows(lots: readonly Lote[]): Rows {
    const t = this.t;
    return [
      ['ID', t('lotes.lote'), t('lotes.cliente'), t('lotes.programa'), t('lotes.giftcard'), t('lotes.pais'), t('lotes.estado'), t('lotes.valor'), 'Moneda',
        t('lotes.cantidad'), t('lotes.activados'), t('lotes.disponibles'), t('lotes.creado'), t('lotes.vence')],
      ...lots.map(l => ['#' + l.id, l.name, l.client, l.program, l.giftcard, countryByCode(l.country).name, this.stateLabel(l), lotAmount(l),
        countryByCode(l.country).currency, l.quantity, l.activated, l.available, l.createdAt, l.expiresAt]),
    ];
  }

  download(format: ExportFormat, rows: Rows, name: string, subtitle: string) {
    const file = exportFileName(name, format, todayIso());
    if (format === 'csv') downloadBlob(toCsv(rows), MIME.csv, file);
    else if (format === 'xlsx') downloadBlob(toXlsx(rows, name.slice(0, 31)), MIME.xlsx, file);
    else downloadBlob(toPdf(rows, { title: name, subtitle, rightAlign: [7, 9, 10, 11] }), MIME.pdf, file);
  }

  exportItems(): ZcMenuItem[] {
    const g = this.t('org.descargarComo');
    return [
      { id: 'xlsx', label: this.t('lotes.exportar.excel'), description: this.t('lotes.exportar.ayudaExcel'), icon: 's:document', group: g },
      { id: 'csv', label: this.t('lotes.exportar.csv'), description: this.t('lotes.exportar.ayudaCsv'), icon: 's:file', group: g },
      { id: 'pdf', label: this.t('lotes.exportar.pdf'), description: this.t('lotes.exportar.ayudaPdf'), icon: 's:file', group: g },
    ];
  }

  /** CSV con los códigos enmascarados del lote. */
  async downloadCodes(l: Lote) {
    try {
      const codes = await this.svc.allCodes(l.id);
      const t = this.t;
      const rows: Rows = [[t('lotes.ficha.codigo'), t('lotes.estado'), t('lotes.ficha.activadoEl'), t('lotes.ficha.destinatario')],
        ...codes.items.map(c => [c.masked, t(GIFTCARD_LOOK[c.state].labelKey), c.activatedAt ?? '', c.recipient ?? ''])];
      downloadBlob(toCsv(rows), MIME.csv, exportFileName(`lote-${l.id}-codigos`, 'csv', todayIso()));
      this.toast.success(t('lotes.exportar.listo'));
    } catch (e) { this.fail(e, 'lotes.exportar.error'); }
  }

  /** Solicita la anulación (doble aprobación). Devuelve true si quedó pendiente. */
  async requestVoid(l: Lote, reason: string, codes?: string[]): Promise<boolean> {
    try {
      const req = await this.svc.requestVoid(l.id, { reason, scope: codes ? 'selection' : 'all', codes, requestedBy: this.session.user()?.name ?? '' });
      this.toast.success(this.t('lotes.anular.exito'), { text: this.t('lotes.anular.exitoTexto', { rol: req.approverRole }) });
      return true;
    } catch (e) { this.fail(e, 'lotes.anular.error'); return false; }
  }

  fail(e: unknown, titleKey: string) {
    const err = e as Partial<AppError>;
    this.toast.error(this.t(titleKey), { text: [err.message, err.reference ? `${this.t('comun.referencia')} ${err.reference}` : ''].filter(Boolean).join('. ') });
  }
}
