import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { COUNTRIES } from '../../shared/domain/countries';
import { GIFTCARD_LOOK, GiftcardState } from '../../shared/domain/states';
import { BadgeComponent } from '../../shared/ui/atoms/badge/badge.component';
import { ButtonDirective } from '../../shared/ui/atoms/button/button.directive';
import { FlagComponent } from '../../shared/ui/atoms/flag/flag.component';
import { IconComponent } from '../../shared/ui/atoms/icon/icon.component';
import { IconName } from '../../shared/ui/atoms/icon/icon-registry.generated';
import { MoneyComponent } from '../../shared/ui/atoms/money/money.component';
import { SpinnerComponent } from '../../shared/ui/atoms/spinner/spinner.component';
import { FieldComponent, InputDirective } from '../../shared/ui/molecules/field/field.component';
import { StateComponent } from '../../shared/ui/organisms/state/state.component';

/**
 * Catálogo vivo del design system en Angular. Replica docs/design-system/index.html sección por sección.
 * Cada componente nuevo se agrega aquí con todas sus variantes y estados antes de usarlo en una pantalla.
 */
@Component({
  selector: 'zc-catalogo-page',
  imports: [BadgeComponent, ButtonDirective, FlagComponent, IconComponent, MoneyComponent, SpinnerComponent, FieldComponent, InputDirective, StateComponent],
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
  readonly pending = [
    'Átomos: checkbox, radio, switch, chip, avatar, progreso, skeleton, tooltip',
    'Moléculas: select, combobox, autocomplete, teléfono, documento, número, etiquetas, fecha, periodo, hora, slider, OTP, color, texto enriquecido, recurrencia, firma, tabs, migas, paginación, alertas, toast, acordeón, menú, carga de archivos',
    'Organismos: sidebar con riel, filtros y bottom sheets, tarjetas, gráficos, tabla de datos, tabla editable, modal, drawer, stepper, checkout, kanban, constructor de reglas, chat, tour, escáner, etc.',
  ];
  save() { this.loading.set(true); setTimeout(() => this.loading.set(false), 1200); }
}
