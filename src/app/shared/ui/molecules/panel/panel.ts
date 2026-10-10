import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, Injectable, InjectionToken, Injector,
  signal, TemplateRef, computed, input,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '../../atoms/icon/icon.component';
import { Viewport } from '../../viewport';

/**
 * Panel flotante de las moléculas (select, combobox, calendario, hora, periodo).
 * - Desktop: popover anclado al campo, por encima de cualquier overlay.
 * - Móvil: bottom sheet con título y cerrar.
 * - Móvil dentro de un sheet o drawer: subpantalla del mismo contenedor con Volver (nunca un sheet sobre otro).
 * Escape o Volver cierran solo la capa superior y el foco vuelve al disparador.
 */
export type PanelMode = 'popover' | 'sheet' | 'subscreen';

export interface PanelOptions {
  /** Título del sheet o de la subpantalla (la etiqueta del campo). */
  title: string;
  /** Elemento al que se ancla el popover. */
  origin: HTMLElement;
  /** Dónde vuelve el foco al cerrar (por defecto, origin). */
  returnFocus?: HTMLElement;
  role?: 'dialog' | null;
  ariaLabel?: string;
  /** Ancho del popover: el del campo o un valor fijo (se limita al viewport). */
  width?: 'origin' | number;
  minWidth?: number;
  align?: 'start' | 'end';
  /** 'popover' mantiene la lista bajo el campo también en móvil (autocomplete). */
  mobile?: 'sheet' | 'popover';
  /** Atrapa el foco dentro del panel (multiselección, calendario, periodo). Sheets y subpantallas siempre lo atrapan. */
  trap?: boolean;
  /** Tab cierra el panel y devuelve el foco (listas de una sola selección). */
  closeOnTab?: boolean;
  /** El panel no toma el foco (autocomplete: el foco queda en el input). */
  keepFocus?: boolean;
  /** Fuerza el modo (catálogo: demostrar un bottom sheet en desktop). */
  forceMode?: PanelMode;
  onClose?: () => void;
}

export interface PanelData { tpl: TemplateRef<unknown>; opts: PanelOptions; mode: PanelMode; close: (restoreFocus?: boolean) => void; }

/** Contenedor (sheet, drawer) que muestra los paneles de sus campos como subpantalla en móvil. */
export interface SubscreenHost { show(data: PanelData): void; hide(data: PanelData): void; }
export const SUBSCREEN_HOST = new InjectionToken<SubscreenHost>('SUBSCREEN_HOST');
const PANEL_DATA = new InjectionToken<PanelData>('PANEL_DATA');

const POSITIONS: Record<'start' | 'end', ConnectedPosition[]> = {
  start: [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
  ],
  end: [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6 },
  ],
};

/** Una instancia por molécula: `providers: [Panel]`. */
@Injectable()
export class Panel {
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);
  private readonly viewport = inject(Viewport);
  private readonly host = inject(SUBSCREEN_HOST, { optional: true });
  readonly isOpen = signal(false);
  readonly mode = signal<PanelMode>('popover');
  private ref?: OverlayRef;
  private data?: PanelData;

  constructor() { inject(DestroyRef).onDestroy(() => this.close(false)); }

  open(tpl: TemplateRef<unknown>, opts: PanelOptions) {
    if (this.isOpen()) return;
    const mobile = this.viewport.mobile() && opts.mobile !== 'popover';
    const mode: PanelMode = opts.forceMode ?? (mobile ? (this.host ? 'subscreen' : 'sheet') : 'popover');
    this.mode.set(mode);
    this.data = { tpl, opts, mode, close: (f = true) => this.close(f) };
    this.isOpen.set(true);

    if (mode === 'subscreen' && this.host) { this.host.show(this.data); return; }

    const vw = window.innerWidth;
    const ref = (this.ref = mode === 'sheet'
      ? this.overlay.create({
          positionStrategy: this.overlay.position().global().bottom('0').left('0'),
          width: '100%', maxHeight: '88dvh', hasBackdrop: true, backdropClass: 'zc-backdrop',
          scrollStrategy: this.overlay.scrollStrategies.block(),
        })
      : this.overlay.create({
          positionStrategy: this.overlay.position().flexibleConnectedTo(opts.origin)
            .withPositions(POSITIONS[opts.align ?? 'start']).withPush(true).withViewportMargin(8).withFlexibleDimensions(false),
          scrollStrategy: this.overlay.scrollStrategies.reposition(),
          width: Math.min(vw - 16, opts.width === 'origin' || opts.width === undefined ? Math.max(opts.origin.offsetWidth, opts.minWidth ?? 220) : opts.width),
        }));
    const injector = Injector.create({ providers: [{ provide: PANEL_DATA, useValue: this.data }], parent: this.injector });
    ref.attach(new ComponentPortal(PanelComponent, null, injector));
    ref.backdropClick().subscribe(() => this.close());
    if (mode === 'popover') {
      ref.outsidePointerEvents().subscribe(e => {
        const t = e.target as Node;
        if (!opts.origin.contains(t) && !(opts.returnFocus?.contains(t))) this.close(false);
      });
    }
  }

  close(restoreFocus = true) {
    if (!this.isOpen()) return;
    const data = this.data!;
    this.isOpen.set(false);
    this.ref?.dispose(); this.ref = undefined;
    if (data.mode === 'subscreen') this.host?.hide(data);
    this.data = undefined;
    if (restoreFocus) {
      const target = data.opts.returnFocus ?? data.opts.origin;
      // En subpantalla, el disparador sigue inert hasta el próximo render: el foco se devuelve después.
      if (data.mode === 'subscreen') afterNextRender({ write: () => target.focus({ preventScroll: true }) }, { injector: this.injector });
      else target.focus({ preventScroll: true });
    }
    data.opts.onClose?.();
  }

  /** Recalcula la posición del popover (por ejemplo, al cambiar el alto del contenido). */
  reposition() { this.ref?.updatePosition(); }
}

