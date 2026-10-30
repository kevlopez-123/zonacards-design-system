import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ArtComponent } from '@zonacards/ui/art';
import { CountryCode, formatDate, formatMoney, injectTranslate, isoToDate } from '@zonacards/ui/core';
import { QrComponent } from '@zonacards/ui/qr';

export type ZcBarcodeFormat = 'code128' | 'code39' | 'qr';

export interface ZcGiftcardPass {
  /** Emisor o marca ("Café Altura"); en Apple es el logoText. */
  issuer: string;
  /** Nombre de la tarjeta ("Café Altura S/ 50"). */
  title: string;
  balance: number;
  /** Número completo: va solo bajo el código; en los campos se enmascara. */
  number: string;
  pin?: string;
  /** Vencimiento ISO aaaa-mm-dd. */
  expires?: string;
  barcode: ZcBarcodeFormat;
  /** Imagen hero (Google, ~5:4) y strip (Apple, ~2,6:1): la misma foto con dos recortes. Sin imagen, arte por categoría. */
  image?: string;
  category?: string;
  /** Colores del pase (diseñador de la marca): fondo, texto y etiquetas (Apple). */
  bg: string; fg: string; label: string;
  /** Términos y datos poco usados: reverso (Apple) o detalles (Google). */
  terms?: string;
  support?: string;
}

/**
 * <zc-giftcard-pass os="google" side="front" [pass]="giftcard" country="pe" /> · vista previa de una giftcard en Google Wallet
 * (tipo Gift card) y Apple Wallet (storeCard), frente y reverso.
 * - Google: título con logo, emisor y saldo; nombre; hero; PIN enmascarado y vencimiento; código con el número debajo.
 * - Apple: logo y logoText con "SALDO" en el encabezado; strip con el saldo grande; número enmascarado y vencimiento; código; "i".
 * - CODE 39 en Apple: solo desde iOS 27; la vista muestra el QR de respaldo y lo avisa (declara QR o CODE 128 en el pase).
 * - El PIN no va en el frente de Apple (reverso); en Google va enmascarado. Es aproximada: recortes, colores de texto que elige el
 *   sistema, truncado, tipografía y modo oscuro los decide cada wallet. El código de barras lineal es ilustrativo.
 */
