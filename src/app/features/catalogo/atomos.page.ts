import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { CountryCode } from '@zonacards/ui/core';
import { formatMoneyCompact } from '@zonacards/ui/core';
import { GIFTCARD_LOOK } from '@zonacards/ui/core';
import { AvatarGroupComponent, AvatarPerson } from '@zonacards/ui/avatar';
import { AvatarComponent } from '@zonacards/ui/avatar';
import { BadgeComponent } from '@zonacards/ui/badge';
import { ButtonDirective } from '@zonacards/ui/button';
import { CheckboxComponent, CheckboxGroupComponent, CheckboxOption } from '@zonacards/ui/checkbox';
import { FieldsetComponent } from '@zonacards/ui/fieldset';
import { ChipComponent } from '@zonacards/ui/chip';
import { CountComponent } from '@zonacards/ui/count';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { ButtonGroupDirective, CloseButtonComponent, KbdDirective, LinkComponent, SeparatorComponent } from '@zonacards/ui/misc';
import { MoneyComponent } from '@zonacards/ui/money';
import { RatingComponent } from '@zonacards/ui/rating';
import { ProgressComponent } from '@zonacards/ui/progress';
import { RadioGroupComponent } from '@zonacards/ui/radio';
import { RadioComponent } from '@zonacards/ui/radio';
import { SkeletonComponent } from '@zonacards/ui/skeleton';
import { SpinnerComponent } from '@zonacards/ui/spinner';
import { SwitchComponent } from '@zonacards/ui/switch';
import { TooltipDirective } from '@zonacards/ui/tooltip';
import { FieldComponent, InputDirective } from '@zonacards/ui/field';
import { InputGroupComponent } from '@zonacards/ui/input-group';
import { ToastService } from '@zonacards/ui/toast';
import { ScrollAreaDirective, applyServerErrors, fieldError, focusFirstInvalid } from '@zonacards/ui/core';
import { CATALOG } from './ds/catalog-index';
import { DsGroupComponent, DsLevelComponent, DsSectionComponent } from './ds/ds-layout';

// Datos de docs/design-system/index.html (secciones a-button … a-progress).
const MONEY_EX: [number, CountryCode, string][] = [
  [950, 'pe', 'Menos de mil'], [10900, 'pe', 'Miles'], [1240350.5, 'pe', 'Millones'],
  [40000000, 'co', 'Pesos colombianos'], [2750000000, 'cl', 'Miles de millones'], [-15300, 'mx', 'Negativo'],
];
const MONEY_RULES: [string, string, number][] = [['Menos de 1.000', 'Sin abreviar', 950], ['Miles', 'K', 10900], ['Millones', 'M', 1240350.5], ['Miles de millones', 'MM', 2750000000]];
const EXTRA_BADGES: [string, IconName, 'accent' | 'warning' | 'info' | 'success' | 'danger'][] = [
  ['Venc. extendido', 's:calendar', 'accent'], ['Pendiente de aprobación', 's:hourglass', 'warning'], ['Pendiente de firma', 's:pen', 'info'],
  ['Pagada', 's:wallet-money', 'success'], ['Bajo mínimo', 's:danger-triangle', 'danger'],
];

