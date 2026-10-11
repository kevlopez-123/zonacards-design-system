import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Directive, ElementRef, Injector, afterNextRender, computed, effect, inject, input, model, signal } from '@angular/core';
import { injectTranslate } from '../../lang';

/**
 * Reordenar con drag & drop (o-sortable de index.html), sobre signals y sin librerías:
 *
 *   <ol [(zcSortable)]="cats" [zcSortableLabel]="labelOf" #s="zcSortable">
 *     @for (c of cats(); track c.id) {
 *       <li [zcSortableItem]="c"><button zcSortableHandle [item]="c">…grip…</button> …</li>
 *     }
 *   </ol>
 *
 * - Mouse y táctil: se arrastra desde el asa (copia flotante que sigue al puntero; el original queda punteado).
 * - Teclado en el asa: Espacio o Enter toma y suelta, flechas mueven, Escape cancela. Cada paso se anuncia (LiveAnnouncer).
 * - [zcSortableGrid]: cuadrícula (posición por celda; flechas izquierda/derecha y arriba/abajo).
 * - s.move(item, to) para "Subir", "Bajar", "Mover al inicio/final" desde un menú (alternativa a arrastrar).
 * Kanban y listas conectadas: varios zcSortable comparten [zcSortableGroup] y emiten (zcSortableTransfer) — ver kanban.
 */
@Directive({ selector: '[zcSortable]', exportAs: 'zcSortable' })
export class SortableDirective<T = unknown> {
  readonly items = model.required<T[]>({ alias: 'zcSortable' });
  readonly grid = input(false, { alias: 'zcSortableGrid' });
  readonly labelOf = input<(it: T) => string>(it => String(it), { alias: 'zcSortableLabel' });

  readonly dragging = signal<T | null>(null);
  readonly grabbed = signal<T | null>(null);
  private readonly els = new Map<T, HTMLElement>();
  private readonly handles = new Map<T, HTMLElement>();
  private readonly t = injectTranslate();
  private readonly live = inject(LiveAnnouncer);
  private readonly injector = inject(Injector);
  private from = -1;

  register(it: T, el: HTMLElement) { this.els.set(it, el); }
  unregister(it: T) { this.els.delete(it); this.handles.delete(it); }
  registerHandle(it: T, el: HTMLElement) { this.handles.set(it, el); }

  /** Mueve a la posición `to` (0 = inicio) y lo anuncia. */
  move(it: T, to: number, verb: 'movido' | 'soltado' = 'movido') {
    const a = [...this.items()]; const i = a.indexOf(it);
    to = Math.max(0, Math.min(a.length - 1, to));
    if (i < 0 || i === to) return;
    a.splice(i, 1); a.splice(to, 0, it);
    this.items.set(a);
    this.say(verb, it);
  }

