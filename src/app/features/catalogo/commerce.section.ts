import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { formatMoney } from '../../shared/domain/money';
import { todayIso } from '../../shared/domain/dates';
import { ArtComponent } from '../../shared/ui/atoms/art/art.component';
import { BadgeComponent } from '../../shared/ui/atoms/badge/badge.component';
import { BrandLogoComponent } from '../../shared/ui/atoms/brand-logo/brand-logo.component';
import { ButtonDirective } from '../../shared/ui/atoms/button/button.directive';
import { CheckboxComponent } from '../../shared/ui/atoms/checkbox/checkbox.component';
import { IconComponent } from '../../shared/ui/atoms/icon/icon.component';
import { LogoComponent } from '../../shared/ui/atoms/logo/logo.component';
import { ButtonGroupDirective } from '../../shared/ui/atoms/misc/misc';
import { PayBadge, PayBadgeComponent } from '../../shared/ui/atoms/pay-badge/pay-badge.component';
import { ProgressComponent } from '../../shared/ui/atoms/progress/progress.component';
import { RadioComponent } from '../../shared/ui/atoms/radio/radio.component';
import { RadioGroupComponent } from '../../shared/ui/atoms/radio/radio-group.component';
import { SwitchComponent } from '../../shared/ui/atoms/switch/switch.component';
import { TooltipDirective } from '../../shared/ui/atoms/tooltip/tooltip.directive';
import { AlertComponent } from '../../shared/ui/molecules/alert/alert.component';
import { AnnouncementComponent, OnboardingComponent } from '../../shared/ui/molecules/announcement/announcement.component';
import { Coupon, CouponCheck, CouponFieldComponent } from '../../shared/ui/molecules/commerce/coupon-field.component';
import { DateFieldComponent } from '../../shared/ui/molecules/date-field/date-field.component';
import { DescriptionListComponent } from '../../shared/ui/molecules/description-list/description-list.component';
import { FieldComponent, InputDirective } from '../../shared/ui/molecules/field/field.component';
import { MenuComponent, ZcMenuItem } from '../../shared/ui/molecules/menu/menu.component';
import { PhoneFieldComponent } from '../../shared/ui/molecules/phone-field/phone-field.component';
import { PhoneValue } from '../../shared/forms/validators';
import { TimeFieldComponent } from '../../shared/ui/molecules/time-field/time-field.component';
import { ToastService } from '../../shared/ui/molecules/toast/toast.service';
import { CARD } from '../../shared/ui/organisms/card/card.component';
import { CartComponent, ZcCartFee, ZcCartLine } from '../../shared/ui/organisms/checkout/cart.component';
import { CheckoutStepDirective, CheckoutStepsComponent, ZcCheckoutStep } from '../../shared/ui/organisms/checkout/checkout-steps.component';
import { CtaCardComponent } from '../../shared/ui/organisms/cta-card/cta-card.component';
import { HelpCardComponent } from '../../shared/ui/organisms/cta-card/help-card.component';
import { ProductCardComponent } from '../../shared/ui/organisms/product-card/product-card.component';
import { RecipientsEditorComponent, ZcRecipient } from '../../shared/ui/organisms/recipients-editor/recipients-editor.component';
import { RuleBuilderComponent, ZcRuleField, ZcRuleGroup } from '../../shared/ui/organisms/rule-builder/rule-builder.component';
import { DsSectionComponent } from './ds/ds-layout';

const COUPONS: Record<string, CouponCheck> = {
  BIENVENIDA10: { code: 'BIENVENIDA10', kind: 'pct', value: 0.1, description: '10 % de descuento' },
  NAVIDAD20: { code: 'NAVIDAD20', kind: 'fix', value: 20, description: 'S/ 20 de descuento' },
};
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
interface Combo { id: string; name: string; text: string; price: number }
interface Pay { id: string; label: string; logos: string[]; badges: PayBadge[]; note: string }
interface Dest { name: string; wa: boolean; phone: PhoneValue; mail: boolean; email: string; when: string; date: string | null; time: string | null; msg: boolean; text: string }