/** Catálogo · Átomos: réplica de las secciones del mismo nombre en docs/design-system/index.html. */
@Component({
  selector: 'zc-catalogo-atomos',
  imports: [
    AvatarComponent, AvatarGroupComponent, BadgeComponent, ButtonDirective, ButtonGroupDirective, CheckboxComponent, CheckboxGroupComponent, ChipComponent, CloseButtonComponent, FieldsetComponent, CountComponent,
    IconComponent, KbdDirective, LinkComponent, MoneyComponent, ProgressComponent, RadioComponent, RatingComponent, RadioGroupComponent, SeparatorComponent, SkeletonComponent,
    SpinnerComponent, SwitchComponent, TooltipDirective, FieldComponent, InputDirective, InputGroupComponent, ScrollAreaDirective,
    DsLevelComponent, DsGroupComponent, DsSectionComponent, TranslocoPipe, ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './atomos.page.html',
})
export class AtomosPage {
  readonly level = CATALOG[1];
  private readonly toast = inject(ToastService);
  // Rating
  readonly stars = signal(3);
  readonly half = signal(3.5);
  private readonly timers: ReturnType<typeof setTimeout>[] = [];
  constructor() { inject(DestroyRef).onDestroy(() => this.timers.forEach(clearTimeout)); }

  // Button: clic → cargando (1,3 s) → éxito (1,8 s) → vuelve al inicio.
  readonly saveState = signal<'idle' | 'loading' | 'done'>('idle');
  save() {
    if (this.saveState() !== 'idle') return;
    this.saveState.set('loading');
    this.timers.push(setTimeout(() => {
      this.saveState.set('done');
      this.toast.success('Campaña guardada', { text: 'Navidad 2026 quedó activa.' });
      this.timers.push(setTimeout(() => this.saveState.set('idle'), 1800));
    }, 1300));
  }

  // Input y Textarea
  readonly motivo = signal('');
  readonly motivoCount = computed(() => `${this.motivo().length}/280`);

  // Checkbox, Radio, Switch
  readonly incluir = signal(true);
  readonly todos = signal(false);
  readonly parcial = signal(true);
  setTodos(v: boolean) { this.todos.set(v); this.parcial.set(false); }
  readonly impuesto = signal(false);
  readonly canal = signal<unknown>('mail');
  readonly canalesAviso = signal<readonly string[]>(['mail']);
  readonly canalesOpts: CheckboxOption[] = [
    { value: 'mail', label: 'Correo electrónico' },
    { value: 'whatsapp', label: 'WhatsApp', description: 'Solo en Perú y Colombia' },
    { value: 'sms', label: 'SMS (fuera de alcance)', disabled: true },
  ];
  // Errores del servidor: respuesta simulada que cae en sus campos; el foco va al primero.
  readonly serverForm = new FormGroup({
    email: new FormControl('ana@empresa.com', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('Ana 2', { nonNullable: true }),
  });
  readonly serverEmailError = fieldError(this.serverForm.controls.email);
  readonly serverNameError = fieldError(this.serverForm.controls.name);
  readonly serverGeneral = signal('');
  async saveToServer(form: HTMLElement) {
    this.serverForm.markAllAsTouched();
    const left = applyServerErrors(this.serverForm, {
      email: 'Ya existe una cuenta con este correo.',
      name: 'El nombre no puede llevar números.',
      cuenta: 'La cuenta está suspendida.',
    });
    this.serverGeneral.set(left.length ? 'No pudimos guardar: ' + left.map(k => k === 'cuenta' ? 'la cuenta está suspendida' : k).join(', ') + '.' : '');
    // Se busca dentro del formulario: la página del catálogo tiene otros campos de ejemplo con error más arriba.
    await focusFirstInvalid(form);
  }
  readonly alertas = signal(true);
  readonly recordatorio = signal(false);
  readonly tipoLote = signal<unknown>('digital');

  // Badge, Chip, Count
  readonly states = (['created', 'activated', 'voided', 'expired'] as const).map(k => GIFTCARD_LOOK[k]);
  readonly extraBadges = EXTRA_BADGES;
  readonly paisChip = signal(true);
  readonly invalidChip = signal(true);
  readonly propias = signal(true);
  readonly terceros = signal(false);
  resetChips() { this.paisChip.set(true); this.invalidChip.set(true); }

  // Montos
  readonly moneyEx = MONEY_EX;
  readonly moneyRules = MONEY_RULES.map(([r, suf, v]) => ({ r, suf, pe: formatMoneyCompact(v, 'pe'), cl: formatMoneyCompact(v, 'cl') }));

  // Avatar
  readonly aprobadores: AvatarPerson[] = [{ name: 'Ana Torres' }, { name: 'Lucía Mendoza' }, { name: 'Carlos Ríos' }, { name: 'Iván Baca' }, { name: 'Rosa Paz' }];
}
