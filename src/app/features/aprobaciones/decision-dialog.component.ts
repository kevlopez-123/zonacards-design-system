import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { AppError } from '../../core/http/interceptors';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { SpinnerComponent } from '@zonacards/ui/spinner';
import { injectTranslate } from '@zonacards/ui/core';
import { FieldComponent, InputDirective } from '@zonacards/ui/field';
import { ToastService } from '@zonacards/ui/toast';
import { OverlayComponent } from '@zonacards/ui/overlay';
import { TYPE_ICON, decisionSummary } from './aprobaciones-ui';
import { Approval, Decision, DecisionResult } from './aprobaciones.models';
import { AprobacionesService } from './aprobaciones.service';

/**
 * Confirmación de Aprobar o Rechazar (una o varias). Antes de confirmar muestra el resumen: cuántas, de qué tipo,
 * la cantidad total y los montos por moneda. Rechazar exige comentario: la solicitud vuelve al solicitante con él.
 * Si algunas no se pudieron resolver (otro usuario las resolvió antes), lo dice: "Se resolvieron 4 de 5".
 */
@Component({
  selector: 'zc-decision-dialog',
  imports: [TranslocoPipe, ButtonDirective, IconComponent, SpinnerComponent, FieldComponent, InputDirective, OverlayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'hidden' },
  template: `
    <zc-modal [title]="title()" [subtitle]="(decision() === 'reject' ? 'aprobaciones.dialogo.textoRechazar' : 'aprobaciones.dialogo.textoAprobar') | transloco"
      [open]="!!decision()" (openChange)="onOpenChange($event)" [busy]="busy()" [dialogRole]="decision() === 'reject' ? 'alertdialog' : 'dialog'">
      <section class="grid gap-3 rounded-md bg-surface-2 p-4" [attr.aria-label]="'aprobaciones.dialogo.resumen' | transloco">
        <ul class="m-0 grid list-none gap-1.5 p-0 text-[15px]">
          @for (t of summary().byType; track t.type) {
            <li class="flex items-center gap-2"><zc-icon [name]="icon[t.type]" [size]="16" class="text-muted" />{{ 'aprobaciones.dialogo.nPorTipo' | transloco: { n: t.n, tipo: ('aprobaciones.tipos.' + t.type | transloco) } }}</li>
          }
        </ul>
        <dl class="m-0 grid grid-cols-[minmax(0,1fr)] gap-2 border-t border-border pt-3 sm:grid-cols-2">
          <div class="grid gap-0.5"><dt class="text-[13px] text-muted">{{ 'aprobaciones.dialogo.montos' | transloco }}</dt>
            <dd class="m-0 grid font-semibold num">
              @for (m of summary().money; track m.currency) { <span>{{ m.text }}</span> } @empty { <span class="font-normal text-muted">{{ 'aprobaciones.dialogo.sinMontos' | transloco }}</span> }
            </dd>
          </div>
          <div class="grid gap-0.5"><dt class="text-[13px] text-muted">{{ 'aprobaciones.dialogo.cantidad' | transloco }}</dt><dd class="m-0 font-semibold num">{{ summary().quantity.toLocaleString('es-PE') }}</dd></div>
        </dl>
      </section>
      <zc-field [label]="(decision() === 'reject' ? 'aprobaciones.dialogo.comentarioRechazo' : 'aprobaciones.dialogo.comentario') | transloco"
        [required]="decision() === 'reject'" [optional]="decision() === 'approve'" [error]="commentError()">
        <input zcInput data-autofocus maxlength="300" [placeholder]="(decision() === 'reject' ? 'aprobaciones.dialogo.placeholderRechazo' : 'aprobaciones.dialogo.placeholderAprobar') | transloco"
          [value]="comment()" (input)="comment.set($any($event.target).value)" (blur)="touched.set(true)" />
      </zc-field>
      <div zcOverlayFooter>
        <button zcButton variant="outline" [disabled]="busy()" (click)="close()">{{ 'aprobaciones.dialogo.cancelar' | transloco }}</button>
        <button zcButton [variant]="decision() === 'reject' ? 'danger' : 'primary'" [disabled]="busy() || !valid()" [loading]="busy()" (click)="confirm()">
          @if (busy()) { <zc-spinner [size]="16" /> }
          {{ (decision() === 'reject' ? 'aprobaciones.dialogo.confirmarRechazar' : 'aprobaciones.dialogo.confirmarAprobar') | transloco: { n: items().length } }}
        </button>
      </div>
    </zc-modal>`,
})
export class DecisionDialogComponent {
  readonly items = input<readonly Approval[]>([]);
  /** null = cerrado. */
  readonly decision = model<Decision | null>(null);
  readonly done = output<DecisionResult>();

  private readonly svc = inject(AprobacionesService);
  private readonly toast = inject(ToastService);
  private readonly t = injectTranslate();
  readonly icon = TYPE_ICON;
  readonly comment = signal('');
  readonly touched = signal(false);
  readonly busy = signal(false);
  readonly summary = computed(() => decisionSummary(this.items()));
  readonly valid = computed(() => this.decision() !== 'reject' || this.comment().trim().length >= 5);
  readonly commentError = computed(() => (this.touched() && !this.valid() ? this.t('aprobaciones.dialogo.minComentario') : null));
  readonly title = computed(() => {
    const one = this.items().length === 1; const rej = this.decision() === 'reject';
    return one ? this.t(rej ? 'aprobaciones.dialogo.tituloRechazarUna' : 'aprobaciones.dialogo.tituloAprobarUna', { id: this.items()[0].id })
      : this.t(rej ? 'aprobaciones.dialogo.tituloRechazar' : 'aprobaciones.dialogo.tituloAprobar', { n: this.items().length });
  });

  constructor() {
    effect(() => { if (this.decision()) return; this.comment.set(''); this.touched.set(false); });
  }

  close() { if (!this.busy()) this.decision.set(null); }
  onOpenChange(open: boolean): void { if (!open) this.close(); }

  async confirm() {
    const d = this.decision();
    if (!d || !this.valid()) { this.touched.set(true); return; }
    this.busy.set(true);
    try {
      const res = await this.svc.decide(this.items().map(a => a.id), d, this.comment().trim());
      const total = this.items().length;
      if (res.failed.length) {
        this.toast.error(this.t('aprobaciones.resultado.parcial', { ok: res.ok.length, total }),
          { text: this.t('aprobaciones.resultado.noResueltas', { list: res.failed.map(f => `${f.id}: ${f.message}`).join('; ') }) });
      } else {
        const one = total === 1;
        const title = d === 'approve' ? (one ? this.t('aprobaciones.resultado.aprobadaUna') : this.t('aprobaciones.resultado.aprobadas', { n: total }))
          : (one ? this.t('aprobaciones.resultado.rechazadaUna') : this.t('aprobaciones.resultado.rechazadas', { n: total }));
        this.toast.success(title, { text: this.t(d === 'approve' ? 'aprobaciones.resultado.ejecutadas' : 'aprobaciones.resultado.devueltas') });
      }
      this.busy.set(false);
      this.decision.set(null);
      this.done.emit(res);
    } catch (e) {
      this.busy.set(false);
      const err = e as Partial<AppError>;
      this.toast.error(this.t('aprobaciones.resultado.error'), { text: [err.message, err.reference ? `${this.t('comun.referencia')} ${err.reference}` : ''].filter(Boolean).join('. ') });
    }
  }
}
