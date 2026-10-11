import { ChangeDetectionStrategy, Component, computed, effect, input, model, output, signal } from '@angular/core';
import { ButtonDirective } from '../../atoms/button/button.directive';
import { SpinnerComponent } from '../../atoms/spinner/spinner.component';
import { FieldComponent, InputDirective } from '../../molecules/field/field.component';
import { injectTranslate } from '../../lang';
import { OverlayComponent } from './overlay.component';

export interface AlertDialogResult { reason: string; }

/**
 * <zc-alert-dialog> · acción destructiva o irreversible ("¿Anular 500 códigos?").
 * - Motivo obligatorio (reasonLabel) y, si es masiva, confirmación escrita (confirmWord="ANULAR").
 * - El botón de confirmar queda deshabilitado hasta completar ambos; el scrim no cierra; Escape y Cancelar sí.
 * - Desktop: modal con ícono de advertencia. Móvil: bottom sheet. busy muestra "…" y bloquea el doble envío.
 */
@Component({
  selector: 'zc-alert-dialog',
  imports: [OverlayComponent, FieldComponent, InputDirective, ButtonDirective, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'hidden' },
  template: `
    <zc-modal dialogRole="alertdialog" [title]="title()" [subtitle]="text()" [closable]="false" [dismissible]="false" [busy]="busy()" [(open)]="open">
      @if (reasonLabel()) {
        <zc-field [label]="reasonLabel()" [required]="true" [error]="reasonError()">
          <input zcInput data-autofocus [placeholder]="reasonPlaceholder()" [value]="reason()" maxlength="200"
            (input)="reason.set($any($event.target).value)" (blur)="reasonTouched.set(true)" />
        </zc-field>
      }
      @if (confirmWord()) {
        <zc-field [label]="t('org.escribeParaConfirmar', { word: confirmWord() })" [error]="wordError()">
          <input zcInput autocomplete="off" spellcheck="false" autocapitalize="characters" [value]="typed()"
            (input)="typed.set($any($event.target).value)" (blur)="wordTouched.set(true)" />
        </zc-field>
      }
      <ng-content />
      <div zcOverlayFooter>
        <button zcButton variant="outline" [attr.data-autofocus]="reasonLabel() || confirmWord() ? null : ''" [disabled]="busy()" (click)="open.set(false)">{{ cancelLabel() }}</button>
        <button zcButton variant="danger" [disabled]="!valid() || busy()" [loading]="busy()" (click)="confirm.emit({ reason: reason().trim() })">
          @if (busy()) { <zc-spinner [size]="16" /> }{{ confirmLabel() }}
        </button>
      </div>
    </zc-modal>`,
})
export class AlertDialogComponent {
  readonly title = input.required<string>();
  /** Consecuencia en una frase: qué pasa y qué no se puede deshacer. */
  readonly text = input('');
  /** Etiqueta del motivo ("Motivo"); vacío = sin motivo. */
  readonly reasonLabel = input('');
  readonly reasonPlaceholder = input('');
  readonly reasonMin = input(5);
  /** Palabra a escribir para confirmar (acciones masivas): "ANULAR". */
  readonly confirmWord = input('');
  /** Verbo + objeto: "Solicitar anulación". */
  readonly confirmLabel = input.required<string>();
  readonly cancelLabel = input.required<string>();
  readonly busy = input(false);
  readonly open = model(false);
  readonly confirm = output<AlertDialogResult>();

  readonly t = injectTranslate();
  readonly reason = signal('');
  readonly typed = signal('');
  readonly reasonTouched = signal(false);
  readonly wordTouched = signal(false);

  readonly reasonOk = computed(() => !this.reasonLabel() || this.reason().trim().length >= this.reasonMin());
  readonly wordOk = computed(() => !this.confirmWord() || this.typed().trim() === this.confirmWord());
  readonly valid = computed(() => this.reasonOk() && this.wordOk());
  readonly reasonError = computed(() => (this.reasonTouched() && !this.reasonOk() ? this.t('org.motivoMin', { n: this.reasonMin() }) : null));
  readonly wordError = computed(() => (this.wordTouched() && this.typed() && !this.wordOk() ? this.t('org.noCoincide', { word: this.confirmWord() }) : null));

  constructor() {
    // Cada apertura empieza en blanco: nunca queda una confirmación escrita de la vez anterior.
    effect(() => {
      if (this.open()) return;
      this.reason.set(''); this.typed.set(''); this.reasonTouched.set(false); this.wordTouched.set(false);
    });
  }
}
