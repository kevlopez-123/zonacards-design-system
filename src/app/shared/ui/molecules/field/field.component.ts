import { ChangeDetectionStrategy, Component, Directive, DestroyRef, ElementRef, InjectionToken, computed, inject, input, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '../../atoms/icon/icon.component';
import { TooltipDirective } from '../../atoms/tooltip/tooltip.directive';
import { SUBSCREEN_HOST } from '../panel/panel';

/**
 * Lo provee un contenedor que muestra campos en línea (barra de filtros): la etiqueta queda solo para lectores de pantalla
 * y la fila de mensaje no ocupa espacio salvo que haya un error.
 */
export const FIELD_INLINE = new InjectionToken<boolean>('FIELD_INLINE');

let seq = 0;

/**
 * Anatomía fija: etiqueta (20 px, una línea) · control · una línea de mensaje que comparten ayuda y error.
 * El input se conecta solo con la directiva zcInput (id, aria-describedby, aria-invalid).
 * Las moléculas propias (select, fecha, teléfono…) se conectan inyectando el FieldComponent: usan controlId,
 * labelId y messageId, y avisan rechazos al escribir con flash() ("Solo se aceptan números.").
 */
@Component({
  selector: 'zc-field',
  imports: [IconComponent, TooltipDirective, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] content-start', '[class.gap-2]': '!inline', '[class.gap-1]': 'inline' },
  template: `
    <span class="flex h-5 min-w-0 items-center gap-1" [class.sr-only]="inline">
      <label [id]="labelId" [attr.for]="controlId" class="truncate text-sm font-medium leading-5">
        {{ label() }}@if (required()) {<span class="text-danger" aria-hidden="true"> *</span><span class="sr-only"> ({{ 'comun.obligatorio' | transloco }})</span>}
        @if (optional()) {<span class="font-normal text-muted"> {{ 'comun.opcional' | transloco }}</span>}
      </label>
      @if (info(); as i) {
        <button type="button" class="grid size-6 cursor-help place-items-center rounded-full text-subtle hover:bg-surface-2 hover:text-fg" [attr.aria-label]="('comun.masInfo' | transloco) + ': ' + i" [zcTooltip]="i"><zc-icon name="s:question-circle" [size]="16" /></button>
      }
    </span>
    <ng-content />
    <p [id]="messageId" class="flex min-h-5 items-start gap-1.5 text-[13px] leading-5" [class]="tone()"
      [class.hidden]="((inOverlay && !hint() && !counter()) || inline) && !shownError() && !success()" aria-live="polite">
      @if (shownError(); as e) { <zc-icon name="s:danger-circle" [size]="16" class="mt-0.5 shrink-0" /><span>{{ e }}</span> }
      @else if (success(); as s) { <zc-icon name="s:check-circle" [size]="16" class="mt-0.5 shrink-0" /><span>{{ s }}</span> }
      @else { <span>{{ hint() }}</span> }
      @if (counter(); as c) { <span class="ml-auto shrink-0 text-muted num">{{ c }}</span> }
    </p>`,
})
export class FieldComponent {
  readonly label = input.required<string>();
  readonly hint = input('');
  readonly error = input<string | null>(null);
  readonly required = input(false);
  readonly optional = input(false);
  readonly info = input<string | null>(null);
  /** Confirmación en la misma línea del mensaje ("Código válido (Luhn)."), en verde con ícono. */
  readonly success = input<string | null>(null);
  /** Contador a la derecha del mensaje ("0/280"), lo calcula la página. */
  readonly counter = input<string | null>(null);
  readonly tone = computed(() => (this.shownError() ? 'text-danger' : this.success() ? 'text-success' : 'text-muted'));
  readonly controlId = `zc-f-${++seq}`;
  readonly labelId = `${this.controlId}-l`;
  readonly messageId = `${this.controlId}-m`;
  readonly invalid = computed(() => !!this.error());
  /** Dentro de un sheet, drawer o modal el mensaje vacío no reserva espacio (sección 16 de las reglas). */
  readonly inOverlay = !!inject(SUBSCREEN_HOST, { optional: true });
  readonly inline = inject(FIELD_INLINE, { optional: true }) ?? false;

  /** Aviso breve al rechazar un carácter o un dato repetido; no marca el campo como inválido. */
  private readonly transient = signal<string | null>(null);
  readonly shownError = computed(() => this.transient() ?? this.error());
  private timer?: ReturnType<typeof setTimeout>;
  flash(message: string) {
    this.transient.set(message);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.transient.set(null), 1600);
  }
  constructor() { inject(DestroyRef).onDestroy(() => clearTimeout(this.timer)); }
}

/** Lo provee <zc-input-group>: el input pierde su borde (el contenedor dibuja el control, el prefijo y el sufijo). */
export const INPUT_GROUP = new InjectionToken<{ hasPrefix: () => boolean }>('INPUT_GROUP');

const BOX = 'w-full min-w-0 rounded-sm border border-border-strong bg-surface px-4 text-base text-fg outline-none transition placeholder:text-subtle hover:border-muted focus:border-focus focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--focus)_22%,transparent)] disabled:cursor-not-allowed disabled:border-dashed disabled:bg-surface-2 disabled:text-muted read-only:bg-surface-2 aria-invalid:border-danger aria-invalid:focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--danger-fg)_20%,transparent)]';

/**
 * input[zcInput] y textarea[zcInput] dentro de <zc-field>: estilo de control y conexión accesible.
 * Misma altura para todos los inputs (--target); el textarea crece desde 96 px y se redimensiona en vertical.
 */
@Directive({
  selector: 'input[zcInput], textarea[zcInput]',
  host: {
    '[class]': 'classes',
    '[id]': 'field?.controlId', '[attr.aria-describedby]': 'field?.messageId', '[attr.aria-invalid]': 'field?.invalid() || null', '[attr.aria-required]': 'field?.required() || null',
  },
})
export class InputDirective {
  readonly field = inject(FieldComponent, { optional: true });
  private readonly group = inject(INPUT_GROUP, { optional: true });
  private readonly isTextarea = inject(ElementRef).nativeElement.tagName === 'TEXTAREA';
  readonly classes = this.group
    ? 'zc-bare h-full w-full min-w-0 flex-1 bg-transparent px-4 text-base text-fg outline-none placeholder:text-subtle disabled:cursor-not-allowed disabled:text-muted ' + (this.group.hasPrefix() ? 'pl-3' : '')
    : BOX + (this.isTextarea ? ' block min-h-24 resize-y py-3 leading-normal' : ' h-target');
}
