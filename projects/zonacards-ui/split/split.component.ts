import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, model, signal } from '@angular/core';
import { injectTranslate } from '@zonacards/ui/core';

const read = (k: string) => { try { const v = Number(localStorage.getItem(k)); return Number.isFinite(v) && v > 0 ? v : null; } catch { return null; } };
const write = (k: string, v: number) => { try { localStorage.setItem(k, String(Math.round(v * 10) / 10)); } catch { /* sin almacenamiento */ } };

/**
 * <zc-split [(size)]="ancho" storageKey="aprobaciones-split"> <div zcSplitStart>lista</div> <div zcSplitEnd>detalle</div> </zc-split>
 * Dos paneles con un separador que se arrastra: lista y detalle, editor y vista previa, filtros y resultados.
 * - size: porcentaje del primer panel (entre min y max). Con storageKey se recuerda por usuario.
 * - Separador accesible (role="separator" con aria-valuenow): flechas ±2 %, Mayús+flechas ±10 %, Inicio/Fin al mínimo y máximo,
 *   Enter vuelve al tamaño inicial; doble clic también.
 * - Bajo stackBelow (px del contenedor, 768 por defecto) los paneles se apilan y no hay separador: en el celular no se redimensiona.
 */
@Component({
  selector: 'zc-split',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-0 min-w-0', '[class.flex-col]': 'stacked() || orientation() === "vertical"' },
  template: `
    <div class="min-h-0 min-w-0 overflow-auto" [style.flex-basis]="stacked() ? null : current() + '%'" [class.flex-none]="!stacked()" [class.flex-1]="stacked()"><ng-content select="[zcSplitStart]" /></div>
    @if (!stacked()) {
      <div role="separator" tabindex="0" [attr.aria-orientation]="orientation() === 'horizontal' ? 'vertical' : 'horizontal'"
        [attr.aria-valuenow]="round(current())" [attr.aria-valuemin]="min()" [attr.aria-valuemax]="max()" [attr.aria-label]="label() || t('mol.split.separador')"
        [class]="handleClass()" (pointerdown)="drag($event)" (keydown)="onKey($event)" (dblclick)="reset()">
        <span class="rounded-full bg-border-strong transition-colors group-hover:bg-primary group-focus-visible:bg-primary"
          [class]="orientation() === 'horizontal' ? 'h-8 w-1' : 'h-1 w-8'" aria-hidden="true"></span>
      </div>
    }
    <div class="min-h-0 min-w-0 flex-1 overflow-auto"><ng-content select="[zcSplitEnd]" /></div>`,
})
export class SplitComponent {
  readonly t = injectTranslate();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  /** Porcentaje inicial del primer panel. */
  readonly initial = input(40);
  readonly size = model<number>(NaN);
  readonly min = input(20);
  readonly max = input(80);
  readonly storageKey = input('');
  /** Ancho del contenedor (px) por debajo del cual los paneles se apilan sin separador. */
  readonly stackBelow = input(768);
  /** Nombre accesible del separador ("Ancho de la lista"). */
  readonly label = input('');

  private readonly width = signal(Infinity);
  readonly stacked = computed(() => this.orientation() === 'horizontal' && this.width() < this.stackBelow());
  readonly handleClass = computed(() => 'group grid shrink-0 touch-none place-items-center outline-none '
    + (this.orientation() === 'horizontal' ? 'w-3 cursor-col-resize' : 'h-3 cursor-row-resize'));

  /** Tamaño en uso: el de [(size)], el guardado o el inicial (también en SSR, antes de medir). */
  readonly current = computed(() => (Number.isFinite(this.size()) ? this.size() : this.clamp(this.initial())));

  constructor() {
    const destroy = inject(DestroyRef);
    // Solo en el navegador: el tamaño recordado y la medida del contenedor (para apilar en pantallas angostas).
    afterNextRender(() => {
      const saved = this.storageKey() ? read('zc-split:' + this.storageKey()) : null;
      if (!Number.isFinite(this.size()) && saved !== null) this.size.set(this.clamp(saved));
      this.width.set(this.host.clientWidth);
      const ro = new ResizeObserver(() => this.width.set(this.host.clientWidth));
      ro.observe(this.host);
      destroy.onDestroy(() => ro.disconnect());
    });
  }
  round(n: number) { return Math.round(n); }
  private clamp(v: number) { return Math.min(this.max(), Math.max(this.min(), v)); }
  private set(v: number) {
    this.size.set(this.clamp(v));
    if (this.storageKey()) write('zc-split:' + this.storageKey(), this.size());
  }
  reset() { this.set(this.initial()); }

  drag(e: PointerEvent) {
    e.preventDefault();
    const handle = e.currentTarget as HTMLElement; handle.setPointerCapture(e.pointerId);
    const rect = this.host.getBoundingClientRect(); const horiz = this.orientation() === 'horizontal';
    const move = (ev: PointerEvent) => this.set(((horiz ? ev.clientX - rect.left : ev.clientY - rect.top) / (horiz ? rect.width : rect.height)) * 100);
    const up = () => { handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); handle.removeEventListener('pointercancel', up); };
    handle.addEventListener('pointermove', move); handle.addEventListener('pointerup', up); handle.addEventListener('pointercancel', up);
  }
  onKey(e: KeyboardEvent): void {
    const step = e.shiftKey ? 10 : 2;
    const back = this.orientation() === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
    const fwd = this.orientation() === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
    if (e.key === back) this.set(this.current() - step);
    else if (e.key === fwd) this.set(this.current() + step);
    else if (e.key === 'Home') this.set(this.min());
    else if (e.key === 'End') this.set(this.max());
    else if (e.key === 'Enter') this.reset();
    else return;
    e.preventDefault();
  }
}
