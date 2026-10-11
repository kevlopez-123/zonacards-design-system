import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { environment } from '../../../../../environments/environment';
import { PendingApprovals } from '../../../../core/approvals/pending-approvals.service';
import { SessionService } from '../../../../core/session/session.service';
import { ThemeMode, ThemeService } from '../../../../core/theme/theme.service';
import { IconComponent } from '../../atoms/icon/icon.component';
import { IconName } from '../../atoms/icon/icon-registry.generated';
import { ButtonDirective } from '../../atoms/button/button.directive';
import { TooltipDirective } from '../../atoms/tooltip/tooltip.directive';
import { injectTranslate } from '../../lang';
import { MenuComponent, ZcMenuItem } from '../../molecules/menu/menu.component';
import { ToasterComponent } from '../../molecules/toast/toaster.component';
import { SidebarComponent, ZcNavGroup, ZcNavItem } from '../sidebar/sidebar.component';

/**
 * App shell: barra superior + zc-sidebar (expandido, riel en tablet y drawer en móvil) + contenido.
 * El botón de menú solo existe en móvil; en tablet y desktop el sidebar siempre está a la vista.
 * Aprobaciones tiene acceso directo con contador en la barra (sección "Arquitectura de información"); un módulo sin
 * permiso no aparece. Con datos simulados, el avatar permite cambiar de usuario de prueba para demostrar maker-checker.
 */
@Component({
  selector: 'zc-shell',
  imports: [RouterOutlet, RouterLink, TranslocoPipe, IconComponent, ButtonDirective, TooltipDirective, MenuComponent, ToasterComponent, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  readonly theme = inject(ThemeService);
  readonly session = inject(SessionService);
  readonly approvals = inject(PendingApprovals);
  readonly demo = environment.useMocks;
  private readonly t = injectTranslate();
  readonly modes: { v: ThemeMode; icon: IconName; key: string }[] = [
    { v: 'light', icon: 's:sun', key: 'tema.claro' }, { v: 'dark', icon: 's:moon', key: 'tema.oscuro' }, { v: 'system', icon: 's:monitor', key: 'tema.sistema' },
  ];
  readonly nav = computed<ZcNavGroup[]>(() => {
    const can = (p: Parameters<SessionService['can']>[0]) => this.session.can(p);
    const ops: ZcNavItem[] = [
      { id: 'inicio', link: '/inicio', label: this.t('nav.inicio'), icon: 's:home-smile', activeIcon: 's:home-smile-bold' },
      ...(can('lotes.ver') ? [{ id: 'lotes', link: '/lotes', label: this.t('nav.lotes'), icon: 's:box' as IconName, activeIcon: 's:box-bold' as IconName }] : []),
    ];
    const control: ZcNavItem[] = can('aprobaciones.ver')
      ? [{ id: 'aprobaciones', link: '/aprobaciones', label: this.t('nav.aprobaciones'), short: this.t('nav.aprobaciones'), icon: 's:checklist-minimalistic', activeIcon: 's:checklist-minimalistic-bold' }]
      : [];
    return [
      { label: this.t('nav.grupo.operacion'), items: ops },
      ...(control.length ? [{ label: this.t('nav.grupo.control'), items: control }] : []),
      { label: this.t('nav.grupo.sistema'), items: [
        { id: 'catalogo', link: '/catalogo', label: this.t('nav.catalogo'), short: this.t('nav.catalogoCorto'), icon: 's:widget-5', activeIcon: 's:widget-5-bold' },
      ] },
    ];
  });
  readonly initials = computed(() => (this.session.user()?.name ?? '').split(' ').map(p => p[0]).join('').slice(0, 2));
  /** Empieza con las iniciales visibles en el botón: el nombre accesible contiene el texto visible (WCAG 2.5.3). */
  readonly userLabel = computed(() => { const u = this.session.user(); return u ? `${this.initials()} · ${this.t('sesion.menu', { name: u.name, role: u.role })}` : ''; });
  readonly approvalsLabel = computed(() => (this.approvals.count() ? this.t('nav.aprobacionesN', { n: this.approvals.count() }) : this.t('nav.aprobaciones')));
  readonly userItems = computed<ZcMenuItem[]>(() => this.session.users.map(u => ({
    id: u.id, label: u.name, description: u.role, checked: u.id === this.session.user()?.id, group: this.t('sesion.cambiar'),
  })));
  switchUser(it: ZcMenuItem) { if (it.id !== this.session.user()?.id) this.session.switchUser(it.id); }
}
