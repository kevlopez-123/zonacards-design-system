import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, model, output, viewChildren } from '@angular/core';
import { injectTranslate } from '@zonacards/ui/core';
import { FieldComponent } from '@zonacards/ui/field';

/**
 * <zc-field label="Código de verificación" [error]="e" [success]="ok"><zc-otp [(value)]="code" (complete)="verificar($event)" /></zc-field>
 * Un casillero por dígito: escribir avanza, Retroceso vuelve, flechas recorren y pegar llena todos.
 * Solo acepta dígitos (avisa con field.flash). El primero lleva autocomplete="one-time-code" para el SMS del sistema.
 * state: 'valid' | 'invalid' pinta los bordes; el mensaje lo pone la página en el zc-field.
 */
@Component({
  selector: 'zc-otp',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex w-full max-w-[380px] gap-2', role: 'group', '[attr.aria-labelledby]': 'field?.labelId', '[attr.aria-describedby]': 'field?.messageId' },
  template: `
    @for (i of slots(); track i) {
      @if (i === split()) { <span class="self-center text-subtle" aria-hidden="true">–</span> }
      <input #box inputmode="numeric" maxlength="1" [attr.autocomplete]="i ? 'off' : 'one-time-code'" [id]="i === 0 ? field?.controlId : null"
        [attr.aria-label]="t('mol.otp.digito', { n: i + 1, total: length() })" [value]="digit(i)" [disabled]="disabled()"
        [attr.aria-invalid]="state() === 'invalid' || null"
        class="h-target min-w-0 max-w-[52px] flex-1 rounded-sm border bg-surface p-0 text-center text-xl font-semibold text-fg num outline-none transition focus:border-focus focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--focus)_22%,transparent)] disabled:cursor-not-allowed disabled:bg-surface-2"
        [class]="state() === 'invalid' ? 'border-danger' : state() === 'valid' ? 'border-success' : 'border-border-strong'"
        (beforeinput)="guard($event)" (input)="onInput(i, $event)" (keydown)="onKey(i, $event)" (paste)="onPaste(i, $event)" (focus)="select($event)" />
    }`,
})
export class OtpComponent {
  readonly field = inject(FieldComponent, { optional: true });
  readonly t = injectTranslate();
  readonly value = model('');
  readonly length = input(6);
  readonly disabled = input(false);
  readonly state = input<'valid' | 'invalid' | null>(null);
  /** Emite el código al completar todos los dígitos. */
  readonly complete = output<string>();
  private readonly boxes = viewChildren<ElementRef<HTMLInputElement>>('box');
  readonly slots = computed(() => Array.from({ length: this.length() }, (_, i) => i));
  /** Separador visual a la mitad (123 – 456). */
  readonly split = computed(() => (this.length() >= 6 ? Math.floor(this.length() / 2) : -1));
  readonly digits = computed(() => this.value().split(''));
  digit(i: number) { return (this.digits()[i] ?? '').trim(); }

  guard(e: Event) {
    const d = (e as InputEvent).data;
    if (d && /\D/.test(d)) { e.preventDefault(); this.field?.flash(this.t('mol.otp.soloNumeros')); }
  }
  select(e: Event) { (e.target as HTMLInputElement).select(); }

  private write(chars: string[]) {
    const v = chars.join('').slice(0, this.length());
    this.value.set(v);
    if (v.length === this.length() && !v.includes(' ')) this.complete.emit(v);
  }
  private focus(i: number) { this.boxes()[Math.max(0, Math.min(this.length() - 1, i))]?.nativeElement.focus(); }

  onInput(i: number, e: Event) {
    const el = e.target as HTMLInputElement;
    const ch = el.value.replace(/\D/g, '').slice(-1);
    el.value = ch;
    const chars = this.padded(); chars[i] = ch || ' ';
    this.write(this.trimEnd(chars));
    if (ch && i < this.length() - 1) this.focus(i + 1);
  }
  onKey(i: number, e: KeyboardEvent) {
    const el = e.target as HTMLInputElement;
    if (e.key === 'Backspace' && !el.value && i) { e.preventDefault(); const c = this.padded(); c[i - 1] = ' '; this.write(this.trimEnd(c)); this.focus(i - 1); }
    else if (e.key === 'ArrowLeft' && i) { e.preventDefault(); this.focus(i - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); this.focus(i + 1); }
  }
  onPaste(i: number, e: ClipboardEvent) {
    const d = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '');
    if (!d) return;
    e.preventDefault();
    const c = this.padded();
    d.split('').slice(0, this.length() - i).forEach((ch, k) => (c[i + k] = ch));
    this.write(this.trimEnd(c));
    this.focus(Math.min(i + d.length, this.length() - 1));
  }
  private padded() { return Array.from({ length: this.length() }, (_, k) => this.digits()[k] ?? ' '); }
  private trimEnd(c: string[]) { const s = c.join('').replace(/\s+$/, ''); return s.split(''); }
}