/** Catálogo · Comercio y flujos de compra (Tanda 5): o-commerce, o-grid, o-rules y o-checkout. */
@Component({
  selector: 'zc-catalogo-commerce',
  imports: [ArtComponent, BadgeComponent, BrandLogoComponent, ButtonDirective, CheckboxComponent, IconComponent, LogoComponent, ButtonGroupDirective, PayBadgeComponent,
    ProgressComponent, RadioComponent, RadioGroupComponent, SwitchComponent, TooltipDirective, AlertComponent, AnnouncementComponent, OnboardingComponent, CouponFieldComponent,
    DateFieldComponent, DescriptionListComponent, FieldComponent, InputDirective, MenuComponent, PhoneFieldComponent, TimeFieldComponent, CARD, CartComponent,
    CheckoutStepDirective, CheckoutStepsComponent, CtaCardComponent, HelpCardComponent, ProductCardComponent, RecipientsEditorComponent, RuleBuilderComponent,
    DsSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-12' },
  template: `
    @if (show('o-grid')) {
      <zc-ds-section dsId="o-grid" title="Tabla editable (destinatarios)"
        description="Edición en línea con validación por celda, cantidades con −/+, agregar y quitar filas, acciones masivas y resumen que se actualiza en vivo. Como el paso de destinatarios del portal de empresas.">
        <div class="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-md bg-surface-2 px-4 py-3 max-sm:grid-cols-[auto_minmax(0,1fr)]">
          <span class="relative h-[60px] w-24 overflow-hidden rounded-sm max-sm:w-16"><zc-art category="Tecnología" [size]="20" /></span>
          <div class="grid min-w-0"><span class="text-xs text-muted">REPSOL</span><strong class="break-words">Tarjeta Regalo Repsol</strong><span class="text-sm num">Valor: S/ 20.00</span></div>
          <button zcButton variant="outline" size="sm" class="max-sm:col-span-2 max-sm:justify-self-start">Ver detalle</button>
        </div>
        <zc-recipients-editor #rec [(rows)]="recipients" [available]="50" (importExcel)="importExcel()" />
        <div class="flex flex-wrap gap-2">
          <button zcButton variant="ghost">Cancelar</button><span class="flex-1"></span>
          <button zcButton (click)="continueRecipients()">Continuar</button>
        </div>
      </zc-ds-section>
    }

    @if (show('o-rules')) {
      <zc-ds-section dsId="o-rules" title="Constructor de reglas y segmentos"
        description='Condiciones con campo, operador y valor, agrupadas con Y / O y un nivel de anidación. Una frase resume la regla y "Probar" muestra cuántos registros cumple. Sirve para antifraude, promociones, límites y segmentación de audiencias.'>
        <zc-rule-builder [fields]="ruleFields" [(rule)]="rule" country="pe" />
        <div class="flex flex-wrap items-center gap-3">
          <button zcButton variant="outline" size="sm" [loading]="testing()" (click)="testRule()"><zc-icon name="l:rotate-cw" [size]="16" />Probar regla</button>
          @if (testResult()) { <span class="inline-flex items-center gap-1.5 text-sm text-success" role="status"><zc-icon name="s:check-circle" [size]="16" />{{ testResult() }}</span> }
          <span class="flex-1"></span>
          <span class="text-sm font-medium">Acción</span><zc-badge tone="warning" icon="s:shield-warning">Retener para revisión</zc-badge>
        </div>
      </zc-ds-section>
    }

    @if (show('o-checkout')) {
      <zc-ds-section dsId="o-checkout" title="Checkout por pasos, opciones y métodos de pago"
        description="Pasos en acordeón progresivo (solo uno abierto, los completados muestran resumen y Editar), opciones con imagen, carrito con cupón y resumen con cargos explicados.">
        <div class="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <zc-cart class="lg:sticky lg:top-22 lg:order-2" [(lines)]="cart" country="pe" [discount]="cpn.total()" [fees]="fees()">
            <zc-field zcCartCoupon label="Cupones y gift cards" [optional]="true" [hint]="cpn.message()" [error]="cpn.error()" [success]="cpn.success()">
              <zc-coupon-field #cpn [validate]="validateCoupon" [subtotal]="subtotal()" country="pe" [(value)]="coupons" hint="Prueba BIENVENIDA10 o NAVIDAD20." />
            </zc-field>
            <button zcCartEmpty zcButton variant="outline" size="sm" (click)="refill()">Restaurar ejemplo</button>
          </zc-cart>

          <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
            <zc-checkout-steps #co [steps]="steps()" [(current)]="step">
              <ng-template zcCheckoutStep>
                <zc-radio-group label="¿Para quién es la compra?" orientation="horizontal" [(value)]="who"><zc-radio value="me">Para mí</zc-radio><zc-radio value="gift">Para regalar</zc-radio></zc-radio-group>
                <zc-radio-group label="Elige tu combo favorito" variant="card" [(value)]="combo">
                  @for (c of combos; track c.id) {
                    <zc-radio [value]="c.id" [description]="c.text">
                      <span class="grid gap-1">{{ c.name }}<span class="font-semibold num">{{ money(c.price) }}</span></span>
                      <span zcRadioAside class="relative size-[72px] shrink-0 overflow-hidden rounded-[10px] max-sm:size-14"><zc-art category="Gastronomía" [size]="24" /></span>
                    </zc-radio>
                  }
                </zc-radio-group>
                <div class="flex items-center gap-4"><span class="text-sm font-medium">Precio del combo</span><span class="ml-auto font-semibold num">{{ money(comboPrice()) }}</span></div>
                <button zcButton [block]="true" (click)="co.next()">Guardar y continuar</button>
              </ng-template>

              <ng-template zcCheckoutStep>
                <zc-field label="Cuéntanos, ¿a quién quieres sorprender?" [required]="true" [error]="destErr()">
                  <input #destName zcInput [value]="dest().name" placeholder="Nombre del destinatario" (input)="patchDest({ name: $any($event.target).value })" />
                </zc-field>
                <fieldset class="m-0 grid gap-1 border-0 p-0" [attr.aria-describedby]="chanErr() ? 'co-chan-err' : null">
                  <legend class="mb-1 p-0 text-sm font-medium">¿En qué medio lo enviamos? <span class="text-danger" aria-hidden="true">*</span></legend>
                  <zc-checkbox [checked]="dest().wa" (checkedChange)="patchDest({ wa: $event })">Por WhatsApp</zc-checkbox>
                  @if (dest().wa) { <zc-field label="Celular del destinatario" [reserve]="false"><zc-phone-field [value]="dest().phone" (valueChange)="patchDest({ phone: $event })" /></zc-field> }
                  <zc-checkbox [checked]="dest().mail" (checkedChange)="patchDest({ mail: $event })">Por correo electrónico</zc-checkbox>
                  @if (dest().mail) {
                    <zc-field label="Correo del destinatario" [reserve]="false"><input zcInput type="email" [value]="dest().email" placeholder="nombre@correo.com" (input)="patchDest({ email: $any($event.target).value })" /></zc-field>
                  }
                  @if (chanErr()) { <p id="co-chan-err" class="flex items-center gap-1 text-[13px] text-danger" role="alert"><zc-icon name="s:danger-circle" [size]="16" />{{ chanErr() }}</p> }
                </fieldset>
                <zc-radio-group label="¿Cuándo lo enviamos?" orientation="horizontal" [value]="dest().when" (valueChange)="patchDest({ when: $any($event) })">
                  <zc-radio value="now">Inmediato</zc-radio><zc-radio value="later">Para otro día</zc-radio>
                </zc-radio-group>
                @if (dest().when === 'later') {
                  <div class="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
                    <zc-field label="Fecha"><zc-date-field [min]="today" [value]="dest().date" (valueChange)="patchDest({ date: $any($event) })" /></zc-field>
                    <zc-field label="Hora"><zc-time-field from="07:00" to="21:00" [value]="dest().time" (valueChange)="patchDest({ time: $event })" /></zc-field>
                  </div>
                }
                <zc-switch [checked]="dest().msg" (checkedChange)="patchDest({ msg: $event })">¿Deseas añadir un mensaje especial?</zc-switch>
                @if (dest().msg) {
                  <zc-field label="Mensaje especial" [counter]="dest().text.length + '/200'"><textarea zcInput maxlength="200" placeholder="Escribe aquí" [value]="dest().text" (input)="patchDest({ text: $any($event.target).value })"></textarea></zc-field>
                }
                <button zcButton [block]="true" (click)="saveDest()">Guardar y continuar</button>
              </ng-template>

              <ng-template zcCheckoutStep>
                <zc-field label="Tu correo" [required]="true" [error]="emailErr()" hint="Te enviaremos el comprobante.">
                  <input #buyerEmail zcInput type="email" autocomplete="email" [value]="email()" (input)="email.set($any($event.target).value)" />
                </zc-field>
                <button zcButton [block]="true" (click)="saveEmail()">Continuar al pago</button>
              </ng-template>

              <ng-template zcCheckoutStep>
                <zc-radio-group label="Forma de pago" variant="card" [(value)]="pay">
                  @for (p of pays; track p.id) {
                    <zc-radio [value]="p.id">
                      {{ p.label }}
                      <span zcRadioAside class="ml-auto flex flex-wrap items-center justify-end gap-1">
                        @for (l of p.logos; track l) { <span class="inline-grid h-[26px] min-w-10 place-items-center rounded-[4px] border border-border bg-(--media-control-bg) px-1.5"><zc-logo [name]="l" [size]="18" /></span> }
                        @for (b of p.badges; track b) { <zc-pay-badge [name]="b" /> }
                      </span>
                    </zc-radio>
                  }
                </zc-radio-group>
                @if (payNote(); as n) { <zc-alert tone="warning" title="Antes de pagar">{{ n }}</zc-alert> }
                <button zcButton [block]="true" [loading]="paying()" (click)="payNow()">{{ paying() ? 'Procesando pago…' : 'Pagar ' + money(cartRef()?.total() ?? 0) }}</button>
              </ng-template>
            </zc-checkout-steps>
            <zc-help-card title="¿Necesitas ayuda?" text="Te asesoramos gratis para que completes tu compra.">
              <button zcButton variant="secondary" size="sm"><zc-icon name="s:chat-round-dots" [size]="16" />Escríbenos</button>
            </zc-help-card>
          </div>
        </div>
      </zc-ds-section>
    }

    @if (show('o-commerce')) {
      <zc-ds-section dsId="o-commerce" title="Producto, ayuda, llamada a la acción, límite de gasto y anuncio">
        <zc-announcement label="Anuncio" [(open)]="annOpen">Aprovecha la promoción de este mes con <strong>20 % de descuento</strong> en tus gift cards</zc-announcement>
        <zc-onboarding title="Optimiza compras, envío y control sin procesos manuales" [steps]="onboarding" [(open)]="onbOpen" />

        <h4 class="text-xs font-semibold uppercase tracking-[.04em] text-muted">Producto (e-commerce y portal)</h4>
        <div class="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-4">
          @for (p of products; track p.brand; let i = $index) {
            <zc-product-card [name]="'Tarjeta ' + p.brand" [brand]="p.brand" [category]="p.cat" [description]="p.desc" [price]="p.price" country="pe" [isNew]="i < 2" />
          }
        </div>

        <h4 class="text-xs font-semibold uppercase tracking-[.04em] text-muted">Inventario del portal (con vencimiento y acciones)</h4>
        <div class="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-4">
          @for (p of products; track p.brand; let i = $index) {
            <zc-card [title]="'Tarjeta Regalo ' + p.brand" [subtitle]="'Valor: ' + money(p.price)">
              <div zcCardMedia class="relative aspect-[16/10]"><zc-art [category]="p.cat" /><zc-brand-logo [name]="p.brand" /></div>
              <zc-description-list layout="rows" [items]="[{ term: 'Lote', value: '#GC-13202500' + (i + 1) }, { term: 'Stock', value: '500 unidades' }]" />
              <div><zc-badge [tone]="i === 1 ? 'danger' : 'warning'" icon="s:danger-triangle">Vencen en {{ i === 1 ? 7 : 30 }} días</zc-badge></div>
              <div zcCardFooter>
                <div zcButtonGroup class="w-full" [attr.aria-label]="'Acciones de ' + p.brand">
                  <button zcButton variant="outline" size="sm" class="flex-1" aria-label="Ver detalle" zcTooltip="Ver detalle"><zc-icon name="s:eye" [size]="16" /></button>
                  <button zcButton variant="outline" size="sm" class="flex-1" aria-label="Enviar" zcTooltip="Enviar"><zc-icon name="s:plain" [size]="16" /></button>
                  <button zcButton variant="outline" size="sm" class="flex-1" aria-label="Descargar" zcTooltip="Descargar"><zc-icon name="s:download-minimalistic" [size]="16" /></button>
                </div>
              </div>
            </zc-card>
          }
        </div>

        <h4 class="text-xs font-semibold uppercase tracking-[.04em] text-muted">Llamadas a la acción</h4>
        <div class="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-3">
          <zc-cta-card title="¿Tienes una tarjeta regalo Giftealo?" text="Aprende a canjearla en simples pasos." icon="s:gift"><button zcButton variant="secondary" size="sm">Te explicamos</button></zc-cta-card>
          <zc-cta-card title="¿Eres una empresa?" text="Te ayudamos a fidelizar a tus clientes y trabajadores." icon="s:buildings-2"><button zcButton variant="secondary" size="sm">Más información</button></zc-cta-card>
          <zc-cta-card title="¿Eres una marca?" text="Incrementa tus ventas a través de gift cards." icon="s:tag"><button zcButton variant="secondary" size="sm">Más información</button></zc-cta-card>
        </div>

        <h4 class="text-xs font-semibold uppercase tracking-[.04em] text-muted">Límite de gasto</h4>
        <div class="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
          @for (l of limits; track l.title) {
            <zc-card [title]="l.title" subtitle="Por periodo (mensual)" icon="s:calendar">
              <zc-menu zcCardAside label="Acciones del límite" [items]="limitMenu" [dense]="true" (select)="toast.info($event.label + ' límite', { text: 'Acción simulada.' })" />
              <div><zc-badge [tone]="l.used >= l.max ? 'danger' : 'success'" [icon]="l.used >= l.max ? 's:danger-triangle' : 's:check-circle'">{{ l.used >= l.max ? 'Límite alcanzado' : 'Activo' }}</zc-badge></div>
              <zc-progress variant="meter" label="Uso del límite" [value]="l.used" [max]="l.max" [valueText]="money(l.used) + ' / ' + money(l.max)" [warnAt]="80" [dangerAt]="100" />
              <div zcCardFooter><span>Usuarios: <strong>3</strong></span><span>Acción: <strong>Bloquear</strong></span><span class="flex-1"></span><span class="num">Hasta 30/01/2026</span></div>
            </zc-card>
          }
        </div>
      </zc-ds-section>
    }`,
})
export class CommerceSection {
  readonly parts = input<string[]>([]);
  readonly show = (id: string) => this.parts().includes(id);
  readonly toast = inject(ToastService);
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  constructor() { inject(DestroyRef).onDestroy(() => this.timers.forEach(t => clearTimeout(t))); this.refill(); }
  private later(fn: () => void, ms: number) { const t = setTimeout(() => { this.timers.delete(t); fn(); }, ms); this.timers.add(t); }
  money(n: number) { return formatMoney(n, 'pe'); }

  // ---- o-grid ----
  private readonly rec = viewChild<RecipientsEditorComponent>('rec');
  readonly recipients = signal<ZcRecipient[]>([['Carlos', 'Ramos', 'cramos@empresa.com'], ['Ana', 'López', 'alopez@empresa.com'], ['Pedro', 'Salazar', 'psalazar@empresa'], ['María', 'Valencia', 'mvalencia@empresa.com']]
    .map(([first, last, email], i) => ({ id: 'r' + i, first, last, email, qty: 0 })));
  importExcel() {
    this.recipients.update(a => [...a, { id: 'x1', first: 'Juan', last: 'Cortés', email: 'jcortes@empresa.com', qty: 0 }, { id: 'x2', first: 'Mirella', last: 'Mendoza', email: 'mmendoza@empresa.com', qty: 0 }]);
    this.toast.success('Excel cargado', { text: '2 destinatarios agregados.' });
  }
  continueRecipients() {
    const rec = this.rec(); if (!rec) return;
    if (!this.recipients().length) { this.toast.error('Agrega al menos un destinatario'); return; }
    const { bad, zero } = rec.validate();
    if (bad || zero) {
      const parts = [bad && bad + (bad > 1 ? ' filas con datos por corregir' : ' fila con datos por corregir'), zero && zero + ' sin cantidad'].filter(Boolean);
      this.toast.error('Revisa la tabla', { text: parts.join(' y ') + '.' });
      return;
    }
    this.toast.success('Destinatarios listos', { text: rec.assigned() + ' gift cards para ' + this.recipients().length + ' personas.' });
  }

  // ---- o-rules ----
  readonly ruleFields: ZcRuleField[] = [
    { id: 'amount', label: 'Monto de la compra', type: 'money' }, { id: 'country', label: 'País', type: 'country' },
    { id: 'channel', label: 'Canal', type: 'enum', options: ['Correo', 'WhatsApp', 'API'] }, { id: 'txday', label: 'Compras del día', type: 'num' },
    { id: 'client', label: 'Cliente', type: 'text' },
  ];
  readonly rule = signal<ZcRuleGroup>({ op: 'and', items: [
    { field: 'amount', op: 'gt', value: '1000' }, { field: 'country', op: 'in', value: 'pe' },
    { op: 'or', items: [{ field: 'channel', op: 'in', value: 'API' }, { field: 'txday', op: 'gt', value: '5' }] },
  ] });
  readonly testing = signal(false);
  readonly testResult = signal('');
  testRule() {
    this.testing.set(true); this.testResult.set('');
    this.later(() => { this.testing.set(false); this.testResult.set('Con los últimos 30 días, la regla habría retenido 37 de 12,480 compras (0.3 %).'); }, 800);
  }

  // ---- o-checkout ----
  readonly cartRef = viewChild(CartComponent);
  readonly combos: Combo[] = [
    { id: 'c1', name: 'Combo Whopper Clásico', text: 'Carne 100 % a la parrilla, pan con semillas y el toque justo de salsa BK. Incluye papas medianas y bebida.', price: 22 },
    { id: 'c2', name: 'Combo Whopper Doble', text: 'Doble carne, doble sabor. Ideal para los que no se conforman con poco. Incluye papas y bebida.', price: 34 },
    { id: 'c3', name: 'Combo King de Pollo', text: 'Pechuga crujiente, pan suave y papas doradas: la combinación ganadora para compartir.', price: 18.9 },
  ];
  readonly who = signal<unknown>('me');
  readonly combo = signal<unknown>('c1');
  readonly comboPrice = computed(() => this.combos.find(c => c.id === this.combo())?.price ?? 0);
  readonly step = signal(0);
  readonly today = todayIso();
  readonly dest = signal<Dest>({ name: '', wa: true, phone: { country: 'pe', number: '' }, mail: false, email: '', when: 'now', date: null, time: '10:00', msg: false, text: '' });
  readonly destTried = signal(false);
  readonly email = signal('');
  readonly emailTried = signal(false);
  readonly pay = signal<unknown>('card');
  readonly paying = signal(false);
  private readonly destName = viewChild<{ nativeElement: HTMLInputElement }>('destName');
  private readonly buyerEmail = viewChild<{ nativeElement: HTMLInputElement }>('buyerEmail');

  readonly cart = signal<ZcCartLine[]>([]);
  readonly coupons = signal<Coupon[]>([]);
  readonly validateCoupon = (code: string) => new Promise<CouponCheck>(res => setTimeout(() => res(COUPONS[code.toUpperCase()] ?? { error: 'notFound' }), 500));
  readonly subtotal = computed(() => this.cart().reduce((s, l) => s + l.price * l.qty, 0));
  readonly fees = computed<ZcCartFee[]>(() => this.cart().length ? [
    { label: 'Envío digital', amount: 1, info: 'Cubre el envío por WhatsApp o correo y el reenvío si el destinatario lo pide.' },
    { label: 'Servicio', amount: 1, info: 'Cargo por procesar el pago con la pasarela.' },
  ] : []);

  refill() {
    this.cart.set([
      { id: 'bk', name: 'Combo Whopper Clásico', brand: 'Burger King', category: 'Gastronomía', price: 22, qty: 1, note: 'Para mí' },
      { id: 'rp', name: 'Tarjeta Regalo Repsol S/ 50', brand: 'Repsol', category: 'Viajes', price: 50, qty: 2, note: 'Para regalar' },
      { id: 'spa', name: 'Experiencia Spa Relax para dos personas con circuito de aguas', brand: 'Spa Relax', category: 'Salud y belleza', price: 250, qty: 1, note: 'Para regalar' },
    ]);
  }

  readonly steps = computed<ZcCheckoutStep[]>(() => {
    const c = this.combos.find(x => x.id === this.combo());
    const d = this.dest();
    return [
      { id: 'escoge', title: 'Escoge', summary: (this.who() === 'me' ? 'Para mí' : 'Para regalar') + ' · ' + (c?.name ?? '') },
      { id: 'dest', title: 'Destinatario', summary: (d.name || 'Sin nombre') + ' · ' + [d.wa && 'WhatsApp', d.mail && 'correo'].filter(Boolean).join(' y ') + ' · ' + (d.when === 'now' ? 'inmediato' : 'programado') },
      { id: 'id', title: 'Identifícate', summary: this.email() },
      { id: 'pago', title: 'Completa el pago' },
    ];
  });
  patchDest(p: Partial<Dest>) { this.dest.update(d => ({ ...d, ...p })); }
  readonly destErr = computed(() => (this.destTried() && !this.dest().name.trim() ? 'Escribe el nombre del destinatario.' : null));
  readonly chanErr = computed(() => {
    if (!this.destTried()) return null;
    const d = this.dest();
    if (!d.wa && !d.mail) return 'Elige al menos un medio.';
    if (d.wa && d.phone.number.replace(/\D/g, '').length !== 9) return 'El celular debe tener 9 dígitos.';
    if (d.mail && !EMAIL.test(d.email)) return 'Ingresa un correo válido.';
    return null;
  });
  private readonly co = viewChild(CheckoutStepsComponent);
  saveDest() {
    this.destTried.set(true);
    if (this.destErr()) { this.destName()?.nativeElement.focus(); return; }
    if (this.chanErr()) return;
    this.co()?.next();
  }
  readonly emailErr = computed(() => (this.emailTried() && !EMAIL.test(this.email()) ? 'Ingresa un correo válido, ej. nombre@correo.com.' : null));
  saveEmail() {
    this.emailTried.set(true);
    if (this.emailErr()) { this.buyerEmail()?.nativeElement.focus(); return; }
    this.co()?.next();
  }
  readonly pays: Pay[] = [
    { id: 'card', label: 'Tarjeta de crédito o débito', logos: ['visa', 'mastercard', 'americanexpress', 'dinersclub'], badges: [], note: 'Serás redirigido al portal seguro de Niubiz. Aceptamos tarjetas nacionales e internacionales.' },
    { id: 'qr', label: 'Billetera QR', logos: [], badges: ['yape', 'plin'], note: 'Escanea el QR desde tu app. La compra se confirma al instante.' },
    { id: 'cash', label: 'Efectivo o transferencia', logos: [], badges: ['pagoefectivo'], note: 'Recibirás un código de pago válido por 24 horas.' },
    { id: 'pts', label: 'Puntos Promotick', logos: [], badges: ['puntos'], note: 'Se descuentan de tu saldo de puntos.' },
  ];
  readonly payNote = computed(() => this.pays.find(p => p.id === this.pay())?.note ?? '');
  payNow() {
    this.paying.set(true);
    const total = this.cartRef()?.total() ?? 0;
    this.later(() => {
      this.paying.set(false);
      this.toast.success('¡Compra realizada!', { text: 'Pedido #GF-20931 por ' + this.money(total) + '. Enviamos el comprobante a ' + this.email() + '.' });
      this.co()?.go(0);
    }, 1300);
  }

  // ---- o-commerce ----
  readonly annOpen = signal(true);
  readonly onbOpen = signal(true);
  readonly onboarding = ['Recarga tu saldo o navega por el catálogo.', 'Compra tus gift cards en segundos; se guardan en tu inventario.', 'Descárgalas o envíalas por correo o WhatsApp.', 'Controla compras, equipo y límites.'];
  readonly products = [
    { brand: 'Repsol', cat: 'Viajes', desc: 'Combustible y tienda · Lima', price: 50 }, { brand: 'Falabella', cat: 'Moda', desc: 'Moda, hogar y más · Lima', price: 50 },
    { brand: 'KFC', cat: 'Gastronomía', desc: 'Combos y postres · Arequipa', price: 20 }, { brand: 'Starbucks', cat: 'Gastronomía', desc: 'Café y bocaditos · Lima', price: 20 },
  ];
  readonly limits = [{ title: 'Límite mensual · Área Marketing', used: 3250, max: 5000 }, { title: 'Límite semanal · Operaciones', used: 2000, max: 2000 }];
  readonly limitMenu: ZcMenuItem[] = [
    { id: 'edit', label: 'Editar', icon: 's:pen' }, { id: 'pause', label: 'Pausar', icon: 's:clock-circle' }, { id: 'end', label: 'Finalizar', icon: 's:check-circle' },
    { id: 'del', label: 'Eliminar', icon: 's:trash-bin-trash', danger: true, separatorBefore: true },
  ];
}
