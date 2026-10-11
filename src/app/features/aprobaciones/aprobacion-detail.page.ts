import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { AppError } from '../../core/http/interceptors';
import { countryByCode } from '@zonacards/ui/core';
import { APPROVAL_LOOK } from '@zonacards/ui/core';
import { BadgeComponent } from '@zonacards/ui/badge';
import { ButtonDirective } from '@zonacards/ui/button';
import { FlagComponent } from '@zonacards/ui/flag';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { SkeletonComponent } from '@zonacards/ui/skeleton';
import { injectLang, injectTranslate } from '@zonacards/ui/core';
import { AlertActionDirective, AlertComponent } from '@zonacards/ui/alert';
import { ToastService } from '@zonacards/ui/toast';
import { PageHeaderComponent } from '@zonacards/ui/page-header';
import { StateComponent } from '@zonacards/ui/state';
import { TYPE_ICON, approvalDate, approvalMoney } from './aprobaciones-ui';
import { Decision } from './aprobaciones.models';
import { AprobacionesService } from './aprobaciones.service';
import { DecisionDialogComponent } from './decision-dialog.component';

/**
 * Detalle de una solicitud (sección 8.10): qué se aprueba, quién lo pidió y por qué, el antes y el después, y el historial.
 * Aprobar o Rechazar con comentario solo si el usuario puede (nunca sobre su propia solicitud); si es suya, puede retirarla.
 */
@Component({
  selector: 'zc-aprobacion-detail-page',
  imports: [
    RouterLink, TranslocoPipe, BadgeComponent, ButtonDirective, FlagComponent, IconComponent, SkeletonComponent, AlertComponent, AlertActionDirective,
    PageHeaderComponent, StateComponent, DecisionDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './aprobacion-detail.page.html',
})
export class AprobacionDetailPage {
  /** Parámetro de ruta :id. */
  readonly id = input.required<string>();
  private readonly svc = inject(AprobacionesService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly t = injectTranslate();
  readonly lang = injectLang();
  readonly asIcon = (s: string) => s as IconName;
  readonly date = (iso: string) => approvalDate(iso, this.lang());

  readonly res = this.svc.detail(() => this.id());
  readonly a = computed(() => (this.res.hasValue() ? this.res.value() : null));
  readonly error = computed(() => (this.res.error() as AppError | undefined) ?? null);
  readonly notFound = computed(() => this.error()?.status === 404);
  readonly look = computed(() => { const a = this.a(); return a ? APPROVAL_LOOK[a.state] : null; });
  readonly icon = computed(() => { const a = this.a(); return a ? TYPE_ICON[a.type] : null; });
  readonly money = computed(() => { const a = this.a(); return a ? approvalMoney(a) : null; });
  readonly country = computed(() => { const a = this.a(); return a ? countryByCode(a.country) : null; });
  readonly roles = computed(() => this.a()?.approverRoles.join(this.t('aprobaciones.detalle.rolesSep')) ?? '');
  readonly typeLabel = computed(() => { const a = this.a(); return a ? this.t('aprobaciones.tipos.' + a.type) : this.id(); });
  readonly crumbs = computed(() => [{ label: this.t('nav.inicio'), link: '/inicio' }, { label: this.t('aprobaciones.titulo'), link: '/aprobaciones' }, { label: this.id() }]);
  /** Enlace a la ficha del registro afectado (por ahora solo existen las fichas de lotes). */
  readonly entityLink = computed(() => { const e = this.a()?.entity; return e?.kind === 'lote' ? ['/lotes', e.id] : null; });

  readonly decision = signal<Decision | null>(null);
  readonly items = computed(() => { const a = this.a(); return a ? [a] : []; });
  onDone() { this.res.reload(); }

  readonly withdrawing = signal(false);
  async withdraw() {
    const a = this.a();
    if (!a) return;
    this.withdrawing.set(true);
    try {
      await this.svc.withdraw(a.id);
      this.toast.success(this.t('aprobaciones.resultado.retirada'));
      void this.router.navigate(['/aprobaciones'], { queryParams: { bandeja: 'mis-solicitudes' } });
    } catch (e) { this.toast.error(this.t('aprobaciones.resultado.error'), { text: (e as Partial<AppError>).message }); }
    finally { this.withdrawing.set(false); }
  }
}
