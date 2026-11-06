import { Directive, ElementRef, inject, input } from '@angular/core';
import { MenuComponent } from './menu.component';

/**
 * [zcContextMenu]="menu" · menú contextual sobre un área (fila, tarjeta, nodo de un árbol, lienzo).
 *   <zc-menu #menu trigger="none" label="Acciones del lote #02829" [items]="acciones" (select)="…" />
 *   <article [zcContextMenu]="menu" tabindex="0">…</article>
 * - Clic derecho abre el menú en el puntero; la tecla Menú o Mayús+F10 lo abre en el área (teclado); en táctil, la presión larga.
 * - Es un atajo: las mismas acciones deben estar también en un menú visible (⋮) o en botones. Nunca la única forma de llegar.
 * - Escape cierra y el foco vuelve al área. No reemplaza el menú del navegador en campos de texto ni en enlaces.
 */
@Directive({
  selector: '[zcContextMenu]',
  host: { '(contextmenu)': 'onContext($event)', '(keydown)': 'onKey($event)', '[attr.aria-haspopup]': '"menu"' },
})
export class ContextMenuDirective {
  readonly zcContextMenu = input.required<MenuComponent>();
  /** false lo desactiva (por ejemplo, sin acciones disponibles). */
  readonly zcContextMenuEnabled = input(true);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  onContext(e: MouseEvent): void {
    if (!this.zcContextMenuEnabled()) return;
    // Texto editable y enlaces conservan el menú del navegador (copiar, pegar, abrir en otra pestaña).
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, [contenteditable="true"], a[href]')) return;
    e.preventDefault();
    this.zcContextMenu().openAt({ x: e.clientX, y: e.clientY }, this.el);
  }

  onKey(e: KeyboardEvent): void {
    if (!this.zcContextMenuEnabled() || !(e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10'))) return;
    e.preventDefault();
    const r = this.el.getBoundingClientRect();
    this.zcContextMenu().openAt({ x: r.left + 16, y: r.top + Math.min(r.height, 40) }, this.el);
  }
}
