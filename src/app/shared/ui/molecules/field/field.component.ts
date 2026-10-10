import { ChangeDetectionStrategy, Component, Directive, computed, inject, input } from '@angular/core';
import { IconComponent } from '../../atoms/icon/icon.component';

let seq = 0;

/**
 * Anatomía fija: etiqueta (20 px, una línea) · control · una línea de mensaje que comparten ayuda y error.
 * El input se conecta solo con la directiva zcInput (id, aria-describedby, aria-invalid).
 */
@Component({
  selector: 'zc-field',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2' },
  template: `
    <span class="flex h-5 min-w-0 items-center gap-1">
      <label [attr.for]="controlId" class="truncate text-sm font-medium leading-5">
        {{ label() }}@if (required()) {<span class="text-danger" aria-hidden="true"> *</span><span class="sr-only"> (obligatorio)</span>}
        @if (optional()) {<span class="font-normal text-muted"> (opcional)</span>}
      </label>
      @if (info(); as i) {
        <button type="button" class="grid size-6 cursor-help place-items-center rounded-full text-subtle hover:bg-surface-2 hover:text-fg" [attr.aria-label]="'Más información: ' + i" [title]="i"><zc-icon name="s:question-circle" [size]="16" /></button>
      }
    </span>
    <ng-content />
    <p [id]="messageId" class="flex min-h-5 items-start gap-1.5 text-[13px] leading-5" [class.text-danger]="!!error()" [class.text-muted]="!error()">
      @if (error(); as e) { <zc-icon name="s:danger-circle" [size]="16" class="mt-0.5" /><span>{{ e }}</span> } @else { {{ hint() }} }
    </p>`,
})
export class FieldComponent {
  readonly label = input.required<string>();
  readonly hint = input('');
  readonly error = input<string | null>(null);
  readonly required = input(false);
  readonly optional = input(false);
  readonly info = input<string | null>(null);
  readonly controlId = `zc-f-${++seq}`;
  readonly messageId = `${this.controlId}-m`;
  readonly invalid = computed(() => !!this.error());
}

/** input[zcInput] dentro de <zc-field>: estilo de control y conexión accesible. */
@Directive({
  selector: 'input[zcInput], textarea[zcInput]',
  host: {
    class: 'h-target w-full min-w-0 rounded-sm border border-border-strong bg-surface px-4 text-base outline-none transition placeholder:text-subtle hover:border-muted focus:border-focus focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--focus)_22%,transparent)] disabled:cursor-not-allowed disabled:border-dashed disabled:bg-surface-2 aria-invalid:border-danger',
    '[id]': 'field?.controlId', '[attr.aria-describedby]': 'field?.messageId', '[attr.aria-invalid]': 'field?.invalid() || null', '[attr.aria-required]': 'field?.required() || null',
  },
})
export class InputDirective { readonly field = inject(FieldComponent, { optional: true }); }
