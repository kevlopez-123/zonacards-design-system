import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Injector, TemplateRef, ViewContainerRef, afterNextRender, computed, effect,
  forwardRef, inject, input, model, output, signal, untracked, viewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '@zonacards/ui/icon';
import { PanelComponent, PanelData, SUBSCREEN_HOST, SubscreenHost } from '@zonacards/ui/panel';
import { drawerOut, modalOut, restoreFocus as focusBack, ScrollAreaDirective, sheetOut, Viewport } from '@zonacards/ui/core';

export type OverlayMode = 'modal' | 'drawer' | 'sheet';

let seq = 0;
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * <zc-modal> y <zc-drawer> · un solo componente sobre CDK Overlay (el tipo sale de la etiqueta).
 * - Modal: confirmaciones y formularios de 1 a 3 campos. Drawer: detalle, filtros; encabezado con título, subtítulo,
 *   metadatos ([zcOverlayMeta]) y cerrar; pie fijo con acciones ([zcOverlayFooter]).
 * - Móvil (menos de 768 px o táctil): bottom sheet con asa, título, X y pie de dos botones iguales. Deslizar hacia abajo cierra.
 * - Atrapa el foco; Escape cierra la capa superior y el foco vuelve al disparador. Abre con [(open)].
 * - Provee SUBSCREEN_HOST: un select, calendario o menú dentro se abre como subpantalla con Volver en móvil
 *   (nunca un sheet sobre otro); en desktop, como popover por encima.
 */
