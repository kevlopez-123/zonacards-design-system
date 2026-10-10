import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { CanDirective } from '../../core/session/can.directive';
import { AppError } from '../../core/http/interceptors';
import { countryByCode } from '../../shared/domain/countries';
import { formatDate } from '../../shared/domain/dates';
import { GIFTCARD_LOOK } from '../../shared/domain/states';
import { BadgeComponent } from '../../shared/ui/atoms/badge/badge.component';
import { ButtonDirective } from '../../shared/ui/atoms/button/button.directive';
import { FlagComponent } from '../../shared/ui/atoms/flag/flag.component';
import { IconComponent } from '../../shared/ui/atoms/icon/icon.component';
import { MoneyComponent } from '../../shared/ui/atoms/money/money.component';
import { StateComponent } from '../../shared/ui/organisms/state/state.component';
import { LotesService } from './lotes.service';

/**
 * Página piloto de Lotes (plantilla de listado). Demuestra el circuito completo:
 * mocks MSW → httpResource → estados (cargando, vacío, error) → tarjetas con componentes del sistema.
 * Pendiente (ver docs/tareas-claude-code.md): filtros, KPI, orden, vista tabla, paginación con criterio.
 */
@Component({
  selector: 'zc-lotes-page',
  imports: [TranslocoPipe, CanDirective, BadgeComponent, ButtonDirective, FlagComponent, IconComponent, MoneyComponent, StateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lotes.page.html',
})
export class LotesPage {
  readonly svc = inject(LotesService);
  readonly look = GIFTCARD_LOOK;
  readonly country = countryByCode;
  /** value() lanza un error si el recurso falló: siempre consultar hasValue() primero. */
  readonly items = computed(() => (this.svc.lotes.hasValue() ? this.svc.lotes.value().items : []));
  readonly error = computed(() => this.svc.lotes.error() as AppError | undefined);
  readonly date = (iso: string) => formatDate(new Date(iso + 'T12:00:00'), 'medium');
  onSearch(e: Event) { this.svc.query.set((e.target as HTMLInputElement).value); }
}