  // ---- Puntero ----
  startDrag(it: T, e: PointerEvent, handle: HTMLElement) {
    if (e.button > 0) return;
    const el = this.els.get(it); if (!el) return;
    e.preventDefault();
    const r = el.getBoundingClientRect();
    const ghost = el.cloneNode(true) as HTMLElement;
    Object.assign(ghost.style, { position: 'fixed', zIndex: '140', pointerEvents: 'none', margin: '0', width: r.width + 'px', height: r.height + 'px',
      left: r.left + 'px', top: r.top + 'px', opacity: '.92', transform: 'rotate(1.5deg) scale(1.02)', boxShadow: 'var(--shadow-2)' });
    ghost.removeAttribute('id'); ghost.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ghost);
    const dx = e.clientX - r.left, dy = e.clientY - r.top;
    this.from = this.items().indexOf(it);
    this.dragging.set(it);
    // En window y no en el asa: al reordenar, Angular mueve el nodo, se pierde la captura del puntero y el pointerup
    // no llegaría al asa (la copia flotante quedaría pegada a la pantalla).
    const id = e.pointerId;
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      ghost.style.left = ev.clientX - dx + 'px'; ghost.style.top = ev.clientY - dy + 'px';
      const to = this.targetIndex(it, ev.clientX, ev.clientY);
      if (to !== null) this.reorder(it, to);
    };
    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end);
      ghost.remove(); this.dragging.set(null);
      if (this.items().indexOf(it) !== this.from) this.say('soltado', it);
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
  }

  private targetIndex(it: T, x: number, y: number): number | null {
    const list = this.items();
    const others = list.filter(o => o !== it);
    for (const o of others) {
      const r = this.els.get(o)?.getBoundingClientRect(); if (!r) continue;
      if (this.grid()) {
        if (y >= r.top && y <= r.bottom && x >= r.left && x <= r.right) {
          const idx = others.indexOf(o) + (x < r.left + r.width / 2 ? 0 : 1);
          return idx;
        }
      } else if (y < r.top + r.height / 2) return others.indexOf(o);
    }
    return this.grid() ? null : others.length;
  }

  private reorder(it: T, toAmongOthers: number) {
    const others = this.items().filter(o => o !== it);
    others.splice(toAmongOthers, 0, it);
    if (others.some((o, i) => o !== this.items()[i])) this.items.set(others);
  }

  // ---- Teclado ----
  key(it: T, e: KeyboardEvent) {
    const a = this.items(); const i = a.indexOf(it);
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (this.grabbed() !== it) { this.grabbed.set(it); this.from = i; this.live.announce(this.t('mol.orden.tomado', { label: this.labelOf()(it) })); }
      else { this.grabbed.set(null); this.say('soltado', it); }
      return;
    }
    if (this.grabbed() !== it) return;
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      this.reorderTo(it, this.from); this.grabbed.set(null);
      this.live.announce(this.t('mol.orden.cancelado', { label: this.labelOf()(it), pos: this.from + 1 }));
      this.refocus(it); return;
    }
    const back = ['ArrowUp', 'ArrowLeft'], fwd = ['ArrowDown', 'ArrowRight'];
    if (back.includes(e.key) && i > 0) { e.preventDefault(); this.move(it, i - 1); this.refocus(it); }
    else if (fwd.includes(e.key) && i < a.length - 1) { e.preventDefault(); this.move(it, i + 1); this.refocus(it); }
  }

  /** Al soltar el foco fuera (Tab) se suelta en el lugar actual. */
  /** Mover el nodo también dispara blur: mientras se reubica el foco, ese blur no suelta. */
  blur(it: T) { if (!this.refocusing && this.grabbed() === it) { this.grabbed.set(null); this.say('soltado', it); } }

  private reorderTo(it: T, to: number) { const a = this.items().filter(o => o !== it); a.splice(to, 0, it); this.items.set(a); }

  private refocusing = false;
  /** Angular mueve el nodo al reordenar y el foco se pierde: se devuelve al asa después del render. */
  refocus(it: T) {
    this.refocusing = true;
    afterNextRender(() => { this.handles.get(it)?.focus({ preventScroll: false }); this.refocusing = false; }, { injector: this.injector });
  }

  private say(verb: 'movido' | 'soltado', it: T) {
    const a = this.items();
    this.live.announce(this.t('mol.orden.' + verb, { label: this.labelOf()(it), pos: a.indexOf(it) + 1, total: a.length }));
  }
}

/** Elemento reordenable: queda punteado mientras se arrastra y con anillo de foco cuando está tomado con teclado. */
@Directive({
  selector: '[zcSortableItem]',
  host: {
    '[class.opacity-40]': 'isDragging()',
    '[class.border-dashed]': 'isDragging()',
    '[class.outline-2]': 'isGrabbed()',
    '[class.outline-focus]': 'isGrabbed()',
    '[class.outline-offset-2]': 'isGrabbed()',
    '[class.outline]': 'isGrabbed()',
  },
})
export class SortableItemDirective<T = unknown> {
  readonly item = input.required<T>({ alias: 'zcSortableItem' });
  private readonly list = inject<SortableDirective<T>>(SortableDirective);
  readonly isDragging = computed(() => this.list.dragging() === this.item());
  readonly isGrabbed = computed(() => this.list.grabbed() === this.item());
  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    // Con track por id el item puede cambiar de referencia: se registra siempre el actual.
    effect(onCleanup => { const it = this.item(); this.list.register(it, el); onCleanup(() => this.list.unregister(it)); });
  }
}

/** Asa de arrastre: botón con aria-pressed mientras está tomado. Ponle aria-label (o usa [label]). */
@Directive({
  selector: '[zcSortableHandle]',
  host: {
    class: 'touch-none cursor-grab active:cursor-grabbing',
    '[attr.aria-pressed]': 'list.grabbed() === item()',
    '[attr.aria-label]': 'label() || null',
    '(pointerdown)': 'list.startDrag(item(), $event, el)',
    '(keydown)': 'list.key(item(), $event)',
    '(blur)': 'list.blur(item())',
  },
})
export class SortableHandleDirective<T = unknown> {
  readonly item = input.required<T>();
  readonly label = input('');
  readonly list = inject<SortableDirective<T>>(SortableDirective);
  readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  constructor() { effect(() => this.list.registerHandle(this.item(), this.el)); }
}

export const SORTABLE = [SortableDirective, SortableItemDirective, SortableHandleDirective] as const;
