import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { PASSWORD_RULES, passwordChecks, passwordScore } from '@zonacards/ui/core';
import { IconComponent } from '@zonacards/ui/icon';
import { injectTranslate } from '@zonacards/ui/core';
import { InputDirective } from '@zonacards/ui/field';
import { InputGroupComponent } from '@zonacards/ui/input-group';

let seq = 0;
const BAR: Record<number, string> = { 1: 'bg-danger', 2: 'bg-warning', 3: 'bg-info', 4: 'bg-success' };

/**
 * Contraseña nueva con medidor de seguridad y requisitos.
 *   <zc-field label="Crea una contraseña" [required]="true"><zc-password-field #pw [(value)]="clave" /></zc-field>
 *   <zc-password-rules [for]="pw" />   (los requisitos pueden ir al lado o debajo)
 * El medidor no reemplaza el mensaje del campo: los errores siguen en el zc-field.
 */
@Component({
  selector: 'zc-password-field',
  imports: [InputDirective, InputGroupComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 gap-2' },
  template: `
    <zc-input-group [revealable]="true">
      <input zcInput type="password" autocomplete="new-password" [value]="value()" (input)="value.set($any($event.target).value)" />
    </zc-input-group>
    <span class="grid grid-cols-4 gap-1" aria-hidden="true">
      @for (i of [1, 2, 3, 4]; track i) { <span class="h-1.5 rounded-full transition-colors duration-(--dur)" [class]="score() >= i ? bar() : 'bg-surface-3'"></span> }
    </span>
    <span [id]="uid" class="text-[13px] leading-5 text-muted" aria-live="polite">{{ t('mol.clave.seguridad', { nivel: t('mol.clave.nivel.' + score()) }) }}</span>`,
})
export class PasswordFieldComponent {
  readonly t = injectTranslate();
  readonly value = model('');
  readonly uid = `zc-pw-${++seq}`;
  readonly score = computed(() => passwordScore(this.value()));
  readonly bar = computed(() => BAR[this.score()] ?? '');
  readonly checks = computed(() => passwordChecks(this.value()));
}

@Component({
  selector: 'zc-password-rules',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
  template: `
    <ul [id]="id()" class="m-0 grid list-none gap-1 p-0 text-[13px]" [attr.aria-label]="t('mol.clave.requisitos')">
      @for (r of rules; track r) {
        <li class="flex items-center gap-1.5 leading-5" [class]="for().checks()[r] ? 'text-success' : 'text-muted'">
          <zc-icon [name]="for().checks()[r] ? 's:check-circle' : 's:close-circle'" [size]="16" class="shrink-0" />
          {{ t('mol.clave.regla.' + r) }}<span class="sr-only">, {{ t(for().checks()[r] ? 'mol.clave.cumplido' : 'mol.clave.pendiente') }}</span>
        </li>
      }
    </ul>`,
})
export class PasswordRulesComponent {
  readonly t = injectTranslate();
  readonly for = input.required<PasswordFieldComponent>();
  readonly id = input(`zc-pwr-${++seq}`);
  readonly rules = PASSWORD_RULES;
}
