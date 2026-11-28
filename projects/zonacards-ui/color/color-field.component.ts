import { ChangeDetectionStrategy, Component, ElementRef, TemplateRef, computed, inject, input, model, signal, viewChild } from '@angular/core';
import { contrastRatio, isHex, normalizeHexInput } from '@zonacards/ui/core';
import { injectTranslate } from '@zonacards/ui/core';
import { FieldComponent } from '@zonacards/ui/field';
import { Panel } from '@zonacards/ui/panel';
import { ColorPickerComponent } from './color-picker.component';

/**
 * Campo de color con muestra, HEX y contraste contra un color de texto (against, por defecto blanco).
 * La muestra abre zc-color-picker en popover (bottom sheet en móvil); Cancelar o Escape vuelven al color anterior.
 * El mensaje lo calcula el campo: enlázalo al zc-field con una referencia.
 *   <zc-field label="Color del botón" [error]="c.error()" [success]="c.success()"><zc-color-field #c [(value)]="hex" /></zc-field>
 */
@Component({
  selector: 'zc-color-field',
  imports: [ColorPickerComponent],
  providers: [Panel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  template: `
    <div #ctl class="flex h-target w-full min-w-0 items-center rounded-sm border bg-surface transition hover:border-muted focus-within:border-focus focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--focus)_22%,transparent)]"
      [class]="error() ? 'border-danger' : success() ? 'border-success' : 'border-border-strong'">
      <span class="flex h-full shrink-0 items-center pl-1.5">
        <button #sw type="button" class="size-[34px] cursor-pointer rounded-sm border border-border-strong p-0" [style.background]="valid() ? value() : 'transparent'"
          [attr.aria-label]="t('mol.color.abrir')" aria-haspopup="dialog" [attr.aria-expanded]="panel.isOpen()" [disabled]="disabled()" (click)="toggle()"></button>
      </span>
      <input class="zc-bare h-full min-w-0 flex-1 bg-transparent px-3 text-body text-fg num outline-none disabled:cursor-not-allowed" maxlength="7" spellcheck="false" autocomplete="off"
        [id]="field?.controlId" [attr.aria-describedby]="field?.messageId" [attr.aria-invalid]="!!error() || null" [disabled]="disabled()"
        [value]="draft() ?? value()" (input)="onInput($event)" (blur)="commitDraft()" />
      @if (valid()) { <span class="shrink-0 pr-4 text-body-sm text-muted num" aria-hidden="true">{{ ratio().toFixed(1) }}:1</span> }
    </div>
    <ng-template #tpl>
      <div class="p-2"><zc-color-picker [footer]="true" [value]="value()" (valueChange)="value.set($event)" (applied)="applied()" (cancel)="revert()" /></div>
    </ng-template>`,
})
export class ColorFieldComponent {
  readonly field = inject(FieldComponent, { optional: true });
  readonly panel = inject(Panel);
  readonly t = injectTranslate();
  readonly value = model('#172948');
  /** Color del texto que irá sobre este color (o del fondo sobre el que irá). */
  readonly against = input('#FFFFFF');
  readonly disabled = input(false);
  private readonly ctl = viewChild.required<ElementRef<HTMLElement>>('ctl');
  private readonly sw = viewChild.required<ElementRef<HTMLElement>>('sw');
  private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
  readonly draft = signal<string | null>(null);
  readonly valid = computed(() => isHex(this.value()));
  readonly ratio = computed(() => (this.valid() ? contrastRatio(this.value(), this.against()) : 0));
  /** Se dejó el campo con un HEX incompleto. */
  private readonly badFormat = signal(false);
  readonly error = computed(() => {
    if (this.badFormat() || !this.valid()) return this.t('mol.color.formato');
    if (this.draft() !== null) return null; // escribiendo
    return this.ratio() < 4.5 ? this.t('mol.color.noCumpleMsg', { r: this.ratio().toFixed(1) }) : null;
  });
  readonly success = computed(() => (!this.error() && this.draft() === null ? this.t('mol.color.cumpleMsg', { r: this.ratio().toFixed(1) }) : null));
  private before = '';
  private done = false;

  onInput(e: Event) {
    const el = e.target as HTMLInputElement; const v = normalizeHexInput(el.value);
    el.value = v; this.draft.set(v); this.badFormat.set(false);
    if (isHex(v)) { this.value.set(v); this.draft.set(null); }
  }
  commitDraft() { if (this.draft() !== null) this.badFormat.set(!isHex(this.draft()!)); if (!this.badFormat()) this.draft.set(null); }

  toggle() {
    if (this.panel.isOpen()) { this.panel.close(); return; }
    this.before = this.value(); this.done = false;
    this.panel.open(this.tpl(), {
      title: this.field?.label() ?? this.t('mol.color.titulo'), ariaLabel: this.t('mol.color.titulo'), role: 'dialog',
      origin: this.ctl().nativeElement, returnFocus: this.sw().nativeElement, width: 336, align: 'start', trap: true,
      onClose: () => { if (!this.done) this.value.set(this.before); },
    });
  }
  applied() { this.done = true; this.panel.close(); }
  revert() { this.value.set(this.before); this.done = true; this.panel.close(); }
}
