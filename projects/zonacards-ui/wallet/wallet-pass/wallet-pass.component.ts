import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CountryCode } from '@zonacards/ui/core';
import { formatDate } from '@zonacards/ui/core';
import { formatMoney } from '@zonacards/ui/core';
import { ArtComponent } from '@zonacards/ui/art';
import { QrComponent } from '@zonacards/ui/qr';
import { injectTranslate } from '@zonacards/ui/core';

export interface ZcWalletPass {
  program: string; member: string; points: number; tier: string;
  /** Colores del pase (los elige la marca en el diseñador): fondo, texto y etiquetas (Apple). */
  bg: string; fg: string; label: string;
  /** Número visible bajo el QR. */ code: string;
  category?: string;
}

/**
 * <zc-wallet-pass os="apple" side="front" [pass]="pase" country="pe" /> · vista previa del pase (o-wallet de index.html).
 * Apple Wallet y Google Wallet, frente y reverso. Es aproximada: Apple y Google generan el diseño final con los campos y colores.
 * Los colores vienen del diseñador (datos de la marca), no de los tokens; el QR siempre negro sobre blanco.
 */
@Component({
  selector: 'zc-wallet-pass',
  imports: [NgTemplateOutlet, ArtComponent, QrComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full max-w-[320px]' },
  template: `
    @let p = pass();
    @if (side() === 'back') {
      <div class="grid gap-3 rounded-2xl border border-border bg-surface p-4 text-fg shadow-2">
        @if (os() === 'apple') { <div class="flex items-center justify-between"><strong>{{ p.program }}</strong><span class="text-primary underline">{{ t('mol.wallet.listo') }}</span></div> }
        @else { <strong>{{ t('mol.wallet.detalles') }}</strong> }
        <dl class="m-0 grid">
          @for (r of backRows(); track r[0]; let last = $last) {
            <div class="grid gap-0.5 py-2" [class.border-b]="!last" [class.border-border]="!last"><dt class="text-caption text-muted">{{ r[0] }}</dt><dd class="m-0 break-words">{{ r[1] }}</dd></div>
          }
        </dl>
      </div>
    } @else if (os() === 'apple') {
      <div role="img" [attr.aria-label]="t('mol.wallet.ariaApple', { p: p.program, n: points(), tier: p.tier })"
        class="grid gap-2.5 rounded-2xl p-3.5 shadow-2" [style.background]="p.bg" [style.color]="p.fg">
        <div class="flex items-center justify-between gap-2">
          <span class="flex min-w-0 items-center gap-2 font-semibold"><span class="grid size-7 shrink-0 place-items-center rounded-sm text-xs font-bold" [style.background]="p.fg" [style.color]="p.bg">{{ p.program.charAt(0) }}</span><span class="truncate">{{ p.program }}</span></span>
          <span class="grid text-right"><small class="text-2xs font-semibold tracking-[.06em]" [style.color]="p.label">{{ t('mol.wallet.nivel') }}</small><b class="text-body font-semibold">{{ p.tier }}</b></span>
        </div>
        <div class="-mx-3.5 aspect-[3/1] overflow-hidden"><zc-art [category]="p.category ?? 'Experiencias'" /></div>
        <div class="grid"><small class="text-2xs font-semibold tracking-[.06em]" [style.color]="p.label">{{ t('mol.wallet.puntos') }}</small><b class="text-display leading-[1.1] font-semibold num">{{ points() }}</b></div>
        <div class="flex justify-between gap-2">
          <span class="grid min-w-0"><small class="text-2xs font-semibold tracking-[.06em]" [style.color]="p.label">{{ t('mol.wallet.miembro') }}</small><b class="truncate text-body font-semibold">{{ p.member }}</b></span>
          <span class="grid text-right"><small class="text-2xs font-semibold tracking-[.06em]" [style.color]="p.label">{{ t('mol.wallet.equivale') }}</small><b class="text-body font-semibold num">{{ worth() }}</b></span>
        </div>
        <ng-container *ngTemplateOutlet="qr" />
      </div>
    } @else {
      <div role="img" [attr.aria-label]="t('mol.wallet.ariaGoogle', { p: p.program, n: points() })"
        class="grid gap-2.5 overflow-hidden rounded-3xl p-4 shadow-2" [style.background]="p.bg" [style.color]="p.fg">
        <div class="flex items-center gap-2.5 font-semibold"><span class="grid size-8 place-items-center rounded-full text-caption font-bold" [style.background]="p.fg" [style.color]="p.bg">{{ p.program.charAt(0) }}</span>{{ p.program }}</div>
        <div class="text-heading font-semibold">{{ p.member }}</div>
        <div class="flex gap-6">
          <span class="grid"><small class="text-xs opacity-80">{{ t('mol.wallet.puntosG') }}</small><b class="num">{{ points() }}</b></span>
          <span class="grid"><small class="text-xs opacity-80">{{ t('mol.wallet.nivelG') }}</small><b>{{ p.tier }}</b></span>
        </div>
        <ng-container *ngTemplateOutlet="qr" />
        <div class="-mx-4 -mb-4 aspect-[3/1] overflow-hidden"><zc-art [category]="p.category ?? 'Experiencias'" /></div>
      </div>
    }
    <ng-template #qr>
      <div class="mt-1 grid justify-self-center justify-items-center gap-1 rounded-sm bg-(--qr-bg) p-2 text-(--qr-fg)">
        <zc-qr class="size-[120px]" [seed]="(p.points % 997) + 7" /><small class="text-tiny font-medium tracking-[.08em] num">{{ p.code }}</small>
      </div>
    </ng-template>`,
})
export class WalletPassComponent {
  readonly t = injectTranslate();
  readonly pass = input.required<ZcWalletPass>();
  readonly os = input<'apple' | 'google'>('apple');
  readonly side = input<'front' | 'back'>('front');
  readonly country = input<CountryCode>('pe');
  readonly points = computed(() => this.pass().points.toLocaleString('en-US'));
  /** 100 puntos = 1 unidad de moneda (demostración). */
  readonly worth = computed(() => formatMoney(this.pass().points / 100, this.country()));
  readonly backRows = computed<[string, string][]>(() => this.os() === 'apple'
    ? [[this.t('mol.wallet.comoUsar'), this.t('mol.wallet.comoUsarTexto')], [this.t('mol.wallet.atencion'), 'soporte@giftealo.com'], [this.t('mol.wallet.actualizado'), formatDate(new Date(), 'medium')]]
    : [[this.t('mol.wallet.programa'), this.pass().program], [this.t('mol.wallet.comoUsar'), this.t('mol.wallet.comoUsarCorto')], [this.t('mol.wallet.sitio'), 'giftealo.com']]);
}
