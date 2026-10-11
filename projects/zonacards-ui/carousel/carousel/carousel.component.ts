import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, Directive, ElementRef, TemplateRef, afterNextRender, contentChild, inject, input, signal, viewChild } from '@angular/core';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { TooltipDirective } from '@zonacards/ui/tooltip';
import { injectTranslate } from '@zonacards/ui/core';
import { ScrollAreaDirective } from '@zonacards/ui/core';

/** Contenido de cada diapositiva: <ng-template zcSlide let-item let-i="index">…</ng-template>. */
@Directive({ selector: 'ng-template[zcSlide]' })
export class SlideDirective { readonly tpl = inject(TemplateRef); }

/**
 * <zc-carousel label="Plantillas" [items]="plantillas" [itemLabel]="nombre"> <ng-template zcSlide let-p>…</ng-template> </zc-carousel>
 * Carrusel (o-media de index.html): desliza con el dedo o la rueda (scroll-snap), botones Anterior/Siguiente y puntos.
 * 1 diapositiva y media en móvil, 2 en tablet y 3 en desktop. Sin avance automático. Cada diapositiva es un grupo "N de M".
 */
@Component({
  selector: 'zc-carousel',
  imports: [NgTemplateOutlet, ScrollAreaDirective, ButtonDirective, IconComponent, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3', role: 'region', 'aria-roledescription': 'carrusel', '[attr.aria-label]': 'label()' },
  template: `
    <div #track zcScrollArea [attr.aria-label]="label()" class="relative flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" (scroll)="onScroll()">
      @for (it of items(); track $index; let i = $index) {
        <div role="group" aria-roledescription="diapositiva" [attr.aria-label]="(i + 1) + ' ' + t('mol.carrusel.de') + ' ' + items().length + ': ' + itemLabel()(it)"
          class="shrink-0 grow-0 basis-[85%] snap-start overflow-hidden rounded-md border border-border bg-surface md:basis-[calc(50%-6px)] xl:basis-[calc(33.333%-8px)]">
          @if (slide(); as s) { <ng-container *ngTemplateOutlet="s.tpl; context: { $implicit: it, index: i }" /> }
        </div>
      }
    </div>
    <div class="flex items-center gap-2">
      <div class="flex flex-1 items-center gap-1.5">
        @for (it of items(); track $index; let i = $index) {
          <button type="button" class="h-2.5 cursor-pointer rounded-full p-0 transition-[width] duration-(--dur)" [class]="i === current() ? 'w-6 bg-fg' : 'w-2.5 bg-border-strong'"
            [attr.aria-label]="t('mol.carrusel.ir', { n: i + 1 })" [attr.aria-current]="i === current()" (click)="go(i)"></button>
        }
      </div>
      <button zcButton variant="outline" size="icon" [attr.aria-label]="t('mol.carrusel.anterior')" [zcTooltip]="t('mol.carrusel.anterior')" [disabled]="atStart()" (click)="go(current() - 1)"><zc-icon name="s:alt-arrow-left" /></button>
      <button zcButton variant="outline" size="icon" [attr.aria-label]="t('mol.carrusel.siguiente')" [zcTooltip]="t('mol.carrusel.siguiente')" [disabled]="atEnd()" (click)="go(current() + 1)"><zc-icon name="s:alt-arrow-right" /></button>
    </div>`,
})
export class CarouselComponent<T> {
  readonly t = injectTranslate();
  readonly label = input.required<string>();
  readonly items = input.required<readonly T[]>();
  readonly itemLabel = input<(it: T) => string>(it => String(it));
  readonly slide = contentChild(SlideDirective);
  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  readonly current = signal(0);
  readonly atStart = signal(true);
  readonly atEnd = signal(false);
  private raf = 0;

  constructor() {
    afterNextRender(() => this.update());
    let ro: ResizeObserver | undefined;
    afterNextRender(() => { ro = new ResizeObserver(() => this.update()); ro.observe(this.track().nativeElement); });
    inject(DestroyRef).onDestroy(() => { ro?.disconnect(); cancelAnimationFrame(this.raf); });
  }
  onScroll() { cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(() => this.update()); }
  private update() {
    const el = this.track().nativeElement; const first = el.children[0] as HTMLElement | undefined;
    if (!first) return;
    this.current.set(Math.round(el.scrollLeft / (first.offsetWidth + 12)));
    this.atStart.set(el.scrollLeft < 4);
    this.atEnd.set(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }
  go(i: number) {
    const el = this.track().nativeElement; const slides = el.children;
    const s = slides[Math.max(0, Math.min(slides.length - 1, i))] as HTMLElement;
    el.scrollTo({ left: s.offsetLeft });
  }
}

export const CAROUSEL = [CarouselComponent, SlideDirective] as const;