let seq = 0;

@Component({
  selector: 'zc-panel',
  imports: [NgTemplateOutlet, IconComponent, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: SUBSCREEN_HOST, useExisting: PanelComponent }],
  host: {
    '[class]': 'hostClass()',
    '[attr.role]': "mode() === 'popover' ? (data().opts.role ?? null) : 'dialog'",
    '[attr.aria-modal]': "mode() === 'popover' ? null : 'true'",
    '[attr.aria-labelledby]': "mode() === 'popover' ? null : titleId",
    '[attr.aria-label]': "mode() === 'popover' ? (data().opts.ariaLabel ?? null) : null",
    '(keydown)': 'onKey($event)',
  },
  template: `
    @if (mode() === 'sheet') {
      <span class="mx-auto mb-3 block h-[5px] w-10 shrink-0 rounded-full bg-border-strong" aria-hidden="true"></span>
      <div class="flex shrink-0 items-center justify-between gap-2 pb-2" [attr.inert]="sub() ? '' : null">
        <strong [id]="titleId" class="min-w-0 text-[17px] font-semibold">{{ data().opts.title }}</strong>
        <button type="button" class="grid size-icon-btn shrink-0 cursor-pointer place-items-center rounded-full hover:bg-surface-2" [attr.aria-label]="'ui.cerrar' | transloco" (click)="data().close()"><zc-icon name="l:x" /></button>
      </div>
    } @else if (mode() === 'subscreen') {
      <div class="-mx-4 mb-3 flex min-h-[60px] shrink-0 items-center gap-2 border-b border-border px-3 py-2" [attr.inert]="sub() ? '' : null">
        <button type="button" class="grid size-icon-btn shrink-0 cursor-pointer place-items-center rounded-full hover:bg-surface-2" [attr.aria-label]="'ui.volver' | transloco" (click)="data().close()"><zc-icon name="s:alt-arrow-left" /></button>
        <strong [id]="titleId" class="min-w-0 text-[17px] font-semibold">{{ data().opts.title }}</strong>
      </div>
    }
    <div [class]="mode() === 'popover' ? 'contents' : 'grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] content-start overflow-y-auto'" [attr.inert]="sub() ? '' : null">
      <ng-container *ngTemplateOutlet="data().tpl; injector: childInjector" />
    </div>
    @if (sub(); as s) { <zc-panel class="absolute inset-0 z-10" [subData]="s" /> }`,
})
export class PanelComponent implements SubscreenHost {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injected = inject(PANEL_DATA, { optional: true });
  private readonly trapFactory = inject(FocusTrapFactory);
  /** Datos cuando este panel es una subpantalla dentro de otro. */
  readonly subData = input<PanelData | null>(null);
  readonly data = computed(() => (this.subData() ?? this.injected)!);
  readonly mode = computed(() => this.data().mode);
  readonly titleId = `zc-panel-${++seq}`;
  readonly sub = signal<PanelData | null>(null);
  /** Los campos dentro de este panel (sheet o subpantalla) abren sus listas aquí mismo en móvil. */
  readonly childInjector = Injector.create({ providers: [{ provide: SUBSCREEN_HOST, useValue: this }], parent: inject(Injector) });
  private trap?: FocusTrap;

  readonly hostClass = computed(() => {
    switch (this.mode()) {
      case 'sheet': return 'relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-lg bg-surface px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom,0px))] shadow-2 animate-in slide-in-from-bottom-6 fade-in-0 duration-200';
      case 'subscreen': return 'flex flex-col overflow-hidden bg-surface px-4 pb-4 animate-in slide-in-from-right-6 fade-in-0 duration-200';
      default: return 'block w-full rounded-md border border-border bg-surface p-2 text-fg shadow-2 animate-in fade-in-0 zoom-in-95 duration-150';
    }
  });

  constructor() {
    afterNextRender(() => {
      const o = this.data().opts;
      if (this.mode() !== 'popover' || o.trap) this.trap = this.trapFactory.create(this.el.nativeElement);
      if (o.keepFocus) return;
      const target = this.el.nativeElement.querySelector<HTMLElement>('[data-autofocus]')
        ?? this.el.nativeElement.querySelector<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])');
      target?.focus({ preventScroll: true });
    });
    inject(DestroyRef).onDestroy(() => this.trap?.destroy());
  }

  show(d: PanelData) { this.sub.set(d); }
  hide(d: PanelData) { if (this.sub() === d) this.sub.set(null); }

  onKey(e: KeyboardEvent) {
    if (e.defaultPrevented) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.data().close(); }
    else if (e.key === 'Tab' && this.mode() === 'popover' && this.data().opts.closeOnTab) { e.preventDefault(); this.data().close(); }
  }
}
