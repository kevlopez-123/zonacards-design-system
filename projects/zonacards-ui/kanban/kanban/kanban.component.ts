import { NgTemplateOutlet } from '@angular/common';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, Directive, ElementRef, Injector, TemplateRef, afterNextRender, computed, contentChild, inject, input, model, signal } from '@angular/core';
import { Tone } from '@zonacards/ui/core';
import { BadgeComponent } from '@zonacards/ui/badge';
import { injectTranslate } from '@zonacards/ui/core';
import { MenuComponent, ZcMenuItem } from '@zonacards/ui/menu';
import { SegmentedComponent, ZcSegment } from '@zonacards/ui/segmented';
import { ToastService } from '@zonacards/ui/toast';
import { Viewport } from '@zonacards/ui/core';

export interface ZcKanbanColumn { id: string; label: string; tone: Tone; /** Límite de trabajo en curso (0 o sin valor = sin límite). */ limit?: number }
export type ZcKanbanBoard<T> = Record<string, T[]>;

/** Contenido de cada tarjeta: <ng-template zcKanbanCard let-card>…</ng-template>. */
@Directive({ selector: 'ng-template[zcKanbanCard]' })
export class KanbanCardDirective { readonly tpl = inject(TemplateRef); }

/**
 * <zc-kanban [columns]="cols" [(board)]="pedidos" [cardId]="id" [cardLabel]="label"> <ng-template zcKanbanCard let-p>…</ng-template> </zc-kanban>
 * Kanban (o-kanban de index.html): columnas por estado con conteo y límite de trabajo en curso.
 * - Arrastrar con puntero entre columnas (desde 6 px para no confundir con un clic).
 * - Teclado sobre la tarjeta: Espacio o Enter toma y suelta; con la tarjeta tomada, ←/→ cambian de columna y ↑/↓ de posición; Escape cancela.
 *   Sin tomar, ↑/↓ recorren la columna. Cada paso se anuncia.
 * - Menú "Mover a" en cada tarjeta (alternativa a arrastrar).
 * - Menos de 768 px: una columna a la vez, con pestañas.
 */
