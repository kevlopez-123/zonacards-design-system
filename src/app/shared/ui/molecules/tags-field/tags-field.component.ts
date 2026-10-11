import { ChangeDetectionStrategy, Component, computed, ElementRef, forwardRef, inject, input, linkedSignal, model, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';
import { ChipComponent } from '../../atoms/chip/chip.component';
import { EMAIL } from '../../../forms/validators';
import { injectTranslate } from '../../lang';
import { CONTROL_BOX } from '../../viewport';
import { FieldComponent } from '../field/field.component';

/**
 * <zc-tags-field [max]="5"> · varios correos (o etiquetas) en un campo.
 * Enter, coma, punto y coma o espacio agregan; pegar una lista la separa; Retroceso con el campo vacío quita el último.
 * Cada etiqueta se valida por separado (chip inválido con ícono); los repetidos se avisan y no se agregan.
 * Valor: string[]. Validar con zcValidators.emails(max).
 */
@Component({
  selector: 'zc-tags-field',
  imports: [ChipComponent],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TagsFieldComponent), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0' },
  template: `
    <div [class]="box" [attr.data-invalid]="invalidState()" [attr.data-disabled]="isDisabled()" (click)="focusInput($event)">
      @for (t of value(); track t) {
        <zc-chip [label]="t" [removable]="!isDisabled()" [invalid]="!isValid(t)" (remove)="remove(t)" />
      }
      <input #inp class="zc-bare h-8 min-w-0 flex-[1_0_10rem] bg-transparent px-1 text-base placeholder:text-subtle disabled:cursor-not-allowed"
        [type]="kind() === 'email' ? 'email' : 'text'" autocomplete="off" [id]="field?.controlId"
        [attr.aria-describedby]="field?.messageId" [attr.aria-invalid]="invalidState() || null" [attr.aria-required]="field?.required() || null"
        [placeholder]="full() ? fullText() : placeholder()" [disabled]="isDisabled() || full()"
        (keydown)="onKey($event)" (paste)="onPaste($event)" (blur)="commit(); onTouched()" />
    </div>`,
})
export class TagsFieldComponent implements ControlValueAccessor {
  readonly max = input<number | null>(null);
  readonly kind = input<'email' | 'text'>('email');
  readonly placeholder = input('');
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly value = model<string[]>([]);

  readonly field = inject(FieldComponent, { optional: true });
  private readonly i18n = inject(TranslocoService);
  private readonly inp = viewChild.required<ElementRef<HTMLInputElement>>('inp');
  /** Como .tags-control de index.html: crece con las etiquetas (sin el alto fijo del control; si no, el texto se sale sobre el mensaje). */
  readonly box = CONTROL_BOX.replace('h-target', 'h-auto') + ' min-h-target cursor-text flex-wrap gap-1.5 py-[7px] pr-2 pl-3';
  readonly isDisabled = linkedSignal(this.disabled);
  readonly invalidState = computed(() => this.invalid() || !!this.field?.invalid());
  readonly full = computed(() => this.max() !== null && this.value().length >= this.max()!);
  private readonly t = injectTranslate();
  readonly fullText = computed(() => this.t('ui.maximoAlcanzado'));

  private onChange: (v: string[]) => void = () => {};
  onTouched: () => void = () => {};

  isValid(t: string) { return this.kind() !== 'email' || EMAIL.test(t); }

  focusInput(e: Event) { if (!(e.target as HTMLElement).closest('button')) this.inp().nativeElement.focus(); }

  onKey(e: KeyboardEvent) {
    if (['Enter', ',', ';', ' '].includes(e.key)) {
      if (e.key !== 'Enter' || this.inp().nativeElement.value.trim()) e.preventDefault();
      this.commit();
    } else if (e.key === 'Backspace' && !this.inp().nativeElement.value && this.value().length) {
      this.set(this.value().slice(0, -1));
    }
  }

  onPaste(e: ClipboardEvent) {
    const text = e.clipboardData?.getData('text') ?? '';
    if (!/[,;\s]/.test(text.trim())) return;
    e.preventDefault();
    this.add(text.split(/[,;\s]+/));
  }

  commit() {
    const el = this.inp().nativeElement;
    const v = el.value.trim().replace(/[,;]$/, '');
    el.value = '';
    if (v) this.add([v]);
  }

  private add(items: string[]) {
    const cur = [...this.value()];
    let repeated = false;
    for (const raw of items) {
      const t = raw.trim(); if (!t) continue;
      if (cur.some(x => x.toLowerCase() === t.toLowerCase())) { repeated = true; continue; }
      if (this.max() !== null && cur.length >= this.max()!) { this.field?.flash(this.i18n.translate('ui.maximoEtiquetas', { max: this.max() })); break; }
      cur.push(t);
    }
    if (repeated) this.field?.flash(this.i18n.translate('ui.repetido'));
    if (cur.length !== this.value().length) this.set(cur);
  }

  remove(t: string) {
    this.set(this.value().filter(x => x !== t));
    this.inp().nativeElement.focus();
  }

  private set(v: string[]) { this.value.set(v); this.onChange(v); }

  writeValue(v: string[] | null) { this.value.set(v ?? []); }
  registerOnChange(fn: (v: string[]) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(d: boolean) { this.isDisabled.set(d); }
}
