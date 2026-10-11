import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, model, output, signal } from '@angular/core';
import { IconComponent } from '@zonacards/ui/icon';
import { IconName } from '@zonacards/ui/icon';
import { SpinnerComponent } from '@zonacards/ui/spinner';
import { injectTranslate } from '@zonacards/ui/core';
import { MenuComponent, ZcMenuItem } from '@zonacards/ui/menu';

/**
 * Patrones de app móvil (o-mobile de index.html). Respetan áreas seguras (env(safe-area-inset-*)).
 * - <zc-mobile-bar title subtitle [back] (backClick)> con una acción a la derecha como máximo ([zcMobileAction]).
 * - <zc-bottom-nav [items] [(current)]>: 3 a 5 destinos con ícono y texto; el activo en Bold y color de marca.
 * - <zc-system-banner tone="offline|update">: banda bajo la barra superior.
 * - <zc-pull-refresh (refresh)>: deslizar hacia abajo para actualizar (además hay un botón Actualizar en la barra).
 * - <zc-swipe-item [actions] (action)>: deslizar a la izquierda muestra hasta 2 acciones; las mismas están en el menú ⋮.
 * - <zc-pin-pad [length]="4" (complete)>: teclas de 64 px, borrar y biometría.
 */
@Component({
  selector: 'zc-mobile-bar',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.title]': 'null', class: 'flex min-h-14 shrink-0 items-center gap-2 border-b border-border bg-surface px-3 pt-[env(safe-area-inset-top)]' },
  template: `
    @if (back()) {
      <button type="button" class="grid size-10 cursor-pointer place-items-center rounded-sm hover:bg-surface-2" [attr.aria-label]="t('mol.movil.volver')" (click)="backClick.emit()"><zc-icon name="s:alt-arrow-left" /></button>
    }
    <div class="grid min-w-0 flex-1 pl-1 leading-5"><strong class="text-[17px]">{{ title() }}</strong>@if (subtitle()) { <small class="break-words text-xs text-muted">{{ subtitle() }}</small> }</div>
    <ng-content select="[zcMobileAction]" />`,
})
export class MobileBarComponent {
  readonly t = injectTranslate();
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly back = input(false);
  readonly backClick = output<void>();
}

export interface ZcBottomNavItem { id: string; label: string; icon: IconName; iconActive?: IconName }

@Component({
  selector: 'zc-bottom-nav',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block shrink-0 border-t border-border bg-surface pb-[max(14px,env(safe-area-inset-bottom))]' },
  template: `
    <nav [attr.aria-label]="label()" class="grid" [style.grid-template-columns]="'repeat(' + items().length + ', minmax(0,1fr))'">
      @for (it of items(); track it.id) {
        <button type="button" class="grid min-h-14 cursor-pointer justify-items-center gap-0.5 pt-2 pb-1 text-[11.5px] text-muted aria-[current=page]:font-semibold aria-[current=page]:text-primary"
          [attr.aria-current]="current() === it.id ? 'page' : null" (click)="current.set(it.id)">
          <zc-icon [name]="current() === it.id ? (it.iconActive ?? it.icon) : it.icon" />{{ it.label }}
        </button>
      }
    </nav>`,
})
export class BottomNavComponent {
  readonly items = input.required<readonly ZcBottomNavItem[]>();
  readonly label = input.required<string>();
  readonly current = model<string | null>(null);
}

@Component({
  selector: 'zc-system-banner',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status', '[class]': "'flex shrink-0 items-center gap-2 px-4 py-2 text-[13px] ' + (tone() === 'offline' ? 'bg-fg text-surface' : 'bg-info-bg text-info')" },
  template: `<zc-icon [name]="tone() === 'offline' ? 'l:wifi-off' : 'l:rotate-cw'" [size]="16" /><span class="min-w-0 flex-1 break-words"><ng-content /></span><ng-content select="[zcBannerAction]" />`,
})
export class SystemBannerComponent { readonly tone = input<'offline' | 'update'>('offline'); }