@Component({
  selector: 'zc-modal, zc-drawer',
  imports: [IconComponent, PanelComponent, TranslocoPipe, ScrollAreaDirective],
  providers: [{ provide: SUBSCREEN_HOST, useExisting: forwardRef(() => OverlayComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'hidden' },
  template: `
    <ng-template #tpl>
      <div #frame [attr.role]="dialogRole()" aria-modal="true" [attr.aria-labelledby]="titleId" [attr.aria-describedby]="subtitle() ? subId : null"
        [class]="frameClass()" [style.transform]="dragY() ? 'translateY(' + dragY() + 'px)' : null" (keydown)="onKey($event)">
        @if (mode() === 'sheet') {
          <span class="mx-auto mt-3 block h-[5px] w-10 shrink-0 cursor-grab touch-none rounded-full bg-border-strong" aria-hidden="true" (pointerdown)="dragStart($event)"></span>
        }
        <div [class]="headClass()" [attr.inert]="sub() ? '' : null" (pointerdown)="mode() === 'sheet' && dragStart($event)">
          <div class="grid grid-cols-[minmax(0,1fr)] min-w-0 flex-1 gap-1 pt-1.5">
            <h2 [id]="titleId" class="break-words text-[19px] font-semibold leading-[26px]">{{ title() }}</h2>
            @if (subtitle()) { <p [id]="subId" class="text-sm leading-5 text-muted">{{ subtitle() }}</p> }
            <div class="mt-1.5 flex flex-wrap gap-1.5 empty:hidden"><ng-content select="[zcOverlayMeta]" /></div>
          </div>
          @if (closable()) {
            <button type="button" class="grid size-icon-btn shrink-0 cursor-pointer place-items-center rounded-full hover:bg-surface-2"
              [attr.aria-label]="'ui.cerrar' | transloco" (click)="close()"><zc-icon name="l:x" /></button>
          }
        </div>
        <div zcScrollArea [zcScrollAreaFocusable]="false" [class]="bodyClass()" [attr.inert]="sub() ? '' : null"><ng-content /></div>
        <div [class]="footClass()" [attr.inert]="sub() ? '' : null"><ng-content select="[zcOverlayFooter]" /></div>
        @if (sub(); as s) { <zc-panel class="absolute inset-0 z-10" [subData]="s" /> }
      </div>
    </ng-template>`,
})
export class OverlayComponent implements SubscreenHost {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  /** Ancho del modal en desktop: md 520 px (por defecto), lg 760 px (imagen, vista previa). */
  readonly size = input<'md' | 'lg'>('md');
  /** alertdialog para confirmaciones (zc-alert-dialog). No se llama role: un atributo estático quedaría también en el host oculto. */
  readonly dialogRole = input<'dialog' | 'alertdialog'>('dialog');
  /** Botón X en el encabezado. */
  readonly closable = input(true);
  /** Tocar el scrim cierra (en un alert dialog no: la decisión se toma con sus botones). */
  readonly dismissible = input(true);
  /** Mientras hay una acción en curso no se cierra (evita perder el resultado o enviar dos veces). */
  readonly busy = input(false);
  readonly open = model(false);
  readonly closed = output<void>();

  private readonly overlay = inject(Overlay);
  private readonly vcr = inject(ViewContainerRef);
  private readonly injector = inject(Injector);
  private readonly viewport = inject(Viewport);
  private readonly trapFactory = inject(FocusTrapFactory);
  private readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');
  private readonly frame = viewChild<ElementRef<HTMLElement>>('frame');
  readonly kind: 'modal' | 'drawer' = inject(ElementRef).nativeElement.tagName === 'ZC-DRAWER' ? 'drawer' : 'modal';

  readonly titleId = `zc-ov-${++seq}`;
  readonly subId = `${this.titleId}-s`;
  readonly mode = signal<OverlayMode>(this.kind);
  readonly sub = signal<PanelData | null>(null);
  readonly dragY = signal(0);
  /** Para plantillas que se dibujan dentro (barra de filtros): sus campos abren subpantallas aquí. */
  readonly childInjector = Injector.create({ providers: [{ provide: SUBSCREEN_HOST, useValue: this }], parent: this.injector });

  private ref?: OverlayRef;
  private trap?: FocusTrap;
  private returnTo: HTMLElement | null = null;

  readonly frameClass = computed(() => {
    const base = 'relative flex flex-col overflow-hidden bg-surface text-fg shadow-2 outline-none ';
    switch (this.mode()) {
      case 'sheet': return base + 'max-h-[90dvh] w-screen rounded-t-lg animate-in slide-in-from-bottom-full duration-(--dur-slow) ease-enter motion-reduce:animate-none md:w-sheet';
      case 'drawer': return base + 'h-dvh w-[min(var(--drawer-w),100vw)] animate-in slide-in-from-right-full duration-(--dur-slow) ease-enter motion-reduce:animate-none';
      default: return base + 'max-h-[calc(100dvh-48px)] rounded-lg animate-in fade-in-0 zoom-in-95 duration-(--dur-base) ease-enter motion-reduce:animate-none '
        + (this.size() === 'lg' ? 'w-[min(var(--modal-w-lg),calc(100vw-32px))]' : 'w-[min(var(--modal-w),calc(100vw-32px))]');
    }
  });
  readonly headClass = computed(() => 'flex shrink-0 items-start gap-3 pr-4 pl-6 max-md:pl-4 '
    + (this.mode() === 'modal' ? 'pt-5' : this.mode() === 'sheet' ? 'touch-none border-b border-border pt-2 pb-3' : 'border-b border-border pt-4 pb-3'));
  readonly bodyClass = computed(() => 'grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] content-start gap-4 overflow-y-auto px-6 py-5 max-md:px-4');
  /** El pie se proyecta en un contenedor (<div zcOverlayFooter>): se aplana para que sus botones midan lo mismo. */
  readonly footClass = computed(() => 'flex shrink-0 gap-3 px-6 pt-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] empty:hidden max-md:px-4 [&>*]:contents [&>*>*]:min-w-0 [&>*>*]:flex-1 '
    + (this.mode() === 'modal' ? 'pb-5 sm:justify-end sm:[&>*>*]:flex-none' : 'border-t border-border'));

  constructor() {
    effect(() => {
      const open = this.open();
      const mode: OverlayMode = this.viewport.mobile() ? 'sheet' : this.kind;
      untracked(() => {
        if (!open) { this.detach(true, true); return; }
        if (this.ref && mode === this.mode()) return;
        // Al cruzar el breakpoint con el overlay abierto se vuelve a montar en el patrón que corresponde.
        if (this.ref) this.detach(false);
        this.attach(mode);
      });
    });
    // Si la app destruye el overlay abierto (@if alrededor de <zc-alert-dialog> que se apaga al cerrar), el foco estaba dentro y se
    // perdería en el <body>: se devuelve igual. Si el foco ya está en otro lugar (navegación), no se toca.
    inject(DestroyRef).onDestroy(() => {
      const active = document.activeElement;
      const inside = !!this.ref && (!active || active === document.body || !!this.ref.overlayElement.contains(active));
      this.detach(inside);
    });
  }

  close() {
    if (this.busy() || !this.open()) return;
    this.open.set(false);
    this.closed.emit();
  }

  show(d: PanelData) { this.sub.set(d); }
  hide(d: PanelData) { if (this.sub() === d) this.sub.set(null); }

  onKey(e: KeyboardEvent) {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    e.preventDefault(); e.stopPropagation();
    this.close();
  }

  /** Bottom sheet: deslizar hacia abajo desde el asa o el encabezado cierra (más de 80 px). */
  dragStart(e: PointerEvent) {
    if ((e.target as HTMLElement).closest('button')) return;
    const y0 = e.clientY;
    const move = (ev: PointerEvent) => this.dragY.set(Math.max(0, ev.clientY - y0));
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
      const far = this.dragY() > 80; this.dragY.set(0);
      if (far) this.close();
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  }

  private attach(mode: OverlayMode) {
    this.mode.set(mode);
    if (!this.returnTo) this.returnTo = document.activeElement as HTMLElement | null;
    const pos = this.overlay.position().global();
    if (mode === 'drawer') pos.right('0').top('0');
    else if (mode === 'sheet') pos.bottom('0').centerHorizontally();
    else pos.centerHorizontally().centerVertically();
    const ref = (this.ref = this.overlay.create({
      positionStrategy: pos, hasBackdrop: true, backdropClass: 'zc-backdrop', scrollStrategy: this.overlay.scrollStrategies.block(),
    }));
    ref.attach(new TemplatePortal(this.tpl(), this.vcr));
    ref.backdropClick().subscribe(() => { if (this.dismissible()) this.close(); });
    afterNextRender({
      write: () => {
        const el = this.frame()?.nativeElement;
        if (!el) return;
        this.trap = this.trapFactory.create(el);
        // Primero el elemento marcado; si no, el primer control del cuerpo; si no, el primero enfocable (la X).
        const target = el.querySelector<HTMLElement>('[data-autofocus]') ?? el.children[mode === 'sheet' ? 2 : 1]?.querySelector<HTMLElement>(FOCUSABLE)
          ?? el.querySelector<HTMLElement>(FOCUSABLE) ?? el;
        if (target === el) el.tabIndex = -1;
        target.focus({ preventScroll: true });
      },
    }, { injector: this.injector });
  }

  /** animate: sale con su animación (sheet baja, drawer sale por la derecha, modal se desvanece); al destruir o cambiar de patrón, de inmediato. */
  private detach(restoreFocus: boolean, animate = false) {
    this.sub.set(null);
    this.trap?.destroy(); this.trap = undefined;
    if (!this.ref) return;
    const ref = this.ref; this.ref = undefined;
    const frame = this.frame()?.nativeElement, done = () => ref.dispose();
    if (!animate) done();
    else if (this.mode() === 'sheet') sheetOut(frame, ref.backdropElement, done);
    else if (this.mode() === 'drawer') drawerOut(frame, ref.backdropElement, done);
    else modalOut(frame, ref.backdropElement, done);
    if (restoreFocus) {
      const t = this.returnTo; this.returnTo = null;
      // Si quien lo abrió ya no existe (ítem de un zc-menu), vuelve al disparador del menú.
      focusBack(t);
    }
  }
}
