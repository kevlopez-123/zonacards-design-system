import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from '../../shared/ui/atoms/button/button.directive';
import { StateComponent } from '../../shared/ui/organisms/state/state.component';

@Component({
  selector: 'zc-inicio-page', changeDetection: ChangeDetectionStrategy.OnPush, imports: [RouterLink, ButtonDirective],
  template: `<div class="grid gap-3"><h1 class="text-2xl font-semibold">Hola, Ana</h1><p class="text-muted">El dashboard por rol se construye en la etapa 6 (ver docs/tareas-claude-code.md).</p><div class="flex flex-wrap gap-3"><a zcButton routerLink="/lotes">Ir a Lotes</a><a zcButton variant="outline" routerLink="/catalogo">Ver catálogo</a></div></div>`,
})
export class InicioPage {}

@Component({
  selector: 'zc-sin-acceso-page', changeDetection: ChangeDetectionStrategy.OnPush, imports: [RouterLink, ButtonDirective, StateComponent],
  template: `<zc-state icon="s:shield-warning" title="No tienes acceso a esta sección" text="Pide a un administrador que agregue el permiso a tu rol."><a zcButton variant="outline" routerLink="/inicio">Volver al inicio</a></zc-state>`,
})
export class SinAccesoPage {}

@Component({
  selector: 'zc-no-encontrada-page', changeDetection: ChangeDetectionStrategy.OnPush, imports: [RouterLink, ButtonDirective, StateComponent],
  template: `<zc-state icon="s:magnifier" title="No encontramos esta página" text="Puede que el enlace esté mal escrito o que el elemento se haya eliminado."><a zcButton routerLink="/inicio">Ir al inicio</a></zc-state>`,
})
export class NoEncontradaPage {}