@Component({
  selector: 'zc-pull-refresh',
  imports: [SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block', '(pointerdown)': 'down($event)', '(pointermove)': 'move($event)', '(pointerup)': 'up()', '(pointercancel)': 'up()' },
  template: `
    <div class="grid place-items-center overflow-hidden transition-[height] duration-200" [style.height.px]="busy() ? 48 : pull()" [style.opacity]="busy() ? 1 : pull() / 70" aria-hidden="true"><zc-spinner [size]="20" /></div>
    <ng-content />`,
})
export class PullRefreshComponent {
  /** La página actualiza y llama a done() (o pone [busy] en false). */
  readonly refresh = output<void>();
  readonly busy = model(false);
  readonly pull = signal(0);
  private y0: number | null = null;
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  down(e: PointerEvent) { if (this.busy() || (e.target as HTMLElement).closest('[data-swipe]') || this.el.parentElement?.scrollTop) return; this.y0 = e.clientY; }
  move(e: PointerEvent) { if (this.y0 === null) return; this.pull.set(Math.max(0, Math.min(90, e.clientY - this.y0))); }
  up() { if (this.y0 === null) return; this.y0 = null; if (this.pull() > 60) { this.busy.set(true); this.refresh.emit(); } this.pull.set(0); }
}

export interface ZcSwipeAction { id: string; label: string; icon: IconName; tone: 'info' | 'danger' }

@Component({
  selector: 'zc-swipe-item',
  imports: [IconComponent, MenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block overflow-hidden rounded-md bg-surface-2', 'data-swipe': '' },
  template: `
    <div class="absolute inset-y-0 right-0 grid w-[152px] grid-cols-2" [attr.aria-hidden]="!open()">
      @for (a of actions(); track a.id) {
        <button type="button" [tabindex]="open() ? 0 : -1" class="grid cursor-pointer content-center justify-items-center gap-0.5 text-xs text-surface" [class]="a.tone === 'danger' ? 'bg-danger' : 'bg-info'" (click)="pick(a)">
          <zc-icon [name]="a.icon" />{{ a.label }}
        </button>
      }
    </div>
    <div class="relative flex touch-pan-y items-center gap-3 rounded-md border border-border bg-surface py-2.5 pr-1 pl-3 transition-transform duration-200"
      [style.transform]="'translateX(' + offset() + 'px)'" [class.transition-none]="dragging()"
      (pointerdown)="down($event)" (pointermove)="move($event)" (pointerup)="up()" (pointercancel)="up()">
      <ng-content />
      <zc-menu [label]="menuLabel()" [items]="menuItems()" [dense]="true" (select)="onMenu($event)" />
    </div>`,
})
export class SwipeItemComponent {
  readonly actions = input.required<readonly ZcSwipeAction[]>();
  readonly menuLabel = input.required<string>();
  readonly action = output<string>();
  readonly open = signal(false);
  readonly dragging = signal(false);
  readonly dx = signal(0);
  readonly offset = computed(() => (this.dragging() ? this.dx() : this.open() ? -152 : 0));
  readonly menuItems = computed<ZcMenuItem[]>(() => this.actions().map(a => ({ id: a.id, label: a.label, icon: a.icon, danger: a.tone === 'danger' })));
  private x0: number | null = null;
  down(e: PointerEvent) { if ((e.target as HTMLElement).closest('button, zc-menu')) return; this.x0 = e.clientX; this.dx.set(this.open() ? -152 : 0); }
  move(e: PointerEvent) {
    if (this.x0 === null) return;
    const d = Math.min(0, Math.max(-152, e.clientX - this.x0 + (this.open() ? -152 : 0)));
    if (Math.abs(d - (this.open() ? -152 : 0)) > 6) { this.dragging.set(true); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }
    this.dx.set(d);
  }
  up() { if (this.x0 === null) return; this.x0 = null; if (this.dragging()) this.open.set(this.dx() < -70); this.dragging.set(false); }
  pick(a: ZcSwipeAction) { this.open.set(false); this.action.emit(a.id); }
  onMenu(it: ZcMenuItem) { this.action.emit(it.id); }
}

@Component({
  selector: 'zc-pin-pad',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid justify-items-center gap-3 text-center' },
  template: `
    <div class="my-2 flex gap-4" role="img" [attr.aria-label]="t('mol.pin.progreso', { n: value().length, total: length() })" [class.animate-shake]="shake()" (animationend)="shake.set(false)">
      @for (i of slots(); track i) { <i class="size-4 rounded-full border-2" [class]="i < value().length ? 'border-fg bg-fg' : 'border-muted'"></i> }
    </div>
    @if (error()) { <p class="flex items-center gap-1 text-[13px] text-danger" role="alert"><zc-icon name="s:danger-circle" [size]="16" />{{ error() }}</p> }
    <div class="grid grid-cols-[repeat(3,72px)] gap-3" role="group" [attr.aria-label]="t('mol.pin.teclado')">
      @for (k of keys; track k) {
        @if (k === 'bio') {
          <button type="button" [class]="key + ' bg-transparent'" [attr.aria-label]="t('mol.pin.biometria')" (click)="biometric.emit()"><zc-icon name="l:key-round" [size]="24" /></button>
        } @else if (k === 'del') {
          <button type="button" [class]="key + ' bg-transparent'" [attr.aria-label]="t('mol.pin.borrar')" (click)="del()"><zc-icon name="l:arrow-left" [size]="24" /></button>
        } @else {
          <button type="button" [class]="key + ' bg-surface-2'" (click)="press(k)">{{ k }}</button>
        }
      }
    </div>`,
})
export class PinPadComponent {
  readonly t = injectTranslate();
  private readonly live = inject(LiveAnnouncer);
  readonly length = input(4);
  readonly error = input<string | null>(null);
  readonly value = model('');
  readonly complete = output<string>();
  readonly biometric = output<void>();
  readonly shake = signal(false);
  readonly keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'del'];
  readonly key = 'grid h-16 w-[72px] cursor-pointer place-items-center rounded-[20px] text-2xl font-medium num';
  readonly slots = computed(() => Array.from({ length: this.length() }, (_, i) => i));
  private vib(p: number | number[]) { try { navigator.vibrate?.(p); } catch { /* sin vibración */ } }
  press(k: string) {
    if (this.value().length >= this.length()) return;
    this.vib(10);
    this.value.update(v => v + k);
    this.live.announce(this.t('mol.pin.progreso', { n: this.value().length, total: this.length() }));
    if (this.value().length === this.length()) this.complete.emit(this.value());
  }
  del() { this.value.update(v => v.slice(0, -1)); }
  /** La página llama a reject() si el PIN es incorrecto: vibra, tiembla y se limpia. */
  reject() { this.vib([60, 40, 60]); this.shake.set(true); this.value.set(''); }
}

export const MOBILE = [MobileBarComponent, BottomNavComponent, SystemBannerComponent, PullRefreshComponent, SwipeItemComponent, PinPadComponent] as const;
