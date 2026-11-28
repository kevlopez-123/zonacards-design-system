import { ChangeDetectionStrategy, Component, ElementRef, TemplateRef, computed, inject, input, model, output, signal, viewChild } from '@angular/core';
import { ButtonDirective } from '@zonacards/ui/button';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { TooltipDirective } from '@zonacards/ui/tooltip';
import { injectTranslate } from '@zonacards/ui/core';
import { ScrollAreaDirective } from '@zonacards/ui/core';
import { Panel } from '@zonacards/ui/panel';

export type ZcNotificationKind = 'apr' | 'alr' | 'otro';
export interface ZcNotification {
  id: string;
  icon: IconName;
  title: string;
  /** Origen y hora relativa ("Aprobaciones · hace 5 min"). */
  meta: string;
  kind: ZcNotificationKind;
  unread: boolean;
  /** Grupo de fecha ("Hoy", "Anteriores"). */
  group: string;
}

/**
 * Campana de la barra superior con su panel (Notificaciones de index.html): contador de no leídas, "Marcar todo como leído",
 * pestañas Todas / Aprobaciones / Alertas, grupos por fecha y "Ver todas". Popover en desktop y bottom sheet en móvil.
 * Abrir una notificación la marca como leída y emite (open) para navegar.
 */
@Component({
  selector: 'zc-notifications',
  imports: [ScrollAreaDirective, ButtonDirective, IconComponent, TooltipDirective],
  providers: [Panel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex', '[attr.title]': 'null' },
  template: `
    <button #bell zcButton variant="ghost" size="icon" class="relative" aria-haspopup="dialog" [attr.aria-expanded]="panel.isOpen()"
      [attr.aria-label]="t('top.notif.boton', { n: unread() })" [zcTooltip]="t('top.notif.titulo')" (click)="toggle()">
      <zc-icon name="s:bell" />
      @if (unread()) {
        <span class="num absolute top-1 right-0.5 inline-grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-tiny font-semibold leading-none text-white dark:text-black" aria-hidden="true">{{ unread() }}</span>
      }
    </button>
    <ng-template #tpl>
      @let pop = panel.mode() === 'popover';
      <div class="grid grid-cols-[minmax(0,1fr)]" [class.-m-2]="pop">
        <div class="flex items-center gap-2 py-2" [class]="pop ? 'pr-3 pl-4' : 'justify-end'">
          @if (pop) { <strong class="flex-1">{{ t('top.notif.titulo') }}</strong> }
          <button type="button" class="cursor-pointer text-caption text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-current disabled:cursor-not-allowed disabled:text-subtle disabled:no-underline"
            [disabled]="!unread()" (click)="markAll()">{{ t('top.notif.marcarTodo') }}</button>
        </div>
        <div class="pb-2" [class.px-3]="pop">
          <div role="tablist" [attr.aria-label]="t('top.notif.tipo')" class="inline-flex max-w-full gap-1 rounded-full bg-surface-2 p-1" (keydown)="tabKey($event)">
            @for (f of filters; track f) {
              <button type="button" role="tab" [attr.aria-selected]="filter() === f" [tabIndex]="filter() === f ? 0 : -1" (click)="filter.set(f)" [attr.data-autofocus]="filter() === f ? '' : null"
                class="inline-flex h-[calc(var(--target-sm)-8px)] cursor-pointer items-center rounded-full px-3 text-caption text-muted aria-selected:bg-surface aria-selected:font-medium aria-selected:text-fg aria-selected:shadow-xs">{{ t('top.notif.filtro.' + f) }}</button>
            }
          </div>
        </div>
        <div role="tabpanel" zcScrollArea [attr.aria-label]="t('top.notif.filtro.' + filter())" class="border-t border-border" [class]="pop ? 'max-h-[360px] overflow-y-auto' : ''">
          @for (g of grouped(); track g.group) {
            <div class="sticky top-0 bg-surface pt-2 pb-1 text-xs text-muted" [class.px-4]="pop">{{ g.group }}</div>
            @for (n of g.items; track n.id) {
              <button type="button" class="flex w-full cursor-pointer items-start gap-3 border-b border-border py-3 text-left hover:bg-(--state-hover-bg)" [class.px-4]="pop" (click)="openItem(n)">
                <span class="grid size-9 shrink-0 place-items-center rounded-ms bg-surface-2"><zc-icon [name]="n.icon" [size]="16" /></span>
                <span class="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)] gap-0.5">
                  <span class="text-sm leading-5" [class.font-semibold]="n.unread">{{ n.title }}</span>
                  <span class="text-caption leading-4.5 text-muted">{{ n.meta }}</span>
                </span>
                @if (n.unread) { <span class="mt-1.5 size-2 shrink-0 rounded-full bg-danger" role="img" [attr.aria-label]="t('top.notif.sinLeer')"></span> }
              </button>
            }
          } @empty {
            <div class="grid justify-items-center gap-1 px-4 py-8 text-center">
              <zc-icon name="s:inbox" [size]="24" class="text-muted" />
              <strong class="text-body">{{ t('top.notif.vacio') }}</strong>
              <span class="text-sm text-muted">{{ t('top.notif.vacioTexto') }}</span>
            </div>
          }
        </div>
        <div class="border-t border-border py-2" [class.px-3]="pop"><button zcButton variant="ghost" size="sm" [block]="true" (click)="seeAll.emit(); panel.close()">{{ t('top.notif.verTodas') }}</button></div>
      </div>
    </ng-template>`,
})
export class NotificationsComponent {
  readonly panel = inject(Panel);
  readonly t = injectTranslate();
  readonly items = model<ZcNotification[]>([]);
  readonly open = output<ZcNotification>();
  readonly seeAll = output<void>();
  readonly filters = ['all', 'apr', 'alr'] as const;
  readonly filter = signal<'all' | 'apr' | 'alr'>('all');
  private readonly bell = viewChild.required<ElementRef<HTMLElement>>('bell');
  private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
  readonly unread = computed(() => this.items().filter(n => n.unread).length);
  readonly grouped = computed(() => {
    const f = this.filter(); const list = this.items().filter(n => f === 'all' || n.kind === f);
    const groups: { group: string; items: ZcNotification[] }[] = [];
    for (const n of list) { const g = groups.find(x => x.group === n.group); if (g) g.items.push(n); else groups.push({ group: n.group, items: [n] }); }
    return groups;
  });

  toggle() {
    if (this.panel.isOpen()) { this.panel.close(); return; }
    this.panel.open(this.tpl(), { title: this.t('top.notif.titulo'), ariaLabel: this.t('top.notif.titulo'), role: 'dialog', origin: this.bell().nativeElement, width: 380, align: 'end', trap: true });
  }
  markAll() { this.items.update(l => l.map(n => ({ ...n, unread: false }))); }
  openItem(n: ZcNotification) {
    this.items.update(l => l.map(x => (x.id === n.id ? { ...x, unread: false } : x)));
    this.panel.close(); this.open.emit(n);
  }
  tabKey(e: KeyboardEvent) {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
    e.preventDefault();
    const i = (this.filters.indexOf(this.filter()) + d + this.filters.length) % this.filters.length;
    this.filter.set(this.filters[i]);
    (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role=tab]')[i]?.focus();
  }
}
