import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { injectTranslate } from '@zonacards/ui/core';
import { Viewport } from '@zonacards/ui/core';

let seq = 0;
/** Margen con el borde de la ventana y separación entre la tarjeta y el elemento resaltado. */
const MARGIN = 16;
const GAP = 14;

export interface TourStep {
  /** Selector CSS del elemento real que se resalta. Si no está visible, el paso se salta. */
  target: string;
  title: string;
  text: string;
}

/**
 * Tour guiado con spotlight (o-tour de index.html): resalta un elemento real y explica para qué sirve.
 * Atrás, Siguiente, Saltar; Escape cierra y el foco vuelve a quien lo abrió; el foco queda dentro de la tarjeta.
 * En móvil la tarjeta va abajo. Nunca más de 5 pasos. start(origen) lo abre.
 */
@Component({
  selector: 'zc-tour',
  imports: [ButtonDirective, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents', '(window:resize)': 'place()', '(window:scroll)': 'place()', '(document:keydown.escape)': 'escape($event)' },
  template: `
    @if (step(); as s) {
      <div class="pointer-events-none fixed z-[140] rounded-ms shadow-[0_0_0_9999px_rgb(10_14_22/.62),0_0_0_3px_var(--brand-accent)] transition-all duration-200"
        [style.left.px]="spot().left" [style.top.px]="spot().top" [style.width.px]="spot().width" [style.height.px]="spot().height" aria-hidden="true"></div>
      <div #cardBox role="dialog" aria-modal="true" [attr.aria-labelledby]="uid" (keydown)="trap($event)"
        class="fixed z-[141] grid gap-2 rounded-lg bg-surface px-5 pt-4 pb-5 text-fg shadow-2"
        [class]="mobile() ? 'right-3 bottom-[calc(12px+env(safe-area-inset-bottom,0px))] left-3' : 'w-80'"
        [style.left.px]="mobile() ? null : card().left" [style.top.px]="mobile() ? null : card().top">
        <div class="-mr-2 flex items-center justify-between">
          <span class="text-[12.5px] text-muted num">{{ t('tour.paso', { n: index() + 1, total: steps().length }) }}</span>
          <button type="button" class="grid size-icon-btn cursor-pointer place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg" [attr.aria-label]="t('tour.cerrar')" (click)="end()"><zc-icon name="l:x" [size]="16" /></button>
        </div>
        <strong [id]="uid" class="text-[17px]">{{ s.title }}</strong>
        <p class="text-[14.5px] leading-[21px] text-muted">{{ s.text }}</p>
        <div class="flex gap-1.5 py-1" aria-hidden="true">
          @for (x of steps(); track $index) { <i class="h-1.5 rounded-full transition-all" [class]="$index === index() ? 'w-4 bg-fg' : 'w-1.5 bg-surface-3'"></i> }
        </div>
        <div class="flex items-center gap-2">
          <button zcButton variant="ghost" size="sm" (click)="end()">{{ t('tour.saltar') }}</button>
          <span class="flex-1"></span>
          @if (index() > 0) { <button zcButton variant="outline" size="sm" (click)="move(-1)">{{ t('tour.atras') }}</button> }
          <button #next zcButton size="sm" (click)="move(1)">{{ t(last() ? 'tour.terminar' : 'tour.siguiente') }}</button>
        </div>
        <span class="sr-only" aria-live="polite">{{ t('tour.anuncio', { n: index() + 1, titulo: s.title }) }}</span>
      </div>
    }`,
})
export class TourComponent {
  readonly t = injectTranslate();
  private readonly viewport = inject(Viewport);
  readonly steps = input.required<TourStep[]>();
  /** Terminó (con Terminar) o se cerró antes (Saltar, Escape, X). */
  readonly finished = output<boolean>();
  readonly uid = `zc-tour-${++seq}`;
  readonly index = signal(-1);
  readonly step = computed(() => this.steps()[this.index()] ?? null);
  readonly last = computed(() => this.index() === this.steps().length - 1);
  readonly mobile = this.viewport.mobile;
  readonly spot = signal({ left: 0, top: 0, width: 0, height: 0 });
  readonly card = signal({ left: 16, top: 16 });
  private readonly cardEl = viewChild<ElementRef<HTMLElement>>('cardBox');
  private readonly nextEl = viewChild<ElementRef<HTMLElement>>('next');
  private opener: HTMLElement | null = null;

  constructor() { inject(DestroyRef).onDestroy(() => this.index.set(-1)); }

  start(opener?: HTMLElement | null) {
    this.opener = opener ?? (document.activeElement as HTMLElement | null);
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.show(0, 1);
  }
  /** Va al paso i; si su elemento no está visible, sigue en la misma dirección. */
  private show(i: number, dir: 1 | -1) {
    while (i >= 0 && i < this.steps().length && !this.visible(this.steps()[i].target)) i += dir;
    if (i < 0 || i >= this.steps().length) { this.end(); return; }
    this.index.set(i);
    setTimeout(() => { this.place(); this.nextEl()?.nativeElement.focus(); });
  }
  private visible(sel: string) { const el = document.querySelector<HTMLElement>(sel); return !!el && !!el.offsetParent; }
  place() {
    const s = this.step(); if (!s) return;
    const el = document.querySelector<HTMLElement>(s.target); if (!el) return;
    el.scrollIntoView({ block: 'nearest' });
    const r = el.getBoundingClientRect(); const pad = 6;
    // El resaltado se recorta a la ventana: un elemento más alto que ella (una lista entera) no deja el borde fuera de la vista.
    const top = Math.max(MARGIN / 2, r.top - pad), bottom = Math.min(innerHeight - MARGIN / 2, r.bottom + pad);
    this.spot.set({ left: r.left - pad, top, width: r.width + pad * 2, height: Math.max(0, bottom - top) });
    const w = 320;
    const left = Math.min(innerWidth - w - MARGIN, Math.max(MARGIN, r.left + r.width / 2 - w / 2));
    this.card.set({ left, top: this.cardTop(top, bottom) });
  }
  /**
   * La tarjeta queda siempre dentro de la ventana (margen de 16 px): debajo del elemento si cabe; si no, arriba; si tampoco,
   * pegada al borde inferior, sobre la parte visible del elemento. Así el botón con el foco siempre se ve.
   */
  private cardTop(spotTop: number, spotBottom: number) {
    const h = this.cardEl()?.nativeElement.offsetHeight || 220;
    if (spotBottom + GAP + h <= innerHeight - MARGIN) return spotBottom + GAP;
    if (spotTop - GAP - h >= MARGIN) return spotTop - GAP - h;
    return Math.max(MARGIN, innerHeight - h - MARGIN);
  }
  move(d: 1 | -1) {
    if (d === 1 && this.last()) { this.end(true); return; }
    this.show(this.index() + d, d);
  }
  end(done = false) {
    if (this.index() < 0) return;
    this.index.set(-1);
    this.opener?.focus({ preventScroll: true });
    this.finished.emit(done);
  }
  escape(e: Event) { if (this.index() >= 0) { e.preventDefault(); this.end(); } }
  /** El foco no sale de la tarjeta. */
  trap(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    const f = [...(this.cardEl()?.nativeElement.querySelectorAll<HTMLElement>('button') ?? [])];
    const i = f.indexOf(document.activeElement as HTMLElement);
    if (e.shiftKey && i === 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  }
}
