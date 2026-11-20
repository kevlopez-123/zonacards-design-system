import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { CountryCode } from '@zonacards/ui/core';
import { ArtComponent } from '@zonacards/ui/art';
import { BrandLogoComponent } from '@zonacards/ui/brand-logo';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { MoneyComponent } from '@zonacards/ui/money';
import { TooltipDirective } from '@zonacards/ui/tooltip';
import { injectTranslate } from '@zonacards/ui/core';

/**
 * <zc-product-card name="Tarjeta Repsol" brand="Repsol" category="Viajes" [price]="50" country="pe" /> · producto del e-commerce
 * (o-commerce y o-facets de index.html): imagen con logo, cinta "Nueva", favorito (aria-pressed), "Desde" y comprar.
 * Imagen propia con [image]; si no, zc-art de la categoría.
 */
@Component({
  selector: 'zc-product-card',
  imports: [ArtComponent, BrandLogoComponent, ButtonDirective, IconComponent, MoneyComponent, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-rows-[auto_1fr_auto] overflow-hidden rounded-card border border-border bg-surface transition-[border-color,box-shadow] duration-(--dur) hover:border-border-strong hover:shadow-1' },
  template: `
    <div class="relative aspect-[16/10]">
      @if (image()) { <img class="size-full object-cover" [src]="image()" alt="" /> } @else { <zc-art [category]="category()" /> }
      @if (isNew()) { <span class="absolute top-2.5 left-0 z-(--z-sticky) rounded-r-full bg-(--brand-accent) py-1 pr-2.5 pl-3 text-xs font-semibold text-(--on-brand-accent)">{{ t('mol.producto.nueva') }}</span> }
      <button type="button" class="absolute top-2 right-2 z-(--z-sticky) grid size-10 cursor-pointer place-items-center rounded-full bg-(--media-control-bg) text-(--media-control-fg) aria-pressed:text-danger"
        [attr.aria-pressed]="favorite()" [attr.aria-label]="t(favorite() ? 'mol.producto.favQuitar' : 'mol.producto.favAgregar', { name: name() })" (click)="toggleFav()">
        <zc-icon [name]="favorite() ? 's:heart-bold' : 's:heart'" [size]="20" />
      </button>
      <zc-brand-logo [name]="brand()" [src]="logo()" />
    </div>
    <div class="grid content-start gap-1 p-4">
      <strong class="break-words">{{ name() }}</strong>
      @if (description()) { <p class="text-caption leading-5 text-muted">{{ description() }}</p> }
    </div>
    <div class="flex items-center gap-2 px-4 pb-4">
      <span class="text-caption text-muted">{{ t('mol.producto.desde') }}</span>
      <zc-money class="text-title-sm font-bold" [amount]="price()" [country]="country()" />
      <span class="flex-1"></span>
      <button zcButton size="icon-sm" [attr.aria-label]="t('mol.producto.comprar', { name: name() })" [zcTooltip]="t('mol.producto.comprarCorto')" (click)="buy.emit()"><zc-icon name="s:alt-arrow-right" [size]="16" /></button>
    </div>`,
})
export class ProductCardComponent {
  readonly t = injectTranslate();
  readonly name = input.required<string>();
  readonly brand = input.required<string>();
  readonly category = input('Gastronomía');
  readonly description = input('');
  readonly price = input.required<number>();
  readonly country = input.required<CountryCode>();
  readonly image = input<string | null>(null);
  readonly logo = input<string | null>(null);
  readonly isNew = input(false);
  readonly favorite = model(false);
  readonly buy = output<void>();
  toggleFav() { this.favorite.set(!this.favorite()); }
}
