import { ChangeDetectionStrategy, Component, ElementRef, computed, contentChild, forwardRef, inject, input, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { FieldComponent, INPUT_GROUP, InputDirective } from '@zonacards/ui/field';

/**
 * <zc-input-group prefixIcon="s:letter"><input zcInput type="email" /></zc-input-group> · input con prefijo y sufijo
 * (".control" de index.html): un solo borde y anillo de foco para todo el conjunto, misma altura que cualquier campo.
 * - prefixIcon / prefixText: ícono o texto a la izquierda ("S/", "+51").
 * - revealable: botón para mostrar u ocultar una contraseña.
 * - valid: borde y check verdes (dato confirmado, ej. "Código válido").
 * - [zcSuffix]: contenido propio a la derecha (unidad, botón).
 * El estado de error lo toma del zc-field que lo contiene.
 */
@Component({
  selector: 'zc-input-group',
  imports: [IconComponent, TranslocoPipe],
  providers: [{ provide: INPUT_GROUP, useExisting: forwardRef(() => InputGroupComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()', '[attr.data-invalid]': 'invalid()', '[attr.data-valid]': 'valid()', '[attr.title]': 'null',
  },
  template: `
    @if (prefixIcon()) { <span class="flex h-full shrink-0 items-center pl-4 text-muted" aria-hidden="true"><zc-icon [name]="prefixIcon()!" /></span> }
    @if (prefixText()) { <span class="flex h-full shrink-0 items-center pl-4 text-muted num" aria-hidden="true">{{ prefixText() }}</span> }
    <ng-content />
    @if (revealable()) {
      <button type="button" class="mr-1 grid size-[calc(var(--target)-12px)] shrink-0 cursor-pointer place-items-center rounded-sm text-muted hover:bg-(--state-hover-bg) hover:text-fg"
        [attr.aria-label]="(shown() ? 'ui.ocultarClave' : 'ui.mostrarClave') | transloco" [attr.aria-pressed]="shown()" (click)="toggleReveal()">
        <zc-icon [name]="shown() ? 's:eye-closed' : 's:eye'" />
      </button>
    }
    <ng-content select="[zcSuffix]" />
    @if (valid()) { <span class="flex shrink-0 items-center pr-3 text-success" aria-hidden="true"><zc-icon name="s:check-circle" /></span> }`,
})
export class InputGroupComponent {
  readonly prefixIcon = input<IconName | null>(null);
  readonly prefixText = input('');
  readonly revealable = input(false);
  readonly valid = input(false);
  private readonly field = inject(FieldComponent, { optional: true });
  private readonly inputRef = contentChild(InputDirective, { read: ElementRef });
  readonly shown = signal(false);
  readonly invalid = computed(() => !!this.field?.invalid());
  readonly hasPrefix = () => !!(this.prefixIcon() || this.prefixText());

  readonly classes = computed(() =>
    'flex h-target w-full min-w-0 items-center rounded-sm border bg-surface transition hover:border-muted focus-within:border-focus '
    + 'focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--focus)_22%,transparent)] '
    + 'has-[input:disabled]:cursor-not-allowed has-[input:disabled]:border-dashed has-[input:disabled]:bg-surface-2 has-[input:read-only]:bg-surface-2 '
    + (this.invalid() ? 'border-danger focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--danger-fg)_20%,transparent)]' : this.valid() ? 'border-success' : 'border-border-strong'));

  toggleReveal() {
    const el = this.inputRef()?.nativeElement as HTMLInputElement | undefined;
    if (!el) return;
    this.shown.update(s => !s);
    el.type = this.shown() ? 'text' : 'password';
  }
}
