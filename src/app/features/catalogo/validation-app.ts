import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, computed, inject, input, signal, viewChild } from '@angular/core';
import { formatMoney } from '@zonacards/ui/core';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { DescriptionListComponent } from '@zonacards/ui/description-list';
import { FieldComponent, InputDirective } from '@zonacards/ui/field';
import { InputGroupComponent } from '@zonacards/ui/input-group';
import { MOBILE, PinPadComponent, ZcBottomNavItem, ZcSwipeAction } from '@zonacards/ui/mobile';
import { ToastService } from '@zonacards/ui/toast';
import { ScrollAreaDirective } from '@zonacards/ui/core';
import { KpiComponent } from '@zonacards/ui/kpi';
import { ScannerComponent } from '@zonacards/ui/scanner';
import { DsPhoneComponent } from './ds/phone-frame';

export type ScanResult = 'valid' | 'used' | 'expired' | 'other' | 'invalid' | 'offline';
type Tab = 'home' | 'scan' | 'hist' | 'set';
interface Op { id: number; title: string; detail: string; time: string; ok: boolean }
interface Res { tone: 'ok' | 'err' | 'warn'; icon: IconName; title: string; text: string }

const BAL = 100;
const RESULTS: Record<Exclude<ScanResult, 'valid'>, Res> = {
  used: { tone: 'err', icon: 's:close-circle', title: 'Este vale ya fue canjeado', text: 'El 08/10/2026 13:42 en KFC Jockey Plaza.' },
  expired: { tone: 'warn', icon: 's:clock-circle', title: 'Este vale venció', text: 'Venció el 30/09/2026. El cliente puede consultar con quien se lo entregó.' },
  other: { tone: 'warn', icon: 's:shop-2', title: 'Este vale es de Repsol', text: 'No se puede canjear en KFC. Pide al cliente un vale de esta marca.' },
  invalid: { tone: 'err', icon: 's:danger-circle', title: 'No reconocemos este código', text: 'Revisa que sea un vale Giftealo o ingresa el código a mano.' },
  offline: { tone: 'warn', icon: 'l:wifi-off', title: 'Sin conexión', text: 'No se pueden validar canjes sin internet. Revisa la señal y vuelve a escanear.' },
};