@Component({
  selector: 'zc-giftcard-pass',
  imports: [NgTemplateOutlet, ArtComponent, QrComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid w-full max-w-[320px] gap-2' },
  template: `
    @let p = pass();
    @if (side() === 'back') {
      <div class="grid gap-3 rounded-2xl border border-border bg-surface p-4 text-fg shadow-2">
        @if (os() === 'apple') { <div class="flex items-center justify-between"><strong>{{ p.issuer }}</strong><span class="text-primary underline">{{ t('mol.wallet.listo') }}</span></div> }
        @else { <strong>{{ t('mol.wallet.detalles') }}</strong> }
        <dl class="m-0 grid">
          @for (r of backRows(); track r[0]; let last = $last) {
            <div class="grid gap-0.5 py-2" [class.border-b]="!last" [class.border-border]="!last"><dt class="text-[13px] text-muted">{{ r[0] }}</dt><dd class="m-0 break-words">{{ r[1] }}</dd></div>
          }
        </dl>
      </div>
    } @else if (os() === 'apple') {
      <div role="img" [attr.aria-label]="t('mol.giftcard.aria', { emisor: p.issuer, saldo: balance(), wallet: 'Apple Wallet' })"
        class="grid gap-2.5 rounded-2xl p-3.5 shadow-2" [style.background]="p.bg" [style.color]="p.fg">
        <div class="flex items-center justify-between gap-2">
          <span class="flex min-w-0 items-center gap-2 font-semibold"><span class="grid size-7 shrink-0 place-items-center rounded-sm text-xs font-bold" [style.background]="p.fg" [style.color]="p.bg">{{ p.issuer.charAt(0) }}</span><span class="truncate">{{ p.issuer }}</span></span>
          <span class="grid text-right"><small class="text-[10px] font-semibold tracking-[.06em] uppercase" [style.color]="p.label">{{ t('mol.giftcard.saldo') }}</small><b class="text-[15px] font-semibold num">{{ balance() }}</b></span>
        </div>
        <div class="relative -mx-3.5 aspect-[375/144] overflow-hidden">
          <ng-container *ngTemplateOutlet="image" />
          <b class="absolute bottom-2 left-3.5 text-[30px] leading-[1.1] font-semibold num [text-shadow:0_1px_3px_rgb(0_0_0/.35)]" [style.color]="p.fg">{{ balance() }}</b>
        </div>
        <div class="flex justify-between gap-2">
          <span class="grid min-w-0"><small class="text-[10px] font-semibold tracking-[.06em] uppercase" [style.color]="p.label">{{ t('mol.giftcard.tarjeta') }}</small><b class="truncate text-[15px] font-semibold num">{{ masked() }}</b></span>
          @if (expires()) { <span class="grid text-right"><small class="text-[10px] font-semibold tracking-[.06em] uppercase" [style.color]="p.label">{{ t('mol.giftcard.vence') }}</small><b class="text-[15px] font-semibold num">{{ expires() }}</b></span> }
        </div>
        <ng-container *ngTemplateOutlet="code; context: { format: appleFormat() }" />
        <span class="grid size-6 justify-self-end place-items-center rounded-full border text-xs font-semibold" [style.border-color]="p.label" [style.color]="p.label" aria-hidden="true">i</span>
      </div>
      @if (p.barcode === 'code39') { <p class="m-0 text-xs text-muted">{{ t('mol.giftcard.respaldoApple') }}</p> }
    } @else {
      <div role="img" [attr.aria-label]="t('mol.giftcard.aria', { emisor: p.issuer, saldo: balance(), wallet: 'Google Wallet' })"
        class="grid gap-2.5 overflow-hidden rounded-3xl pb-4 shadow-2" [style.background]="p.bg" [style.color]="p.fg">
        <div class="flex items-center gap-2.5 px-4 pt-4 font-semibold">
          <span class="grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-bold" [style.background]="p.fg" [style.color]="p.bg">{{ p.issuer.charAt(0) }}</span>
          <span class="min-w-0 flex-1 truncate">{{ p.issuer }}</span><b class="shrink-0 num">{{ balance() }}</b>
        </div>
        <div class="px-4 text-[22px] leading-7 font-semibold">{{ p.title }}</div>
        <div class="aspect-[5/4] overflow-hidden"><ng-container *ngTemplateOutlet="image" /></div>
        <div class="flex gap-6 px-4">
          @if (p.pin) { <span class="grid"><small class="text-xs opacity-80">{{ t('mol.giftcard.pin') }}</small><b class="num">••••</b></span> }
          @if (expires()) { <span class="grid"><small class="text-xs opacity-80">{{ t('mol.giftcard.venceG') }}</small><b class="num">{{ expires() }}</b></span> }
        </div>
        <div class="px-4"><ng-container *ngTemplateOutlet="code; context: { format: p.barcode }" /></div>
      </div>
    }
    <p class="m-0 text-xs text-muted">{{ t('mol.giftcard.aproximada') }}</p>

    <ng-template #image>
      @if (p.image) { <img [src]="p.image" alt="" class="size-full object-cover" /> } @else { <zc-art [category]="p.category ?? 'Experiencias'" /> }
    </ng-template>
    <!-- Código siempre negro sobre blanco (--qr-*); el número completo va solo aquí. -->
    <ng-template #code let-format="format">
      <div class="mt-1 grid justify-items-center gap-1 rounded-sm bg-(--qr-bg) p-2 text-(--qr-fg)">
        @if (format === 'qr') {
          <zc-qr class="size-[120px]" [seed]="seed()" />
        } @else {
          <svg class="h-14 w-full max-w-[240px]" [attr.viewBox]="'0 0 ' + bars().width + ' 40'" preserveAspectRatio="none" aria-hidden="true">
            @for (b of bars().rects; track $index) { <rect [attr.x]="b[0]" y="0" [attr.width]="b[1]" height="40" fill="currentColor" /> }
          </svg>
        }
        <small class="text-[11px] font-medium tracking-[.08em] num">{{ p.number }}</small>
      </div>
    </ng-template>`,
})
export class GiftcardPassComponent {
  readonly t = injectTranslate();
  readonly pass = input.required<ZcGiftcardPass>();
  readonly os = input<'apple' | 'google'>('google');
  readonly side = input<'front' | 'back'>('front');
  readonly country = input<CountryCode>('pe');

  readonly balance = computed(() => formatMoney(this.pass().balance, this.country()));
  readonly masked = computed(() => '•••• ' + this.pass().number.replace(/\s/g, '').slice(-4));
  readonly expires = computed(() => { const e = this.pass().expires; return e ? formatDate(isoToDate(e), 'short') : ''; });
  /** Apple no lee CODE 39 antes de iOS 27: la vista muestra el respaldo (QR). */
  readonly appleFormat = computed<ZcBarcodeFormat>(() => (this.pass().barcode === 'code39' ? 'qr' : this.pass().barcode));
  readonly seed = computed(() => [...this.pass().number].reduce((s, c) => (s * 31 + c.charCodeAt(0)) % 997, 7));

  /** Barras ilustrativas (no escaneables) a partir del número: patrón estable por carácter, con guardas a los lados. */
  readonly bars = computed(() => {
    const rects: [number, number][] = [];
    let x = 0;
    const push = (bits: number[]) => { bits.forEach((w, i) => { if (i % 2 === 0) rects.push([x, w]); x += w; }); };
    push([2, 1, 1, 1, 2, 1]);
    for (const ch of this.pass().number.replace(/\s/g, '')) {
      const c = ch.charCodeAt(0);
      push([1 + (c % 3), 1 + ((c >> 2) % 2), 1 + ((c >> 3) % 3), 1 + ((c >> 1) % 2), 1 + ((c >> 4) % 2), 1]);
    }
    push([2, 1, 1, 1, 2]);
    return { rects, width: x };
  });

  readonly backRows = computed<[string, string][]>(() => {
    const p = this.pass();
    const rows: [string, string][] = [[this.t('mol.giftcard.tarjeta'), p.number]];
    if (p.pin && this.os() === 'apple') rows.push([this.t('mol.giftcard.pin'), p.pin]);
    if (this.expires()) rows.push([this.t('mol.giftcard.venceG'), this.expires()]);
    rows.push([this.t('mol.wallet.comoUsar'), this.t('mol.giftcard.comoUsar')]);
    if (p.terms) rows.push([this.t('mol.giftcard.terminos'), p.terms]);
    if (p.support) rows.push([this.t('mol.wallet.atencion'), p.support]);
    return rows;
  });
}
