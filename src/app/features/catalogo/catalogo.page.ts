import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { COUNTRIES } from '../../shared/domain/countries';
import { GIFTCARD_LOOK, GiftcardState } from '../../shared/domain/states';
import { AvatarGroupComponent, AvatarPerson } from '../../shared/ui/atoms/avatar/avatar-group.component';
import { AvatarComponent } from '../../shared/ui/atoms/avatar/avatar.component';
import { BadgeComponent } from '../../shared/ui/atoms/badge/badge.component';
import { ButtonDirective } from '../../shared/ui/atoms/button/button.directive';
import { CheckboxComponent } from '../../shared/ui/atoms/checkbox/checkbox.component';
import { ChipComponent } from '../../shared/ui/atoms/chip/chip.component';
import { FlagComponent } from '../../shared/ui/atoms/flag/flag.component';
import { IconComponent } from '../../shared/ui/atoms/icon/icon.component';
import { IconName } from '../../shared/ui/atoms/icon/icon-registry.generated';
import { MoneyComponent } from '../../shared/ui/atoms/money/money.component';
import { ProgressComponent } from '../../shared/ui/atoms/progress/progress.component';
import { RadioGroupComponent } from '../../shared/ui/atoms/radio/radio-group.component';
import { RadioComponent } from '../../shared/ui/atoms/radio/radio.component';
import { SkeletonComponent } from '../../shared/ui/atoms/skeleton/skeleton.component';
import { SpinnerComponent } from '../../shared/ui/atoms/spinner/spinner.component';
import { SwitchComponent } from '../../shared/ui/atoms/switch/switch.component';
import { TooltipDirective } from '../../shared/ui/atoms/tooltip/tooltip.directive';
import { FieldComponent, InputDirective } from '../../shared/ui/molecules/field/field.component';
import { DataSection } from './data.section';
import { FormMoleculesSection } from './form-molecules.section';
import { NavFeedbackSection } from './nav-feedback.section';
import { StructureSection } from './structure.section';

const FILTROS = ['País: Perú', 'Estado: Activado', 'Cliente: Interbank'];

/**
 * Catálogo vivo del design system en Angular. Replica docs/design-system/index.html sección por sección.
 * Cada componente nuevo se agrega aquí con todas sus variantes y estados antes de usarlo en una pantalla.
 */
@Component({
  selector: 'zc-catalogo-page',
  imports: [
    AvatarComponent, AvatarGroupComponent, BadgeComponent, ButtonDirective, CheckboxComponent, ChipComponent, FlagComponent, IconComponent, MoneyComponent,
    ProgressComponent, RadioComponent, RadioGroupComponent, SkeletonComponent, SpinnerComponent, SwitchComponent, TooltipDirective, FieldComponent, InputDirective,
    FormMoleculesSection, NavFeedbackSection, StructureSection, DataSection,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './catalogo.page.html',
})
export class CatalogoPage {
  readonly countries = COUNTRIES;
  readonly states = Object.entries(GIFTCARD_LOOK) as [GiftcardState, (typeof GIFTCARD_LOOK)[GiftcardState]][];
  readonly asIcon = (s: string) => s as IconName;
  readonly loading = signal(false);
  readonly swatches = [['Fondo', '--bg', '--text'], ['Superficie', '--surface', '--text'], ['Primario', '--primary', '--on-primary'], ['Secundario', '--secondary', '--on-secondary'], ['Éxito', '--success-bg', '--success-fg'], ['Advertencia', '--warning-bg', '--warning-fg'], ['Peligro', '--danger-bg', '--danger-fg'], ['Información', '--info-bg', '--info-fg']];
  readonly icons: IconName[] = ['s:widget-5', 's:buildings-2', 's:flag', 's:gift', 's:box', 's:plain', 's:layers', 's:headphones-round', 's:bill-list', 's:wallet-money', 's:chart-2', 's:checklist-minimalistic', 's:shield-warning', 's:history', 's:settings', 's:widget-5-bold'];
  // Checkbox, radio y switch
  readonly incluir = signal(true);
  readonly tipos = ['Códigos digitales', 'Tarjetas físicas', 'Recargas'];
  readonly tiposSel = signal([true, false, false]);
  readonly allTipos = computed(() => this.tiposSel().every(Boolean));
  readonly someTipos = computed(() => this.tiposSel().some(Boolean) && !this.allTipos());
  setAllTipos(v: boolean) { this.tiposSel.set(this.tipos.map(() => v)); }
  setTipo(i: number, v: boolean) { this.tiposSel.update((s) => s.map((x, j) => (j === i ? v : x))); }
  readonly canal = signal<unknown>('mail');
  readonly tipoLote = signal<unknown>('digital');
  readonly alertas = signal(true);

  // Chips
  readonly filtros = signal(FILTROS);
  quitarFiltro(f: string) { this.filtros.update((l) => l.filter((x) => x !== f)); }
  resetFiltros() { this.filtros.set(FILTROS); }
  readonly propias = signal(true);
  readonly terceros = signal(false);

  // Avatar y progreso
  readonly aprobadores: AvatarPerson[] = [{ name: 'Ana Torres' }, { name: 'Lucía Mendoza' }, { name: 'Carlos Ríos' }, { name: 'Iván Baca' }, { name: 'Rosa Paz' }];
  readonly cupos = [{ label: 'Cupo de la campaña', value: 92 }, { label: 'Stock de tarjetas físicas', value: 78 }, { label: 'Presupuesto del mes', value: 41 }];

  readonly pending = [
    'Moléculas: slider, OTP, color, secreto, texto enriquecido, recurrencia, firma',
    'Organismos: tarjetas (KPI con sparkline), gráficos de operación (embudo, cascada, mapa de calor, Sankey…), tabla editable, sesión por expirar, paleta de comandos, centro de notificaciones, checkout, kanban, constructor de reglas, chat, tour, escáner, etc.',
  ];
  save() { this.loading.set(true); setTimeout(() => this.loading.set(false), 1200); }
}
