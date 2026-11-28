import { CdkTrapFocus } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Injector, OnInit, afterNextRender, computed, inject, input, model, output, signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ScrollAreaDirective } from '@zonacards/ui/core';
import { IsActiveMatchOptions, NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { filter, map } from 'rxjs';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { TooltipDirective } from '@zonacards/ui/tooltip';

export interface ZcNavChild { id: string; label: string; link?: string; }
export interface ZcNavItem {
  id: string;
  label: string;
  /** Etiqueta corta bajo el ícono en el riel ("Tarj. regalo"). */
  short?: string;
  icon: IconName;
  /** Ícono del estado activo (Solar Bold). */
  activeIcon?: IconName;
  /** Ruta (routerLink). Sin ruta, el ítem se marca con [(current)] y emite (navigate). */
  link?: string;
  children?: readonly ZcNavChild[];
}
export interface ZcNavGroup { label?: string; items: readonly ZcNavItem[]; }
export type SidebarLayout = 'mobile' | 'tablet' | 'desktop';

const read = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* almacenamiento no disponible */ } };
const SUBSET: IsActiveMatchOptions = { paths: 'subset', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored' };

let seq = 0;

/**
 * <zc-sidebar [groups]="…" /> · navegación principal (sección 20 y 21 de las reglas).
 * - Desktop (1280 px o más): expandido o riel de íconos con etiqueta corta; se alterna con el botón del pie o Ctrl+B
 *   y la preferencia se guarda por usuario.
 * - Tablet (768–1279 px): riel con tooltips; un ítem con submenú abre el menú completo sobre el contenido. Con tablet="drawer",
 *   igual que en móvil: sin riel, el contenido usa todo el ancho y el menú es el cajón que abre el botón de la barra.
 * - Móvil: drawer desde la izquierda, siempre expandido y sin "Contraer menú"; se cierra con la X, el scrim, Escape
 *   o al elegir una opción, y el foco vuelve al botón de menú. Mientras está abierto, el foco queda dentro.
 * - Activo con fondo de superficie 2 e ícono Bold. Variantes: superficie (por defecto), tinte de marca y marca oscura.
 */
@Component({
  selector: 'zc-sidebar',
  imports: [ScrollAreaDirective, CdkTrapFocus, RouterLink, RouterLinkActive, IconComponent, TooltipDirective, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '(document:keydown)': 'onShortcut($event)',
  },
  template: `
    @if (overlayOpen()) {
      <div [class]="(contained() ? 'absolute' : 'fixed') + ' inset-0 z-(--z-drawer-scrim) bg-(--overlay) animate-in fade-in-0 duration-200'" (click)="close()" aria-hidden="true"></div>
    }
    <nav [attr.aria-label]="label() || ('org.nav' | transloco)" [attr.role]="overlayOpen() ? 'dialog' : null" [attr.aria-modal]="overlayOpen() || null"
      [attr.inert]="layout() === 'mobile' && !overlayOpen() ? '' : null" [cdkTrapFocus]="overlayOpen()"
      [class]="panelClass()" (keydown)="onKey($event)">
      @if (overlayOpen() || brandTitle()) {
        <div class="flex min-h-15 shrink-0 items-center gap-2 border-b border-(--sb-border) px-3" [class.justify-center]="rail()">
          <ng-content select="[zcSidebarBrand]" />
          @if (!rail()) { <strong class="min-w-0 flex-1 text-body leading-5 text-(--sb-fg-active)">{{ brandTitle() }}</strong> }
          @if (overlayOpen()) {
            <button type="button" class="grid size-icon-btn shrink-0 cursor-pointer place-items-center rounded-full text-(--sb-fg-active) hover:bg-(--sb-hover)"
              [attr.aria-label]="'org.cerrarMenu' | transloco" (click)="close()"><zc-icon name="l:x" /></button>
          }
        </div>
      }
      <div zcScrollArea [zcScrollAreaFocusable]="false" class="grid min-h-0 flex-1 content-start gap-0.5 overflow-y-auto p-2">
        @for (g of groups(); track $index) {
          @if (g.label && !rail()) { <div class="px-3 pt-4 pb-1 text-caption font-semibold text-(--sb-fg) first:pt-1">{{ g.label }}</div> }
          @if (g.label && rail() && !$first) { <div class="mx-3 my-1.5 h-px bg-(--sb-border)" aria-hidden="true"></div> }
          @for (it of g.items; track it.id) {
            @if (it.children?.length) {
              <button type="button" [class]="itemClass()" [attr.aria-expanded]="rail() ? null : groupOpen(it)" [attr.aria-controls]="rail() ? null : subId(it)"
                [attr.aria-current]="rail() && isActive(it) ? 'page' : null" [attr.aria-label]="rail() ? it.label : null"
                [zcTooltip]="it.label" [zcTooltipDisabled]="!rail()" zcTooltipPosition="right" (click)="onParent(it)">
                <zc-icon [name]="isActive(it) ? (it.activeIcon ?? it.icon) : it.icon" class="shrink-0" />
                <span [class]="labelClass()">{{ rail() ? (it.short ?? it.label) : it.label }}</span>
                @if (!rail()) { <zc-icon name="s:alt-arrow-down" [size]="16" class="ml-auto shrink-0 transition-transform duration-(--dur)" [class.rotate-180]="groupOpen(it)" /> }
              </button>
              @if (!rail() && groupOpen(it)) {
                <div [id]="subId(it)" class="grid gap-0.5 pl-8">
                  @for (c of it.children; track c.id) {
                    @if (c.link) {
                      <a [routerLink]="c.link" routerLinkActive ariaCurrentWhenActive="page" [class]="childClass" (click)="picked(c.id)">{{ c.label }}</a>
                    } @else {
                      <button type="button" [class]="childClass" [attr.aria-current]="current() === c.id ? 'page' : null" (click)="picked(c.id)">{{ c.label }}</button>
                    }
                  }
                </div>
              }
            } @else if (it.link) {
              <a [routerLink]="it.link" routerLinkActive #rla="routerLinkActive" ariaCurrentWhenActive="page" [class]="itemClass()" [attr.aria-label]="rail() ? it.label : null"
                [zcTooltip]="it.label" [zcTooltipDisabled]="!rail()" zcTooltipPosition="right" (click)="picked(it.id)">
                <zc-icon [name]="rla.isActive ? (it.activeIcon ?? it.icon) : it.icon" class="shrink-0" />
                <span [class]="labelClass()">{{ rail() ? (it.short ?? it.label) : it.label }}</span>
              </a>
            } @else {
              <button type="button" [class]="itemClass()" [attr.aria-current]="current() === it.id ? 'page' : null" [attr.aria-label]="rail() ? it.label : null"
                [zcTooltip]="it.label" [zcTooltipDisabled]="!rail()" zcTooltipPosition="right" (click)="picked(it.id)">
                <zc-icon [name]="current() === it.id ? (it.activeIcon ?? it.icon) : it.icon" class="shrink-0" />
                <span [class]="labelClass()">{{ rail() ? (it.short ?? it.label) : it.label }}</span>
              </button>
            }
          }
        }
      </div>
      @if (layout() === 'desktop' && !overlayOpen()) {
        <div class="shrink-0 border-t border-(--sb-border) p-2">
          <button type="button" [class]="itemClass()" [attr.aria-label]="(rail() ? 'org.expandir' : 'org.contraer') | transloco"
            [zcTooltip]="((rail() ? 'org.expandir' : 'org.contraer') | transloco) + ' (' + ('org.atajo' | transloco) + ')'" zcTooltipPosition="right" (click)="togglePref()">
            <zc-icon [name]="rail() ? 'l:panel-left-open' : 'l:panel-left-close'" class="shrink-0" />
            @if (!rail()) { <span [class]="labelClass()">{{ 'org.contraer' | transloco }}</span> }
          </button>
        </div>
      }
    </nav>`,
})
export class SidebarComponent implements OnInit {
  readonly groups = input.required<readonly ZcNavGroup[]>();
  /** Nombre accesible de la navegación. */
  readonly label = input('');
  /** Título del encabezado (marca o producto). Sin título, el encabezado solo aparece en el drawer. */
  readonly brandTitle = input('');
  readonly appearance = input<'surface' | 'tint' | 'brand'>('surface');
  /** Clave para guardar expandido/riel. */
  readonly storageKey = input('zc-sb-mode');
  /** Ctrl+B alterna el menú. */
  readonly shortcut = input(true);
  /** Dentro de un marco (catálogo): el drawer y el scrim se posicionan respecto del contenedor, no de la ventana. */
  readonly contained = input(false);
  /** Ítem actual cuando los ítems no tienen ruta. */
  readonly current = model<string | null>(null);
  /** Tablet: riel de íconos (por defecto) o el mismo cajón que en móvil. */
  readonly tablet = input<'rail' | 'drawer'>('rail');
  readonly navigate = output<string>();

  private readonly router = inject(Router);
  private readonly doc = inject(DOCUMENT);
  /** null en el servidor (SSR): sin matchMedia el menú se dibuja como en escritorio. */
  private readonly win = this.doc.defaultView;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private opener: HTMLElement | null = null;
  private readonly id = `zc-sb-${++seq}`;
  readonly pref = signal<'full' | 'rail'>('full');
  readonly overlayOpen = signal(false);
  private readonly expanded = signal<ReadonlySet<string>>(new Set());
  private readonly url = toSignal(this.router.events.pipe(filter(e => e instanceof NavigationEnd), map(e => e.urlAfterRedirects)), { initialValue: this.router.url });
  /** Tramo de la ventana; layout aplica la preferencia de tablet. */
  private readonly media = signal<SidebarLayout>('desktop');
  readonly layout = computed<SidebarLayout>(() => (this.media() === 'tablet' && this.tablet() === 'drawer' ? 'mobile' : this.media()));

  readonly rail = computed(() => !this.overlayOpen() && (this.layout() === 'tablet' || (this.layout() === 'desktop' && this.pref() === 'rail')));

  private readonly vars = computed(() => ({
    surface: '[--sb-bg:var(--sidebar-bg)] [--sb-border:var(--sidebar-border)] [--sb-fg:var(--sidebar-fg)] [--sb-fg-active:var(--sidebar-fg-active)] [--sb-hover:var(--sidebar-hover-bg)] [--sb-active:var(--sidebar-active-bg)]',
    tint: '[--sb-bg:var(--sidebar-tint-bg)] [--sb-border:transparent] [--sb-fg:var(--sidebar-fg)] [--sb-fg-active:var(--sidebar-fg-active)] [--sb-hover:var(--sidebar-hover-bg)] [--sb-active:var(--sidebar-active-bg)]',
    brand: '[--sb-bg:var(--sidebar-brand-bg)] [--sb-border:var(--sidebar-brand-border)] [--sb-fg:var(--sidebar-brand-fg)] [--sb-fg-active:var(--sidebar-brand-fg-active)] [--sb-hover:var(--sidebar-brand-hover-bg)] [--sb-active:var(--sidebar-brand-active-bg)]',
  })[this.appearance()]);

  readonly hostClass = computed(() => {
    const w = this.layout() === 'mobile' ? 'contents' : 'relative block shrink-0 transition-[width] duration-200 ' + (this.rail() || this.layout() === 'tablet' ? 'w-rail' : 'w-sidebar');
    return w + ' ' + this.vars();
  });

  readonly panelClass = computed(() => {
    const base = 'flex flex-col overflow-hidden border-r border-(--sb-border) bg-(--sb-bg) text-(--sb-fg) ';
    const pos = this.contained() ? 'absolute' : 'fixed';
    if (this.overlayOpen()) return base + `${pos} inset-y-0 left-0 z-(--z-drawer) w-sidebar-drawer shadow-2 animate-in slide-in-from-left-3 fade-in-0 duration-180 ease-out motion-reduce:animate-none`;
    if (this.layout() === 'mobile') return base + `${pos} invisible inset-y-0 left-0 w-sidebar-drawer -translate-x-full`;
    return base + (this.contained() ? 'h-full w-full' : 'sticky top-topbar h-[calc(100dvh-var(--topbar-h))] w-full');
  });

  readonly itemClass = computed(() => {
    const base = 'flex w-full min-w-0 cursor-pointer items-center rounded-sm text-left text-(--sb-fg) no-underline transition-colors duration-(--dur) '
      + 'hover:bg-(--sb-hover) hover:text-(--sb-fg-active) aria-[current=page]:bg-(--sb-active) aria-[current=page]:font-medium aria-[current=page]:text-(--sb-fg-active) ';
    return base + (this.rail()
      ? 'min-h-14 flex-col justify-center gap-0.5 px-1 py-1.5 text-center text-tiny leading-3.5'
      : 'min-h-11 gap-3 px-3 text-body-sm pointer-coarse:min-h-12');
  });
  readonly labelClass = computed(() => (this.rail() ? 'max-w-full break-words' : 'min-w-0 flex-1 break-words leading-5'));
  readonly childClass = 'flex min-h-10 w-full cursor-pointer items-center rounded-sm px-3 text-left text-body-sm leading-5 text-(--sb-fg) no-underline hover:bg-(--sb-hover) hover:text-(--sb-fg-active) aria-[current=page]:bg-(--sb-active) aria-[current=page]:font-medium aria-[current=page]:text-(--sb-fg-active) pointer-coarse:min-h-12';

  constructor() {
    const mqTablet = this.win?.matchMedia?.('(min-width: 768px)');
    const mqDesktop = this.win?.matchMedia?.('(min-width: 1280px)');
    const update = () => {
      const next: SidebarLayout = (mqDesktop?.matches ?? true) ? 'desktop' : mqTablet?.matches ? 'tablet' : 'mobile';
      if (next !== this.media() && this.overlayOpen()) this.overlayOpen.set(false);
      this.media.set(next);
    };
    update();
    mqTablet?.addEventListener('change', update); mqDesktop?.addEventListener('change', update);
    const sub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => { if (this.overlayOpen()) this.overlayOpen.set(false); });
    inject(DestroyRef).onDestroy(() => { mqTablet?.removeEventListener('change', update); mqDesktop?.removeEventListener('change', update); sub.unsubscribe(); });
  }

  ngOnInit() {
    if (read(this.storageKey()) === 'rail') this.pref.set('rail');
    // Abre de entrada los grupos que contienen la página actual.
    this.expanded.set(new Set(this.groups().flatMap(g => g.items).filter(i => this.isActive(i)).map(i => i.id)));
  }

  /** Abre el drawer (móvil) o el menú completo sobre el contenido (tablet). El foco vuelve al disparador al cerrar. */
  open() {
    if (this.layout() === 'desktop' || this.overlayOpen()) return;
    this.opener = this.doc.activeElement as HTMLElement | null;
    this.overlayOpen.set(true);
    // El foco entra al menú (la X); la trampa de foco lo mantiene dentro mientras está abierto.
    afterNextRender({ write: () => this.host.nativeElement.querySelector<HTMLElement>('nav button, nav a')?.focus() }, { injector: this.injector });
  }
  close(refocus = true) {
    if (!this.overlayOpen()) return;
    this.overlayOpen.set(false);
    const o = this.opener; this.opener = null;
    if (refocus && o?.isConnected) o.focus({ preventScroll: true });
  }
  toggle() {
    if (this.layout() === 'desktop') this.togglePref();
    else if (this.overlayOpen()) this.close(); else this.open();
  }

  togglePref() { this.setPref(this.pref() === 'rail' ? 'full' : 'rail'); }
  /** Expandido o riel en desktop (se recuerda por usuario). */
  setPref(next: 'full' | 'rail') {
    this.pref.set(next);
    write(this.storageKey(), next);
  }

  isActive(it: ZcNavItem): boolean {
    this.url();
    const links = it.children?.length ? it.children : [it];
    return links.some(l => (l.link ? this.router.isActive(l.link, SUBSET) : this.current() === l.id));
  }
  groupOpen(it: ZcNavItem) { return this.expanded().has(it.id); }
  subId(it: ZcNavItem) { return `${this.id}-${it.id}`; }

  onParent(it: ZcNavItem) {
    if (this.rail()) {
      // En el riel el submenú no cabe: desktop expande el menú; tablet lo abre sobre el contenido.
      if (this.layout() === 'desktop') this.togglePref(); else this.open();
      this.expanded.update(s => new Set(s).add(it.id));
      return;
    }
    this.expanded.update(s => { const n = new Set(s); if (n.has(it.id)) n.delete(it.id); else n.add(it.id); return n; });
  }

  picked(id: string) {
    this.current.set(id);
    this.navigate.emit(id);
    if (this.overlayOpen()) this.close();
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && this.overlayOpen()) { e.preventDefault(); e.stopPropagation(); this.close(); }
  }

  onShortcut(e: KeyboardEvent) {
    if (e.key === 'Escape' && this.overlayOpen() && !e.defaultPrevented) { e.preventDefault(); this.close(); return; }
    if (!this.shortcut() || !(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'b' || e.altKey || e.shiftKey) return;
    e.preventDefault();
    this.toggle();
  }
}
