import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '@zonacards/ui/icon';
import { ScrollAreaDirective } from '@zonacards/ui/core';

export interface ZcFormError {
  /** id del control (el controlId del zc-field): el enlace lo enfoca. */
  id: string;
  message: string;
}

/**
 * <zc-stepper [steps]="['Empresa', 'Contacto', 'Comercial', 'Resumen']" [current]="paso" label="Nuevo cliente" />
 * Desktop y tablet: pasos horizontales (hechos con check, actual destacado, aria-current="step"); se desplaza si no caben.
 * Móvil: compacto, "Paso 2 de 4: Contacto" con barra de progreso.
 */
@Component({
  selector: 'zc-stepper',
  imports: [TranslocoPipe, IconComponent, ScrollAreaDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  template: `
    <div zcScrollArea class="overflow-x-auto [scrollbar-width:none] max-md:hidden [&::-webkit-scrollbar]:hidden">
      <ol class="m-0 flex w-max list-none gap-2 p-0" [attr.aria-label]="label()">
        @for (s of steps(); track $index; let i = $index) {
          <li class="flex h-11 items-center gap-2 rounded-full pr-3 pl-2 text-sm leading-none whitespace-nowrap"
            [class]="i === current() ? 'bg-surface-2 font-medium text-fg' : 'text-muted'" [attr.aria-current]="i === current() ? 'step' : null">
            <span class="grid size-7 shrink-0 place-items-center rounded-full border-[1.5px] text-caption font-semibold num" [class]="dotClass(i)">
              @if (i < current()) { <zc-icon name="l:check" [size]="16" /> } @else { {{ i + 1 }} }
            </span>
            <span aria-hidden="true">{{ s }}</span><span class="sr-only">{{ i < current() ? ('org.pasoCompletado' | transloco: { label: s }) : s }}</span>
          </li>
        }
      </ol>
    </div>
    <div class="flex items-center gap-3 text-sm md:hidden">
      <span class="shrink-0 num" aria-live="polite">{{ 'org.pasoDe' | transloco: { n: current() + 1, total: steps().length, label: steps()[current()] } }}</span>
      <span class="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3" role="progressbar" [attr.aria-label]="'org.progreso' | transloco"
        aria-valuemin="1" [attr.aria-valuemax]="steps().length" [attr.aria-valuenow]="current() + 1">
        <span class="block h-full rounded-full bg-primary transition-[width] duration-200" [style.width.%]="progress()"></span>
      </span>
    </div>`,
})
export class StepperComponent {
  readonly steps = input.required<readonly string[]>();
  /** Índice del paso actual (desde 0). */
  readonly current = input(0);
  readonly label = input.required<string>();
  readonly progress = computed(() => ((this.current() + 1) / this.steps().length) * 100);
  dotClass(i: number) {
    if (i < this.current()) return 'border-success bg-success text-surface';
    if (i === this.current()) return 'border-primary bg-primary text-on-primary';
    return 'border-border-strong';
  }
}

/**
 * <zc-form-summary [errors]="…" /> · resumen de errores al tope del formulario (sección 5 de las reglas).
 * Al fallar el envío, la página llama a focus(): el resumen recibe el foco y se anuncia; cada error es un enlace
 * que lleva al campo. Sin errores no ocupa espacio.
 */
@Component({
  selector: 'zc-form-summary',
  imports: [TranslocoPipe, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0 empty:hidden' },
  template: `
    @if (errors().length) {
      <div tabindex="-1" role="alert" class="flex min-w-0 items-start gap-3 rounded-md border border-danger-bd bg-danger-bg p-4 text-danger outline-offset-2">
        <zc-icon name="s:danger-circle" class="mt-0.5" />
        <div class="grid grid-cols-[minmax(0,1fr)] min-w-0 flex-1 gap-1">
          <span class="font-semibold leading-6">{{ errors().length === 1 ? ('org.revisaCampo' | transloco) : ('org.revisaCampos' | transloco: { n: errors().length }) }}</span>
          <ul class="m-0 grid gap-1 pl-[18px] text-sm leading-5">
            @for (e of errors(); track e.id) {
              <li><a [href]="'#' + e.id" class="text-inherit underline underline-offset-2" (click)="go($event, e.id)">{{ e.message }}</a></li>
            }
          </ul>
        </div>
      </div>
    }`,
})
export class FormSummaryComponent {
  readonly errors = input<readonly ZcFormError[]>([]);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  focus() { this.el.nativeElement.querySelector<HTMLElement>('[role="alert"]')?.focus(); }

  go(e: Event, id: string) {
    e.preventDefault();
    // focus() también desplaza hasta el campo.
    document.getElementById(id)?.focus();
  }
}
