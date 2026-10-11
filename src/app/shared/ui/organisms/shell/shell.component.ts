import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { SessionService } from '../../../../core/session/session.service';
import { ThemeMode, ThemeService } from '../../../../core/theme/theme.service';
import { IconComponent } from '../../atoms/icon/icon.component';
import { IconName } from '../../atoms/icon/icon-registry.generated';
import { ButtonDirective } from '../../atoms/button/button.directive';
import { injectTranslate } from '../../lang';
import { ToasterComponent } from '../../molecules/toast/toaster.component';
import { SidebarComponent, ZcNavGroup } from '../sidebar/sidebar.component';

/**
 * App shell: barra superior + zc-sidebar (expandido, riel en tablet y drawer en móvil) + contenido.
 * El botón de menú solo existe en móvil; en tablet y desktop el sidebar siempre está a la vista.
 */
@Component({
  selector: 'zc-shell',
  imports: [RouterOutlet, RouterLink, TranslocoPipe, IconComponent, ButtonDirective, ToasterComponent, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  readonly theme = inject(ThemeService);
  readonly session = inject(SessionService);
  private readonly t = injectTranslate();
  readonly modes: { v: ThemeMode; icon: IconName; key: string }[] = [
    { v: 'light', icon: 's:sun', key: 'tema.claro' }, { v: 'dark', icon: 's:moon', key: 'tema.oscuro' }, { v: 'system', icon: 's:monitor', key: 'tema.sistema' },
  ];
  readonly nav = computed<ZcNavGroup[]>(() => [
    { label: this.t('nav.grupo.operacion'), items: [
      { id: 'inicio', link: '/inicio', label: this.t('nav.inicio'), icon: 's:home-smile', activeIcon: 's:home-smile-bold' },
      { id: 'lotes', link: '/lotes', label: this.t('nav.lotes'), icon: 's:box', activeIcon: 's:box-bold' },
    ] },
    { label: this.t('nav.grupo.sistema'), items: [
      { id: 'catalogo', link: '/catalogo', label: this.t('nav.catalogo'), short: this.t('nav.catalogoCorto'), icon: 's:widget-5', activeIcon: 's:widget-5-bold' },
    ] },
  ]);
}
