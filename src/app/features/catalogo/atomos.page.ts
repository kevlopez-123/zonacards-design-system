import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { CountryCode } from '../../shared/domain/countries';
import { formatMoneyCompact } from '../../shared/domain/money';
import { GIFTCARD_LOOK } from '../../shared/domain/states';
import { AvatarGroupComponent, AvatarPerson } from '../../shared/ui/atoms/avatar/avatar-group.component';
import { AvatarComponent } from '../../shared/ui/atoms/avatar/avatar.component';
import { BadgeComponent } from '../../shared/ui/atoms/badge/badge.component';
import { ButtonDirective } from '../../shared/ui/atoms/button/button.directive';
import { CheckboxComponent } from '../../shared/ui/atoms/checkbox/checkbox.component';
import { ChipComponent } from '../../shared/ui/atoms/chip/chip.component';
import { CountComponent } from '../../shared/ui/atoms/count/count.component';
import { IconComponent } from '../../shared/ui/atoms/icon/icon.component';
import { IconName } from '../../shared/ui/atoms/icon/icon-registry.generated';
import { ButtonGroupDirective, CloseButtonComponent, KbdDirective, LinkComponent, SeparatorComponent } from '../../shared/ui/atoms/misc/misc';
import { MoneyComponent } from '../../shared/ui/atoms/money/money.component';
import { ProgressComponent } from '../../shared/ui/atoms/progress/progress.component';
import { RadioGroupComponent } from '../../shared/ui/atoms/radio/radio-group.component';
import { RadioComponent } from '../../shared/ui/atoms/radio/radio.component';
import { SkeletonComponent } from '../../shared/ui/atoms/skeleton/skeleton.component';
import { SpinnerComponent } from '../../shared/ui/atoms/spinner/spinner.component';
import { SwitchComponent } from '../../shared/ui/atoms/switch/switch.component';
import { TooltipDirective } from '../../shared/ui/atoms/tooltip/tooltip.directive';
import { FieldComponent, InputDirective } from '../../shared/ui/molecules/field/field.component';
import { InputGroupComponent } from '../../shared/ui/molecules/input-group/input-group.component';
import { ToastService } from '../../shared/ui/molecules/toast/toast.service';
import { ScrollAreaDirective } from '../../shared/ui/scroll-area';
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
    AvatarComponent, AvatarGroupComponent, BadgeComponent, ButtonDirective, ButtonGroupDirective, CheckboxComponent, ChipComponent, CloseButtonComponent, CountComponent,
    IconComponent, KbdDirective, LinkComponent, MoneyComponent, ProgressComponent, RadioComponent, RadioGroupComponent, SeparatorComponent, SkeletonComponent,
    SpinnerComponent, SwitchComponent, TooltipDirective, FieldComponent, InputDirective, InputGroupComponent, ScrollAreaDirective,
    DsLevelComponent, DsGroupComponent, DsSectionComponent, TranslocoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './atomos.page.html',
})
export class AtomosPage {
  readonly level = CATALOG[1];
  private readonly toast = inject(ToastService);
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
