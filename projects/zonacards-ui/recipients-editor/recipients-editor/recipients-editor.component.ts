import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, computed, inject, input, model, output, signal } from '@angular/core';
import { AvatarComponent } from '@zonacards/ui/avatar';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { TooltipDirective } from '@zonacards/ui/tooltip';
import { injectTranslate, isValidPhone, phoneDigits, formatPhone, dialCountry } from '@zonacards/ui/core';
import { AlertComponent } from '@zonacards/ui/alert';
import { FieldComponent, InputDirective } from '@zonacards/ui/field';
import { NumberFieldComponent } from '@zonacards/ui/number-field';
import { Viewport } from '@zonacards/ui/core';
import { KpiComponent } from '@zonacards/ui/kpi';
import { StateComponent } from '@zonacards/ui/state';

/** phone: solo dígitos del número nacional (sin código de país). */
export interface ZcRecipient { id: string; first: string; last: string; email: string; phone?: string; qty: number }
/** Canal de entrega: solo correo, solo WhatsApp, ambos obligatorios o al menos uno de los dos. */
export type ZcRecipientContact = 'email' | 'phone' | 'both' | 'any';
type Key = 'first' | 'last' | 'email' | 'phone';
type Err = 'requerido' | 'correo' | 'repetido' | 'telefono' | 'telefonoRepetido' | 'contacto' | '';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
let seq = 0;

/**
 * <zc-recipients-editor [(rows)]="destinatarios" [available]="50" (importExcel)="…" /> · tabla editable (o-grid de index.html,
 * paso de destinatarios del portal de empresas). Edición en línea con validación por celda al salir del campo, cantidades con −/+
 * limitadas a lo disponible, agregar, limpiar y quitar filas, acciones masivas y resumen en vivo. En móvil, una tarjeta por fila.
 * validate() marca todo, lleva el foco al primer error y devuelve si se puede continuar.
 */
