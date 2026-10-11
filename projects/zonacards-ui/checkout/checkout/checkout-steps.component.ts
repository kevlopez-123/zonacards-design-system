import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Directive, ElementRef, Injector, TemplateRef, afterNextRender, contentChildren, inject, input, model } from '@angular/core';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { injectTranslate } from '@zonacards/ui/core';

export interface ZcCheckoutStep { id: string; title: string; /** Resumen del paso completado ("Para mí · Combo Whopper"). */ summary?: string }

/** Cuerpo de un paso: <ng-template zcCheckoutStep>…</ng-template>, en el mismo orden que [steps]. */
@Directive({ selector: 'ng-template[zcCheckoutStep]' })
export class CheckoutStepDirective { readonly tpl = inject(TemplateRef); }

let seq = 0;

/**
 * <zc-checkout-steps [steps]="pasos" [(current)]="paso"> <ng-template zcCheckoutStep>…</ng-template> … </zc-checkout-steps>
 * Pasos en acordeón progresivo (o-checkout de index.html): solo el actual está abierto, los completados muestran su resumen
 * y "Editar", los siguientes quedan bloqueados. Al cambiar de paso el foco va a su título.
 * El botón "Guardar y continuar" de cada paso lo pone la página (valida y luego hace current + 1).
 */
@Component({
  selector: 'zc-checkout-steps',
  imports: [NgTemplateOutlet, ButtonDirective, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3' },
  template: `
    @for (s of steps(); track s.id; let i = $index) {
      <section class="min-w-0 rounded-md border border-border bg-surface" [class.opacity-60]="i > current()" [attr.aria-labelledby]="uid + '-' + i">
        <header class="flex min-h-[60px] min-w-0 items-center gap-3 p-4">
          <span class="grid size-7 shrink-0 place-items-center rounded-full border-[1.5px] text-[13px] font-semibold"
            [class]="i < current() ? 'border-success bg-success text-surface' : i === current() ? 'border-primary bg-primary text-on-primary' : 'border-border-strong'" aria-hidden="true">
            @if (i < current()) { <zc-icon name="l:check" [size]="16" /> } @else { {{ i + 1 }} }
          </span>
          <span class="grid min-w-0 flex-1">
            <strong [id]="uid + '-' + i" class="leading-[22px]" tabindex="-1">{{ s.title }}<span class="sr-only">{{ state(i) }}</span></strong>
            @if (i < current() && s.summary) { <small class="break-words text-[13px] text-muted">{{ s.summary }}</small> }
          </span>
          @if (i < current()) {
            <button zcButton variant="ghost" size="sm" [attr.aria-label]="t('mol.checkout.editar', { paso: s.title })" (click)="go(i)">{{ t('mol.checkout.editarCorto') }}</button>
          }
        </header>
        @if (i === current() && bodies()[i]; as b) {
          <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 px-4 pb-4"><ng-container *ngTemplateOutlet="b.tpl" /></div>
        }
      </section>
    }`,
})
export class CheckoutStepsComponent {
  readonly t = injectTranslate();
  readonly steps = input.required<readonly ZcCheckoutStep[]>();
  readonly current = model(0);
  readonly bodies = contentChildren(CheckoutStepDirective);
  readonly uid = `zc-co-${++seq}`;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);

  state(i: number) { return ', ' + this.t(i < this.current() ? 'mol.checkout.completo' : i === this.current() ? 'mol.checkout.actual' : 'mol.checkout.bloqueado'); }
  /** Cambia de paso y lleva el foco a su título (lectores de pantalla oyen el paso nuevo). */
  go(i: number) {
    this.current.set(i);
    afterNextRender(() => this.host.querySelector<HTMLElement>(`#${this.uid}-${i}`)?.focus(), { injector: this.injector });
  }
  next() { this.go(this.current() + 1); }
}