@Component({
  selector: 'zc-kanban',
  imports: [NgTemplateOutlet, BadgeComponent, MenuComponent, SegmentedComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3' },
  template: `
    @if (narrow()) {
      <zc-segmented size="sm" [label]="t('mol.kanban.columnas')" [options]="tabs()" [value]="tab()" (valueChange)="tab.set($any($event))" />
    }
    <div class="grid min-w-0 gap-3" [class]="narrow() ? 'grid-cols-[minmax(0,1fr)]' : 'relative grid-cols-[repeat(4,minmax(220px,1fr))] overflow-x-auto pb-1'"
      [attr.tabindex]="narrow() ? null : -1">
      @for (c of columns(); track c.id) {
        @if (!narrow() || tab() === c.id) {
          <section #col [attr.data-col]="c.id" [attr.aria-labelledby]="uid + '-' + c.id"
            [class]="colClass(c.id)">
            <header class="flex flex-wrap items-center gap-2">
              <zc-badge [tone]="c.tone"><span [id]="uid + '-' + c.id">{{ c.label }}</span></zc-badge>
              <span class="text-[13px] text-muted num">{{ board()[c.id]?.length ?? 0 }}@if (c.limit) { / {{ c.limit }} }</span>
              @if (isOver(c)) { <zc-badge class="ml-auto" tone="danger" icon="s:danger-triangle">{{ t('mol.kanban.sobreLimite') }}</zc-badge> }
            </header>
            <ul class="m-0 grid list-none gap-2 p-0" [attr.aria-label]="c.label">
              @for (card of cardsOf(c.id); track cardId()(card)) {
                <li [attr.data-kid]="cardId()(card)" tabindex="0" [attr.aria-roledescription]="t('mol.kanban.movible')"
                  [attr.aria-label]="cardLabel()(card) + '. ' + t('mol.kanban.ayuda')"
                  [class]="cardClass(cardId()(card))"
                  (pointerdown)="down($event, card)" (keydown)="key($event, card)">
                  @if (cardTpl(); as tpl) { <ng-container *ngTemplateOutlet="tpl.tpl; context: { $implicit: card }" /> }
                  <zc-menu class="absolute top-1.5 right-1.5" [label]="t('mol.kanban.mover', { id: cardId()(card) })" [items]="moveItems(c.id)" [dense]="true" (select)="moveTo(card, $event.id)" />
                </li>
              } @empty {
                <li class="rounded-xl border border-dashed border-border-strong p-4 text-center text-[13px] text-subtle">{{ t('mol.kanban.vacia') }}</li>
              }
            </ul>
          </section>
        }
      }
    </div>`,
})
export class KanbanComponent<T> {
  readonly t = injectTranslate();
  private readonly live = inject(LiveAnnouncer);
  private readonly toast = inject(ToastService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly viewport = inject(Viewport);

  readonly columns = input.required<readonly ZcKanbanColumn[]>();
  readonly board = model.required<ZcKanbanBoard<T>>();
  readonly cardId = input.required<(c: T) => string>();
  readonly cardLabel = input.required<(c: T) => string>();
  readonly cardTpl = contentChild(KanbanCardDirective);

  readonly uid = 'zc-kb-' + Math.random().toString(36).slice(2, 7);
  readonly narrow = this.viewport.mobile;
  readonly tab = signal<string | null>(null);
  readonly tabs = computed<ZcSegment<string>[]>(() => this.columns().map(c => ({ value: c.id, label: c.label + ' ' + (this.board()[c.id]?.length ?? 0) })));
  readonly dragging = signal<string | null>(null);
  readonly over = signal<string | null>(null);
  readonly grabbed = signal<{ id: string; from: [string, number] } | null>(null);

  constructor() { queueMicrotask(() => { if (!this.tab()) this.tab.set(this.columns()[0]?.id ?? null); }); }

  colClass(id: string) {
    return 'grid min-h-[260px] content-start gap-2 rounded-md bg-surface-2 p-3 transition-shadow ' + (this.over() === id ? 'shadow-[inset_0_0_0_2px_var(--focus)]' : '');
  }
  cardClass(id: string) {
    return 'relative grid cursor-grab touch-none gap-0.5 rounded-xl border bg-surface p-3 pr-11 text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus '
      + (this.dragging() === id ? 'border-dashed border-border-strong opacity-30 ' : 'border-border ')
      + (this.grabbed()?.id === id ? 'shadow-[0_0_0_2px_var(--focus)]' : '');
  }
  cardsOf(id: string): T[] { return this.board()[id] || []; }
  isOver(c: ZcKanbanColumn) { return !!c.limit && (this.board()[c.id]?.length ?? 0) > c.limit; }
  moveItems(col: string): ZcMenuItem[] { return this.columns().map((c, i) => ({ id: c.id, label: c.label, disabled: c.id === col, group: i === 0 ? this.t('mol.kanban.moverA') : undefined })); }

  private find(id: string): [string, number] {
    for (const c of this.columns()) { const i = (this.board()[c.id] ?? []).findIndex(x => this.cardId()(x) === id); if (i >= 0) return [c.id, i]; }
    return ['', -1];
  }
  /** Mueve a la columna y posición indicadas (sin posición: al final), avisa si supera el límite y lo anuncia. */
  move(card: T, col: string, idx?: number) {
    const id = this.cardId()(card);
    const [c0] = this.find(id); if (!c0) return;
    const b: ZcKanbanBoard<T> = { ...this.board() };
    b[c0] = b[c0].filter(x => this.cardId()(x) !== id);
    const L = [...(b[col] ?? [])];
    L.splice(idx === undefined ? L.length : Math.max(0, Math.min(idx, L.length)), 0, card);
    b[col] = L;
    this.board.set(b);
    const cc = this.columns().find(c => c.id === col)!;
    if (cc.limit && L.length > cc.limit && c0 !== col) this.toast.info(this.t('mol.kanban.supero', { col: cc.label }), { text: this.t('mol.kanban.superoTexto', { n: L.length, max: cc.limit }) });
    this.live.announce(this.t('mol.kanban.movido', { id, col: cc.label, pos: L.indexOf(card) + 1 }));
  }
  moveTo(card: T, col: string) { this.move(card, col); if (this.narrow()) this.tab.set(col); this.focus(this.cardId()(card)); }

  private focus(id: string) { afterNextRender(() => this.host.querySelector<HTMLElement>(`[data-kid="${CSS.escape(id)}"]`)?.focus(), { injector: this.injector }); }

  // ---- Teclado ----
  key(e: KeyboardEvent, card: T) {
    if ((e.target as HTMLElement).closest('zc-menu')) return;
    const id = this.cardId()(card);
    const [col, i] = this.find(id);
    const cols = this.columns(); const ci = cols.findIndex(c => c.id === col);
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!this.grabbed()) { this.grabbed.set({ id, from: [col, i] }); this.live.announce(this.t('mol.kanban.tomado', { id })); }
      else { this.grabbed.set(null); this.live.announce(this.t('mol.kanban.soltado', { id, col: cols[ci].label })); }
      return;
    }
    const g = this.grabbed();
    if (e.key === 'Escape' && g) { e.preventDefault(); e.stopPropagation(); this.move(card, g.from[0], g.from[1]); this.grabbed.set(null); this.live.announce(this.t('mol.kanban.cancelado')); this.focus(id); return; }
    if (!g) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const L = this.board()[col]; const n = L[i + (e.key === 'ArrowDown' ? 1 : -1)];
        if (n) this.focus(this.cardId()(n));
      }
      return;
    }
    let done = true;
    if (e.key === 'ArrowRight' && ci < cols.length - 1) { this.move(card, cols[ci + 1].id, i); if (this.narrow()) this.tab.set(cols[ci + 1].id); }
    else if (e.key === 'ArrowLeft' && ci > 0) { this.move(card, cols[ci - 1].id, i); if (this.narrow()) this.tab.set(cols[ci - 1].id); }
    else if (e.key === 'ArrowUp' && i > 0) this.move(card, col, i - 1);
    else if (e.key === 'ArrowDown' && i < this.board()[col].length - 1) this.move(card, col, i + 1);
    else done = false;
    if (done) { e.preventDefault(); this.focus(id); }
  }

  // ---- Puntero ----
  down(e: PointerEvent, card: T) {
    if (e.button > 0 || (e.target as HTMLElement).closest('button, zc-menu')) return;
    const el = e.currentTarget as HTMLElement;
    const id = this.cardId()(card);
    const r = el.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY, dx = sx - r.left, dy = sy - r.top;
    let ghost: HTMLElement | null = null;
    el.setPointerCapture(e.pointerId);
    const colAt = (x: number, y: number) => [...this.host.querySelectorAll<HTMLElement>('[data-col]')].find(c => { const b = c.getBoundingClientRect(); return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom; });
    const move = (ev: PointerEvent) => {
      if (!ghost) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
        ghost = el.cloneNode(true) as HTMLElement;
        Object.assign(ghost.style, { position: 'fixed', zIndex: '140', pointerEvents: 'none', width: r.width + 'px', margin: '0', opacity: '.92', transform: 'rotate(1.5deg) scale(1.02)', boxShadow: 'var(--shadow-2)' });
        ghost.setAttribute('aria-hidden', 'true');
        document.body.appendChild(ghost);
        this.dragging.set(id);
      }
      ghost.style.left = ev.clientX - dx + 'px'; ghost.style.top = ev.clientY - dy + 'px';
      this.over.set(colAt(ev.clientX, ev.clientY)?.dataset['col'] ?? null);
    };
    const end = (ev: PointerEvent) => {
      el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', end); el.removeEventListener('pointercancel', end);
      if (!ghost) return;
      ghost.remove(); this.dragging.set(null);
      const col = colAt(ev.clientX, ev.clientY); this.over.set(null);
      if (col) {
        const cards = [...col.querySelectorAll<HTMLElement>('[data-kid]')].filter(x => x.dataset['kid'] !== id);
        let idx = cards.length;
        for (let k = 0; k < cards.length; k++) { const b = cards[k].getBoundingClientRect(); if (ev.clientY < b.top + b.height / 2) { idx = k; break; } }
        this.move(card, col.dataset['col']!, idx);
        this.focus(id);
      }
    };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  }
}

export const KANBAN = [KanbanComponent, KanbanCardDirective] as const;