@Component({
  selector: 'zc-recipients-editor',
  imports: [AvatarComponent, ButtonDirective, IconComponent, TooltipDirective, AlertComponent, FieldComponent, InputDirective, NumberFieldComponent, KpiComponent, StateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4' },
  template: `
    <div class="grid grid-cols-[repeat(auto-fit,minmax(128px,1fr))] gap-3">
      <zc-kpi [label]="t('mol.destinatarios.disponibles')" [value]="available()" icon="s:gift" />
      <zc-kpi [label]="t('mol.destinatarios.asignadas')" [value]="assigned()" icon="s:info-circle" />
      <zc-kpi [label]="t('mol.destinatarios.restantes')" [value]="rest()" icon="s:check-circle" />
      <zc-kpi [label]="t('mol.destinatarios.titulo')" [value]="rows().length" icon="s:users-group-rounded" />
    </div>
    @if (zero() && rows().length) {
      <div role="status"><zc-alert tone="warning" [title]="t('mol.destinatarios.sinAsignar', { n: zero() })">{{ t('mol.destinatarios.sinAsignarTexto', { n: rest() }) }}</zc-alert></div>
    }
    <div class="flex flex-wrap items-center gap-2">
      <button zcButton variant="outline" size="sm" (click)="importExcel.emit()"><zc-icon name="s:import" [size]="16" />{{ t('mol.destinatarios.excel') }}</button>
      <button zcButton variant="outline" size="sm" (click)="add()"><zc-icon name="s:add-circle" [size]="16" />{{ t('mol.destinatarios.agregar') }}</button>
      <span class="flex-1"></span>
      <button zcButton variant="secondary" size="sm" (click)="oneEach()">{{ t('mol.destinatarios.unoATodos') }}</button>
      <button zcButton variant="ghost" size="sm" (click)="resetQty()">{{ t('mol.destinatarios.resetear') }}</button>
    </div>

    @if (!rows().length) {
      <zc-state icon="s:users-group-rounded" [title]="t('mol.destinatarios.vacio')" [text]="t('mol.destinatarios.vacioTexto')" />
    } @else if (viewport.mobile()) {
      <div class="grid grid-cols-[minmax(0,1fr)] gap-3" role="list" [attr.aria-label]="t('mol.destinatarios.titulo')">
        @for (r of rows(); track r.id; let i = $index) {
          <article role="listitem" class="grid gap-3 rounded-md border border-border bg-surface p-4" [attr.aria-label]="t('mol.destinatarios.destinatarioN', { n: i + 1 })">
            <div class="flex min-w-0 items-center gap-3">
              <zc-avatar [name]="fullName(r) || String(i + 1)" [initials]="String(i + 1)" size="sm" />
              <span class="min-w-0 flex-1 break-words font-semibold">{{ fullName(r) || t('mol.destinatarios.destinatarioN', { n: i + 1 }) }}</span>
              <button zcButton variant="ghost" size="icon-sm" [attr.aria-label]="t('mol.destinatarios.limpiar', { n: i + 1 })" (click)="clear(r)"><zc-icon name="s:refresh" [size]="16" /></button>
              <button zcButton variant="ghost" size="icon-sm" class="text-danger" [attr.aria-label]="t('mol.destinatarios.eliminar', { n: i + 1 })" (click)="remove(r)"><zc-icon name="s:trash-bin-trash" [size]="16" /></button>
            </div>
            @for (k of keys(); track k) {
              <zc-field [label]="t('mol.destinatarios.' + k)" [required]="required(k)" [hint]="k === 'phone' ? dial() : ''" [error]="shownError(r, k)">
                <input zcInput [attr.data-cell]="r.id + ':' + k" [type]="k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'text'" [attr.inputmode]="k === 'phone' ? 'tel' : null" [value]="shown(r, k)" [placeholder]="t('mol.destinatarios.ph.' + k)"
                  (input)="edit(r, k, $any($event.target))" (blur)="touch(r, k)" />
              </zc-field>
            }
            <zc-field [label]="t('mol.destinatarios.aEnviar')" [reserve]="false">
              <zc-number-field [min]="0" [max]="r.qty + rest()" [value]="r.qty" (valueChange)="setQty(r, $event)" />
            </zc-field>
          </article>
        }
      </div>
    } @else {
      <div class="relative min-w-0 overflow-x-auto rounded-md border border-border" role="region" tabindex="0" [attr.aria-label]="t('mol.destinatarios.titulo')">
        <table class="w-full border-collapse text-body-sm" [class]="keys().length > 3 ? 'min-w-[920px]' : 'min-w-[760px]'">
          <caption class="sr-only">{{ t('mol.destinatarios.titulo') }}</caption>
          <thead class="bg-surface-2 text-left text-caption text-muted">
            <tr>
              <th scope="col" class="w-9 px-3 py-2.5 font-medium">#</th>
              @for (k of keys(); track k) {
                <th scope="col" class="px-2 py-2.5 font-medium">{{ t('mol.destinatarios.' + k) }}@if (k === 'phone') { <span class="font-normal"> ({{ dial() }})</span> }</th>
              }
              <th scope="col" class="w-44 px-2 py-2.5 font-medium">{{ t('mol.destinatarios.cantidad') }}</th>
              <th scope="col" class="w-24 px-2 py-2.5"><span class="sr-only">{{ t('mol.destinatarios.acciones') }}</span></th>
            </tr>
          </thead>
          <tbody>
            @for (r of rows(); track r.id; let i = $index) {
              <tr class="border-t border-border align-middle" [class.bg-info-bg]="r.id === fresh()">
                <td class="px-3 py-2 text-muted num">{{ i + 1 }}</td>
                @for (k of keys(); track k) {
                  <td class="px-2 py-2">
                    <input zcInput [attr.data-cell]="r.id + ':' + k" [type]="k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'text'" [attr.inputmode]="k === 'phone' ? 'tel' : null" [value]="shown(r, k)" [placeholder]="t('mol.destinatarios.' + k)"
                      [attr.aria-label]="t('mol.destinatarios.celda', { campo: t('mol.destinatarios.' + k), n: i + 1 })"
                      [attr.aria-invalid]="shownError(r, k) ? true : null" [attr.aria-describedby]="shownError(r, k) ? cellId(r, k) : null"
                      [class.border-danger]="!!shownError(r, k)" (input)="edit(r, k, $any($event.target))" (blur)="touch(r, k)" />
                    @if (shownError(r, k)) {
                      <span [id]="cellId(r, k)" class="mt-1 flex items-center gap-1 text-caption text-danger"><zc-icon name="s:danger-circle" [size]="16" />{{ shownError(r, k) }}</span>
                    }
                  </td>
                }
                <td class="px-2 py-2"><zc-number-field [min]="0" [max]="r.qty + rest()" [value]="r.qty" (valueChange)="setQty(r, $event)" [ariaLabel]="t('mol.destinatarios.cantidadDe', { n: i + 1 })" /></td>
                <td class="px-2 py-2 whitespace-nowrap">
                  <button zcButton variant="ghost" size="icon-sm" [attr.aria-label]="t('mol.destinatarios.limpiar', { n: i + 1 })" [zcTooltip]="t('mol.destinatarios.limpiarCorto')" (click)="clear(r)"><zc-icon name="s:refresh" [size]="16" /></button>
                  <button zcButton variant="ghost" size="icon-sm" class="text-danger" [attr.aria-label]="t('mol.destinatarios.eliminar', { n: i + 1 })" [zcTooltip]="t('mol.destinatarios.eliminarCorto')" (click)="remove(r)"><zc-icon name="s:trash-bin-trash" [size]="16" /></button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }`,
})
export class RecipientsEditorComponent {
  readonly t = injectTranslate();
  readonly viewport = inject(Viewport);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly live = inject(LiveAnnouncer);
  readonly String = String;

  readonly rows = model.required<ZcRecipient[]>();
  readonly available = input.required<number>();
  readonly importExcel = output<void>();
  /** Canal de entrega: 'email' (por defecto), 'phone' (WhatsApp), 'both' o 'any' (al menos uno). */
  readonly contact = input<ZcRecipientContact>('email');
  /** País del WhatsApp: largo del número y código de país. */
  readonly country = input('pe');
  readonly keys = computed<Key[]>(() => this.contact() === 'email' ? ['first', 'last', 'email'] : this.contact() === 'phone' ? ['first', 'last', 'phone'] : ['first', 'last', 'email', 'phone']);
  readonly dial = computed(() => dialCountry(this.country()).dial);
  readonly fresh = signal<string | null>(null);
  private readonly touched = signal<Record<string, true>>({});
  private readonly uid = ++seq;

  readonly assigned = computed(() => this.rows().reduce((s, r) => s + r.qty, 0));
  readonly rest = computed(() => this.available() - this.assigned());
  readonly zero = computed(() => this.rows().filter(r => !r.qty).length);

  fullName(r: ZcRecipient) { return (r.first + ' ' + r.last).trim(); }
  cellId(r: ZcRecipient, k: Key) { return `zc-rcp-${this.uid}-${r.id}-${k}`; }
  required(k: Key) { return k === 'first' || (k === 'email' && ['email', 'both'].includes(this.contact())) || (k === 'phone' && ['phone', 'both'].includes(this.contact())); }
  shown(r: ZcRecipient, k: Key) { return k === 'phone' ? formatPhone(r.phone ?? '') : r[k]; }
  private error(r: ZcRecipient, k: Key): Err {
    if (k === 'first') return r.first.trim() ? '' : 'requerido';
    const any = this.contact() === 'any';
    if (k === 'phone') {
      const p = r.phone ?? '';
      if (!p) return any ? (r.email.trim() ? '' : 'contacto') : 'requerido';
      if (!isValidPhone(this.country(), p)) return 'telefono';
      return this.rows().filter(x => x.phone === p).length > 1 ? 'telefonoRepetido' : '';
    }
    if (k === 'email') {
      if (!r.email.trim()) return any ? (r.phone ? '' : 'contacto') : 'requerido';
      if (!EMAIL.test(r.email)) return 'correo';
      return this.rows().filter(x => x.email.toLowerCase() === r.email.toLowerCase()).length > 1 ? 'repetido' : '';
    }
    return '';
  }
  /** El error se muestra recién al salir del campo (o al validar todo). */
  shownError(r: ZcRecipient, k: Key): string | null {
    const e = this.touched()[r.id + ':' + k] ? this.error(r, k) : '';
    return e ? this.t('mol.destinatarios.err.' + e) : null;
  }

  private patch(r: ZcRecipient, p: Partial<ZcRecipient>) { this.rows.update(a => a.map(x => (x.id === r.id ? { ...x, ...p } : x))); }
  edit(r: ZcRecipient, k: Key, el: HTMLInputElement) {
    if (k !== 'phone') { this.patch(r, { [k]: el.value }); return; }
    const d = phoneDigits(el.value, this.country());
    if (formatPhone(d) !== el.value) el.value = formatPhone(d);
    this.patch(r, { phone: d });
  }
  touch(r: ZcRecipient, k: Key) { this.touched.update(t => ({ ...t, [r.id + ':' + k]: true })); }
  setQty(r: ZcRecipient, q: number | null) { this.patch(r, { qty: Math.max(0, Math.min(q ?? 0, r.qty + this.rest())) }); }

  add() {
    const id = 'n' + Date.now().toString(36);
    this.rows.update(a => [...a, { id, first: '', last: '', email: '', phone: '', qty: 0 }]);
    this.fresh.set(id);
    this.focusCell(id + ':first');
  }
  clear(r: ZcRecipient) {
    this.patch(r, { first: '', last: '', email: '', phone: '', qty: 0 });
    this.touched.update(t => Object.fromEntries(Object.entries(t).filter(([k]) => !k.startsWith(r.id + ':'))));
    this.focusCell(r.id + ':first');
  }
  remove(r: ZcRecipient) {
    const i = this.rows().indexOf(r);
    this.rows.update(a => a.filter(x => x.id !== r.id));
    this.live.announce(this.t('mol.destinatarios.eliminada', { n: i + 1 }));
    const next = this.rows()[Math.min(i, this.rows().length - 1)];
    this.focusCell(next ? next.id + ':first' : null);
  }
  oneEach() { let left = this.available(); this.rows.update(a => a.map(r => { const q = left > 0 ? 1 : 0; left -= q; return { ...r, qty: q }; })); }
  resetQty() { this.rows.update(a => a.map(r => ({ ...r, qty: 0 }))); }

  /** Marca todo y enfoca el primer error. Devuelve cuántas filas tienen datos por corregir y cuántas no tienen cantidad. */
  validate(): { bad: number; zero: number } {
    const all: Record<string, true> = {};
    for (const r of this.rows()) for (const k of this.keys()) all[r.id + ':' + k] = true;
    this.touched.set(all);
    const bad = this.rows().filter(r => this.keys().some(k => this.error(r, k))).length;
    afterNextRender(() => {
      const f = this.host.querySelector<HTMLElement>('[aria-invalid="true"]') ?? this.host.querySelector<HTMLElement>('[role="spinbutton"][aria-valuenow="0"]');
      f?.focus();
    }, { injector: this.injector });
    return { bad, zero: this.zero() };
  }

  private focusCell(cell: string | null) {
    afterNextRender(() => {
      const el = cell ? this.host.querySelector<HTMLElement>(`[data-cell="${cell}"]`) : null;
      el?.focus();
    }, { injector: this.injector });
  }
}
