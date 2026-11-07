import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { InputGroupComponent } from '@zonacards/ui/input-group';
import { FieldComponent, InputDirective } from '@zonacards/ui/field';
import { OverlayComponent } from '@zonacards/ui/overlay';
import { CATALOG, PortStatus } from './ds/catalog-index';

const STATUS: Record<PortStatus, { icon: IconName; cls: string; label: string }> = {
  hecho: { icon: 's:check-circle', cls: 'text-success', label: 'Portado' },
  parcial: { icon: 's:clock-circle', cls: 'text-warning', label: 'Parcial' },
  pendiente: { icon: 's:hourglass', cls: 'text-subtle', label: 'Pendiente' },
};
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Catálogo del design system: índice con los mismos niveles, grupos y secciones que docs/design-system/index.html
 * (lateral desde 1536 px; en pantallas menores, botón "Índice" que abre un drawer) y una página por nivel.
 */
@Component({
  selector: 'zc-catalogo-layout',
  imports: [NgTemplateOutlet, RouterOutlet, RouterLink, RouterLinkActive, ButtonDirective, IconComponent, FieldComponent, InputDirective, InputGroupComponent, OverlayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-[minmax(0,1fr)] gap-6 2xl:grid-cols-[248px_minmax(0,1fr)] 2xl:gap-8">
      <aside class="hidden 2xl:block" aria-label="Índice del design system">
        <div class="sticky top-[calc(var(--topbar-h)+24px)] grid max-h-[calc(100dvh-var(--topbar-h)-48px)] grid-rows-[auto_minmax(0,1fr)] gap-3">
          <ng-container [ngTemplateOutlet]="search" />
          <nav class="sb-hover overflow-y-auto pr-1" aria-label="Secciones"><ng-container [ngTemplateOutlet]="tree" /></nav>
        </div>
      </aside>
      <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="grid gap-0.5">
            <span class="text-[13px] font-semibold uppercase tracking-[.04em] text-muted">Design system · Angular</span>
            <span class="text-sm text-muted num">{{ done() }} de {{ total }} secciones portadas · {{ partial() }} parciales</span>
          </div>
          <button zcButton variant="outline" size="sm" class="2xl:hidden" (click)="drawer.set(true)"><zc-icon name="s:hamburger-menu" [size]="16" />Índice</button>
        </div>
        <router-outlet />
      </div>
    </div>

    <zc-drawer title="Índice del design system" [subtitle]="done() + ' de ' + total + ' secciones portadas'" [(open)]="drawer">
      <div class="grid grid-cols-[minmax(0,1fr)] gap-3">
        <ng-container [ngTemplateOutlet]="search" />
        <nav aria-label="Secciones"><ng-container [ngTemplateOutlet]="tree" /></nav>
      </div>
    </zc-drawer>

    <ng-template #search>
      <zc-field label="Buscar sección">
        <zc-input-group prefixIcon="s:magnifier"><input zcInput type="search" placeholder="Ej. Select, Tabla, Logos" [value]="q()" (input)="q.set($any($event.target).value)" /></zc-input-group>
      </zc-field>
    </ng-template>

    <ng-template #tree>
      <ul class="m-0 grid list-none gap-4 p-0">
        @for (l of filtered(); track l.id) {
          <li class="grid gap-1.5">
            <a [routerLink]="[l.route]" routerLinkActive ariaCurrentWhenActive="page" class="text-[15px] font-semibold text-muted hover:text-fg aria-[current=page]:text-fg" (click)="drawer.set(false)">{{ l.title }}</a>
            @for (g of l.groups; track g.title) {
              <span class="mt-1 text-[11.5px] font-semibold uppercase tracking-[.04em] text-subtle">{{ g.title }}</span>
              <ul class="m-0 grid list-none gap-0.5 p-0">
                @for (s of g.sections; track s.id) {
                  <li>
                    <a [routerLink]="[l.route]" [fragment]="s.id" (click)="drawer.set(false)"
                      class="flex min-h-9 items-center gap-2 rounded-sm px-2 text-sm text-muted hover:bg-surface-2 hover:text-fg">
                      <zc-icon [name]="status[s.status].icon" [size]="16" class="shrink-0" [class]="status[s.status].cls" />
                      <span class="min-w-0 flex-1">{{ s.title }}</span><span class="sr-only">({{ status[s.status].label }})</span>
                    </a>
                  </li>
                }
              </ul>
            }
          </li>
        } @empty {
          <li class="text-sm text-muted">Sin secciones para "{{ q() }}".</li>
        }
      </ul>
    </ng-template>`,
})
export class CatalogoLayout {
  readonly status = STATUS;
  readonly drawer = signal(false);
  readonly q = signal('');
  private readonly all = CATALOG.flatMap(l => l.groups.flatMap(g => g.sections));
  readonly total = this.all.length;
  readonly done = computed(() => this.all.filter(s => s.status === 'hecho').length);
  readonly partial = computed(() => this.all.filter(s => s.status === 'parcial').length);
  readonly filtered = computed(() => {
    const q = norm(this.q().trim());
    if (!q) return CATALOG;
    return CATALOG.map(l => ({ ...l, groups: l.groups.map(g => ({ ...g, sections: g.sections.filter(s => norm(s.title).includes(q) || s.id.includes(q)) })).filter(g => g.sections.length) }))
      .filter(l => l.groups.length);
  });
}
