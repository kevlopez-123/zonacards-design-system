import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent, IconName } from '@zonacards/ui/icon';
import { SegmentedComponent, ZcSegment } from '@zonacards/ui/segmented';
import { injectMedia, NARROW_QUERY } from '@zonacards/ui/core';
import { Brand, ThemeService } from '../../../../src/app/core/theme/theme.service';
import pkg from '../../../zonacards-ui/package.json';

interface NavLink { link: string; label: string; icon: IconName; exact?: boolean }

/** Marco del sitio: barra superior con tema y marca, navegación lateral (cajón en el celular) y contenido. */
@Component({
  selector: 'zc-docs-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonDirective, IconComponent, SegmentedComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-h-dvh' },
  template: `
    <a href="#contenido" class="sr-only z-(--z-toast) rounded-sm bg-surface px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">Saltar al contenido</a>
    <header class="sticky top-0 z-(--z-floating) flex h-topbar items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur md:px-6">
      @if (narrow()) {
        <button zcButton variant="ghost" size="icon" [attr.aria-expanded]="menu()" aria-controls="docs-nav" aria-label="Menú" (click)="menu.set(!menu())"><zc-icon name="s:hamburger-menu" /></button>
      }
      <a routerLink="/" class="flex items-center gap-2 text-fg no-underline">
        <span class="grid size-8 place-items-center rounded-sm bg-primary text-body font-bold text-on-primary" aria-hidden="true">Z</span>
        <strong class="text-body">Zonacards UI</strong>
        <span class="rounded-full bg-surface-2 px-2 py-0.5 text-tiny text-muted num max-sm:hidden">v{{ version }}</span>
      </a>
      <span class="flex-1"></span>
      <zc-segmented class="max-md:hidden" label="Marca" size="sm" [options]="brands" [value]="brand()" (valueChange)="setBrand($any($event))" />
      <zc-segmented label="Tema" size="sm" [options]="themes" [value]="theme.mode()" (valueChange)="theme.mode.set($any($event))" />
    </header>
    <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] md:grid-cols-[15rem_minmax(0,1fr)]">
      <nav id="docs-nav" aria-label="Documentación" class="border-r border-border bg-surface p-3 md:sticky md:top-topbar md:block md:h-[calc(100dvh-var(--topbar-h))] md:overflow-y-auto"
        [class.hidden]="narrow() && !menu()">
        @for (g of nav; track g.title) {
          <p class="m-0 px-3 pt-4 pb-1 text-caption font-medium text-muted first:pt-1">{{ g.title }}</p>
          @for (l of g.links; track l.link) {
            <a [routerLink]="l.link" routerLinkActive="bg-surface-2 font-medium text-fg" [routerLinkActiveOptions]="{ exact: !!l.exact }" ariaCurrentWhenActive="page"
              class="flex min-h-10 items-center gap-3 rounded-sm px-3 text-body-sm text-muted no-underline hover:bg-surface-2 hover:text-fg" (click)="menu.set(false)">
              <zc-icon [name]="l.icon" [size]="16" />{{ l.label }}
            </a>
          }
        }
      </nav>
      <main id="contenido" tabindex="-1" class="min-w-0 px-4 py-8 outline-none md:px-10"><router-outlet /></main>
    </div>`,
})
export class DocsShell {
  readonly theme = inject(ThemeService);
  readonly narrow = injectMedia(NARROW_QUERY);
  readonly menu = signal(false);
  readonly version = pkg.version;
  readonly nav: { title: string; links: NavLink[] }[] = [
    { title: 'Empezar', links: [
      { link: '/', label: 'Inicio', icon: 's:home-2', exact: true },
      { link: '/empezar', label: 'Instalación', icon: 's:download-minimalistic' },
      { link: '/paquete', label: 'El paquete', icon: 's:box' },
    ] },
    { title: 'Sistema', links: [
      { link: '/tokens', label: 'Tokens', icon: 's:pallete-2' },
      { link: '/componentes/fundamentos', label: 'Fundamentos', icon: 's:ruler-pen' },
      { link: '/componentes/atomos', label: 'Átomos', icon: 's:atom' },
      { link: '/componentes/moleculas', label: 'Moléculas', icon: 's:widget-2' },
      { link: '/componentes/organismos', label: 'Organismos', icon: 's:widget-4' },
      { link: '/componentes/plantillas', label: 'Plantillas', icon: 's:document' },
    ] },
    { title: 'Referencia', links: [
      { link: '/api', label: 'API de componentes', icon: 's:code' },
      { link: '/guia-ia', label: 'Guía para IA', icon: 's:magic-stick-3' },
      { link: '/revision', label: 'Revisión', icon: 's:checklist-minimalistic' },
      { link: '/cambios', label: 'Cambios', icon: 's:history' },
    ] },
  ];
  readonly themes: ZcSegment<'light' | 'dark' | 'system'>[] = [
    { value: 'light', label: 'Claro', icon: 's:sun', iconOnly: true }, { value: 'dark', label: 'Oscuro', icon: 's:moon', iconOnly: true }, { value: 'system', label: 'Sistema', icon: 's:monitor', iconOnly: true },
  ];
  readonly brands: ZcSegment<string>[] = ['zonacards', 'giftealo', 'enjoy', 'motiva'].map(b => ({ value: b, label: b[0].toUpperCase() + b.slice(1) }));
  readonly brand = signal(this.readBrand());

  private readBrand() { try { return localStorage.getItem('zc-brand') ?? 'zonacards'; } catch { return 'zonacards'; } }
  // ThemeService aplica data-brand y lo recuerda.
  setBrand(b: string) { this.brand.set(b); this.theme.brand.set(b as Brand); }
}
