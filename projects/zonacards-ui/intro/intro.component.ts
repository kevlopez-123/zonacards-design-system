import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';

/** Una diapositiva de la introducción: título, texto y, opcional, una imagen de fondo o un ícono. */
export interface IntroSlide { title: string; text: string; image?: string; icon?: IconName }

/**
 * <zc-step-dots [total] [(current)] /> · puntos de avance (introducción, carrusel de pasos). El actual es una píldora; el resto,
 * puntos. Anuncia "Paso 2 de 3". Solo informa: no se toca (la navegación la hacen los botones).
 */
@Component({
  selector: 'zc-step-dots',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex items-center justify-center gap-2', role: 'img', '[attr.aria-label]': 'label()' },
  template: `@for (d of dots(); track $index) { <span aria-hidden="true" [class]="d ? 'h-1.5 w-6 rounded-full bg-current' : 'size-1.5 rounded-full bg-current opacity-40'"></span> }`,
})
export class StepDotsComponent {
  readonly total = input.required<number>();
  /** Paso actual desde 0. */
  readonly current = model(0);
  readonly dots = computed(() => Array.from({ length: this.total() }, (_, i) => i === this.current()));
  readonly label = computed(() => `${this.current() + 1} / ${this.total()}`);
}

/**
 * <zc-intro-slides [slides] (finished) (skipped)> · introducción a pantalla completa de la primera vez: una diapositiva a la vez sobre
 * fondo `primary`, puntos de avance, "Saltar" (salvo en la última) y "Continuar" que en la última dice "Empezar". El título anuncia el
 * cambio de diapositiva. La app guarda que ya la vio. Llena su contenedor: ponla en una pantalla o en un overlay.
 */
@Component({
  selector: 'zc-intro-slides',
  imports: [ButtonDirective, IconComponent, StepDotsComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative isolate grid min-h-[32rem] min-w-0 grid-rows-[1fr_auto] overflow-hidden rounded-card bg-primary zc-on-primary' },
  template: `
    @if (slide(); as s) {
      @if (s.image) { <img [src]="s.image" alt="" class="absolute inset-0 -z-10 size-full object-cover opacity-45" /> }
      <div class="grid content-end gap-3 p-6 md:p-10">
        @if (s.icon) { <zc-icon [name]="s.icon" [size]="32" /> }
        <h2 class="m-0 text-display-sm font-extrabold" aria-live="polite">{{ s.title }}</h2>
        <p class="m-0 max-w-prose text-body">{{ s.text }}</p>
      </div>
    }
    <div class="grid gap-4 p-6 pt-0 md:px-10 md:pb-10">
      <zc-step-dots [total]="slides().length" [current]="index()" />
      <div class="flex items-center justify-between gap-3">
        @if (!last()) { <button zcButton type="button" variant="ghost" (click)="skipped.emit()">{{ 'mol.intro.saltar' | transloco }}</button> } @else { <span></span> }
        <button zcButton type="button" class="min-w-40" (click)="next()">
          {{ (last() ? 'mol.intro.empezar' : 'mol.intro.continuar') | transloco }}<zc-icon name="s:arrow-right" [size]="16" />
        </button>
      </div>
    </div>`,
})
export class IntroSlidesComponent {
  readonly slides = input.required<readonly IntroSlide[]>();
  readonly index = model(0);
  readonly finished = output<void>();
  readonly skipped = output<void>();
  readonly slide = computed(() => this.slides()[this.index()] ?? null);
  readonly last = computed(() => this.index() >= this.slides().length - 1);
  next() { if (this.last()) this.finished.emit(); else this.index.update(i => i + 1); }
}