/** Catálogo · app móvil de validación de comercios (o-scanner y o-mobile de index.html), armada con los componentes del sistema. */
@Component({
  selector: 'zc-validation-app',
  imports: [NgTemplateOutlet, ScrollAreaDirective, ButtonDirective, IconComponent, DescriptionListComponent, FieldComponent, InputDirective, InputGroupComponent, MOBILE, KpiComponent, ScannerComponent, DsPhoneComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ds-phone [(sheet)]="sheetOpen" [sheetLabel]="sheetLabel()">
      <zc-mobile-bar [title]="titles[tab()]" subtitle="KFC Jockey Plaza · Caja 2" [back]="tab() === 'set'" (backClick)="tab.set('hist')">
        @if (tab() === 'hist') {
          <button zcMobileAction type="button" class="grid size-10 cursor-pointer place-items-center rounded-sm hover:bg-(--state-hover-bg)" aria-label="Actualizar" (click)="refresh()"><zc-icon name="s:refresh" /></button>
        }
      </zc-mobile-bar>
      @if (offline()) { <zc-system-banner tone="offline">Sin conexión. No se pueden validar canjes hasta reconectar.</zc-system-banner> }
      @if (update()) {
        <zc-system-banner tone="update">Hay una nueva versión de la app.
          <button zcBannerAction type="button" class="cursor-pointer underline" (click)="applyUpdate()">Actualizar</button></zc-system-banner>
      }
      <main zcScrollArea aria-label="Contenido de la app" class="flex min-h-0 flex-1 flex-col overflow-auto overscroll-contain" [class.p-4]="tab() !== 'scan'" [class.gap-4]="tab() !== 'scan'">
        @switch (tab()) {
          @case ('home') {
            <div class="grid grid-cols-2 gap-3">
              <zc-kpi label="Canjes hoy" [value]="okCount()" /><zc-kpi label="Monto canjeado" value="S/ 180.50" />
            </div>
            <button type="button" class="flex cursor-pointer items-center gap-3 rounded-md bg-secondary p-4 text-left text-on-secondary" (click)="tab.set('scan')">
              <span class="grid size-10 place-items-center rounded-ms bg-[color-mix(in_srgb,var(--on-secondary)_15%,transparent)]"><zc-icon name="s:qr-code" /></span>
              <span class="grid leading-5"><strong>Validar un vale</strong><small class="opacity-80">Escanea el QR o ingresa el código</small></span>
            </button>
            <p class="text-[12.5px] tracking-[.04em] text-muted uppercase">Avisos del sistema</p>
            <div class="grid gap-2">
              <button zcButton variant="outline" size="sm" (click)="toggleOffline()"><zc-icon [name]="offline() ? 'l:wifi' : 'l:wifi-off'" [size]="16" />{{ offline() ? 'Simular reconexión' : 'Simular sin conexión' }}</button>
              <button zcButton variant="outline" size="sm" (click)="update.set(true)"><zc-icon name="l:rotate-cw" [size]="16" />Simular actualización</button>
            </div>
          }
          @case ('scan') { <zc-scanner (scanned)="onScanned($event)" (manual)="openManual()" /> }
          @case ('hist') {
            <zc-pull-refresh [(busy)]="refreshing" (refresh)="refresh()">
              <p class="mb-2 text-[12.5px] tracking-[.04em] text-muted uppercase">Hoy · {{ ops().length }} operaciones</p>
              <ul class="m-0 grid list-none gap-2 p-0" aria-label="Historial de canjes">
                @for (op of ops(); track op.id) {
                  <li><zc-swipe-item [actions]="swipe" [menuLabel]="'Acciones de ' + op.title" (action)="onSwipe($event)">
                    <span class="grid size-9 shrink-0 place-items-center rounded-ms" [class]="op.ok ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'"><zc-icon [name]="op.ok ? 's:check-circle' : 's:close-circle'" [size]="16" /></span>
                    <span class="grid min-w-0 flex-1 leading-[18px]"><strong class="text-[14.5px]">{{ op.title }}</strong><small class="break-words text-[12.5px] text-muted">{{ op.detail }}</small></span>
                    <span class="text-xs whitespace-nowrap text-subtle">{{ op.time }}</span>
                  </zc-swipe-item></li>
                }
              </ul>
              <p class="mt-3 text-center text-[12.5px] text-subtle">Desliza un canje a la izquierda para ver acciones, o arrastra hacia abajo para actualizar.</p>
            </zc-pull-refresh>
          }
          @case ('set') {
            <div class="grid justify-items-center gap-1 pt-4 text-center">
              <span class="grid size-12 place-items-center rounded-ms bg-surface-2"><zc-icon name="s:shield-keyhole" /></span>
              <strong>PIN de supervisor</strong><span class="text-sm text-muted">Para anular un canje. Prueba 2468.</span>
            </div>
            <zc-pin-pad [(value)]="pinValue" [error]="pinError()" (complete)="checkPin($event)" (biometric)="toast.info('Biometría', { text: 'En la app abre la huella o Face ID del sistema.' })" />
          }
        }
      </main>
      <zc-bottom-nav label="Navegación de la app" [items]="nav" [current]="tab()" (currentChange)="go($any($event))" />

      <div dsPhoneSheet class="grid gap-4">
        @switch (sheet()) {
          @case ('manual') {
            <strong class="text-[17px]">Ingresar código</strong>
            <zc-field label="Número del vale (16 dígitos)" [required]="true" [error]="manualErr()" hint="Está bajo el código QR del vale.">
              <input #manual zcInput inputmode="numeric" autocomplete="off" placeholder="0000 0000 0000 0000" [value]="manualCode()" (input)="onManual($any($event.target))" />
            </zc-field>
            <div class="grid grid-cols-[1fr_1.4fr] gap-3"><button zcButton variant="ghost" (click)="sheetOpen.set(false)">Cancelar</button><button zcButton (click)="checkManual()">Validar</button></div>
          }
          @case ('valid') {
            <ng-container *ngTemplateOutlet="resBlock; context: { $implicit: { tone: 'ok', icon: 's:check-circle', title: 'Vale válido', text: 'KFC · 6040 •••• •••• 9014' } }" />
            <zc-description-list layout="rows" [items]="[{ term: 'Saldo disponible', value: money(bal) }, { term: 'Vence', value: '31/12/2026' }]" />
            <zc-field label="Monto a canjear" [required]="true" [error]="amtErr()" hint="Puede ser parcial; el resto queda como saldo.">
              <zc-input-group prefixText="S/"><input zcInput inputmode="decimal" [value]="amount()" (input)="amount.set($any($event.target).value)" /></zc-input-group>
            </zc-field>
            <div class="grid grid-cols-[1fr_1.4fr] gap-3"><button zcButton variant="ghost" (click)="sheetOpen.set(false)">Cancelar</button><button zcButton [loading]="confirming()" (click)="confirm()">Confirmar canje</button></div>
          }
          @case ('done') {
            <ng-container *ngTemplateOutlet="resBlock; context: { $implicit: { tone: 'ok', icon: 's:check-circle', title: 'Canje confirmado', text: money(lastAmount()) + ' · Operación #CJ-40921' } }" />
            <p class="text-center text-[13px] text-muted">Saldo restante: {{ money(bal - lastAmount()) }}</p>
            <div class="grid grid-cols-[1fr_1.4fr] gap-3"><button zcButton variant="ghost" (click)="sheetOpen.set(false)">Ver comprobante</button><button zcButton (click)="sheetOpen.set(false)">Escanear otro</button></div>
          }
          @default {
            @if (failRes(); as r) { <ng-container *ngTemplateOutlet="resBlock; context: { $implicit: r }" /> }
            <div class="grid grid-cols-[1fr_1.4fr] gap-3"><button zcButton variant="ghost" (click)="openManual()">Ingresar código</button><button zcButton (click)="sheetOpen.set(false)">Escanear otro</button></div>
          }
        }
      </div>
    </ds-phone>

    <ng-template #resBlock let-r>
      <div class="grid justify-items-center gap-1.5 py-2 text-center">
        <span class="grid size-[72px] place-items-center rounded-full" [class]="r.tone === 'ok' ? 'bg-success-bg text-success' : r.tone === 'err' ? 'bg-danger-bg text-danger' : 'bg-warning-bg text-warning'"><zc-icon [name]="r.icon" [size]="32" /></span>
        <strong class="text-xl leading-[26px]">{{ r.title }}</strong><span class="text-sm leading-5 text-muted">{{ r.text }}</span>
      </div>
    </ng-template>`,
})
export class ValidationAppComponent {
  readonly toast = inject(ToastService);
  private readonly injector = inject(Injector);
  readonly start = input<Tab>('home');
  readonly tab = signal<Tab>('home');
  readonly titles: Record<Tab, string> = { home: 'Inicio', scan: 'Validar canje', hist: 'Historial', set: 'Supervisor' };
  readonly nav: ZcBottomNavItem[] = [
    { id: 'home', label: 'Inicio', icon: 's:home-smile', iconActive: 's:home-smile-bold' }, { id: 'scan', label: 'Escanear', icon: 's:qr-code', iconActive: 's:qr-code-bold' },
    { id: 'hist', label: 'Historial', icon: 's:history', iconActive: 's:history-bold' }, { id: 'set', label: 'Ajustes', icon: 's:settings', iconActive: 's:settings-bold' },
  ];
  readonly swipe: ZcSwipeAction[] = [{ id: 'view', label: 'Ver', icon: 's:eye', tone: 'info' }, { id: 'void', label: 'Anular', icon: 's:close-circle', tone: 'danger' }];
  readonly bal = BAL;
  private seq = 10;
  readonly ops = signal<Op[]>([
    { id: 1, title: 'Canje S/ 40.00', detail: 'Vale •••• 9014 · KFC', time: 'hace 5 min', ok: true },
    { id: 2, title: 'Canje S/ 100.00', detail: 'Vale •••• 3381 · KFC', time: 'hace 22 min', ok: true },
    { id: 3, title: 'Rechazado', detail: 'Vale •••• 1207 · ya canjeado', time: 'hace 1 h', ok: false },
    { id: 4, title: 'Canje S/ 25.50', detail: 'Vale •••• 7720 · KFC', time: 'hace 2 h', ok: true },
  ]);
  readonly okCount = computed(() => this.ops().filter(o => o.ok).length);
  readonly offline = signal(false);
  readonly update = signal(false);
  readonly refreshing = signal(false);
  readonly sheetOpen = signal(false);
  readonly sheet = signal<ScanResult | 'manual' | 'done'>('manual');
  readonly failRes = computed(() => { const s = this.sheet(); return s in RESULTS ? RESULTS[s as keyof typeof RESULTS] : null; });
  readonly sheetLabel = computed(() => { const s = this.sheet(); return s === 'manual' ? 'Ingresar código' : s === 'valid' ? 'Resultado: vale válido' : s === 'done' ? 'Canje confirmado' : 'Resultado: ' + (this.failRes()?.title ?? ''); });
  readonly manualCode = signal('');
  readonly manualErr = signal<string | null>(null);
  readonly amount = signal(BAL.toFixed(2));
  readonly amtErr = signal<string | null>(null);
  readonly confirming = signal(false);
  readonly lastAmount = signal(0);
  readonly pinValue = signal('');
  readonly pinError = signal<string | null>(null);
  private tries = 0;
  private readonly pin = viewChild(PinPadComponent);
  private readonly scanner = viewChild(ScannerComponent);
  private readonly manualInput = viewChild<ElementRef<HTMLInputElement>>('manual');

  constructor() { queueMicrotask(() => this.tab.set(this.start())); }
  money(n: number) { return formatMoney(n, 'pe'); }
  private vib(p: number | number[]) { try { navigator.vibrate?.(p); } catch { /* sin vibración */ } }

  go(t: Tab) { this.scanner()?.stop(); this.tab.set(t); }
  /** Prueba de resultados desde el panel lateral del catálogo. */
  result(kind: ScanResult) {
    this.vib(kind === 'valid' ? 40 : [60, 40, 60]);
    this.amount.set(BAL.toFixed(2)); this.amtErr.set(null);
    this.sheet.set(kind); this.sheetOpen.set(true);
    if (kind !== 'valid') this.ops.update(a => [{ id: ++this.seq, title: 'Rechazado', detail: RESULTS[kind].title, time: 'ahora', ok: false }, ...a]);
  }
  realCamera() { this.go('scan'); afterNextRender(() => void this.scanner()?.start(), { injector: this.injector }); }
  onScanned(raw: string) { this.result(/^\d{16}$/.test(raw.replace(/\s/g, '')) || raw.includes('giftealo') ? 'valid' : 'invalid'); }

  openManual() {
    this.manualCode.set(''); this.manualErr.set(null); this.sheet.set('manual'); this.sheetOpen.set(true);
    afterNextRender(() => this.manualInput()?.nativeElement.focus(), { injector: this.injector });
  }
  /** Solo dígitos, en grupos de 4. */
  onManual(el: HTMLInputElement) { const d = el.value.replace(/\D/g, '').slice(0, 16); el.value = d.replace(/(\d{4})(?=\d)/g, '$1 '); this.manualCode.set(el.value); }
  checkManual() {
    const d = this.manualCode().replace(/\D/g, '');
    if (d.length !== 16) { this.manualErr.set(`El código tiene 16 dígitos (llevas ${d.length}).`); this.vib([60, 40, 60]); this.manualInput()?.nativeElement.focus(); return; }
    this.result(d.endsWith('0000') ? 'invalid' : 'valid');
  }
  confirm() {
    const v = parseFloat(this.amount().replace(',', '.'));
    const err = isNaN(v) || v <= 0 ? 'Ingresa el monto.' : v > BAL ? 'El saldo disponible es ' + this.money(BAL) + '.' : null;
    this.amtErr.set(err);
    if (err) { this.vib([60, 40, 60]); return; }
    this.confirming.set(true);
    setTimeout(() => {
      this.confirming.set(false); this.vib([30, 30, 80]); this.lastAmount.set(v);
      this.ops.update(a => [{ id: ++this.seq, title: 'Canje ' + this.money(v), detail: 'Vale •••• 9014 · KFC', time: 'ahora', ok: true }, ...a]);
      this.sheet.set('done');
    }, 900);
  }

  refresh() {
    this.refreshing.set(true);
    setTimeout(() => {
      this.ops.update(a => [{ id: ++this.seq, title: 'Canje S/ 15.00', detail: 'Vale •••• 5502 · KFC', time: 'ahora', ok: true }, ...a]);
      this.refreshing.set(false);
      this.toast.success('Historial actualizado', { text: '1 canje nuevo.' });
    }, 900);
  }
  onSwipe(id: string) {
    if (id === 'void') { this.toast.info('Anular canje', { text: 'Pide la aprobación de un supervisor (PIN).' }); this.go('set'); }
    else this.toast.info('Detalle del canje', { text: 'Abre el comprobante.' });
  }
  checkPin(v: string) {
    if (v === '2468') { this.vib([30, 30, 80]); this.pinValue.set(''); this.pinError.set(null); this.tries = 0; this.toast.success('PIN correcto', { text: 'Anulación autorizada.' }); this.go('hist'); return; }
    this.tries++;
    this.pin()?.reject();
    this.pinError.set('PIN incorrecto. ' + (3 - this.tries > 0 ? `Te quedan ${3 - this.tries} intentos.` : 'Bloqueado por 5 minutos.'));
  }
  toggleOffline() { const off = !this.offline(); this.offline.set(off); if (!off) this.toast.success('Conexión restablecida'); }
  applyUpdate() { this.update.set(false); this.toast.success('App actualizada', { text: 'Versión 2.4.0' }); }
}
