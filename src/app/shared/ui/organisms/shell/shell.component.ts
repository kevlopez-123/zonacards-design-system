import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { filter } from 'rxjs';
import { SessionService } from '../../../../core/session/session.service';
import { ThemeMode, ThemeService } from '../../../../core/theme/theme.service';
import { IconComponent } from '../../atoms/icon/icon.component';
import { IconName } from '../../atoms/icon/icon-registry.generated';
import { ButtonDirective } from '../../atoms/button/button.directive';

interface NavItem { path: string; labelKey: string; icon: IconName; }
interface NavGroup { labelKey: string; items: NavItem[]; }

/**
 * App shell: barra superior + sidebar (superficie propia con borde).
 * Móvil: drawer con X, scrim, Escape y foco atrapado; se cierra al navegar.
 */
@Component({
  selector: 'zc-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslocoPipe, IconComponent, ButtonDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  readonly theme = inject(ThemeService);
  readonly session = inject(SessionService);
  readonly drawerOpen = signal(false);
  private readonly menuBtn = viewChild<ElementRef<HTMLButtonElement>>('menuBtn');
  private readonly drawer = viewChild<ElementRef<HTMLElement>>('drawer');
  readonly modes: { v: ThemeMode; icon: IconName; key: string }[] = [
    { v: 'light', icon: 's:sun', key: 'tema.claro' }, { v: 'dark', icon: 's:moon', key: 'tema.oscuro' }, { v: 'system', icon: 's:monitor', key: 'tema.sistema' },
  ];
  readonly nav: NavGroup[] = [
    { labelKey: 'nav.grupo.operacion', items: [{ path: '/inicio', labelKey: 'nav.inicio', icon: 's:home-smile' }, { path: '/lotes', labelKey: 'nav.lotes', icon: 's:box' }] },
    { labelKey: 'nav.grupo.sistema', items: [{ path: '/catalogo', labelKey: 'nav.catalogo', icon: 's:widget-5' }] },
  ];

  constructor() {
    inject(Router).events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => { if (this.drawerOpen()) this.close(false); });
  }
  open() { this.drawerOpen.set(true); setTimeout(() => this.drawer()?.nativeElement.querySelector<HTMLElement>('button, a')?.focus(), 50); }
  close(refocus = true) { this.drawerOpen.set(false); if (refocus) this.menuBtn()?.nativeElement.focus(); }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (!this.drawerOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); this.close(); return; }
    if (e.key === 'Tab') {
      const f = Array.from(this.drawer()?.nativeElement.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []);
      const i = f.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1]?.focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0]?.focus(); }
    }
  }
}
